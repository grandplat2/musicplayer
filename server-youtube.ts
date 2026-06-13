import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client (available as fallback)
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface YouTubeTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  durationText: string;
  thumbnail: string;
  url: string;
  source: 'youtube';
}

/**
 * Searches YouTube for video tracks matching a query
 */
export async function searchYouTube(query: string): Promise<YouTubeTrack[]> {
  try {
    // sp=EgIQAQ%253D%253D filters search results to videos only
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube page: ${response.statusText}`);
    }
    const html = await response.text();
    return parseSearchResults(html);
  } catch (error) {
    console.error("Error in searchYouTube:", error);
    return [];
  }
}

/**
 * Imports a playlist from a YouTube playlist URL or ID
 */
export async function parseYouTubePlaylist(playlistUrlOrId: string): Promise<YouTubeTrack[]> {
  let playlistId = playlistUrlOrId;
  if (playlistUrlOrId.includes("list=")) {
    const match = playlistUrlOrId.match(/[&?]list=([^&]+)/);
    if (match) {
      playlistId = match[1];
    }
  }
  
  try {
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    const response = await fetch(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube playlist page: ${response.statusText}`);
    }
    const html = await response.text();
    return parsePlaylistPage(html);
  } catch (error) {
    console.error("Error in parseYouTubePlaylist:", error);
    return [];
  }
}

/**
 * Parses individual video metadata via official oEmbed or fallbacks
 */
export async function parseSingleYouTubeVideo(videoUrlOrId: string): Promise<YouTubeTrack | null> {
  let videoId = videoUrlOrId;
  if (videoUrlOrId.includes("v=")) {
    const match = videoUrlOrId.match(/[&?]v=([^&]+)/);
    if (match) videoId = match[1];
  } else if (videoUrlOrId.includes("youtu.be/")) {
    const parts = videoUrlOrId.split("youtu.be/");
    if (parts[1]) {
      // remove query parameters if any
      const idPart = parts[1].split(/[?#]/)[0];
      videoId = idPart;
    }
  }

  // Clean the id
  videoId = videoId.trim();
  if (videoId.length !== 11) {
    return null; // Invalid video ID length
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const meta = await response.json();
      const title = meta.title || "Custom Implemented Video";
      const artist = meta.author_name || "YouTube Creator";
      const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      return {
        id: videoId,
        title,
        artist,
        duration: 180, // Fallback duration, client updates this dynamically when loading video
        durationText: "3:00",
        thumbnail,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        source: 'youtube'
      };
    }
  } catch (error) {
    console.error("Error in parseSingleYouTubeVideo:", error);
  }

  // Direct fallback if oEmbed fails
  return {
    id: videoId,
    title: `Track (${videoId})`,
    artist: "YouTube Video",
    duration: 180,
    durationText: "3:00",
    thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    source: 'youtube'
  };
}

// Private helper to extract standard results
function parseSearchResults(html: string): YouTubeTrack[] {
  const tracks: YouTubeTrack[] = [];
  
  let ytInitialData: any = null;
  const match = html.match(/ytInitialData\s*=\s*({[\s\S]+?});/);
  if (match) {
    try {
      ytInitialData = JSON.parse(match[1]);
    } catch (e) {
      // Ignored, proceed to fallback
    }
  }

  if (ytInitialData) {
    try {
      const contents = ytInitialData.contents?.twoColumnSearchResultRenderer?.primaryContents?.sectionListRenderer?.contents;
      const firstSection = contents?.find((c: any) => c.itemSectionRenderer);
      const items = firstSection?.itemSectionRenderer?.contents || [];
      
      for (const item of items) {
        if (item.videoRenderer) {
          const v = item.videoRenderer;
          const videoId = v.videoId;
          if (!videoId) continue;
          
          const title = v.title?.runs?.map((r: any) => r.text).join("") || v.title?.simpleText || "Unknown Track";
          const artist = v.ownerText?.runs?.map((r: any) => r.text).join("") || v.shortBylineText?.runs?.map((r: any) => r.text).join("") || "Unknown Artist";
          const thumbnail = v.thumbnail?.thumbnails?.[0]?.url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
          const durationText = v.lengthText?.simpleText || "3:00";
          const durationSec = parseDurationToSeconds(durationText);
          
          tracks.push({
            id: videoId,
            title,
            artist,
            duration: durationSec,
            durationText,
            thumbnail,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            source: 'youtube'
          });
        }
      }
    } catch (err) {
      console.error("Error navigating JSON search tree:", err);
    }
  }

  // Pure scraping regex fallback
  if (tracks.length === 0) {
    const videoRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
    const matches = Array.from(html.matchAll(videoRegex));
    const uniqueIds = Array.from(new Set(matches.map(m => m[1]))).slice(0, 10);
    
    uniqueIds.forEach(id => {
      tracks.push({
        id,
        title: `YouTube Video (${id})`,
        artist: "YouTube Track",
        duration: 180,
        durationText: "3:00",
        thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${id}`,
        source: 'youtube'
      });
    });
  }

  return tracks;
}

// Private helper to extract playlist tracks
function parsePlaylistPage(html: string): YouTubeTrack[] {
  const tracks: YouTubeTrack[] = [];
  
  let ytInitialData: any = null;
  const match = html.match(/ytInitialData\s*=\s*({[\s\S]+?});/);
  if (match) {
    try {
      ytInitialData = JSON.parse(match[1]);
    } catch (e) {
      // Ignored
    }
  }

  if (ytInitialData) {
    try {
      const tabs = ytInitialData.contents?.twoColumnBrowseResultsRenderer?.tabs;
      const firstTab = tabs?.[0]?.tabRenderer;
      const content = firstTab?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer;
      const videos = content?.contents || [];
      
      for (const item of videos) {
        if (item.playlistVideoRenderer) {
          const v = item.playlistVideoRenderer;
          const videoId = v.videoId;
          if (!videoId) continue;
          
          const title = v.title?.runs?.map((r: any) => r.text).join("") || v.title?.simpleText || "Unknown Track";
          const artist = v.shortBylineText?.runs?.map((r: any) => r.text).join("") || "Unknown Artist";
          const thumbnail = v.thumbnail?.thumbnails?.[0]?.url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
          const durationText = v.lengthText?.simpleText || "3:00";
          const durationSec = parseDurationToSeconds(durationText);
          
          tracks.push({
            id: videoId,
            title,
            artist,
            duration: durationSec,
            durationText,
            thumbnail,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            source: 'youtube'
          });
        }
      }
    } catch (err) {
      console.error("Error navigating JSON playlist tree:", err);
    }
  }

  // Backup regex playlist matching
  if (tracks.length === 0) {
    const videoRegex = /"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/g;
    const matches = Array.from(html.matchAll(videoRegex));
    const uniqueIds = Array.from(new Set(matches.map(m => m[1]))).slice(0, 30);
    
    uniqueIds.forEach(id => {
      tracks.push({
        id,
        title: `YouTube Video (${id})`,
        artist: "YouTube Artist",
        duration: 180,
        durationText: "3:00",
        thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${id}`,
        source: 'youtube'
      });
    });
  }

  return tracks;
}

// Utility mapper
function parseDurationToSeconds(durationText: string): number {
  if (!durationText) return 180;
  const parts = durationText.split(":").map(Number);
  let duration = 0;
  if (parts.length === 2) {
    duration = parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return duration || 180;
}
