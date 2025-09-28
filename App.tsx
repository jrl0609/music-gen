import React, { useState, useCallback } from 'react';
import { MusicTrack, PlayableMusicTrack } from './types';
import { generateMusicMetadata } from './services/geminiService';
import PromptInput from './components/PromptInput';
import MusicPreviewList from './components/MusicPreviewList';
import FloatingPlayer from './components/FloatingPlayer';

const MAX_TRACKS = 20;

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>("An epic cinematic trailer score with powerful drums, soaring strings, and heroic brass melodies.");
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [currentlyPlaying, setCurrentlyPlaying] = useState<PlayableMusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const handleGenerate = useCallback(async () => {
    if (isLoading) return;

    if (musicTracks.length + 2 > MAX_TRACKS) {
      setError(`Cannot generate more music. The preview list is full (max ${MAX_TRACKS} tracks). Please delete some tracks to continue.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadingTrack1: MusicTrack = { id: Date.now(), isLoading: true };
    const loadingTrack2: MusicTrack = { id: Date.now() + 1, isLoading: true };

    setMusicTracks(prev => [loadingTrack1, loadingTrack2, ...prev]);

    try {
      const newTracksData = await generateMusicMetadata(prompt);
      
      setMusicTracks(prev => {
        const updatedTracks = [...prev];
        const index1 = updatedTracks.findIndex(t => t.id === loadingTrack1.id);
        if (index1 !== -1) {
          updatedTracks[index1] = {
            id: loadingTrack1.id,
            isLoading: false,
            ...newTracksData[0],
          };
        }
        
        const index2 = updatedTracks.findIndex(t => t.id === loadingTrack2.id);
        if (index2 !== -1) {
          updatedTracks[index2] = {
            id: loadingTrack2.id,
            isLoading: false,
            ...newTracksData[1],
          };
        }
        return updatedTracks;
      });

    } catch (err) {
      console.error("Failed to generate music:", err);
      setError("Sorry, we couldn't generate your music. Please try again.");
      setMusicTracks(prev => prev.filter(t => t.id !== loadingTrack1.id && t.id !== loadingTrack2.id));
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, musicTracks.length]);

  const handleDelete = useCallback((id: number) => {
    setMusicTracks(prev => {
        const newTracks = prev.filter(track => track.id !== id);
        if (currentlyPlaying?.id === id) {
            setCurrentlyPlaying(null);
            setIsPlaying(false);
        }
        return newTracks;
    });
    if (musicTracks.length <= MAX_TRACKS + 1) { // +1 because state update is async
        setError(null);
    }
  }, [musicTracks.length, currentlyPlaying]);

  const handlePlay = useCallback((track: PlayableMusicTrack) => {
    if (currentlyPlaying?.id === track.id) {
      setIsPlaying(prev => !prev);
    } else {
      setCurrentlyPlaying(track);
      setIsPlaying(true);
    }
  }, [currentlyPlaying]);

  const handleTogglePlay = useCallback(() => {
    if (currentlyPlaying) {
        setIsPlaying(prev => !prev);
    }
  }, [currentlyPlaying]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8 pb-28">
      <main className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            AI Music Generator
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Craft instrumental masterpieces from your imagination.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={handleGenerate}
              isLoading={isLoading}
              isLimitReached={musicTracks.length >= MAX_TRACKS}
              error={error}
            />
          </div>
          <div className="lg:col-span-2">
            <MusicPreviewList
                musicTracks={musicTracks}
                onDelete={handleDelete}
                onPlay={handlePlay}
                currentlyPlayingId={currentlyPlaying?.id}
                isPlaying={isPlaying}
            />
          </div>
        </div>
      </main>
      {currentlyPlaying && (
        <FloatingPlayer 
            track={currentlyPlaying}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
        />
      )}
    </div>
  );
};

export default App;
