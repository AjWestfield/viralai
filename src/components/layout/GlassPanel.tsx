import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

export default function GlassPanel({ children, className = '' }: GlassPanelProps) {
  return (
    <div 
      className={`
        relative
        bg-[rgba(0,0,0,0.2)] backdrop-blur-lg
        border border-white/10 rounded-2xl
        p-6 ${className}
      `}
    >
      {children}
    </div>
  );
} 