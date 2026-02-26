import React, { useState, useCallback } from 'react';
import { DropZone } from '../DropZone';
import { useFileContext } from '../../contexts/FileContext';
import { useUsage } from '../../contexts/UsageContext';
import { removeBackground } from '../../utils/backgroundRemoval';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Eraser, Download, Loader2, X, Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackgroundRemoverProps {
  onLimitReached?: () => void;
}

export function BackgroundRemover({ onLimitReached }: BackgroundRemoverProps) {
  const { addFiles } = useFileContext();
  const { limitReached, incrementUses } = useUsage();
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [tolerance, setTolerance] = useState(40);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    const img = files.find(f => f.type.startsWith('image/'));
    if (!img) return;
    addFiles('background', [img]);
    setFile(img);
    setOriginalUrl(URL.createObjectURL(img));
    setResultUrl(null);
    setResultBlob(null);
    setError(null);
  }, [addFiles]);

  const handleRemove = useCallback(async () => {
    if (!file) return;
    if (limitReached) {
      onLimitReached?.();
      return;
    }
    incrementUses();
    setIsProcessing(true);
    setError(null);
    try {
      const result = await removeBackground(file, tolerance);
      setResultUrl(result.dataUrl);
      setResultBlob(result.blob);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsProcessing(false);
    }
  }, [file, tolerance, limitReached, incrementUses, onLimitReached]);

  const handleDownload = useCallback(() => {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.[^.]+$/, '') + '_nobg.png';
    a.click();
    URL.revokeObjectURL(url);
  }, [resultBlob, file]);

  const clearFile = useCallback(() => {
    setFile(null);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(null);
    setResultUrl(null);
    setResultBlob(null);
    setError(null);
  }, [originalUrl]);

  return (
    <div className="space-y-4">
      {!file ? (
        <DropZone
          onFiles={handleFiles}
          accept=".jpg,.jpeg,.png,.webp"
          multiple={false}
          label="Drop an image to remove background"
          sublabel="Supports JPG, PNG, WEBP"
          className="min-h-[120px]"
        />
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative rounded-xl overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiLz48cmVjdCB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjNDQ0Ii8+PHJlY3QgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzQ0NCIvPjwvc3ZnPg==')] border border-white/10 max-h-64 flex items-center justify-center">
            <img
              src={showOriginal ? (originalUrl || '') : (resultUrl || originalUrl || '')}
              alt="Preview"
              className="max-h-64 max-w-full object-contain"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              {resultUrl && (
                <button
                  onClick={() => setShowOriginal(v => !v)}
                  className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 hover:text-white transition-all text-xs flex items-center gap-1"
                >
                  {showOriginal ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {showOriginal ? 'Original' : 'Result'}
                </button>
              )}
              <button onClick={clearFile} className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 hover:text-white transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tolerance */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Color Tolerance</Label>
              <span className="text-xs text-teal font-medium">{tolerance}</span>
            </div>
            <Slider
              value={[tolerance]}
              onValueChange={([v]) => setTolerance(v)}
              min={5}
              max={100}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Precise</span>
              <span>Aggressive</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleRemove}
              disabled={isProcessing || limitReached}
              className={cn(
                'btn-primary flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2',
                limitReached && 'opacity-50 cursor-not-allowed'
              )}
            >
              {limitReached ? (
                <><Lock className="w-4 h-4" />Limit Reached — Upgrade for ₹20</>
              ) : isProcessing ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
              ) : (
                <><Eraser className="w-4 h-4" />Remove Background</>
              )}
            </button>
            {resultBlob && (
              <button onClick={handleDownload} className="btn-ghost-teal px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                Save PNG
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
