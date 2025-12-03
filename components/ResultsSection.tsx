import React, { useState, useCallback, useEffect } from 'react';
import { AnalysisResult } from '../types';
import { ScoreDisplay } from './ScoreDisplay';
import { regenerateCoverLetter } from '../services/geminiService';

declare const jspdf: any;

interface ResultsSectionProps {
  result: AnalysisResult;
  candidateName: string;
  companyName: string;
  planType?: string;
  jobDescription: string;
  showDeepDive?: boolean;
  onSaveToProfile: (content: string, name: string) => void;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({ result, candidateName, companyName, planType, jobDescription, showDeepDive = false, onSaveToProfile }) => {
  const [resumeCopySuccess, setResumeCopySuccess] = useState(false);
  const [coverLetterCopySuccess, setCoverLetterCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'deepDive'>('overview');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Cover Letter Refinement State
  const [currentCoverLetter, setCurrentCoverLetter] = useState(result.coverLetter);
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Determine if this is a "Scan Only" result (no optimized resume)
  const isScanOnly = !result.optimizedResume;
  // Determine if this is a "General Health Check" (no JD/Organization provided or specific flag)
  const isHealthCheck = !!result.inferredRole;

  // Reset state when result changes
  useEffect(() => {
      setCurrentCoverLetter(result.coverLetter);
      setRefinementInput('');
      setSaveSuccess(false);
      // Reset to overview if deep dive is disabled but selected
      if (!showDeepDive && activeTab === 'deepDive') {
          setActiveTab('overview');
      }
  }, [result, showDeepDive, activeTab]);

  const handleCopy = useCallback((textToCopy: string, type: 'resume' | 'coverLetter') => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      if (type === 'resume') {
        setResumeCopySuccess(true);
        setTimeout(() => setResumeCopySuccess(false), 2000);
      } else {
        setCoverLetterCopySuccess(true);
        setTimeout(() => setCoverLetterCopySuccess(false), 2000);
      }
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  }, []);

  const handleSaveToProfile = () => {
      onSaveToProfile(result.optimizedResume, `Optimized for ${companyName}`);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSavePdf = useCallback((content: string, type: 'Resume' | 'CoverLetter') => {
    const doc = new jspdf.jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });
    
    const safeCandidateName = candidateName.replace(/[^a-zA-Z0-9]/g, '_') || 'Candidate';
    const safeCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_') || 'Company';
    const filename = `${safeCandidateName}_${safeCompanyName}_${type}.pdf`;
    
    const margin = 15;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - (margin * 2);
    const fontSize = 11;
    // Increased Line Height to 1.5 to prevent word/line merging
    const lineHeight = (fontSize * 0.352778) * 1.5; 
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(fontSize);
    
    const lines = doc.splitTextToSize(content, usableWidth);
    let cursorY = margin;

    const addWatermark = () => {
        if (planType === 'free') {
            doc.setTextColor(200, 200, 200);
            doc.setFontSize(40);
            doc.text("FREE TIER", pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
            doc.setFontSize(10);
            doc.text("Upgrade for Full Access - Resume Rocket", pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(fontSize);
        }
    };

    addWatermark();

    lines.forEach((line: string) => {
        if (cursorY + lineHeight > pageHeight - margin) {
            doc.addPage();
            addWatermark();
            cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
    });
    
    doc.save(filename);
  }, [candidateName, companyName, planType]);

  const handleSaveDocx = useCallback((content: string, type: 'Resume' | 'CoverLetter') => {
    const docx = (window as any).docx;
    if (!docx) {
         alert("Document generation library not loaded.");
         return;
    }
    
    const { Document, Packer, Paragraph, TextRun, AlignmentType } = docx;
    const docChildren = [];
    
    if (planType === 'free') {
         docChildren.push(new Paragraph({
             children: [new TextRun({ text: "FREE TIER - UPGRADE FOR FULL ACCESS", bold: true, color: "999999", size: 24 })],
             alignment: AlignmentType.CENTER,
             spacing: { after: 400 }
         }));
    }

    const lines = content.split('\n');
    lines.forEach(line => {
         // Explicitly setting Font to Calibri and Size to 11pt (22 half-points)
         // ensuring Word renders the spacing correctly.
         docChildren.push(new Paragraph({
             children: [new TextRun({ 
                 text: line, 
                 font: "Calibri", 
                 size: 22 
             })],
             spacing: { after: 120 }
         }));
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: docChildren
        }]
    });

    const safeCandidateName = candidateName.replace(/[^a-zA-Z0-9]/g, '_') || 'Candidate';
    const safeCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_') || 'Company';
    const filename = `${safeCandidateName}_${safeCompanyName}_${type}.docx`;

    Packer.toBlob(doc).then((blob: Blob) => {
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = filename;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         setTimeout(() => window.URL.revokeObjectURL(url), 100);
    });
  }, [candidateName, companyName, planType]);

  const handleRefineCoverLetter = async (instructions: string = refinementInput) => {
      if (!instructions.trim()) return;
      setIsRefining(true);
      try {
          const refined = await regenerateCoverLetter(currentCoverLetter, jobDescription, instructions);
          setCurrentCoverLetter(refined);
          setRefinementInput('');
      } catch (e) {
          alert("Failed to refine cover letter. Please try again.");
      } finally {
          setIsRefining(false);
      }
  };

  const ActionButton: React.FC<{ onClick: () => void; children: React.ReactNode; }> = ({ onClick, children }) => (
     <button
        onClick={onClick}
        className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
      >
        {children}
      </button>
  );

  const QuickRefineButton: React.FC<{ label: string }> = ({ label }) => (
      <button 
        onClick={() => handleRefineCoverLetter(label)}
        disabled={isRefining}
        className="text-xs bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white py-1 px-3 rounded-full transition-colors border border-slate-600"
      >
        {label}
      </button>
  );

  const StructuralAnalysisCard = () => {
      if (!result.structureAnalysis) return null;
      const { rating, issues, recommendations, whyStructureMatters } = result.structureAnalysis;
      
      const ratingColor = rating === 'Excellent' ? 'text-green-400 border-green-500 bg-green-900/20' : 
                          rating === 'Good' ? 'text-blue-400 border-blue-500 bg-blue-900/20' :
                          rating === 'Needs Improvement' ? 'text-yellow-400 border-yellow-500 bg-yellow-900/20' :
                          'text-red-400 border-red-500 bg-red-900/20';

      return (
          <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-700 pb-4">
                   <div>
                       <h3 className="text-xl font-bold text-slate-200">ATS Structural Health Check</h3>
                       <p className="text-sm text-slate-400 mt-1">Structure is the foundation of ATS parsing. A bad structure means your content won't even be read.</p>
                   </div>
                   <div className={`mt-4 md:mt-0 px-4 py-2 rounded border ${ratingColor} font-bold uppercase text-sm`}>
                       Rating: {rating}
                   </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                       <h4 className="font-semibold text-slate-300 mb-3 flex items-center">
                           <svg className="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                           Critical Issues Detected
                       </h4>
                       <ul className="space-y-2">
                           {issues.map((issue, i) => (
                               <li key={i} className="flex items-start text-sm text-slate-400">
                                   <span className="text-red-500 mr-2">✖</span> {issue}
                               </li>
                           ))}
                           {issues.length === 0 && <li className="text-sm text-green-400 italic">No critical issues found!</li>}
                       </ul>
                   </div>
                   
                   <div>
                       <h4 className="font-semibold text-slate-300 mb-3 flex items-center">
                           <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                           Recommended Fixes (for 95%+ Score)
                       </h4>
                       <ul className="space-y-2">
                           {recommendations.map((rec, i) => (
                               <li key={i} className="flex items-start text-sm text-slate-400">
                                   <span className="text-green-500 mr-2">✔</span> {rec}
                               </li>
                           ))}
                       </ul>
                   </div>
               </div>

               <div className="mt-6 bg-slate-900/50 p-4 rounded border-l-4 border-indigo-500">
                   <h5 className="text-sm font-bold text-indigo-300 mb-1">Why Structure Matters</h5>
                   <p className="text-sm text-slate-400 italic">"{whyStructureMatters}"</p>
               </div>
          </div>
      );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Tabs - Only show if optimization results exist */}
      {!isScanOnly && (
          <div className="flex border-b border-slate-700">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'overview' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
            >
                Overview & Download
            </button>
            {showDeepDive && (
                <button 
                    onClick={() => setActiveTab('deepDive')}
                    className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'deepDive' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
                >
                    Deep Dive Analysis
                </button>
            )}
        </div>
      )}

      {/* SCAN ONLY & HEALTH CHECK MODE VIEW */}
      {isScanOnly && (
           <>
              <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg text-center">
                   <h2 className="text-2xl font-bold text-slate-200 mb-2">
                       {isHealthCheck ? 'Generic Resume Health Audit' : 'Initial Resume Health Check'}
                   </h2>
                   
                   {/* Inferred Role Badge */}
                   {result.inferredRole && (
                       <div className="mb-4 inline-block bg-teal-900/50 border border-teal-500/50 rounded-full px-4 py-1">
                           <span className="text-slate-400 text-sm">Detected Target Role: </span>
                           <span className="text-teal-300 font-bold">{result.inferredRole}</span>
                       </div>
                   )}

                   <div className="flex flex-col items-center justify-center">
                        <ScoreDisplay score={result.initialScore} />
                        <p className="text-slate-400 mt-4 italic max-w-2xl">"{result.initialSummary}"</p>
                   </div>
              </div>

              {/* Always Show Structure Analysis for Scan Only */}
              <StructuralAnalysisCard />
           </>
      )}

      {/* DEEP DIVE TAB CONTENT (Or Generic Vendor Check) */}
      {(activeTab === 'deepDive' || isHealthCheck) && showDeepDive && !isScanOnly && result.scoreBreakdown && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
             <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                 <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                    Score Composition
                 </h3>
                 <div className="space-y-4">
                     <div>
                         <div className="flex justify-between text-sm mb-1">
                             <span className="text-slate-300">Keyword Match (40%)</span>
                             <span className="text-white font-bold">{result.scoreBreakdown.keywordScore}%</span>
                         </div>
                         <div className="w-full bg-slate-700 rounded-full h-2">
                             <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${result.scoreBreakdown.keywordScore}%` }}></div>
                         </div>
                     </div>
                     <div>
                         <div className="flex justify-between text-sm mb-1">
                             <span className="text-slate-300">Semantic Fit (30%)</span>
                             <span className="text-white font-bold">{result.scoreBreakdown.semanticScore}%</span>
                         </div>
                         <div className="w-full bg-slate-700 rounded-full h-2">
                             <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${result.scoreBreakdown.semanticScore}%` }}></div>
                         </div>
                     </div>
                     <div>
                         <div className="flex justify-between text-sm mb-1">
                             <span className="text-slate-300">Experience Rules (15%)</span>
                             <span className="text-white font-bold">{result.scoreBreakdown.experienceScore}%</span>
                         </div>
                         <div className="w-full bg-slate-700 rounded-full h-2">
                             <div className="bg-green-500 h-2 rounded-full" style={{ width: `${result.scoreBreakdown.experienceScore}%` }}></div>
                         </div>
                     </div>
                      <div>
                         <div className="flex justify-between text-sm mb-1">
                             <span className="text-slate-300">Formatting & Structure (15%)</span>
                             <span className="text-white font-bold">{Math.round((result.scoreBreakdown.formattingScore + result.scoreBreakdown.skillSectionScore)/2)}%</span>
                         </div>
                         <div className="w-full bg-slate-700 rounded-full h-2">
                             <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(result.scoreBreakdown.formattingScore + result.scoreBreakdown.skillSectionScore)/2}%` }}></div>
                         </div>
                     </div>
                 </div>
                 <p className="mt-4 text-xs text-slate-400 italic">
                     "{result.scoreBreakdown.explanation}"
                 </p>
             </div>

             {/* KNOCKOUT RULES - Hide for Generic Health Check */}
             {!isHealthCheck && (
                <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Knockout Criteria
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {result.knockoutChecks?.map((check, idx) => (
                            <div key={idx} className={`p-3 rounded border flex justify-between items-start ${check.status === 'PASS' ? 'bg-green-900/20 border-green-800' : check.status === 'FAIL' ? 'bg-red-900/20 border-red-800' : 'bg-yellow-900/20 border-yellow-800'}`}>
                                <div>
                                    <p className="text-slate-200 text-sm font-semibold">{check.requirement}</p>
                                    <p className="text-slate-400 text-xs">{check.reason}</p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${check.status === 'PASS' ? 'bg-green-900 text-green-300' : check.status === 'FAIL' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                    {check.status}
                                </span>
                            </div>
                        ))}
                        {(!result.knockoutChecks || result.knockoutChecks.length === 0) && (
                            <p className="text-slate-500 text-sm italic">No specific hard-fail criteria detected in JD.</p>
                        )}
                    </div>
                </div>
             )}

             <div className="md:col-span-2 bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                 <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        {isHealthCheck ? 'General ATS Parsing Simulation' : 'ATS Vendor Simulation'}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {isHealthCheck 
                            ? 'How major ATS platforms (Taleo, Workday, etc.) are likely to parse your resume structure based on industry standards.'
                            : 'Different platforms prioritize different signals. See how you stack up against the giants.'}
                    </p>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     {result.vendorScores?.map((vendor, idx) => (
                         <div key={idx} className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                             <div className="flex justify-between items-center mb-2">
                                 <span className="font-bold text-slate-300">{vendor.vendorName}</span>
                                 <span className={`text-xs font-bold px-2 py-0.5 rounded ${vendor.rating === 'High' ? 'bg-green-900 text-green-300' : vendor.rating === 'Medium' ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'}`}>
                                     {vendor.rating}
                                 </span>
                             </div>
                             <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                                 <div className={`h-1.5 rounded-full ${vendor.score > 80 ? 'bg-green-500' : vendor.score > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${vendor.score}%` }}></div>
                             </div>
                             <p className="text-xs text-slate-500 leading-tight">
                                 {vendor.reason}
                             </p>
                         </div>
                     ))}
                 </div>
             </div>

         </div>
      )}

      {/* OVERVIEW TAB CONTENT (Full Optimization) */}
      {activeTab === 'overview' && !isScanOnly && (
      <>
        <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-slate-200 mb-6 text-center">ATS Score Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col items-center text-center">
                <p className="text-lg font-semibold text-slate-300 mb-3">Initial Score</p>
                <ScoreDisplay score={result.initialScore} />
            </div>
            <div className="flex flex-col items-center text-center">
                <p className="text-lg font-semibold text-slate-300 mb-3">Optimized Score</p>
                <ScoreDisplay score={result.optimizedScore} />
            </div>
            </div>
            <p className="text-slate-400 mt-6 text-center italic">
            "{result.initialSummary}"
            </p>
        </div>

        {/* Highlight Structural Analysis even in Overview for clarity */}
        <StructuralAnalysisCard />

        {result.optimizedScore < 85 && (
            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg flex items-start space-x-3 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
                <h3 className="text-red-400 font-bold text-lg">Recommendation: Do Not Apply</h3>
                <p className="text-red-200 text-sm mt-1">
                    Your optimized score is <strong>{result.optimizedScore}%</strong>, which is below the required <strong>85%</strong> threshold.
                </p>
            </div>
            </div>
        )}

        <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-slate-200">Optimized Resume</h2>
            <div className="flex flex-wrap gap-2">
                <ActionButton onClick={handleSaveToProfile}>
                    {saveSuccess ? (
                        <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Saved!</span>
                        </>
                    ) : (
                        <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span>Save to Profile</span>
                        </>
                    )}
                </ActionButton>
                <ActionButton onClick={() => handleSavePdf(result.optimizedResume, 'Resume')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>PDF</span>
                </ActionButton>
                <ActionButton onClick={() => handleSaveDocx(result.optimizedResume, 'Resume')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span>DOCX</span>
                </ActionButton>
                <ActionButton onClick={() => handleCopy(result.optimizedResume, 'resume')}>
                {resumeCopySuccess ? (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>Copied!</span>
                    </>
                ) : (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    <span>Copy</span>
                    </>
                )}
                </ActionButton>
            </div>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm bg-slate-900 border border-slate-700 rounded-md p-4 h-96 overflow-y-auto text-slate-300">
            {result.optimizedResume}
            </pre>
        </div>
        
        <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-slate-200">Generated Cover Letter</h2>
            <div className="flex flex-wrap gap-2">
                <ActionButton onClick={() => handleSavePdf(currentCoverLetter, 'CoverLetter')}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>PDF</span>
                </ActionButton>
                <ActionButton onClick={() => handleSaveDocx(currentCoverLetter, 'CoverLetter')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span>DOCX</span>
                </ActionButton>
                <ActionButton onClick={() => handleCopy(currentCoverLetter, 'coverLetter')}>
                {coverLetterCopySuccess ? (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>Copied!</span>
                    </>
                ) : (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    <span>Copy</span>
                    </>
                )}
                </ActionButton>
            </div>
            </div>
            
            <pre className="whitespace-pre-wrap font-sans text-sm bg-slate-900 border border-slate-700 rounded-md p-4 h-96 overflow-y-auto text-slate-300 relative">
                {isRefining && (
                    <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10 rounded-md">
                        <div className="text-center">
                            <svg className="animate-spin h-10 w-10 text-indigo-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="text-indigo-300 font-semibold">Refining Cover Letter...</p>
                        </div>
                    </div>
                )}
                {currentCoverLetter}
            </pre>

            <div className="mt-4 border-t border-slate-700 pt-4">
                <div className="flex justify-between items-end mb-2">
                    <h4 className="text-sm font-semibold text-slate-300">Refine with AI</h4>
                    <div className="flex space-x-2">
                        <QuickRefineButton label="Make it Shorter" />
                        <QuickRefineButton label="More Professional" />
                        <QuickRefineButton label="More Enthusiastic" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <input 
                    type="text" 
                    value={refinementInput}
                    onChange={(e) => setRefinementInput(e.target.value)}
                    placeholder="e.g. Focus more on my leadership skills, or make it more formal..."
                    className="flex-grow bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    disabled={isRefining}
                    />
                    <button 
                    onClick={() => handleRefineCoverLetter()}
                    disabled={isRefining || !refinementInput}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                    Refine
                    </button>
                </div>
            </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-slate-200 mb-4">Key Changes</h2>
            <ul className="space-y-3">
            {result.changes.map((change, index) => (
                <li key={index} className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-slate-300">{change}</span>
                </li>
            ))}
            </ul>
        </div>
      </>
      )}
    </div>
  );
};