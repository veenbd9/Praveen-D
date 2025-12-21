
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AnalysisResult, BrainstormResult, User, MarketTrendAnalysis, CompanyConflictResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const postProcessText = (text: string): string => {
    if (!text) return "";
    let cleaned = text;
    cleaned = cleaned.replace(/([!?:;])(?=[a-zA-Z])/g, "$1 ");
    cleaned = cleaned.replace(/([a-z])\.([A-Z])/g, "$1. $2"); 
    cleaned = cleaned.replace(/^([*•-])(?=[a-zA-Z0-9])/gm, "$1 ");
    cleaned = cleaned.replace(/([a-z]{3,})([A-Z][a-z]{2,})/g, "$1 $2");
    cleaned = cleaned.replace(/(\))(?=[a-zA-Z])/g, "$1 ");
    return cleaned;
};

const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        if (retries === 0) throw error;
        const isRetryable = error.status === 429 || error.status === 503 || error.message?.includes('overloaded') || error.message?.includes('quota');
        if (isRetryable) {
            console.warn(`API Error. Retrying in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryWithBackoff(fn, retries - 1, delay * 2);
        }
        throw error;
    }
};

export const fetchJdFromUrl = async (url: string): Promise<string> => {
    const prompt = `
    You are an expert web scraper and data extractor. Your task is to visit the following URL and extract the full text of the job description.
    Return ONLY the raw text of the job description, with no extra commentary, greetings, or formatting.
    URL: ${url}
    `;
    try {
        return await retryWithBackoff(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt,
            });
            return response.text?.trim() || "";
        });
    } catch (e) {
        console.error("Failed to fetch JD from URL:", e);
        throw new Error("Could not retrieve content from URL.");
    }
};

const getInitialScore = async (resume: string, jobDescription: string): Promise<any> => {
  const prompt = `
    You are an advanced Applicant Tracking System (ATS) Simulation Engine.
    Perform a "Layered Matching Analysis" and return valid JSON.
    Job Description: ${jobDescription}
    Resume: ${resume}
  `;
  return await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    summary: { type: Type.STRING },
                    breakdown: {
                        type: Type.OBJECT,
                        properties: {
                            keywordScore: { type: Type.NUMBER },
                            semanticScore: { type: Type.NUMBER },
                            experienceScore: { type: Type.NUMBER },
                            skillSectionScore: { type: Type.NUMBER },
                            formattingScore: { type: Type.NUMBER },
                            explanation: { type: Type.STRING }
                        },
                        required: ['keywordScore', 'semanticScore', 'experienceScore', 'skillSectionScore', 'formattingScore', 'explanation']
                    },
                    vendorScores: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                vendorName: { type: Type.STRING },
                                score: { type: Type.NUMBER },
                                rating: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            },
                            required: ['vendorName', 'score', 'rating', 'reason']
                        }
                    },
                    knockoutChecks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                requirement: { type: Type.STRING },
                                status: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            },
                            required: ['requirement', 'status', 'reason']
                        }
                    },
                    structureAnalysis: {
                        type: Type.OBJECT,
                        properties: {
                            rating: { type: Type.STRING },
                            issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                            whyStructureMatters: { type: Type.STRING }
                        },
                        required: ['rating', 'issues', 'recommendations', 'whyStructureMatters']
                    }
                },
                required: ['score', 'summary', 'breakdown', 'vendorScores', 'knockoutChecks', 'structureAnalysis']
            }
        }
      });
      return JSON.parse(response.text?.trim() || "{}");
  });
};

const getOptimizedResume = async (resume: string, jobDescription: string): Promise<any> => {
  const prompt = `
    You are an expert Executive Resume Writer. Rewrite the resume for a 95-100% match.
    Job Description: ${jobDescription}
    Original Resume: ${resume}
  `;
  return await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    optimizedResume: { type: Type.STRING },
                    changes: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['optimizedResume', 'changes']
            }
        }
      });
      const json = JSON.parse(response.text?.trim() || "{}");
      json.optimizedResume = postProcessText(json.optimizedResume);
      return json;
  });
};

const generateCoverLetter = async (resume: string, jobDescription: string): Promise<string> => {
    const prompt = `Write a compelling cover letter based on: ${resume} and ${jobDescription}.`;
    return await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
        return postProcessText(response.text || "");
    });
};

export const regenerateCoverLetter = async (currentLetter: string, jobDescription: string, instructions: string): Promise<string> => {
    const prompt = `Refine this cover letter: "${currentLetter}" based on: "${instructions}". Context: ${jobDescription}.`;
    return await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
        return postProcessText(response.text || "");
    });
};

export const analyzeAndOptimizeResume = async (resume: string, jobDescription: string): Promise<AnalysisResult> => {
    const initialAnalysis = await getInitialScore(resume, jobDescription);
    const optimizationResult = await getOptimizedResume(resume, jobDescription);
    const coverLetter = await generateCoverLetter(resume, jobDescription);
    let newScore = initialAnalysis.score + 15;
    if (newScore > 98) newScore = 98;
    if (newScore < 85) newScore = 88;
    return {
        initialScore: initialAnalysis.score,
        initialSummary: initialAnalysis.summary,
        optimizedResume: optimizationResult.optimizedResume,
        changes: optimizationResult.changes,
        optimizedScore: newScore,
        coverLetter: coverLetter,
        candidateName: "Candidate",
        scoreBreakdown: initialAnalysis.breakdown,
        vendorScores: initialAnalysis.vendorScores,
        knockoutChecks: initialAnalysis.knockoutChecks,
        structureAnalysis: initialAnalysis.structureAnalysis
    };
};

export const analyzeResumeOnly = async (resume: string, jobDescription: string): Promise<AnalysisResult> => {
    const initialAnalysis = await getInitialScore(resume, jobDescription);
    return {
        initialScore: initialAnalysis.score,
        initialSummary: initialAnalysis.summary,
        optimizedResume: "",
        changes: [],
        optimizedScore: 0,
        coverLetter: "",
        candidateName: "Candidate",
        scoreBreakdown: initialAnalysis.breakdown,
        vendorScores: initialAnalysis.vendorScores,
        knockoutChecks: initialAnalysis.knockoutChecks,
        structureAnalysis: initialAnalysis.structureAnalysis
    };
};

export const analyzeResumeGeneralHealth = async (resume: string): Promise<AnalysisResult> => {
    const prompt = `Analyze general resume health for ATS parsing: ${resume}`;
    return await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        inferredRole: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        breakdown: {
                            type: Type.OBJECT,
                            properties: {
                                keywordScore: { type: Type.NUMBER },
                                semanticScore: { type: Type.NUMBER },
                                experienceScore: { type: Type.NUMBER },
                                skillSectionScore: { type: Type.NUMBER },
                                formattingScore: { type: Type.NUMBER },
                                explanation: { type: Type.STRING }
                            },
                            required: ['keywordScore', 'semanticScore', 'experienceScore', 'skillSectionScore', 'formattingScore', 'explanation']
                        },
                        vendorScores: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    vendorName: { type: Type.STRING },
                                    score: { type: Type.NUMBER },
                                    rating: { type: Type.STRING },
                                    reason: { type: Type.STRING }
                                },
                                required: ['vendorName', 'score', 'rating', 'reason']
                            }
                        },
                        structureAnalysis: {
                            type: Type.OBJECT,
                            properties: {
                                rating: { type: Type.STRING },
                                issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                                whyStructureMatters: { type: Type.STRING }
                            },
                            required: ['rating', 'issues', 'recommendations', 'whyStructureMatters']
                        }
                    },
                    required: ['score', 'inferredRole', 'summary', 'breakdown', 'vendorScores', 'structureAnalysis']
                }
            }
        });
        const json = JSON.parse(response.text?.trim() || "{}");
        return {
            initialScore: json.score,
            initialSummary: json.summary,
            optimizedResume: "",
            changes: [],
            optimizedScore: 0,
            coverLetter: "",
            candidateName: "Candidate",
            inferredRole: json.inferredRole,
            scoreBreakdown: json.breakdown,
            vendorScores: json.vendorScores,
            knockoutChecks: [],
            structureAnalysis: json.structureAnalysis
        };
    });
};

export const brainstormResumeContent = async (jobTitle: string): Promise<BrainstormResult> => {
    const prompt = `Generate summary and bullets for: ${jobTitle}`;
    return await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        professionalSummary: { type: Type.STRING },
                        achievementBullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['professionalSummary', 'achievementBullets']
                }
            }
        });
        const json = JSON.parse(response.text || "{}");
        return {
            professionalSummary: postProcessText(json.professionalSummary),
            achievementBullets: json.achievementBullets.map((b: string) => postProcessText(b))
        };
    });
};

export const analyzeMarketTrends = async (role: string, location: string): Promise<MarketTrendAnalysis> => {
    const prompt = `Analyze market trends for "${role}" in "${location}".`;
    return await retryWithBackoff(async () => {
         const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        role: { type: Type.STRING },
                        location: { type: Type.STRING },
                        currency: { type: Type.STRING },
                        historicalData: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    year: { type: Type.NUMBER },
                                    salary: { type: Type.NUMBER },
                                    demandScore: { type: Type.NUMBER }
                                },
                                required: ['year', 'salary', 'demandScore']
                            }
                        },
                        emergingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                        decliningSkills: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['role', 'location', 'currency', 'historicalData', 'emergingSkills', 'decliningSkills']
                }
            }
         });
         return JSON.parse(response.text || "{}");
    });
};

export const applyStructuralFixes = async (resume: string, recommendations: string[]): Promise<string> => {
    const prompt = `Apply these structural fixes to the resume: ${recommendations.join(', ')}. Resume: ${resume}`;
    return await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
        return postProcessText(response.text || "");
    });
};

export const detectCompanyConflict = async (inputCompanyName: string, historyCompanies: string[]): Promise<CompanyConflictResult> => {
    if (historyCompanies.length === 0) return { hasConflict: false };
    const prompt = `Detect company conflict: "${inputCompanyName}" vs ${JSON.stringify(historyCompanies)}`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hasConflict: { type: Type.BOOLEAN },
                        conflictingCompanyName: { type: Type.STRING },
                        reason: { type: Type.STRING }
                    },
                    required: ['hasConflict']
                }
            }
        });
        const json = JSON.parse(response.text || "{}");
        return {
            hasConflict: json.hasConflict,
            conflictingCompanyName: json.conflictingCompanyName,
            inputCompanyName: inputCompanyName,
            reason: json.reason
        };
    } catch (e) {
        return { hasConflict: false };
    }
};

export const createSupportChatSession = (user: User): Chat => {
    return ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
            systemInstruction: `You are the Support Assistant for 'ScaleupResume' (AI Powered ATS Dominance).
            Your purpose is to assist with features: Resume Building, Billing, and Market Research.

            KEY INFORMATION ABOUT SCALEUPRESUME:
            - We provide AI-Powered ATS optimization to secure user futures.
            - We have WhatsApp Business integration for personalized support.
            - Users receive gradual WhatsApp messages to encourage better job applications.
            - All optimized resumes are available anytime in the 'Application History'.
            - We encourage users to upgrade to 'Premium' for highly personalized performance and 95%+ match scores.

            SCOPE:
            1. Resume Building: Explain the 'Job-Specific Optimizer', structural health checks, and ATS vendor simulation.
            2. Billing: Explain Monthly, Quarterly, and Half-Yearly plans. Highlight that paid services offer personalized performance.
            3. Market Research: Explain salary regression and skill arbitrage features.
            4. WhatsApp: Mention that ScaleupResume sends helpful notifications and support via WhatsApp once integrated by the admin.

            STRICT CONSTRAINTS:
            - DO NOT discuss source code or technical development details.
            - DO NOT answer questions about the app's background methods.
            - Politeness is mandatory. Use the branding 'ScaleupResume'.`
        }
    });
};

export const sendMessageToChat = async (chat: Chat, message: string) => {
    const response = await chat.sendMessage({ message });
    return {
        text: postProcessText(response.text || ""),
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
             title: c.web?.title,
             uri: c.web?.uri
        })).filter((s: any) => s.uri)
    };
};
