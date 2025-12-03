import React from 'react';
import FileSaver from 'file-saver';

export const PatentSpecGenerator: React.FC = () => {
    
    const generatePatentDoc = async () => {
        // We use the global docx object loaded via CDN in index.html
        const docx = (window as any).docx;
        if (!docx) {
            alert("Document generator library not loaded. Please refresh the page.");
            return;
        }

        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

        const createHeading = (text: string, level: any) => {
            return new Paragraph({
                text: text,
                heading: level,
                spacing: { before: 400, after: 200 },
            });
        };

        const createPara = (text: string, bold = false) => {
            return new Paragraph({
                children: [new TextRun({ text, bold, font: "Calibri", size: 24 })], // 12pt
                spacing: { after: 200 },
                // Changed from JUSTIFIED to LEFT to prevent word clumping
                alignment: AlignmentType.LEFT 
            });
        };

        const createBullet = (text: string) => {
            return new Paragraph({
                children: [new TextRun({ text, font: "Calibri", size: 24 })],
                bullet: { level: 0 },
            });
        };

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // TITLE
                    new Paragraph({
                        text: "SYSTEM AND METHOD FOR VENDOR-SPECIFIC RESUME OPTIMIZATION AND PREDICTIVE CAREER MARKET ANALYSIS",
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),

                    // 1. TECHNICAL FRAMEWORK
                    createHeading("1. TECHNICAL FRAMEWORK", HeadingLevel.HEADING_1),
                    createPara("The present invention relates to a cloud-based, client-side rendered computing system designed to process unstructured natural language data (resumes and job descriptions) and transform them into optimized, machine-readable formats."),
                    createPara("The framework comprises three distinct layers:"),
                    createBullet("The Presentation Layer: A responsive interface capable of ingesting multi-format documents (PDF, DOCX, XML)."),
                    createBullet("The Logic Layer: A heuristic engine that applies specific Applicant Tracking System (ATS) rules based on simulated vendor logic (e.g., SAP, Taleo, Workday)."),
                    createBullet("The Predictive Layer: A statistical computation module that executes linear regression algorithms on client devices to forecast labor market trends."),

                    // 2. SYSTEM ARCHITECTURE
                    createHeading("2. SYSTEM ARCHITECTURE", HeadingLevel.HEADING_1),
                    createPara("The system is architected as a modular Single Page Application (SPA) interacting with a Large Language Model (LLM) Interface. Key architectural components include:"),
                    createHeading("A. Input Normalization Module", HeadingLevel.HEADING_2),
                    createPara("A module configured to extract raw text from binary file formats, removing formatting artifacts to create a canonical text string."),
                    createHeading("B. Vector Comparison Engine", HeadingLevel.HEADING_2),
                    createPara("An engine that tokenizes the canonical text and compares it against target vectors (Job Descriptions) to calculate a semantic similarity score."),
                    createHeading("C. Encrypted Ledger Subsystem", HeadingLevel.HEADING_2),
                    createPara("A localized financial tracking system utilizing AES-256 encryption to store transaction logs within the user's volatile memory storage (Local Storage), ensuring data sovereignty."),

                    // 3. THE METHOD
                    createHeading("3. THE METHOD", HeadingLevel.HEADING_1),
                    createPara("The invention provides a method for optimizing employment documents, comprising the steps of:"),
                    createBullet("Step 1: Ingesting a source document and a target job description."),
                    createBullet("Step 2: Performing an initial multi-dimensional analysis based on weighted criteria (40% keyword match, 30% semantic fit, 15% experience verification)."),
                    createBullet("Step 3: Simulating specific vendor parsing logic. The system identifies unique selling propositions (USPs) of specific ATS vendors (e.g., detecting 'Manatal' favors semantic context, while 'SAP' favors numerical metrics)."),
                    createBullet("Step 4: Regenerating the document content to align with the identified vendor heuristics without fabricating factual history."),
                    createBullet("Step 5: Calculating a 'Green Light' application pathway, determining if the application should be routed via email protocol (mailto:) or HTTP redirect based on source metadata."),

                    // 4. THE PROCESS
                    createHeading("4. THE PROCESS FLOW", HeadingLevel.HEADING_1),
                    createPara("1. User Initialization: The user Authenticates via a secure session."),
                    createPara("2. Data Acquisition: The system fetches external market data or parses user-uploaded files."),
                    createPara("3. Heuristic Evaluation: The text is scored against a matrix of pre-defined ATS rules."),
                    createPara("4. Statistical Projection: The system executes a linear regression function on historical salary data points."),
                    createPara("5. Transformation: The content is rewritten using Indian/British English localization rules."),
                    createPara("6. Output Generation: The system renders the optimized text into a downloadable PDF/DOCX format."),

                    // 5. THE ALGORITHM
                    createHeading("5. THE ALGORITHMS", HeadingLevel.HEADING_1),
                    
                    createHeading("A. The Optimization Weighting Algorithm", HeadingLevel.HEADING_2),
                    createPara("The system calculates a 'Match Score' (S) using the following weighted formula:"),
                    createPara("S = (Kw * 0.40) + (Sem * 0.30) + (Exp * 0.15) + (Fmt * 0.15)"),
                    createPara("Where Kw is Keyword Overlap, Sem is Semantic Vector Similarity, Exp is Experience Duration Match, and Fmt is Formatting Compliance."),

                    // 6. THE FORMULA
                    createHeading("B. The Predictive Regression Formula", HeadingLevel.HEADING_2),
                    createPara("The system predicts future salary trends (y) based on historical time data (x) using the Least Squares method to determine the slope (m) and intercept (b):"),
                    createPara("m = (n(Σxy) - (Σx)(Σy)) / (n(Σx²) - (Σx)²)"),
                    createPara("b = (Σy - m(Σx)) / n"),
                    createPara("y = mx + b"),
                    createPara("Where 'n' is the count of historical data points fetched from the knowledge base."),

                    // 7. THE WORKFLOW
                    createHeading("6. THE WORKFLOW", HeadingLevel.HEADING_1),
                    createPara("The operational workflow involves a synchronous loop:"),
                    createBullet("Input -> Analysis -> Vendor Simulation -> Optimization -> Verification -> Output."),
                    createPara("Critically, the 'Vendor Simulation' step injects synthetic constraints (e.g., 'Must have 500 words or less' for specific parsers) dynamically."),

                    // 8. THE MACHINE
                    createHeading("7. THE MACHINE (APPARATUS)", HeadingLevel.HEADING_1),
                    createPara("The invention is implemented on a computing device comprising:"),
                    createBullet("A processor configured to execute the parsing and regression instructions."),
                    createBullet("A memory unit storing the simulated database of ATS vendor USPs (Unique Selling Propositions)."),
                    createBullet("A display interface for rendering the visual analysis of market trends and resume scores."),
                    createBullet("A network interface for communicating with the Large Language Model API for semantic processing.")
                ],
            }],
        });

        Packer.toBlob(doc).then((blob: Blob) => {
            // Handle different export structures of file-saver
            if (FileSaver && FileSaver.saveAs) {
                FileSaver.saveAs(blob, "Resume_Rocket_Patent_Specification.docx");
            } else if (typeof FileSaver === 'function') {
                (FileSaver as any)(blob, "Resume_Rocket_Patent_Specification.docx");
            } else {
                // Fallback using direct anchor method if module load fails
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = "Resume_Rocket_Patent_Specification.docx";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        });
    };

    return (
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg max-w-2xl mx-auto mt-8 animate-fade-in">
            <div className="flex items-center mb-4">
                <div className="bg-indigo-900/50 p-3 rounded-full mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-200">Intellectual Property Generator</h2>
                    <p className="text-slate-400 text-sm">Generate technical documentation for patent filing.</p>
                </div>
            </div>
            
            <p className="text-slate-300 mb-6 leading-relaxed">
                Click below to generate a detailed <strong>Technical Patent Specification (.docx)</strong> covering the Framework, System Architecture, Algorithms (including Regression & Scoring), and Methodologies used in this application. 
                <br/><br/>
                <span className="text-xs text-slate-500 italic">
                    Note: This document is formatted for use by patent attorneys and includes technical definitions of the Vendor Simulation, Green Light Application Logic, and Encrypted Ledger System.
                </span>
            </p>

            <button 
                onClick={generatePatentDoc}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center transition-all transform hover:scale-[1.02]"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Patent Specification (.docx)
            </button>
        </div>
    );
};