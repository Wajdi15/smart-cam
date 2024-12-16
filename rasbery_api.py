from flask import Flask, Response, request, jsonify
import cv2
import threading
import time
from flask_socketio import SocketIO, emit
try:
    import RPi.GPIO as GPIO
    GPIO.setmode(GPIO.BCM)  # Use BCM numbering
    GPIO.setwarnings(False)
except ImportError:
    GPIO = None 


app = Flask(__name__)
socketio = SocketIO(app)

# Global variable to control the camera
camera = None
is_streaming = False
BUZZER_PIN = 18 

# Initialize GPIO pin for buzzer
if GPIO:
    GPIO.setup(BUZZER_PIN, GPIO.OUT)

@app.route('/start_stream', methods=['POST'])
def start_stream():
    global camera, is_streaming
    if not is_streaming:
        camera = cv2.VideoCapture(0)  # Open USB camera
        is_streaming = True
        return jsonify({"message": "Stream started"}), 200
    else:
        return jsonify({"message": "Stream already running"}), 400

@app.route('/stop_stream', methods=['POST'])
def stop_stream():
    global camera, is_streaming
    if is_streaming:
        camera.release()  # Release the camera
        is_streaming = False
        return jsonify({"message": "Stream stopped"}), 200
    else:
        return jsonify({"message": "Stream is not running"}), 400

@app.route('/video_feed')
def video_feed():
    global camera, is_streaming
    if not is_streaming:
        return "Stream not started", 400

    def generate_frames():
        while is_streaming:
            success, frame = camera.read()
            if not success:
                break
            _, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/activate_buzzer', methods=['POST'])
def activate_buzzer():
    if not GPIO:
        return jsonify({"message": "GPIO not available. This feature is only for Raspberry Pi."}), 400
    
    def buzz():
        GPIO.output(BUZZER_PIN, GPIO.HIGH)  # Turn the buzzer ON
        time.sleep(1)  # Keep the buzzer ON for 1 second
        GPIO.output(BUZZER_PIN, GPIO.LOW)  # Turn the buzzer OFF
    
    threading.Thread(target=buzz).start()  # Run buzzer activation in a separate thread
    return jsonify({"message": "Buzzer activated for 1 second"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)