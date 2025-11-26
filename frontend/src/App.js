import React, { useState, useRef } from 'react';
import { Upload, Download, RotateCcw, ZoomIn, ZoomOut, Trash2, Image, Grid, Sliders, Eye } from 'lucide-react';

const ImagePreprocessingPlatform = () => {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [processedImage, setProcessedImage] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [showSplitView, setShowSplitView] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Paramètres pour les traitements
  const [threshold, setThreshold] = useState(127);
  const [blurIntensity, setBlurIntensity] = useState(5);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [scalePercent, setScalePercent] = useState(100);
  
  const fileInputRef = useRef(null);
  const currentImage = images[currentImageIndex];

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setError('Erreur: Veuillez sélectionner uniquement des fichiers images');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Erreur: La taille du fichier ne doit pas dépasser 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        validFiles.push({
          id: Date.now() + Math.random(),
          name: file.name,
          original: event.target.result,
          processed: null
        });
        
        if (validFiles.length === files.length) {
          setImages(prev => [...prev, ...validFiles]);
          setError('');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const applyProcessing = async (operation, params = {}) => {
    if (!currentImage) return;
    
    setLoading(true);
    setError('');
    
    try {
      // TODO: Implémenter l'appel API Flask
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
      
      if (!response.ok) throw new Error('Erreur de traitement');
      
      const data = await response.json();
      
      // Sauvegarder dans l'historique
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        operation,
        params,
        result: data.processed_image
      });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      setProcessedImage(data.processed_image);
      
      // Mettre à jour l'image courante
      const updatedImages = [...images];
      updatedImages[currentImageIndex].processed = data.processed_image;
      setImages(updatedImages);
      
    } catch (err) {
      setError('Erreur lors du traitement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setProcessedImage(history[historyIndex - 1].result);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setProcessedImage(history[historyIndex + 1].result);
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
    
    const link = document.createElement('a');
    link.href = currentImage.processed || currentImage.original;
    link.download = `processed_${currentImage.name}`;
    link.click();
  };

  const deleteImage = (id) => {
    setImages(images.filter(img => img.id !== id));
    if (currentImageIndex >= images.length - 1) {
      setCurrentImageIndex(Math.max(0, images.length - 2));
    }
  };

  const resetImage = () => {
    if (!currentImage) return;
    const updatedImages = [...images];
    updatedImages[currentImageIndex].processed = null;
    setImages(updatedImages);
    setProcessedImage(null);
    setHistory([]);
    setHistoryIndex(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Plateforme de Prétraitement d'Images
          </h1>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Controls */}
          <div className="col-span-3 space-y-4">
            {/* Upload Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload size={20} />
                Upload Images
              </h3>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                Sélectionner Images
              </button>
            </div>

            {/* Image Gallery */}
            {images.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Grid size={20} />
                  Galerie ({images.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        idx === currentImageIndex
                          ? 'bg-purple-600'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => setCurrentImageIndex(idx)}
                    >
                      <img
                        src={img.original}
                        alt={img.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <span className="text-white text-sm flex-1 truncate">
                        {img.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteImage(img.id);
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversion Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Conversion</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('grayscale')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Niveaux de Gris
                </button>
                <button
                  onClick={() => applyProcessing('rgb_to_hsv')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  RGB → HSV
                </button>
              </div>
            </div>

            {/* Seuillage Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Seuillage</h3>
              <div className="mb-3">
                <label className="text-white text-sm mb-2 block">
                  Seuil: {threshold}
                </label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('threshold_binary', { threshold })}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Seuillage Binaire
                </button>
                <button
                  onClick={() => applyProcessing('threshold_adaptive')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Seuillage Adaptatif
                </button>
                <button
                  onClick={() => applyProcessing('threshold_otsu')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Seuillage Otsu
                </button>
              </div>
            </div>

            {/* Filtres Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Filtres</h3>
              <div className="mb-3">
                <label className="text-white text-sm mb-2 block">
                  Intensité: {blurIntensity}
                </label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="2"
                  value={blurIntensity}
                  onChange={(e) => setBlurIntensity(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('blur', { intensity: blurIntensity })}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Flou Gaussien
                </button>
                <button
                  onClick={() => applyProcessing('median_blur', { intensity: blurIntensity })}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Filtre Médian
                </button>
                <button
                  onClick={() => applyProcessing('sharpen')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Accentuation
                </button>
              </div>
            </div>

            {/* Détection Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Détection</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('edge_canny')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Contours Canny
                </button>
                <button
                  onClick={() => applyProcessing('edge_sobel')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Contours Sobel
                </button>
                <button
                  onClick={() => applyProcessing('edge_laplacian')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Laplacien
                </button>
              </div>
            </div>

            {/* Transformations Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Transformations</h3>
              <div className="mb-3">
                <label className="text-white text-sm mb-2 block">
                  Échelle: {scalePercent}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={scalePercent}
                  onChange={(e) => setScalePercent(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="mb-3">
                <label className="text-white text-sm mb-2 block">
                  Rotation: {rotationAngle}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rotationAngle}
                  onChange={(e) => setRotationAngle(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('resize', { scale: scalePercent / 100 })}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Redimensionner
                </button>
                <button
                  onClick={() => applyProcessing('rotate', { angle: rotationAngle })}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Rotation
                </button>
                <button
                  onClick={() => applyProcessing('flip_horizontal')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Miroir Horizontal
                </button>
                <button
                  onClick={() => applyProcessing('flip_vertical')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Miroir Vertical
                </button>
              </div>
            </div>

            {/* Amélioration Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Amélioration</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('histogram_equalization')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Égalisation Histogramme
                </button>
                <button
                  onClick={() => applyProcessing('normalize')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Normalisation
                </button>
                <button
                  onClick={() => applyProcessing('clahe')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  CLAHE
                </button>
              </div>
            </div>

            {/* Segmentation Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Segmentation</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('channel_r')}
                  className="w-full py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Canal Rouge
                </button>
                <button
                  onClick={() => applyProcessing('channel_g')}
                  className="w-full py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Canal Vert
                </button>
                <button
                  onClick={() => applyProcessing('channel_b')}
                  className="w-full py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Canal Bleu
                </button>
              </div>
            </div>

            {/* Analyse Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Analyse</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('show_histogram')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Afficher Histogramme
                </button>
                <button
                  onClick={() => applyProcessing('detect_faces')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  disabled={!currentImage || loading}
                >
                  Détecter Visages
                </button>
              </div>
            </div>
          </div>

          {/* Main Display Area */}
          <div className="col-span-9">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
                    title="Annuler"
                  >
                    <RotateCcw size={20} />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
                    title="Rétablir"
                  >
                    <RotateCcw size={20} className="transform scale-x-[-1]" />
                  </button>
                  <button
                    onClick={resetImage}
                    disabled={!currentImage}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
                    title="Réinitialiser"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    <ZoomOut size={20} />
                  </button>
                  <span className="text-white px-3">{zoom}%</span>
                  <button
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    <ZoomIn size={20} />
                  </button>
                  <button
                    onClick={() => setShowSplitView(!showSplitView)}
                    className={`p-2 rounded-lg transition-colors ${
                      showSplitView
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                    disabled={!currentImage?.processed}
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!currentImage}
                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>

              {/* Image Display */}
              <div className="bg-slate-900 rounded-lg p-4 min-h-[600px] flex items-center justify-center">
                {loading && (
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p>Traitement en cours...</p>
                  </div>
                )}

                {!currentImage && !loading && (
                  <div className="text-center text-white/50">
                    <Image size={64} className="mx-auto mb-4" />
                    <p className="text-lg">Aucune image sélectionnée</p>
                    <p className="text-sm mt-2">Uploadez des images pour commencer</p>
                  </div>
                )}

                {currentImage && !loading && (
                  <div className="w-full">
                    {showSplitView && currentImage.processed ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-white text-center mb-2">Original</h4>
                          <img
                            src={currentImage.original}
                            alt="Original"
                            className="w-full h-auto rounded-lg"
                            style={{ transform: `scale(${zoom / 100})` }}
                          />
                        </div>
                        <div>
                          <h4 className="text-white text-center mb-2">Traité</h4>
                          <img
                            src={currentImage.processed}
                            alt="Processed"
                            className="w-full h-auto rounded-lg"
                            style={{ transform: `scale(${zoom / 100})` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <img
                          src={currentImage.processed || currentImage.original}
                          alt="Current"
                          className="max-w-full h-auto rounded-lg mx-auto"
                          style={{ transform: `scale(${zoom / 100})` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Image Info */}
              {currentImage && (
                <div className="mt-4 text-white text-sm">
                  <p>
                    <span className="font-semibold">Image:</span> {currentImage.name}
                  </p>
                  <p>
                    <span className="font-semibold">Statut:</span>{' '}
                    {currentImage.processed ? 'Modifiée' : 'Originale'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreprocessingPlatform;