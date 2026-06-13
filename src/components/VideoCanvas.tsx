import React from 'react';
import { usePlayback } from '../context/PlaybackContext';
import { Minimize2, Maximize2, Tv, VolumeX, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const VideoCanvas: React.FC = () => {
  const { 
    currentTrack, 
    videoExpanded, 
    setVideoExpanded, 
    isMuted, 
    toggleMute,
    isPlayerReady 
  } = usePlayback();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end">
      {/* Floating Minimize/Maximize Button for Canvas */}
      <button
        onClick={() => setVideoExpanded(!videoExpanded)}
        id="btn-toggle-video-canvas"
        className="flex items-center gap-2 px-3 py-1.5 mb-2 bg-neutral-900 border border-neutral-800 rounded-full text-xs text-neutral-300 font-medium shadow-xl hover:text-white hover:bg-neutral-800 transition"
      >
        <Tv size={14} className={videoExpanded ? 'text-green-500' : 'text-neutral-400'} />
        <span>{videoExpanded ? 'Minimize Canvas' : 'Show Screen'}</span>
      </button>

      {/* Video Frame */}
      <div 
        className={`bg-neutral-950 border border-neutral-850 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ease-in-out ${
          videoExpanded 
            ? 'w-[320px] h-[180px] opacity-100 pointer-events-auto shadow-green-950/20' 
            : 'w-0 h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="relative w-full h-full">
          {/* Real YouTube Mounting Div */}
          <div id="yt-player" className="w-full h-full pointer-events-none" />

          {/* Canvas HUD Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-3 opacity-0 hover:opacity-100 transition-opacity duration-250">
            {/* Top Bar inside Video HUD */}
            <div className="flex justify-between items-center">
              <span className="text-[10px] bg-red-600 text-white font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                Live Feed
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={toggleMute}
                  className="p-1 rounded-full bg-neutral-950/60 text-white hover:bg-neutral-800 transition"
                >
                  {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
                <button 
                  onClick={() => setVideoExpanded(false)}
                  className="p-1 rounded-full bg-neutral-950/60 text-white hover:bg-neutral-800 transition"
                >
                  <Minimize2 size={12} />
                </button>
              </div>
            </div>

            {/* Bottom info inside Video HUD */}
            <div>
              <p className="text-white text-xs font-semibold truncate leading-none mb-1">
                {currentTrack.title}
              </p>
              <p className="text-neutral-300 text-[10px] truncate leading-none">
                {currentTrack.artist}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* If collapsed, keep a tiny 1x1 offline pixel in DOM as backup and initialization placeholder */}
      {!videoExpanded && (
        <div className="pointer-events-none opacity-0 absolute -bottom-96 -right-96 w-1 h-1 overflow-hidden">
          {/* Placeholder when full layout starts */}
          <div id="yt-player-offline-anchor" />
        </div>
      )}
    </div>
  );
};
