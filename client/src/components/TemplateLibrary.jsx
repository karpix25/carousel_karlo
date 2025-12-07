import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import Tooltip from './Tooltip';

export default function TemplateLibrary({ templates, onLoad, currentTemplateId, onCreateNew, onImport, onExport }) {
  const { t } = useTranslation();
  const [isImporting, setIsImporting] = React.useState(false);
  const [importCode, setImportCode] = React.useState('');

  return (
    <section>
      <header className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-purple-900 uppercase">{t('templates.title')}</h3>
          <p className="text-xs text-gray-500">
            {t('templates.savedLayouts') || `Saved layouts (${templates.length})`}
          </p>
        </div>
        <Tooltip text={t('tooltips.templates.createNew')}>
          <button
            type="button"
            onClick={onCreateNew}
            className="text-xs font-semibold text-purple-700 border border-purple-200 rounded-full px-3 py-1 hover:bg-purple-50"
          >
            + {t('templates.createNew')}
          </button>
        </Tooltip>
      </header>

      {/* Import/Export Section */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          <Tooltip text={t('tooltips.templates.import')}>
            <button
              onClick={() => setIsImporting(!isImporting)}
              className="text-xs text-purple-600 hover:underline"
            >
              {isImporting ? t('templates.cancel') : t('templates.import')}
            </button>
          </Tooltip>
          <span className="text-gray-300">|</span>
          <Tooltip text={t('tooltips.templates.export')}>
            <button
              onClick={onExport}
              className="text-xs text-purple-600 hover:underline"
            >
              {t('templates.export')}
            </button>
          </Tooltip>
        </div>

        {isImporting && (
          <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <textarea
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              placeholder={t('templates.pasteHtml')}
              className="w-full text-xs font-mono border rounded-lg p-2 h-24 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              onClick={() => {
                if (importCode.trim()) {
                  onImport(importCode);
                  setImportCode('');
                  setIsImporting(false);
                }
              }}
              disabled={!importCode.trim()}
              className="w-full bg-purple-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {t('templates.import')}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-auto pr-1">
        {templates.map((template) => {
          const isActive = template.id === currentTemplateId;
          return (
            <Tooltip key={template.id} text={t('tooltips.templates.load')}>
              <button
                type="button"
                onClick={() => onLoad(template.id)}
                className={`w-full border rounded-xl px-3 py-2 text-left text-sm ${isActive ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                  }`}
              >
                <p className="font-semibold text-gray-800">{template.name || t('templates.untitled') || 'Untitled template'}</p>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span>
                    {template.width}×{template.height}
                  </span>
                  {template.updatedAt && (
                    <span>{t('templates.updated') || 'Updated'} {new Date(template.updatedAt).toLocaleDateString()}</span>
                  )}
                </p>
              </button>
            </Tooltip>
          );
        })}
        {templates.length === 0 && (
          <div className="text-xs text-gray-500 border border-dashed rounded-xl px-3 py-4 text-center">
            {t('templates.noTemplates') || 'No templates yet. Save the current design to create one.'}
          </div>
        )}
      </div>
    </section>
  );
}
