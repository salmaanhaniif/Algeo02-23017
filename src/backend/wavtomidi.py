import librosa
from pretty_midi import *
import pkg_resources
import numpy as np

def wav_to_midi(wav_path, midi_path):
    # Load the WAV file
    y, sr = librosa.load(wav_path, sr=None)

    # Extract pitches and magnitudes
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)

    # Create a PrettyMIDI object
    midi = pretty_midi.PrettyMIDI()
    instrument = pretty_midi.Instrument(program=0)  # Acoustic Grand Piano

    # Iterate through the pitch matrix
    for time_idx in range(pitches.shape[1]):
        # Get the most dominant pitch at each time step
        pitch_idx = magnitudes[:, time_idx].argmax()
        pitch = pitches[pitch_idx, time_idx]

        # If a valid pitch is detected
        if pitch > 0:
            note_number = librosa.hz_to_midi(pitch)
            note = pretty_midi.Note(
                velocity=100,
                pitch=int(note_number),
                start=time_idx / sr,
                end=(time_idx + 1) / sr
            )
            instrument.notes.append(note)

    # Add instrument to MIDI
    midi.instruments.append(instrument)

    # Save to file
    midi.write(midi_path)