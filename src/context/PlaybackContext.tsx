import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Track } from '../types';

interface PlaybackContextType {
  playlist: Track[];
  currentTrackIndex: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  isShuffle: boolean;
  isLoop: 'none' | 'all' | 'one';
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  activePlaylistName: string;
  isPlayerReady: boolean;
  videoExpanded: boolean;
  setVideoExpanded: (val: boolean) => void;
  
  setPlaylist: (tracks: Track[], playlistName?: string, startIndex?: number) => void;
  playTrack: (index: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  addTrackToQueue: (track: Track) => void;
  removeTrackFromPlaylist: (trackId: string) => void;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT: any;
  }
}

export const PlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlist, setPlaylistState] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isLoop, setIsLoop] = useState<'none' | 'all' | 'one'>('none');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180);
  const [volume, setVolumeState] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activePlaylistName, setActivePlaylistName] = useState<string>("Default Queue");
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [videoExpanded, setVideoExpanded] = useState<boolean>(false);

  // Keep references to player and sync timers
  const playerRef = useRef<any>(null);
  const timeUpdateInterval = useRef<Record<string, any> | null>(null);

  const currentTrack = currentTrackIndex >= 0 && currentTrackIndex < playlist.length 
    ? playlist[currentTrackIndex] 
    : null;

  // 1. Initialize YouTube Player API
  useEffect(() => {
    // If the YT library is already available, build the player
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Load YouTube Player API Script synchronously
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    }

    return () => {
      stopInterval();
    };
  }, []);

  const initPlayer = () => {
    try {
      playerRef.current = new window.YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0, // Hide YouTube native UI controls
          disablekb: 1, // Disable keyboard gestures to avoid interfering
          fs: 0, // Disable full screen toggle
          modestbranding: 1, // Hide YouTube logo overlay
          rel: 0, // Stop suggestions
          iv_load_policy: 3, // Disable annotations
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            event.target.setVolume(volume);
          },
          onStateChange: (event: any) => {
            // Player states:
            // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: cued
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              const trackDur = event.target.getDuration();
              if (trackDur) setDuration(trackDur);
              startInterval();
            } else if (state === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              stopInterval();
            } else if (state === window.YT.PlayerState.ENDED) {
              handleTrackEnded();
            }
          },
          onError: (event: any) => {
            console.error("YouTube Player error:", event.data);
            // Auto skip failed tracks
            setTimeout(() => {
              nextTrack();
            }, 1000);
          }
        }
      });
    } catch (e) {
      console.error("Failed to construct YouTube Player iframe", e);
    }
  };

  // Sync seekbar timer
  const startInterval = () => {
    stopInterval();
    timeUpdateInterval.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const curTime = playerRef.current.getCurrentTime();
        setCurrentTime(curTime);
        const totalDur = playerRef.current.getDuration();
        if (totalDur && totalDur !== duration) {
          setDuration(totalDur);
        }
      }
    }, 500);
  };

  const stopInterval = () => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current as any);
      timeUpdateInterval.current = null;
    }
  };

  // 2. Control Methods
  const setPlaylist = (tracks: Track[], playlistName = "Active Queue", startIndex = 0) => {
    setPlaylistState(tracks);
    setActivePlaylistName(playlistName);
    if (tracks.length > 0) {
      // Safeguard start index bounds
      const validIndex = startIndex >= 0 && startIndex < tracks.length ? startIndex : 0;
      setCurrentTrackIndex(validIndex);
      // Wait slightly for DOM to settle then play
      setTimeout(() => {
        loadAndPlay(tracks[validIndex].id);
      }, 50);
    } else {
      setCurrentTrackIndex(-1);
      setIsPlaying(false);
      if (playerRef.current && typeof playerRef.current.stopVideo === 'function') {
        playerRef.current.stopVideo();
      }
    }
  };

  const loadAndPlay = (videoId: string) => {
    if (playerRef.current && isPlayerReady && typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById({
        videoId: videoId,
        suggestedQuality: 'default'
      });
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  const playTrack = (index: number) => {
    if (index >= 0 && index < playlist.length) {
      setCurrentTrackIndex(index);
      loadAndPlay(playlist[index].id);
    }
  };

  const togglePlay = () => {
    if (!playerRef.current || !isPlayerReady) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      if (currentTrackIndex === -1 && playlist.length > 0) {
        // Start from first track
        setCurrentTrackIndex(0);
        loadAndPlay(playlist[0].id);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    }
  };

  const nextTrack = () => {
    if (playlist.length === 0) return;

    if (isLoop === 'one') {
      // Simply seek back to 0
      seekTo(0);
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      }
      return;
    }

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      setCurrentTrackIndex(randomIndex);
      loadAndPlay(playlist[randomIndex].id);
      return;
    }

    const nextIdx = currentTrackIndex + 1;
    if (nextIdx < playlist.length) {
      setCurrentTrackIndex(nextIdx);
      loadAndPlay(playlist[nextIdx].id);
    } else if (isLoop === 'all') {
      // Loop back to start
      setCurrentTrackIndex(0);
      loadAndPlay(playlist[0].id);
    } else {
      // Stop at the end of queue
      setIsPlaying(false);
      if (playerRef.current && typeof playerRef.current.stopVideo === 'function') {
        playerRef.current.stopVideo();
      }
    }
  };

  const prevTrack = () => {
    if (playlist.length === 0) return;

    // If more than 3 seconds elapsed, restart the current track instead of previous
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      setCurrentTrackIndex(randomIndex);
      loadAndPlay(playlist[randomIndex].id);
      return;
    }

    const prevIdx = currentTrackIndex - 1;
    if (prevIdx >= 0) {
      setCurrentTrackIndex(prevIdx);
      loadAndPlay(playlist[prevIdx].id);
    } else if (isLoop === 'all') {
      const lastIndex = playlist.length - 1;
      setCurrentTrackIndex(lastIndex);
      loadAndPlay(playlist[lastIndex].id);
    } else {
      // Seek back to 0 of first song
      seekTo(0);
    }
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  const toggleShuffle = () => {
    setIsShuffle(prev => !prev);
  };

  const toggleLoop = () => {
    setIsLoop(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  const seekTo = (seconds: number) => {
    if (playerRef.current && isPlayerReady && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  };

  const setVolume = (val: number) => {
    const safeVolume = Math.max(0, Math.min(100, val));
    setVolumeState(safeVolume);
    if (playerRef.current && isPlayerReady && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(safeVolume);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current || !isPlayerReady) return;
    
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
      playerRef.current.setVolume(volume);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const addTrackToQueue = (track: Track) => {
    setPlaylistState(prev => {
      // Check for duplicate in the active queue to avoid key issues
      const exists = prev.some(t => t.id === track.id);
      if (exists) return prev;
      const updated = [...prev, track];
      if (currentTrackIndex === -1) {
        // Queue was empty, boot play
        setCurrentTrackIndex(0);
        setTimeout(() => loadAndPlay(track.id), 50);
      }
      return updated;
    });
  };

  const removeTrackFromPlaylist = (trackId: string) => {
    setPlaylistState(prev => {
      const removeIdx = prev.findIndex(t => t.id === trackId);
      if (removeIdx === -1) return prev;
      
      const newPlaylist = prev.filter(t => t.id !== trackId);
      
      if (currentTrackIndex === removeIdx) {
        // Removing the active playing song
        if (newPlaylist.length === 0) {
          setCurrentTrackIndex(-1);
          setIsPlaying(false);
          if (playerRef.current && typeof playerRef.current.stopVideo === 'function') {
            playerRef.current.stopVideo();
          }
        } else {
          // Play next track or clamp index
          const nextIdx = removeIdx >= newPlaylist.length ? newPlaylist.length - 1 : removeIdx;
          setCurrentTrackIndex(nextIdx);
          setTimeout(() => loadAndPlay(newPlaylist[nextIdx].id), 50);
        }
      } else if (currentTrackIndex > removeIdx) {
        // Shift active playing index left by 1 to maintain current track
        setCurrentTrackIndex(currentTrackIndex - 1);
      }
      
      return newPlaylist;
    });
  };

  return (
    <PlaybackContext.Provider value={{
      playlist,
      currentTrackIndex,
      currentTrack,
      isPlaying,
      isShuffle,
      isLoop,
      currentTime,
      duration,
      volume,
      isMuted,
      activePlaylistName,
      isPlayerReady,
      videoExpanded,
      setVideoExpanded,
      
      setPlaylist,
      playTrack,
      togglePlay,
      nextTrack,
      prevTrack,
      toggleShuffle,
      toggleLoop,
      seekTo,
      setVolume,
      toggleMute,
      addTrackToQueue,
      removeTrackFromPlaylist
    }}>
      {children}
    </PlaybackContext.Provider>
  );
};

export const usePlayback = () => {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
};
