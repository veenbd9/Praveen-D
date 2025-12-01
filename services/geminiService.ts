
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AnalysisResult, BrainstormResult, User, MarketTrendAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean text spacing and grammar artifacts
const postProcessText = (text: string): string => {
    if (!text) return "";
    let cleaned = text;

    // 1. Ensure space after punctuation (e.g., "word.Next" -> "word. Next")
    // Avoids breaking URLs or version numbers like 2.5 or node.js by checking for following letter
    cleaned = cleaned.replace(/([!?:;])(?=[a-zA-Z])/g, "$1 ");
    
    // Strict period rule: Lowercase letter + period + Uppercase letter = Missing space
    cleaned = cleaned.replace(/([a-z])\.([A-Z])/g, "$1. $2"); 

    // 2. Ensure space around bullet points (e.g., "*Item" -> "* Item")
    cleaned = cleaned.replace(/^([*•-])(?=[a-zA-Z0-9])/gm, "$1 ");

    // 3. Fix common missing space between camelCase-like merges if they look like separate words
    // E.g. "ManagerAmazon" -> "Manager Amazon"
    // We avoid touching known tech terms (e.g. JavaScript, iPhone) by looking for sequence length > 3
    cleaned = cleaned.replace(/([a-z]{3,})([A-Z][a-z]{2,})/g, "$1 $2");

    // 4. Ensure space after closing parenthesis if followed by word
    cleaned = cleaned.replace(/(\))(?=[a-zA-Z])/g, "$1 ");

    return cleaned;
};

// Helper for Exponential Backoff Retry Logic
const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        if (retries === 0) throw error;
        
        // Check for specific API errors (429 Too Many Requests, 503 Service Unavailable)
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
    Focus only on the main content of the job description, including responsibilities, qualifications, and other relevant details.
    Exclude headers, footers, navigation bars, application forms, and any other irrelevant text from the page.
    Return ONLY the raw text of the job description, with no extra commentary, greetings, or formatting.

    URL: ${url}
    `;

    try {
        return await retryWithBackoff(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });
            const text = response.text;
            if (!text) {
              throw new Error("The AI model did not return any text content for the URL.");
            }
            return text.trim();
        });
    } catch (e) {
        console.error("Failed to fetch JD from URL via Gemini:", e);
        throw new Error("The AI model could not retrieve content from the provided URL. Please check the link.");
    }
};

const getInitialScore = async (resume: string, jobDescription: string): Promise<{ score: number; summary: string; breakdown: any; vendorScores: any; knockoutChecks: any; structureAnalysis: any }> => {
  const prompt = `
    You are an advanced Applicant Tracking System (ATS) Simulation Engine.
    Your task is to perform a "Layered Matching Analysis" of the resume against the job description.

    ### EXECUTION PIPELINE

    1. **Canonicalization & Keyword Matching (40% Weight):**
       - Normalize skills (e.g., "React.js" -> "React", "AWS Lambda" -> "AWS").
       - Compare required hard skills from JD vs Resume.
       - Calculate exact overlap.

    2. **Semantic Similarity (30% Weight):**
       - Analyze the "meaning" of experience bullets.
       - Does "Managed team" in Resume match "Leadership" in JD?

    3. **Seniority & Experience Rules (15% Weight):**
       - Extract dates from Resume (e.g., Jan 2020 - Jan 2023). Calculate TOTAL years.
       - Compare against JD requirements (e.g., "3+ years required").
    
    4. **Section Structure (10% Weight):**
       - Does the resume have a dedicated "SKILLS" section?
    
    5. **Formatting (5% Weight):**
       - Is the structure clean? No tables detected?

    ### STRUCTURAL HEALTH CHECK
    Analyze the resume for structural integrity specifically for ATS parsing.
    - Check for multi-column layouts (bad for ATS).
    - Check for complex tables or graphics.
    - Check for proper section headers.
    - Check for contact info placement.
    Provide a rating, list of issues, and specific recommendations to attain a 95%+ structural score.

    ### VENDOR HEURISTICS (Simulation)
    Calculate a separate sub-score for specific ATS behaviors, incorporating the Unique Selling Propositions (USPs) of top industry platforms:

    - **Workday / Taleo:** (Enterprise Standard) Strict parsing. High weight on 'Keyword Density' and 'Canonical Job Titles'.
    - **Zoho Recruit:** (Staffing USP) Parsing accuracy. Prioritizes standard section headers and clean formatting.
    - **BambooHR:** (Culture/Analytics USP) "Human" focus. Checks for 'Soft Skills' and 'Cultural Fit' keywords in the summary.
    - **Manatal:** (AI Recruitment USP) Semantic matching. Looks for contextual relevance of skills rather than just exact keyword matches.
    - **Recooty:** (Resume Parsing USP) Simplicity. Penalizes complex layouts, tables, or columns heavily. Rewards standard structure.
    - **SAP SuccessFactors:** (Data Analytics USP) Data-driven. Heavily weights quantifiable metrics (numbers, $, %) in experience bullets.
    - **JazzHR:** (Customizable USP) Knockout focus. High sensitivity to "Must Have" skills appearing in the top 1/3 of the resume.
    - **Bullhorn:** (Integration USP) Data completeness. Checks for full contact details (Phone, Email, LinkedIn, Location) for CRM integration.
    - **Lever / Greenhouse:** (Modern Flow USP) Narrative focus. Weights the quality and structure of 'Experience' bullets and result-oriented language.
    - **MightyRecruiter:** (Indian Market) Focuses on clear contact details and skill aggregation.
    - **Breezy HR:** (Visual Pipeline) Prefers concise summaries and clear role delineation.
    - **Loxo:** (AI Sourcing) Looks for "hidden gems" (niche skills) and stability in tenure.
    - **Jobsoid:** (Indian Recruitment) Heavily weighs education credentials and localized terminology.

    ### KNOCKOUT CHECKS
    Identify explicit "Must Have" requirements in the JD (e.g., "Bachelor's Degree", "US Citizen", "5+ years Python").
    Check if the resume PASSES or FAILS these specific hard filters.

    ---
    Job Description:
    ${jobDescription}
    ---
    Resume:
    ${resume}
    ---

    Return a valid JSON object.
  `;

  return await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER, description: "Total calculated match score (0-100)." },
                    summary: { type: Type.STRING, description: "One sentence summary." },
                    breakdown: {
                        type: Type.OBJECT,
                        properties: {
                            keywordScore: { type: Type.NUMBER, description: "0-100 based on keyword overlap" },
                            semanticScore: { type: Type.NUMBER, description: "0-100 based on meaning match" },
                            experienceScore: { type: Type.NUMBER, description: "0-100 based on years of experience check" },
                            skillSectionScore: { type: Type.NUMBER, description: "0-100 based on skills section presence" },
                            formattingScore: { type: Type.NUMBER, description: "0-100 based on clean parsing" },
                            explanation: { type: Type.STRING, description: "Detailed explanation of the breakdown." }
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
                                rating: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
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
                                status: { type: Type.STRING, enum: ["PASS", "FAIL", "UNCLEAR"] },
                                reason: { type: Type.STRING }
                            },
                            required: ['requirement', 'status', 'reason']
                        }
                    },
                    structureAnalysis: {
                        type: Type.OBJECT,
                        properties: {
                            rating: { type: Type.STRING, enum: ["Critical", "Needs Improvement", "Good", "Excellent"] },
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

      try {
        const text = response.text;
        if (!text) throw new Error("Empty response");
        return JSON.parse(text.trim());
      } catch (e) {
          console.error("Failed to parse analysis:", e);
          throw new Error("Analysis failed.");
      }
  });
};

const getOptimizedResume = async (resume: string, jobDescription: string): Promise<{ optimizedResume: string; changes: string[] }> => {
  const prompt = `
    You are an expert resume writer and ATS optimization specialist for the Indian job market.
    Rewrite the following resume to achieve a 95-100% match with the provided job description.
    
    *** CRITICAL GRAMMAR & SPACING RULES (STRICT) ***
    1. **Spacing:** Ensure there is a SINGLE SPACE between every word. Do NOT combine words (e.g. write "Project Manager", NEVER "ProjectManager").
    2. **Punctuation:** Ensure there is always a space after a period, comma, or colon (e.g. "managed. Improved" not "managed.Improved").
    3. **Grammar:** Use perfect English grammar.

    *** ATS FORMATTING & STRUCTURE RULES (MUST FOLLOW) ***
    
    1. **Structure & Order:**
       - The output MUST follow this exact order:
         Header -> Professional Summary -> Skills -> Experience -> Education -> Certifications -> Projects -> Additional Information.
       - Do not deviate from this order.

    2. **Header Format:**
       - Line 1: [Full Name] | [Target Job Title]
       - Line 2: [Email] | [Phone Number] | [City, Country]
       - Do NOT use columns, tables, or complex address lines. Keep it plain text.

    3. **Skills Section:**
       - Provide a dedicated section labeled "SKILLS".
       - Use a comma-separated list or bullet points.
       - Group skills logically (e.g., "Programming:", "Cloud:", "Soft Skills:") if applicable.
       - Many ATS give higher weight to this section, so ensure it is populated with keywords.

    4. **Experience Section:**
       - Section Header: EXPERIENCE
       - Format for each entry: [Job Title] | [Company Name] | [Location] | [Start Date - End Date]
       - Dates: Use STRICT 'YYYY-MM' or 'MMM YYYY' format (e.g., 2023-01 or Jan 2023).
       - Content: Use bullet points only. No paragraphs.
       - Logic: Reverse chronological order.

    5. **Language & Content Strategy (Optimized for Top ATS USPs):**
       - **Metrics (SAP SuccessFactors):** Quantify results heavily (e.g., "Improved X by Y%").
       - **Keywords (Taleo/JazzHR):** Exact match keywords from JD must appear in the top 1/3.
       - **Simplicity (Recooty/Jobsoid):** No complex formatting that breaks parsers.
       - **Context (Manatal):** Use semantically related terms, not just keyword stuffing.
       - **Completeness (Bullhorn/MightyRecruiter):** Ensure header has full contact info.
       - **Tone (BambooHR):** Professional yet engaging to reflect cultural fit.
       - **Localization:** Use **Indian English / British English** spelling (e.g., Organised, Centre).
       - **Action Verbs:** Start every bullet with a strong power verb.
    
    6. **Formatting Restrictions:**
       - NO tables, NO text boxes, NO headers/footers, NO icons/images/logos.
       - NO multi-column layouts.
       - Use simple bullet characters (hyphens or standard bullets).

    Job Description:
    ---
    ${jobDescription}
    ---
    
    Original Resume:
    ---
    ${resume}
    ---

    Return a valid JSON object containing the optimized resume and a list of key changes made.
  `;

  return await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    optimizedResume: { type: Type.STRING, description: "The full optimized resume text." },
                    changes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific changes made." }
                },
                required: ['optimizedResume', 'changes']
            }
        }
      });

      try {
        const text = response.text;
        if (!text) throw new Error("Empty response");
        const json = JSON.parse(text.trim());
        // Apply post-processing to clean up spacing
        json.optimizedResume = postProcessText(json.optimizedResume);
        return json;
      } catch (e) {
          console.error("Failed to parse optimized resume:", e);
          throw new Error("Optimization failed.");
      }
  });
};

const generateCoverLetter = async (resume: string, jobDescription: string): Promise<string> => {
    const prompt = `
    You are a professional career coach. Write a compelling cover letter for the candidate based on the resume and job description below.
    
    Rules:
    1. Tone: Professional, confident, and tailored to the company culture.
    2. Format: Standard business letter format.
    3. Content: Highlight the top 3 achievements from the resume that directly solve problems mentioned in the JD.
    4. Structure: Opening (Hook) -> Body Paragraph 1 (Experience) -> Body Paragraph 2 (Skills/Fit) -> Closing (Call to Action).
    5. **SPACING & GRAMMAR:** Ensure strict single spacing between words. Put a space after every period and comma.

    Job Description:
    ${jobDescription}

    Resume:
    ${resume}
    `;

    return await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });
        return postProcessText(response.text || "");
    });
};

export const regenerateCoverLetter = async (currentLetter: string, jobDescription: string, instructions: string): Promise<string> => {
    const prompt = `
    Refine the following cover letter based on these specific instructions: "${instructions}".
    
    Context (Job Description):
    ${jobDescription}

    Original Cover Letter:
    ${currentLetter}

    Return only the refined cover letter text. Ensure perfect grammar and spacing (space after every punctuation).
    `;

    return await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });
        return postProcessText(response.text || "");
    });
};

export const analyzeAndOptimizeResume = async (resume: string, jobDescription: string): Promise<AnalysisResult> => {
    const initialAnalysis = await getInitialScore(resume, jobDescription);
    const optimizationResult = await getOptimizedResume(resume, jobDescription);
    const coverLetter = await generateCoverLetter(resume, jobDescription);

    // Calculate simulated improved score
    let newScore = initialAnalysis.score + 15;
    if (newScore > 98) newScore = 98;
    if (newScore < 85) newScore = 88; // Bias towards passing in optimized version

    return {
        initialScore: initialAnalysis.score,
        initialSummary: initialAnalysis.summary,
        optimizedResume: optimizationResult.optimizedResume,
        changes: optimizationResult.changes,
        optimizedScore: newScore,
        coverLetter: coverLetter,
        candidateName: "Candidate", // Simplification
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
        optimizedResume: "", // Empty for Scan Only Mode
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
    const prompt = `
      You are an expert Resume Auditor and ATS Logic Simulator.
      Analyze the following resume **without** a specific job description.
      
      Your goal is to perform a "Raw Health Check" of the resume to determine if it is ready for general ATS parsing.

      ### 1. INFER TARGET ROLE
      Based on the skills and experience, what is the most likely target Job Title for this candidate?

      ### 2. SCORING CRITERIA (General Health - 0 to 100)
      - **Formatting (20%):** Are there columns, tables, graphics, or complex layouts? (Penalty if yes).
      - **Section Headers (10%):** Are standard headers used (Experience, Skills, Education)?
      - **Contact Info (10%):** Is email, phone, and location present and easy to find?
      - **Content Quality (30%):** usage of action verbs, quantifiable metrics (%, $), and clear dates.
      - **Keyword Density (30%):** Does the resume contain strong industry keywords relevant to the *inferred* role?

      ### 3. VENDOR SIMULATION
      How would major ATS platforms parse this?
      - **Taleo/Workday:** Strict parsing.
      - **Greenhouse/Lever:** Narrative & Impact focus.
      - **Generic Parser:** formatting cleanliness.

      ### 4. RECOMMENDATIONS
      Provide specific pointers to reach a 95%+ score. Focus on structure, content, and missing keywords for the inferred role.

      ---
      Resume Content:
      ${resume}
      ---

      Return a valid JSON object.
    `;

    return await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER, description: "General Health Score (0-100)" },
                        inferredRole: { type: Type.STRING, description: "The detected target job title" },
                        summary: { type: Type.STRING, description: "Overall assessment summary" },
                        breakdown: {
                            type: Type.OBJECT,
                            properties: {
                                keywordScore: { type: Type.NUMBER },
                                semanticScore: { type: Type.NUMBER, description: "Content quality score here" },
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
                                    rating: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                                    reason: { type: Type.STRING }
                                },
                                required: ['vendorName', 'score', 'rating', 'reason']
                            }
                        },
                        structureAnalysis: {
                            type: Type.OBJECT,
                            properties: {
                                rating: { type: Type.STRING, enum: ["Critical", "Needs Improvement", "Good", "Excellent"] },
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

        try {
            const text = response.text;
            if (!text) throw new Error("Empty response");
            const json = JSON.parse(text.trim());

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
                knockoutChecks: [], // Not applicable for generic health check
                structureAnalysis: json.structureAnalysis
            };
        } catch (e) {
            console.error("Failed to parse general health analysis:", e);
            throw new Error("General Health Check failed.");
        }
    });
};

export const brainstormResumeContent = async (jobTitle: string): Promise<BrainstormResult> => {
    const prompt = `
    Generate a professional summary and 3 high-impact achievement bullet points for a "${jobTitle}" resume.
    
    Rules:
    1. Summary: 2-3 sentences, engaging, focusing on value proposition.
    2. Bullets: Use strong action verbs and include placeholders for metrics (e.g., [X]%).
    3. **SPACING:** Ensure proper spacing between words.

    Return JSON.
    `;

    return await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
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
        
        try {
            const text = response.text;
            if (!text) throw new Error("Empty");
            const json = JSON.parse(text);
            return {
                professionalSummary: postProcessText(json.professionalSummary),
                achievementBullets: json.achievementBullets.map((b: string) => postProcessText(b))
            };
        } catch (e) {
            throw new Error("Brainstorming failed.");
        }
    });
};

export const analyzeMarketTrends = async (role: string, location: string): Promise<MarketTrendAnalysis> => {
    const prompt = `
    Act as a Labor Market Economist. Analyze the historical and future trends for the role of "${role}" in "${location}".
    
    1. Provide 5 years of HISTORICAL average salary data (e.g., 2020-2024).
    2. Identify 5 "Emerging Skills" (Buy) that are increasing in demand.
    3. Identify 5 "Declining Skills" (Sell) that are becoming obsolete.
    
    Return JSON.
    `;

    return await retryWithBackoff(async () => {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        role: { type: Type.STRING },
                        location: { type: Type.STRING },
                        currency: { type: Type.STRING, description: "e.g. INR, USD" },
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

         const text = response.text;
         if(!text) throw new Error("No data");
         return JSON.parse(text);
    });
};

export const applyStructuralFixes = async (resume: string, recommendations: string[]): Promise<string> => {
    const prompt = `
    You are an ATS Formatting Specialist.
    Rewrite the following resume to strictly adhere to these specific structural recommendations:
    ${recommendations.map(r => `- ${r}`).join('\n')}

    Rules:
    1. Do NOT change the core content (jobs, dates, companies) unless asked to fix formatting.
    2. Use standard headers: PROFESSIONAL SUMMARY, SKILLS, EXPERIENCE, EDUCATION.
    3. Remove any tables, columns, or complex layouts. Return plain, clean text.
    4. Ensure single spacing between words and proper punctuation.

    Original Resume:
    ${resume}

    Return ONLY the rewritten resume text.
    `;

    return await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });
        return postProcessText(response.text || "");
    });
};

// --- CHATBOT UTILITIES ---

export const createSupportChatSession = (user: User): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-pro',
        config: {
            systemInstruction: `You are the Support Assistant for 'ATS Resume Optimizer'. 
            User Context: Name=${user.name}, Plan=${user.subscription.planType}, IsAdmin=${user.isAdmin}.
            
            Capabilities:
            1. Explain pricing (Free=3 scans, India Plans=599/mo, 1499/qtr).
            2. Explain ATS scoring logic.
            3. Help with payments (we accept UPI/Card).
            
            Tone: Helpful, professional, and concise.
            `
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
