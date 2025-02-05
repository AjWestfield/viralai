import React, { useEffect, useRef, useState } from 'react';

interface VideoPreviewProps {
  videoFile?: File | null;
  videoUrl?: string | null;
  isAnalyzing?: boolean;
}

export function VideoPreview({ videoFile, videoUrl, isAnalyzing = false }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoFile]);

  const videoSource = objectUrl || videoUrl || '';

  return (
    <div className="relative aspect-video w-full bg-black/20 rounded-lg overflow-hidden">
      {videoSource && (
        <video
          ref={videoRef}
          src={videoSource}
          className="w-full h-full object-contain"
          controls
          controlsList="nodownload"
        />
      )}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50">
          <div className="absolute inset-0 bg-gradient-to-r from-[#6EE7B7]/20 to-[rgba(88,101,242,0.2)] animate-scan" />
        </div>
      )}
    </div>
  );
} 