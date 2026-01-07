from flask import Flask, render_template, request, Response, jsonify, send_file
import cv2
import os
import time
from werkzeug.utils import secure_filename
import threading
from model import Model
import numpy as np

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size

# Create necessary folders
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# Global variables
model = None
camera = None
camera_active = False
processing_status = {'progress': 0, 'total': 0, 'status': 'idle', 'message': ''}
current_video_path = None

# Define category mapping
CATEGORY_MAPPING = {
    'fight on a street': 'Fighting/Violence',
    'street violence': 'Fighting/Violence',
    'violence in office': 'Fighting/Violence',
    'fire on a street': 'Fire',
    'fire in office': 'Fire',
    'car crash': 'Car Crash',
}

def get_category(label):
    return CATEGORY_MAPPING.get(label, 'Normal')

def load_model():
    """Load the violence detection model"""
    global model
    print("Loading violence detection model...")
    model = Model()
    print("Model loaded successfully!")

# Load model before starting the app
load_model()

@app.route('/')
def index():
    return render_template('violence_index.html')

@app.route('/upload_video', methods=['POST'])
def upload_video():
    global processing_status, current_video_path
    
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': 'No video selected'}), 400
    
    if file:
        filename = secure_filename(file.filename)
        timestamp = str(int(time.time()))
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Start processing in background thread
        current_video_path = filepath
        processing_status = {'progress': 0, 'total': 0, 'status': 'processing', 'message': 'Starting...'}
        thread = threading.Thread(target=process_video_background, args=(filepath, timestamp))
        thread.daemon = True
        thread.start()
        
        return jsonify({'success': True, 'message': 'Video uploaded, processing started'})

def process_video_background(input_path, timestamp):
    global processing_status
    
    try:
        cap = cv2.VideoCapture(input_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        processing_status['total'] = total_frames
        processing_status['message'] = f'Processing {total_frames} frames...'
        
        output_filename = f"output_{timestamp}.mp4"
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        frame_count = 0
        detection_results = []
        category_stats = {}
        
        print(f"Starting to process {total_frames} frames...")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print(f"Finished reading frames. Processed: {frame_count}/{total_frames}")
                break
            
            frame_count += 1
            
            # Convert BGR to RGB for model
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Get prediction
            result = model.predict(rgb_frame)
            label = result['label']
            confidence = result['confidence']
            
            # Determine category
            category = get_category(label)
            
            # Update category stats
            if category not in category_stats:
                category_stats[category] = 0
            category_stats[category] += 1

            # Draw label on frame
            text = f"{label} ({confidence:.2f})"
            
            # Create a semi-transparent background for text
            (text_width, text_height), baseline = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            cv2.rectangle(frame, (10, 10), (20 + text_width, 20 + text_height + baseline), (0, 0, 0), -1)
            cv2.rectangle(frame, (10, 10), (20 + text_width, 20 + text_height + baseline), (255, 255, 255), 2)
            
            # Draw text
            color = (0, 0, 255) if category != 'Normal' else (0, 255, 0)
            cv2.putText(frame, text, (15, 15 + text_height), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
            
            out.write(frame)
            
            processing_status['progress'] = frame_count
            processing_status['message'] = f'Processing: {frame_count}/{total_frames} frames'
            
            if frame_count % 10 == 0:
                detection_results.append({
                    'frame': frame_count,
                    'label': label,
                    'confidence': float(confidence),
                    'category': category
                })
        
        # Add the last frame to detection results if not already added
        if frame_count % 10 != 0 and frame_count > 0:
            detection_results.append({
                'frame': frame_count,
                'label': label,
                'confidence': float(confidence),
                'category': category
            })
        
        cap.release()
        out.release()
        
        # Determine final result based on frequency
        final_result = "Normal"
        if category_stats:
            final_result = max(category_stats, key=category_stats.get)

        print(f"Video processing completed! Total frames: {frame_count}. Final Result: {final_result}")
        
        # Ensure progress is set to 100%
        processing_status['progress'] = total_frames
        processing_status['message'] = f'Processing: {total_frames}/{total_frames} frames'
        time.sleep(0.5)  # Give time for progress to update
        
        processing_status['status'] = 'completed'
        processing_status['message'] = f'Processing completed! Result: {final_result}'
        processing_status['output_file'] = output_filename
        processing_status['detections'] = detection_results
        processing_status['final_result'] = final_result
        
        print("Status set to completed, detection results saved")
        
    except Exception as e:
        processing_status['status'] = 'error'
        processing_status['message'] = f'Error: {str(e)}'

@app.route('/progress')
def progress():
    def generate():
        import json
        while True:
            yield f"data: {json.dumps(processing_status)}\n\n"
            if processing_status['status'] in ['completed', 'error']:
                # Send final status one more time before closing
                time.sleep(0.5)
                yield f"data: {json.dumps(processing_status)}\n\n"
                break
            time.sleep(0.5)
    return Response(generate(), mimetype='text/event-stream')

@app.route('/video_feed')
def video_feed():
    return Response(generate_camera_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

def generate_camera_frames():
    global camera, camera_active
    
    while camera_active:
        if camera is None:
            break
            
        success, frame = camera.read()
        if not success:
            break
        
        # Convert BGR to RGB for model
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Get prediction
        result = model.predict(rgb_frame)
        label = result['label']
        confidence = result['confidence']
        
        # Determine category
        category = get_category(label)
        
        # Draw label on frame
        text = f"{label} ({confidence:.2f})"
        
        # Create a semi-transparent background for text
        (text_width, text_height), baseline = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
        cv2.rectangle(frame, (10, 10), (20 + text_width, 20 + text_height + baseline), (0, 0, 0), -1)
        cv2.rectangle(frame, (10, 10), (20 + text_width, 20 + text_height + baseline), (255, 255, 255), 2)
        
        # Draw text with color based on detection type
        color = (0, 0, 255) if category != 'Normal' else (0, 255, 0)
        cv2.putText(frame, text, (15, 15 + text_height), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        
        # Encode frame
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/start_camera', methods=['POST'])
def start_camera():
    global camera, camera_active
    
    if camera_active:
        return jsonify({'error': 'Camera already active'}), 400
    
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        return jsonify({'error': 'Could not open camera'}), 500
    
    camera_active = True
    return jsonify({'success': True, 'message': 'Camera started'})

@app.route('/stop_camera', methods=['POST'])
def stop_camera():
    global camera, camera_active
    
    camera_active = False
    if camera is not None:
        camera.release()
        camera = None
    
    return jsonify({'success': True, 'message': 'Camera stopped'})

@app.route('/download_video/<filename>')
def download_video(filename):
    filepath = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    return send_file(filepath, as_attachment=True)

@app.route('/processed_video/<filename>')
def processed_video(filename):
    filepath = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    return send_file(filepath, mimetype='video/mp4')

if __name__ == '__main__':
    print("Starting Violence Detection Web Application...")
    print("Server will be available at: http://127.0.0.1:5001")
    app.run(debug=True, threaded=True, port=5001)
