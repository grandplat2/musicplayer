import React from 'react';
import { usePlayback } from '../context/PlaybackContext';
import { Track } from '../types';
import { Play, Plus, Sparkles, CheckCircle2 } from 'lucide-react';

const STATIC_SAMPLERS: Track[] = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    duration: 212,
    durationText: '3:32',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    source: 'youtube'
  },
  {
    id: 'JTMVOzPP8w4',
    title: 'Nookie',
    artist: 'Limp Bizkit',
    duration: 266,
    durationText: '4:26',
    thumbnail: 'https://img.youtube.com/vi/JTMVOzPP8w4/mqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=JTMVOzPP8w4',
    source: 'youtube'
  },
  {
    id: '34ONjMCu5cg',
    title: 'Starboy (ft. Daft Punk)',
    artist: 'The Weeknd',
    duration: 273,
    durationText: '4:33',
    thumbnail: 'https://img.youtube.com/vi/34ONjMCu5cg/mqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=34ONjMCu5cg',
    source: 'youtube'
  },
  {
    id: 'CSvFp5O6_Y4',
    title: 'Chop Suey!',
    artist: 'System Of A Down',
    duration: 210,
    durationText: '3:30',
    thumbnail: 'https://img.youtube.com/vi/CSvFp5O6_Y4/mqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=CSvFp5O6_Y4',
    source: 'youtube'
  }
];

export const CuratedSamples: React.FC = () => {
  const { addTrackToQueue, setPlaylist, playlist } = usePlayback();

  const loadStorySample = () => {
    // Standard requirements: Rick Astley & Limp Bizkit
    const storyTracks = STATIC_SAMPLERS.filter(s => s.id === 'dQw4w9WgXcQ' || s.id === 'JTMVOzPP8w4');
    setPlaylist(storyTracks, "Classic Samplers (Rick & Limp)");
  };

  const handleAdd = (track: Track) => {
    addTrackToQueue(track);
  };

  const handlePlayNow = (track: Track) => {
    // If playlist already has this tract, find its index, else append and play it
    const index = playlist.findIndex(t => t.id === track.id);
    if (index !== -1) {
      setPlaylist(playlist, "Default Queue", index);
    } else {
      setPlaylist([...playlist, track], "Custom Playlist", playlist.length);
    }
  };

  return (
    <div id="panel-curated-samples" className="bg-neutral-900/50 border border-neutral-800/80 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-green-500" />
          <h2 className="text-sm font-semibold tracking-wide text-neutral-250 uppercase">
            Curated Sampler Fixtures
          </h2>
        </div>
        <button
          onClick={loadStorySample}
          id="btn-load-rick-limp-samples"
          className="text-xs bg-green-500/10 border border-green-500/20 text-green-400 font-semibold px-4 py-1.5 rounded-full hover:bg-green-500 hover:text-black transition duration-200"
        >
          Load Rick & Limp Playlist
        </button>
      </div>

      <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
        Load the user-requested test songs ("Never Gonna Give You Up" & "Nookie") or add high-fidelity tracks to your playlist queue with one click.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {STATIC_SAMPLERS.map((track) => {
          const isCurrentlyInQueue = playlist.some(t => t.id === track.id);

          return (
            <div 
              key={track.id}
              className="flex items-center justify-between gap-3 p-2 bg-neutral-950/60 hover:bg-neutral-900 border border-neutral-850 rounded-lg group transition duration-150"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-neutral-900">
                  <img 
                    src={track.thumbnail} 
                    alt={track.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => handlePlayNow(track)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition duration-150"
                  >
                    <Play size={16} className="fill-white" />
                  </button>
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-semibold text-neutral-100 truncate group-hover:text-green-400 transition">
                    {track.title}
                  </h4>
                  <p className="text-[10px] text-neutral-400 truncate">
                    {track.artist}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[10px] font-mono text-neutral-500 px-1">
                  {track.durationText}
                </span>
                <button
                  onClick={() => handleAdd(track)}
                  disabled={isCurrentlyInQueue}
                  className={`p-1.5 rounded-full transition ${
                    isCurrentlyInQueue 
                      ? 'bg-neutral-800 text-green-500 cursor-not-allowed' 
                      : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-850'
                  }`}
                  title={isCurrentlyInQueue ? 'Already In Playlist' : 'Add to Playlist'}
                >
                  {isCurrentlyInQueue ? <CheckCircle2 size={13} /> : <Plus size={13} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
