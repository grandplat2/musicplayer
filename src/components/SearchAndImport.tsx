import React, { useState } from 'react';
import { usePlayback } from '../context/PlaybackContext';
import { Track } from '../types';
import { Search, ListMusic, Plus, Play, Loader2, Link2, Info } from 'lucide-react';

export const SearchAndImport: React.FC = () => {
  const { addTrackToQueue, setPlaylist, playlist } = usePlayback();
  
  // Tab selector: 'search' | 'import'
  const [activeTab, setActiveTab] = useState<'search' | 'import'>('search');

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Import States
  const [importInput, setImportInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState({ success: false, text: '' });

  // 1. Trigger Search Action
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error("Unable to search YouTube on this server");
      }
      const data = await response.json();
      setSearchResults(data.results || []);
      if ((data.results || []).length === 0) {
        setSearchError('No matching video tracts were found. Try another term.');
      }
    } catch (err: any) {
      console.error(err);
      setSearchError('An error occurred while communicating with the YouTube proxy.');
    } finally {
      setIsSearching(false);
    }
  };

  // 2. Trigger Custom YouTube Playlist / Track List Importer
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = importInput.trim();
    if (!input) return;

    setIsImporting(true);
    setImportFeedback({ success: false, text: '' });

    try {
      // Case A: Pasteur Playlist URL
      if (input.includes('list=')) {
        const response = await fetch(`/api/youtube/playlist?url=${encodeURIComponent(input)}`);
        if (!response.ok) throw new Error("Could not fetch playlist metadata.");
        const data = await response.json();
        
        const songs: Track[] = data.songs || [];
        if (songs.length === 0) {
          setImportFeedback({ success: false, text: 'No video tracks could be retrieved. Make sure playlist is public.' });
        } else {
          // Add all imported list
          songs.forEach(addTrackToQueue);
          setImportFeedback({ 
            success: true, 
            text: `Successfully imported playlist with ${songs.length} track(s)!` 
          });
          setImportInput('');
        }
      } 
      // Case B: Single YouTube Video URL / Video ID
      else if (input.includes('watch?v=') || input.includes('youtu.be/') || (input.length === 11 && !input.includes(' '))) {
        const response = await fetch(`/api/youtube/video?url=${encodeURIComponent(input)}`);
        if (!response.ok) throw new Error("Could not fetch single video details.");
        const data = await response.json();
        
        if (data.song) {
          addTrackToQueue(data.song);
          setImportFeedback({ 
            success: true, 
            text: `Added track "${data.song.title}" to your active playlist.` 
          });
          setImportInput('');
        } else {
          setImportFeedback({ success: false, text: 'Failed to retrieve track details for this YouTube URL.' });
        }
      } 
      // Case C: List of names (Text search imports)
      else {
        const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          setImportFeedback({ success: true, text: `Queued playlist builder: batch-searching ${lines.length} song(s)...` });
          
          let importCount = 0;
          for (const line of lines) {
            try {
              const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(line)}`);
              if (res.ok) {
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                  addTrackToQueue(data.results[0]);
                  importCount++;
                }
              }
            } catch (err) {
              console.error("Individual song load fail:", line, err);
            }
          }
          
          setImportFeedback({ 
            success: true, 
            text: `Completed text list import! successfully resolved and added ${importCount} song(s) out of ${lines.length}.` 
          });
          setImportInput('');
        }
      }
    } catch (err: any) {
      console.error(err);
      setImportFeedback({ 
        success: false, 
        text: err.message || 'Error occurred during track import. Please verify input.' 
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSearchResultPlay = (track: Track) => {
    addTrackToQueue(track);
    // Switch queue focus and play the last added track
    const newPlaylist = [...playlist, track];
    const indexIndex = playlist.some(t => t.id === track.id) 
      ? playlist.findIndex(t => t.id === track.id)
      : newPlaylist.length - 1;
    
    setPlaylist(playlist.some(t => t.id === track.id) ? playlist : newPlaylist, "Search Results Queue", indexIndex);
  };

  return (
    <div id="panel-search-import" className="bg-neutral-900/50 border border-neutral-800/80 rounded-xl p-5 mb-6">
      {/* Tab select trigger */}
      <div className="flex border-b border-neutral-800 mb-4">
        <button
          onClick={() => setActiveTab('search')}
          id="tab-trigger-search"
          className={`flex items-center gap-2 pb-2.5 px-4 text-xs font-semibold uppercase tracking-wider transition border-b-2 ${
            activeTab === 'search' 
              ? 'border-green-500 text-white' 
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Search size={14} />
          Search YouTube
        </button>
        <button
          onClick={() => setActiveTab('import')}
          id="tab-trigger-import"
          className={`flex items-center gap-2 pb-2.5 px-4 text-xs font-semibold uppercase tracking-wider transition border-b-2 ${
            activeTab === 'import' 
              ? 'border-green-500 text-white' 
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ListMusic size={14} />
          Import Playlists
        </button>
      </div>

      {/* SEARCH PANEL TAB */}
      {activeTab === 'search' && (
        <div>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search tracks or artists (e.g. Limp Bizkit Nookie)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-lg py-2.5 pl-9 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:border-green-400 transition"
              />
              <Search className="absolute left-3 top-3.5 text-neutral-500" size={14} />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-green-500 text-black text-xs font-semibold px-5 rounded-lg hover:bg-green-400 transition flex items-center justify-center gap-2 min-w-[90px]"
            >
              {isSearching ? <Loader2 size={13} className="animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          {searchError && (
            <p className="text-xs text-red-400 font-medium bg-red-500/15 border border-red-500/10 p-3 rounded-lg">
              {searchError}
            </p>
          )}

          <div className="space-y-2 max-h-[290px] overflow-y-auto custom-scrollbar">
            {searchResults.map((track) => {
              const isCurrentlyInQueue = playlist.some(t => t.id === track.id);
              return (
                <div 
                  key={`search-${track.id}`}
                  className="flex items-center justify-between gap-3 p-2 hover:bg-neutral-900 bg-neutral-950/20 border border-neutral-850 rounded-lg group transition duration-150"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img 
                      src={track.thumbnail} 
                      alt={track.title} 
                      className="w-10 h-10 object-cover rounded bg-neutral-900 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-semibold text-neutral-200 truncate group-hover:text-green-400 transition">
                        {track.title}
                      </h4>
                      <p className="text-[10px] text-neutral-400 truncate">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono text-neutral-500">
                      {track.durationText}
                    </span>
                    <button
                      onClick={() => handleSearchResultPlay(track)}
                      className="p-1.5 rounded-full bg-green-500 text-black hover:scale-105 active:scale-95 transition"
                      title="Play Immediately"
                    >
                      <Play size={10} className="fill-black" />
                    </button>
                    <button
                      onClick={() => addTrackToQueue(track)}
                      disabled={isCurrentlyInQueue}
                      className={`p-1.5 rounded-full transition ${
                        isCurrentlyInQueue 
                          ? 'bg-neutral-800 text-green-500' 
                          : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-850 hover:text-white'
                      }`}
                      title="Add to Playlist"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* IMPORT PANEL TAB */}
      {activeTab === 'import' && (
        <div>
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label className="block text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mb-1.5">
                Paste YouTube Resources or Raw Track List
              </label>
              <textarea
                rows={4}
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                placeholder="Paste here. Supports:&#10;1. YouTube Playlist URLs (e.g. music.youtube.com/playlist?list=PL...)&#10;2. YouTube watch video URLs (e.g. youtu.be/...)&#10;3. Names of songs separated by newlines (e.g. Rick Astley - Never Gonna Give You Up)"
                className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white placeholder-neutral-500 focus:outline-none focus:border-green-400 transition font-mono leading-relaxed resize-none"
              />
            </div>

            <div className="flex justify-between items-center bg-neutral-950 rounded-lg p-3 border border-neutral-850 text-[10px] text-neutral-400 leading-relaxed">
              <div className="flex items-start gap-2">
                <Link2 size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  Tip: Copy any YouTube or YouTube Music playlist URL from your browser address bar and paste here to import instantly!
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isImporting || !importInput.trim()}
              className="w-full bg-green-500 text-black text-xs font-semibold py-2.5 rounded-lg hover:bg-green-400 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {isImporting ? <Loader2 size={14} className="animate-spin" /> : 'Start Importer Engine'}
            </button>
          </form>

          {/* Import Feedback HUD */}
          {importFeedback.text && (
            <div className={`mt-4 p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 ${
              importFeedback.success 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              <span>{importFeedback.text}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
