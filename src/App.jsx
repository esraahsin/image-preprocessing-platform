import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, RotateCcw, BarChart3, Eye, History, Sliders } from 'lucide-react';

const ImageProcessor = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [histogram, setHistogram] = useState(null);
  const [normalizeMin, setNormalizeMin] = useState(0);
  const [normalizeMax, setNormalizeMax] = useState(255);
  const [histogramType, setHistogramType] = useState('gray');
  const [showHistogram, setShowHistogram] = useState(false);
  const [showSplitView, setShowSplitView] = useState(false);
  const canvasRef = useRef(null);
  const histogramCanvasRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setOriginalImage(img);
          setProcessedImage(img);
          calculateHistogram(img, 'gray');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const getImageData = (img) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const imageDataToImage = (imageData) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  };

  const calculateHistogram = (img, type = 'gray') => {
    const imageData = getImageData(img);
    const data = imageData.data;
    
    if (type === 'gray') {
      const hist = new Array(256).fill(0);
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        hist[gray]++;
      }
      setHistogram({ gray: hist });
    } else {
      const histR = new Array(256).fill(0);
      const histG = new Array(256).fill(0);
      const histB = new Array(256).fill(0);
      
      for (let i = 0; i < data.length; i += 4) {
        histR[data[i]]++;
        histG[data[i + 1]]++;
        histB[data[i + 2]]++;
      }
      setHistogram({ r: histR, g: histG, b: histB });
    }
  };

  const normalizeImage = () => {
    if (!originalImage) return;
    
    const imageData = getImageData(originalImage);
    const data = imageData.data;
    
    let min = 255, max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      min = Math.min(min, gray);
      max = Math.max(max, gray);
    }
    
    for (let i = 0; i < data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        const normalized = ((data[i + j] - min) / (max - min)) * (normalizeMax - normalizeMin) + normalizeMin;
        data[i + j] = Math.round(normalized);
      }
    }
    
    const newImg = new Image();
    newImg.onload = () => {
      setProcessedImage(newImg);
      calculateHistogram(newImg, histogramType);
    };
    newImg.src = imageDataToImage(imageData);
  };

  const equalizeHistogramFunc = () => {
    if (!originalImage) return;
    
    const imageData = getImageData(originalImage);
    const data = imageData.data;
    const totalPixels = imageData.width * imageData.height;
    
    const hist = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      hist[gray]++;
    }
    
    const cdf = new Array(256).fill(0);
    cdf[0] = hist[0];
    for (let i = 1; i < 256; i++) {
      cdf[i] = cdf[i - 1] + hist[i];
    }
    
    const cdfMin = cdf.find(val => val > 0);
    const lut = new Array(256);
    for (let i = 0; i < 256; i++) {
      lut[i] = Math.round(((cdf[i] - cdfMin) / (totalPixels - cdfMin)) * 255);
    }
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      const newGray = lut[gray];
      data[i] = data[i + 1] = data[i + 2] = newGray;
    }
    
    const newImg = new Image();
    newImg.onload = () => {
      setProcessedImage(newImg);
      calculateHistogram(newImg, histogramType);
    };
    newImg.src = imageDataToImage(imageData);
  };

  const drawHistogram = () => {
    if (!histogram || !histogramCanvasRef.current) return;
    
    const canvas = histogramCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (histogramType === 'gray') {
      const maxVal = Math.max(...histogram.gray);
      ctx.fillStyle = '#6B7280';
      
      for (let i = 0; i < 256; i++) {
        const barHeight = (histogram.gray[i] / maxVal) * height;
        const x = (i / 256) * width;
        const barWidth = width / 256;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      }
    } else {
      const maxR = Math.max(...histogram.r);
      const maxG = Math.max(...histogram.g);
      const maxB = Math.max(...histogram.b);
      const maxVal = Math.max(maxR, maxG, maxB);
      
      ctx.globalAlpha = 0.5;
      
      ['r', 'g', 'b'].forEach((channel) => {
        ctx.fillStyle = channel === 'r' ? '#EF4444' : channel === 'g' ? '#10B981' : '#3B82F6';
        for (let i = 0; i < 256; i++) {
          const barHeight = (histogram[channel][i] / maxVal) * height;
          const x = (i / 256) * width;
          const barWidth = width / 256;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        }
      });
      
      ctx.globalAlpha = 1;
    }
  };

  useEffect(() => {
    if (histogram && showHistogram) {
      drawHistogram();
    }
  }, [histogram, showHistogram, histogramType]);

  const resetImage = () => {
    if (originalImage) {
      setProcessedImage(originalImage);
      calculateHistogram(originalImage, histogramType);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const canvas = document.createElement('canvas');
    canvas.width = processedImage.width;
    canvas.height = processedImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(processedImage, 0, 0);
    
    const link = document.createElement('a');
    link.download = 'image_processed.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sliders className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Amélioration d'Images</h1>
                <p className="text-sm text-gray-500">Histogramme & Normalisation</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors font-medium cursor-pointer"
              >
                <Upload size={18} />
                Charger Image
              </label>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Controls */}
          <div className="col-span-3">
            <div className="space-y-6">
              {/* Normalization Controls */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Normalisation</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">
                      Min: <span className="font-bold text-blue-600">{normalizeMin}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={normalizeMin}
                      onChange={(e) => setNormalizeMin(parseInt(e.target.value))}
                      className="w-full range-slider"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">
                      Max: <span className="font-bold text-blue-600">{normalizeMax}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={normalizeMax}
                      onChange={(e) => setNormalizeMax(parseInt(e.target.value))}
                      className="w-full range-slider"
                    />
                  </div>

                  <button
                    onClick={normalizeImage}
                    disabled={!originalImage}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Appliquer Normalisation
                  </button>
                </div>
              </div>

              {/* Histogram Controls */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Histogramme</h3>
                <div className="space-y-3">
                  <button
                    onClick={equalizeHistogramFunc}
                    disabled={!originalImage}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <History size={16} />
                    Égaliser Histogramme
                  </button>

                  <button
                    onClick={() => setShowHistogram(!showHistogram)}
                    disabled={!originalImage}
                    className={`w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      showHistogram
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <BarChart3 size={16} />
                    {showHistogram ? 'Masquer' : 'Afficher'} Histogramme
                  </button>

                  {showHistogram && (
                    <div>
                      <label className="text-xs text-gray-600 mb-2 block">Type d'histogramme</label>
                      <select
                        value={histogramType}
                        onChange={(e) => {
                          setHistogramType(e.target.value);
                          if (processedImage) {
                            calculateHistogram(processedImage, e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="gray">Niveaux de gris</option>
                        <option value="rgb">Canaux RGB</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowSplitView(!showSplitView)}
                    disabled={!processedImage || processedImage === originalImage}
                    className={`w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      showSplitView
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <Eye size={16} />
                    Vue Comparaison
                  </button>

                  <button
                    onClick={resetImage}
                    disabled={!originalImage}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={16} />
                    Réinitialiser
                  </button>

                  <button
                    onClick={downloadImage}
                    disabled={!processedImage}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Télécharger
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Display */}
          <div className="col-span-9">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Histogram Display */}
              {showHistogram && originalImage && (
                <div className="border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Histogramme</h3>
                  </div>
                  <canvas
                    ref={histogramCanvasRef}
                    width="800"
                    height="150"
                    className="w-full bg-gray-50 rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Image Display */}
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg min-h-[600px] flex items-center justify-center border border-gray-200">
                  {!originalImage ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sliders size={40} className="text-gray-400" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900 mb-1">Aucune image sélectionnée</p>
                      <p className="text-sm text-gray-500">Chargez une image pour commencer</p>
                    </div>
                  ) : showSplitView && processedImage !== originalImage ? (
                    <div className="w-full overflow-auto p-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2 text-gray-700 font-semibold text-sm">
                            <span>Image Originale</span>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-center">
                            <img
                              src={originalImage.src}
                              alt="Original"
                              className="max-w-full h-auto rounded-lg shadow-md"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold text-sm">
                            <span>Image Traitée</span>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-center">
                            <img
                              src={processedImage.src}
                              alt="Processed"
                              className="max-w-full h-auto rounded-lg shadow-md"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-4">
                      <img
                        src={processedImage ? processedImage.src : originalImage.src}
                        alt="Current"
                        className="max-w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .range-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          outline: none;
        }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: #2563eb;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }
        .range-slider::-webkit-slider-thumb:hover {
          background: #1d4ed8;
          transform: scale(1.1);
        }
        .range-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: #2563eb;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }
        .range-slider::-moz-range-thumb:hover {
          background: #1d4ed8;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default ImageProcessor;
