export interface CompressionOptions {
  mode: 'lossy' | 'lossless';
  targetType: 'percentage' | 'maxKB';
  percentage: number; // 0-100, how much to reduce
  maxKB: number;
}

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  fileName: string;
}

function getOutputMimeType(file: File): string {
  if (file.type === 'image/png') return 'image/png';
  if (file.type === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

function getOutputExtension(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function compressImageToBlob(
  img: HTMLImageElement,
  mimeType: string,
  quality: number,
  scale: number = 1
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      mimeType,
      quality
    );
  });
}

export async function compressImage(
  file: File,
  options: CompressionOptions
): Promise<CompressionResult> {
  const img = await loadImage(file);
  const mimeType = getOutputMimeType(file);
  const ext = getOutputExtension(mimeType);
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const fileName = `${baseName}_compressed.${ext}`;

  if (options.mode === 'lossless' && mimeType === 'image/png') {
    let scale = 1;
    if (options.targetType === 'percentage') {
      scale = Math.sqrt(1 - options.percentage / 100);
      scale = Math.max(0.1, Math.min(1, scale));
    }
    const blob = await compressImageToBlob(img, 'image/png', 1, scale);
    if (options.targetType === 'maxKB') {
      const targetBytes = options.maxKB * 1024;
      if (blob.size <= targetBytes) {
        return { blob, originalSize: file.size, compressedSize: blob.size, fileName };
      }
      let s = Math.sqrt(targetBytes / blob.size);
      s = Math.max(0.05, Math.min(1, s));
      const scaled = await compressImageToBlob(img, 'image/png', 1, s);
      return { blob: scaled, originalSize: file.size, compressedSize: scaled.size, fileName };
    }
    return { blob, originalSize: file.size, compressedSize: blob.size, fileName };
  }

  // Lossy compression
  if (options.targetType === 'percentage') {
    const targetSize = file.size * (1 - options.percentage / 100);
    let lo = 0.05, hi = 0.95, bestBlob: Blob | null = null;
    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      const blob = await compressImageToBlob(img, mimeType, mid);
      if (blob.size <= targetSize) {
        lo = mid;
        bestBlob = blob;
      } else {
        hi = mid;
      }
    }
    if (!bestBlob) {
      bestBlob = await compressImageToBlob(img, mimeType, 0.1);
    }
    return { blob: bestBlob, originalSize: file.size, compressedSize: bestBlob.size, fileName };
  } else {
    const targetBytes = options.maxKB * 1024;
    let lo = 0.05, hi = 0.95, bestBlob: Blob | null = null;
    for (let i = 0; i < 10; i++) {
      const mid = (lo + hi) / 2;
      const blob = await compressImageToBlob(img, mimeType, mid);
      if (blob.size <= targetBytes) {
        lo = mid;
        bestBlob = blob;
      } else {
        hi = mid;
      }
    }
    if (!bestBlob) {
      let scale = Math.sqrt(targetBytes / file.size);
      scale = Math.max(0.05, Math.min(1, scale));
      bestBlob = await compressImageToBlob(img, mimeType, 0.3, scale);
    }
    return { blob: bestBlob, originalSize: file.size, compressedSize: bestBlob.size, fileName };
  }
}

export function estimateCompressedSize(file: File, options: CompressionOptions): number {
  if (options.targetType === 'percentage') {
    return Math.round(file.size * (1 - options.percentage / 100));
  } else {
    return Math.min(file.size, options.maxKB * 1024);
  }
}

export async function compressPDF(
  file: File,
  options: CompressionOptions
): Promise<CompressionResult> {
  try {
    const { PDFDocument } = await import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js' as string) as {
      PDFDocument: {
        load: (bytes: ArrayBuffer) => Promise<{
          save: (opts?: { useObjectStreams?: boolean }) => Promise<Uint8Array>;
        }>;
      };
    };
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pdfBytes = await pdfDoc.save({ useObjectStreams: options.mode === 'lossy' });
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const baseName = file.name.replace(/\.pdf$/i, '');
    return {
      blob,
      originalSize: file.size,
      compressedSize: blob.size,
      fileName: `${baseName}_compressed.pdf`,
    };
  } catch {
    const blob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
    return {
      blob,
      originalSize: file.size,
      compressedSize: blob.size,
      fileName: file.name,
    };
  }
}

export async function compressFile(
  file: File,
  options: CompressionOptions
): Promise<CompressionResult> {
  if (file.type === 'application/pdf') {
    return compressPDF(file, options);
  }
  return compressImage(file, options);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
