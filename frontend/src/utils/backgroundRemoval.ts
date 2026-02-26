export interface BackgroundRemovalResult {
  blob: Blob;
  dataUrl: string;
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

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function floodFill(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  tolerance: number
): Set<number> {
  const visited = new Set<number>();
  const queue: [number, number][] = [[startX, startY]];
  const idx = (startY * width + startX) * 4;
  const targetR = data[idx];
  const targetG = data[idx + 1];
  const targetB = data[idx + 2];

  while (queue.length > 0) {
    const [x, y] = queue.pop()!;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    const i = (y * width + x) * 4;
    if (visited.has(i)) continue;
    const dist = colorDistance(data[i], data[i + 1], data[i + 2], targetR, targetG, targetB);
    if (dist > tolerance) continue;
    visited.add(i);
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return visited;
}

export async function removeBackground(
  file: File,
  tolerance: number = 40
): Promise<BackgroundRemovalResult> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Sample background color from corners
  const corners: [number, number][] = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  const bgPixels = new Set<number>();
  for (const [cx, cy] of corners) {
    const filled = floodFill(data, width, height, cx, cy, tolerance);
    filled.forEach((i) => bgPixels.add(i));
  }

  // Make background pixels transparent
  bgPixels.forEach((i) => {
    data[i + 3] = 0;
  });

  // Edge smoothing: semi-transparent pixels near edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] === 0) continue;
      // Check neighbors
      let hasTransparentNeighbor = false;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const ni = (ny * width + nx) * 4;
        if (data[ni + 3] === 0) { hasTransparentNeighbor = true; break; }
      }
      if (hasTransparentNeighbor) {
        data[i + 3] = 128;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed')), 'image/png');
  });

  return { blob, dataUrl };
}
