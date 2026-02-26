import React, { useCallback, useRef, useState } from 'react';
import { Upload, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function DropZone({
  onFiles,
  accept,
  multiple = true,
  label = 'Drop files here',
  sublabel,
  className,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length > 0) onFiles(dropped);
    },
    [onFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length > 0) onFiles(selected);
      e.target.value = '';
    },
    [onFiles]
  );

  return (
    <div
      className={cn('drop-zone', isDragging && 'drag-over', className)}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-col items-center gap-3 py-8 px-4 cursor-pointer select-none">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
            isDragging
              ? 'bg-teal/20 shadow-glow-teal'
              : 'bg-white/5'
          )}
        >
          {isDragging ? (
            <FolderOpen className="w-7 h-7 text-teal" />
          ) : (
            <Upload className="w-7 h-7 text-teal/70" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/80">{label}</p>
          {sublabel && (
            <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
          )}
          <p className="text-xs text-teal/60 mt-2">
            Click to browse or drag & drop
          </p>
        </div>
      </div>
    </div>
  );
}
