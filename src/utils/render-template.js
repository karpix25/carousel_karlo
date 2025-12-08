const path = require('path');
const fontCatalog = require(path.join(__dirname, '../../client/src/fonts.json'));
const crypto = require('crypto');

// Helper function to convert hex color to rgba with opacity
function hexToRgba(hex, opacity = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Helper function to resolve dynamic colors from API data
function resolveDynamicColors(element, data) {
  const el = { ...element };
  const varName = element.variableName || element.id;

  // Text color
  if (el.colorDynamic && data[`${varName}_color`]) {
    el.color = data[`${varName}_color`];
  }

  // Background color
  if (el.backgroundColorDynamic && data[`${varName}_backgroundColor`]) {
    el.backgroundColor = data[`${varName}_backgroundColor`];
  }

  // Highlight color
  if (el.highlightColorDynamic && data[`${varName}_highlightColor`]) {
    el.highlightColor = data[`${varName}_highlightColor`];
  }

  // Shadow color
  if (el.shadow && el.shadowColorDynamic && data[`${varName}_shadowColor`]) {
    el.shadow = { ...el.shadow, color: data[`${varName}_shadowColor`] };
  }

  // Stroke color
  if (el.stroke && el.strokeColorDynamic && data[`${varName}_strokeColor`]) {
    el.stroke = { ...el.stroke, color: data[`${varName}_strokeColor`] };
  }

  // Quote border color
  if (el.quote && el.quoteBorderColorDynamic && data[`${varName}_quoteBorderColor`]) {
    el.quote = { ...el.quote, borderColor: data[`${varName}_quoteBorderColor`] };
  }

  // Quote background color
  if (el.quote && el.quoteBackgroundColorDynamic && data[`${varName}_quoteBackgroundColor`]) {
    el.quote = { ...el.quote, backgroundColor: data[`${varName}_quoteBackgroundColor`] };
  }

  return el;
}

const FONT_MAP = new Map(fontCatalog.map((font) => [font.value, font]));

function renderTemplate(template, data = {}) {
  const { width, height, elements = [] } = template;
  const fontLinks = buildFontLinks(elements);

  const elementHtml = elements
    .map((el) => {
      // Resolve content variables (existing logic)
      if (el.variableName && data[el.variableName] !== undefined) {
        el = { ...el, content: data[el.variableName] };
      }

      // NEW: Resolve dynamic colors
      el = resolveDynamicColors(el, data);

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
        const isContour = el.contour;

        // Filter logic (only for contour mode)
        let filterStyle = '';
        if (isContour) {
          const filters = [];
          if (el.stroke) {
            const { width, color } = el.stroke;
            filters.push(`drop-shadow(-${width}px 0 0 ${color})`);
            filters.push(`drop-shadow(${width}px 0 0 ${color})`);
            filters.push(`drop-shadow(0 - ${width}px 0 ${color})`);
            filters.push(`drop-shadow(0 ${width}px 0 ${color})`);
          }
          if (el.shadow) {
            const shadowColor = hexToRgba(el.shadow.color || '#000000', el.shadow.opacity ?? 1);
            filters.push(`drop-shadow(${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${shadowColor})`);
          }
          if (filters.length > 0) {
            filterStyle = `filter: ${filters.join(' ')}; `;
          }
        }

        // For non-contour mode, apply shadow and border directly to img
        const imgShadowStyle = (!isContour && el.shadow) ? `box-shadow: ${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${hexToRgba(el.shadow.color || '#000000', el.shadow.opacity ?? 1)}; ` : '';
        const imgBorderStyle = (!isContour && el.stroke) ? `border: ${el.stroke.width}px solid ${el.stroke.color}; ` : '';

        return `
  <div style="${style}">
    <div style="width: 100%; height: 100%; position: relative; overflow: hidden;">
      <img
        src="${source}"
        style="
                  width: 100%; 
                  height: 100%; 
                  object-fit: ${el.fit || 'cover'}; 
                  border-radius: ${el.borderRadius || 0}px; 
                  ${filterStyle}
                  ${imgShadowStyle}
                  ${imgBorderStyle}
                  pointer-events: none;
                  user-select: none;
                "
      />
    </div>
          </div>
  `;
      }

      if (el.type === 'shape') {
        const shadowStyle = el.shadow ? `box-shadow: ${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${hexToRgba(el.shadow.color || '#000000', el.shadow.opacity ?? 1)}; ` : '';

        let backgroundStyle;
        if (el.gradient?.enabled) {
          if (el.gradient.stops && el.gradient.stops.length > 0) {
            const stopsCSS = [...el.gradient.stops]
              .sort((a, b) => a.position - b.position)
              .map(s => `${hexToRgba(s.color, s.opacity)} ${s.position}% `)
              .join(', ');
            backgroundStyle = `background: linear-gradient(${el.gradient.angle || 90}deg, ${stopsCSS}); `;
          } else {
            const startColor = el.gradient.start || '#000000';
            const endColor = el.gradient.end || '#ffffff';
            const startOpacity = el.gradient.startOpacity ?? 1;
            const endOpacity = el.gradient.endOpacity ?? 1;
            const startPos = el.gradient.startPosition ?? 0;
            const endPos = el.gradient.endPosition ?? 100;
            backgroundStyle = `background: linear-gradient(${el.gradient.angle || 90}deg, ${hexToRgba(startColor, startOpacity)} ${startPos} %, ${hexToRgba(endColor, endOpacity)} ${endPos} %); `;
            backgroundStyle = `background: linear-gradient(${el.gradient.angle || 90}deg, ${hexToRgba(startColor, startOpacity)} ${startPos}%, ${hexToRgba(endColor, endOpacity)} ${endPos}%); `;
          }
        } else {
          backgroundStyle = `background-color: ${el.backgroundColor || '#000'}; `;
        }

        return `
  <div style="${style} ${backgroundStyle} border-radius: ${el.borderRadius || 0
          }px; ${shadowStyle}"></div>
  `;
      }

      const resolvedText = resolveTextContent(el, data) || '';
      const rawText = resolvedText.replace(/\\n/g, '\n').trim();

      // Parse **text** for highlighting (with mode support)
      const parseHighlightedText = (text, highlightColor) => {
        if (!text) return '';
        const padding = el.highlightPadding ?? 3;
        const radius = el.highlightRadius ?? 6;
        const mode = el.highlightMode || 'background';

        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map(part => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const content = part.slice(2, -2);

            if (mode === 'text') {
              // Text color mode
              return `<span style="color: ${highlightColor || '#ffeb3b'}; font-weight: bold;">${escapeHtml(content)}</span>`;
            } else {
              // Background mode (default)
              return `<span style="background-color: ${highlightColor || '#ffeb3b'}; padding: ${padding}px 8px; border-radius: ${radius}px; display: inline; box-decoration-break: clone; -webkit-box-decoration-break: clone;">${escapeHtml(content)}</span>`;
            }
          }
          return escapeHtml(part);
        }).join('');
      };


      // Parse «text» or "text" for quotes
      const parseQuotes = (text) => {
        if (!text || !el.quote?.enabled) return text;

        const borderColor = el.quote.borderColor || '#9333ea';
        const bgColor = el.quote.backgroundColor || '#f3e8ff';
        const borderWidth = el.quote.borderWidth || 4;
        const paddingLeft = el.quote.paddingLeft || 12;
        const paddingRight = el.quote.paddingRight || 12;
        const paddingTop = el.quote.paddingTop || 8;
        const paddingBottom = el.quote.paddingBottom || 8;

        // Match «text» or "text"  
        const quoteRegex = /«([^»]+)»|"([^"]+)"/g;

        return text.replace(quoteRegex, (match, guillemet, regular) => {
          const content = guillemet || regular;
          // Note: content is already escaped from parseHighlightedText, don't escape again
          return `<span style="display: block; border-left: ${borderWidth}px solid ${borderColor}; background-color: ${bgColor}; padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px; margin: 8px 0;">${content}</span>`;
        });
      };

      let textContent = parseHighlightedText(rawText, el.highlightColor);
      textContent = parseQuotes(textContent);
      const shadowStyle = el.shadow ? `text-shadow: ${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${hexToRgba(el.shadow.color || '#000000', el.shadow.opacity ?? 1)}; ` : '';
      const strokeStyle = el.stroke ? `-webkit-text-stroke: ${el.stroke.width}px ${el.stroke.color}; ` : '';

      let resizingStyle = 'white-space: pre-wrap;';
      let fittyClass = '';

      if (el.resizing === 'single') {
        resizingStyle = 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
      } else if (el.resizing === 'clamp') {
        resizingStyle = 'display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;';
      } else if (el.resizing === 'fitty') {
        resizingStyle = 'white-space: pre-wrap; overflow-wrap: anywhere;';
        fittyClass = 'fitty-text';
      }
      const overflowWrapStyle = `overflow-wrap: ${el.wordBreak ? 'anywhere' : 'normal'};`;

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
word-break: normal;
${overflowWrapStyle}
            ${resizingStyle}
            ${shadowStyle}
            ${strokeStyle}
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
    </script >
  `;

  return `
  < !DOCTYPE html >
    <html>
      <head>
        <meta charset="utf-8" />
        ${fontLinks.map((href) => `<link rel="stylesheet" href="${href}" />`).join('\n')}
        <style>
          body {margin: 0; padding: 0; background: transparent; }
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
    return value == null ? '' : `${value} `;
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
    return `${value} px`;
  }
  return '0px';
}

function getFontStackValue(value) {
  const font = value && FONT_MAP.get(value);
  if (font) {
    return `'${font.value}', ${font.fallback || 'sans-serif'} `;
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

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

module.exports = { renderTemplate };
