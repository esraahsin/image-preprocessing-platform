from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from io import BytesIO
from PIL import Image
import numpy as np
import cv2

app = Flask(__name__)
CORS(app)  # Permettre les requêtes depuis React

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max

# Helper functions
def decode_image(image_data):
    """Décode une image base64 en array numpy"""
    try:
        # Extraire les données base64 (enlever le préfixe data:image/...)
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Décoder base64
        image_bytes = base64.b64decode(image_data)
        
        # Convertir en array numpy
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # Décoder l'image avec OpenCV
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        return image
    except Exception as e:
        print(f"Erreur decode_image: {e}")
        raise ValueError(f"Impossible de décoder l'image: {e}")

def encode_image(image_array):
    """Encode un array numpy en base64"""
    try:
        # Encoder l'image en format PNG
        success, buffer = cv2.imencode('.png', image_array)
        
        if not success:
            raise ValueError("Échec de l'encodage de l'image")
        
        # Convertir en base64
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Ajouter le préfixe pour l'affichage dans le navigateur
        return f"data:image/png;base64,{image_base64}"
    except Exception as e:
        print(f"Erreur encode_image: {e}")
        raise ValueError(f"Impossible d'encoder l'image: {e}")

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

        # ⚠ Si le résultat est déjà base64, ne pas réencoder
        if isinstance(processed_image, str):
            result = processed_image
        else:
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
        return extract_channel(image, 2)  # Red (BGR format in OpenCV)
    
    elif operation == 'channel_g':
        return extract_channel(image, 1)  # Green
    
    elif operation == 'channel_b':
        return extract_channel(image, 0)  # Blue
    
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
    try:
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            # Convertir en 3 canaux pour la compatibilité
            return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        return image
    except Exception as e:
        print(f"Erreur convert_to_grayscale: {e}")
        return image

def convert_rgb_to_hsv(image):
    """Convertit RGB en HSV"""
    try:
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        return hsv
    except Exception as e:
        print(f"Erreur convert_rgb_to_hsv: {e}")
        return image

# ===== SEUILLAGE =====
def threshold_binary(image, threshold):
    """Applique un seuillage binaire"""
    try:
        # Convertir en niveaux de gris si nécessaire
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Appliquer le seuillage
        _, binary = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
        
        # Convertir en 3 canaux pour la compatibilité
        return cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)
    except Exception as e:
        print(f"Erreur threshold_binary: {e}")
        return image

def threshold_adaptive(image):
    """Applique un seuillage adaptatif"""
    try:
        # Convertir en niveaux de gris
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Appliquer le seuillage adaptatif
        adaptive = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Convertir en 3 canaux
        return cv2.cvtColor(adaptive, cv2.COLOR_GRAY2BGR)
    except Exception as e:
        print(f"Erreur threshold_adaptive: {e}")
        return image

def threshold_otsu(image):
    """Applique un seuillage Otsu"""
    try:
        # Convertir en niveaux de gris
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Appliquer le seuillage Otsu
        _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Convertir en 3 canaux
        return cv2.cvtColor(otsu, cv2.COLOR_GRAY2BGR)
    except Exception as e:
        print(f"Erreur threshold_otsu: {e}")
        return image

# ===== FILTRES =====
def apply_gaussian_blur(image, intensity):
    """Applique un flou gaussien"""
    try:
        # S'assurer que intensity est impair
        kernel_size = intensity if intensity % 2 == 1 else intensity + 1
        kernel_size = max(1, kernel_size)  # Au moins 1
        
        blurred = cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)
        return blurred
    except Exception as e:
        print(f"Erreur apply_gaussian_blur: {e}")
        return image

def apply_median_blur(image, intensity):
    """Applique un filtre médian"""
    try:
        # S'assurer que intensity est impair
        kernel_size = intensity if intensity % 2 == 1 else intensity + 1
        kernel_size = max(1, kernel_size)  # Au moins 1
        
        median = cv2.medianBlur(image, kernel_size)
        return median
    except Exception as e:
        print(f"Erreur apply_median_blur: {e}")
        return image

def apply_sharpen(image):
    """Applique une accentuation"""
    try:
        # Kernel de sharpening
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
        # Convertir en niveaux de gris
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Appliquer Canny
        edges = cv2.Canny(gray, 100, 200)
        
        # Convertir en 3 canaux
        return cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    except Exception as e:
        print(f"Erreur detect_edges_canny: {e}")
        return image

def detect_edges_sobel(image):
    """Détecte les contours avec Sobel"""
    try:
        # Convertir en niveaux de gris
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Calculer les gradients
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        
        # Magnitude
        sobel = np.sqrt(sobelx**2 + sobely**2)
        sobel = np.uint8(sobel / sobel.max() * 255)
        
        # Convertir en 3 canaux
        return cv2.cvtColor(sobel, cv2.COLOR_GRAY2BGR)
    except Exception as e:
        print(f"Erreur detect_edges_sobel: {e}")
        return image

def detect_edges_laplacian(image):
    """Détecte les contours avec Laplacien"""
    try:
        # Convertir en niveaux de gris
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Appliquer Laplacien
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        laplacian = np.uint8(np.absolute(laplacian))
        
        # Convertir en 3 canaux
        return cv2.cvtColor(laplacian, cv2.COLOR_GRAY2BGR)
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
        
        # Choisir l'interpolation appropriée
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
        
        # Obtenir la matrice de rotation
        rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        
        # Calculer les nouvelles dimensions
        abs_cos = abs(rotation_matrix[0, 0])
        abs_sin = abs(rotation_matrix[0, 1])
        
        new_width = int(height * abs_sin + width * abs_cos)
        new_height = int(height * abs_cos + width * abs_sin)
        
        # Ajuster la matrice
        rotation_matrix[0, 2] += new_width / 2 - center[0]
        rotation_matrix[1, 2] += new_height / 2 - center[1]
        
        # Appliquer la rotation
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
        # Convertir en YCrCb pour préserver les couleurs
        if len(image.shape) == 3:
            ycrcb = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
            ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
            equalized = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
        else:
            equalized = cv2.equalizeHist(image)
            equalized = cv2.cvtColor(equalized, cv2.COLOR_GRAY2BGR)
        
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
    """Applique CLAHE (Contrast Limited Adaptive Histogram Equalization)"""
    try:
        # Créer l'objet CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        
        if len(image.shape) == 3:
            # Convertir en LAB et appliquer sur le canal L
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            lab[:, :, 0] = clahe.apply(lab[:, :, 0])
            result = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        else:
            result = clahe.apply(image)
            result = cv2.cvtColor(result, cv2.COLOR_GRAY2BGR)
        
        return result
    except Exception as e:
        print(f"Erreur apply_clahe: {e}")
        return image

# ===== SEGMENTATION DES CANAUX =====
def extract_channel(image, channel_index):
    """Extrait un canal RGB"""
    try:
        if len(image.shape) == 3:
            # Créer une image noire
            result = np.zeros_like(image)
            # Extraire le canal
            result[:, :, channel_index] = image[:, :, channel_index]
            return result
        else:
            return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    except Exception as e:
        print(f"Erreur extract_channel: {e}")
        return image

# ===== ANALYSE =====
def generate_histogram(image):
    """Génère un histogramme de l'image"""
    try:
        # Créer une image blanche pour dessiner l'histogramme
        hist_height = 400
        hist_width = 512
        hist_image = np.ones((hist_height, hist_width, 3), dtype=np.uint8) * 255
        
        if len(image.shape) == 3:
            colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]  # BGR
            
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
        # Charger le classificateur Haar Cascade
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Convertir en niveaux de gris pour la détection
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Détecter les visages
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        # Dessiner des rectangles autour des visages
        result = image.copy()
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