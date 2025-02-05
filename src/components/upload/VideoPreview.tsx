import { useEffect, useRef, useState } from 'react';

interface VideoPreviewProps {
  videoFile?: File | null;
  videoUrl?: string | null;
  isAnalyzing: boolean;
  showPreview?: boolean;
}

export default function VideoPreview({ videoFile, videoUrl, isAnalyzing, showPreview = false }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    
    // Reset states
    setIsLoading(true);
    setHasError(false);

    // Clear previous source
    if (videoRef.current.src) {
      videoRef.current.src = '';
      videoRef.current.load();
    }

    let objectUrl: string | null = null;

    const handleLoadedData = async () => {
      setIsLoading(false);
      if (videoRef.current) {
        try {
          // Always start playing when video is loaded
          videoRef.current.currentTime = 0;
          await videoRef.current.play();
        } catch (error) {
          console.error('Video playback error:', error);
          setHasError(true);
        }
      }
    };

    const handleError = (error: ErrorEvent) => {
      console.error('Video loading error:', error);
      setIsLoading(false);
      setHasError(true);
    };

    const handleVisibilityChange = () => {
      if (!videoRef.current) return;
      if (document.hidden) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    };

    // Add event listeners
    videoRef.current.addEventListener('loadeddata', handleLoadedData);
    videoRef.current.addEventListener('error', handleError);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set video source
    if (videoFile) {
      objectUrl = URL.createObjectURL(videoFile);
      videoRef.current.src = objectUrl;
    } else if (videoUrl) {
      videoRef.current.src = videoUrl;
    }

    // Load the video
    videoRef.current.load();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadeddata', handleLoadedData);
        videoRef.current.removeEventListener('error', handleError);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [videoFile, videoUrl, isAnalyzing, showPreview]);

  // Don't render anything if no video source is provided
  if (!videoFile && !videoUrl) {
    return null;
  }

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/20">
      {!hasError && (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls={!isAnalyzing && showPreview}
          loop
          muted
          playsInline
        />
      )}
      
      {/* Always show scanning effect when video is loaded */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scanning effect */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Scanning line */}
          <div className="absolute left-0 right-0 h-[3px] animate-scan-line">
            {/* Main scanning beam */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(110,231,183,0.7)]" />
            {/* Secondary glow effects */}
            <div className="absolute inset-0 -top-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent blur-[1px]" />
            <div className="absolute inset-0 -bottom-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent blur-[1px]" />
            {/* Vertical light beams */}
            <div className="absolute top-0 left-[20%] h-[20px] w-[1px] bg-gradient-to-b from-emerald-400/80 to-transparent" />
            <div className="absolute top-0 left-[40%] h-[15px] w-[1px] bg-gradient-to-b from-emerald-400/60 to-transparent" />
            <div className="absolute top-0 left-[60%] h-[25px] w-[1px] bg-gradient-to-b from-emerald-400/70 to-transparent" />
            <div className="absolute top-0 left-[80%] h-[18px] w-[1px] bg-gradient-to-b from-emerald-400/50 to-transparent" />
          </div>
        </div>
        
        {/* Enhanced grid overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.05)1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.02)1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)1px,transparent_1px)] bg-[size:100px_100px]" />
        </div>
        
        {/* Glowing corner accents */}
        <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-emerald-400/50 [box-shadow:0_0_10px_rgba(110,231,183,0.3)]" />
        <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-emerald-400/50 [box-shadow:0_0_10px_rgba(110,231,183,0.3)]" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-emerald-400/50 [box-shadow:0_0_10px_rgba(110,231,183,0.3)]" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-emerald-400/50 [box-shadow:0_0_10px_rgba(110,231,183,0.3)]" />
      </div>

      {(isLoading || hasError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          {isLoading ? (
            <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          ) : hasError && (
            <div className="text-white/60 text-sm">Failed to load video</div>
          )}
        </div>
      )}
    </div>
  );
} 