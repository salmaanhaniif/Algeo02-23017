import mido
from mido import MidiFile, MidiTrack
import numpy as np
import os
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

    print(f"MIDI file saved to {midi_file}")

# just for testing purposes
def cut_midi(input_file, output_file, start_time, end_time):
    midi = MidiFile(input_file)
    new_midi = MidiFile()
    
    for i, track in enumerate(midi.tracks):
        new_track = MidiTrack()
        new_midi.tracks.append(new_track)

        time_passed = 0  # untuk melacak waktu yang telah diproses
        for msg in track:
            time_passed += msg.time  # Update waktu yang telah dilewati
            if time_passed >= start_time and time_passed <= end_time:
                new_track.append(msg)  # Menambahkan pesan jika dalam rentang waktu
            elif time_passed > end_time:
                break  # Menghentikan jika sudah melewati end_time
    
    # Menyimpan MIDI yang telah dipotong ke file baru
    new_midi.save(output_file)


def extract_melody(midi_file_path, channel=0):
    """
    Ekstrak melodi dari file MIDI berdasarkan channel tertentu.
    Jika tidak ditemukan, lanjut ke channel berikutnya hingga channel 15.
    """
    midi = MidiFile(midi_file_path)
    melody_notes = []

    for track in midi.tracks:
        for msg in track:
            if msg.type == 'note_on' and msg.channel == channel and msg.velocity > 0:
                melody_notes.append(msg.note)  # Simpan pitch (note)

    if not melody_notes or len(melody_notes) < 40:  # Jika melodi tidak ditemukan atau terlalu sedikit
        if channel < 15:  # Lanjut ke channel berikutnya
            return extract_melody(midi_file_path, channel + 1)
        else:
            print(f"Melody not found in any channel for {midi_file_path}.")
            return None
    else:
        return melody_notes


def sliding_window(data, window_size, step_size):
    windows = []
    for start in range(0, len(data), step_size):
        end = start + window_size
        if end > len(data):
            break
        window = data[start:end]
        windows.append(window)
    return windows

# Fungsi untuk menghitung rata-rata (mean)
def calculate_mean(pitches):
    return np.mean(pitches)

# Fungsi untuk menghitung standar deviasi (stddev)
def calculate_stddev(pitches):
    return np.std(pitches)

# Fungsi untuk normalisasi pitch
def normalize_pitch(pitches, melody):
    mean = calculate_mean(melody)
    stddev = calculate_stddev(melody)
    
    normalized = [(pitch - mean) / stddev for pitch in pitches]
    return normalized

def atb_histogram(melody):
    # Membuat histogram dengan 128 bin (0-127 untuk MIDI)
    histogram, _ = np.histogram(melody, bins=np.arange(129))  # 128 bin, 0 sampai 127
    
    # Normalisasi histogram (menghitung distribusi probabilitas)
    total_notes = sum(histogram)  # Jumlah total nada yang muncul
    if total_notes == 0:
        return histogram  # Jika tidak ada nada, return histogram kosong
    
    normalized_histogram = histogram / total_notes  # Normalisasi
    
    return normalized_histogram

def atb_for_windows(windows, windowSize, stepSize):
    atb_windows = []
    for window in windows:
        atb = atb_histogram(window)  # ATB untuk tiap window
        atb_windows.append(atb)
    return atb_windows

def rtb_histogram(melody):
    diffs = [melody[i+1] - melody[i] for i in range(len(melody)-1)]
    
    hist, bins = np.histogram(diffs, bins=np.arange(-128, 128, 1))
    
    # Normalisasi histogram
    hist_normalized = hist / np.sum(hist)
    
    return hist_normalized

def rtb_for_windows(windows, windowSize, stepSize):
    rtb_windows = []
    for window in windows:
        rtb = rtb_histogram(window)  # ATB untuk tiap window
        rtb_windows.append(rtb)
    return rtb_windows

def ftb_histogram(melody):
    diffs = [melody[i] - melody[0] for i in range(len(melody))]
    
    hist, bins = np.histogram(diffs, bins=np.arange(-128, 128, 1))
    
    # Normalisasi histogram
    hist_normalized = hist / np.sum(hist)
    
    return hist_normalized
def ftb_for_windows(windows, windowSize, stepSize):
    ftb_windows = []
    for window in windows:
        ftb = ftb_histogram(window)
        ftb_windows.append(ftb)
    return ftb_windows

def cosine_similarity(atb1, atb2):
    # Menghitung dot product antara dua vektor
    dot_product = np.dot(atb1, atb2)
    
    # Menghitung norma (magnitude) dari kedua vektor
    norm_atb1 = np.linalg.norm(atb1)
    norm_atb2 = np.linalg.norm(atb2)
    if norm_atb1 == 0 or norm_atb2 == 0:
        return 0  
    # Menghitung cosine similarity
    similarity = dot_product / (norm_atb1 * norm_atb2)
    
    return similarity

def compare_similarity(folder_path, query_file):
    # query_path = os.path.join(folder_path, query_file)
    query_melody = extract_melody(query_file,0)

    if not query_melody:
        print(f"No melody extracted from {query_file}")
        return

    query_windows = sliding_window(query_melody, 40, 4)
    normalized_query = normalize_pitch(query_windows, query_melody)
    query_atb= atb_for_windows(normalized_query, 40, 4)
    query_rtb = rtb_for_windows(normalized_query, 40, 4)
    query_ftb = ftb_for_windows(normalized_query, 40, 4)

    midi_files = [f for f in os.listdir(folder_path) if f.endswith('.mid')]
    similarityq = []
    for midi_file in midi_files:
        midi_path = os.path.join(folder_path, midi_file)

        midi_melody = extract_melody(midi_path,0)

        if not midi_melody:
            print(f"No melody extracted from {midi_file}")
            continue

        data_windows = sliding_window(midi_melody, 40, 4)
        normalized_data = normalize_pitch(data_windows, midi_melody)
        data_atb = atb_for_windows(normalized_data, 40, 4)
        data_rtb = rtb_for_windows(normalized_data, 40, 4)
        data_ftb = ftb_for_windows(normalized_data, 40, 4)
        # Menghitung cosine similarity antar ATB query dan midi file
        avg = 0
        for i in range(len(query_atb)):
            if cosine_similarity(query_atb[i], data_atb[0]) > 0.8:
                tempavg = 0;
                tempctr = 0;
                for j in range(0, len(data_atb)) :
                    if j+i < len(query_atb)-i :
                        tempavg += cosine_similarity(query_atb[i+j], data_atb[j])
                        tempctr += 1
                if tempctr>0:
                    tempavg = tempavg/tempctr

                if tempavg>avg :
                    avg = tempavg

        avg1 = 0
        avg2 = 0

        for i in range(len(query_rtb)):
            if cosine_similarity(query_rtb[i], data_rtb[0]) > 0.8:
                tempavg = 0;
                tempctr = 0;
                for j in range(0, len(data_rtb)) :
                    if j+i < len(query_rtb)-i :
                        tempavg += cosine_similarity(query_rtb[i+j], data_rtb[j])
                        tempctr += 1
                if tempctr>0:
                    tempavg = tempavg/tempctr

                if tempavg>avg1 :
                    avg1 = tempavg

            if cosine_similarity(query_ftb[i], data_ftb[0]) > 0.8:
                tempavg = 0;
                tempctr = 0;
                for j in range(0, len(data_ftb)) :
                    if j+i < len(query_ftb)-i :
                        tempavg += cosine_similarity(query_ftb[i+j], data_ftb[j])
                        tempctr += 1
                if tempctr>0:
                    tempavg = tempavg/tempctr

                if tempavg>avg2 :
                    avg2 = tempavg

            # Menggabungkan similarity menggunakan bobot
        final_similarity = (0.5 * avg + 0.3 * avg1 + 0.2 * avg2)
        similarity_percent = final_similarity * 100

        if similarity_percent > 90:
            similarityq.append([similarity_percent, midi_file])

    similarityq = sorted(similarityq, key=lambda x: x[0], reverse=True)
    for sim in similarityq:
        sim[0] = str(sim[0].round(2)) + "%"  

    return similarityq

# def main():
    # similarity = compare_similarity("Algeo02-23017\src\frontend\public\uploads\audio", "pirate.mid")
    # print(similarity)
    # print("Nilai similaritas tertinggi: ",sorted_similarities[0][0])
    # print("Nama file: ", sorted_similarities[0][1])
    # melody = extract_melody("Audio/x (26).mid",0)
    # print(melody)

# main()