interface VideoUrlInfo {
  platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'vimeo' | 'unknown';
  videoId: string | null;
  thumbnailUrl: string | null;
  embedUrl: string | null;
}

export function parseVideoUrl(url: string): VideoUrlInfo {
  try {
    const urlObj = new URL(url);
    
    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      const videoId = urlObj.hostname.includes('youtu.be') 
        ? urlObj.pathname.slice(1)
        : urlObj.searchParams.get('v');
      
      if (!videoId) return { platform: 'youtube', videoId: null, thumbnailUrl: null, embedUrl: null };
      
      return {
        platform: 'youtube',
        videoId,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`
      };
    }
    
    // TikTok
    if (urlObj.hostname.includes('tiktok.com')) {
      const videoId = urlObj.pathname.split('/').pop();
      if (!videoId) return { platform: 'tiktok', videoId: null, thumbnailUrl: null, embedUrl: null };
      
      return {
        platform: 'tiktok',
        videoId,
        thumbnailUrl: null, // TikTok requires API access for thumbnails
        embedUrl: `https://www.tiktok.com/embed/${videoId}`
      };
    }
    
    // Instagram
    if (urlObj.hostname.includes('instagram.com')) {
      const paths = urlObj.pathname.split('/').filter(p => p);
      const videoId = paths[1];
      if (!videoId) return { platform: 'instagram', videoId: null, thumbnailUrl: null, embedUrl: null };
      
      return {
        platform: 'instagram',
        videoId,
        thumbnailUrl: null, // Instagram requires API access for thumbnails
        embedUrl: `https://www.instagram.com/p/${videoId}/embed`
      };
    }
    
    // Facebook
    if (urlObj.hostname.includes('facebook.com')) {
      const videoId = urlObj.pathname.includes('/videos/') 
        ? urlObj.pathname.split('/videos/')[1]?.split('/')[0]
        : urlObj.pathname.split('/').pop();
        
      if (!videoId) return { platform: 'facebook', videoId: null, thumbnailUrl: null, embedUrl: null };
      
      return {
        platform: 'facebook',
        videoId,
        thumbnailUrl: null, // Facebook requires API access for thumbnails
        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`
      };
    }
    
    // Vimeo
    if (urlObj.hostname.includes('vimeo.com')) {
      const videoId = urlObj.pathname.split('/').pop();
      if (!videoId) return { platform: 'vimeo', videoId: null, thumbnailUrl: null, embedUrl: null };
      
      return {
        platform: 'vimeo',
        videoId,
        thumbnailUrl: null, // Will be fetched via API
        embedUrl: `https://player.vimeo.com/video/${videoId}`
      };
    }
    
    // Unknown platform - return generic info
    return {
      platform: 'unknown',
      videoId: null,
      thumbnailUrl: null,
      embedUrl: null
    };
  } catch (error) {
    console.error('Error parsing video URL:', error);
    return {
      platform: 'unknown',
      videoId: null,
      thumbnailUrl: null,
      embedUrl: null
    };
  }
}

export function getPlatformIcon(platform: string): string {
  switch (platform) {
    case 'youtube':
      return `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
      </svg>`;
    case 'tiktok':
      return `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
      </svg>`;
    case 'instagram':
      return `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>`;
    case 'facebook':
      return `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>`;
    case 'vimeo':
      return `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z"/>
      </svg>`;
    default:
      return `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>`;
  }
} 