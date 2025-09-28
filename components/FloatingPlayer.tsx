import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PlayableMusicTrack } from '../types';
import { PlayIcon, PauseIcon, VolumeUpIcon, VolumeOffIcon } from './icons';

interface FloatingPlayerProps {
  track: PlayableMusicTrack;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const FloatingPlayer: React.FC<FloatingPlayerProps> = ({ track, isPlaying, onTogglePlay }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(e => console.error("Audio play failed:", e));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (audio.src !== track.audioSrc) {
        audio.src = track.audioSrc;
        audio.load();
    }

    if (isPlaying) {
        audio.play().catch(e => console.error("Audio play failed on track change:", e));
    }
  }, [track, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const onLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const onTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = Number(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={track.audioSrc}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onTogglePlay} // Pauses the UI when song ends
        preload="auto"
      />
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800/80 backdrop-blur-md text-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-20 flex items-center justify-between">
                <div className="flex items-center space-x-4 min-w-0 w-1/3">
                    <div className="w-12 h-12 bg-indigo-500 rounded-md flex-shrink-0 animate-pulse"></div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                           <p className="font-bold truncate">{track.title}</p>
                           <span className="px-2 py-0.5 bg-indigo-900/50 text-indigo-300 text-xs font-semibold rounded-full capitalize flex-shrink-0">{track.genre}</span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">{track.description}</p>
                    </div>
                </div>

                <div className="flex flex-col items-center space-y-1 w-1/3">
                     <div className="flex items-center space-x-4">
                        <button onClick={onTogglePlay} className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors">
                            {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                        </button>
                    </div>
                    <div className="flex items-center space-x-2 w-full max-w-xs">
                        <span className="text-xs text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max={duration}
                            value={currentTime}
                            onChange={handleProgressChange}
                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm accent-indigo-500"
                        />
                         <span className="text-xs text-gray-400 w-10 text-left">{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-end space-x-3 w-1/3">
                    <button onClick={toggleMute} className="p-2 text-gray-400 hover:text-white transition-colors">
                        {isMuted || volume === 0 ? <VolumeOffIcon className="w-5 h-5"/> : <VolumeUpIcon className="w-5 h-5"/>}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm accent-indigo-500"
                    />
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default FloatingPlayer;