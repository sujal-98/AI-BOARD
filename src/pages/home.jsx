import { useState, useRef, useEffect } from 'react';

const Home = () => {
  // Initialize state and refs
  const [darkMode, setDarkMode] = useState(false);
  const [markerColor, setMarkerColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState(null);
  
  
  // Update marker color when dark mode changes
  useEffect(() => {
    // Set default marker color to white if in dark mode and current color is black
    if (darkMode && markerColor === '#000000') {
      setMarkerColor('#ffffff');
    } else if (!darkMode && markerColor === '#ffffff') {
      // Set default marker color to black if switching to light mode and current color is white
      setMarkerColor('#000000');
    }
  }, [darkMode, markerColor]);
  const [tool, setTool] = useState('pencil'); // pencil, eraser, clear
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize canvas when component mounts or when dark mode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas dimensions to match its display size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const context = canvas.getContext('2d');
    
    // Apply initial canvas settings
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = lineWidth;
    context.strokeStyle = markerColor;
    
    // Fill canvas with background color based on theme
    context.fillStyle = darkMode ? '#121212' : '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    contextRef.current = context;


  }, [darkMode]);

  // Update drawing settings when they change
  useEffect(() => {
    if (!contextRef.current) return;
    contextRef.current.lineWidth = lineWidth;
    contextRef.current.strokeStyle = tool === 'eraser' 
      ? (darkMode ? '#121212' : '#ffffff') 
      : markerColor;
  }, [markerColor, lineWidth, tool, darkMode]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Store current image data
      const context = canvas.getContext('2d');
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Resize canvas
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Restore image data and settings
      context.putImageData(imageData, 0, 0);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = lineWidth;
      context.strokeStyle = tool === 'eraser' 
        ? (darkMode ? '#121212' : '#ffffff') 
        : markerColor;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [lineWidth, markerColor, tool, darkMode]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    
    contextRef.current.fillStyle = darkMode ? '#121212' : '#ffffff';
    contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleToolClick = (selectedTool) => {
    setTool(selectedTool);
    
    if (!contextRef.current) return;
    
    if (selectedTool === 'eraser') {
      contextRef.current.strokeStyle = darkMode ? '#121212' : '#ffffff';
    } else if (selectedTool === 'pencil') {
      contextRef.current.strokeStyle = markerColor;
    } else if (selectedTool === 'clear') {
      clearCanvas();
    }
  };

  // Styles
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: darkMode ? '#121212' : '#f5f5f5',
    color: darkMode ? '#ffffff' : '#000000',
    transition: 'background-color 0.3s, color 0.3s'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'background-color 0.3s'
  };

  const titleStyle = {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 'bold'
  };

  const themeButtonStyle = {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: darkMode ? '#90caf9' : '#1976d2',
    color: darkMode ? '#000000' : '#ffffff',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const toolbarStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    gap: '1rem',
    flexWrap: 'wrap',
    margin: '1rem',
    borderRadius: '8px',
    transition: 'background-color 0.3s'
  };

  const buttonStyle = (isActive) => ({
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: isActive 
      ? (darkMode ? '#90caf9' : '#1976d2') 
      : (darkMode ? '#333333' : '#e0e0e0'),
    color: isActive 
      ? (darkMode ? '#000000' : '#ffffff') 
      : (darkMode ? '#ffffff' : '#000000'),
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'background-color 0.2s, color 0.2s'
  });

  const clearButtonStyle = {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: darkMode ? '#f44336' : '#f44336',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const colorPickerContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const colorPickerStyle = {
    width: '40px',
    height: '40px',
    padding: '0',
    border: 'none',
    borderRadius: '4px',
    cursor: tool === 'eraser' ? 'not-allowed' : 'pointer',
    opacity: tool === 'eraser' ? 0.5 : 1
  };

  const sliderContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexGrow: 1
  };

  const sliderLabelStyle = {
    minWidth: '80px'
  };

  const sliderStyle = {
    flexGrow: 1,
    height: '6px',
    appearance: 'none',
    backgroundColor: darkMode ? '#333333' : '#e0e0e0',
    borderRadius: '3px',
    outline: 'none'
  };

  const canvasContainerStyle = {
    flex: 1,
    margin: '0 1rem 1rem 1rem',
    backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'relative'
  };

  const canvasStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    cursor: 'crosshair'
  };

  const resultBarStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
    padding: '1rem',
    transform: showResult ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.3s ease-in-out',
    zIndex: 1000,
    maxHeight: '50vh',
    overflowY: 'auto'
  };

  const resultHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    cursor: 'pointer'
  };

  const resultContentStyle = {
    padding: '1rem',
    backgroundColor: darkMode ? '#2d2d2d' : '#f5f5f5',
    borderRadius: '4px',
    marginTop: '0.5rem'
  };

  const processButtonStyle = {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: darkMode ? '#4caf50' : '#2e7d32',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginLeft: 'auto'
  };

  const processImage = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Get canvas content as base64 image
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL('image/png');
      
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('image', blob, 'canvas-image.png');
      
      // Send to backend
      const result = await fetch('http://localhost:3000/process-image', {
        method: 'POST',
        body: formData
      });
      
      const data = await result.json();
      
      if (data.status === 'success') {
        setResult(data);
        setShowResult(true);
      } else {
        throw new Error(data.message || 'Failed to process image');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error processing image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add process button to toolbar
  const toolbarContent = (
    <>
      <button 
        style={buttonStyle(tool === 'pencil')}
        onClick={() => handleToolClick('pencil')}
      >
        ✏️ Pencil
      </button>
      <button 
        style={buttonStyle(tool === 'eraser')}
        onClick={() => handleToolClick('eraser')}
      >
        🧽 Eraser
      </button>
      <button 
        style={clearButtonStyle}
        onClick={() => handleToolClick('clear')}
      >
        🗑️ Clear
      </button>
      
      <div style={colorPickerContainerStyle}>
        <span>🎨 Color:</span>
        <input 
          type="color" 
          value={markerColor}
          onChange={(e) => setMarkerColor(e.target.value)}
          disabled={tool === 'eraser'}
          style={colorPickerStyle}
        />
      </div>
      
      <div style={sliderContainerStyle}>
        <span style={sliderLabelStyle}>Line Width: {lineWidth}px</span>
        <input
          type="range"
          min="1"
          max="20"
          value={lineWidth}
          onChange={(e) => setLineWidth(parseInt(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <button
        style={processButtonStyle}
        onClick={processImage}
        disabled={isProcessing}
      >
        {isProcessing ? '🔄 Processing...' : '🔍 Process Formula'}
      </button>
    </>
  );

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Interactive Whiteboard</h1>
        <button 
          style={themeButtonStyle}
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </header>
      
      <div style={toolbarStyle}>
        {toolbarContent}
      </div>

      <div style={canvasContainerStyle}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={canvasStyle}
        />
      </div>

      {/* Result Bar */}
      <div style={resultBarStyle}>
        <div 
          style={resultHeaderStyle}
          onClick={() => setShowResult(!showResult)}
        >
          <h3 style={{ margin: 0 }}>
            {result ? 'Recognized Formula' : 'No Formula Processed'}
          </h3>
          <span>{showResult ? '▼' : '▲'}</span>
        </div>
        
        {showResult && result && (
          <div style={resultContentStyle}>
            {error ? (
              <div style={{ color: '#f44336' }}>Error: {error}</div>
            ) : (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>LaTeX Formula:</strong>
                  <pre style={{ 
                    backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    overflowX: 'auto'
                  }}>
                    {result.formula}
                  </pre>
                </div>
                <div style={{ color: darkMode ? '#b0b0b0' : '#666666' }}>
                  {result.explanation}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;