// PDF attachment generation for the Job Search auto-apply flow. Reuses the
// same jsPDF UMD build already loaded globally via index.html (see
// ResultsSection.tsx for the download/manual equivalent of this logic).
declare const jspdf: any;

export interface PdfAttachment {
    base64: string;
    filename: string;
}

const buildPdfBase64 = (content: string, title: string, filenameBase: string, planType?: string): PdfAttachment => {
    const doc = new jspdf.jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setProperties({ title, subject: 'ATS-compatible document', author: 'ScaleupResume', creator: 'ScaleupResume' });

    const margin = 15;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - margin * 2;
    const fontSize = 11;
    const lineHeight = (fontSize * 0.352778) * 1.5;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(fontSize);

    const lines = doc.splitTextToSize(content, usableWidth);
    let cursorY = margin;

    const addWatermark = () => {
        if (planType === 'free') {
            doc.setTextColor(200, 200, 200);
            doc.setFontSize(40);
            doc.text('FREE TIER', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
            doc.setFontSize(10);
            doc.text('Upgrade for Full Access - ScaleupResume', pageWidth / 2, pageHeight - 10, { align: 'center' });
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

    const dataUri: string = doc.output('datauristring');
    const base64 = dataUri.split(',')[1] ?? '';
    return { base64, filename: `${filenameBase}.pdf` };
};

const safeName = (value: string, fallback: string) => value.replace(/[^a-zA-Z0-9]/g, '_') || fallback;

export const buildResumeAttachment = (content: string, candidateName: string, companyName: string, planType?: string): PdfAttachment => {
    const candidate = safeName(candidateName, 'Candidate');
    const company = safeName(companyName, 'Company');
    return buildPdfBase64(content, `${candidateName} Resume`, `${candidate}_${company}_Resume`, planType);
};

export const buildCoverLetterAttachment = (content: string, candidateName: string, companyName: string, planType?: string): PdfAttachment => {
    const candidate = safeName(candidateName, 'Candidate');
    const company = safeName(companyName, 'Company');
    return buildPdfBase64(content, `${candidateName} Cover Letter`, `${candidate}_${company}_CoverLetter`, planType);
};
