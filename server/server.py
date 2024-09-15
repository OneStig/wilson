from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
from hsemotion_onnx.facial_emotions import HSEmotionRecognizer
import assemblyai as aai
import os

aai.settings.api_key = "c41fe55fa7e648ac999ee2ac35ad111c"

app = Flask(__name__)
CORS(app)

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

# ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
# 0, 2, 4
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
    return jsonify({'stressLevel': stress_level, 'emotion': emotion, 'scores': scores.tolist()})

def calculate_wpm(transcript):
    if not transcript.words:
        return -1
    word_count = len(transcript.words)
    duration_sec = transcript.audio_duration
    if duration_sec == 0:
        return -1
    wpm = (word_count / duration_sec) * 60
    return round(wpm, 2)

def assess_nervousness(wpm):
    if wpm == -1:
        return "UNKNOWN"
    elif wpm > 180:
        return "VERY_NERVOUS"
    elif wpm > 160:
        return "NERVOUS"
    elif wpm > 130:
        return "NORMAL"
    else:
        return "CALM"

def get_dominant_emotion(transcript):
    if not transcript.sentiment_analysis:
        return "UNKNOWN"
    sentiment_counts = {'POSITIVE': 0, 'NEUTRAL': 0, 'NEGATIVE': 0}
    for result in transcript.sentiment_analysis:
        sentiment_counts[result.sentiment] += 1
    return max(sentiment_counts, key=sentiment_counts.get)

@app.route('/analyze_audio', methods=['POST'])
def analyze_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    
    # Save the audio file temporarily
    temp_path = 'temp_audio.wav'
    audio_file.save(temp_path)
    
    try:
        config = aai.TranscriptionConfig(
            auto_highlights=True,
            sentiment_analysis=True
        )

        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(temp_path, config)

        if not transcript.text:
            return jsonify({'error': 'Failed to transcribe audio'}), 500

        emotion = get_dominant_emotion(transcript)
        wpm = calculate_wpm(transcript)
        nervousness = assess_nervousness(wpm)

        return jsonify({
            'emotion': emotion,
            'wpm': wpm,
            'nervousness': nervousness
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        pass
        # Clean up the temporary file
        # if os.path.exists(temp_path):
        #   os.remove(temp_path)

if __name__ == '__main__':
    app.run(debug=True, port=8080)
