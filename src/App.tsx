import React, { useEffect, useState } from 'react';
import { PlaybackProvider, usePlayback } from './context/PlaybackContext';
import { SearchAndImport } from './components/SearchAndImport';
import { PlaylistTracks } from './components/PlaylistTracks';
import { ShareSync } from './components/ShareSync';
import { CuratedSamples } from './components/CuratedSamples';
import { VideoCanvas } from './components/VideoCanvas';
import { PlayerBar } from './components/PlayerBar';
import { Music, Clock, Github, Disc } from 'lucide-react';

function AppContent() {
  const { playlist, isPlayerReady, currentTrack } = usePlayback();
  const [utcTime, setUtcTime] = useState("");

  // Sync real-time UTC clock in page header
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setUtcTime(d.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-32 flex flex-col font-sans selection:bg-green-500 selection:text-black antialiased relative overflow-x-hidden">
      
      {/* Background ambient radial glowing layers */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] rounded-full bg-green-500/5 blur-[120px] pointer-events-none select-none z-0" />
      <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none select-none z-0" />

      {/* HEADER SECTION BAR */}
      <header id="global-header" className="relative z-10 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-black shadow-lg shadow-green-500/20">
            <Music size={20} className="fill-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              GrooveCast
              <span className="text-[9px] bg-neutral-800 text-neutral-400 font-mono tracking-wider font-semibold uppercase px-1.5 py-0.5 rounded ml-1 select-none border border-neutral-750">
                Spotify Import v1.4
              </span>
            </h1>
            <p className="text-[10px] text-neutral-400 font-medium">
              A high-end player proxying YouTube Playlist loaders dynamically
            </p>
          </div>
        </div>

        {/* METADATA CLOCK & INDICATOR */}
        <div className="flex items-center gap-4 flex-wrap text-xs text-neutral-400 font-mono">
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-850 px-3 py-1.5 rounded-full select-none">
            <Clock size={12} className="text-neutral-500" />
            <span>{utcTime || "Synchronizing GMT..."}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-850 rounded-full select-none">
            <Disc size={12} className={`text-green-500 ${isPlayerReady ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <span className="text-[10px] font-bold text-neutral-300">
              {isPlayerReady ? "API READY" : "LOADING YT ENGINE..."}
            </span>
          </div>
        </div>
      </header>

      {/* MAIN TWO-COLUMN DASHBOARD CONTENT CONTAINER */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 mt-8 flex-grow">
        
        {/* Welcome HUD Banner */}
        <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-neutral-900/80 to-neutral-900/30 border border-neutral-800/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-neutral-100 tracking-tight">
              A seamless gateway from YouTube Music to Spotify styling.
            </h2>
            <p className="text-xs text-neutral-400 max-w-2xl leading-normal">
              Directly load, play, search, and loop track queues with ease. Generate uppercase share keys in the "Backup & Share" card to copy playlists across different computers or mobile phones securely!
            </p>
          </div>
          
          <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-850 flex items-center gap-3.5 select-none self-start md:self-auto flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
              <Disc size={15} className="animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest leading-none mb-1">
                Active Session
              </p>
              <p className="text-[11px] font-mono font-bold text-white leading-none">
                {playlist.length} Loaded Tracks
              </p>
            </div>
          </div>
        </div>

        {/* Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT RAIL COLUMN: CONTROLLERS & EXPORTS */}
          <div className="lg:col-span-5 h-full flex flex-col space-y-6">
            
            {/* 1. ShareSync Module (Top Priority) */}
            <ShareSync />

            {/* 2. SearchAndImport Module */}
            <SearchAndImport />

            {/* 3. Curated Test Samplers */}
            <CuratedSamples />

          </div>

          {/* RIGHT RAIL COLUMN: MASTER SONGS LIST VIEW */}
          <div className="lg:col-span-7">
            <PlaylistTracks />
          </div>

        </div>
      </main>

      {/* Floating Collapsible YouTube Player canvas card */}
      <VideoCanvas />

      {/* Persistent Footer playerbar controller */}
      <PlayerBar />

    </div>
  );
}

export default function App() {
  return (
    <PlaybackProvider>
      <AppContent />
    </PlaybackProvider>
  );
}
