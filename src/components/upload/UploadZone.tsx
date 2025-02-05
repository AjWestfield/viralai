import { ChangeEvent, DragEvent, useState } from 'react';
import { ProcessingStatus } from '@/lib/types/video';
import VideoPreview from './VideoPreview';
import { parseVideoUrl, getPlatformIcon } from '@/lib/utils/videoUrlParser';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  status: ProcessingStatus;
  setStatus: (status: ProcessingStatus) => void;
  streamedAnalysis?: {
    reasoning: string;
    citations: { url: string; title: string; }[];
  };
  disabled?: boolean;
}

interface UrlStatus {
  isValid: boolean;
  message: string;
  state: 'validating' | 'valid' | 'downloading' | 'ready' | 'error';
}

export default function UploadZone({ 
  onFileSelect, 
  onUrlSubmit,
  status, 
  setStatus,
  streamedAnalysis,
  disabled 
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [downloadedVideoPath, setDownloadedVideoPath] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [urlPreview, setUrlPreview] = useState<{
    platform: string;
    thumbnailUrl: string | null;
    embedUrl: string | null;
  } | null>(null);
  const [urlStatus, setUrlStatus] = useState<UrlStatus>({
    isValid: false,
    message: '',
    state: 'validating'
  });
  const isProcessing = status.stage !== 'complete' && status.progress > 0;
  const isAnalyzing = status.stage !== 'complete' && status.progress === 0;
  const [disabledForm, setDisabledForm] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isProcessing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isProcessing) return;

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      setSelectedFile(videoFile);
      // Reset status to allow new analysis
      setStatus({ stage: 'uploading', progress: 0, currentStep: '' });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Reset status to allow new analysis
      setStatus({ stage: 'uploading', progress: 0, currentStep: '' });
    }
  };

  const handleUrlChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoUrl(url);
    setDownloadedVideoPath(null);

    if (url.trim()) {
      // Immediate validation feedback
      setUrlStatus({
        isValid: false,
        message: 'Validating URL...',
        state: 'validating'
      });

      const videoInfo = parseVideoUrl(url.trim());
      
      if (videoInfo.platform !== 'unknown') {
        // Show URL accepted status
        setUrlStatus({
          isValid: true,
          message: 'URL Accepted',
          state: 'valid'
        });

        setUrlPreview({
          platform: videoInfo.platform,
          thumbnailUrl: videoInfo.thumbnailUrl,
          embedUrl: videoInfo.embedUrl
        });

        // Update to downloading state
        setUrlStatus({
          isValid: true,
          message: 'Download In Progress',
          state: 'downloading'
        });

        // Start download process
        try {
          const response = await fetch('/api/video/download-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url.trim() }),
          });

          const downloadResult = await response.json();

          if (!downloadResult.success) {
            throw new Error(downloadResult.error || 'Failed to download video');
          }

          const videoPath = `/uploads/${downloadResult.videoPath.split('/').pop()}`;
          setDownloadedVideoPath(videoPath);
          
          // Update status to ready
          setUrlStatus({
            isValid: true,
            message: 'Ready to analyze',
            state: 'ready'
          });

        } catch (error) {
          console.error('Error downloading video:', error);
          setDownloadedVideoPath(null);
          setUrlStatus({
            isValid: false,
            message: 'Error downloading video',
            state: 'error'
          });
        }
      } else {
        setUrlPreview(null);
        setUrlStatus({
          isValid: false,
          message: 'Invalid or unsupported video URL',
          state: 'error'
        });
      }
    } else {
      setUrlPreview(null);
      setUrlStatus({
        isValid: false,
        message: '',
        state: 'validating'
      });
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (videoUrl.trim()) {
      setDisabledForm(true);
      
      try {
        // Reset status and streamedAnalysis before starting new analysis
        if (status.stage === 'complete') {
          setStatus({ stage: 'uploading', progress: 0, currentStep: '' });
        }
        
        // Start analysis using the already downloaded video
        await onUrlSubmit(videoUrl.trim());
        // Clear the URL field after successful analysis
        setVideoUrl('');
        setDisabledForm(false);
      } catch (error) {
        console.error('Error analyzing video:', error);
        setDisabledForm(false);
      }
    }
  };

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

  const getUrlStatusIndicator = () => {
    switch (urlStatus.state) {
      case 'validating':
        return null;
      case 'valid':
        return (
          <div className="flex items-center gap-2 text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm">{urlStatus.message}</span>
          </div>
        );
      case 'downloading':
        return (
          <div className="flex items-center gap-2 text-emerald-400/80">
            <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            <span className="text-sm">{urlStatus.message}</span>
          </div>
        );
      case 'ready':
        return (
          <div className="flex items-center gap-2 text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm">{urlStatus.message}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm">{urlStatus.message}</span>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {/* Input mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setInputMode('file');
            setUrlPreview(null);
            setVideoUrl('');
          }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            inputMode === 'file'
              ? 'bg-emerald-400/10 text-emerald-400'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
          disabled={disabled}
        >
          Upload File
        </button>
        <button
          onClick={() => setInputMode('url')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            inputMode === 'url'
              ? 'bg-emerald-400/10 text-emerald-400'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
          disabled={disabled}
        >
          Enter URL
        </button>
      </div>

      {inputMode === 'file' ? (
        <div className="space-y-6">
          <div 
            className={`
              relative p-12 rounded-2xl
              border-2 border-dashed
              ${isDragging ? 'border-accent' : 'border-white/10'}
              ${!disabled ? 'hover:border-accent/50' : ''}
              transition-all duration-300
              bg-[rgba(0,0,0,0.2)] backdrop-blur-lg
              ${disabled ? 'pointer-events-none' : 'cursor-pointer'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="relative z-10">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                id="video-upload"
                disabled={disabled}
              />
              <label 
                htmlFor="video-upload"
                className="block w-full h-full text-center"
              >
                {selectedFile && status.stage !== 'complete' ? (
                  <div className="space-y-4">
                    {/* Video Preview */}
                    <div className="max-w-[500px] mx-auto relative">
                      <VideoPreview 
                        videoFile={selectedFile} 
                        isAnalyzing={isProcessing} 
                        showPreview={true}
                      />
                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFile(null);
                          setStatus({ stage: 'uploading', progress: 0, currentStep: '' });
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Analyze Button - Show when not processing */}
                    {!isProcessing && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (selectedFile) {
                            onFileSelect(selectedFile);
                          }
                        }}
                        disabled={!selectedFile || disabled}
                        className={`
                          w-full px-4 py-3 rounded-lg font-medium transition-colors
                          ${!selectedFile || disabled
                            ? 'bg-white/5 text-white/40 cursor-not-allowed'
                            : 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                          }
                        `}
                      >
                        Analyze Video
                      </button>
                    )}

                    {/* Processing State */}
                    {isProcessing && (
                      <div className="flex items-center justify-center gap-2 text-emerald-400">
                        <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                        <span>Analyzing...</span>
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

          {/* Show analyzed video below when analysis is complete */}
          {status.stage === 'complete' && selectedFile && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-white/80 mb-3">Analyzed Video</h3>
              <div className="max-w-[500px] mx-auto relative">
                <VideoPreview 
                  videoFile={selectedFile} 
                  isAnalyzing={false}
                  showPreview={true}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div className="relative">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 focus-within:border-emerald-400/50">
                {urlPreview && (
                  <div 
                    className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-white/60"
                    dangerouslySetInnerHTML={{ __html: getPlatformIcon(urlPreview.platform) }}
                  />
                )}
                <input
                  type="url"
                  value={videoUrl}
                  onChange={handleUrlChange}
                  placeholder="Enter video URL (e.g., TikTok, Instagram, YouTube)"
                  className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none"
                  disabled={disabled || disabledForm}
                />
                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUrl('');
                      setUrlPreview(null);
                      setUrlStatus({
                        isValid: false,
                        message: '',
                        state: 'validating'
                      });
                    }}
                    className="text-white/40 hover:text-white/60"
                    disabled={disabled || disabledForm}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* URL Status Indicator */}
            {videoUrl && urlStatus.message && (
              <div className="mt-2">
                {getUrlStatusIndicator()}
              </div>
            )}

            {/* Video Preview */}
            {downloadedVideoPath && urlStatus.state === 'ready' && (
              <div className="mt-6">
                <div className="max-w-[500px] mx-auto">
                  <VideoPreview 
                    videoUrl={downloadedVideoPath}
                    isAnalyzing={isAnalyzing} 
                    showPreview={status.stage === 'complete' || (!isAnalyzing && !status.stage)}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!urlStatus.isValid || disabled || disabledForm || !downloadedVideoPath}
              className={`
                w-full px-4 py-3 rounded-lg font-medium transition-colors
                ${!urlStatus.isValid || disabled || disabledForm || !downloadedVideoPath
                  ? 'bg-white/5 text-white/40 cursor-not-allowed'
                  : 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                }
              `}
            >
              {status.stage === 'analyzing' ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </div>
              ) : (
                'Analyze Video'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Processing indicator */}
      {status.stage !== 'complete' && status.progress > 0 && (
        <div className="mt-4 space-y-2">
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">{status.currentStep}</span>
            <span className="text-white/40">{status.progress}%</span>
          </div>
        </div>
      )}
    </div>
  );
} 