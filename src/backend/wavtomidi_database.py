import aubio
from midiutil import MIDIFile

def wav_to_midi(wav_file : str, midi_file : str):
    # 1. Baca file WAV dan setup aubio
    win_s = 1024  # ukuran window (harus sesuai dengan sampel)
    hop_s = 512   # ukuran hop
    samplerate = 0  # Biarkan 0 untuk mendeteksi otomatis

    pitch_o = aubio.pitch("default", win_s, hop_s, samplerate)
    pitch_o.set_unit("midi")  # Output sebagai notasi MIDI
    pitch_o.set_silence(-40)  # Threshold untuk keheningan (dB)

    # Buka file WAV
    source = aubio.source(wav_file, samplerate, hop_s)
    samplerate = source.samplerate

    pitches = []
    times = []

    # Proses data WAV
    total_frames = 0
    while True:
        samples, read = source()
        pitch = pitch_o(samples)[0]
        confidence = pitch_o.get_confidence()
        
        if confidence > 0.8:  # Ambil pitch hanya jika confidence tinggi
            pitches.append(pitch)
            times.append(total_frames / float(samplerate))

        total_frames += read
        if read < hop_s:
            break

    # 2. Buat file MIDI
    midi = MIDIFile(1)  # Satu track
    track = 0
    time = 0  # Mulai dari detik ke-0
    midi.addTrackName(track, time, "Query by Humming")
    midi.addTempo(track, time, 120)

    # Tambahkan nada ke file MIDI
    duration = 1  # Default durasi nada (1 detik)
    volume = 100  # Volume default (0-127)
    for i, pitch in enumerate(pitches):
        if pitch > 0:  # Abaikan nada dengan pitch 0
            midi.addNote(track, 0, int(pitch), times[i], duration, volume)

    # Simpan file MIDI
    with open(midi_file, "wb") as output_file:
        midi.writeFile(output_file)

    # print(f"MIDI file saved to {midi_file}")