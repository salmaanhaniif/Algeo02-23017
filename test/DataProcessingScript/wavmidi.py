import librosa
import mido
import numpy as np

# Function to extract pitches from audio
def extract_pitches_from_audio(audio_path):
    # Load the audio file
    y, sr = librosa.load(audio_path, sr=None)

    # Perform pitch tracking using librosa
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    pitches, magnitudes = librosa.core.piptrack(y=y, sr=sr)

    pitch_times = []
    pitch_values = []

    # Extract pitch times and values
    for t in range(magnitudes.shape[1]):
        index = magnitudes[:, t].argmax()  # get the index of the highest magnitude
        pitch = pitches[index, t]
        if pitch > 0:  # discard zero or silence
            pitch_values.append(pitch)
            pitch_times.append(librosa.frames_to_time(t, sr=sr))

    print(f"Extracted {len(pitch_times)} pitches.")
    print(f"Pitch times range from {min(pitch_times)} to {max(pitch_times)} seconds.")

    return pitch_times, pitch_values

# Function to create a MIDI file from pitch and timing data
def create_midi_from_pitches(pitch_times, pitch_values, midi_filename, duration_seconds, ticks_per_beat=480):
    # Create a new MIDI file
    midi = mido.MidiFile()
    track = mido.MidiTrack()
    midi.tracks.append(track)

    # MIDI note parameters
    velocity = 64  # MIDI velocity (volume)
    channel = 0  # MIDI channel (typically 0-15)

    # Total ticks for the entire duration (in seconds) for proper scaling
    total_ticks = int(ticks_per_beat * duration_seconds)  # Duration in ticks

    # Calculate time scale factor to convert seconds to MIDI ticks
    time_scale_factor = total_ticks / duration_seconds

    # Ensure the pitch times are within the 0 - duration range
    last_time = 0  # last time in ticks
    for i in range(1, len(pitch_times)):
        # Calculate the delta time (time between the current pitch and the last pitch)
        delta_time_seconds = pitch_times[i] - pitch_times[i - 1]
        
        # Scale delta time in seconds to MIDI ticks
        delta_time_ticks = int(delta_time_seconds * time_scale_factor)

        # Avoid negative or too small delta times (ensure it's at least 1 tick)
        delta_time_ticks = max(1, delta_time_ticks)

        note_number = int(librosa.hz_to_midi(pitch_values[i]))

        # Note on event with the calculated delta time (in ticks)
        track.append(mido.Message('note_on', note=note_number, velocity=velocity, time=delta_time_ticks))

        # Note off after some duration (500ms duration, converted to ticks)
        note_duration_ticks = int(0.5 * ticks_per_beat)  # 500ms in ticks
        track.append(mido.Message('note_off', note=note_number, velocity=velocity, time=note_duration_ticks))

        last_time = pitch_times[i]  # Update the last time

    # Save the MIDI file
    midi.save(midi_filename)
    print(f'MIDI file saved as {midi_filename}')

# Main function to convert wav to midi
def wav_to_midi(wav_filename, midi_filename, duration_seconds):
    pitch_times, pitch_values = extract_pitches_from_audio(wav_filename)
    create_midi_from_pitches(pitch_times, pitch_values, midi_filename, duration_seconds)

# Example usage
wav_filename = '1969.wav'  # Path to your WAV file
midi_filename = 'output2.mid'  # Path to save the generated MIDI file (updated name)
duration_seconds = 30  # Duration of the WAV file in seconds (30 seconds)

wav_to_midi(wav_filename, midi_filename, duration_seconds)
