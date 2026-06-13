import React, { useState } from 'react';
import { usePlayback } from '../context/PlaybackContext';
import { Track, Playlist } from '../types';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { FolderUp, FolderDown, Copy, Check, Loader2, Info, RefreshCw } from 'lucide-react';

export const ShareSync: React.FC = () => {
  const { playlist, setPlaylist } = usePlayback();

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportedCode, setExportedCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [exportName, setExportName] = useState('My Custom Jam List');
  const [exportError, setExportError] = useState('');

  // Import State
  const [importCode, setImportCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccessMessage, setImportSuccessMessage] = useState('');

  // Generate 6-char save code
  const generateSaveCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // 1. Export Playlist to Cloud
  const handleExportPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportError('');
    setExportedCode('');
    setIsCopied(false);

    if (playlist.length === 0) {
      setExportError("Your playlist is empty. Add some tracks before exporting!");
      return;
    }

    setIsExporting(true);
    let codeAttempt = generateSaveCode();

    try {
      const docRef = doc(db, 'playlists', codeAttempt);
      
      // Let's ensure the random code is unique (check if doc already exists)
      let docSnap;
      try {
        docSnap = await getDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `playlists/${codeAttempt}`);
      }

      // If document already exists, draw a new random code
      if (docSnap && docSnap.exists()) {
        codeAttempt = generateSaveCode();
      }

      // Write active queue to database with server request.time equivalent
      try {
        await setDoc(doc(db, 'playlists', codeAttempt), {
          id: codeAttempt,
          name: exportName.trim() || "Shared Cloud Playlist",
          songs: playlist,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `playlists/${codeAttempt}`);
      }

      setExportedCode(codeAttempt);
    } catch (err: any) {
      console.error(err);
      setExportError(err.message || "Failed to sync playlist to cloud storage.");
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Import Playlist with Save Code
  const handleImportPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    setImportSuccessMessage('');

    const code = importCode.trim().toUpperCase();
    if (code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
      setImportError("Save codes must be exactly 6 uppercase alphanumeric characters!");
      return;
    }

    setIsImporting(true);
    try {
      const docRef = doc(db, 'playlists', code);
      let docSnap;

      try {
        docSnap = await getDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `playlists/${code}`);
      }

      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        const songs: Track[] = data.songs || [];
        const playlistName = data.name || `Imported List (${code})`;

        setPlaylist(songs, playlistName);
        setImportSuccessMessage(`Loaded "${playlistName}" (${songs.length} track(s)) successfully!`);
        setImportCode('');
      } else {
        setImportError("This save code does not exist in our cloud database. Check for typos.");
      }
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || "Failed to load playlist from cloud.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(exportedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div id="panel-share-sync" className="bg-neutral-900/50 border border-neutral-800/80 rounded-xl p-5 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
        
        {/* EXPORT SIDE */}
        <div className="pb-5 md:pb-0 md:pr-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-widest flex items-center gap-2 mb-2">
              <FolderUp size={14} className="text-green-500" />
              Backup & Share Playlist
            </h3>
            <p className="text-[11px] text-neutral-400 mb-4 leading-relaxed">
              Export your current queue immediately. Generates a physical 6-digit sync key that persists permanently.
            </p>

            <form onSubmit={handleExportPlaylist} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Give your playlist a name..."
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-white placeholder-neutral-500 focus:outline-none focus:border-green-400 transition"
                  maxLength={50}
                />
              </div>

              <button
                type="submit"
                disabled={isExporting || playlist.length === 0}
                className="w-full bg-neutral-950 text-neutral-200 border border-neutral-800 hover:border-green-400 text-xs font-semibold py-2 rounded-lg hover:text-white disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {isExporting ? <Loader2 size={13} className="animate-spin" /> : 'Get Sync Save Code'}
              </button>
            </form>
          </div>

          <div className="mt-4">
            {exportError && (
              <p className="text-[11px] text-red-400 font-medium leading-normal bg-red-500/10 border border-red-500/10 p-2.5 rounded-lg flex items-center gap-2">
                <Info size={13} />
                {exportError}
              </p>
            )}

            {exportedCode && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex flex-col items-center gap-2 text-center">
                <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">
                  Playlist Saved & Syncable!
                </span>
                <span className="text-2xl font-mono font-bold text-white tracking-widest my-1 select-all">
                  {exportedCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs font-semibold text-black bg-green-500 hover:bg-green-400 px-4 py-1.5 rounded-full transition"
                >
                  {isCopied ? (
                    <>
                      <Check size={13} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      Copy Save Code
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* IMPORT SIDE */}
        <div className="pt-5 md:pt-0 md:pl-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-widest flex items-center gap-2 mb-2">
              <FolderDown size={14} className="text-green-500" />
              Load Existing Playlist
            </h3>
            <p className="text-[11px] text-neutral-400 mb-4 leading-relaxed">
              Enter any 6-digit sync save-key to synchronize of the cloud database of tracks directly into your player.
            </p>

            <form onSubmit={handleImportPlaylist} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="EX: A1B2C3"
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value.toUpperCase())}
                  className="flex-grow text-sm text-center font-mono font-bold tracking-widest bg-neutral-950 border border-neutral-800 rounded-lg py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-green-400 transition"
                  maxLength={6}
                />
                <button
                  type="submit"
                  disabled={isImporting || importCode.trim().length !== 6}
                  className="bg-green-500 text-black text-xs font-semibold px-4 rounded-lg hover:bg-green-400 disabled:opacity-50 transition flex items-center justify-center min-w-[75px]"
                >
                  {isImporting ? <Loader2 size={13} className="animate-spin" /> : 'Load'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4">
            {importError && (
              <p className="text-[11px] text-red-400 font-medium leading-normal bg-red-500/10 border border-red-500/10 p-2.5 rounded-lg flex items-center gap-2">
                <Info size={13} />
                {importError}
              </p>
            )}

            {importSuccessMessage && (
              <p className="text-[11px] text-green-400 font-medium leading-normal bg-green-500/10 border border-green-500/20 p-2.5 rounded-lg flex items-center gap-2">
                <Check size={13} />
                {importSuccessMessage}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
