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
        transform: rotate(${el.rotation || 0}deg);
      `;

      if (el.type === 'image') {
        const source = resolveContent(el, data);
        const shadowStyle = el.shadow ? `box-shadow: ${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${el.shadow.color || '#000000'};` : '';
        return `
          <div style="${style} ${shadowStyle}">
            <img src="${source}" style="width: 100%; height: 100%; object-fit: ${el.fit || 'cover'}; border-radius: ${el.borderRadius || 0
          }px;" />
          </div>
        `;
      }

      if (el.type === 'shape') {
        const shadowStyle = el.shadow ? `box-shadow: ${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${el.shadow.color || '#000000'};` : '';
        return `
          <div style="${style} background-color: ${el.backgroundColor || '#000'}; border-radius: ${el.borderRadius || 0
          }px; ${shadowStyle}"></div>
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
            return ` <span style="background-color: ${highlightColor || '#ffeb3b'}; padding: 3px 8px; border-radius: 6px; display: inline; box-decoration-break: clone; -webkit-box-decoration-break: clone;">${escapeHtml(content)}</span> `;
          }
          return escapeHtml(part);
        }).join('');
      };

      const textContent = parseHighlightedText(rawText, el.highlightColor);
      const shadowStyle = el.shadow ? `text-shadow: ${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${el.shadow.color || '#000000'};` : '';

      let resizingStyle = 'white-space: pre-wrap;';
      let fittyClass = '';

      if (el.resizing === 'single') {
        resizingStyle = 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
      } else if (el.resizing === 'clamp') {
        resizingStyle = 'display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;';
      } else if (el.resizing === 'fitty') {
        resizingStyle = 'white-space: pre-wrap; word-break: break-word;';
        fittyClass = 'fitty-text';
      }

      return `
        <div style="${style}
          background-color: ${el.backgroundColor || 'transparent'};
          display: flex;
          align-items: ${resolveVerticalAlignment(el.verticalAlign)};
          overflow: hidden;
        ">
          <div class="${fittyClass}" style="
            width: 100%;
            text-align: ${el.textAlign || 'left'};
            font-family: ${getFontStackValue(el.fontFamily)};
            font-size: ${el.fontSize || 16}px;
            font-weight: ${el.fontWeight || 400};
            font-style: ${el.fontStyle || 'normal'};
            text-decoration: ${el.textDecoration || 'none'};
            color: ${el.color || '#000'};
            line-height: ${el.lineHeight || 1.2};
            letter-spacing: ${formatLetterSpacing(el.letterSpacing)};
            text-transform: ${el.textTransform || 'none'};
            word-break: ${el.wordBreak ? 'break-all' : 'normal'};
            ${resizingStyle}
            ${shadowStyle}
          ">${textContent}</div>
        </div>
      `;
    })
    .join('');

  const fittyScript = `
    <script>
      document.querySelectorAll('.fitty-text').forEach(el => {
        const container = el.parentElement;
        let min = 10;
        let max = 200;
        let optimal = 16;
        
        // Reset to base size
        el.style.fontSize = '10px';
        
        while (min <= max) {
          const mid = Math.floor((min + max) / 2);
          el.style.fontSize = mid + 'px';
          if (el.scrollHeight <= container.clientHeight && el.scrollWidth <= container.clientWidth) {
            optimal = mid;
            min = mid + 1;
          } else {
            max = mid - 1;
          }
        }
        el.style.fontSize = optimal + 'px';
      });
    </script>
  `;

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
        ${fittyScript}
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
