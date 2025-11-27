import React, { useState, useRef } from 'react';
import { Upload, Download, RotateCcw, ZoomIn, ZoomOut, Trash2, Image as ImageIcon, Grid, Sliders, Eye } from 'lucide-react';

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
  const [success, setSuccess] = useState('');
  
  // Paramètres pour les traitements
  const [threshold, setThreshold] = useState(127);
  const [blurIntensity, setBlurIntensity] = useState(5);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [scalePercent, setScalePercent] = useState(100);
  
  const fileInputRef = useRef(null);
  const currentImage = images[currentImageIndex];

  // Fonction de debug pour analyser les réponses
  const debugResponse = (response, operation) => {
    console.log("🔍 DEBUG RESPONSE:", {
      operation: operation,
      success: response.success,
      imageLength: response.processed_image?.length,
      imagePreview: response.processed_image ? response.processed_image.substring(0, 50) + "..." : "NO_IMAGE"
    });
    
    // Vérifier si l'image base64 est valide
    if (response.processed_image) {
      const img = new Image();
      img.onload = () => console.log("✅ Image base64 valide - chargement réussi");
      img.onerror = (e) => {
        console.log("❌ Image base64 invalide - erreur de chargement", e);
        console.log("📝 Type MIME probablement incorrect");
      };
      // Essayer différents formats MIME
      img.src = `data:image/jpeg;base64,${response.processed_image}`;
    }
  };

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
          setSuccess(`${files.length} image(s) chargée(s) avec succès`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const applyProcessing = async (operation, params = {}) => {
    if (!currentImage) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log(`🔄 Application de l'opération: ${operation}`, params);
      
      // Extraire les données base64 pures (sans le préfixe data:image)
      const base64Data = currentImage.processed || currentImage.original;
      const imageData = base64Data.split(',')[1];
      
      console.log(`📤 Envoi vers API - Données image: ${imageData.length} caractères`);

      const response = await fetch('http://localhost:5000/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          operation: operation,
          params: params
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      // DEBUG de la réponse
      debugResponse(data, operation);
      
      if (data.success) {
        // Vérifier que processed_image existe
        if (!data.processed_image) {
          throw new Error('Aucune image retournée par le serveur');
        }
        
        // Créer l'URL data avec le bon format MIME
        // Essayer d'abord JPEG, puis PNG si problème
        let processedImageUrl;
        try {
          processedImageUrl = `data:image/jpeg;base64,${data.processed_image}`;
          console.log("🖼️ URL image créée (JPEG):", processedImageUrl.substring(0, 80) + "...");
        } catch (e) {
          console.log("🔄 Essai avec format PNG...");
          processedImageUrl = `data:image/png;base64,${data.processed_image}`;
        }
        
        // Mettre à jour l'état
        setProcessedImage(processedImageUrl);
        
        // Sauvegarder dans l'historique
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({
          operation,
          params,
          result: processedImageUrl
        });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        // Mettre à jour l'image courante
        const updatedImages = [...images];
        updatedImages[currentImageIndex].processed = processedImageUrl;
        setImages(updatedImages);
        
        setSuccess(`Opération "${operation}" appliquée avec succès`);
        console.log("✅ Opération terminée avec succès");
        
      } else {
        throw new Error(data.error || 'Erreur lors du traitement');
      }
      
    } catch (err) {
      console.error("❌ Erreur détaillée:", err);
      setError('Erreur lors du traitement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setProcessedImage(history[newIndex].result);
      
      const updatedImages = [...images];
      updatedImages[currentImageIndex].processed = history[newIndex].result;
      setImages(updatedImages);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setProcessedImage(history[newIndex].result);
      
      const updatedImages = [...images];
      updatedImages[currentImageIndex].processed = history[newIndex].result;
      setImages(updatedImages);
    }
  };

  const handleDownload = () => {
    if (!currentImage || !currentImage.processed) {
      setError('Aucune image traitée à télécharger');
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = currentImage.processed;
      link.download = `processed_${currentImage.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('Image téléchargée avec succès');
    } catch (err) {
      setError('Erreur lors du téléchargement: ' + err.message);
    }
  };

  const deleteImage = (id) => {
    const newImages = images.filter(img => img.id !== id);
    setImages(newImages);
    
    if (newImages.length === 0) {
      setCurrentImageIndex(0);
      setHistory([]);
      setHistoryIndex(-1);
    } else if (currentImageIndex >= newImages.length) {
      setCurrentImageIndex(newImages.length - 1);
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
    setSuccess('Image réinitialisée');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Plateforme de Prétraitement d'Images
          </h1>
          <p className="text-purple-200">Développé avec React et Flask</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            ❌ {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200">
            ✅ {success}
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
                      onClick={() => {
                        setCurrentImageIndex(idx);
                        setProcessedImage(images[idx].processed);
                      }}
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
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Supprimer"
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
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Niveaux de Gris'}
                </button>
                <button
                  onClick={() => applyProcessing('rgb_to_hsv')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'RGB → HSV'}
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
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Seuillage Binaire'}
                </button>
                <button
                  onClick={() => applyProcessing('threshold_adaptive')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Seuillage Adaptatif'}
                </button>
                <button
                  onClick={() => applyProcessing('threshold_otsu')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Seuillage Otsu'}
                </button>
              </div>
            </div>

            {/* Filtres Section - VOTRE PARTIE */}
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
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Flou Gaussien'}
                </button>
                <button
                  onClick={() => applyProcessing('median_blur', { intensity: blurIntensity })}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Filtre Médian'}
                </button>
                <button
                  onClick={() => applyProcessing('sharpen')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Accentuation'}
                </button>
              </div>
            </div>

            {/* Détection Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Détection</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('edge_canny')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Contours Canny'}
                </button>
                <button
                  onClick={() => applyProcessing('edge_sobel')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Contours Sobel'}
                </button>
                <button
                  onClick={() => applyProcessing('edge_laplacian')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Laplacien'}
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
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Redimensionner'}
                </button>
                <button
                  onClick={() => applyProcessing('rotate', { angle: rotationAngle })}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Rotation'}
                </button>
                <button
                  onClick={() => applyProcessing('flip_horizontal')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Miroir Horizontal'}
                </button>
                <button
                  onClick={() => applyProcessing('flip_vertical')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Miroir Vertical'}
                </button>
              </div>
            </div>

            {/* Amélioration Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Amélioration</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('histogram_equalization')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Égalisation Histogramme'}
                </button>
                <button
                  onClick={() => applyProcessing('normalize')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Normalisation'}
                </button>
                <button
                  onClick={() => applyProcessing('clahe')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'CLAHE'}
                </button>
              </div>
            </div>

            {/* Segmentation Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Segmentation</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('channel_r')}
                  className="w-full py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Canal Rouge'}
                </button>
                <button
                  onClick={() => applyProcessing('channel_g')}
                  className="w-full py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Canal Vert'}
                </button>
                <button
                  onClick={() => applyProcessing('channel_b')}
                  className="w-full py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Canal Bleu'}
                </button>
              </div>
            </div>

            {/* Analyse Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Analyse</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyProcessing('show_histogram')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Afficher Histogramme'}
                </button>
                <button
                  onClick={() => applyProcessing('detect_faces')}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentImage || loading}
                >
                  {loading ? 'Traitement...' : 'Détecter Visages'}
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
                    disabled={historyIndex <= 0 || loading}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
                    title="Annuler"
                  >
                    <RotateCcw size={20} />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1 || loading}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
                    title="Rétablir"
                  >
                    <RotateCcw size={20} className="transform scale-x-[-1]" />
                  </button>
                  <button
                    onClick={resetImage}
                    disabled={!currentImage || loading}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
                    title="Réinitialiser"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    disabled={loading}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <ZoomOut size={20} />
                  </button>
                  <span className="text-white px-3">{zoom}%</span>
                  <button
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                    disabled={loading}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <ZoomIn size={20} />
                  </button>
                  <button
                    onClick={() => setShowSplitView(!showSplitView)}
                    disabled={!currentImage?.processed || loading}
                    className={`p-2 rounded-lg transition-colors ${
                      showSplitView
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    } disabled:opacity-50`}
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!currentImage?.processed || loading}
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
                    <p className="text-sm text-purple-300 mt-2">Veuillez patienter</p>
                  </div>
                )}

                {!currentImage && !loading && (
                  <div className="text-center text-white/50">
                    <ImageIcon size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Aucune image sélectionnée</p>
                    <p className="text-sm mt-2">Uploadez des images pour commencer le traitement</p>
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
                            className="w-full h-auto rounded-lg max-h-[500px] object-contain"
                          />
                        </div>
                        <div>
                          <h4 className="text-white text-center mb-2">Traité</h4>
                          <img
                            src={currentImage.processed}
                            alt="Processed"
                            className="w-full h-auto rounded-lg max-h-[500px] object-contain"
                            onError={(e) => {
                              console.error("❌ Erreur chargement image traitée");
                              e.target.src = currentImage.original;
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <img
                          src={currentImage.processed || currentImage.original}
                          alt="Current"
                          className="max-w-full max-h-[500px] h-auto rounded-lg mx-auto object-contain"
                          style={{ transform: `scale(${zoom / 100})` }}
                          onError={(e) => {
                            console.error("❌ Erreur chargement image");
                            if (currentImage.processed) {
                              e.target.src = currentImage.original;
                            }
                          }}
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
                    {currentImage.processed ? (
                      <span className="text-green-400">Modifiée</span>
                    ) : (
                      <span className="text-blue-400">Originale</span>
                    )}
                  </p>
                  <p>
                    <span className="font-semibold">Historique:</span> {history.length} opération(s)
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