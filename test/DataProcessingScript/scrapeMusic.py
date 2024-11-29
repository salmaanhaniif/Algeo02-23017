import pandas as pd
import requests
from bs4 import BeautifulSoup
import os
import re

df = pd.read_csv('MusicInfo.csv', encoding='utf-8')
print(f"Number of rows: {len(df)}")

img_folder_path = "MusicPreview"

def download_preview(url, file_name):
    try:
        response = requests.get(url)
        response.raise_for_status()

        if not os.path.exists(img_folder_path):
            os.makedirs(img_folder_path)

        full_path = os.path.join(img_folder_path, file_name)

        with open(full_path, 'wb') as file:
            file.write(response.content)
        print(f"Downloaded {file_name}")

    except requests.exceptions.RequestException as e:
        print(f"Failed to download {file_name}. Error: {e}")

def clean_filename(filename):
    invalid_chars = r'[<>:"/\\|?*\x00-\x1f]'  
    clean_name = re.sub(invalid_chars, '', filename)
    
    clean_name = clean_name.strip()

    max_filename_length = 255  # For most modern file systems (e.g., NTFS, ext4)
    if len(clean_name) > max_filename_length:
        clean_name = clean_name[:max_filename_length]

    return clean_name

start_music_name = 'Straight to Hell'
end_music_name = 'Entre Dos Tierras'
start_index = df[df['name'] == start_music_name].index[0]
end_index = df[df['name'] == end_music_name].index[0]

for index, row in df.iloc[start_index:end_index+1].iterrows():
    music_name = row['name']
    file_name = clean_filename(music_name) + ".wav"

    spot_link = row['spotify_preview_url']

    download_preview(spot_link, file_name)

    
