import { ChangeEvent } from 'react';
import { ProcessingStatus } from '@/lib/types/video';

interface UploadZoneProps {
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  status: ProcessingStatus;
  disabled?: boolean;
}

export default function UploadZone({ onFileSelect, status, disabled }: UploadZoneProps) {
  const isProcessing = status.stage !== 'complete' && status.progress > 0;

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
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#6EE7B7] to-[rgba(88,101,242,1)] rounded-full transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
              <p className="text-white/60">
                {status.stage.charAt(0).toUpperCase() + status.stage.slice(1)}... {status.progress}%
              </p>
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