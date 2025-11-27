from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from io import BytesIO


from PIL import Image
import numpy as np


import io
import cv2

app = Flask(__name__)
CORS(app)  # Permettre les requêtes depuis React

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max

### fonction tass
# Helper functions
def decode_image(image_data):
    """
    CONVERTIT UNE IMAGE BASE64 EN ARRAY NUMPY
    Utilisé pour recevoir les images du frontend
    """
    try:
        # Supprimer le préfixe data URL si présent
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Décoder base64 → bytes → Image PIL → Array numpy
        image_bytes = base64.b64decode(image_data)
        pil_image = Image.open(io.BytesIO(image_bytes))
        numpy_array = np.array(pil_image)
        
       
            
        return numpy_array
        
    except Exception as e:
        raise ValueError(f"Erreur décodage image: {str(e)}")

def encode_image(image_array):
    """
    CONVERTIT UN ARRAY NUMPY EN IMAGE BASE64
    """
    try:
        print(f"🔧 Encodage - Format entrée: {image_array.shape}, Type: {image_array.dtype}")
        
        # Gestion des différents formats
        if len(image_array.shape) == 3:
            if image_array.shape[2] == 4:  # RGBA
                print("🖼️ Format RGBA détecté")
                # L'image est déjà en RGBA (format attendu par PIL)
                pil_image = Image.fromarray(image_array.astype('uint8'), 'RGBA')
                format_type = 'PNG'
            else:  # RGB (3 canaux)
                print("🖼️ Format RGB détecté")
                # L'image est déjà en RGB (format attendu par PIL)
                pil_image = Image.fromarray(image_array.astype('uint8'), 'RGB')
                format_type = 'JPEG'
        else:  # Niveaux de gris
            print("🖼️ Format niveaux de gris détecté")
            pil_image = Image.fromarray(image_array.astype('uint8'), 'L')
            format_type = 'JPEG'
        
        # Encoder
        buffer = io.BytesIO()
        pil_image.save(buffer, format=format_type, quality=95)
        encoded_string = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        print(f"✅ Encodage réussi - Format: {format_type}, Taille: {len(encoded_string)}")
        
        return encoded_string
        
    except Exception as e:
        print(f"❌ Erreur encodage: {e}")
        raise ValueError(f"Erreur encodage image: {str(e)}")

# Routes API
@app.route('/api/process', methods=['POST'])
def process_image():
    """Route principale pour le traitement d'images"""
    try:
        data = request.get_json()
        
        print(f"🎯 OPÉRATION DEMANDÉE: {data.get('operation')}")
        print(f"📋 PARAMÈTRES: {data.get('params', {})}")
        
        if not data or 'image' not in data or 'operation' not in data:
            return jsonify({'error': 'Données invalides'}), 400
        
        image_data = data['image']
        operation = data['operation']
        params = data.get('params', {})
        
        # Décoder l'image
        image = decode_image(image_data)
        print(f"📸 Image décodée - Shape: {image.shape}, Type: {image.dtype}")
        
        # Appliquer l'opération demandée
        processed_image = apply_operation(image, operation, params)
        print(f"✅ Opération '{operation}' appliquée - Shape résultat: {processed_image.shape}")
        
        # Encoder le résultat
        result = encode_image(processed_image)
        print(f"📨 Résultat encodé - Longueur base64: {len(result)} caractères")
        
        return jsonify({
            'success': True,
            'processed_image': result,
            'operation': operation
        })
        
    except Exception as e:
        print(f"❌ ERREUR dans /api/process: {str(e)}")
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

### fonction tass
def apply_gaussian_blur(image, intensity=5):
    """
    APPLIQUE UN FLOU GAUSSIEN À L'IMAGE
    """
    try:
        # === GESTION DES CANAUX ===
        # Sauvegarder le format original
        original_channels = image.shape[2] if len(image.shape) == 3 else 1
        
        intensity = max(1, min(15, intensity))
        kernel_size = intensity * 2 + 1
        
        blurred_image = cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)
        
        # Si l'image originale avait 4 canaux (RGBA) et on retourne 3 canaux (RGB)
        # On doit s'assurer de la cohérence
        if original_channels == 4 and len(blurred_image.shape) == 3 and blurred_image.shape[2] == 3:
            print("🔄 Conversion RGB → RGBA pour cohérence")
            # Recréer le canal alpha (pleine opacité)
            alpha_channel = np.ones((blurred_image.shape[0], blurred_image.shape[1]), dtype=np.uint8) * 255
            blurred_image = cv2.merge([blurred_image[:,:,0], blurred_image[:,:,1], blurred_image[:,:,2], alpha_channel])
        
        return blurred_image
        
    except Exception as e:
        raise ValueError(f"Erreur lors de l'application du flou gaussien: {str(e)}")

def apply_median_blur(image, intensity=5):
    """
    APPLIQUE UN FILTRE MÉDIAN POUR RÉDUIRE LE BRUIT
    """
    try:
        # === GESTION DES CANAUX ===
        original_channels = image.shape[2] if len(image.shape) == 3 else 1
        
        intensity = max(1, min(15, intensity))
        kernel_size = intensity * 2 + 1
        
        denoised_image = cv2.medianBlur(image, kernel_size)
        
        # Gestion de la cohérence des canaux
        if original_channels == 4 and len(denoised_image.shape) == 3 and denoised_image.shape[2] == 3:
            print("🔄 Conversion RGB → RGBA pour cohérence")
            alpha_channel = np.ones((denoised_image.shape[0], denoised_image.shape[1]), dtype=np.uint8) * 255
            denoised_image = cv2.merge([denoised_image[:,:,0], denoised_image[:,:,1], denoised_image[:,:,2], alpha_channel])
        
        return denoised_image
        
    except Exception as e:
        raise ValueError(f"Erreur lors de l'application du filtre médian: {str(e)}")

def apply_sharpen(image):
    """
    APPLIQUE UN FILTRE D'ACCENTUATION POUR RENFORCER LES DÉTAILS
    """
    try:
        # === GESTION DES CANAUX ===
        original_channels = image.shape[2] if len(image.shape) == 3 else 1
        
        sharpen_kernel = np.array([[-1, -1, -1],
                                   [-1,  9, -1], 
                                   [-1, -1, -1]], dtype=np.float32)
        
        sharpened_image = cv2.filter2D(image, -1, sharpen_kernel)
        sharpened_image = np.clip(sharpened_image, 0, 255)
        
        # Gestion de la cohérence des canaux
        if original_channels == 4 and len(sharpened_image.shape) == 3 and sharpened_image.shape[2] == 3:
            print("🔄 Conversion RGB → RGBA pour cohérence")
            alpha_channel = np.ones((sharpened_image.shape[0], sharpened_image.shape[1]), dtype=np.uint8) * 255
            sharpened_image = cv2.merge([sharpened_image[:,:,0], sharpened_image[:,:,1], sharpened_image[:,:,2], alpha_channel])
        
        return sharpened_image
        
    except Exception as e:
        raise ValueError(f"Erreur lors de l'application de l'accentuation: {str(e)}")
    
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