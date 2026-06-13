import React from 'react';
import { usePlayback } from '../context/PlaybackContext';
import { Play, Trash2, Volume2, Music, Shuffle } from 'lucide-react';

export const PlaylistTracks: React.FC = () => {
  const { 
    playlist, 
    currentTrackIndex, 
    isPlaying, 
    playTrack, 
    removeTrackFromPlaylist,
    togglePlay,
    setPlaylist,
    isShuffle,
    toggleShuffle
  } = usePlayback();

  // Accumulate total duration in formatting
  const totalSeconds = playlist.reduce((acc, curr) => acc + (curr.duration || 180), 0);
  const formatTotalDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let result = '';
    if (hrs > 0) result += `${hrs} hr `;
    if (mins > 0 || hrs > 0) result += `${mins} min `;
    result += `${secs} sec`;
    return result;
  };

  const handleClearAll = () => {
    setPlaylist([], "Empty Playlist");
  };

  const handleShufflePlay = () => {
    if (playlist.length === 0) return;
    if (!isShuffle) {
      toggleShuffle();
    }
    const randomIndex = Math.floor(Math.random() * playlist.length);
    playTrack(randomIndex);
  };

  return (
    <div id="section-tracklist" className="bg-neutral-900/40 border border-neutral-800/65 rounded-xl p-6 h-[580px] flex flex-col">
      {/* Tracklist Top Stats */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Active Playback Playlist
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {playlist.length === 0 
              ? 'No songs in queue' 
              : `${playlist.length} song${playlist.length === 1 ? '' : 's'} • ${formatTotalDuration(totalSeconds)}`
            }
          </p>
        </div>
        
        {playlist.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleShufflePlay}
              className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 font-semibold px-3.5 py-1.5 rounded-full border border-neutral-850 transition"
            >
              <Shuffle size={12} className="text-green-500" />
              Shuffle Play
            </button>
            <button
              onClick={handleClearAll}
              id="btn-clear-active-playlist"
              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold px-3 py-1.5 rounded-full border border-red-500/10 transition"
            >
              Clear Queue
            </button>
          </div>
        )}
      </div>

      {/* Actual Tracklist Table */}
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
        {playlist.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-neutral-800 rounded-lg">
            <Music size={40} className="text-neutral-600 mb-3 animate-pulse" />
            <p className="text-sm font-semibold text-neutral-300">Your playlist is empty</p>
            <p className="text-xs text-neutral-500 max-w-xs mt-1 leading-relaxed">
              Use the curated samples card or input a YouTube link on the left to add songs to play!
            </p>
          </div>
        ) : (
          <div className="min-w-full">
            {/* Header format */}
            <div className="grid grid-cols-[30px_1fr_100px_48px] gap-2 px-3 py-1.5 text-[10px] uppercase font-bold text-neutral-500 border-b border-neutral-850 select-none mb-1">
              <span>#</span>
              <span>Title</span>
              <span className="text-right">Duration</span>
              <span className="text-center">Action</span>
            </div>

            {/* List Row items */}
            <div className="space-y-1">
              {playlist.map((track, idx) => {
                const isActive = idx === currentTrackIndex;
                
                return (
                  <div
                    key={`track-${track.id}-${idx}`}
                    className={`grid grid-cols-[30px_1fr_100px_48px] gap-2 items-center px-3 py-2.5 rounded-lg group transition duration-150 border ${
                      isActive 
                        ? 'bg-green-500/10 border-green-500/20 text-white' 
                        : 'bg-transparent border-transparent hover:bg-neutral-850/60'
                    }`}
                  >
                    {/* Index Column */}
                    <div className="text-xs font-mono text-neutral-500">
                      {isActive && isPlaying ? (
                        <div className="flex items-center gap-0.5 justify-center h-4 w-4">
                          <span className="w-0.5 h-3 bg-green-500 rounded-full animate-[bounce_1s_infinite_100ms]" />
                          <span className="w-0.5 h-4 bg-green-500 rounded-full animate-[bounce_1s_infinite_300ms]" />
                          <span className="w-0.5 h-2 bg-green-500 rounded-full animate-[bounce_1s_infinite_500ms]" />
                        </div>
                      ) : (
                        idx + 1
                      )}
                    </div>

                    {/* Meta Title / Artist Column */}
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img 
                        src={track.thumbnail} 
                        alt={track.title} 
                        className="w-9 h-9 object-cover rounded bg-neutral-900 flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="overflow-hidden">
                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-green-400' : 'text-neutral-200'}`}>
                          {track.title}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    {/* Duration Column */}
                    <div className="text-xs font-mono text-neutral-400 text-right select-none pr-1">
                      {track.durationText}
                    </div>

                    {/* Delete item controller */}
                    <div className="flex justify-center flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (isActive) {
                              togglePlay();
                            } else {
                              playTrack(idx);
                            }
                          }}
                          className={`p-1.5 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition ${
                            isActive ? 'bg-green-500 text-black' : 'hover:bg-neutral-800 text-neutral-300'
                          }`}
                          title={isActive && isPlaying ? 'Pause' : 'Play Track'}
                        >
                          {isActive && isPlaying ? (
                            <Volume2 size={11} className="animate-pulse" />
                          ) : (
                            <Play size={11} className={isActive ? 'fill-black' : ''} />
                          )}
                        </button>
                        
                        <button
                          onClick={() => removeTrackFromPlaylist(track.id)}
                          className="p-1.5 rounded-full text-neutral-500 hover:text-red-400 hover:bg-neutral-800 opacity-100 md:opacity-0 group-hover:opacity-100 transition"
                          title="Remove from queue"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
