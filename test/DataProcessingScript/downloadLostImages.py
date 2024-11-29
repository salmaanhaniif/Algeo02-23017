import pandas as pd
import requests
from bs4 import BeautifulSoup
import os
import re

df = pd.read_csv('MusicInfo.csv', encoding='utf-8')

img_folder_path = "MusicImage"

def download_image(url, file_name):
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


end_music_name = 'Entre Dos Tierras'
end_index = df[df['name'] == end_music_name].index[0]
lostImages = ["You Know You're Right.jpg", 'Bury Me With It.jpg', 'Famous Blue Raincoat.jpg', "Girl's Not Grey.jpg", 'Sick Sad Little World.jpg', 'Take Me Anywhere.jpg', 'So Jealous.jpg', 'When Worlds Collide.jpg', 'The Things We Do For Love.jpg']

for index, row in df.iloc[:end_index+1].iterrows():
    music_name = row['name']
    file_name = clean_filename(music_name) + ".jpg"
    
    if file_name in lostImages:
        spot_id = row['spotify_id']
        spot_link = "https://open.spotify.com/track/" + spot_id

        response = requests.get(spot_link)
        soup = BeautifulSoup(response.text, 'html.parser')
        img = soup.find('meta', attrs={'property': 'og:image'})

        if img:
            download_image(img['content'], file_name)

        else:
            print(f"No image found for {file_name}")
