import React, { useState, useRef } from 'react';
import { Upload, Download, RotateCcw, ZoomIn, ZoomOut, Trash2, Image, Grid, Sliders, Eye, Undo2, Redo2, FolderOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

const ImagePreprocessingPlatform = () => {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [showSplitView, setShowSplitView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Paramètres pour les traitements
  const [threshold, setThreshold] = useState(127);
  const [blurIntensity, setBlurIntensity] = useState(5);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [scalePercent, setScalePercent] = useState(100);
  
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const currentImage = images[currentImageIndex];

  // Afficher un message de succès temporaire
  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Afficher un message d'erreur temporaire
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const handleFolderUpload = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    const validFiles = [];
    let errorCount = 0;
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        errorCount++;
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showError(`${file.name} dépasse la taille maximale de 10MB`);
        errorCount++;
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        validFiles.push({
          id: Date.now() + Math.random(),
          name: file.name,
          original: event.target.result,
          processed: null,
          history: [],
          historyIndex: -1
        });
        
        if (validFiles.length === files.length - errorCount) {
          setImages(prev => [...prev, ...validFiles]);
          showSuccess(`${validFiles.length} image(s) chargée(s) avec succès`);
        }
      };
      reader.readAsDataURL(file);
    });

    if (errorCount > 0 && errorCount === files.length) {
      showError('Aucune image valide trouvée');
    }
  };

  const applyProcessing = async (operation, params = {}) => {
    if (!currentImage) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: currentImage.processed || currentImage.original,
          operation: operation,
          params: params
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur de traitement');
      }
      
      const data = await response.json();
      
      // Mettre à jour l'image avec l'historique
      const updatedImages = [...images];
      const img = updatedImages[currentImageIndex];
      
      // Couper l'historique après l'index actuel
      const newHistory = img.history.slice(0, img.historyIndex + 1);
      newHistory.push({
        operation,
        params,
        result: data.processed_image
      });
      
      img.history = newHistory;
      img.historyIndex = newHistory.length - 1;
      img.processed = data.processed_image;
      
      setImages(updatedImages);
      showSuccess(`${getOperationName(operation)} appliqué avec succès`);
      
    } catch (err) {
      showError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getOperationName = (operation) => {
    const names = {
      'grayscale': 'Niveaux de gris',
      'rgb_to_hsv': 'RGB → HSV',
      'threshold_binary': 'Seuillage binaire',
      'threshold_adaptive': 'Seuillage adaptatif',
      'threshold_otsu': 'Seuillage Otsu',
      'blur': 'Flou gaussien',
      'median_blur': 'Filtre médian',
      'sharpen': 'Accentuation',
      'edge_canny': 'Contours Canny',
      'edge_sobel': 'Contours Sobel',
      'edge_laplacian': 'Laplacien',
      'resize': 'Redimensionnement',
      'rotate': 'Rotation',
      'flip_horizontal': 'Miroir horizontal',
      'flip_vertical': 'Miroir vertical',
      'histogram_equalization': 'Égalisation histogramme',
      'normalize': 'Normalisation',
      'clahe': 'CLAHE',
      'channel_r': 'Canal rouge',
      'channel_g': 'Canal vert',
      'channel_b': 'Canal bleu',
      'show_histogram': 'Histogramme',
      'detect_faces': 'Détection visages'
    };
    return names[operation] || operation;
  };

  const handleUndo = () => {
    if (!currentImage || currentImage.historyIndex <= 0) return;
    
    const updatedImages = [...images];
    const img = updatedImages[currentImageIndex];
    img.historyIndex--;
    img.processed = img.history[img.historyIndex].result;
    setImages(updatedImages);
    showSuccess('Action annulée');
  };

  const handleRedo = () => {
    if (!currentImage || currentImage.historyIndex >= currentImage.history.length - 1) return;
    
    const updatedImages = [...images];
    const img = updatedImages[currentImageIndex];
    img.historyIndex++;
    img.processed = img.history[img.historyIndex].result;
    setImages(updatedImages);
    showSuccess('Action rétablie');
  };

  const handleDownload = () => {
    if (!currentImage) return;
    
    const link = document.createElement('a');
    link.href = currentImage.processed || currentImage.original;
    link.download = `processed_${currentImage.name}`;
    link.click();
    showSuccess('Image téléchargée');
  };

  const deleteImage = (id) => {
    const newImages = images.filter(img => img.id !== id);
    setImages(newImages);
    if (currentImageIndex >= newImages.length) {
      setCurrentImageIndex(Math.max(0, newImages.length - 1));
    }
    showSuccess('Image supprimée');
  };

  const resetImage = () => {
    if (!currentImage) return;
    const updatedImages = [...images];
    updatedImages[currentImageIndex].processed = null;
    updatedImages[currentImageIndex].history = [];
    updatedImages[currentImageIndex].historyIndex = -1;
    setImages(updatedImages);
    showSuccess('Image réinitialisée');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎨 Plateforme de Prétraitement d'Images
          </h1>
          <p className="text-purple-200">ISI Monastir - ING2 INFO</p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 flex items-center gap-2 animate-pulse">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200 flex items-center gap-2">
            <CheckCircle2 size={20} />
            {success}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Controls */}
          <div className="col-span-3 space-y-4 max-h-[85vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
            {/* Upload Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload size={20} />
                Charger des Images
              </h3>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <input
                ref={folderInputRef}
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFolderUpload}
                className="hidden"
              />
              <div className="space-y-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Upload size={18} />
                  Sélectionner Images
                </button>
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                >
                  <FolderOpen size={18} />
                  Charger un Dossier
                </button>
              </div>
            </div>

            {/* Image Gallery */}
            {images.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Grid size={20} />
                  Galerie ({images.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                        idx === currentImageIndex
                          ? 'bg-purple-600 shadow-lg scale-105'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => setCurrentImageIndex(idx)}
                    >
                      <img
                        src={img.original}
                        alt={img.name}
                        className="w-12 h-12 object-cover rounded shadow"
                      />
                      <span className="text-white text-sm flex-1 truncate">
                        {img.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteImage(img.id);
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversion Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">🔄 Conversion</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('grayscale')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Niveaux de Gris
                </button>
                <button
                  onClick={() => applyProcessing('rgb_to_hsv')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  RGB → HSV
                </button>
              </div>
            </div>

            {/* Seuillage Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">⚡ Seuillage</h3>
              <div className="mb-3">
                <label className="text-white text-sm mb-2 block">
                  Seuil: <span className="font-bold text-purple-300">{threshold}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('threshold_binary', { threshold })}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Seuillage Binaire
                </button>
                <button
                  onClick={() => applyProcessing('threshold_adaptive')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Seuillage Adaptatif
                </button>
                <button
                  onClick={() => applyProcessing('threshold_otsu')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Seuillage Otsu
                </button>
              </div>
            </div>

            {/* Filtres Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">🎭 Filtres</h3>
              <div className="mb-3">
                <label className="text-white text-sm mb-2 block">
                  Intensité: <span className="font-bold text-purple-300">{blurIntensity}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="2"
                  value={blurIntensity}
                  onChange={(e) => setBlurIntensity(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('blur', { intensity: blurIntensity })}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Flou Gaussien
                </button>
                <button
                  onClick={() => applyProcessing('median_blur', { intensity: blurIntensity })}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Filtre Médian
                </button>
                <button
                  onClick={() => applyProcessing('sharpen')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Accentuation
                </button>
              </div>
            </div>

            {/* Détection Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">🔍 Détection</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('edge_canny')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Contours Canny
                </button>
                <button
                  onClick={() => applyProcessing('edge_sobel')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Contours Sobel
                </button>
                <button
                  onClick={() => applyProcessing('edge_laplacian')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Laplacien
                </button>
              </div>
            </div>

            {/* Transformations Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">🔧 Transformations</h3>
              <div className="mb-3">
                <label className="text-white text-sm mb-2 block">
                  Échelle: <span className="font-bold text-purple-300">{scalePercent}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={scalePercent}
                  onChange={(e) => setScalePercent(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
              <div className="mb-3">
                <label className="text-white text-sm mb-2 block">
                  Rotation: <span className="font-bold text-purple-300">{rotationAngle}°</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rotationAngle}
                  onChange={(e) => setRotationAngle(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('resize', { scale: scalePercent / 100 })}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Redimensionner
                </button>
                <button
                  onClick={() => applyProcessing('rotate', { angle: rotationAngle })}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Rotation
                </button>
                <button
                  onClick={() => applyProcessing('flip_horizontal')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Miroir Horizontal
                </button>
                <button
                  onClick={() => applyProcessing('flip_vertical')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Miroir Vertical
                </button>
              </div>
            </div>

            {/* Amélioration Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">✨ Amélioration</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('histogram_equalization')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Égalisation Histogramme
                </button>
                <button
                  onClick={() => applyProcessing('normalize')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Normalisation
                </button>
                <button
                  onClick={() => applyProcessing('clahe')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  CLAHE
                </button>
              </div>
            </div>

            {/* Segmentation Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">🎨 Segmentation</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('channel_r')}
                  className="w-full py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Canal Rouge
                </button>
                <button
                  onClick={() => applyProcessing('channel_g')}
                  className="w-full py-2 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Canal Vert
                </button>
                <button
                  onClick={() => applyProcessing('channel_b')}
                  className="w-full py-2 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Canal Bleu
                </button>
              </div>
            </div>

            {/* Analyse Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">📊 Analyse</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('show_histogram')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Afficher Histogramme
                </button>
                <button
                  onClick={() => applyProcessing('detect_faces')}
                  className="w-full py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-lg transition-all text-sm shadow"
                  disabled={!currentImage || loading}
                >
                  Détecter Visages
                </button>
              </div>
            </div>
          </div>

          {/* Main Display Area */}
          <div className="col-span-9">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndo}
                    disabled={!currentImage || currentImage.historyIndex <= 0}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow"
                    title="Annuler (Ctrl+Z)"
                  >
                    <Undo2 size={20} />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={!currentImage || currentImage.historyIndex >= (currentImage.history?.length || 0) - 1}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow"
                    title="Rétablir (Ctrl+Y)"
                  >
                    <Redo2 size={20} />
                  </button>
                  <button
                    onClick={resetImage}
                    disabled={!currentImage}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow"
                    title="Réinitialiser"
                  >
                    <Trash2 size={20} />
                  </button>
                  {currentImage && (
                    <span className="text-white text-sm ml-2 bg-purple-600/50 px-3 py-1 rounded-full">
                      Historique: {currentImage.historyIndex + 1}/{currentImage.history?.length || 0}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all shadow"
                  >
                    <ZoomOut size={20} />
                  </button>
                  <span className="text-white px-3 font-semibold">{zoom}%</span>
                  <button
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all shadow"
                  >
                    <ZoomIn size={20} />
                  </button>
                  <button
                    onClick={() => setShowSplitView(!showSplitView)}
                    className={`p-2 rounded-lg transition-all shadow ${
                      showSplitView
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                    disabled={!currentImage?.processed}
                    title="Vue comparaison"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!currentImage}
                    className="p-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    title="Télécharger"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>

              {/* Image Display */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-4 min-h-[600px] flex items-center justify-center border border-white/5">
                {loading && (
                  <div className="text-white text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-lg font-semibold">Traitement en cours...</p>
                    <p className="text-sm text-purple-300 mt-2">Veuillez patienter</p>
                  </div>
                )}

                {!currentImage && !loading && (
                  <div className="text-center text-white/50">
                    <div className="relative inline-block">
                      <Image size={64} className="mx-auto mb-4 animate-pulse" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <Upload size={14} />
                      </div>
                    </div>
                    <p className="text-lg font-semibold">Aucune image sélectionnée</p>
                    <p className="text-sm mt-2">Uploadez des images ou un dossier pour commencer</p>
                  </div>
                )}

                {currentImage && !loading && (
                  <div className="w-full overflow-auto">
                    {showSplitView && currentImage.processed ? (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2 text-white font-semibold mb-2 bg-white/10 rounded-lg py-2">
                            <Image size={16} />
                            <span>Original</span>
                          </div>
                          <div className="flex items-center justify-center bg-white/5 rounded-lg p-4">
                            <img
                              src={currentImage.original}
                              alt="Original"
                              className="max-w-full h-auto rounded-lg shadow-2xl"
                              style={{ transform: `scale(${zoom / 100})` }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2 text-white font-semibold mb-2 bg-purple-600/50 rounded-lg py-2">
                            <Sliders size={16} />
                            <span>Traité</span>
                          </div>
                          <div className="flex items-center justify-center bg-white/5 rounded-lg p-4">
                            <img
                              src={currentImage.processed}
                              alt="Processed"
                              className="max-w-full h-auto rounded-lg shadow-2xl"
                              style={{ transform: `scale(${zoom / 100})` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <img
                          src={currentImage.processed || currentImage.original}
                          alt="Current"
                          className="max-w-full h-auto rounded-lg mx-auto shadow-2xl"
                          style={{ transform: `scale(${zoom / 100})` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Image Info */}
              {currentImage && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white text-sm">
                      <span className="font-semibold text-purple-300">📁 Image:</span> {currentImage.name}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white text-sm">
                      <span className="font-semibold text-purple-300">⚡ Statut:</span>{' '}
                      <span className={currentImage.processed ? 'text-green-400' : 'text-gray-400'}>
                        {currentImage.processed ? '✓ Modifiée' : '○ Originale'}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-purple-600/20 rounded-lg p-4">
              <p className="text-purple-300 font-semibold mb-1">🎓 Projet Académique</p>
              <p className="text-white text-sm">ISI Monastir - ING2 INFO</p>
            </div>
            <div className="bg-purple-600/20 rounded-lg p-4">
              <p className="text-purple-300 font-semibold mb-1">👨‍🏫 Encadré par</p>
              <p className="text-white text-sm">Dr. Nada Haj Messaoud</p>
            </div>
            <div className="bg-purple-600/20 rounded-lg p-4">
              <p className="text-purple-300 font-semibold mb-1">📅 Année Universitaire</p>
              <p className="text-white text-sm">2025-2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </div>
  );
};

export default ImagePreprocessingPlatform;