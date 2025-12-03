
import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { FileInput } from './FileInput';
import { ScoreDisplay } from './ScoreDisplay';
import { applyStructuralFixes } from '../services/geminiService';

declare const jspdf: any;

interface HealthCheckViewProps {
  resumeText: string;
  setResumeText: (text: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  result: AnalysisResult | null;
  onContinueToOptimizer: () => void;
  onReset: () => void;
  userEmail: string;
  isAdmin: boolean;
}

export const HealthCheckView: React.FC<HealthCheckViewProps> = ({ 
    resumeText, 
    setResumeText, 
    onAnalyze, 
    isLoading, 
    result,
    onContinueToOptimizer,
    onReset,
    userEmail,
    isAdmin
}) => {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    
    const isPrivileged = isAdmin || userEmail?.toLowerCase().startsWith('test') || userEmail === 'veenbd9@gmail.com';

    const handleFileRead = (content: string, name: string) => {
        setResumeText(content);
    };

    const handleQuickFixDownload = async () => {
        if (!result?.structureAnalysis?.recommendations) return;
        setIsGeneratingPdf(true);
        
        try {
            const fixedContent = await applyStructuralFixes(resumeText, result.structureAnalysis.recommendations);
            
            // Generate PDF using jsPDF
            const doc = new jspdf.jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
            });
            
            const margin = 15;
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const usableWidth = pageWidth - (margin * 2);
            
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(11);
            
            const lines = doc.splitTextToSize(fixedContent, usableWidth);
            let cursorY = margin;
            
            lines.forEach((line: string) => {
                if (cursorY + 6 > pageHeight - margin) {
                    doc.addPage();
                    cursorY = margin;
                }
                doc.text(line, margin, cursorY);
                cursorY += 6;
            });
            
            doc.save(`ATS_Fixed_Resume.pdf`);
            
        } catch (error) {
            console.error("Failed to generate PDF", error);
            alert("Failed to generate fixed PDF. Please try again.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
            {/* Hero Section */}
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400 mb-6">
                    Is Your Resume ATS Ready?
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
                    Get a free, instant analysis of your resume's structural health, keyword density, and parsing capability before you apply.
                </p>
                
                {/* Input Area */}
                {!result && (
                    <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-3xl mx-auto transform hover:scale-[1.01] transition-transform">
                         <div className="mb-6">
                            <textarea
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value)}
                                placeholder="Paste your resume content here..."
                                className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <FileInput onFileRead={handleFileRead} id="health-upload" className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer text-center">
                                Upload Resume (PDF/DOCX)
                            </FileInput>
                            <span className="text-slate-500 font-medium hidden sm:block">OR</span>
                            <button
                                onClick={onAnalyze}
                                disabled={!resumeText || isLoading}
                                className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-teal-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Analyzing Health...
                                    </>
                                ) : 'Check My Score'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Section */}
            {result && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="flex justify-end mb-2">
                        <button 
                            onClick={onReset}
                            className="text-slate-400 hover:text-white flex items-center text-sm font-semibold transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            Start Over
                        </button>
                    </div>

                    <div className="bg-slate-800/80 p-8 rounded-2xl border border-teal-500/30 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <svg className="w-64 h-64 text-teal-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">
                            <div className="text-center flex flex-col items-center">
                                <h3 className="text-xl font-bold text-slate-300 mb-4">ATS Parse Rate</h3>
                                <ScoreDisplay score={result.initialScore} />
                            </div>
                            
                            <div className="md:col-span-2 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Resume Health Report</h2>
                                    <div className="inline-flex items-center space-x-2 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700">
                                        <span className="text-slate-400 text-sm">Detected Role:</span>
                                        <span className="text-teal-300 font-bold">{result.inferredRole || "General Professional"}</span>
                                    </div>
                                </div>
                                <p className="text-slate-300 text-lg leading-relaxed">
                                    "{result.initialSummary}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Structural Analysis */}
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                Structural Issues
                            </h3>
                            <ul className="space-y-3">
                                {result.structureAnalysis?.issues.map((issue, idx) => (
                                    <li key={idx} className="flex items-start text-red-300 text-sm">
                                        <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        {issue}
                                    </li>
                                ))}
                                {(!result.structureAnalysis?.issues || result.structureAnalysis.issues.length === 0) && (
                                    <li className="text-green-400 text-sm italic">No critical structural issues found. Great job!</li>
                                )}
                            </ul>
                        </div>

                         {/* Recommendations */}
                         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Quick Fixes
                            </h3>
                            <ul className="space-y-3 mb-6">
                                {result.structureAnalysis?.recommendations.slice(0, 3).map((rec, idx) => (
                                    <li key={idx} className="flex items-start text-slate-300 text-sm">
                                        <span className="mr-2 text-teal-500">•</span>
                                        {rec}
                                    </li>
                                ))}
                            </ul>

                            {/* ADMIN ONLY FEATURE: Generate PDF with Quick Fixes */}
                            {isPrivileged && (
                                <button 
                                    onClick={handleQuickFixDownload}
                                    disabled={isGeneratingPdf}
                                    className="w-full mt-2 bg-slate-700 hover:bg-slate-600 border border-slate-500 text-slate-200 font-bold py-2 px-4 rounded transition-colors text-sm flex items-center justify-center"
                                >
                                    {isGeneratingPdf ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Generating Fixed PDF...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                            Download Fixed Resume (Admin/Test)
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* CALL TO ACTION */}
                    <div className="mt-12 text-center bg-gradient-to-r from-indigo-900/50 to-teal-900/50 p-8 rounded-2xl border border-indigo-500/30">
                        <h2 className="text-2xl font-bold text-white mb-2">Ready to Apply?</h2>
                        <p className="text-slate-300 mb-6 max-w-xl mx-auto">
                            A healthy resume is just the start. To get a <strong>95%+ Match Score</strong>, you need to tailor your resume for the specific job description.
                        </p>
                        <button
                            onClick={onContinueToOptimizer}
                            className="bg-gradient-to-r from-rose-500 via-fuchsia-500 to-indigo-500 hover:from-rose-600 hover:via-fuchsia-600 hover:to-indigo-600 text-white text-xl font-extrabold py-5 px-12 rounded-full shadow-2xl shadow-fuchsia-500/40 hover:shadow-fuchsia-500/60 transition-all transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center mx-auto border border-white/20 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out -skew-x-12 -translate-x-[150%]"></div>
                            <svg className="w-8 h-8 mr-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Proceed to ATS Resume Optimizer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
