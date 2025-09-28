export interface MusicTrackData {
  title: string;
  description: string;
  durationInSeconds: number;
  genre: string;
  audioSrc: string;
}

export type MusicTrack =
  | {
      id: number;
      isLoading: true;
    }
  | {
      id: number;
      isLoading: false;
      title: string;
      description: string;
      durationInSeconds: number;
      genre: string;
      audioSrc: string;
    };

export type PlayableMusicTrack = Extract<MusicTrack, { isLoading: false }>;

export interface MusicGenerationParams {
    title: string;
    description: string;
    bpm: number;
    key: string;
    chordProgression: string[]; // e.g., ["Am", "G", "C", "F"]
    melodyInstrument: 'piano' | 'xylophone' | 'synthLead';
    harmonyInstrument: 'synthPad' | 'piano';
    bassInstrument: 'sineBass' | 'squareBass';
    percussionStyle: 'lofi' | 'fourOnTheFloor' | 'none';
    durationInSeconds: number;
    reverb: number; // Value between 0.0 and 1.0
}