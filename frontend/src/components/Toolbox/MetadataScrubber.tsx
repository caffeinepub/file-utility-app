import React, { useState, useCallback } from 'react';
import { DropZone } from '../DropZone';
import { useFileContext } from '../../contexts/FileContext';
import { useUsage } from '../../contexts/UsageContext';
import { scrubMetadata, ScrubResult } from '../../utils/metadataScrubber';
import { formatBytes } from '../../utils/compression';
import { ShieldCheck, Download, Loader2, X, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetadataScrubberProps {
  onLimitReached?: () => void;
}

export function MetadataScrubber({ onLimitReached }: MetadataScrubberProps) {
  const { addFiles } = useFileContext();
  const { limitReached, incrementUses } = useUsage();
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Map<string, ScrubResult>>(new Map());
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const handleFiles = useCallback((newFiles: File[]) => {
    addFiles('metadata', newFiles);
    setFiles(prev => [...prev, ...newFiles]);
  }, [addFiles]);

  const removeFile = useCallback((idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const scrubFile = useCallback(async (file: File, key: string) => {
    setProcessing(prev => new Set(prev).add(key));
    setErrors(prev => { const m = new Map(prev); m.delete(key); return m; });
    try {
      const result = await scrubMetadata(file);
      setResults(prev => new Map(prev).set(key, result));
    } catch (e) {
      setErrors(prev => new Map(prev).set(key, String(e)));
    } finally {
      setProcessing(prev => { const s = new Set(prev); s.delete(key); return s; });
    }
  }, []);

  const scrubAll = useCallback(async () => {
    if (limitReached) {
      onLimitReached?.();
      return;
    }
    incrementUses();
    for (let i = 0; i < files.length; i++) {
      const key = `${files[i].name}-${i}`;
      await scrubFile(files[i], key);
    }
  }, [files, scrubFile, limitReached, incrementUses, onLimitReached]);

  const downloadResult = useCallback((result: ScrubResult) => {
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setResults(new Map());
    setErrors(new Map());
  }, []);

  return (
    <div className="space-y-4">
      <DropZone
        onFiles={handleFiles}
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        label="Drop files to scrub metadata"
        sublabel="Removes EXIF, GPS, author info, timestamps"
        className="min-h-[120px]"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Files ({files.length})
            </p>
            <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Clear all
            </button>
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-thin pr-1">
            {files.map((file, idx) => {
              const key = `${file.name}-${idx}`;
              const result = results.get(key);
              const isProcessing = processing.has(key);
              const error = errors.get(key);

              return (
                <div key={key} className="file-item p-2.5 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm truncate">{file.name}</span>
                      {result && <span className="badge-teal flex-shrink-0">Clean</span>}
                      {error && <span className="badge-amber flex-shrink-0">Error</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatBytes(file.size)}
                      {result && (
                        <span className="text-teal ml-2">
                          Removed: {result.removedFields.slice(0, 3).join(', ')}
                          {result.removedFields.length > 3 ? ` +${result.removedFields.length - 3} more` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isProcessing && <Loader2 className="w-4 h-4 text-teal animate-spin" />}
                    {result && (
                      <button onClick={() => downloadResult(result)} className="btn-ghost-teal p-1.5 rounded-lg">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!isProcessing && !result && (
                      <button
                        onClick={() => {
                          if (limitReached) {
                            onLimitReached?.();
                            return;
                          }
                          incrementUses();
                          scrubFile(file, key);
                        }}
                        className="px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/8 transition-all"
                      >
                        Scrub
                      </button>
                    )}
                    <button onClick={() => removeFile(idx)} className="p-1 rounded hover:bg-white/10 text-muted-foreground transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={scrubAll}
            disabled={processing.size > 0 || limitReached}
            className={cn(
              'btn-primary w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2',
              limitReached && 'opacity-50 cursor-not-allowed'
            )}
          >
            {limitReached ? (
              <><Lock className="w-4 h-4" />Daily Limit Reached — Upgrade for ₹20</>
            ) : processing.size > 0 ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Scrubbing...</>
            ) : (
              <><ShieldCheck className="w-4 h-4" />Scrub All Metadata</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
