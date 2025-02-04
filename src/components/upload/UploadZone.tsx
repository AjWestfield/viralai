import { ChangeEvent } from 'react';
import { ProcessingStatus } from '@/lib/types/video';

interface UploadZoneProps {
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  status: ProcessingStatus;
  streamedAnalysis?: {
    reasoning: string;
    citations: { url: string; title: string; }[];
  };
  disabled?: boolean;
}

export default function UploadZone({ 
  onFileSelect, 
  status, 
  streamedAnalysis,
  disabled 
}: UploadZoneProps) {
  const isProcessing = status.stage !== 'complete' && status.progress > 0;

  // Helper function to get icon based on URL type
  const getCitationIcon = (url: string) => {
    if (url.includes('youtube.com')) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
      );
    } else if (url.includes('tiktok.com')) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
      );
    } else if (url.includes('blog')) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      );
    }
  };

  return (
    <div 
      className={`
        relative p-12 rounded-2xl
        border-2 border-dashed border-white/10
        ${!disabled ? 'hover:border-accent/50' : ''}
        transition-all duration-300
        bg-[rgba(0,0,0,0.2)] backdrop-blur-lg
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="relative z-10">
        <input
          type="file"
          accept="video/*"
          onChange={onFileSelect}
          className="hidden"
          id="video-upload"
          disabled={disabled}
        />
        <label 
          htmlFor="video-upload"
          className="block w-full h-full text-center"
        >
          {isProcessing ? (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#6EE7B7] to-[rgba(88,101,242,1)] rounded-full transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
              
              {/* Status Text */}
              <div className="space-y-2">
                <p className="text-white/80 font-medium">
                  {status.currentStep} ({status.progress}%)
                </p>
              </div>

              {/* Streamed Analysis */}
              {streamedAnalysis && streamedAnalysis.reasoning && (
                <div className="mt-6 text-left">
                  <div className="space-y-4 bg-white/5 rounded-lg p-4">
                    <h3 className="text-white/80 font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Chain of Thought Analysis
                    </h3>
                    <div className="text-sm text-white/70 space-y-2">
                      <div className="font-mono leading-relaxed whitespace-pre-wrap break-words bg-black/20 rounded-lg p-4 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {streamedAnalysis.reasoning.split('\n').map((line, i) => {
                          // Skip empty lines
                          if (!line.trim()) return null;
                          
                          // Format different types of content
                          if (line.startsWith('Starting video') || line.startsWith('Analyzing') || 
                              line.startsWith('Checking') || line.startsWith('Evaluating') || 
                              line.startsWith('Assessing')) {
                            return (
                              <p key={i} className="text-emerald-300/80 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {line}
                              </p>
                            );
                          } else if (line.startsWith('Looking at')) {
                            return <p key={i} className="text-blue-300/80 mb-2">{line}</p>;
                          } else if (line.includes('Source [')) {
                            return <p key={i} className="text-green-300/80 mb-2">{line}</p>;
                          } else if (line.includes('calculating') || line.includes('score')) {
                            return <p key={i} className="text-yellow-300/80 mb-2">{line}</p>;
                          } else if (line.includes('wait') || line.includes('however') || line.includes('but')) {
                            return <p key={i} className="text-purple-300/80 mb-2">{line}</p>;
                          } else if (line.includes('```json')) {
                            return null; // Skip JSON blocks
                          } else if (line.startsWith('{') || line.startsWith('}')) {
                            return null; // Skip JSON content
                          } else {
                            return <p key={i} className="mb-2">{line}</p>;
                          }
                        })}
                      </div>
                    </div>
                    {streamedAnalysis.citations?.length > 0 && (
                      <div className="pt-4 border-t border-white/10">
                        <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Analysis Sources ({streamedAnalysis.citations.length})
                        </h4>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                          {streamedAnalysis.citations.map((citation, i) => (
                            <a 
                              key={i}
                              href={citation.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 text-xs text-white/60 hover:text-white/80 transition-colors p-3 rounded-lg bg-white/5 hover:bg-white/10 group"
                            >
                              <span className="flex-shrink-0">
                                {getCitationIcon(citation.url)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium mb-0.5 truncate">
                                  {citation.title}
                                </div>
                                <div className="text-white/40 truncate group-hover:text-white/60">
                                  {citation.url}
                                </div>
                              </div>
                              <svg 
                                className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-[#1a2e44] flex items-center justify-center">
                <svg 
                  className="w-6 h-6 text-[#6EE7B7]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-white/60">
                Drag and drop your video here, or click to select
              </p>
              <p className="mt-2 text-sm text-white/40">
                Supported formats: MP4, MOV, AVI (max 100MB)
              </p>
            </div>
          )}
        </label>
      </div>
    </div>
  );
} 