import React, { useState, useCallback } from 'react';
import { DropZone } from '../DropZone';
import { GlassCard } from '../GlassCard';
import { useFileContext } from '../../contexts/FileContext';
import { useUsage } from '../../contexts/UsageContext';
import { convertFile, FileFormat, ConversionResult } from '../../utils/conversion';
import { formatBytes } from '../../utils/compression';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  ArrowRight, RefreshCw, Download, X, Loader2, CheckCircle2,
  AlertCircle, FileType, Trash2, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FORMATS: FileFormat[] = ['PDF', 'JPG', 'PNG', 'WEBP', 'DOCX', 'SVG'];

interface ConvertState {
  id: string;
  file: File;
  status: 'idle' | 'converting' | 'done' | 'error';
  results?: ConversionResult[];
  error?: string;
}

function getAcceptForFormat(fmt: FileFormat): string {
  const map: Record<FileFormat, string> = {
    PDF: '.pdf',
    JPG: '.jpg,.jpeg',
    PNG: '.png',
    WEBP: '.webp',
    DOCX: '.docx',
    SVG: '.svg',
  };
  return map[fmt];
}

function detectFormat(file: File): FileFormat {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'PDF';
  if (ext === 'jpg' || ext === 'jpeg') return 'JPG';
  if (ext === 'png') return 'PNG';
  if (ext === 'webp') return 'WEBP';
  if (ext === 'docx') return 'DOCX';
  if (ext === 'svg') return 'SVG';
  if (file.type.includes('pdf')) return 'PDF';
  if (file.type.includes('jpeg')) return 'JPG';
  if (file.type.includes('png')) return 'PNG';
  if (file.type.includes('webp')) return 'WEBP';
  if (file.type.includes('svg')) return 'SVG';
  return 'JPG';
}

interface UniversalConverterProps {
  onLimitReached?: () => void;
}

export function UniversalConverter({ onLimitReached }: UniversalConverterProps) {
  const { addFiles } = useFileContext();
  const { limitReached, incrementUses } = useUsage();
  const [fileStates, setFileStates] = useState<ConvertState[]>([]);
  const [fromFormat, setFromFormat] = useState<FileFormat>('JPG');
  const [toFormat, setToFormat] = useState<FileFormat>('PNG');
  const [isConverting, setIsConverting] = useState(false);

  const handleFiles = useCallback((files: File[]) => {
    addFiles('converter', files);
    const detected = files[0] ? detectFormat(files[0]) : fromFormat;
    if (files[0]) setFromFormat(detected);
    setFileStates(prev => [
      ...prev,
      ...files.map(f => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: f,
        status: 'idle' as const,
      })),
    ]);
  }, [addFiles, fromFormat]);

  const removeFileState = useCallback((id: string) => {
    setFileStates(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearAll = useCallback(() => setFileStates([]), []);

  const convertAll = useCallback(async () => {
    if (fileStates.length === 0) return;
    if (limitReached) {
      onLimitReached?.();
      return;
    }
    incrementUses();
    setIsConverting(true);
    const updated = [...fileStates];

    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: 'converting' };
      setFileStates([...updated]);
      try {
        const results = await convertFile(updated[i].file, fromFormat, toFormat);
        updated[i] = { ...updated[i], status: 'done', results };
      } catch (e) {
        updated[i] = { ...updated[i], status: 'error', error: String(e) };
      }
      setFileStates([...updated]);
    }
    setIsConverting(false);
  }, [fileStates, fromFormat, toFormat, limitReached, incrementUses, onLimitReached]);

  const downloadResult = useCallback((result: ConversionResult) => {
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadAll = useCallback(() => {
    fileStates.forEach(s => {
      s.results?.forEach(r => downloadResult(r));
    });
  }, [fileStates, downloadResult]);

  const doneCount = fileStates.filter(s => s.status === 'done').length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Format Selection */}
      <GlassCard className="p-5">
        <h3 className="section-title text-base mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-teal" />
          Format Selection
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">From</Label>
            <Select value={fromFormat} onValueChange={(v) => setFromFormat(v as FileFormat)}>
              <SelectTrigger className="glass-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-shrink-0 mt-6">
            <ArrowRight className="w-5 h-5 text-teal" />
          </div>
          <div className="flex-1 space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">To</Label>
            <Select value={toFormat} onValueChange={(v) => setToFormat(v as FileFormat)}>
              <SelectTrigger className="glass-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.filter(f => f !== fromFormat).map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Drop Zone */}
      <DropZone
        onFiles={handleFiles}
        accept={getAcceptForFormat(fromFormat)}
        label={`Drop ${fromFormat} files to convert`}
        sublabel={`Converting to ${toFormat}`}
      />

      {/* File List */}
      {fileStates.length > 0 && (
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title text-base flex items-center gap-2">
              <FileType className="w-4 h-4 text-teal" />
              Files ({fileStates.length})
            </h3>
            <div className="flex gap-2">
              {doneCount > 0 && (
                <button onClick={downloadAll} className="btn-ghost-teal px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Download All
                </button>
              )}
              <button onClick={clearAll} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/8 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
            {fileStates.map((state) => (
              <div key={state.id} className="file-item p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">{state.file.name}</span>
                    {state.status === 'done' && (
                      <span className="badge-teal flex-shrink-0">Done</span>
                    )}
                    {state.status === 'error' && (
                      <span className="badge-amber flex-shrink-0">Error</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatBytes(state.file.size)}</span>
                    <span className="text-white/20">→</span>
                    <span>{toFormat}</span>
                  </div>
                  {state.status === 'error' && state.error && (
                    <p className="text-xs text-destructive mt-1 truncate">{state.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {state.status === 'converting' && (
                    <Loader2 className="w-4 h-4 text-teal animate-spin" />
                  )}
                  {state.status === 'done' && state.results && (
                    <div className="flex gap-1">
                      {state.results.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => downloadResult(r)}
                          className="btn-ghost-teal p-1.5 rounded-lg"
                          title={`Download ${r.fileName}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  )}
                  {state.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                  <button
                    onClick={() => removeFileState(state.id)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground transition-all"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={convertAll}
              disabled={isConverting || fileStates.length === 0 || limitReached}
              className={cn(
                'btn-primary w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2',
                limitReached && 'opacity-50 cursor-not-allowed'
              )}
            >
              {limitReached ? (
                <>
                  <Lock className="w-4 h-4" />
                  Daily Limit Reached — Upgrade for ₹20
                </>
              ) : isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Convert All to {toFormat}
                </>
              )}
            </button>
          </div>
        </GlassCard>
      )}

      {fileStates.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Upload files above to get started
        </div>
      )}
    </div>
  );
}
