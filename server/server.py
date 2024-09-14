from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
from hsemotion_onnx.facial_emotions import HSEmotionRecognizer

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

def get_stress_level(emotion, scores):
    stress_emotions = ['Anger', 'Fear', 'Sadness']
    emotion_dict = dict(zip(EMOTION_LABELS, scores))
    stress_score = sum(emotion_dict[e] for e in stress_emotions if e in emotion_dict)
    
    if stress_score < 0.3:
        return 'Low'
    elif stress_score < 0.6:
        return 'Medium'
    else:
        return 'High'

@app.route('/analyze', methods=['POST'])
def analyze_stress():
    img_data = request.json['image']
    face_img = process_image(img_data)
    emotion, scores = analyze_emotion(face_img)
    stress_level = get_stress_level(emotion, scores)
    return jsonify({'stressLevel': stress_level, 'emotion': emotion, 'scores': scores.tolist()})

if __name__ == '__main__':
    app.run(debug=True, port=8080)
