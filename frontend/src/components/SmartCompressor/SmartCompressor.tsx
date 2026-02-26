import React, { useState, useCallback } from 'react';
import { DropZone } from '../DropZone';
import { GlassCard } from '../GlassCard';
import { useFileContext } from '../../contexts/FileContext';
import { useUsage } from '../../contexts/UsageContext';
import { compressFile, estimateCompressedSize, formatBytes, CompressionOptions, CompressionResult } from '../../utils/compression';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  FileArchive, X, Download, Zap, ZapOff, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Loader2, Trash2, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileState {
  id: string;
  file: File;
  status: 'idle' | 'compressing' | 'done' | 'error';
  result?: CompressionResult;
  error?: string;
}

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp';

interface SmartCompressorProps {
  onLimitReached?: () => void;
}

export function SmartCompressor({ onLimitReached }: SmartCompressorProps) {
  const { addFiles, getFiles, removeFile } = useFileContext();
  const { limitReached, incrementUses } = useUsage();
  const [fileStates, setFileStates] = useState<FileState[]>([]);
  const [options, setOptions] = useState<CompressionOptions>({
    mode: 'lossy',
    targetType: 'percentage',
    percentage: 50,
    maxKB: 500,
  });
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFiles = useCallback((files: File[]) => {
    const valid = files.filter(f =>
      ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(f.type)
    );
    addFiles('compressor', valid);
    setFileStates(prev => [
      ...prev,
      ...valid.map(f => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: f,
        status: 'idle' as const,
      })),
    ]);
  }, [addFiles]);

  const removeFileState = useCallback((id: string) => {
    setFileStates(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFileStates([]);
  }, []);

  const compressAll = useCallback(async () => {
    if (fileStates.length === 0) return;
    if (limitReached) {
      onLimitReached?.();
      return;
    }
    incrementUses();
    setIsCompressing(true);
    const updated = [...fileStates];

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === 'done') continue;
      updated[i] = { ...updated[i], status: 'compressing' };
      setFileStates([...updated]);
      try {
        const result = await compressFile(updated[i].file, options);
        updated[i] = { ...updated[i], status: 'done', result };
      } catch (e) {
        updated[i] = { ...updated[i], status: 'error', error: String(e) };
      }
      setFileStates([...updated]);
    }
    setIsCompressing(false);
  }, [fileStates, options, limitReached, incrementUses, onLimitReached]);

  const downloadFile = useCallback((state: FileState) => {
    if (!state.result) return;
    const url = URL.createObjectURL(state.result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.result.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadAll = useCallback(() => {
    fileStates.filter(s => s.status === 'done').forEach(downloadFile);
  }, [fileStates, downloadFile]);

  const doneCount = fileStates.filter(s => s.status === 'done').length;
  const totalSaved = fileStates
    .filter(s => s.status === 'done' && s.result)
    .reduce((acc, s) => acc + (s.result!.originalSize - s.result!.compressedSize), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Settings Panel */}
      <GlassCard className="p-5">
        <h3 className="section-title text-base mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal" />
          Compression Settings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Mode Toggle */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Compression Mode</Label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <ZapOff className={cn('w-4 h-4 transition-colors', options.mode === 'lossless' ? 'text-teal' : 'text-muted-foreground')} />
              <Switch
                checked={options.mode === 'lossy'}
                onCheckedChange={(v) => setOptions(o => ({ ...o, mode: v ? 'lossy' : 'lossless' }))}
              />
              <Zap className={cn('w-4 h-4 transition-colors', options.mode === 'lossy' ? 'text-teal' : 'text-muted-foreground')} />
              <span className="text-sm font-medium ml-1">
                {options.mode === 'lossy' ? 'Lossy' : 'Lossless'}
              </span>
              <span className="badge-teal ml-auto">
                {options.mode === 'lossy' ? 'Smaller' : 'Quality'}
              </span>
            </div>
          </div>

          {/* Target Type */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Target Type</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setOptions(o => ({ ...o, targetType: 'percentage' }))}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border',
                  options.targetType === 'percentage'
                    ? 'bg-teal/15 border-teal/40 text-teal'
                    : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/8'
                )}
              >
                Reduce by %
              </button>
              <button
                onClick={() => setOptions(o => ({ ...o, targetType: 'maxKB' }))}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border',
                  options.targetType === 'maxKB'
                    ? 'bg-teal/15 border-teal/40 text-teal'
                    : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/8'
                )}
              >
                Max Size (KB)
              </button>
            </div>
          </div>

          {/* Target Value */}
          {options.targetType === 'percentage' ? (
            <div className="space-y-3 sm:col-span-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Reduction Amount</Label>
                <span className="text-sm font-semibold text-teal">{options.percentage}% smaller</span>
              </div>
              <Slider
                value={[options.percentage]}
                onValueChange={([v]) => setOptions(o => ({ ...o, percentage: v }))}
                min={10}
                max={90}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10% (subtle)</span>
                <span>90% (aggressive)</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:col-span-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Maximum File Size</Label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={options.maxKB}
                  onChange={(e) => setOptions(o => ({ ...o, maxKB: Math.max(10, Number(e.target.value)) }))}
                  className="input-glass w-32 px-3 py-2 text-sm"
                  min={10}
                  max={10000}
                />
                <span className="text-sm text-muted-foreground">KB</span>
                <div className="flex gap-2 ml-auto">
                  {[100, 500, 1000, 2000].map(kb => (
                    <button
                      key={kb}
                      onClick={() => setOptions(o => ({ ...o, maxKB: kb }))}
                      className={cn(
                        'px-2 py-1 rounded text-xs border transition-all',
                        options.maxKB === kb
                          ? 'bg-teal/15 border-teal/40 text-teal'
                          : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/8'
                      )}
                    >
                      {kb}KB
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Drop Zone */}
      <DropZone
        onFiles={handleFiles}
        accept={ACCEPTED}
        label="Drop PDF or image files here"
        sublabel="Supports PDF, JPG, PNG, WEBP"
      />

      {/* File List */}
      {fileStates.length > 0 && (
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title text-base flex items-center gap-2">
              <FileArchive className="w-4 h-4 text-teal" />
              Files ({fileStates.length})
            </h3>
            <div className="flex gap-2">
              {doneCount > 0 && (
                <button onClick={downloadAll} className="btn-ghost-teal px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Download All ({doneCount})
                </button>
              )}
              <button onClick={clearAll} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/8 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>

          {doneCount > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-teal/10 border border-teal/20 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
              <span className="text-sm text-teal">
                Saved <strong>{formatBytes(totalSaved)}</strong> across {doneCount} file{doneCount > 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
            {fileStates.map((state) => {
              const estimated = estimateCompressedSize(state.file, options);
              const ratio = state.result
                ? Math.round((1 - state.result.compressedSize / state.result.originalSize) * 100)
                : Math.round((1 - estimated / state.file.size) * 100);

              return (
                <div key={state.id} className="file-item p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">{state.file.name}</span>
                      {state.status === 'done' && (
                        <span className="badge-teal flex-shrink-0">-{ratio}%</span>
                      )}
                      {state.status === 'error' && (
                        <span className="badge-amber flex-shrink-0">Error</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatBytes(state.file.size)}</span>
                      <span className="text-white/20">→</span>
                      <span className={state.status === 'done' ? 'text-teal' : ''}>
                        {state.status === 'done' && state.result
                          ? formatBytes(state.result.compressedSize)
                          : `~${formatBytes(estimated)}`}
                      </span>
                    </div>
                    {state.status === 'compressing' && (
                      <Progress value={undefined} className="h-1 mt-2" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {state.status === 'compressing' && (
                      <Loader2 className="w-4 h-4 text-teal animate-spin" />
                    )}
                    {state.status === 'done' && (
                      <button
                        onClick={() => downloadFile(state)}
                        className="btn-ghost-teal p-1.5 rounded-lg"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
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
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={compressAll}
              disabled={isCompressing || fileStates.length === 0 || limitReached}
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
              ) : isCompressing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Compressing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Compress All Files
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
