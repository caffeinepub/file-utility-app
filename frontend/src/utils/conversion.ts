export type FileFormat = 'PDF' | 'JPG' | 'PNG' | 'WEBP' | 'DOCX' | 'SVG';

export interface ConversionResult {
  blob: Blob;
  fileName: string;
  mimeType: string;
}

function getMimeType(format: FileFormat): string {
  const map: Record<FileFormat, string> = {
    PDF: 'application/pdf',
    JPG: 'image/jpeg',
    PNG: 'image/png',
    WEBP: 'image/webp',
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    SVG: 'image/svg+xml',
  };
  return map[format];
}

function getExtension(format: FileFormat): string {
  return format.toLowerCase();
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

async function imageToFormat(file: File, toFormat: FileFormat): Promise<ConversionResult> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;

  if (toFormat === 'PNG' || toFormat === 'WEBP') {
    ctx.drawImage(img, 0, 0);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  }

  const mimeType = getMimeType(toFormat);
  const ext = getExtension(toFormat);
  const baseName = file.name.replace(/\.[^.]+$/, '');

  if (toFormat === 'SVG') {
    const dataUrl = canvas.toDataURL('image/png');
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
  <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    return { blob, fileName: `${baseName}.svg`, mimeType: 'image/svg+xml' };
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve({ blob, fileName: `${baseName}.${ext}`, mimeType });
        else reject(new Error('Conversion failed'));
      },
      mimeType,
      0.92
    );
  });
}

async function svgToFormat(file: File, toFormat: FileFormat): Promise<ConversionResult> {
  const text = await file.text();
  const svgBlob = new Blob([text], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
  URL.revokeObjectURL(url);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || 800;
  canvas.height = img.naturalHeight || 600;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const mimeType = getMimeType(toFormat);
  const ext = getExtension(toFormat);
  const baseName = file.name.replace(/\.[^.]+$/, '');

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve({ blob, fileName: `${baseName}.${ext}`, mimeType });
        else reject(new Error('SVG conversion failed'));
      },
      mimeType,
      0.92
    );
  });
}

interface PdfPage {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (ctx: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
}

interface PdfDoc {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
}

async function pdfPageToImage(
  pdfDoc: PdfDoc,
  pageNum: number,
  toFormat: FileFormat,
  baseName: string
): Promise<ConversionResult> {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  const mimeType = getMimeType(toFormat);
  const ext = getExtension(toFormat);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve({ blob, fileName: `${baseName}_page${pageNum}.${ext}`, mimeType });
        else reject(new Error('PDF page render failed'));
      },
      mimeType,
      0.92
    );
  });
}

export async function convertFile(
  file: File,
  fromFormat: FileFormat,
  toFormat: FileFormat
): Promise<ConversionResult[]> {
  const baseName = file.name.replace(/\.[^.]+$/, '');

  // Image to image
  if (['JPG', 'PNG', 'WEBP'].includes(fromFormat) && ['JPG', 'PNG', 'WEBP', 'SVG'].includes(toFormat)) {
    const result = await imageToFormat(file, toFormat);
    return [result];
  }

  // SVG to image
  if (fromFormat === 'SVG' && ['JPG', 'PNG', 'WEBP'].includes(toFormat)) {
    const result = await svgToFormat(file, toFormat);
    return [result];
  }

  // Image to PDF
  if (['JPG', 'PNG', 'WEBP', 'SVG'].includes(fromFormat) && toFormat === 'PDF') {
    try {
      const { PDFDocument } = await import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js' as string) as {
        PDFDocument: {
          create: () => Promise<{
            addPage: (size: [number, number]) => {
              drawImage: (img: unknown, opts: unknown) => void;
              getSize: () => { width: number; height: number };
            };
            embedJpg: (bytes: ArrayBuffer) => Promise<{ width: number; height: number }>;
            embedPng: (bytes: ArrayBuffer) => Promise<{ width: number; height: number }>;
            save: () => Promise<Uint8Array>;
          }>;
        };
      };
      const pdfDoc = await PDFDocument.create();
      let imgBytes: ArrayBuffer;
      let embeddedImg: { width: number; height: number };

      if (fromFormat === 'SVG') {
        const pngResult = await svgToFormat(file, 'PNG');
        imgBytes = await pngResult.blob.arrayBuffer();
        embeddedImg = await pdfDoc.embedPng(imgBytes);
      } else if (fromFormat === 'PNG') {
        imgBytes = await file.arrayBuffer();
        embeddedImg = await pdfDoc.embedPng(imgBytes);
      } else {
        imgBytes = await file.arrayBuffer();
        embeddedImg = await pdfDoc.embedJpg(imgBytes);
      }

      const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
      const { width, height } = page.getSize();
      page.drawImage(embeddedImg, { x: 0, y: 0, width, height });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      return [{ blob, fileName: `${baseName}.pdf`, mimeType: 'application/pdf' }];
    } catch {
      throw new Error('PDF conversion failed. Please try again.');
    }
  }

  // PDF to image - use pdf.js via CDN
  if (fromFormat === 'PDF' && ['JPG', 'PNG', 'WEBP'].includes(toFormat)) {
    try {
      const pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js' as string) as {
        getDocument: (src: ArrayBuffer) => {
          promise: Promise<PdfDoc>;
        };
      };
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
      const results: ConversionResult[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const result = await pdfPageToImage(pdfDoc, i, toFormat, baseName);
        results.push(result);
      }
      return results;
    } catch {
      throw new Error('PDF to image conversion requires pdf.js. Please try a different format.');
    }
  }

  // DOCX to PDF - basic placeholder
  if (fromFormat === 'DOCX' && toFormat === 'PDF') {
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js' as string) as {
        PDFDocument: {
          create: () => Promise<{
            addPage: () => {
              drawText: (text: string, opts: unknown) => void;
              getSize: () => { width: number; height: number };
            };
            embedFont: (font: unknown) => Promise<unknown>;
            save: () => Promise<Uint8Array>;
          }>;
        };
        StandardFonts: { Helvetica: unknown };
        rgb: (r: number, g: number, b: number) => unknown;
      };
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      page.drawText(
        `Converted from: ${file.name}\n\nNote: Full DOCX conversion requires server-side processing.\nThis is a placeholder PDF.`,
        {
          x: 50,
          y: height - 100,
          size: 12,
          font,
          color: rgb(0, 0, 0),
          maxWidth: width - 100,
          lineHeight: 20,
        }
      );
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      return [{ blob, fileName: `${baseName}.pdf`, mimeType: 'application/pdf' }];
    } catch {
      throw new Error('DOCX conversion failed.');
    }
  }

  throw new Error(`Conversion from ${fromFormat} to ${toFormat} is not supported in the browser.`);
}
