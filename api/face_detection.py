import cv2
import os
import pickle
import numpy as np
from keras_facenet import FaceNet

# Initialize FaceNet model
embedder = FaceNet()

# Define paths
embeddings_path = "face_embeddings.pkl"

# Load existing embeddings if available
if os.path.exists(embeddings_path):
    with open(embeddings_path, "rb") as file:
        face_db = pickle.load(file)  # Structure: {'label': embedding}
else:
    face_db = {}

# Function to add new faces
def add_face(image_path, label):
    global face_db
    image = cv2.imread(image_path)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Using OpenCV's Haar Cascade Classifier for face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray_image, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    if len(faces) == 0:
        print(f"No face detected in {image_path}.")
        return

    # Extract and compute embeddings for the first detected face
    for (x, y, w, h) in faces:
        face = image_rgb[y:y+h, x:x+w]  # Crop face region
        cv2.imshow("Cropped Face", face)  # Check the face region
        face_resized = cv2.resize(face, (160, 160))  # Resize for FaceNet input
        face_embedding = embedder.embeddings(np.array([face_resized]))[0]

        # Store the embedding with the label
        face_db[label] = face_embedding
        print(f"Embedding for {label}: {face_embedding[:10]}...")  # Print the first few values for debugging

    # Save updated database
    with open(embeddings_path, "wb") as file:
        pickle.dump(face_db, file)
    print(f"Face added for label '{label}'.")

# Function to recognize faces
def recognize_face(face_embedding):
    if not face_db:
        return "Unknown"
    
    min_dist = float("inf")
    label = "Unknown"
    
    for name, db_embedding in face_db.items():
        dist = np.linalg.norm(face_embedding - db_embedding)
        print(f"Comparing with {name}, Distance: {dist}")  # Debugging distance
        if dist < 0.7 and dist < min_dist:  # Increase threshold to allow larger differences
            min_dist = dist
            label = name
    
    return label

# Open webcam and detect faces
def open_camera():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    print("Press 'q' to quit.")
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame.")
            break

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Using OpenCV's Haar Cascade Classifier for face detection
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml').detectMultiScale(
            gray_frame, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
        )

        if len(faces) == 0:
            print("No faces detected.")
        else:
            for (x, y, w, h) in faces:
                face = frame_rgb[y:y+h, x:x+w]  # Crop the face region
                face_resized = cv2.resize(face, (160, 160))  # Resize to FaceNet input size

                # Generate embeddings for the face
                face_embedding = embedder.embeddings(np.array([face_resized]))[0]
                label = recognize_face(face_embedding)

                # Draw bounding box and label
                color = (0, 255, 0) if label != "Unknown" else (0, 0, 255)
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

        cv2.imshow("Face Recognition", frame)

        # Break loop on 'q' key press
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

# Example usage
if __name__ == "__main__":
    # Add faces to the system
    add_face("amk_wajdi.jpg", "wajdi")
    add_face("mah.jpg", "mahmoud")

    # Start webcam recognition
    open_camera()
