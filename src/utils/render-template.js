  function renderTemplate(template, data = {}) {
    const { width, height, elements = [] } = template;

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
              <img src="${source}" style="width: 100%; height: 100%; object-fit: ${el.fit || 'cover'}; border-radius: ${
            el.borderRadius || 0
          }px;" />
            </div>
          `;
        }

        if (el.type === 'shape') {
          return `
            <div style="${style} background-color: ${el.backgroundColor || '#000'}; border-radius: ${
            el.borderRadius || 0
          }px;"></div>
          `;
        }

        const textContent = escapeHtml(resolveTextContent(el, data));
        return `
          <div style="${style}
            font-size: ${el.fontSize || 16}px;
            font-weight: ${el.fontWeight || 400};
            color: ${el.color || '#000'};
            display: flex;
            align-items: center;
            justify-content: ${resolveAlignment(el.textAlign)};
            text-align: ${el.textAlign || 'left'};
            line-height: ${el.lineHeight || 1.2};
            white-space: pre-wrap;
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

  function hasOwn(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  module.exports = { renderTemplate };
