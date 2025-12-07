import React from 'react';
import { Type, Image, Square, Sparkles, Layers } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import Tooltip from './Tooltip';

const tools = [
  { icon: Type, labelKey: 'toolbar.addText', tooltipKey: 'tooltips.toolbar.text', type: 'text' },
  { icon: Square, labelKey: 'toolbar.addShape', tooltipKey: 'tooltips.toolbar.shape', type: 'shape' },
  { icon: Image, labelKey: 'toolbar.addImage', tooltipKey: 'tooltips.toolbar.image', type: 'image' },
  { icon: Sparkles, labelKey: 'toolbar.addHighlight', tooltipKey: 'tooltips.toolbar.highlight', type: 'shape', props: { backgroundColor: '#fef08a' } },
];

export default function Toolbar({ onAdd }) {
  const { t } = useTranslation();

  return (
    <div className="w-20 bg-purple-700 text-white flex flex-col items-center py-6 space-y-4 h-full">
      <div className="rounded-full bg-purple-600 p-3">
        <Layers size={20} />
      </div>
      {tools.map((tool) => (
        <Tooltip key={tool.labelKey} text={t(tool.tooltipKey)} position="right">
          <button
            type="button"
            title={t(tool.labelKey)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-purple-600 hover:bg-white/20 transition"
            onClick={() => onAdd(tool.type, tool.props)}
          >
            <tool.icon size={20} />
            <span className="sr-only">{t(tool.labelKey)}</span>
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
