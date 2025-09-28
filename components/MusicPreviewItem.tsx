import React from 'react';
import { MusicTrack, PlayableMusicTrack } from '../types';
import { PlayIcon, PauseIcon, DownloadIcon, DeleteIcon } from './icons';

interface MusicPreviewItemProps {
  track: MusicTrack;
  onDelete: (id: number) => void;
  onPlay: (track: PlayableMusicTrack) => void;
  isCurrentlyPlaying: boolean;
  isPlaying: boolean;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const Shimmer: React.FC = () => (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
);


const MusicPreviewItem: React.FC<MusicPreviewItemProps> = ({ track, onDelete, onPlay, isCurrentlyPlaying, isPlaying }) => {

  const handlePlayPause = () => {
    if (track.isLoading) return;
    onPlay(track as PlayableMusicTrack);
  };
  
  const handleDownload = async () => {
    if (track.isLoading) return;
    try {
        const a = document.createElement("a");
        a.href = track.audioSrc;
        // Since it's a blob, the file extension is important. We'll use WAV.
        a.download = `${track.title.replace(/ /g, '_')}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        console.error("Download failed:", error);
        alert("Could not download the file.");
    }
  };

  if (track.isLoading) {
    return (
        <div className="relative overflow-hidden flex items-center bg-gray-700/50 p-4 rounded-lg shadow-md animate-pulse">
            <div className="w-12 h-12 bg-gray-600 rounded-full mr-4 flex-shrink-0"></div>
            <div className="flex-grow">
                <div className="h-5 w-3/5 bg-gray-600 rounded-md mb-2"></div>
                <div className="h-4 w-4/5 bg-gray-600 rounded-md"></div>
            </div>
            <Shimmer/>
        </div>
    );
  }

  return (
    <div className="flex items-center bg-gray-800 p-4 rounded-lg shadow-md transition-all duration-300 hover:bg-gray-700/50">
      <button 
        onClick={handlePlayPause}
        className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white transition-transform duration-200 transform hover:scale-105 mr-4 flex-shrink-0"
        aria-label={isCurrentlyPlaying && isPlaying ? "Pause" : "Play"}
      >
        {isCurrentlyPlaying && isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
      </button>

      <div className="flex-grow min-w-0">
        <h3 className="text-lg font-semibold text-white truncate">{track.title}</h3>
        <div className="text-sm text-gray-400 truncate flex items-center gap-2">
          <span className="font-medium text-gray-300">{formatTime(track.durationInSeconds ?? 0)}</span>
          <span className="px-2 py-0.5 bg-indigo-900/50 text-indigo-300 text-xs font-semibold rounded-full capitalize flex-shrink-0">{track.genre}</span>
          <p className="truncate">{track.description}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
        <button 
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200"
            aria-label="Download"
        >
          <DownloadIcon className="w-5 h-5" />
        </button>
        <button 
            onClick={() => onDelete(track.id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-900/30 rounded-full transition-colors duration-200"
            aria-label="Delete"
        >
          <DeleteIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MusicPreviewItem;
