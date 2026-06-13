import React, { useState } from 'react';
import { usePlayback } from '../context/PlaybackContext';
import { 
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1, 
  Volume2, VolumeX, Maximize2, Tv, Heart 
} from 'lucide-react';

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isShuffle,
    isLoop,
    currentTime,
    duration,
    volume,
    isMuted,
    videoExpanded,
    setVideoExpanded,
    
    togglePlay,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleLoop,
    seekTo,
    setVolume,
    toggleMute
  } = usePlayback();

  const [isLiked, setIsLiked] = useState(false);

  // Helper clock formatting
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === undefined) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer id="global-player-bar" className="fixed bottom-0 left-0 right-0 h-24 bg-neutral-950 border-t border-neutral-900 px-6 py-4 flex items-center justify-between z-50">
      
      {/* LEFT COMPARTMENT: ACTIVE SONG DETAIL */}
      <div className="w-1/4 min-w-[180px] flex items-center gap-4 select-none">
        {currentTrack ? (
          <>
            <img 
              src={currentTrack.thumbnail} 
              alt={currentTrack.title} 
              className="w-14 h-14 object-cover rounded shadow-lg bg-neutral-900 border border-neutral-850"
              referrerPolicy="no-referrer"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate hover:underline hover:text-green-400 cursor-pointer">
                {currentTrack.title}
              </p>
              <p className="text-xs text-neutral-400 truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>
            
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className="flex-shrink-0 ml-2 text-neutral-400 hover:text-white transition duration-150"
            >
              <Heart 
                size={16} 
                className={isLiked ? 'text-green-500 fill-green-500 scale-110' : 'hover:scale-105 active:scale-95'} 
              />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-neutral-900 rounded border border-neutral-850 flex items-center justify-center text-neutral-600">
              CD
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500">No active track playing</p>
              <p className="text-[10px] text-neutral-600 mt-0.5">Queue a song to begin</p>
            </div>
          </div>
        )}
      </div>

      {/* CENTER COMPARTMENT: PLAYBACK COMMAND BUTTONS & SEEK BAR */}
      <div className="flex flex-col items-center w-2/5 max-w-[600px]">
        
        {/* BUTTON BAR */}
        <div className="flex items-center gap-5 mb-2.5">
          {/* Shuffle button */}
          <button
            onClick={toggleShuffle}
            className={`transition duration-150 ${isShuffle ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`}
            title="Toggle Shuffle"
          >
            <Shuffle size={16} />
          </button>

          {/* Prev song button */}
          <button
            onClick={prevTrack}
            className="text-neutral-300 hover:text-white transition duration-150 disabled:opacity-30"
            disabled={!currentTrack}
            title="Previous Track"
          >
            <SkipBack size={18} className="fill-current" />
          </button>

          {/* Play/Pause Master Switch */}
          <button
            onClick={togglePlay}
            id="btn-play-pause-footer"
            className="w-8 h-8 rounded-full bg-white text-black hover:scale-105 active:scale-95 flex items-center justify-center transition duration-150 shadow"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={15} className="fill-black text-black" />
            ) : (
              <Play size={15} className="fill-black text-black translation px-1" />
            )}
          </button>

          {/* Next song button */}
          <button
            onClick={nextTrack}
            className="text-neutral-300 hover:text-white transition duration-150 disabled:opacity-30"
            disabled={!currentTrack}
            title="Next Track"
          >
            <SkipForward size={18} className="fill-current" />
          </button>

          {/* Loop Mode button */}
          <button
            onClick={toggleLoop}
            className={`relative transition duration-150 ${isLoop !== 'none' ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`}
            title={`Loop Mode: ${isLoop}`}
          >
            {isLoop === 'one' ? (
              <div className="flex items-center">
                <Repeat1 size={16} />
                <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-green-500 text-black font-bold h-3 w-3 rounded-full flex items-center justify-center">1</span>
              </div>
            ) : (
              <Repeat size={16} />
            )}
          </button>
        </div>

        {/* TIME BAR & SLIDER SLATE */}
        <div className="flex items-center gap-3 w-full font-mono text-[10px] text-neutral-500 select-none">
          <span>{formatTime(currentTime)}</span>
          
          <div className="relative flex-grow h-4 flex items-center group cursor-pointer">
            <input 
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full absolute inset-0 opacity-0 cursor-pointer z-10"
              disabled={!currentTrack}
            />
            {/* Custom Range Track styling */}
            <div className="w-full h-1 bg-neutral-800 rounded-full group-hover:h-1.5 transition-all">
              <div 
                className="h-full bg-neutral-400 group-hover:bg-green-500 rounded-full transition-all"
                style={{ width: `${currentPercent}%` }}
              />
            </div>
            {/* Sliding knob handle */}
            <div 
              className="absolute h-3 w-3 bg-white rounded-full scale-0 group-hover:scale-100 shadow transition-transform pointer-events-none"
              style={{ left: `calc(${currentPercent}% - 6px)` }}
            />
          </div>

          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* RIGHT COMPARTMENT: CANVAS DISCOVERY & VOLUME slider */}
      <div className="w-1/4 min-w-[180px] flex items-center justify-end gap-3 select-none">
        {/* Toggle YouTube Embed Canvas display status */}
        <button
          onClick={() => setVideoExpanded(!videoExpanded)}
          className={`p-1.5 rounded transition ${videoExpanded ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`}
          title="Toggle Canvas Video Display"
        >
          <Tv size={16} />
        </button>

        {/* Speak Mute toggle */}
        <button
          onClick={toggleMute}
          className="text-neutral-400 hover:text-white transition duration-150"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* Volume Level slider */}
        <div className="relative w-24 h-4 flex items-center group cursor-pointer">
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="w-full h-1 bg-neutral-800 rounded-full group-hover:h-1.5 transition-all">
            <div 
              className="h-full bg-neutral-400 group-hover:bg-green-500 rounded-full transition-all"
              style={{ width: `${isMuted ? 0 : volume}%` }}
            />
          </div>
          <div 
            className="absolute h-2.5 w-2.5 bg-white rounded-full scale-0 group-hover:scale-100 shadow transition-transform pointer-events-none"
            style={{ left: `calc(${isMuted ? 0 : volume}% - 5px)` }}
          />
        </div>
      </div>

    </footer>
  );
};
