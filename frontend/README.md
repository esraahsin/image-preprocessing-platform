# Plateforme de Prétraitement d'Images
## ISI Monastir - ING2 INFO

Plateforme web complète pour le prétraitement d'images avec React.js et Flask.

---

## 🎯 Fonctionnalités

### ✅ Implémentées (Interface)
- ✨ Upload multiple d'images avec validation
- 🖼️ Galerie d'images avec navigation
- 🔄 Gestion de l'historique (Annuler/Rétablir)
- 🔍 Zoom et mode comparaison côte à côte
- 💾 Téléchargement des images traitées
- 📱 Interface responsive et moderne

### 🔧 À Implémenter (Traitement)
Tous les boutons sont présents mais les fonctions de traitement sont vides :

#### Conversion
- Niveaux de gris
- RGB → HSV

#### Seuillage
- Seuillage binaire (avec curseur)
- Seuillage adaptatif
- Seuillage Otsu

#### Filtres
- Flou gaussien (avec curseur d'intensité)
- Filtre médian
- Accentuation

#### Détection de Contours
- Canny
- Sobel
- Laplacien

#### Transformations Géométriques
- Redimensionnement (avec curseur)
- Rotation (avec curseur d'angle)
- Miroir horizontal/vertical

#### Amélioration
- Égalisation d'histogramme
- Normalisation
- CLAHE

#### Segmentation
- Extraction canal Rouge
- Extraction canal Vert
- Extraction canal Bleu

#### Analyse
- Affichage d'histogramme
- Détection de visages

---

## 🚀 Installation

### Prérequis
- Node.js (v16 ou supérieur)
- Python 3.8+
- pip

### 1. Backend Flask

```bash
# Créer un dossier pour le projet
mkdir image-preprocessing-platform
cd image-preprocessing-platform

# Créer un dossier backend
mkdir backend
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows:
venv\Scripts\activate
# Sur Mac/Linux:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur Flask
python app.py
```

Le backend sera accessible sur `http://localhost:5000`

### 2. Frontend React

```bash
# Retourner au dossier principal
cd ..

# Créer l'application React
npx create-react-app frontend
cd frontend

# Installer les dépendances supplémentaires
npm install lucide-react

# Remplacer le contenu de src/App.js par le code React fourni

# Lancer l'application React
npm start
```

Le frontend sera accessible sur `http://localhost:3000`

---

## 📁 Structure du Projet

```
image-preprocessing-platform/
│
├── backend/
│   ├── app.py                 # API Flask (fonctions vides à implémenter)
│   ├── requirements.txt       # Dépendances Python
│   └── venv/                  # Environnement virtuel
│
├── frontend/
│   ├── src/
│   │   └── App.js            # Interface React complète
│   ├── package.json
│   └── node_modules/
│
└── README.md
```

---

## 🔨 Prochaines Étapes

### Pour compléter le projet :

1. **Implémenter les fonctions de traitement dans `app.py`**
   - Chaque fonction est marquée avec `# TODO:`
   - Utiliser OpenCV (cv2) pour les traitements
   - Exemples de fonctions à compléter :
     ```python
     def convert_to_grayscale(image):
         return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
     ```

2. **Implémenter les fonctions helper**
   - `decode_image()` : Convertir base64 → numpy array
   - `encode_image()` : Convertir numpy array → base64

3. **Tester chaque fonctionnalité**
   - Upload d'images
   - Application des traitements
   - Téléchargement des résultats

4. **Ajouter des fonctionnalités bonus**
   - Histogrammes interactifs (avec matplotlib)
   - Détection de visages (Haar Cascades)
   - Prévisualisation en temps réel

---

## 🎨 Technologies Utilisées

### Frontend
- **React.js** - Framework UI
- **Tailwind CSS** - Styling
- **Lucide React** - Icônes

### Backend
- **Flask** - API REST
- **OpenCV** - Traitement d'images
- **NumPy** - Manipulation de données
- **Pillow** - Gestion d'images
- **Matplotlib** - Visualisation

---

## 🐛 Gestion des Erreurs

L'application gère automatiquement :
- ✅ Fichiers non-images
- ✅ Fichiers trop volumineux (> 10MB)
- ✅ Erreurs de traitement
- ✅ Erreurs de connexion au backend

---

## 📝 Notes pour le Développement

### Ordre recommandé d'implémentation :

1. **Fonctions helper** (decode/encode)
2. **Conversion** (grayscale - la plus simple)
3. **Filtres** (blur, sharpen)
4. **Seuillage** (binary, adaptive)
5. **Transformations** (resize, rotate, flip)
6. **Détection** (edges)
7. **Amélioration** (histogram, normalize)
8. **Analyse** (histogram display, face detection)

### Conseils :
- Commencer par les fonctions simples pour tester la communication frontend/backend
- Utiliser Postman ou curl pour tester l'API indépendamment
- Vérifier les formats d'image (RGB vs BGR dans OpenCV)
- Gérer les cas où l'image est déjà en niveaux de gris

---

## 📚 Ressources Utiles

- [Documentation OpenCV](https://docs.opencv.org/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 👥 Équipe

**ISI Monastir - ING2 INFO**  
**Proposé par:** Dr. Nada Haj Messaoud  
**Année Universitaire:** 2025-2026

---

## 📄 Licence

Projet académique - ISI Monastir