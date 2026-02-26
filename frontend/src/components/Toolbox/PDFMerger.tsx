import React, { useState, useCallback } from 'react';
import { DropZone } from '../DropZone';
import { useFileContext } from '../../contexts/FileContext';
import { useUsage } from '../../contexts/UsageContext';
import { mergePDFs } from '../../utils/pdfMerger';
import { formatBytes } from '../../utils/compression';
import { FileText, X, Download, Loader2, GripVertical, Merge, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFMergerProps {
  onLimitReached?: () => void;
}

export function PDFMerger({ onLimitReached }: PDFMergerProps) {
  const { addFiles } = useFileContext();
  const { limitReached, incrementUses } = useUsage();
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    const pdfs = files.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    addFiles('merger', pdfs);
    setPdfFiles(prev => [...prev, ...pdfs]);
    setMergedBlob(null);
    setError(null);
  }, [addFiles]);

  const removeFile = useCallback((idx: number) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== idx));
    setMergedBlob(null);
  }, []);

  const moveUp = useCallback((idx: number) => {
    if (idx === 0) return;
    setPdfFiles(prev => {
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  }, []);

  const moveDown = useCallback((idx: number) => {
    setPdfFiles(prev => {
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  }, []);

  const handleMerge = useCallback(async () => {
    if (pdfFiles.length < 2) return;
    if (limitReached) {
      onLimitReached?.();
      return;
    }
    incrementUses();
    setIsMerging(true);
    setError(null);
    try {
      const blob = await mergePDFs(pdfFiles);
      setMergedBlob(blob);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsMerging(false);
    }
  }, [pdfFiles, limitReached, incrementUses, onLimitReached]);

  const downloadMerged = useCallback(() => {
    if (!mergedBlob) return;
    const url = URL.createObjectURL(mergedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }, [mergedBlob]);

  return (
    <div className="space-y-4">
      <DropZone
        onFiles={handleFiles}
        accept=".pdf"
        label="Drop PDF files to merge"
        sublabel="Add multiple PDFs — order matters"
        className="min-h-[120px]"
      />

      {pdfFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Files to merge ({pdfFiles.length}) — drag to reorder
          </p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-thin pr-1">
            {pdfFiles.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="file-item p-2.5 flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={() => moveDown(idx)} disabled={idx === pdfFiles.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
                <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                  {idx + 1}
                </span>
                <FileText className="w-4 h-4 text-teal/70 flex-shrink-0" />
                <span className="text-sm flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">{formatBytes(file.size)}</span>
                <button onClick={() => removeFile(idx)} className="p-1 rounded hover:bg-white/10 text-muted-foreground transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              {error}
            </div>
          )}

          {mergedBlob && (
            <div className="p-3 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-between">
              <span className="text-sm text-teal">
                ✓ Merged PDF ready ({formatBytes(mergedBlob.size)})
              </span>
              <button onClick={downloadMerged} className="btn-ghost-teal px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          )}

          <button
            onClick={handleMerge}
            disabled={isMerging || pdfFiles.length < 2 || limitReached}
            className={cn(
              'btn-primary w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2',
              limitReached && 'opacity-50 cursor-not-allowed'
            )}
          >
            {limitReached ? (
              <><Lock className="w-4 h-4" />Daily Limit Reached — Upgrade for ₹20</>
            ) : isMerging ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Merging PDFs...</>
            ) : (
              <><Merge className="w-4 h-4" />Merge {pdfFiles.length} PDFs</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
