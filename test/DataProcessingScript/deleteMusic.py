import os
import pandas as pd

# Function to clean the filename (remove invalid characters)
def clean_filename(filename):
    import re
    # Define a regular expression pattern for characters that are not allowed in filenames
    invalid_chars = r'[<>:"/\\|?*\x00-\x1f]'
    clean_name = re.sub(invalid_chars, '', filename)
    clean_name = clean_name.strip()
    return clean_name

# Directory where the .wav files are stored
directory = 'MusicPreview'

# DataFrame df with 'name' and 'spotify_preview_url' (as assumed in the original code)
# Example DataFrame
df = pd.read_csv('MusicInfo.csv', encoding='utf-8')

# Define the start and end music names
end_music_name = 'Entre Dos Tierras'

# Get the index of start and end music names
end_index = df[df['name'] == end_music_name].index[0]
files_to_delete = ["You Know You're Right.jpg", 'Bury Me With It.jpg', 'Famous Blue Raincoat.jpg', "Girl's Not Grey.jpg", 'Sick Sad Little World.jpg', 'Take Me Anywhere.jpg', 'So Jealous.jpg', 'When Worlds Collide.jpg', 'The Things We Do For Love.jpg']

# Iterate through the specified range and delete corresponding .wav files
for file_name in files_to_delete:
    # Change the extension to .wav
    file_wav = file_name.replace('.jpg', '.wav')
    
    # Create the full file path
    file_path = os.path.join(directory, file_wav)
    
    # Check if the file exists and delete it
    if os.path.isfile(file_path):
        os.remove(file_path)
        print(f"Deleted: {file_wav}")

print("File deletion process completed.")
