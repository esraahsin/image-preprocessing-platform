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
        if image_array.shape[-1] == 4:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGBA2RGB)
        
        return image_array
    except Exception as e:
        raise ValueError(f"Erreur lors du décodage de l'image: {str(e)}")

def encode_image(image_array):
    """Encode un array numpy en base64"""
    try:
        # Convertir numpy array en PIL Image
        if len(image_array.shape) == 2:
            # Image en niveaux de gris
            pil_image = Image.fromarray(image_array.astype('uint8'))
        else:
            # Image couleur
            pil_image = Image.fromarray(image_array.astype('uint8'))
        
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


# ==================== CONVERSION ====================

def convert_to_grayscale(image):
    """Convertit l'image en niveaux de gris"""
    # Si l'image est déjà en niveaux de gris
    if len(image.shape) == 2:
        return image
    
    # Convertir RGB en niveaux de gris
    gray_image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    return gray_image

def convert_rgb_to_hsv(image):
    """Convertit RGB en HSV"""
    # Vérifier que l'image est en couleur
    if len(image.shape) != 3 or image.shape[2] != 3:
        raise ValueError("L'image doit être en RGB pour la conversion HSV")
    
    # Convertir RGB en HSV
    hsv_image = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
    return hsv_image


# ==================== SEUILLAGE ====================

def threshold_binary(image, threshold_value):
    """Applique un seuillage binaire"""
    # Convertir en niveaux de gris si nécessaire
    if len(image.shape) == 3:
        gray_image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    else:
        gray_image = image.copy()
    
    # Appliquer le seuillage binaire
    _, thresholded = cv2.threshold(gray_image, threshold_value, 255, cv2.THRESH_BINARY)
    return thresholded

def threshold_adaptive(image):
    """Applique un seuillage adaptatif"""
    # Convertir en niveaux de gris si nécessaire
    if len(image.shape) == 3:
        gray_image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    else:
        gray_image = image.copy()
    
    # Appliquer le seuillage adaptatif
    # Paramètres: blockSize=11, C=2
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
    # Convertir en niveaux de gris si nécessaire
    if len(image.shape) == 3:
        gray_image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    else:
        gray_image = image.copy()
    
    # Appliquer le seuillage Otsu
    # La méthode d'Otsu calcule automatiquement le seuil optimal
    _, otsu_thresh = cv2.threshold(gray_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return otsu_thresh


# ==================== FONCTIONS NON IMPLÉMENTÉES ====================
# TODO: Implémenter les fonctions suivantes

def apply_gaussian_blur(image, intensity):
    """Applique un flou gaussien"""
    # TODO: Implémenter le flou gaussien
    pass

def apply_median_blur(image, intensity):
    """Applique un filtre médian"""
    # TODO: Implémenter le filtre médian
    pass

def apply_sharpen(image):
    """Applique une accentuation"""
    # TODO: Implémenter l'accentuation
    pass

def detect_edges_canny(image):
    """Détecte les contours avec Canny"""
    # TODO: Implémenter la détection Canny
    pass

def detect_edges_sobel(image):
    """Détecte les contours avec Sobel"""
    # TODO: Implémenter la détection Sobel
    pass

def detect_edges_laplacian(image):
    """Détecte les contours avec Laplacien"""
    # TODO: Implémenter la détection Laplacien
    pass

def resize_image(image, scale):
    """Redimensionne l'image"""
    # TODO: Implémenter le redimensionnement
    pass

def rotate_image(image, angle):
    """Fait pivoter l'image"""
    # TODO: Implémenter la rotation
    pass

def flip_horizontal(image):
    """Applique un miroir horizontal"""
    # TODO: Implémenter le flip horizontal
    pass

def flip_vertical(image):
    """Applique un miroir vertical"""
    # TODO: Implémenter le flip vertical
    pass

def histogram_equalization(image):
    """Égalise l'histogramme"""
    # TODO: Implémenter l'égalisation d'histogramme
    pass

def normalize_image(image):
    """Normalise l'image"""
    # TODO: Implémenter la normalisation
    pass

def apply_clahe(image):
    """Applique CLAHE (Contrast Limited Adaptive Histogram Equalization)"""
    # TODO: Implémenter CLAHE
    pass

def extract_channel(image, channel_index):
    """Extrait un canal RGB"""
    # TODO: Implémenter l'extraction de canal
    pass

def generate_histogram(image):
    """Génère un histogramme de l'image"""
    # TODO: Implémenter la génération d'histogramme
    pass

def detect_faces(image):
    """Détecte les visages dans l'image"""
    # TODO: Implémenter la détection de visages
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