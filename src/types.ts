export interface Track {
  id: string; // YouTube videoId or custom unique ID
  title: string;
  artist: string;
  duration: number; // in seconds
  durationText: string;
  thumbnail: string;
  url: string;
  source: 'youtube' | 'custom';
}

export interface Playlist {
  id: string; // uppercase 6-char save code
  name: string;
  songs: Track[];
  createdAt: string; // date string
}
