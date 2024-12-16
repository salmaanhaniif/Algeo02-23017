import pandas as pd
import re

df = pd.read_csv('../MusicInfo.csv', encoding='utf-8')
df = pd.read_csv('../MusicInfo.csv', encoding='utf-8')
# Define the clean_filename function
def clean_filename(filename):
    invalid_chars = r'[<>:"/\\|?*\x00-\x1f]'  
    clean_name = re.sub(invalid_chars, '', filename)

    clean_name = clean_name.replace("'", "_")
    
    clean_name = clean_name.strip()

    max_filename_length = 255  # For most modern file systems (e.g., NTFS, ext4)
    if len(clean_name) > max_filename_length:
        clean_name = clean_name[:max_filename_length]

    return clean_name
# Define the lostFiles array
lostFiles = ["You Know You're Right.jpg", 'Bury Me With It.jpg', 'Famous Blue Raincoat.jpg', 
             "Girl's Not Grey.jpg", 'Sick Sad Little World.jpg', 'Take Me Anywhere.jpg', 
             'So Jealous.jpg', 'When Worlds Collide.jpg', 'The Things We Do For Love.jpg']

filtered_rows = []
lost_rows = []
end_music_name = 'Entre Dos Tierras'
end_index = df[df['name'] == end_music_name].index[0]

custom_index = 0
separator = '\uFFF9'  
# Loop through the DataFrame and apply the cleaning and filtering
for index, row in df.iloc[:end_index+1].iterrows():
    music_name = row['name']
    artist = row['artist']
    music_title = music_name
    file_name = clean_filename(music_name)
    thumbnail_image = file_name + ".jpg"
    music_preview = file_name + ".wav"

    # If the name is in the lostFiles array, add to the lost_rows and skip to the next iteration
    if clean_filename(music_name) + ".jpg" in lostFiles:
        lost_rows.append([thumbnail_image, music_preview, music_title, artist])
        continue  # Skip to the next iteration
    
    # Add the new columns to the row (not modifying original DataFrame)
    if thumbnail_image not in lostFiles:
        # Add the new columns and append to the filtered_rows
        filtered_rows.append([custom_index, thumbnail_image, music_preview, music_title, artist])
    custom_index += 1 

# If there are any lost rows, write them to a text file
if filtered_rows:
    with open('../mapper.txt', 'w', encoding='utf-8') as f:
        f.write('index' + separator + 'thumbnail_image' + separator + 'music_preview' + separator + 'music_title' + separator + 'artist' + '\n')
        for filtered_row in filtered_rows:
            # Convert the row to a list of values and join with the separator
            f.write(separator.join(map(str, filtered_row)) + '\n')
            
print("Filtered rows have been written to 'filtered_output.txt'.")
for row in lost_rows:
    print(row)
