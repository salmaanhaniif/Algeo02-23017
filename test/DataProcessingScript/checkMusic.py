import os
import pandas as pd
import re

df = pd.read_csv('MusicInfo.csv', encoding='utf-8')

def file_exists(directory, filename):
    file_path = os.path.join(directory, filename)
    return os.path.isfile(file_path)

def clean_filename(filename):
    invalid_chars = r'[<>:"/\\|?*\x00-\x1f]'  
    clean_name = re.sub(invalid_chars, '', filename)
    
    clean_name = clean_name.strip()

    max_filename_length = 255  
    if len(clean_name) > max_filename_length:
        clean_name = clean_name[:max_filename_length]

    return clean_name

directory = "../MusicPreview"

lostindexes = []
lostfiles = []

end_music_name = 'Entre Dos Tierras'
end_index = df[df['name'] == end_music_name].index[0]
print(end_index)

for index, row in df.iloc[:end_index+1].iterrows():
    music_name = row['name']
    file_name = clean_filename(music_name) + ".wav"

    if  not file_exists(directory, file_name):
        lostindexes.append(index)
        lostfiles.append(file_name)
    
with open('lostMusicFiles.txt', 'w') as f:
    for idx, file in zip(lostindexes, lostfiles):
        f.write(f"Index: {idx}, File: {file}\n")

    f.write("\nLost Indexes:\n")
    f.write(f"{lostindexes}\n")  # Print the lost indexes array
    f.write("Lost Files:\n")
    f.write(f"{lostfiles}\n")  # Print the lost files array
