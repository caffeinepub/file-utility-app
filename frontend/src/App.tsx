import React, { useState } from 'react';
import { FileProvider } from './contexts/FileContext';
import { UsageProvider, useUsage } from './contexts/UsageContext';
import { LoginHeader } from './components/LoginHeader';
import { SmartCompressor } from './components/SmartCompressor/SmartCompressor';
import { UniversalConverter } from './components/UniversalConverter/UniversalConverter';
import { Toolbox } from './components/Toolbox/Toolbox';
import { SubscriptionPanel } from './components/SubscriptionPanel';
import { AdminPanel } from './components/AdminPanel';
import { LimitReachedModal } from './components/LimitReachedModal';
import { Zap, RefreshCw, Wrench, Heart, FileText, ExternalLink, Calculator, CreditCard, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'compressor' | 'converter' | 'toolbox' | 'subscription';

const TABS: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'compressor',
    label: 'Smart Compressor',
    icon: <Zap className="w-4 h-4" />,
    description: 'Compress PDF & images',
  },
  {
    id: 'converter',
    label: 'Universal Converter',
    icon: <RefreshCw className="w-4 h-4" />,
    description: 'Convert between formats',
  },
  {
    id: 'toolbox',
    label: 'Toolbox',
    icon: <Wrench className="w-4 h-4" />,
    description: 'Merge, remove BG, scrub',
  },
  {
    id: 'subscription',
    label: 'Subscription',
    icon: <CreditCard className="w-4 h-4" />,
    description: 'Manage your plan',
  },
];

function PdfExtractorAd() {
  return (
    <a
      href="https://pdftextextractor-ujjwal-i1l.caffeine.xyz"
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
      aria-label="Advertisement: Try PDF Text Extractor"
    >
      <div className={cn(
        'relative overflow-hidden rounded-xl border border-teal/30',
        'bg-gradient-to-r from-white/5 via-teal/5 to-white/5',
        'backdrop-blur-md shadow-lg',
        'px-4 py-3 flex items-center gap-4',
        'transition-all duration-300',
        'hover:border-teal/60 hover:shadow-teal/20 hover:shadow-xl',
        'hover:from-white/8 hover:via-teal/10 hover:to-white/8',
      )}>
        <div className="absolute inset-0 pointer-events-none rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'radial-gradient(ellipse at 20% 50%, oklch(0.72 0.18 185 / 0.08) 0%, transparent 70%)' }}
        />
        <div className="shrink-0 w-10 h-10 rounded-lg bg-teal/15 border border-teal/25 flex items-center justify-center text-teal group-hover:bg-teal/25 transition-colors duration-200">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold tracking-widest uppercase text-teal/70 leading-none">
              Sponsored
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground leading-tight truncate">
            PDF Text Extractor
          </p>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
            Extract text from any PDF instantly — fast, free &amp; browser-based.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 text-teal text-xs font-semibold group-hover:gap-2.5 transition-all duration-200">
          <span className="hidden sm:inline">Try it free</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </div>
      </div>
    </a>
  );
}

function CalculatorAd() {
  return (
    <a
      href="https://ace-calculator-app.lovable.app/"
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
      aria-label="Advertisement: Try Free Calculator"
    >
      <div className={cn(
        'relative overflow-hidden rounded-xl border border-teal/30',
        'bg-gradient-to-r from-white/5 via-teal/5 to-white/5',
        'backdrop-blur-md shadow-lg',
        'px-4 py-3 flex items-center gap-4',
        'transition-all duration-300',
        'hover:border-teal/60 hover:shadow-teal/20 hover:shadow-xl',
        'hover:from-white/8 hover:via-teal/10 hover:to-white/8',
      )}>
        <div className="absolute inset-0 pointer-events-none rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'radial-gradient(ellipse at 20% 50%, oklch(0.72 0.18 185 / 0.08) 0%, transparent 70%)' }}
        />
        <div className="shrink-0 w-10 h-10 rounded-lg bg-teal/15 border border-teal/25 flex items-center justify-center text-teal group-hover:bg-teal/25 transition-colors duration-200">
          <Calculator className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold tracking-widest uppercase text-teal/70 leading-none">
              Sponsored
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground leading-tight truncate">
            Free Calculator
          </p>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
            A powerful calculator, completely free!
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 text-teal text-xs font-semibold group-hover:gap-2.5 transition-all duration-200">
          <span className="hidden sm:inline">Try it free</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </div>
      </div>
    </a>
  );
}

function AdvancedCalculatorAd() {
  return (
    <a
      href="https://www.jotform.com/app/260533475989472"
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
      aria-label="Advertisement: Try Free Advanced Calculator"
    >
      <div className={cn(
        'relative overflow-hidden rounded-xl border border-teal/30',
        'bg-gradient-to-r from-white/5 via-teal/5 to-white/5',
        'backdrop-blur-md shadow-lg',
        'px-4 py-3 flex items-center gap-4',
        'transition-all duration-300',
        'hover:border-teal/60 hover:shadow-teal/20 hover:shadow-xl',
        'hover:from-white/8 hover:via-teal/10 hover:to-white/8',
      )}>
        <div className="absolute inset-0 pointer-events-none rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'radial-gradient(ellipse at 20% 50%, oklch(0.72 0.18 185 / 0.08) 0%, transparent 70%)' }}
        />
        <div className="shrink-0 w-10 h-10 rounded-lg bg-teal/15 border border-teal/25 flex items-center justify-center text-teal group-hover:bg-teal/25 transition-colors duration-200">
          <Calculator className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold tracking-widest uppercase text-teal/70 leading-none">
              Sponsored
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground leading-tight truncate">
            Free Advanced Calculator
          </p>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
            Advanced calculations at your fingertips!
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 text-teal text-xs font-semibold group-hover:gap-2.5 transition-all duration-200">
          <span className="hidden sm:inline">Try it free</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </div>
      </div>
    </a>
  );
}

function DailyUsageBadge() {
  const { usesCount, limitReached, isPro } = useUsage();

  if (isPro) {
    return (
      <div className="flex justify-center mb-5">
        <div className={cn(
          'inline-flex items-center gap-2',
          'backdrop-blur-md bg-teal/10 border border-teal/30',
          'rounded-full px-4 py-2 text-sm',
          'shadow-sm',
        )}>
          <Activity className="w-3.5 h-3.5 text-teal" />
          <span className="text-white/70">Daily Usage:</span>
          <span className="font-semibold text-teal">Unlimited (Pro)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-5">
      <div className={cn(
        'inline-flex items-center gap-2',
        'backdrop-blur-md bg-white/5 border',
        'rounded-full px-4 py-2 text-sm',
        'shadow-sm transition-colors duration-300',
        limitReached ? 'border-destructive/50' : 'border-teal/30',
      )}>
        <Activity className={cn('w-3.5 h-3.5', limitReached ? 'text-destructive' : 'text-teal')} />
        <span className="text-white/70">Daily Usage:</span>
        <span className={cn('font-semibold', limitReached ? 'text-destructive' : 'text-teal')}>
          {usesCount} / 4 used today
        </span>
        {limitReached && (
          <span className="text-xs text-destructive/80 font-medium">· Limit reached</span>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('compressor');
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Detect /admin route via pathname
  const isAdminRoute = window.location.pathname === '/admin';

  if (isAdminRoute) {
    return (
      <div className="min-h-screen flex flex-col">
        <LoginHeader />
        <AdminPanel />
        <footer className="glass-card border-t border-white/10 mt-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>© {new Date().getFullYear()} FileForge Utility</span>
              <span className="text-white/20">·</span>
              <span>Admin Panel</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-50 text-xs">Made By Ujjwal Nautiyal</span>
              <span className="text-white/20">·</span>
              <div className="flex items-center gap-1">
                <span>Built with</span>
                <Heart className="w-3 h-3 text-teal fill-teal mx-0.5" />
                <span>using</span>
                <a
                  href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'fileforge-utility')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal hover:text-teal-light transition-colors font-medium"
                >
                  caffeine.ai
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  const activeTabData = TABS.find(t => t.id === activeTab);

  const handleNavigateToSubscription = () => {
    setActiveTab('subscription');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LoginHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Tab Navigation */}
        <nav className="glass-card p-1.5 mb-6 flex gap-1 flex-wrap sm:flex-nowrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'tab-active'
                  : 'tab-inactive'
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>

        {/* Daily Usage Counter */}
        <DailyUsageBadge />

        {/* Tab Description */}
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal/15 flex items-center justify-center text-teal">
              {activeTabData?.icon}
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg leading-tight">
                {activeTabData?.label}
              </h2>
              <p className="text-xs text-muted-foreground">
                {activeTabData?.description}
              </p>
            </div>
            {activeTab !== 'subscription' && (
              <div className="ml-auto">
                <span className="badge-teal">100% Client-Side</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'compressor' && (
            <SmartCompressor onLimitReached={() => setShowLimitModal(true)} />
          )}
          {activeTab === 'converter' && (
            <UniversalConverter onLimitReached={() => setShowLimitModal(true)} />
          )}
          {activeTab === 'toolbox' && (
            <Toolbox onLimitReached={() => setShowLimitModal(true)} />
          )}
          {activeTab === 'subscription' && <SubscriptionPanel />}
        </div>

        {/* Advertisement Banners */}
        <div className="mt-8 flex flex-col gap-3">
          <PdfExtractorAd />
          <CalculatorAd />
          <AdvancedCalculatorAd />
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-card border-t border-white/10 mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>© {new Date().getFullYear()} FileForge Utility</span>
            <span className="text-white/20">·</span>
            <span>All processing happens in your browser</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-50 text-xs">Made By Ujjwal Nautiyal</span>
            <span className="text-white/20">·</span>
            <div className="flex items-center gap-1">
              <span>Built with</span>
              <Heart className="w-3 h-3 text-teal fill-teal mx-0.5" />
              <span>using</span>
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'fileforge-utility')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal hover:text-teal-light transition-colors font-medium"
              >
                caffeine.ai
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Limit Reached Modal */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onNavigateToSubscription={handleNavigateToSubscription}
      />
    </div>
  );
}

export default function App() {
  return (
    <UsageProvider>
      <FileProvider>
        <AppContent />
      </FileProvider>
    </UsageProvider>
  );
}
