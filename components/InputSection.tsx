import React, { useCallback, useState } from 'react';
import { SavedResume } from '../types';
import { FileInput } from './FileInput';

type JdInputMode = 'text' | 'url';

interface InputSectionProps {
  resumeText: string;
  setResumeText: (text: string) => void;
  jobDescriptionText: string;
  setJobDescriptionText: (text: string) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  jobTitle: string;
  setJobTitle: (title: string) => void;
  onAnalyze: () => void;
  onScan: () => void; // Used for JD-based scan
  onHealthCheck: () => void; // New prop for generic health check
  onFetchJd: (url: string) => void;
  isLoading: boolean;
  isFetchingJd: boolean;
  savedResumes: SavedResume[];
  onSaveResume: (resume: SavedResume) => void;
  onDeleteResume: (resumeId: number) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  resumeText,
  setResumeText,
  jobDescriptionText,
  setJobDescriptionText,
  companyName,
  setCompanyName,
  jobTitle,
  setJobTitle,
  onAnalyze,
  onScan,
  onHealthCheck,
  onFetchJd,
  isLoading,
  isFetchingJd,
  savedResumes,
  onSaveResume,
  onDeleteResume,
}) => {
  
  const [jdInputMode, setJdInputMode] = useState<JdInputMode>('text');
  const [jdUrl, setJdUrl] = useState<string>('');

  const handleClearResume = useCallback(() => setResumeText(''), [setResumeText]);
  const handleClearJD = useCallback(() => {
    setJobDescriptionText('');
    setJdUrl('');
  }, [setJobDescriptionText]);

  const handleResumeUpload = useCallback((content: string, name: string) => {
    setResumeText(content);
    // New uploaded resumes are ACTIVE by default
    onSaveResume({ id: Date.now(), name, content, status: 'ACTIVE' });
  }, [setResumeText, onSaveResume]);
  
  const totalLoading = isLoading || isFetchingJd;

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg flex flex-col space-y-6">
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="resume-text" className="block text-lg font-semibold text-slate-300">
            Your Resume
          </label>
          <div className="flex space-x-2">
            <FileInput onFileRead={handleResumeUpload} id="resume-upload">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span>Upload File</span>
            </FileInput>
            <button onClick={handleClearResume} className="text-slate-400 hover:text-red-400 transition-colors text-sm font-medium">Clear</button>
          </div>
        </div>
        <textarea
          id="resume-text"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume here, or upload a file (PDF, Word, PPT, Excel, Text)."
          className="w-full h-48 bg-slate-900 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-300 placeholder-slate-500"
          disabled={totalLoading}
        ></textarea>
         <p className="text-xs text-slate-500 mt-1">Supported formats: .pdf, .docx, .pptx, .xlsx, .txt. Files are automatically saved.</p>

        <div className="mt-4">
          <h3 className="text-md font-semibold text-slate-400 mb-2">Saved Resumes</h3>
          <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {savedResumes.length > 0 ? (
              savedResumes.map(resume => (
                <div key={resume.id} className="bg-slate-900 p-2 rounded-md flex justify-between items-center text-sm animate-fade-in-fast">
                  <p className="truncate text-slate-300 flex-grow" title={resume.name}>{resume.name}</p>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    <button onClick={() => setResumeText(resume.content)} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Select</button>
                    <button onClick={() => onDeleteResume(resume.id)} className="text-slate-500 hover:text-red-400 transition-colors" aria-label={`Delete ${resume.name}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm italic px-2">No saved resumes. Upload a file to save it here.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="company-name" className="block text-lg font-semibold text-slate-300 mb-2">
            Company Name
            </label>
            <input
            id="company-name"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Google, Microsoft..."
            className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-300 placeholder-slate-500"
            disabled={totalLoading}
            />
        </div>
        <div>
            <label htmlFor="job-title" className="block text-lg font-semibold text-slate-300 mb-2">
            Target Job Title
            </label>
            <input
            id="job-title"
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Product Manager"
            className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-300 placeholder-slate-500"
            disabled={totalLoading}
            />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
            <label htmlFor="jd-text" className="block text-lg font-semibold text-slate-300">
                Job Description
            </label>
            <div className="flex space-x-2">
                <button onClick={handleClearJD} className="text-slate-400 hover:text-red-400 transition-colors text-sm font-medium">Clear</button>
            </div>
        </div>
        
        <div className="flex border-b border-slate-700 mb-2">
            <button onClick={() => setJdInputMode('text')} className={`py-2 px-4 text-sm font-medium transition-colors ${jdInputMode === 'text' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
                Paste Text
            </button>
            <button onClick={() => setJdInputMode('url')} className={`py-2 px-4 text-sm font-medium transition-colors ${jdInputMode === 'url' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
                From URL
            </button>
        </div>

        {jdInputMode === 'url' && (
            <div className="flex space-x-2 mb-2">
                <input
                    type="url"
                    value={jdUrl}
                    onChange={(e) => setJdUrl(e.target.value)}
                    placeholder="https://careers.example.com/job/123"
                    className="flex-grow w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-300 placeholder-slate-500"
                    disabled={totalLoading}
                />
                <button onClick={() => onFetchJd(jdUrl)} disabled={totalLoading || !jdUrl} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
                    {isFetchingJd ? 'Fetching...' : 'Fetch'}
                </button>
            </div>
        )}

        <textarea
          id="jd-text"
          value={jobDescriptionText}
          onChange={(e) => setJobDescriptionText(e.target.value)}
          placeholder={jdInputMode === 'text' ? "Paste the job description here." : "Job description will appear here after fetching from URL."}
          className="w-full h-48 bg-slate-900 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-300 placeholder-slate-500"
          disabled={totalLoading}
        ></textarea>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onAnalyze}
            disabled={totalLoading || !resumeText || !jobDescriptionText || !companyName}
            className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : 'Optimize My Resume'}
          </button>
      </div>
    </div>
  );
};