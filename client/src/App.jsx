import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';
import DesignerTopBar from './components/DesignerTopBar';
import LayersPanel from './components/LayersPanel';
import ExportSettingsPanel from './components/ExportSettingsPanel';
import ZoomControls from './components/ZoomControls';
import TemplateLibrary from './components/TemplateLibrary';
import useFontLoader from './hooks/useFontLoader';
import { DEFAULT_FONT } from './constants/fonts';
import { parseHtml } from './utils/htmlImporter';

const SIZE_PRESETS = [
  { label: 'Custom Size', value: 'custom' },
  { label: 'Instagram Story', value: 'story', width: 1080, height: 1920 },
  { label: 'Poster', value: 'poster', width: 1600, height: 2000 },
  { label: 'A4 Portrait', value: 'a4', width: 1240, height: 1754 },
];

const DEFAULT_EXPORT_SETTINGS = {
  imageFormat: 'automatic',
  imageDpi: 72,
  imageColorMode: 'RGB',
  pdfQuality: 'high',
  pdfDpi: 96,
  pdfColorMode: 'RGB',
};

const uid = () =>
  (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

function App() {
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [templateName, setTemplateName] = useState('My Template');
  const [canvasSize, setCanvasSize] = useState({ width: 1600, height: 2000 });
  const [templates, setTemplates] = useState([]);
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  const [sizePreset, setSizePreset] = useState('poster');
  const [zoom, setZoom] = useState(0.3);
  const [showGrid, setShowGrid] = useState(true);
  const [lockDimensions, setLockDimensions] = useState(false);
  const [exportSettings, setExportSettings] = useState(DEFAULT_EXPORT_SETTINGS);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/templates');
      const data = await res.json();
      const sorted = [...data].sort((a, b) => {
        const aTime = Date.parse(a.updatedAt || 0);
        const bTime = Date.parse(b.updatedAt || 0);
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
      });
      setTemplates(sorted);
    } catch (err) {
      console.error('Failed to fetch templates', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTemplates();
  }, []);

  const createElement = (type) => {
    const label =
      type === 'text' ? 'Text layer' : type === 'image' ? 'Image layer' : type === 'shape' ? 'Shape layer' : 'Layer';
    const base = {
      id: uid(),
      type,
      x: 80,
      y: 80,
      variableName: '',
      opacity: 1,
      zIndex: elements.length,
      name: `${label} ${elements.length + 1}`,
    };

    if (type === 'image') {
      return {
        ...base,
        width: 320,
        height: 320,
        content: 'https://via.placeholder.com/320x320.png?text=Image',
        fit: 'cover',
      };
    }

    if (type === 'shape') {
      return {
        ...base,
        width: 300,
        height: 120,
        backgroundColor: '#7e3af2',
        borderRadius: 12,
      };
    }

    return {
      ...base,
      width: 420,
      height: 90,
      content: 'Your text here',
      fontSize: 48,
      fontWeight: 600,
      color: '#ffffff',
      textAlign: 'center',
      fontFamily: DEFAULT_FONT,
      lineHeight: 1.2,
      letterSpacing: 0,
      textTransform: 'none',
    };
  };

  const addElement = (type, overrides = {}) => {
    const newElement = { ...createElement(type), ...overrides };
    setElements((prev) => [...prev, newElement]);
    setSelectedId(newElement.id);
  };

  const updateElement = useCallback((id, updates) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } : el)));
  }, []);

  const removeElement = (id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const duplicateElement = (id) => {
    const original = elements.find((el) => el.id === id);
    if (!original) return;
    const clone = {
      ...original,
      id: uid(),
      name: `${original.name || 'Layer'} copy`,
      x: original.x + 20,
      y: original.y + 20,
    };
    setElements((prev) => [...prev, clone]);
    setSelectedId(clone.id);
  };

  const moveLayer = (id, direction) => {
    setElements((prev) => {
      const index = prev.findIndex((el) => el.id === id);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index + 1 : index - 1;
      if (newIndex < 0 || newIndex >= prev.length) {
        return prev;
      }
      const reordered = [...prev];
      const [item] = reordered.splice(index, 1);
      reordered.splice(newIndex, 0, item);
      return reordered;
    });
  };

  const currentElement = useMemo(() => elements.find((el) => el.id === selectedId), [elements, selectedId]);

  const fontsInUse = useMemo(() => {
    return Array.from(
      new Set(elements.filter((el) => el.type === 'text' && el.fontFamily).map((el) => el.fontFamily))
    );
  }, [elements]);

  useFontLoader(fontsInUse);

  const handlePresetChange = (value) => {
    setSizePreset(value);
    if (value === 'custom') return;
    const preset = SIZE_PRESETS.find((presetItem) => presetItem.value === value);
    if (preset) {
      setCanvasSize({ width: preset.width, height: preset.height });
    }
  };

  const handleSizeChange = (dimension, value) => {
    setCanvasSize((prev) => {
      if (Number.isNaN(value)) {
        return prev;
      }
      if (!lockDimensions) {
        return { ...prev, [dimension]: value };
      }
      if (dimension === 'width') {
        const ratio = prev.height / (prev.width || 1);
        return {
          width: value,
          height: Math.round(value * ratio),
        };
      }
      const ratio = prev.width / (prev.height || 1);
      return {
        width: Math.round(value * ratio),
        height: value,
      };
    });
    if (sizePreset !== 'custom') {
      setSizePreset('custom');
    }
  };

  const saveTemplate = async () => {
    const template = {
      id: currentTemplateId,
      name: templateName,
      width: canvasSize.width,
      height: canvasSize.height,
      elements,
      exportSettings,
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      const saved = await res.json();
      setCurrentTemplateId(saved.id);
      setTemplateName(saved.name || templateName);
      setExportSettings(saved.exportSettings || exportSettings);
      fetchTemplates();
      window.alert('Template saved');
    } catch (err) {
      console.error('Failed to save template', err);
      alert('Failed to save template');
    }
  };

  const loadTemplate = async (id) => {
    try {
      const res = await fetch(`/templates/${id}`);
      const data = await res.json();
      setTemplateName(data.name || 'Untitled');
      setCanvasSize({ width: data.width, height: data.height });
      setElements(data.elements || []);
      setExportSettings(data.exportSettings || DEFAULT_EXPORT_SETTINGS);
      setCurrentTemplateId(data.id);
      setSelectedId(null);
      setSizePreset('custom');
    } catch (err) {
      console.error('Failed to load template', err);
    }
  };

  const handleExportSettingChange = (key, value) => {
    setExportSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateNewTemplate = () => {
    setTemplateName('My Template');
    setCanvasSize({ width: 1600, height: 2000 });
    setElements([]);
    setSelectedId(null);
    setCurrentTemplateId(null);
    setExportSettings(DEFAULT_EXPORT_SETTINGS);
    setSizePreset('poster');
  };

  const [isPanning, setIsPanning] = useState(false);
  const scrollContainerRef = React.useRef(null);
  const lastMousePos = React.useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setZoom((prev) => Math.min(Math.max(0.1, prev + delta), 5));
    }
    // Otherwise let native scroll happen
  }, []);

  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault(); // Prevent scrolling
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMouseDown = useCallback((e) => {
    // Middle mouse button or Spacebar held
    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [isSpacePressed]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning && scrollContainerRef.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;

      // Scroll in the opposite direction of drag
      scrollContainerRef.current.scrollLeft -= dx;
      scrollContainerRef.current.scrollTop -= dy;

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleImportHtml = (content) => {
    try {
      let importedData;
      // Simple check for JSON vs HTML
      if (content.trim().startsWith('{')) {
        const json = JSON.parse(content);
        // Basic validation
        if (!json.elements || !json.width) {
          throw new Error('Invalid JSON template');
        }
        importedData = {
          width: json.width,
          height: json.height,
          elements: json.elements,
          name: json.name || 'Imported Template'
        };
      } else {
        importedData = parseHtml(content);
      }

      const { width, height, elements: importedElements, name } = importedData;
      setCanvasSize({ width, height });
      setElements(importedElements);
      setTemplateName(name || 'Imported Template');
      setSelectedId(null);
      setCurrentTemplateId(null);
      setSizePreset('custom');
      alert('Template imported successfully!');
    } catch (err) {
      console.error('Import failed', err);
      alert('Failed to parse template (HTML or JSON)');
    }
  };

  const handleExportTemplate = () => {
    const templateData = {
      name: templateName,
      width: canvasSize.width,
      height: canvasSize.height,
      elements,
      exportSettings,
      version: '1.0'
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templateData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${templateName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <DesignerTopBar
        presets={SIZE_PRESETS}
        templateName={templateName}
        onTemplateNameChange={setTemplateName}
        canvasSize={canvasSize}
        onSizeChange={handleSizeChange}
        sizePreset={sizePreset}
        onPresetChange={handlePresetChange}
        lockDimensions={lockDimensions}
        onToggleLock={() => setLockDimensions((prev) => !prev)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((prev) => !prev)}
        onSave={saveTemplate}
      />

      <div className="flex flex-1 overflow-hidden">
        <Toolbar onAdd={addElement} />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-auto bg-gray-200 relative"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isPanning ? 'grabbing' : isSpacePressed ? 'grab' : 'default' }}
          >
            <div className="min-h-full w-full flex items-center justify-center p-12">
              <Canvas
                elements={elements}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onUpdate={updateElement}
                width={canvasSize.width}
                height={canvasSize.height}
                zoom={zoom}
                showGrid={showGrid}
                isSpacePressed={isSpacePressed}
              />
            </div>
          </div>
          <ZoomControls zoom={zoom} onZoomChange={setZoom} />
        </div>

        <div className="w-96 bg-white border-l overflow-y-auto p-4 space-y-4">
          <LayersPanel
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDuplicate={duplicateElement}
            onDelete={removeElement}
            onMoveLayer={moveLayer}
            onUpdate={updateElement}
          />

          <PropertiesPanel
            element={currentElement}
            onChange={(updates) => currentElement && updateElement(currentElement.id, updates)}
            canvasSize={canvasSize}
          />

          <TemplateLibrary
            templates={templates}
            onLoad={loadTemplate}
            currentTemplateId={currentTemplateId}
            onCreateNew={handleCreateNewTemplate}
            onImport={handleImportHtml}
            onExport={handleExportTemplate}
            onRefresh={fetchTemplates}
          />

          <ExportSettingsPanel
            settings={exportSettings}
            onChange={handleExportSettingChange}
            elements={elements}
            templateId={currentTemplateId}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
