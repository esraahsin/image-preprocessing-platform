import React, { useState, useRef } from 'react';
import { Upload, Download, RotateCcw, ZoomIn, ZoomOut, Trash2, Image as ImageIcon, Grid, Eye, Undo2, Redo2, FolderOpen, AlertCircle, CheckCircle2, X, ChevronRight, Sparkles, Layers, Wand2, SlidersHorizontal } from 'lucide-react';

const ImagePreprocessingPlatform = () => {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [showSplitView, setShowSplitView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeCategory, setActiveCategory] = useState('conversion');
  
  // Paramètres pour les traitements
  const [threshold, setThreshold] = useState(127);
  const [blurIntensity, setBlurIntensity] = useState(5);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [scalePercent, setScalePercent] = useState(100);
  
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const currentImage = images[currentImageIndex];

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

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
          showSuccess(`${validFiles.length} image(s) chargée(s)`);
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
      
      const updatedImages = [...images];
      const img = updatedImages[currentImageIndex];
      
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
      showSuccess(`${getOperationName(operation)} appliqué`);
      
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
      'histogram_equalization': 'Égalisation',
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
    showSuccess('Annulé');
  };

  const handleRedo = () => {
    if (!currentImage || currentImage.historyIndex >= currentImage.history.length - 1) return;
    
    const updatedImages = [...images];
    const img = updatedImages[currentImageIndex];
    img.historyIndex++;
    img.processed = img.history[img.historyIndex].result;
    setImages(updatedImages);
    showSuccess('Rétabli');
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

  const categories = [
    { id: 'conversion', label: 'Conversion', icon: Layers },
    { id: 'threshold', label: 'Seuillage', icon: SlidersHorizontal },
    { id: 'filters', label: 'Filtres', icon: Wand2 },
    { id: 'detection', label: 'Détection', icon: Eye },
    { id: 'transform', label: 'Transformation', icon: RotateCcw },
    { id: 'enhance', label: 'Amélioration', icon: Sparkles },
    { id: 'channels', label: 'Canaux RGB', icon: Grid },
    { id: 'analysis', label: 'Analyse', icon: ChevronRight },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <ImageIcon className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Image Preprocessing</h1>
                <p className="text-sm text-gray-500">ISI Monastir • ING2 INFO</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
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
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors font-medium"
              >
                <Upload size={18} />
                Charger Images
              </button>
              <button
                onClick={() => folderInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center gap-2 transition-colors font-medium"
              >
                <FolderOpen size={18} />
                Dossier
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="fixed top-20 right-6 z-50 max-w-md animate-slide-in">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-20 right-6 z-50 max-w-md animate-slide-in">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg flex items-start gap-3">
            <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3">
            <div className="space-y-6">
              {/* Gallery */}
              {images.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Grid size={16} />
                    Galerie ({images.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                          idx === currentImageIndex
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <img
                          src={img.original}
                          alt={img.name}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                        />
                        <span className="text-sm text-gray-700 flex-1 truncate font-medium">
                          {img.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteImage(img.id);
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Catégories</h3>
                <div className="space-y-1">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                          activeCategory === cat.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-sm">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operations */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 max-h-96 overflow-y-auto">
                {activeCategory === 'conversion' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Conversion</h3>
                    <button
                      onClick={() => applyProcessing('grayscale')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Niveaux de Gris
                    </button>
                    <button
                      onClick={() => applyProcessing('rgb_to_hsv')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      RGB → HSV
                    </button>
                  </div>
                )}

                {activeCategory === 'threshold' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Seuillage</h3>
                    <div>
                      <label className="text-xs text-gray-600 mb-2 block">
                        Seuil: <span className="font-bold text-blue-600">{threshold}</span>
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
                    <button
                      onClick={() => applyProcessing('threshold_binary', { threshold })}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Seuillage Binaire
                    </button>
                    <button
                      onClick={() => applyProcessing('threshold_adaptive')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Seuillage Adaptatif
                    </button>
                    <button
                      onClick={() => applyProcessing('threshold_otsu')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Seuillage Otsu
                    </button>
                  </div>
                )}

                {activeCategory === 'filters' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Filtres</h3>
                    <div>
                      <label className="text-xs text-gray-600 mb-2 block">
                        Intensité: <span className="font-bold text-blue-600">{blurIntensity}</span>
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
                    <button
                      onClick={() => applyProcessing('blur', { intensity: blurIntensity })}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Flou Gaussien
                    </button>
                    <button
                      onClick={() => applyProcessing('median_blur', { intensity: blurIntensity })}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Filtre Médian
                    </button>
                    <button
                      onClick={() => applyProcessing('sharpen')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Accentuation
                    </button>
                  </div>
                )}

                {activeCategory === 'detection' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Détection</h3>
                    <button
                      onClick={() => applyProcessing('edge_canny')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Contours Canny
                    </button>
                    <button
                      onClick={() => applyProcessing('edge_sobel')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Contours Sobel
                    </button>
                    <button
                      onClick={() => applyProcessing('edge_laplacian')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Laplacien
                    </button>
                  </div>
                )}

                {activeCategory === 'transform' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Transformation</h3>
                    <div>
                      <label className="text-xs text-gray-600 mb-2 block">
                        Échelle: <span className="font-bold text-blue-600">{scalePercent}%</span>
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
                    <div>
                      <label className="text-xs text-gray-600 mb-2 block">
                        Rotation: <span className="font-bold text-blue-600">{rotationAngle}°</span>
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
                    <button
                      onClick={() => applyProcessing('resize', { scale: scalePercent / 100 })}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Redimensionner
                    </button>
                    <button
                      onClick={() => applyProcessing('rotate', { angle: rotationAngle })}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Rotation
                    </button>
                    <button
                      onClick={() => applyProcessing('flip_horizontal')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Miroir Horizontal
                    </button>
                    <button
                      onClick={() => applyProcessing('flip_vertical')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Miroir Vertical
                    </button>
                  </div>
                )}

                {activeCategory === 'enhance' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Amélioration</h3>
                    <button
                      onClick={() => applyProcessing('histogram_equalization')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Égalisation Histogramme
                    </button>
                    <button
                      onClick={() => applyProcessing('normalize')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Normalisation
                    </button>
                    <button
                      onClick={() => applyProcessing('clahe')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      CLAHE
                    </button>
                  </div>
                )}

                {activeCategory === 'channels' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Canaux RGB</h3>
                    <button
                      onClick={() => applyProcessing('channel_r')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Canal Rouge
                    </button>
                    <button
                      onClick={() => applyProcessing('channel_g')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Canal Vert
                    </button>
                    <button
                      onClick={() => applyProcessing('channel_b')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Canal Bleu
                    </button>
                  </div>
                )}

                {activeCategory === 'analysis' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Analyse</h3>
                    <button
                      onClick={() => applyProcessing('show_histogram')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Afficher Histogramme
                    </button>
                    <button
                      onClick={() => applyProcessing('detect_faces')}
                      disabled={!currentImage || loading}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Détecter Visages
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Display */}
          <div className="col-span-9">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Toolbar */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUndo}
                      disabled={!currentImage || currentImage.historyIndex <= 0}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Annuler"
                    >
                      <Undo2 size={20} />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={!currentImage || currentImage.historyIndex >= (currentImage.history?.length || 0) - 1}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Rétablir"
                    >
                      <Redo2 size={20} />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                    <button
                      onClick={resetImage}
                      disabled={!currentImage}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Réinitialiser"
                    >
                      <RotateCcw size={20} />
                    </button>
                    {currentImage && (
                      <span className="text-xs text-gray-500 ml-2 bg-gray-100 px-3 py-1 rounded-full font-medium">
                        {currentImage.historyIndex + 1}/{currentImage.history?.length || 0}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setZoom(Math.max(50, zoom - 10))}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ZoomOut size={20} />
                    </button>
                    <span className="text-sm text-gray-700 font-semibold min-w-[60px] text-center">{zoom}%</span>
                    <button
                      onClick={() => setZoom(Math.min(200, zoom + 10))}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ZoomIn size={20} />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                    <button
                      onClick={() => setShowSplitView(!showSplitView)}
                      className={`p-2 rounded-lg transition-colors ${
                        showSplitView
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      disabled={!currentImage?.processed}
                      title="Vue comparaison"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={!currentImage}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      title="Télécharger"
                    >
                      <Download size={18} />
                      Télécharger
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Display */}
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg min-h-[600px] flex items-center justify-center border border-gray-200">
                  {loading && (
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">Traitement en cours...</p>
                      <p className="text-sm text-gray-500 mt-1">Veuillez patienter</p>
                    </div>
                  )}

                  {!currentImage && !loading && (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ImageIcon size={40} className="text-gray-400" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900 mb-1">Aucune image sélectionnée</p>
                      <p className="text-sm text-gray-500">Chargez des images pour commencer le traitement</p>
                    </div>
                  )}

                  {currentImage && !loading && (
                    <div className="w-full overflow-auto p-4">
                      {showSplitView && currentImage.processed ? (
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 text-gray-700 font-semibold text-sm">
                              <ImageIcon size={16} />
                              <span>Image Originale</span>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-center">
                              <img
                                src={currentImage.original}
                                alt="Original"
                                className="max-w-full h-auto rounded-lg shadow-md"
                                style={{ transform: `scale(${zoom / 100})` }}
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold text-sm">
                              <Sparkles size={16} />
                              <span>Image Traitée</span>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-center">
                              <img
                                src={currentImage.processed}
                                alt="Processed"
                                className="max-w-full h-auto rounded-lg shadow-md"
                                style={{ transform: `scale(${zoom / 100})` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <img
                            src={currentImage.processed || currentImage.original}
                            alt="Current"
                            className="max-w-full h-auto rounded-lg shadow-lg"
                            style={{ transform: `scale(${zoom / 100})` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Image Info */}
                {currentImage && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Fichier</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{currentImage.name}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Statut</p>
                      <p className="text-sm font-medium">
                        <span className={currentImage.processed ? 'text-green-600' : 'text-gray-600'}>
                          {currentImage.processed ? '✓ Modifiée' : '○ Originale'}
                        </span>
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Zoom</p>
                      <p className="text-sm font-medium text-gray-900">{zoom}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: #2563eb;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          background: #1d4ed8;
          transform: scale(1.1);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: #2563eb;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }
        input[type="range"]::-moz-range-thumb:hover {
          background: #1d4ed8;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default ImagePreprocessingPlatform;