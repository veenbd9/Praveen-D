import React from 'react';

// Access libraries from window object since they are loaded via CDN
const getPdfJs = () => (window as any).pdfjsLib;
const getMammoth = () => (window as any).mammoth;
const getJSZip = () => (window as any).JSZip;
const getXLSX = () => (window as any).XLSX;

interface FileInputProps {
  onFileRead: (content: string, fileName: string) => void;
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const FileInput: React.FC<FileInputProps> = ({ onFileRead, id, children, className }) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const extension = file.name.split('.').pop()?.toLowerCase();
        let text = '';

        if (extension === 'txt' || extension === 'md') {
          text = await file.text();
        } else if (extension === 'pdf') {
          const pdfjsLib = getPdfJs();
          if (!pdfjsLib) throw new Error("PDF Library not loaded");
          
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          const pageTexts = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            pageTexts.push(textContent.items.map((item: any) => item.str).join(' '));
          }
          text = pageTexts.join('\n');
        } else if (extension === 'docx') {
          const mammoth = getMammoth();
          if (!mammoth) throw new Error("Mammoth Library not loaded");

          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } else if (extension === 'pptx') {
            const JSZip = getJSZip();
            if (!JSZip) throw new Error("JSZip Library not loaded");

            const zip = new JSZip();
            const arrayBuffer = await file.arrayBuffer();
            const content = await zip.loadAsync(arrayBuffer);
            
            const slideFiles = Object.keys(content.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
            
            slideFiles.sort((a: string, b: string) => {
                const getNum = (s: string) => parseInt(s.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
                return getNum(a) - getNum(b);
            });

            const slideTexts = [];
            for (const filename of slideFiles) {
                const xmlText = await content.files[filename].async('text');
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
                const textNodes = xmlDoc.getElementsByTagNameNS('*', 't');
                let slideContent = '';
                for (let i = 0; i < textNodes.length; i++) {
                    slideContent += textNodes[i].textContent + ' ';
                }
                slideTexts.push(slideContent.trim());
            }
            text = slideTexts.join('\n\n');

        } else if (extension === 'xlsx' || extension === 'xls') {
            const XLSX = getXLSX();
            if (!XLSX) throw new Error("SheetJS Library not loaded");

            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            const sheetTexts: string[] = [];
            workbook.SheetNames.forEach((sheetName: string) => {
                const sheet = workbook.Sheets[sheetName];
                const sheetText = XLSX.utils.sheet_to_txt(sheet);
                if (sheetText.trim()) {
                    sheetTexts.push(`--- Sheet: ${sheetName} ---\n${sheetText}`);
                }
            });
            text = sheetTexts.join('\n\n');
        } else {
            alert('Unsupported file type. Please upload .txt, .pdf, .docx, .pptx, .xlsx, or .xls');
            return;
        }
        
        if (!text.trim()) {
             alert("Could not extract text from the file. It might be empty or image-based.");
        } else {
             onFileRead(text, file.name);
        }
      } catch (e) {
          console.error('Failed to read file:', e);
          alert(`There was an error reading the file: ${(e as Error).message}`);
      } finally {
        event.target.value = '';
      }
    }
  };

  return (
    <>
      <label htmlFor={id} className={className || "cursor-pointer flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-md transition-colors duration-200 text-sm"}>
        {children}
      </label>
      <input
        id={id}
        type="file"
        accept=".txt,.md,.pdf,.docx,.pptx,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
};