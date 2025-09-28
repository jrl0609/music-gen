import React from 'react';
import { MusicTrack, PlayableMusicTrack } from '../types';
import MusicPreviewItem from './MusicPreviewItem';

interface MusicPreviewListProps {
  musicTracks: MusicTrack[];
  onDelete: (id: number) => void;
  onPlay: (track: PlayableMusicTrack) => void;
  currentlyPlayingId?: number;
  isPlaying: boolean;
}

const MusicPreviewList: React.FC<MusicPreviewListProps> = ({ musicTracks, onDelete, onPlay, currentlyPlayingId, isPlaying }) => {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 shadow-lg h-full">
      <h2 className="text-2xl font-semibold mb-6 text-white">Generated Tracks</h2>
      {musicTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-500">Your generated music will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {musicTracks.map(track => (
            <MusicPreviewItem 
                key={track.id} 
                track={track} 
                onDelete={onDelete}
                onPlay={onPlay}
                isCurrentlyPlaying={track.id === currentlyPlayingId}
                isPlaying={isPlaying}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MusicPreviewList;
