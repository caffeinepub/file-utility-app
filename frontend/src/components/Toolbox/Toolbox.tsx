import React, { useState } from 'react';
import { GlassCard } from '../GlassCard';
import { PDFMerger } from './PDFMerger';
import { BackgroundRemover } from './BackgroundRemover';
import { MetadataScrubber } from './MetadataScrubber';
import { Merge, Eraser, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tool = 'merger' | 'background' | 'metadata';

const TOOLS: { id: Tool; label: string; icon: React.ReactNode; description: string; badge: string; badgeClass: string }[] = [
  {
    id: 'merger',
    label: 'PDF Merger',
    icon: <Merge className="w-5 h-5" />,
    description: 'Combine multiple PDFs into one',
    badge: 'PDF',
    badgeClass: 'badge-teal',
  },
  {
    id: 'background',
    label: 'Background Remover',
    icon: <Eraser className="w-5 h-5" />,
    description: 'Remove image backgrounds',
    badge: 'Image',
    badgeClass: 'badge-violet',
  },
  {
    id: 'metadata',
    label: 'Metadata Scrubber',
    icon: <ShieldCheck className="w-5 h-5" />,
    description: 'Strip EXIF & metadata from files',
    badge: 'Privacy',
    badgeClass: 'badge-amber',
  },
];

interface ToolboxProps {
  onLimitReached?: () => void;
}

export function Toolbox({ onLimitReached }: ToolboxProps) {
  const [activeTool, setActiveTool] = useState<Tool>('merger');

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Tool Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={cn(
              'p-4 rounded-xl border text-left transition-all duration-200',
              activeTool === tool.id
                ? 'bg-teal/10 border-teal/40 shadow-glow-teal'
                : 'bg-white/4 border-white/10 hover:bg-white/7 hover:border-white/20'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                activeTool === tool.id ? 'bg-teal/20 text-teal' : 'bg-white/8 text-muted-foreground'
              )}>
                {tool.icon}
              </div>
              <span className={tool.badgeClass}>{tool.badge}</span>
            </div>
            <p className={cn(
              'text-sm font-semibold transition-colors',
              activeTool === tool.id ? 'text-teal' : 'text-foreground/80'
            )}>
              {tool.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
          </button>
        ))}
      </div>

      {/* Active Tool Panel */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-teal/15 flex items-center justify-center text-teal">
            {TOOLS.find(t => t.id === activeTool)?.icon}
          </div>
          <div>
            <h3 className="section-title text-base">
              {TOOLS.find(t => t.id === activeTool)?.label}
            </h3>
            <p className="text-xs text-muted-foreground">
              {TOOLS.find(t => t.id === activeTool)?.description}
            </p>
          </div>
        </div>

        {activeTool === 'merger' && <PDFMerger onLimitReached={onLimitReached} />}
        {activeTool === 'background' && <BackgroundRemover onLimitReached={onLimitReached} />}
        {activeTool === 'metadata' && <MetadataScrubber onLimitReached={onLimitReached} />}
      </GlassCard>
    </div>
  );
}
