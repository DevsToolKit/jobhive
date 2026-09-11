import {
  AlertTriangle,
  Check,
  Info,
  Loader2,
  X,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useTheme } from '@/theme/theme.context';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="bottom-right"
      richColors={false}
      closeButton={false}
      duration={3000}
      visibleToasts={4}
      className="toaster group font-sans"
      icons={{
        success: <Check className="h-4 w-4 text-emerald-500 shrink-0" />,
        info: <Info className="h-4 w-4 text-sky-500 shrink-0" />,
        warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
        error: <X className="h-4 w-4 text-rose-500 shrink-0" />,
        loading: <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'border border-border/80 bg-card text-foreground shadow-md backdrop-blur-md rounded-xl py-2.5 px-3.5 text-xs font-medium flex items-center gap-2.5',
          title: 'text-xs font-medium text-foreground',
          description: 'text-[11px] text-muted-foreground',
          actionButton:
            'bg-primary text-primary-foreground text-xs font-medium rounded-md px-2.5 py-1',
          cancelButton:
            'bg-muted text-muted-foreground text-xs font-medium rounded-md px-2.5 py-1',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--card)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': 'var(--card)',
          '--success-text': 'var(--foreground)',
          '--success-border': 'var(--border)',
          '--error-bg': 'var(--card)',
          '--error-text': 'var(--foreground)',
          '--error-border': 'var(--border)',
          '--warning-bg': 'var(--card)',
          '--warning-text': 'var(--foreground)',
          '--warning-border': 'var(--border)',
          '--info-bg': 'var(--card)',
          '--info-text': 'var(--foreground)',
          '--info-border': 'var(--border)',
          '--border-radius': '0.75rem',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
