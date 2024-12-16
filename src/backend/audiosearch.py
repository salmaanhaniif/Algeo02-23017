from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import utils.A_R_FTB as ad

app = Flask(__name__)
CORS(app)
# Direktori untuk menyimpan file upload
UPLOAD_FOLDER = os.path.abspath('../frontend/public/uploads/audio')
QUERY_FOLDER = os.path.abspath('../frontend/public/query/audio')
TEMP_FOLDER = os.path.abspath('../frontend/public/query/temp')

print(f"Expected files in {UPLOAD_FOLDER}: {os.listdir(UPLOAD_FOLDER)}")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(QUERY_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['QUERY_FOLDER'] = QUERY_FOLDER
app.config['TEMP_FOLDER'] = TEMP_FOLDER
ALLOWED_EXTENSIONS = {'mid', 'midi', 'wav'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/search', methods=['POST'])
def query_searchaudio_handler():
    if 'file' not in request.files:
        return jsonify({"error": "No query file provided"}), 400
    
    query_file = request.files['file']
    if query_file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(query_file.filename):
        return jsonify({"error": "Invalid file type. Only MIDI & WAV files are allowed."}), 400

    # Simpan query file ke folder sementara
    filename = secure_filename(query_file.filename)
    query_path = os.path.join(app.config['QUERY_FOLDER'], filename)
    query_file.save(query_path)

    print(f"Query path: {query_path}")
    print(f"Query file saved: {query_path}")

    try:
        # Konversi ke MIDI jika file yang diterima adalah WAV
        if filename.endswith('.wav'):
            midi_filename = filename.replace('.wav', '.mid')
            midi_path = os.path.join(app.config['QUERY_FOLDER'], midi_filename)
            print(f"MIDI PATH = {midi_path} \n \n")
            print(f"MIDI PATH = {query_path} \n \n")
            ad.wav_to_midi(query_path, midi_path)
            query_path = midi_path

        # print(f"Files in {app.config['QUERY_FOLDER']}: {os.listdir(app.config['QUERY_FOLDER'])}")
        print(f"wowo Query file: {query_path}")
        # Panggil fungsi compare_similarity
        similarities = ad.compare_similarity(app.config['UPLOAD_FOLDER'], query_path)
        
        # Formatkan hasil
        # results = [{"similarity": sim[0], "file": sim[1]} for sim in similarities]
        results = [{"filename": sim[1], "similarity": sim[0]} for sim in similarities[:3]]

        if len(results) > 0:
            return jsonify({"matches":results}), 200
        else:
            return jsonify({"message" : "No matches file founds"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Processing error: {str(e)}"}), 500
    
    finally:
        # Hapus file query setelah diproses
        if os.path.exists(query_path):
            os.remove(query_path)

if __name__ == '__main__':
    app.run(debug=True, port=9696)
