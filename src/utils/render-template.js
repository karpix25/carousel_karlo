const path = require('path');
const fontCatalog = require(path.join(__dirname, '../../client/src/fonts.json'));

const FONT_MAP = new Map(fontCatalog.map((font) => [font.value, font]));

function renderTemplate(template, data = {}) {
  const { width, height, elements = [] } = template;
  const fontLinks = buildFontLinks(elements);

  const elementHtml = elements
    .map((el) => {
      const style = `
        position: absolute;
        left: ${el.x}px;
        top: ${el.y}px;
        width: ${el.width}px;
        height: ${el.height}px;
        opacity: ${el.opacity ?? 1};
        overflow: hidden;
      `;

      if (el.type === 'image') {
        const source = resolveContent(el, data);
        return `
          <div style="${style}">
            <img src="${source}" style="width: 100%; height: 100%; object-fit: ${el.fit || 'cover'}; border-radius: ${el.borderRadius || 0
          }px;" />
          </div>
        `;
      }

      if (el.type === 'shape') {
        return `
          <div style="${style} background-color: ${el.backgroundColor || '#000'}; border-radius: ${el.borderRadius || 0
          }px;"></div>
        `;
      }

      const rawText = resolveTextContent(el, data).trim();

      // Parse **text** for highlighting
      const parseHighlightedText = (text, highlightColor) => {
        if (!text) return '';
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map(part => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const content = part.slice(2, -2);
            return ` <span style="background-color: ${highlightColor || '#ffeb3b'}; padding: 3px 8px; border-radius: 6px; display: inline; white-space: nowrap;">${escapeHtml(content)}</span> `;
          }
          return escapeHtml(part);
        }).join('');
      };

      const textContent = parseHighlightedText(rawText, el.highlightColor);

      return `
        <div style="${style}
          font-family: ${getFontStackValue(el.fontFamily)};
          font-size: ${el.fontSize || 16}px;
          font-weight: ${el.fontWeight || 400};
          font-style: ${el.fontStyle || 'normal'};
          text-decoration: ${el.textDecoration || 'none'};
          color: ${el.color || '#000'};
          background-color: ${el.backgroundColor || 'transparent'};
          display: flex;
          align-items: ${resolveVerticalAlignment(el.verticalAlign)};
          justify-content: ${resolveAlignment(el.textAlign)};
          text-align: ${el.textAlign || 'left'};
          line-height: ${el.lineHeight || 1.2};
          letter-spacing: ${formatLetterSpacing(el.letterSpacing)};
          text-transform: ${el.textTransform || 'none'};
          word-break: ${el.wordBreak ? 'break-all' : 'normal'};
          white-space: pre-line;
        ">
          ${textContent}
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      ${fontLinks.map((href) => `<link rel="stylesheet" href="${href}" />`).join('\n')}
      <style>
        body { margin: 0; padding: 0; background: transparent; }
        #canvas {
          position: relative;
          width: ${width}px;
          height: ${height}px;
          background: white;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      </style>
    </head>
    <body>
      <div id="canvas">
        ${elementHtml}
      </div>
    </body>
    </html>
  `;
}

function resolveContent(element, data) {
  if (element.variableName && hasOwn(data, element.variableName)) {
    return data[element.variableName];
  }
  if (typeof element.content === 'string') {
    const match = element.content.match(/{{(.*?)}}/);
    if (match) {
      const key = match[1].trim();
      return data[key] ?? element.content;
    }
  }
  return element.content || '';
}

function applyPlaceholders(str, data) {
  return str.replace(/{{(.*?)}}/g, (_, key) => {
    const trimmed = key.trim();
    if (hasOwn(data, trimmed)) {
      const value = data[trimmed];
      return value == null ? '' : value;
    }
    return '';
  });
}

function resolveTextContent(element, data) {
  if (element.variableName && hasOwn(data, element.variableName)) {
    const value = data[element.variableName];
    return value == null ? '' : `${value}`;
  }
  return applyPlaceholders(element.content || '', data);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resolveAlignment(value = 'left') {
  switch (value) {
    case 'center':
      return 'center';
    case 'right':
      return 'flex-end';
    default:
      return 'flex-start';
  }
}

function resolveVerticalAlignment(value = 'top') {
  switch (value) {
    case 'middle':
      return 'center';
    case 'bottom':
      return 'flex-end';
    default:
      return 'flex-start';
  }
}

function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function formatLetterSpacing(value) {
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return '0px';
}

function getFontStackValue(value) {
  const font = value && FONT_MAP.get(value);
  if (font) {
    return `'${font.value}', ${font.fallback || 'sans-serif'}`;
  }
  return "'Inter', sans-serif";
}

function buildFontLinks(elements) {
  const uniqueFonts = Array.from(
    new Set(elements.filter((el) => el.type === 'text' && el.fontFamily).map((el) => el.fontFamily))
  );
  return uniqueFonts
    .map((family) => {
      const font = FONT_MAP.get(family);
      if (!font || !font.googleId) {
        return null;
      }
      return `https://fonts.googleapis.com/css2?family=${font.googleId}&display=swap`;
    })
    .filter(Boolean);
}

module.exports = { renderTemplate };
