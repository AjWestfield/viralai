import logging
import sys
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import torch
from vosk import Model, KaldiRecognizer
import wave
import json
import yolov5
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    logger.info("Loading YOLOv5 model...")
    model = yolov5.load('yolov5s.pt')
    logger.info("YOLOv5 model loaded successfully")
except Exception as e:
    logger.error(f"Error loading YOLOv5 model: {str(e)}")
    sys.exit(1)

try:
    logger.info("Loading Vosk model...")
    if not Path("vosk-model-small-en-us").exists():
        raise RuntimeError("Vosk model not found. Please download from https://alphacephei.com/vosk/models")
    vosk_model = Model("vosk-model-small-en-us")
    logger.info("Vosk model loaded successfully")
except Exception as e:
    logger.error(f"Error loading Vosk model: {str(e)}")
    sys.exit(1)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "models": {"yolov5": True, "vosk": True}}

@app.post("/api/python/detect-objects")
async def detect_objects(file: UploadFile = File(...)):
    # Read and process the image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Run inference
    results = model(img)
    
    # Process results
    detections = results.pandas().xyxy[0].to_dict('records')
    return {"detections": detections}

@app.post("/api/python/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    # Save the uploaded file temporarily
    temp_file = "temp_audio.wav"
    with open(temp_file, "wb") as buffer:
        buffer.write(await file.read())
    
    # Process with Vosk
    wf = wave.open(temp_file, "rb")
    rec = KaldiRecognizer(vosk_model, wf.getframerate())
    
    results = []
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            part_result = json.loads(rec.Result())
            if part_result.get("text"):
                results.append(part_result)
    
    # Get final result
    part_result = json.loads(rec.FinalResult())
    if part_result.get("text"):
        results.append(part_result)
    
    return {"transcription": results}

@app.post("/api/python/process-video")
async def process_video(file: UploadFile = File(...)):
    # Save the uploaded file temporarily
    temp_file = "temp_video.mp4"
    with open(temp_file, "wb") as buffer:
        buffer.write(await file.read())
    
    # Open the video file
    cap = cv2.VideoCapture(temp_file)
    
    results = {
        "objects": [],
        "frames_processed": 0
    }
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        # Process every 30th frame for efficiency
        if results["frames_processed"] % 30 == 0:
            # Detect objects
            detections = model(frame)
            frame_results = detections.pandas().xyxy[0].to_dict('records')
            results["objects"].extend(frame_results)
        
        results["frames_processed"] += 1
    
    cap.release()
    return results

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info") 