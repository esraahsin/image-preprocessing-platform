from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from io import BytesIO
from PIL import Image
import numpy as np
import cv2

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max

# Helper functions
def decode_image(image_data):
    """Décode une image base64 en array numpy"""
    try:
        # Supprimer le préfixe data:image/...;base64, si présent
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Décoder le base64
        image_bytes = base64.b64decode(image_data)
        
        # Convertir en PIL Image
        pil_image = Image.open(BytesIO(image_bytes))
        
        # Convertir en array numpy (RGB)
        image_array = np.array(pil_image)
        
        # Si l'image a un canal alpha, le supprimer
        if len(image_array.shape) == 3 and image_array.shape[-1] == 4:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGBA2RGB)
        
        return image_array
    except Exception as e:
        raise ValueError(f"Erreur lors du décodage de l'image: {str(e)}")

def encode_image(image_array):
    """Encode un array numpy en base64"""
    try:
        # S'assurer que l'image est en uint8
        if image_array.dtype != np.uint8:
            image_array = np.clip(image_array, 0, 255).astype(np.uint8)
        
        # Convertir numpy array en PIL Image
        if len(image_array.shape) == 2:
            # Image en niveaux de gris
            pil_image = Image.fromarray(image_array, mode='L')
        else:
            # Image couleur (RGB)
            pil_image = Image.fromarray(image_array, mode='RGB')
        
        # Sauvegarder dans un buffer
        buffer = BytesIO()
        pil_image.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Encoder en base64
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        # Ajouter le préfixe data URI
        return f"data:image/png;base64,{image_base64}"
    except Exception as e:
        raise ValueError(f"Erreur lors de l'encodage de l'image: {str(e)}")

# Routes API
@app.route('/api/process', methods=['POST'])
def process_image():
    """Route principale pour le traitement d'images"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data or 'operation' not in data:
            return jsonify({'error': 'Données invalides'}), 400
        
        image_data = data['image']
        operation = data['operation']
        params = data.get('params', {})
        
        # Décoder l'image
        image = decode_image(image_data)
        
        # Appliquer l'opération demandée
        processed_image = apply_operation(image, operation, params)

        # Encoder le résultat
        result = encode_image(processed_image)

        return jsonify({
            'success': True,
            'processed_image': result,
            'operation': operation
        })
    
    except Exception as e:
        print(f"Erreur process_image: {e}")
        return jsonify({'error': str(e)}), 500

def apply_operation(image, operation, params):
    """Applique une opération de traitement sur l'image"""
    
    # Conversion
    if operation == 'grayscale':
        return convert_to_grayscale(image)
    
    elif operation == 'rgb_to_hsv':
        return convert_rgb_to_hsv(image)
    
    # Seuillage
    elif operation == 'threshold_binary':
        threshold = params.get('threshold', 127)
        return threshold_binary(image, threshold)
    
    elif operation == 'threshold_adaptive':
        return threshold_adaptive(image)
    
    elif operation == 'threshold_otsu':
        return threshold_otsu(image)
    
    # Filtres
    elif operation == 'blur':
        intensity = params.get('intensity', 5)
        return apply_gaussian_blur(image, intensity)
    
    elif operation == 'median_blur':
        intensity = params.get('intensity', 5)
        return apply_median_blur(image, intensity)
    
    elif operation == 'sharpen':
        return apply_sharpen(image)
    
    # Détection de contours
    elif operation == 'edge_canny':
        return detect_edges_canny(image)
    
    elif operation == 'edge_sobel':
        return detect_edges_sobel(image)
    
    elif operation == 'edge_laplacian':
        return detect_edges_laplacian(image)
    
    # Transformations géométriques
    elif operation == 'resize':
        scale = params.get('scale', 1.0)
        return resize_image(image, scale)
    
    elif operation == 'rotate':
        angle = params.get('angle', 0)
        return rotate_image(image, angle)
    
    elif operation == 'flip_horizontal':
        return flip_horizontal(image)
    
    elif operation == 'flip_vertical':
        return flip_vertical(image)
    
    # Amélioration
    elif operation == 'histogram_equalization':
        return histogram_equalization(image)
    
    elif operation == 'normalize':
        return normalize_image(image)
    
    elif operation == 'clahe':
        return apply_clahe(image)
    
    # Segmentation des canaux
    elif operation == 'channel_r':
        return extract_channel(image, 0)  # Red
    
    elif operation == 'channel_g':
        return extract_channel(image, 1)  # Green
    
    elif operation == 'channel_b':
        return extract_channel(image, 2)  # Blue
    
    # Analyse
    elif operation == 'show_histogram':
        return generate_histogram(image)
    
    elif operation == 'detect_faces':
        return detect_faces(image)
    
    else:
        raise ValueError(f"Opération inconnue: {operation}")


# ==================== FONCTIONS DE TRAITEMENT ====================

# ===== CONVERSION =====
def convert_to_grayscale(image):
    """Convertit l'image en niveaux de gris"""
    if len(image.shape) == 2:
        return image
    
    # Convertir RGB en niveaux de gris
    gray_image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    return gray_image

def convert_rgb_to_hsv(image):
    """Convertit RGB en HSV"""
    if len(image.shape) != 3 or image.shape[2] != 3:
        raise ValueError("L'image doit être en RGB pour la conversion HSV")
    
    # Convertir RGB en HSV
    hsv_image = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
    return hsv_image


# ==================== SEUILLAGE ====================

def threshold_binary(image, threshold_value):
    """Applique un seuillage binaire"""
    if len(image.shape) == 3:
        gray_image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    else:
        gray_image = image.copy()
    
    _, thresholded = cv2.threshold(gray_image, threshold_value, 255, cv2.THRESH_BINARY)
    return thresholded

def threshold_adaptive(image):
    """Applique un seuillage adaptatif"""
    if len(image.shape) == 3:
        gray_image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    else:
        gray_image = image.copy()
    
    adaptive_thresh = cv2.adaptiveThreshold(
        gray_image, 
        255, 
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 
        11, 
        2
    )
    return adaptive_thresh

def threshold_otsu(image):
    """Applique un seuillage Otsu"""
    if len(image.shape) == 3:
        gray_image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    else:
        gray_image = image.copy()
    
    _, otsu_thresh = cv2.threshold(gray_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return otsu_thresh


# ===== FILTRES =====
def apply_gaussian_blur(image, intensity):
    """Applique un flou gaussien"""
    try:
        kernel_size = intensity if intensity % 2 == 1 else intensity + 1
        kernel_size = max(1, kernel_size)
        
        blurred = cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)
        return blurred
    except Exception as e:
        print(f"Erreur apply_gaussian_blur: {e}")
        return image

def apply_median_blur(image, intensity):
    """Applique un filtre médian"""
    try:
        kernel_size = intensity if intensity % 2 == 1 else intensity + 1
        kernel_size = max(1, kernel_size)
        
        median = cv2.medianBlur(image, kernel_size)
        return median
    except Exception as e:
        print(f"Erreur apply_median_blur: {e}")
        return image

def apply_sharpen(image):
    """Applique une accentuation"""
    try:
        kernel = np.array([[-1, -1, -1],
                          [-1,  9, -1],
                          [-1, -1, -1]])
        
        sharpened = cv2.filter2D(image, -1, kernel)
        return sharpened
    except Exception as e:
        print(f"Erreur apply_sharpen: {e}")
        return image

# ===== DÉTECTION DE CONTOURS =====
def detect_edges_canny(image):
    """Détecte les contours avec Canny"""
    try:
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image
        
        edges = cv2.Canny(gray, 100, 200)
        
        # Retourner en RGB pour cohérence
        return cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)
    except Exception as e:
        print(f"Erreur detect_edges_canny: {e}")
        return image

def detect_edges_sobel(image):
    """Détecte les contours avec Sobel"""
    try:
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image
        
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        
        sobel = np.sqrt(sobelx**2 + sobely**2)
        sobel = np.uint8(sobel / sobel.max() * 255)
        
        return cv2.cvtColor(sobel, cv2.COLOR_GRAY2RGB)
    except Exception as e:
        print(f"Erreur detect_edges_sobel: {e}")
        return image

def detect_edges_laplacian(image):
    """Détecte les contours avec Laplacien"""
    try:
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image
        
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        laplacian = np.uint8(np.absolute(laplacian))
        
        return cv2.cvtColor(laplacian, cv2.COLOR_GRAY2RGB)
    except Exception as e:
        print(f"Erreur detect_edges_laplacian: {e}")
        return image

# ===== TRANSFORMATIONS GÉOMÉTRIQUES =====
def resize_image(image, scale):
    """Redimensionne l'image"""
    try:
        height, width = image.shape[:2]
        new_width = int(width * scale)
        new_height = int(height * scale)
        
        interpolation = cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC
        
        resized = cv2.resize(image, (new_width, new_height), interpolation=interpolation)
        return resized
    except Exception as e:
        print(f"Erreur resize_image: {e}")
        return image

def rotate_image(image, angle):
    """Fait pivoter l'image"""
    try:
        height, width = image.shape[:2]
        center = (width // 2, height // 2)
        
        rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        
        abs_cos = abs(rotation_matrix[0, 0])
        abs_sin = abs(rotation_matrix[0, 1])
        
        new_width = int(height * abs_sin + width * abs_cos)
        new_height = int(height * abs_cos + width * abs_sin)
        
        rotation_matrix[0, 2] += new_width / 2 - center[0]
        rotation_matrix[1, 2] += new_height / 2 - center[1]
        
        rotated = cv2.warpAffine(
            image, rotation_matrix, (new_width, new_height),
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(255, 255, 255)
        )
        
        return rotated
    except Exception as e:
        print(f"Erreur rotate_image: {e}")
        return image

def flip_horizontal(image):
    """Applique un miroir horizontal"""
    try:
        flipped = cv2.flip(image, 1)
        return flipped
    except Exception as e:
        print(f"Erreur flip_horizontal: {e}")
        return image

def flip_vertical(image):
    """Applique un miroir vertical"""
    try:
        flipped = cv2.flip(image, 0)
        return flipped
    except Exception as e:
        print(f"Erreur flip_vertical: {e}")
        return image

# ===== AMÉLIORATION =====
def histogram_equalization(image):
    """Égalise l'histogramme"""
    try:
        if len(image.shape) == 3:
            # Convertir en YCrCb pour préserver les couleurs
            ycrcb = cv2.cvtColor(image, cv2.COLOR_RGB2YCrCb)
            ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
            equalized = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2RGB)
        else:
            equalized = cv2.equalizeHist(image)
        
        return equalized
    except Exception as e:
        print(f"Erreur histogram_equalization: {e}")
        return image

def normalize_image(image):
    """Normalise l'image"""
    try:
        normalized = cv2.normalize(image, None, 0, 255, cv2.NORM_MINMAX)
        return normalized
    except Exception as e:
        print(f"Erreur normalize_image: {e}")
        return image

def apply_clahe(image):
    """Applique CLAHE"""
    try:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        
        if len(image.shape) == 3:
            # Convertir en LAB
            lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            lab[:, :, 0] = clahe.apply(lab[:, :, 0])
            result = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        else:
            result = clahe.apply(image)
        
        return result
    except Exception as e:
        print(f"Erreur apply_clahe: {e}")
        return image

# ===== SEGMENTATION DES CANAUX =====
def extract_channel(image, channel_index):
    """Extrait un canal RGB"""
    try:
        if len(image.shape) == 3:
            result = np.zeros_like(image)
            result[:, :, channel_index] = image[:, :, channel_index]
            return result
        else:
            return cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    except Exception as e:
        print(f"Erreur extract_channel: {e}")
        return image

# ===== ANALYSE =====
def generate_histogram(image):
    """Génère un histogramme de l'image"""
    try:
        hist_height = 400
        hist_width = 512
        hist_image = np.ones((hist_height, hist_width, 3), dtype=np.uint8) * 255
        
        if len(image.shape) == 3:
            colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]  # RGB
            
            for i, color in enumerate(colors):
                hist = cv2.calcHist([image], [i], None, [256], [0, 256])
                hist = hist / hist.max() * (hist_height - 50)
                
                for x in range(256):
                    x1 = int(x * hist_width / 256)
                    x2 = int((x + 1) * hist_width / 256)
                    y = int(hist[x])
                    cv2.rectangle(hist_image, (x1, hist_height - y), (x2, hist_height), color, -1)
        else:
            hist = cv2.calcHist([image], [0], None, [256], [0, 256])
            hist = hist / hist.max() * (hist_height - 50)
            
            for x in range(256):
                x1 = int(x * hist_width / 256)
                x2 = int((x + 1) * hist_width / 256)
                y = int(hist[x])
                cv2.rectangle(hist_image, (x1, hist_height - y), (x2, hist_height), (0, 0, 0), -1)
        
        return hist_image
    except Exception as e:
        print(f"Erreur generate_histogram: {e}")
        return image

def detect_faces(image):
    """Détecte les visages dans l'image"""
    try:
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image
        
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        result = image.copy() if len(image.shape) == 3 else cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        
        for (x, y, w, h) in faces:
            cv2.rectangle(result, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(result, 'Face', (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        
        return result
    except Exception as e:
        print(f"Erreur detect_faces: {e}")
        return image


# Route de test
@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérifie que l'API fonctionne"""
    return jsonify({
        'status': 'running',
        'message': 'API de traitement d\'images opérationnelle'
    })

# Gestion des erreurs
@app.errorhandler(413)
def file_too_large(e):
    return jsonify({'error': 'Fichier trop volumineux (max 10MB)'}), 413

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Erreur interne du serveur'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)