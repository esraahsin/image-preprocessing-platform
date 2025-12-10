import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, RotateCcw, Sliders, BarChart3, Maximize2, History } from 'lucide-react';

const ImageProcessor = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [histogram, setHistogram] = useState(null);
  const [normalizeMin, setNormalizeMin] = useState(0);
  const [normalizeMax, setNormalizeMax] = useState(255);
  const [histogramType, setHistogramType] = useState('gray');
  const [showHistogram, setShowHistogram] = useState(false);
  const [equalizeHistogram, setEqualizeHistogram] = useState(false);
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
      ctx.fillStyle = '#4B5563';
      
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
      
      ['r', 'g', 'b'].forEach((channel, idx) => {
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
    
    ctx.strokeStyle = '#9CA3AF';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.stroke();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Prétraitement d'Images</h1>
          <p className="text-purple-200">Histogramme & Normalisation</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <label className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-all transform hover:scale-105">
              <Upload size={20} />
              <span>Charger une image</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>

            <button
              onClick={normalizeImage}
              disabled={!originalImage}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white rounded-lg transition-all transform hover:scale-105 disabled:cursor-not-allowed"
            >
              <Sliders size={20} />
              Normaliser
            </button>

            <button
              onClick={equalizeHistogramFunc}
              disabled={!originalImage}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded-lg transition-all transform hover:scale-105 disabled:cursor-not-allowed"
            >
              <History size={20} />
              Égaliser l'histogramme
            </button>

            <button
              onClick={() => setShowHistogram(!showHistogram)}
              disabled={!originalImage}
              className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-500 text-white rounded-lg transition-all transform hover:scale-105 disabled:cursor-not-allowed"
            >
              <BarChart3 size={20} />
              {showHistogram ? 'Masquer' : 'Afficher'} Histogramme
            </button>

            <button
              onClick={resetImage}
              disabled={!originalImage}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white rounded-lg transition-all transform hover:scale-105 disabled:cursor-not-allowed"
            >
              <RotateCcw size={20} />
              Réinitialiser
            </button>

            <button
              onClick={downloadImage}
              disabled={!processedImage}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 text-white rounded-lg transition-all transform hover:scale-105 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              Télécharger
            </button>
          </div>

          {originalImage && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <label className="block text-white mb-2 text-sm">Normalisation Min (0-255)</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={normalizeMin}
                  onChange={(e) => setNormalizeMin(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-white text-sm">{normalizeMin}</span>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <label className="block text-white mb-2 text-sm">Normalisation Max (0-255)</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={normalizeMax}
                  onChange={(e) => setNormalizeMax(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-white text-sm">{normalizeMax}</span>
              </div>
            </div>
          )}

          {showHistogram && originalImage && (
            <div className="mt-6 bg-white/5 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Histogramme</h3>
                <select
                  value={histogramType}
                  onChange={(e) => {
                    setHistogramType(e.target.value);
                    calculateHistogram(processedImage, e.target.value);
                  }}
                  className="bg-white/10 text-white px-4 py-2 rounded-lg border border-white/20"
                >
                  <option value="gray">Niveaux de gris</option>
                  <option value="rgb">Canaux RGB</option>
                </select>
              </div>
              <canvas
                ref={histogramCanvasRef}
                width="800"
                height="200"
                className="w-full bg-white/5 rounded-lg"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Maximize2 size={20} />
              Image Originale
            </h3>
            <div className="bg-white/5 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
              {originalImage ? (
                <img src={originalImage.src} alt="Original" className="max-w-full max-h-[500px] rounded-lg" />
              ) : (
                <p className="text-gray-400">Aucune image chargée</p>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Maximize2 size={20} />
              Image Traitée
            </h3>
            <div className="bg-white/5 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
              {processedImage ? (
                <img src={processedImage.src} alt="Processed" className="max-w-full max-h-[500px] rounded-lg" />
              ) : (
                <p className="text-gray-400">Aucune image traitée</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Guide d'utilisation</h3>
          <div className="text-purple-100 space-y-2 text-sm">
            <p><strong>Normalisation :</strong> Ajuste les valeurs de pixels dans une plage définie (min-max) pour améliorer le contraste.</p>
            <p><strong>Égalisation d'histogramme :</strong> Redistribue les intensités de pixels pour améliorer le contraste global de l'image.</p>
            <p><strong>Histogramme :</strong> Visualise la distribution des intensités de pixels (niveaux de gris ou canaux RGB).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageProcessor;