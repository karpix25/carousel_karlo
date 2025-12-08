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
  Plus,
  Trash2,
  ArrowRightLeft,
  Link,
  Unlink,
} from 'lucide-react';
import FONT_OPTIONS, { DEFAULT_FONT, getFontStack } from '../constants/fonts';
import { useTranslation } from '../hooks/useTranslation';

export default function PropertiesPanel({ element, onChange, canvasSize }) {
  const { t } = useTranslation();

  if (!element) {
    return (
      <div className="border rounded-2xl p-6 text-center text-sm text-gray-500">
        {t('properties.selectLayer')}
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

  React.useEffect(() => {
    setCollapsedSections({});
    setShowCustomFont(false);
  }, [element?.id]);

  return (
    <div className="border rounded-2xl p-4 space-y-6 bg-white">
      {isText && (
        <>
          {/* TEXT STYLE SECTION */}
          <CollapsibleSection
            title={t('properties.textStyle')}
            isCollapsed={collapsedSections.textStyle}
            onToggle={() => toggleSection('textStyle')}
          >

            <div className="space-y-2">
              <label className="text-xs text-gray-500">{t('properties.font')}</label>
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
                  {t('properties.uploadCustomFont')}
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500">{t('properties.contentPreview')}</label>
              <textarea
                value={element.content_preview || ''}
                onChange={(e) => onChange({ content_preview: e.target.value })}
                placeholder="Enter test text to preview styles..."
                className="w-full border rounded-lg px-3 py-2 text-sm h-20 resize-none"
              />
              <p className="text-xs text-gray-400">
                {t('properties.contentPreviewHint')}
              </p>
            </div>

            <ColorField
              label={t('properties.color')}
              value={element.color}
              onChange={(color) => onChange({ color })}
              dynamicFlag={element.colorDynamic}
              onDynamicChange={(checked) => onChange({ colorDynamic: checked })}
              t={t}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">{t('properties.size')}</label>
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
                <label className="text-xs text-gray-500">{t('properties.spacing')}</label>
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
              <label className="text-xs text-gray-500">{t('properties.resizing')}</label>
              <select
                value={element.resizing || 'plain'}
                onChange={(e) => onChange({ resizing: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="plain">{t('properties.plain')}</option>
                <option value="fitty">{t('properties.fitty')}</option>
                <option value="clamp">{t('properties.clamp')}</option>
                <option value="single">{t('properties.singleLine')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500">{t('properties.style')}</label>
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
              <label className="text-xs text-gray-500">{t('properties.transform')}</label>
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
              <label className="text-xs text-gray-500">{t('properties.highlighting')}</label>
              <ColorField
                label=""
                value={element.highlightColor}
                onChange={(color) => onChange({ highlightColor: color })}
                dynamicFlag={element.highlightColorDynamic}
                onDynamicChange={(checked) => onChange({ highlightColorDynamic: checked })}
                t={t}
              />

              {/* Highlight Mode Toggle */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500">{t('properties.highlightMode')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onChange({ highlightMode: 'background' })}
                    className={`px-3 py-2 text-xs rounded-lg border transition-colors ${(element.highlightMode || 'background') === 'background'
                      ? 'bg-purple-100 border-purple-400 text-purple-700 font-medium'
                      : 'border-gray-300 text-gray-600 hover:border-purple-200'
                      }`}
                  >
                    {t('properties.backgroundMode')}
                  </button>
                  <button
                    onClick={() => onChange({ highlightMode: 'text' })}
                    className={`px-3 py-2 text-xs rounded-lg border transition-colors ${element.highlightMode === 'text'
                      ? 'bg-purple-100 border-purple-400 text-purple-700 font-medium'
                      : 'border-gray-300 text-gray-600 hover:border-purple-200'
                      }`}
                  >
                    {t('properties.textColorMode')}
                  </button>
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

          {/* QUOTE Section */}
          <CollapsibleSection
            title={t('properties.quote')}
            isCollapsed={collapsedSections.quote}
            onToggle={() => toggleSection('quote')}
          >
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={element.quote?.enabled || false}
                onChange={(e) => onChange({
                  quote: { ...element.quote, enabled: e.target.checked }
                })}
                className="rounded"
              />
              <span className="text-sm">{t('properties.enableQuote')}</span>
            </label>

            {element.quote?.enabled && (
              <div className="space-y-3">
                <ColorField
                  label={t('properties.borderColor')}
                  value={element.quote.borderColor || '#9333ea'}
                  onChange={(color) => onChange({
                    quote: { ...element.quote, borderColor: color }
                  })}
                  dynamicFlag={element.quoteBorderColorDynamic}
                  onDynamicChange={(checked) => onChange({ quoteBorderColorDynamic: checked })}
                  t={t}
                />

                <ColorField
                  label={t('properties.backgroundColor')}
                  value={element.quote.backgroundColor || '#f3e8ff'}
                  onChange={(color) => onChange({
                    quote: { ...element.quote, backgroundColor: color }
                  })}
                  dynamicFlag={element.quoteBackgroundColorDynamic}
                  onDynamicChange={(checked) => onChange({ quoteBackgroundColorDynamic: checked })}
                  t={t}
                />

                <Field label={t('properties.borderWidth')}>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={element.quote.borderWidth || 4}
                      onChange={(e) => onChange({
                        quote: { ...element.quote, borderWidth: parseInt(e.target.value) }
                      })}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {element.quote.borderWidth || 4}px
                    </span>
                  </div>
                </Field>

                <p className="text-xs text-gray-400 mt-2">
                  💡 Use «text» or "text" in your content for quotes
                </p>
              </div>
            )}
          </CollapsibleSection>

          <hr className="border-gray-100" />

          {/* TEXTBOX SECTION */}
          <CollapsibleSection
            title={t('properties.textbox')}
            isCollapsed={collapsedSections.textbox}
            onToggle={() => toggleSection('textbox')}
          >

            <div className="space-y-1">
              <label className="text-xs text-gray-500">{t('properties.lineHeight')}</label>
              <input
                type="number"
                step="0.1"
                value={element.lineHeight ?? 1.2}
                onChange={handleInputChange('lineHeight')}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500">{t('properties.background')}</label>
              <ColorField
                label=""
                value={element.backgroundColor}
                onChange={(color) => onChange({ backgroundColor: color })}
                dynamicFlag={element.backgroundColorDynamic}
                onDynamicChange={(checked) => onChange({ backgroundColorDynamic: checked })}
                t={t}
              />
              <button
                onClick={() => onChange({ backgroundColor: '' })}
                className="text-xs text-gray-500 hover:text-red-500"
              >
                Clear background
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500">{t('properties.alignment')}</label>
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
              <label className="text-xs text-gray-500">{t('properties.anchor')}</label>
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
              <label className="text-xs text-gray-500">{t('properties.wordBreak')}</label>
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
        title={t('properties.layout')}
        isCollapsed={collapsedSections.layout}
        onToggle={() => toggleSection('layout')}
      >
        <div className="space-y-2 mb-3">
          <label className="text-xs text-gray-500">{t('properties.quickAlign')}</label>
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
          <Field label={t('properties.url')}>
            <input
              type="text"
              value={element.content || ''}
              onChange={(e) => onChange({ content: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </Field>
          <Field label={t('properties.fit')}>
            <select
              value={element.fit || 'cover'}
              onChange={(e) => onChange({ fit: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="cover">{t('properties.cover')}</option>
              <option value="contain">{t('properties.contain')}</option>
              <option value="fill">{t('properties.fill')}</option>
            </select>
          </Field>
          <Field label={t('properties.radius')}>
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
        title={t('properties.shadow')}
        isCollapsed={collapsedSections.shadow}
        onToggle={() => toggleSection('shadow')}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-500">{t('properties.enableShadow')}</label>
            <button
              onClick={() => onChange({ shadow: element.shadow ? null : { color: '#000000', blur: 10, x: 0, y: 4 } })}
              className={`w-12 h-6 rounded-full transition-colors relative ${element.shadow ? 'bg-purple-600' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${element.shadow ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {element.shadow && (
            <>
              <ColorField
                label={t('properties.color') || 'Color'}
                value={element.shadow.color}
                onChange={(color) => onChange({ shadow: { ...element.shadow, color } })}
                dynamicFlag={element.shadowColorDynamic}
                onDynamicChange={(checked) => onChange({ shadowColorDynamic: checked })}
                t={t}
              />

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

              <Field label={t('properties.opacity') || 'Opacity'}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={(element.shadow.opacity ?? 1) * 100}
                  onChange={(e) => onChange({ shadow: { ...element.shadow, opacity: parseInt(e.target.value) / 100 } })}
                  className="w-full accent-purple-600"
                />
                <div className="text-right text-xs text-gray-500">{Math.round((element.shadow.opacity ?? 1) * 100)}%</div>
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
            <label className="text-xs text-gray-500">{t('properties.enableStroke')}</label>
            <button
              onClick={() => onChange({ stroke: element.stroke ? null : { color: '#000000', width: 2 } })}
              className={`w-12 h-6 rounded-full transition-colors relative ${element.stroke ? 'bg-purple-600' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${element.stroke ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {element.stroke && (
            <>
              <ColorField
                label={t('properties.color') || 'Color'}
                value={element.stroke.color}
                onChange={(color) => onChange({ stroke: { ...element.stroke, color } })}
                dynamicFlag={element.strokeColorDynamic}
                onDynamicChange={(checked) => onChange({ strokeColorDynamic: checked })}
                t={t}
              />

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
                  <label className="text-xs text-gray-500">{t('properties.contourMode')}</label>
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
                onClick={() => {
                  const defaults = {
                    start: element.backgroundColor || '#000000',
                    end: '#ffffff',
                    angle: 90
                  };
                  onChange({
                    gradient: {
                      ...defaults,
                      ...element.gradient,
                      enabled: true
                    }
                  });
                }}
                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${element.gradient?.enabled ? 'bg-white shadow text-purple-700 font-medium' : 'text-gray-500'}`}
              >
              </button>
            </div>

            {!element.gradient?.enabled ? (
              <ColorField
                label={t('properties.color') || 'Color'}
                value={element.backgroundColor}
                onChange={(color) => onChange({ backgroundColor: color })}
                dynamicFlag={element.backgroundColorDynamic}
                onDynamicChange={(checked) => onChange({ backgroundColorDynamic: checked })}
                t={t}
              />
            ) : (
              <>
                {/* Gradient Preview Bar */}
                <div
                  className="w-full h-8 rounded-lg border shadow-sm mb-3 relative"
                  style={{
                    background: `linear-gradient(90deg, ${(element.gradient?.stops || [
                      { color: element.gradient?.start || '#000000', opacity: element.gradient?.startOpacity ?? 1, position: element.gradient?.startPosition ?? 0 },
                      { color: element.gradient?.end || '#ffffff', opacity: element.gradient?.endOpacity ?? 1, position: element.gradient?.endPosition ?? 100 }
                    ]).sort((a, b) => a.position - b.position)
                      .map(s => {
                        const r = parseInt(s.color.slice(1, 3), 16);
                        const g = parseInt(s.color.slice(3, 5), 16);
                        const b = parseInt(s.color.slice(5, 7), 16);
                        return `rgba(${r},${g},${b},${s.opacity}) ${s.position}%`;
                      }).join(', ')
                      })`
                  }}
                />

                {/* Stops List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">Stops</label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          let stops = element.gradient?.stops || [
                            { id: '1', color: element.gradient?.start || '#000000', opacity: element.gradient?.startOpacity ?? 1, position: element.gradient?.startPosition ?? 0 },
                            { id: '2', color: element.gradient?.end || '#ffffff', opacity: element.gradient?.endOpacity ?? 1, position: element.gradient?.endPosition ?? 100 }
                          ];
                          // Reverse positions
                          stops = stops.map(s => ({ ...s, position: 100 - s.position }));
                          onChange({ gradient: { ...element.gradient, stops } });
                        }}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500"
                        title="Reverse Gradient"
                      >
                        <ArrowRightLeft size={14} />
                      </button>
                      <button
                        onClick={() => {
                          const stops = element.gradient?.stops ? [...element.gradient.stops] : [
                            { id: Date.now() + '1', color: element.gradient?.start || '#000000', opacity: element.gradient?.startOpacity ?? 1, position: element.gradient?.startPosition ?? 0 },
                            { id: Date.now() + '2', color: element.gradient?.end || '#ffffff', opacity: element.gradient?.endOpacity ?? 1, position: element.gradient?.endPosition ?? 100 }
                          ];
                          // Add new stop at 50%
                          stops.push({ id: Date.now().toString(), color: '#888888', opacity: 1, position: 50 });
                          // Sort by position? No, let user control, but maybe sort for rendering?
                          // Usually UI shows them in order.
                          onChange({ gradient: { ...element.gradient, stops } });
                        }}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500"
                        title="Add Stop"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {(element.gradient?.stops || [
                    { id: '1', color: element.gradient?.start || '#000000', opacity: element.gradient?.startOpacity ?? 1, position: element.gradient?.startPosition ?? 0 },
                    { id: '2', color: element.gradient?.end || '#ffffff', opacity: element.gradient?.endOpacity ?? 1, position: element.gradient?.endPosition ?? 100 }
                  ])
                    .sort((a, b) => a.position - b.position)
                    .map((stop, index, arr) => (
                      <div key={stop.id || index} className="p-2 bg-gray-50 rounded-lg border border-gray-100 relative group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded border shadow-sm overflow-hidden relative">
                            <input
                              type="color"
                              value={stop.color}
                              onChange={(e) => {
                                const newStops = (element.gradient?.stops || arr).map(s => s.id === stop.id || (s === stop) ? { ...s, color: e.target.value } : s);
                                onChange({ gradient: { ...element.gradient, stops: newStops } });
                              }}
                              className="opacity-0 w-full h-full cursor-pointer absolute inset-0"
                            />
                            <div className="w-full h-full pointer-events-none" style={{ backgroundColor: stop.color }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs">#</span>
                              <input
                                type="text"
                                value={stop.color.replace('#', '').toUpperCase()}
                                onChange={(e) => {
                                  const newStops = (element.gradient?.stops || arr).map(s => s.id === stop.id || (s === stop) ? { ...s, color: `#${e.target.value}` } : s);
                                  onChange({ gradient: { ...element.gradient, stops: newStops } });
                                }}
                                className="w-full bg-transparent text-xs font-mono outline-none"
                              />
                            </div>
                          </div>
                          {arr.length > 2 && (
                            <button
                              onClick={() => {
                                const newStops = arr.filter(s => s !== stop);
                                onChange({ gradient: { ...element.gradient, stops: newStops } });
                              }}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div className="space-y-1">
                          {/* Position */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 w-8">Pos</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={stop.position}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                const newStops = (element.gradient?.stops || arr).map(s => s.id === stop.id || (s === stop) ? { ...s, position: val } : s);
                                onChange({ gradient: { ...element.gradient, stops: newStops } });
                              }}
                              className="flex-1 accent-purple-600 h-1.5"
                            />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={stop.position}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                const newStops = (element.gradient?.stops || arr).map(s => s.id === stop.id || (s === stop) ? { ...s, position: val } : s);
                                onChange({ gradient: { ...element.gradient, stops: newStops } });
                              }}
                              className="w-10 bg-white border rounded px-1 text-xs text-right"
                            />
                          </div>
                          {/* Opacity */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 w-8">Opac</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={Math.round(stop.opacity * 100)}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) / 100;
                                const newStops = (element.gradient?.stops || arr).map(s => s.id === stop.id || (s === stop) ? { ...s, opacity: val } : s);
                                onChange({ gradient: { ...element.gradient, stops: newStops } });
                              }}
                              className="flex-1 accent-purple-600 h-1.5"
                            />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={Math.round(stop.opacity * 100)}
                              onChange={(e) => {
                                const val = Math.min(1, Math.max(0, (parseInt(e.target.value) || 0) / 100));
                                const newStops = (element.gradient?.stops || arr).map(s => s.id === stop.id || (s === stop) ? { ...s, opacity: val } : s);
                                onChange({ gradient: { ...element.gradient, stops: newStops } });
                              }}
                              className="w-10 bg-white border rounded px-1 text-xs text-right"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <Field label="Angle">
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={element.gradient?.angle || 90}
                      onChange={(e) => onChange({ gradient: { ...element.gradient, angle: parseInt(e.target.value) } })}
                      className="flex-1 accent-purple-600"
                    />
                    <div className="text-right text-xs text-gray-500 w-8">{element.gradient?.angle || 90}°</div>
                  </div>
                </Field>
              </>
            )}
          </div>
          <Field label="Radius">
            <input
              type="number"
              value={element.borderRadius || 0}
              onChange={handleInputChange('borderRadius')}
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

// ColorField component with Dynamic checkbox
function ColorField({ label, value, onChange, dynamicFlag, onDynamicChange, t }) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-500">{label}</label>
      <div className="flex gap-2">
        <div
          className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
          style={{ backgroundColor: value || '#ffffff' }}
        >
          <input
            type="color"
            value={value || '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="opacity-0 w-full h-full cursor-pointer"
          />
        </div>
        <div className="flex-1 border rounded-lg flex items-center px-3 bg-gray-50">
          <span className="text-gray-400 mr-2">#</span>
          <input
            type="text"
            value={(value || '').replace('#', '').toUpperCase()}
            onChange={(e) => onChange(`#${e.target.value}`)}
            className="bg-transparent w-full outline-none text-sm font-mono"
          />
        </div>
      </div>
      {onDynamicChange && (
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={dynamicFlag || false}
            onChange={(e) => onDynamicChange(e.target.checked)}
            className="w-4 h-4 accent-purple-600 rounded"
          />
          {t('properties.dynamic')}
        </label>
      )}
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
