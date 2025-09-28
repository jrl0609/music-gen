import { MusicGenerationParams } from '../types';

// --- Note & Scale Data ---
const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getNoteFrequency(note: string, octave: number = 4): number {
    const noteIndex = ALL_NOTES.indexOf(note);
    if (noteIndex === -1) return 0;
    const baseFrequency = 440; // A4
    const semitonesFromA4 = (noteIndex - 9) + (octave - 4) * 12;
    return baseFrequency * Math.pow(2, semitonesFromA4 / 12);
}

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

function getScaleNotes(rootNote: string, scaleType: 'major' | 'minor'): string[] {
    const intervals = scaleType === 'major' ? MAJOR_SCALE_INTERVALS : MINOR_SCALE_INTERVALS;
    const rootIndex = ALL_NOTES.indexOf(rootNote);
    return intervals.map(interval => ALL_NOTES[(rootIndex + interval) % 12]);
}

function parseChord(chordName: string): { root: string, type: 'major' | 'minor', notes: string[] } {
    const isMinor = chordName.includes('m');
    const root = chordName.replace('m', '');
    const rootIndex = ALL_NOTES.indexOf(root);
    const thirdInterval = isMinor ? 3 : 4;
    const fifthInterval = 7;
    const notes = [
        ALL_NOTES[rootIndex % 12],
        ALL_NOTES[(rootIndex + thirdInterval) % 12],
        ALL_NOTES[(rootIndex + fifthInterval) % 12],
    ];
    return { root, type: isMinor ? 'minor' : 'major', notes };
}

// --- Synthesis & Sequencing ---

// Helper for creating ADSR envelopes
function createEnvelope(context: AudioContext, startTime: number, duration: number, attack: number, decay: number, sustain: number, release: number) {
    const envelope = context.createGain();
    const noteEnd = startTime + duration - release;
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(1, startTime + attack);
    envelope.gain.exponentialRampToValueAtTime(sustain, startTime + attack + decay);
    if (noteEnd > startTime + attack + decay) {
       envelope.gain.setValueAtTime(sustain, noteEnd);
    }
    envelope.gain.linearRampToValueAtTime(0, startTime + duration);
    return envelope;
}

// Create different instrument sounds
function createInstrument(context: AudioContext, destination: GainNode, type: MusicGenerationParams['melodyInstrument'] | MusicGenerationParams['harmonyInstrument'] | MusicGenerationParams['bassInstrument'], freq: number, startTime: number, duration: number) {
    let osc1: OscillatorNode, osc2: OscillatorNode, envelope: GainNode;

    switch (type) {
        case 'piano':
        case 'xylophone':
            osc1 = context.createOscillator();
            osc1.type = 'triangle';
            osc1.frequency.value = freq;
            osc2 = context.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = freq * 2;
            envelope = createEnvelope(context, startTime, duration, 0.01, type === 'piano' ? 0.3 : 0.1, 0, 0.3);
            osc1.connect(envelope);
            osc2.connect(envelope).gain.value = 0.5; // Mix in the second oscillator quietly
            envelope.connect(destination);
            osc1.start(startTime);
            osc2.start(startTime);
            osc1.stop(startTime + duration);
            osc2.stop(startTime + duration);
            break;

        case 'synthPad':
            osc1 = context.createOscillator();
            osc1.type = 'sawtooth';
            osc1.frequency.value = freq;
            osc1.detune.value = -5; // Fatten the sound
            osc2 = context.createOscillator();
            osc2.type = 'sawtooth';
            osc2.frequency.value = freq;
            osc2.detune.value = 5;
            envelope = createEnvelope(context, startTime, duration, 0.2, 0.2, 0.6, 0.3);
            osc1.connect(envelope);
            osc2.connect(envelope);
            envelope.connect(destination);
            osc1.start(startTime);
            osc2.start(startTime);
            osc1.stop(startTime + duration);
            osc2.stop(startTime + duration);
            break;
        
        case 'synthLead':
             osc1 = context.createOscillator();
             osc1.type = 'square';
             osc1.frequency.value = freq;
             envelope = createEnvelope(context, startTime, duration, 0.05, 0.1, 0.7, 0.2);
             osc1.connect(envelope);
             envelope.connect(destination);
             osc1.start(startTime);
             osc1.stop(startTime + duration);
             break;

        case 'sineBass':
        case 'squareBass':
            osc1 = context.createOscillator();
            osc1.type = type === 'sineBass' ? 'sine' : 'square';
            osc1.frequency.value = freq;
            envelope = createEnvelope(context, startTime, duration, 0.02, 0.1, 0.8, 0.1);
            osc1.connect(envelope);
            envelope.connect(destination);
            osc1.start(startTime);
            osc1.stop(startTime + duration);
            break;
    }
}

// Procedural Drum Machine
function createPercussion(context: AudioContext, destination: GainNode, type: 'kick' | 'snare' | 'hihat', time: number) {
    if (type === 'kick') {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(time);
        osc.stop(time + 0.15);
    } else if (type === 'snare') {
        const noise = context.createBufferSource();
        const buffer = context.createBuffer(1, context.sampleRate * 0.2, context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        
        const filter = context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1500;
        
        const gain = createEnvelope(context, time, 0.2, 0.01, 0.1, 0, 0.1);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(destination);
        noise.start(time);
        noise.stop(time + 0.2)
    } else if (type === 'hihat') {
         const noise = context.createBufferSource();
        const buffer = context.createBuffer(1, context.sampleRate * 0.1, context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;

        const filter = context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        const gain = createEnvelope(context, time, 0.1, 0.01, 0.05, 0, 0.05);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(destination);
        noise.start(time);
        noise.stop(time + 0.1);
    }
}


async function createImpulseResponse(audioContext: AudioContext, duration: number, decay: number): Promise<AudioBuffer> {
    const length = audioContext.sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
    for (let i = 0; i < 2; i++) {
        const channel = impulse.getChannelData(i);
        for (let j = 0; j < length; j++) {
            channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, decay);
        }
    }
    return impulse;
}

export async function generateAudioFromParams(params: MusicGenerationParams): Promise<AudioBuffer> {
    const OfflineAudioContext = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const context = new OfflineAudioContext(2, 44100 * params.durationInSeconds, 44100);

    const masterGain = context.createGain();
    masterGain.gain.value = 0.4;
    
    // --- Effects (Reverb) ---
    const convolver = context.createConvolver();
    convolver.buffer = await createImpulseResponse(context, 2, 2);
    const wetGain = context.createGain();
    wetGain.gain.value = params.reverb;
    const dryGain = context.createGain();
    dryGain.gain.value = 1.0 - params.reverb * 0.5;
    
    masterGain.connect(dryGain);
    masterGain.connect(wetGain);
    wetGain.connect(convolver);
    convolver.connect(context.destination);
    dryGain.connect(context.destination);

    // --- Sequencer Logic ---
    const quarterNoteTime = 60 / params.bpm;
    const barTime = quarterNoteTime * 4;
    const chordProgression = params.chordProgression.map(parseChord);

    for (let time = 0; time < params.durationInSeconds; time += quarterNoteTime / 2) { // Loop in 8th notes
        const barIndex = Math.floor(time / barTime);
        const currentChord = chordProgression[barIndex % chordProgression.length];
        const beatInBar = (time % barTime) / quarterNoteTime;

        // --- Percussion ---
        if (params.percussionStyle !== 'none') {
            const isEighthNote = time % (quarterNoteTime / 2) === 0;
            const isQuarterNote = time % quarterNoteTime === 0;
            if (params.percussionStyle === 'lofi') {
                if (beatInBar === 0) createPercussion(context, masterGain, 'kick', time);
                if (beatInBar === 2) createPercussion(context, masterGain, 'snare', time);
                if (isEighthNote) createPercussion(context, masterGain, 'hihat', time);
            } else if (params.percussionStyle === 'fourOnTheFloor') {
                if (isQuarterNote) createPercussion(context, masterGain, 'kick', time);
                if (beatInBar === 2) createPercussion(context, masterGain, 'snare', time);
                if (isEighthNote) createPercussion(context, masterGain, 'hihat', time);
            }
        }
        
        // --- Bass & Harmony on downbeat of a new chord ---
        if (time % barTime === 0) {
            // Bass
            createInstrument(context, masterGain, params.bassInstrument, getNoteFrequency(currentChord.root, 2), time, barTime);
            // Harmony
            currentChord.notes.forEach(note => {
                createInstrument(context, masterGain, params.harmonyInstrument, getNoteFrequency(note, 4), time, barTime);
            });
        }
        
        // --- Melody ---
        if (Math.random() > 0.4) { // Don't play a melody note on every single beat
            const scaleNotes = getScaleNotes(currentChord.root, currentChord.type);
            const melodyNote = currentChord.notes[Math.floor(Math.random() * currentChord.notes.length)]; // Pick a chord tone
            createInstrument(context, masterGain, params.melodyInstrument, getNoteFrequency(melodyNote, 5), time, quarterNoteTime);
        }
    }

    return await context.startRendering();
}

// --- WAV Conversion ---

function bufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels,
          length = buffer.length * numOfChan * 2 + 44,
          bufferArr = new ArrayBuffer(length),
          view = new DataView(bufferArr),
          channels = [];
    let i, sample, offset = 0, pos = 0;

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([view], { type: 'audio/wav' });

    function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }
}

export function audioBufferToBlobUrl(buffer: AudioBuffer): string {
    const wavBlob = bufferToWav(buffer);
    return URL.createObjectURL(wavBlob);
}