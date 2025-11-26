from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from io import BytesIO
from PIL import Image
import numpy as np

app = Flask(__name__)
CORS(app)  # Permettre les requêtes depuis React

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max

# Helper functions
def decode_image(image_data):
    """Décode une image base64 en array numpy"""
    # TODO: Implémenter la conversion base64 -> numpy array
    pass

def encode_image(image_array):
    """Encode un array numpy en base64"""
    # TODO: Implémenter la conversion numpy array -> base64
    pass

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
# TODO: Implémenter chaque fonction ci-dessous

def convert_to_grayscale(image):
    """Convertit l'image en niveaux de gris"""
    # TODO: Implémenter la conversion en niveaux de gris
    # Utiliser cv2.cvtColor() ou une méthode appropriée
    pass

def convert_rgb_to_hsv(image):
    """Convertit RGB en HSV"""
    # TODO: Implémenter la conversion RGB -> HSV
    pass

def threshold_binary(image, threshold):
    """Applique un seuillage binaire"""
    # TODO: Implémenter le seuillage binaire
    # cv2.threshold() avec cv2.THRESH_BINARY
    pass

def threshold_adaptive(image):
    """Applique un seuillage adaptatif"""
    # TODO: Implémenter le seuillage adaptatif
    # cv2.adaptiveThreshold()
    pass

def threshold_otsu(image):
    """Applique un seuillage Otsu"""
    # TODO: Implémenter le seuillage Otsu
    # cv2.threshold() avec cv2.THRESH_OTSU
    pass

def apply_gaussian_blur(image, intensity):
    """Applique un flou gaussien"""
    # TODO: Implémenter le flou gaussien
    # cv2.GaussianBlur()
    pass

def apply_median_blur(image, intensity):
    """Applique un filtre médian"""
    # TODO: Implémenter le filtre médian
    # cv2.medianBlur()
    pass

def apply_sharpen(image):
    """Applique une accentuation"""
    # TODO: Implémenter l'accentuation
    # Utiliser un kernel de sharpening
    pass

def detect_edges_canny(image):
    """Détecte les contours avec Canny"""
    # TODO: Implémenter la détection Canny
    # cv2.Canny()
    pass

def detect_edges_sobel(image):
    """Détecte les contours avec Sobel"""
    # TODO: Implémenter la détection Sobel
    # cv2.Sobel()
    pass

def detect_edges_laplacian(image):
    """Détecte les contours avec Laplacien"""
    # TODO: Implémenter la détection Laplacien
    # cv2.Laplacian()
    pass

def resize_image(image, scale):
    """Redimensionne l'image"""
    # TODO: Implémenter le redimensionnement
    # cv2.resize()
    pass

def rotate_image(image, angle):
    """Fait pivoter l'image"""
    # TODO: Implémenter la rotation
    # cv2.getRotationMatrix2D() et cv2.warpAffine()
    pass

def flip_horizontal(image):
    """Applique un miroir horizontal"""
    # TODO: Implémenter le flip horizontal
    # cv2.flip() avec flipCode=1
    pass

def flip_vertical(image):
    """Applique un miroir vertical"""
    # TODO: Implémenter le flip vertical
    # cv2.flip() avec flipCode=0
    pass

def histogram_equalization(image):
    """Égalise l'histogramme"""
    # TODO: Implémenter l'égalisation d'histogramme
    # cv2.equalizeHist()
    pass

def normalize_image(image):
    """Normalise l'image"""
    # TODO: Implémenter la normalisation
    # cv2.normalize()
    pass

def apply_clahe(image):
    """Applique CLAHE (Contrast Limited Adaptive Histogram Equalization)"""
    # TODO: Implémenter CLAHE
    # cv2.createCLAHE()
    pass

def extract_channel(image, channel_index):
    """Extrait un canal RGB"""
    # TODO: Implémenter l'extraction de canal
    # image[:,:,channel_index]
    pass

def generate_histogram(image):
    """Génère un histogramme de l'image"""
    # TODO: Implémenter la génération d'histogramme
    # cv2.calcHist() puis créer une visualisation
    pass

def detect_faces(image):
    """Détecte les visages dans l'image"""
    # TODO: Implémenter la détection de visages
    # cv2.CascadeClassifier avec haarcascade_frontalface_default.xml
    pass

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