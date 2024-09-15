from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
from hsemotion_onnx.facial_emotions import HSEmotionRecognizer
import tempfile
import whisper
import os
import logging
import io
import soundfile as sf

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

model = whisper.load_model('base')
model_name = 'enet_b0_8_best_afew'
fer = HSEmotionRecognizer(model_name=model_name)

# Define the emotion labels manually
EMOTION_LABELS = ['Anger', 'Contempt', 'Disgust', 'Fear', 'Happiness', 'Neutral', 'Sadness', 'Surprise']

def process_image(img_data):
    img_bytes = base64.b64decode(img_data.split(',')[1])
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

def analyze_emotion(face_img):
    emotion, scores = fer.predict_emotions(face_img, logits=False)
    return emotion, scores

def get_stress_level(emotion, scores):
    stress_emotions = ['Anger', 'Fear', 'Sadness']
    emotion_dict = dict(zip(EMOTION_LABELS, scores))
    stress_score = sum(emotion_dict[e] for e in stress_emotions if e in emotion_dict)
    return stress_score

@app.route('/analyze', methods=['POST'])
def analyze_stress():
    img_data = request.json['image']
    face_img = process_image(img_data)
    emotion, scores = analyze_emotion(face_img)
    stress_level = get_stress_level(emotion, scores)

    # Convert numpy.float32 to regular Python float
    scores_list = [float(score) for score in scores]
    stress_level = float(stress_level)

    return jsonify({
        'stressLevel': stress_level,
        'emotion': emotion,
        'scores': scores_list
    })

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if not request.data:
        return jsonify({'error': 'No audio data provided'}), 400

    try:
        # Convert the raw PCM data to a numpy array
        audio_data = np.frombuffer(request.data, dtype=np.float32)

        # Ensure the audio data is at least 1 second long (assuming 44100 Hz sample rate)
        if len(audio_data) < 44100:
            return jsonify({'transcription': ''})

        # Save the audio data as a temporary WAV file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            sf.write(temp_audio.name, audio_data, 44100, format='WAV', subtype='PCM_16')
            temp_audio_path = temp_audio.name

        # Transcribe the audio
        result = model.transcribe(temp_audio_path, language="en")
        transcription = result['text']

        app.logger.info(f"Transcription result: {transcription}")

        return jsonify({'transcription': transcription})
    except Exception as e:
        app.logger.error(f"Error during transcription: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_audio_path):
            os.unlink(temp_audio_path)
            
        
    

if __name__ == '__main__':
    app.run(debug=True, port=8080)
