import requests
import os
import zipfile
from tqdm import tqdm

def download_file(url, filename):
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    block_size = 1024
    progress_bar = tqdm(total=total_size, unit='iB', unit_scale=True)
    
    with open(filename, 'wb') as file:
        for data in response.iter_content(block_size):
            progress_bar.update(len(data))
            file.write(data)
    progress_bar.close()

def main():
    # Create models directory if it doesn't exist
    if not os.path.exists('models'):
        os.makedirs('models')
    
    # Download Vosk model if not already present
    vosk_model_path = 'vosk-model-small-en-us'
    if not os.path.exists(vosk_model_path):
        print("Downloading Vosk model...")
        model_url = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
        zip_path = "vosk-model.zip"
        
        download_file(model_url, zip_path)
        
        print("Extracting model...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall('.')
        
        # Clean up
        os.remove(zip_path)
        print("Vosk model downloaded and extracted successfully!")
    else:
        print("Vosk model already exists.")

if __name__ == "__main__":
    main() 