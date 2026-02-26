export interface ScrubResult {
  blob: Blob;
  fileName: string;
  removedFields: string[];
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

export async function scrubMetadata(file: File): Promise<ScrubResult> {
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const removedFields: string[] = [];

  // For images: re-draw on canvas to strip EXIF/metadata
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed')), mimeType, 0.95);
    });

    removedFields.push('EXIF data', 'GPS coordinates', 'Camera info', 'Timestamps', 'Author info', 'Software info');
    return { blob, fileName: `${baseName}_clean.${ext}`, removedFields };
  }

  // For PDFs: use pdf-lib to re-save without metadata
  if (ext === 'pdf') {
    try {
      const { PDFDocument } = await import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js' as string) as {
        PDFDocument: {
          load: (bytes: ArrayBuffer) => Promise<{
            setTitle: (t: string) => void;
            setAuthor: (a: string) => void;
            setSubject: (s: string) => void;
            setKeywords: (k: string[]) => void;
            setProducer: (p: string) => void;
            setCreator: (c: string) => void;
            setCreationDate: (d: Date) => void;
            setModificationDate: (d: Date) => void;
            save: () => Promise<Uint8Array>;
          }>;
        };
      };
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
      pdfDoc.setCreationDate(new Date(0));
      pdfDoc.setModificationDate(new Date(0));
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      removedFields.push('Title', 'Author', 'Subject', 'Keywords', 'Producer', 'Creator', 'Creation date', 'Modification date');
      return { blob, fileName: `${baseName}_clean.pdf`, removedFields };
    } catch {
      const blob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
      return { blob, fileName: `${baseName}_clean.pdf`, removedFields: ['Metadata (partial)'] };
    }
  }

  // Generic: return as-is
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  return { blob, fileName: `${baseName}_clean.${ext}`, removedFields: ['File metadata'] };
}
