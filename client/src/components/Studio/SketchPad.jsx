import React, { useRef, useState, useEffect } from 'react';
import { Eraser, RotateCcw, Download, Sparkles, Paintbrush, Layers } from 'lucide-react';

export default function SketchPad({ onSketchChange }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1b2a4a');
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('kurta');

  const colors = [
    { name: 'Indigo', hex: '#1b2a4a' },
    { name: 'Terracotta', hex: '#c85a32' },
    { name: 'Gold', hex: '#d4af37' },
    { name: 'Emerald', hex: '#1e4d3b' },
    { name: 'Charcoal', hex: '#222226' },
  ];

  // Initialize canvas with chosen silhouette template
  const loadTemplate = (templateKey) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#fffdf9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e2d8c3';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    if (templateKey === 'kurta') {
      // Draw subtle Kurta silhouette guideline
      ctx.beginPath();
      // Collar / Neckline
      ctx.moveTo(150, 40);
      ctx.quadraticCurveTo(200, 60, 250, 40);
      // Left Shoulder & Sleeve
      ctx.lineTo(330, 90);
      ctx.lineTo(310, 160);
      ctx.lineTo(260, 140);
      // Right Body
      ctx.lineTo(270, 360);
      // Bottom Hem
      ctx.lineTo(130, 360);
      // Left Body
      ctx.lineTo(140, 140);
      ctx.lineTo(90, 160);
      ctx.lineTo(70, 90);
      ctx.closePath();
      ctx.stroke();

      // Mandarin placket guide
      ctx.beginPath();
      ctx.moveTo(200, 50);
      ctx.lineTo(200, 180);
      ctx.stroke();
    } else if (templateKey === 'shirt') {
      // Draw Shirt outline
      ctx.beginPath();
      ctx.moveTo(160, 50);
      ctx.lineTo(200, 75);
      ctx.lineTo(240, 50);
      ctx.lineTo(320, 90);
      ctx.lineTo(300, 170);
      ctx.lineTo(250, 150);
      ctx.lineTo(260, 340);
      ctx.lineTo(140, 340);
      ctx.lineTo(150, 150);
      ctx.lineTo(100, 170);
      ctx.lineTo(80, 90);
      ctx.closePath();
      ctx.stroke();
    } else if (templateKey === 'jacket') {
      // Draw Nehru Jacket / Vest outline
      ctx.beginPath();
      ctx.moveTo(160, 45);
      ctx.quadraticCurveTo(200, 55, 240, 45);
      ctx.lineTo(290, 80);
      ctx.lineTo(275, 145);
      ctx.lineTo(260, 310);
      ctx.lineTo(140, 310);
      ctx.lineTo(125, 145);
      ctx.lineTo(110, 80);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.setLineDash([]); // Reset dash
    saveState();
  };

  useEffect(() => {
    loadTemplate(selectedTemplate);
  }, [selectedTemplate]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistory(prev => [...prev.slice(-10), dataUrl]);
    if (onSketchChange) {
      onSketchChange({
        dataUrl,
        template: selectedTemplate,
        description: `Hand-sketched custom design on ${selectedTemplate} template`
      });
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = isEraser ? '#fffdf9' : color;
    ctx.lineWidth = isEraser ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const undo = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop();
    const previousState = newHistory[newHistory.length - 1];
    setHistory(newHistory);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = previousState;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      if (onSketchChange) {
        onSketchChange({
          dataUrl: previousState,
          template: selectedTemplate,
          description: `Hand-sketched custom design on ${selectedTemplate} template`
        });
      }
    };
  };

  const clearCanvas = () => {
    loadTemplate(selectedTemplate);
  };

  return (
    <div className="bg-white rounded-2xl border border-heritage-silk p-4 sm:p-5 shadow-soft space-y-4">
      
      {/* Top Toolbar: Templates & Clear */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-heritage-silk">
        
        {/* Template Selectors */}
        <div className="flex items-center gap-1.5 bg-heritage-sand p-1 rounded-xl text-xs font-semibold">
          <span className="text-heritage-muted px-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Template:
          </span>
          {['kurta', 'shirt', 'jacket', 'blank'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTemplate(t)}
              className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                selectedTemplate === t 
                  ? 'bg-heritage-indigo text-white shadow-sm' 
                  : 'text-heritage-charcoal hover:bg-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={history.length <= 1}
            className="p-2 rounded-xl text-heritage-indigo bg-heritage-sand hover:bg-heritage-silk disabled:opacity-40 transition-all text-xs font-semibold flex items-center gap-1"
            title="Undo stroke"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          <button
            onClick={clearCanvas}
            className="p-2 rounded-xl text-heritage-terracotta bg-heritage-terracotta/10 hover:bg-heritage-terracotta/20 transition-all text-xs font-semibold"
          >
            Clear Sketch
          </button>
        </div>

      </div>

      {/* Main Canvas Drawing Area */}
      <div className="relative flex justify-center bg-heritage-sand/40 p-2 rounded-2xl border border-dashed border-heritage-silk">
        <canvas
          ref={canvasRef}
          width={400}
          height={380}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="bg-heritage-cream rounded-xl shadow-inner cursor-crosshair touch-none border border-heritage-silk max-w-full h-auto"
        />
        
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-heritage-silk text-[10px] font-medium text-heritage-muted shadow-sm pointer-events-none">
          Draw embroidery, motifs, or necklines
        </div>
      </div>

      {/* Bottom Tool Controls: Palette & Stroke Width */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        
        {/* Color Palette */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-heritage-muted flex items-center gap-1">
            <Paintbrush className="w-3.5 h-3.5 text-heritage-terracotta" /> Color:
          </span>
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => { setColor(c.hex); setIsEraser(false); }}
                style={{ backgroundColor: c.hex }}
                className={`w-6 h-6 rounded-full transition-transform ${
                  !isEraser && color === c.hex ? 'scale-125 ring-2 ring-offset-2 ring-heritage-indigo' : 'hover:scale-110'
                }`}
                title={c.name}
              />
            ))}
            
            {/* Eraser */}
            <button
              onClick={() => setIsEraser(!isEraser)}
              className={`p-1.5 rounded-lg border transition-all ${
                isEraser 
                  ? 'bg-heritage-terracotta text-white border-heritage-terracotta' 
                  : 'bg-heritage-sand text-heritage-charcoal border-heritage-silk hover:bg-white'
              }`}
              title="Eraser"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stroke Width Slider */}
        <div className="flex items-center gap-2 text-xs font-semibold text-heritage-muted">
          <span>Stroke:</span>
          <input
            type="range"
            min="1"
            max="12"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-24 accent-heritage-indigo cursor-pointer"
          />
          <span className="text-[11px] font-mono text-heritage-indigo">{lineWidth}px</span>
        </div>

      </div>

    </div>
  );
}
