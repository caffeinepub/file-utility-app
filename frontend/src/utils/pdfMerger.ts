export async function mergePDFs(files: File[]): Promise<Blob> {
  const { PDFDocument } = await import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js' as string) as {
    PDFDocument: {
      create: () => Promise<{
        copyPages: (src: unknown, indices: number[]) => Promise<unknown[]>;
        addPage: (page: unknown) => void;
        save: () => Promise<Uint8Array>;
      }>;
      load: (bytes: ArrayBuffer) => Promise<{
        getPageIndices: () => number[];
      }>;
    };
  };

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const indices = pdf.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(pdf, indices);
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}
