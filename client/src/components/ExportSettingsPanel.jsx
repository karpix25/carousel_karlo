import React from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const imageFormats = [
  { label: 'Automatic', value: 'automatic' },
  { label: 'PNG', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
];

const colorModes = [
  { label: 'RGB', value: 'RGB' },
  { label: 'CMYK (beta)', value: 'CMYK' },
];

const pdfQuality = [
  { label: 'High (default)', value: 'high' },
  { label: 'Standard', value: 'standard' },
];

export default function ExportSettingsPanel({ settings, onChange, elements = [], templateId }) {
  const { t } = useTranslation();
  const [collapsedSections, setCollapsedSections] = React.useState({});
  const [copied, setCopied] = React.useState(false);

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getApiPreview = () => {
    const mainVars = {};
    const colorVars = {};

    elements.forEach(el => {
      const varName = el.variableName || el.id;

      // Main content variables
      if (el.variableName) {
        mainVars[el.variableName] = el.type === 'image'
          ? 'https://example.com/image.png'
          : 'Sample Text';
      }

      // Color variables
      if (el.colorDynamic) {
        colorVars[`${varName}_color`] = '#000000';
      }
      if (el.backgroundColorDynamic) {
        colorVars[`${varName}_backgroundColor`] = '#ffffff';
      }
      if (el.highlightColorDynamic) {
        colorVars[`${varName}_highlightColor`] = '#ffeb3b';
      }
      if (el.shadowColorDynamic) {
        colorVars[`${varName}_shadowColor`] = '#000000';
      }
      if (el.strokeColorDynamic) {
        colorVars[`${varName}_strokeColor`] = '#000000';
      }
    });

    const allVars = { ...mainVars, ...colorVars };

    const url = `${window.location.origin}/templates/${templateId || '{id}'}/render`;

    const curl = `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(allVars, null, 2)}' \\
  --output result.png`;

    return curl;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getApiPreview());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-4">
      <SettingsCard
        title={t('export.imageSettings') || 'Image settings'}
        isCollapsed={collapsedSections.image}
        onToggle={() => toggleSection('image')}
      >
        <SettingsField label="Image format">
          <select
            className="w-full bg-transparent focus:outline-none"
            value={settings.imageFormat}
            onChange={(e) => onChange('imageFormat', e.target.value)}
          >
            {imageFormats.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SettingsField>
        <SettingsField label="DPI">
          <input
            className="w-full bg-transparent focus:outline-none"
            type="number"
            min="72"
            max="600"
            value={settings.imageDpi}
            onChange={(e) => onChange('imageDpi', parseInt(e.target.value, 10) || 72)}
          />
        </SettingsField>
        <SettingsField label="Color mode">
          <select
            className="w-full bg-transparent focus:outline-none"
            value={settings.imageColorMode}
            onChange={(e) => onChange('imageColorMode', e.target.value)}
          >
            {colorModes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SettingsField>
      </SettingsCard>

      <SettingsCard
        title={t('export.pdfSettings') || 'PDF settings'}
        isCollapsed={collapsedSections.pdf}
        onToggle={() => toggleSection('pdf')}
      >
        <SettingsField label="Image quality">
          <select
            className="w-full bg-transparent focus:outline-none"
            value={settings.pdfQuality}
            onChange={(e) => onChange('pdfQuality', e.target.value)}
          >
            {pdfQuality.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SettingsField>
        <SettingsField label="DPI">
          <input
            className="w-full bg-transparent focus:outline-none"
            type="number"
            min="72"
            max="600"
            value={settings.pdfDpi}
            onChange={(e) => onChange('pdfDpi', parseInt(e.target.value, 10) || 96)}
          />
        </SettingsField>
        <SettingsField label="Color mode">
          <select
            className="w-full bg-transparent focus:outline-none"
            value={settings.pdfColorMode}
            onChange={(e) => onChange('pdfColorMode', e.target.value)}
          >
            {colorModes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SettingsField>
      </SettingsCard>

      <SettingsCard
        title={t('export.apiIntegration') || 'API Integration'}
        isCollapsed={collapsedSections.api}
        onToggle={() => toggleSection('api')}
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Use this cURL command to generate an image from this template via API.
          </p>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap">
              {getApiPreview()}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            💡 Make sure to define "Variable Name" for elements you want to change dynamically.
          </p>
        </div>
      </SettingsCard>
    </section>
  );
}

function SettingsCard({ title, children, isCollapsed, onToggle }) {
  return (
    <div className="border rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between bg-purple-50 hover:bg-purple-100 px-4 py-3 transition-colors"
      >
        <h3 className="text-sm font-semibold text-purple-900 uppercase">{title}</h3>
        <ChevronDown
          size={20}
          className={`text-purple-900 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
        />
      </button>
      {!isCollapsed && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function SettingsField({ label, children }) {
  return (
    <label className="text-xs text-gray-600 uppercase tracking-wide space-y-1 block">
      {label}
      <div className="text-sm text-gray-800 border rounded-lg px-3 py-2 bg-white">{children}</div>
    </label>
  );
}
