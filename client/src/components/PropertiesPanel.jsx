import React from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  ArrowUpToLine,
  ArrowDownToLine,
  MoveVertical,
  Type,
  Check,
  ChevronDown,
  RotateCw,
} from 'lucide-react';
import FONT_OPTIONS, { DEFAULT_FONT, getFontStack } from '../constants/fonts';

export default function PropertiesPanel({ element, onChange, canvasSize }) {
  if (!element) {
    return (
      <div className="border rounded-2xl p-6 text-center text-sm text-gray-500">
        Select a layer to edit its properties.
      </div>
    );
  }

  const isText = element.type === 'text';
  const isImage = element.type === 'image';
  const isShape = element.type === 'shape';

  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    if (value === '') {
      onChange({ [field]: '' });
      return;
    }
    const num = parseFloat(value);
    if (!Number.isNaN(num)) {
      onChange({ [field]: num });
    }
  };

  const toggleStyle = (style) => {
    if (style === 'bold') {
      onChange({ fontWeight: element.fontWeight === 700 ? 400 : 700 });
    } else if (style === 'italic') {
      onChange({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' });
    } else if (style === 'underline') {
      const current = element.textDecoration || 'none';
      onChange({ textDecoration: current.includes('underline') ? current.replace('underline', '').trim() || 'none' : `${current} underline`.trim() });
    } else if (style === 'strikethrough') {
      const current = element.textDecoration || 'none';
    }
  };

  const align = (direction) => {
    if (!element || !canvasSize) return;
    const updates = {};
    switch (direction) {
      case 'left': updates.x = 0; break;
      case 'center': updates.x = Math.round((canvasSize.width - element.width) / 2); break;
      case 'right': updates.x = canvasSize.width - element.width; break;
      case 'top': updates.y = 0; break;
      case 'middle': updates.y = Math.round((canvasSize.height - element.height) / 2); break;
      case 'bottom': updates.y = canvasSize.height - element.height; break;
    }
    onChange(updates);
  };

  const currentFontFamily = element.fontFamily || DEFAULT_FONT;

  const [showCustomFont, setShowCustomFont] = React.useState(false);
  const [collapsedSections, setCollapsedSections] = React.useState({});

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="border rounded-2xl p-4 space-y-6 bg-white">
      {isText && (
        <>
          {/* TEXT STYLE SECTION */}
          <CollapsibleSection
            title="TEXT STYLE"
            isCollapsed={collapsedSections.textStyle}
            onToggle={() => toggleSection('textStyle')}
          >

            <div className="space-y-2">
              <label className="text-xs text-gray-500">Font</label>
              <select
                value={currentFontFamily}
                onChange={(e) => onChange({ fontFamily: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
                {!FONT_OPTIONS.find(f => f.value === currentFontFamily) && (
                  <option value={currentFontFamily}>{currentFontFamily}</option>
                )}
              </select>

              {showCustomFont ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Google Font name..."
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onChange({ fontFamily: e.currentTarget.value });
                        setShowCustomFont(false);
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value) onChange({ fontFamily: e.target.value });
                    }}
                  />
                  <button
                    onClick={() => setShowCustomFont(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomFont(true)}
                  className="text-purple-600 text-sm font-medium hover:underline"
                >
                  Upload Custom Font
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500">Content Preview (for testing)</label>
              <textarea
                value={element.content_preview || ''}
                onChange={(e) => onChange({ content_preview: e.target.value })}
                placeholder="Enter test text to preview styles..."
                className="w-full border rounded-lg px-3 py-2 text-sm h-20 resize-none"
              />
              <p className="text-xs text-gray-400">
                💡 This text is only for preview. Use "Variable name" to inject real data.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500">Color</label>
              <div className="flex gap-2">
                <div
                  className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
                  style={{ backgroundColor: element.color || '#ffffff' }}
                >
                  <input
                    type="color"
                    value={element.color || '#ffffff'}
                    onChange={(e) => onChange({ color: e.target.value })}
                    className="opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
                <div className="flex-1 border rounded-lg flex items-center px-3 bg-gray-50">
                  <span className="text-gray-400 mr-2">#</span>
                  <input
                    type="text"
                    value={(element.color || '').replace('#', '').toUpperCase()}
                    onChange={(e) => onChange({ color: `#${e.target.value}` })}
                    className="bg-transparent w-full outline-none text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Size</label>
                <div className="relative">
                  <input
                    type="number"
                    value={element.fontSize ?? 16}
                    onChange={handleInputChange('fontSize')}
                    className="w-full border rounded-lg px-3 py-2 text-sm pr-8"
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-xs">px</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Spacing</label>
                <div className="relative">
                  <input
                    type="number"
                    value={element.letterSpacing ?? 0}
                    onChange={handleInputChange('letterSpacing')}
                    className="w-full border rounded-lg px-3 py-2 text-sm pr-8"
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-xs">px</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500">Resizing</label>
              <select
                value={element.resizing || 'plain'}
                onChange={(e) => onChange({ resizing: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="plain">Plain text</option>
                <option value="fitty">Fitty (Auto-scale)</option>
                <option value="clamp">Clamp (3 lines)</option>
                <option value="single">Single Line</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500">Style</label>
              <div className="flex gap-2">
                <StyleButton
                  active={element.fontStyle === 'italic'}
                  onClick={() => toggleStyle('italic')}
                  icon={<Italic size={18} />}
                />
                <StyleButton
                  active={(element.textDecoration || '').includes('underline')}
                  onClick={() => toggleStyle('underline')}
                  icon={<Underline size={18} />}
                />
                <StyleButton
                  active={(element.textDecoration || '').includes('line-through')}
                  onClick={() => toggleStyle('strikethrough')}
                  icon={<Strikethrough size={18} />}
                />
                <StyleButton
                  active={element.fontWeight === 700}
                  onClick={() => toggleStyle('bold')}
                  icon={<Bold size={18} />}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500">Transform</label>
              <select
                value={element.textTransform || 'none'}
                onChange={(e) => onChange({ textTransform: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="none">No Transformation</option>
                <option value="uppercase">Uppercase</option>
                <option value="lowercase">Lowercase</option>
                <option value="capitalize">Capitalize</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500">Highlighting (for **text** syntax)</label>
              <div className="flex gap-2">
                <div
                  className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
                  style={{ backgroundColor: element.highlightColor || '#ffeb3b' }}
                >
                  <input
                    type="color"
                    value={element.highlightColor || '#ffeb3b'}
                    onChange={(e) => onChange({ highlightColor: e.target.value })}
                    className="opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
                <div className="flex-1 border rounded-lg flex items-center px-3 bg-gray-50">
                  <span className="text-gray-400 mr-2">#</span>
                  <input
                    type="text"
                    value={(element.highlightColor || '#ffeb3b').replace('#', '').toUpperCase()}
                    onChange={(e) => onChange({ highlightColor: `#${e.target.value}` })}
                    className="bg-transparent w-full outline-none text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Field label="Padding">
                  <div className="relative">
                    <input
                      type="number"
                      value={element.highlightPadding ?? 3}
                      onChange={handleInputChange('highlightPadding')}
                      className="w-full border rounded-lg px-3 py-2 text-sm pr-8"
                    />
                    <span className="absolute right-3 top-2 text-gray-400 text-xs">px</span>
                  </div>
                </Field>
                <Field label="Radius">
                  <div className="relative">
                    <input
                      type="number"
                      value={element.highlightRadius ?? 6}
                      onChange={handleInputChange('highlightRadius')}
                      className="w-full border rounded-lg px-3 py-2 text-sm pr-8"
                    />
                    <span className="absolute right-3 top-2 text-gray-400 text-xs">px</span>
                  </div>
                </Field>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                💡 Use **text** in your content to highlight words with this color
              </p>
            </div>
          </CollapsibleSection>

          <hr className="border-gray-100" />

          {/* TEXTBOX SECTION */}
          <CollapsibleSection
            title="TEXTBOX"
            isCollapsed={collapsedSections.textbox}
            onToggle={() => toggleSection('textbox')}
          >

            <div className="space-y-1">
              <label className="text-xs text-gray-500">Line Height</label>
              <input
                type="number"
                step="0.1"
                value={element.lineHeight ?? 1.2}
                onChange={handleInputChange('lineHeight')}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500">Background</label>
              <div className="flex gap-2 items-center">
                <div
                  className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0 relative overflow-hidden"
                  style={{
                    backgroundColor: element.backgroundColor || 'transparent',
                    backgroundImage: !element.backgroundColor ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                    backgroundSize: '10px 10px',
                    backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                  }}
                >
                  <input
                    type="color"
                    value={element.backgroundColor || '#ffffff'}
                    onChange={(e) => onChange({ backgroundColor: e.target.value })}
                    className="opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
                <div className="flex-1 border rounded-lg flex items-center px-3 bg-gray-50">
                  <span className="text-gray-400 mr-2">#</span>
                  <input
                    type="text"
                    value={(element.backgroundColor || '').replace('#', '').toUpperCase()}
                    onChange={(e) => onChange({ backgroundColor: `#${e.target.value}` })}
                    placeholder="Transparent"
                    className="bg-transparent w-full outline-none text-sm font-mono"
                  />
                </div>
                <button
                  onClick={() => onChange({ backgroundColor: '' })}
                  className="p-2 text-gray-400 hover:text-red-500"
                  title="Clear background"
                >
                  <span className="text-xs">✕</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500">Alignment</label>
              <div className="flex gap-2">
                <StyleButton
                  active={element.textAlign === 'left' || !element.textAlign}
                  onClick={() => onChange({ textAlign: 'left' })}
                  icon={<AlignLeft size={18} />}
                />
                <StyleButton
                  active={element.textAlign === 'center'}
                  onClick={() => onChange({ textAlign: 'center' })}
                  icon={<AlignCenter size={18} />}
                />
                <StyleButton
                  active={element.textAlign === 'right'}
                  onClick={() => onChange({ textAlign: 'right' })}
                  icon={<AlignRight size={18} />}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500">Anchor</label>
              <div className="flex gap-2">
                <StyleButton
                  active={element.verticalAlign === 'top' || !element.verticalAlign}
                  onClick={() => onChange({ verticalAlign: 'top' })}
                  icon={<ArrowUpToLine size={18} />}
                />
                <StyleButton
                  active={element.verticalAlign === 'middle'}
                  onClick={() => onChange({ verticalAlign: 'middle' })}
                  icon={<MoveVertical size={18} />}
                />
                <StyleButton
                  active={element.verticalAlign === 'bottom'}
                  onClick={() => onChange({ verticalAlign: 'bottom' })}
                  icon={<ArrowDownToLine size={18} />}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-500">Word-Break</label>
              <button
                onClick={() => onChange({ wordBreak: !element.wordBreak })}
                className={`w-12 h-6 rounded-full transition-colors relative ${element.wordBreak ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${element.wordBreak ? 'translate-x-6' : ''
                    }`}
                />
              </button>
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* Common Properties for all types */}
      <CollapsibleSection
        title="LAYOUT"
        isCollapsed={collapsedSections.layout}
        onToggle={() => toggleSection('layout')}
      >
        <div className="space-y-2 mb-3">
          <label className="text-xs text-gray-500">Quick Align</label>
          <div className="flex gap-1">
            <StyleButton onClick={() => align('left')} icon={<AlignLeft size={16} />} />
            <StyleButton onClick={() => align('center')} icon={<AlignCenter size={16} />} />
            <StyleButton onClick={() => align('right')} icon={<AlignRight size={16} />} />
            <div className="w-2" />
            <StyleButton onClick={() => align('top')} icon={<ArrowUpToLine size={16} />} />
            <StyleButton onClick={() => align('middle')} icon={<MoveVertical size={16} />} />
            <StyleButton onClick={() => align('bottom')} icon={<ArrowDownToLine size={16} />} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="X">
            <input
              type="number"
              value={element.x ?? 0}
              onChange={handleInputChange('x')}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Y">
            <input
              type="number"
              value={element.y ?? 0}
              onChange={handleInputChange('y')}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Width">
            <input
              type="number"
              value={element.width ?? 0}
              onChange={handleInputChange('width')}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Height">
            <input
              type="number"
              value={element.height ?? 0}
              onChange={handleInputChange('height')}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Rotation">
            <div className="relative">
              <input
                type="number"
                value={element.rotation ?? 0}
                onChange={handleInputChange('rotation')}
                className="w-full border rounded-lg px-3 py-2 text-sm pr-8"
              />
              <div className="absolute right-2 top-2 text-gray-400">
                <RotateCw size={14} />
              </div>
            </div>
          </Field>
          <Field label="Opacity">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={element.opacity ?? 1}
              onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
              className="w-full accent-purple-600"
            />
          </Field>
        </div>
      </CollapsibleSection>

      {/* Image Specific */}
      {isImage && (
        <CollapsibleSection
          title="IMAGE"
          isCollapsed={collapsedSections.image}
          onToggle={() => toggleSection('image')}
        >
          <Field label="URL">
            <input
              type="text"
              value={element.content || ''}
              onChange={(e) => onChange({ content: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Fit">
            <select
              value={element.fit || 'cover'}
              onChange={(e) => onChange({ fit: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
            </select>
          </Field>
          <Field label="Radius">
            <input
              type="number"
              value={element.borderRadius ?? 0}
              onChange={handleInputChange('borderRadius')}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </Field>
        </CollapsibleSection>
      )}

      {/* Shadow Section */}
      <CollapsibleSection
        title="SHADOW"
        isCollapsed={collapsedSections.shadow}
        onToggle={() => toggleSection('shadow')}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-500">Enable Shadow</label>
            <button
              onClick={() => onChange({ shadow: element.shadow ? null : { color: '#000000', blur: 10, x: 0, y: 4 } })}
              className={`w-12 h-6 rounded-full transition-colors relative ${element.shadow ? 'bg-purple-600' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${element.shadow ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {element.shadow && (
            <>
              <Field label="Color">
                <div className="flex gap-2">
                  <div
                    className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
                    style={{ backgroundColor: element.shadow.color || '#000000' }}
                  >
                    <input
                      type="color"
                      value={element.shadow.color || '#000000'}
                      onChange={(e) => onChange({ shadow: { ...element.shadow, color: e.target.value } })}
                      className="opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 border rounded-lg flex items-center px-3 bg-gray-50">
                    <span className="text-gray-400 mr-2">#</span>
                    <input
                      type="text"
                      value={(element.shadow.color || '#000000').replace('#', '').toUpperCase()}
                      onChange={(e) => onChange({ shadow: { ...element.shadow, color: `#${e.target.value}` } })}
                      className="bg-transparent w-full outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="X Offset">
                  <input
                    type="number"
                    value={element.shadow.x ?? 0}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChange({ shadow: { ...element.shadow, x: val === '' ? '' : parseInt(val) || 0 } });
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Y Offset">
                  <input
                    type="number"
                    value={element.shadow.y ?? 0}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChange({ shadow: { ...element.shadow, y: val === '' ? '' : parseInt(val) || 0 } });
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </Field>
              </div>

              <Field label="Blur Radius">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={element.shadow.blur || 0}
                  onChange={(e) => onChange({ shadow: { ...element.shadow, blur: parseInt(e.target.value) } })}
                  className="w-full accent-purple-600"
                />
                <div className="text-right text-xs text-gray-500">{element.shadow.blur || 0}px</div>
              </Field>
            </>
          )}
        </div>
      </CollapsibleSection>

      {/* Stroke Section */}
      <CollapsibleSection
        title="STROKE"
        isCollapsed={collapsedSections.stroke}
        onToggle={() => toggleSection('stroke')}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-500">Enable Stroke</label>
            <button
              onClick={() => onChange({ stroke: element.stroke ? null : { color: '#000000', width: 2 } })}
              className={`w-12 h-6 rounded-full transition-colors relative ${element.stroke ? 'bg-purple-600' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${element.stroke ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {element.stroke && (
            <>
              <Field label="Color">
                <div className="flex gap-2">
                  <div
                    className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
                    style={{ backgroundColor: element.stroke.color || '#000000' }}
                  >
                    <input
                      type="color"
                      value={element.stroke.color || '#000000'}
                      onChange={(e) => onChange({ stroke: { ...element.stroke, color: e.target.value } })}
                      className="opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 border rounded-lg flex items-center px-3 bg-gray-50">
                    <span className="text-gray-400 mr-2">#</span>
                    <input
                      type="text"
                      value={(element.stroke.color || '#000000').replace('#', '').toUpperCase()}
                      onChange={(e) => onChange({ stroke: { ...element.stroke, color: `#${e.target.value}` } })}
                      className="bg-transparent w-full outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </Field>

              <Field label="Width">
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={element.stroke.width || 0}
                  onChange={(e) => onChange({ stroke: { ...element.stroke, width: parseInt(e.target.value) } })}
                  className="w-full accent-purple-600"
                />
                <div className="text-right text-xs text-gray-500">{element.stroke.width || 0}px</div>
              </Field>

              {/* Contour Mode for Images */}
              {isImage && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <label className="text-xs text-gray-500">Contour Mode</label>
                  <input
                    type="checkbox"
                    checked={element.contour || false}
                    onChange={(e) => onChange({ contour: e.target.checked })}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </CollapsibleSection>

      {/* Shape Specific */}
      {isShape && (
        <CollapsibleSection
          title="SHAPE"
          isCollapsed={collapsedSections.shape}
          onToggle={() => toggleSection('shape')}
        >
          <div className="space-y-3">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => onChange({ gradient: { ...element.gradient, enabled: false } })}
                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${!element.gradient?.enabled ? 'bg-white shadow text-purple-700 font-medium' : 'text-gray-500'}`}
              >
                Solid
              </button>
              <button
                onClick={() => onChange({ gradient: { enabled: true, start: element.backgroundColor || '#000000', end: '#ffffff', angle: 90, ...element.gradient } })}
                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${element.gradient?.enabled ? 'bg-white shadow text-purple-700 font-medium' : 'text-gray-500'}`}
              >
                Gradient
              </button>
            </div>

            {!element.gradient?.enabled ? (
              <Field label="Color">
                <div className="flex gap-2">
                  <div
                    className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
                    style={{ backgroundColor: element.backgroundColor || '#000000' }}
                  >
                    <input
                      type="color"
                      value={element.backgroundColor || '#000000'}
                      onChange={(e) => onChange({ backgroundColor: e.target.value })}
                      className="opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 border rounded-lg flex items-center px-3 bg-gray-50">
                    <span className="text-gray-400 mr-2">#</span>
                    <input
                      type="text"
                      value={(element.backgroundColor || '#000000').replace('#', '').toUpperCase()}
                      onChange={(e) => onChange({ backgroundColor: `#${e.target.value}` })}
                      className="bg-transparent w-full outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </Field>
            ) : (
              <>
                <Field label="Start Color">
                  <div className="flex gap-2">
                    <div
                      className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
                      style={{ backgroundColor: element.gradient?.start || '#000000' }}
                    >
                      <input
                        type="color"
                        value={element.gradient?.start || '#000000'}
                        onChange={(e) => onChange({ gradient: { ...element.gradient, start: e.target.value } })}
                        className="opacity-0 w-full h-full cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 border rounded-lg flex items-center px-3 bg-gray-50">
                      <span className="text-gray-400 mr-2">#</span>
                      <input
                        type="text"
                        value={(element.gradient?.start || '#000000').replace('#', '').toUpperCase()}
                        onChange={(e) => onChange({ gradient: { ...element.gradient, start: `#${e.target.value}` } })}
                        className="bg-transparent w-full outline-none text-sm font-mono"
                      />
                    </div>
                  </div>
                </Field>
                <Field label="End Color">
                  <div className="flex gap-2">
                    <div
                      className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
                      style={{ backgroundColor: element.gradient?.end || '#ffffff' }}
                    >
                      <input
                        type="color"
                        value={element.gradient?.end || '#ffffff'}
                        onChange={(e) => onChange({ gradient: { ...element.gradient, end: e.target.value } })}
                        className="opacity-0 w-full h-full cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 border rounded-lg flex items-center px-3 bg-gray-50">
                      <span className="text-gray-400 mr-2">#</span>
                      <input
                        type="text"
                        value={(element.gradient?.end || '#ffffff').replace('#', '').toUpperCase()}
                        onChange={(e) => onChange({ gradient: { ...element.gradient, end: `#${e.target.value}` } })}
                        className="bg-transparent w-full outline-none text-sm font-mono"
                      />
                    </div>
                  </div>
                </Field>
                <Field label="Angle">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={element.gradient?.angle || 90}
                    onChange={(e) => onChange({ gradient: { ...element.gradient, angle: parseInt(e.target.value) } })}
                    className="w-full accent-purple-600"
                  />
                  <div className="text-right text-xs text-gray-500">{element.gradient?.angle || 90}°</div>
                </Field>
              </>
            )}
          </div>
          <Field label="Radius">
            <input
              type="number"
              value={element.borderRadius || 0}
              onChange={(e) => handleNumberChange('borderRadius')(parseInt(e.target.value, 10))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </Field>
        </CollapsibleSection>
      )}

      <div className="pt-4 border-t border-gray-100">
        <Field label="Variable Name">
          <input
            type="text"
            value={element.variableName || ''}
            onChange={(e) => onChange({ variableName: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
            placeholder="e.g. product_name"
          />
        </Field>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, isCollapsed, onToggle, children }) {
  return (
    <div className="space-y-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between bg-purple-50 hover:bg-purple-100 rounded-lg px-4 py-3 transition-colors"
      >
        <h3 className="text-sm font-bold text-purple-900 uppercase">{title}</h3>
        <ChevronDown
          size={20}
          className={`text-purple-900 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
        />
      </button>
      {!isCollapsed && <div className="space-y-4 px-1">{children}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function StyleButton({ active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg border transition-colors ${active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
        }`}
    >
      {icon}
    </button>
  );
}
