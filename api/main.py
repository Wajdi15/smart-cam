from flask import Flask, Response, request, jsonify,redirect
import cv2
import os
import pickle
import numpy as np
from keras_facenet import FaceNet
import requests

# Initialize the Flask app and FaceNet embedder
app = Flask(__name__)
embedder = FaceNet()

# Global variables for camera and streaming
camera = None
is_streaming = False

# Path to the face embeddings database
embeddings_path = "face_embeddings.pkl"

# Load or initialize face embeddings database
if os.path.exists(embeddings_path):
    with open(embeddings_path, "rb") as file:
        face_db = pickle.load(file)
else:
    face_db = {}

def recognize_face(face_embedding):
    if not face_db:
        return "Unknown"
    
    min_dist = float("inf")
    label = "Unknown"
    
    for name, db_embedding in face_db.items():
        dist = np.linalg.norm(face_embedding - db_embedding)
        if dist < 0.7 and dist < min_dist:  # Set appropriate distance threshold
            min_dist = dist
            label = name
    
    return label

def process_frame(frame):
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    faces = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml').detectMultiScale(
        gray_frame, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
    )
    
    for (x, y, w, h) in faces:
        face = frame_rgb[y:y+h, x:x+w]  # Crop face region
        face_resized = cv2.resize(face, (160, 160))  # Resize to FaceNet input size
        
        # Generate embeddings
        face_embedding = embedder.embeddings(np.array([face_resized]))[0]
        label = recognize_face(face_embedding)
        
        # Draw bounding box and label
        color = (0, 255, 0) if label != "Unknown" else (0, 0, 255)
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
        cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
    
    return frame

def generate_stream():
    video_stream_url = "http://192.168.137.137:5000/video_feed"
    cap = cv2.VideoCapture(video_stream_url)

    if not cap.isOpened():
        print("Error: Could not open video stream.")
        return
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame from stream.")
            break
        frame = process_frame(frame)

        # Encode frame as JPEG
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    cap.release()

@app.route('/start_stream', methods=['POST'])
def start_stream():
    res =  requests.post('http://192.168.137.137:5000/start_stream')
    if res.status_code == 200:
        return jsonify({'message': 'Stream started successfully'})
    else:
        return jsonify({'message': 'Failed to start stream'}), res.status_code
@app.route('/stop_stream', methods=['POST'])
def stop_stream():
    res =  requests.post('http://192.168.137.137:5000/stop_stream')
    if res.status_code == 200:
        return jsonify({'message': 'Stream started successfully'})
    else:
        return jsonify({'message': 'Failed to start stream'}), res.status_code

@app.route('/video_feed')
def video_feed():
    return Response(generate_stream(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/add_face', methods=['POST'])
def add_face():
    global face_db

    # Check if image and label are provided
    if 'image' not in request.files or 'label' not in request.form:
        return jsonify({"message": "Image and label are required"}), 400

    image_file = request.files['image']
    label = request.form['label']

    # Read the image
    image_bytes = np.frombuffer(image_file.read(), np.uint8)
    image = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)
    if image is None:
        return jsonify({"message": "Invalid image file"}), 400

    # Convert to RGB
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Detect faces using Haar Cascade
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray_image, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    if len(faces) == 0:
        return jsonify({"message": "No face detected in the image"}), 400

    # Process the first detected face
    for (x, y, w, h) in faces:
        face = image_rgb[y:y+h, x:x+w]
        face_resized = cv2.resize(face, (160, 160))
        face_embedding = embedder.embeddings(np.array([face_resized]))[0]

        # Store the embedding in the database
        face_db[label] = face_embedding.tolist()  # Convert numpy array to list for JSON serialization
        break

    # Save the updated embeddings database
    with open(embeddings_path, "wb") as file:
        pickle.dump(face_db, file)

    return jsonify({"message": f"Face added for label '{label}'"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4000, debug=True)
