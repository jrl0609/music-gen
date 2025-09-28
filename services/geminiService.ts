import { GoogleGenAI, Type } from "@google/genai";
import { MusicTrackData, MusicGenerationParams } from '../types';
import { generateAudioFromParams, audioBufferToBlobUrl } from './audioSynthService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const musicGenerationSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "A creative and fitting title for the music track, e.g., 'Crimson Horizon Overture'.",
      },
      description: {
        type: Type.STRING,
        description: "A detailed description including instruments, style, feeling, and genre. e.g., 'A lo-fi beat with a gentle piano melody over a warm synth pad, backed by a simple kick and hi-hat pattern'.",
      },
      bpm: {
        type: Type.INTEGER,
        description: "Beats per minute for the track, strictly between 70 and 140.",
      },
      key: {
        type: Type.STRING,
        description: "The musical key, e.g., 'C', 'F#', 'A'.",
      },
      chordProgression: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A 4-chord progression using standard chord names, e.g., ['Am', 'G', 'C', 'F'].",
      },
      melodyInstrument: {
        type: Type.STRING,
        description: "The lead instrument from this list: 'piano', 'xylophone', 'synthLead'.",
      },
      harmonyInstrument: {
        type: Type.STRING,
        description: "The background/chords instrument from this list: 'synthPad', 'piano'.",
      },
      bassInstrument: {
        type: Type.STRING,
        description: "The bass instrument from this list: 'sineBass', 'squareBass'.",
      },
      percussionStyle: {
        type: Type.STRING,
        description: "The drum pattern style from this list: 'lofi', 'fourOnTheFloor', 'none'.",
      },
      durationInSeconds: {
        type: Type.INTEGER,
        description: "The total duration of the loop in seconds, between 15 and 45.",
      },
      reverb: {
        type: Type.NUMBER,
        description: "The amount of reverb (ambience), a value between 0.1 (dry) and 0.8 (spacious).",
      },
    },
    required: ["title", "description", "bpm", "key", "chordProgression", "melodyInstrument", "harmonyInstrument", "bassInstrument", "percussionStyle", "durationInSeconds", "reverb"],
  },
};

export const generateMusicMetadata = async (prompt: string): Promise<MusicTrackData[]> => {
  try {
    const fullPrompt = `Based on the following user prompt, generate the musical parameters for two distinct instrumental music tracks.
For each track:
1. Create a standard 4-chord progression (e.g., ["Am", "G", "C", "F"]).
2. Select instruments for melody, harmony, and bass from the provided lists.
3. Choose a percussion style.
4. Generate a creative title, description, bpm, key, and reverb level that match the instruments and chords.
Ensure the two tracks are unique variations.
User prompt: "${prompt}"`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: musicGenerationSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedParamsArray: MusicGenerationParams[] = JSON.parse(jsonText);

    if (!Array.isArray(parsedParamsArray) || parsedParamsArray.length < 2) {
        throw new Error("AI response did not contain two music tracks' parameters.");
    }
    
    const tracksWithAudioPromises = parsedParamsArray.slice(0, 2).map(async (params) => {
      // Use the melody instrument as the genre tag for clear identification.
      const genre = params.melodyInstrument; 
      
      const audioBuffer = await generateAudioFromParams(params);
      const audioSrc = audioBufferToBlobUrl(audioBuffer);

      return {
        title: params.title,
        description: params.description,
        durationInSeconds: params.durationInSeconds,
        genre: genre,
        audioSrc: audioSrc,
      };
    });

    const tracksWithAudio = await Promise.all(tracksWithAudioPromises);

    return tracksWithAudio;

  } catch (error) {
    console.error("Error calling Gemini API or generating audio:", error);
    throw new Error("Failed to generate music from AI.");
  }
};