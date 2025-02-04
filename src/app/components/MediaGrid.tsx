import React, { useState } from 'react';
import Image from 'next/image';

interface MediaCitation {
  url: string;
  type: 'video' | 'image';
  timestamp?: string;
  thumbnail?: string;
  description?: string;
}

interface MediaGridProps {
  citations: MediaCitation[];
  className?: string;
}

export function MediaGrid({ citations, className = '' }: MediaGridProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaCitation | null>(null);

  const handleMediaClick = (media: MediaCitation) => {
    setSelectedMedia(media);
  };

  const handleCloseModal = () => {
    setSelectedMedia(null);
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {citations.map((media, index) => (
        <div
          key={`${media.url}-${index}`}
          className="relative overflow-hidden rounded-lg bg-gray-800 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => handleMediaClick(media)}
        >
          {media.thumbnail ? (
            <Image
              src={media.thumbnail}
              alt={media.description || 'Media thumbnail'}
              width={320}
              height={180}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
              {media.type === 'video' ? (
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50">
            <p className="text-white text-sm truncate">{media.description}</p>
            {media.timestamp && (
              <p className="text-gray-300 text-xs">{media.timestamp}</p>
            )}
          </div>
        </div>
      ))}

      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-4xl w-full mx-4">
            <button
              onClick={handleCloseModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              Close
            </button>
            {selectedMedia.type === 'video' ? (
              <div className="relative pt-[56.25%]">
                <iframe
                  src={selectedMedia.url}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <Image
                src={selectedMedia.url}
                alt={selectedMedia.description || 'Media content'}
                width={1280}
                height={720}
                className="w-full h-auto"
              />
            )}
            {selectedMedia.description && (
              <p className="mt-4 text-white">{selectedMedia.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 