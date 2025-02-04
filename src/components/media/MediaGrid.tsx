'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MediaCitation } from '@/lib/services/media-enricher';

interface MediaGridProps {
  citations: MediaCitation[];
  className?: string;
}

function getVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    /(?:vimeo\.com\/)(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return '';
}

export default function MediaGrid({ citations, className = '' }: MediaGridProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaCitation | null>(null);

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {citations.map((citation, index) => (
          <div 
            key={index} 
            className="relative group cursor-pointer rounded-lg overflow-hidden"
            onClick={() => setSelectedMedia(citation)}
          >
            {citation.type === 'video' ? (
              citation.thumbnail ? (
                <Image
                  src={citation.thumbnail}
                  alt={`Video thumbnail ${index + 1}`}
                  width={320}
                  height={180}
                  className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
                  <span className="text-white">Video Preview</span>
                </div>
              )
            ) : (
              <Image
                src={citation.url}
                alt={`Citation source ${index + 1}`}
                width={320}
                height={180}
                className="w-full h-48 object-cover transition-transform group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {citation.type === 'video' ? 'Play Video' : 'View Image'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for selected media */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="max-w-4xl w-full p-4" onClick={e => e.stopPropagation()}>
            {selectedMedia.type === 'video' ? (
              <div className="relative pt-[56.25%]">
                <iframe
                  src={`https://www.youtube.com/embed/${getVideoId(selectedMedia.url)}?start=${selectedMedia.timestamp}&autoplay=1`}
                  className="absolute inset-0 w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <Image
                src={selectedMedia.url}
                alt="Selected media"
                width={1280}
                height={720}
                className="w-full h-auto rounded-lg"
              />
            )}
          </div>
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedMedia(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
} 