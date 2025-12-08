import React, { useRef, useCallback, memo, forwardRef } from 'react';
import { getFontStack } from '../constants/fonts';

const gridPattern =
  'repeating-linear-gradient(135deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 16px, transparent 16px, transparent 32px)';

export default function Canvas({
  elements,
  selectedId,
  onSelect,
  onUpdate,
  width,
  height,
  zoom = 1,
  showGrid,
}) {
  const interactionRef = useRef(null);
  // Map of element IDs to their DOM nodes
  const layerRefs = useRef(new Map());

  const backgroundStyle = showGrid
    ? {
      backgroundColor: '#4a4a4a',
      backgroundImage: gridPattern,
      backgroundSize: '40px 40px',
    }
    : { backgroundColor: '#1f1f1f' };

  // Helper to set refs
  const setLayerRef = useCallback((id, node) => {
    if (node) {
      layerRefs.current.set(id, node);
    } else {
      layerRefs.current.delete(id);
    }
  }, []);

  const handlePointerMove = useCallback(
    (event) => {
      const interaction = interactionRef.current;
      if (!interaction) return;
      if (interaction.pointerId !== undefined && event.pointerId !== interaction.pointerId) {
        return;
      }

      event.preventDefault(); // crucial for smoother drag

      const deltaX = (event.clientX - interaction.startClientX) / zoom;
      const deltaY = (event.clientY - interaction.startClientY) / zoom;

      // Get the DOM node for the interacting element
      const node = layerRefs.current.get(interaction.id);
      if (!node) return;

      if (interaction.type === 'drag') {
        // Direct DOM manipulation for Drag
        const nextX = clamp(interaction.originX + deltaX, 0, Math.max(0, width - interaction.width));
        const nextY = clamp(interaction.originY + deltaY, 0, Math.max(0, height - interaction.height));

        // Save current calculated values to interaction object for 'pointerup' commit
        interaction.currentX = Math.round(nextX);
        interaction.currentY = Math.round(nextY);

        // Apply via transform to avoid layout thrashing, but since we rely on absolute positioning 'left/top', 
        // mixing transform might be tricky if we want to update top/left.
        // However, for best performance, we should ideally use translate.
        // But our data model uses top/left.
        // Strategy: keep top/left static during drag (at origin), and use translate to move.
        // Wait, 'top/left' are already set on the element via styles from props.
        // If we change top/left directly, it triggers layout. 
        // If we use transform: translate, it triggers composite (fast).
        // 
        // Existing style has: transform: rotate(${rotation}deg)
        // We must preserve rotation.

        const rotation = interaction.rotation || 0;
        // Calculate the visual offset from the ORIGINAL position
        const offsetX = interaction.currentX - interaction.originX;
        const offsetY = interaction.currentY - interaction.originY;

        node.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`;

        // We do NOT touch top/left during drag.

      } else if (interaction.type === 'resize') {
        // Resize is trickier because we change width/height, which IS layout.
        // But it's only 1 element.

        const handle = interaction.handle;
        const rotation = interaction.rotation || 0;
        const rad = rotation * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const localDeltaX = deltaX * cos + deltaY * sin;
        const localDeltaY = deltaY * cos - deltaX * sin;

        let dW = 0; let dH = 0;

        if (handle.includes('e')) dW = localDeltaX;
        else if (handle.includes('w')) dW = -localDeltaX;

        if (handle.includes('s')) dH = localDeltaY;
        else if (handle.includes('n')) dH = -localDeltaY;

        let newWidth = Math.max(20, interaction.originWidth + dW);
        let newHeight = Math.max(20, interaction.originHeight + dH);

        if (interaction.constrainProportions) {
          const aspect = interaction.aspect || 1;
          if (handle.length === 2 || handle === 'w' || handle === 'e') {
            newHeight = Math.round(newWidth / aspect);
          } else {
            newWidth = Math.round(newHeight * aspect);
          }
        }

        newWidth = Math.round(newWidth);
        newHeight = Math.round(newHeight);

        // Store for commit
        interaction.currentWidth = newWidth;
        interaction.currentHeight = newHeight;

        const finalDW = newWidth - interaction.originWidth;
        const finalDH = newHeight - interaction.originHeight;

        let shiftX = 0; let shiftY = 0;

        if (handle.includes('e')) { shiftX += (finalDW / 2) * cos; shiftY += (finalDW / 2) * sin; }
        else if (handle.includes('w')) { shiftX -= (finalDW / 2) * cos; shiftY -= (finalDW / 2) * sin; }

        if (handle.includes('s')) { shiftX += (finalDH / 2) * -sin; shiftY += (finalDH / 2) * cos; }
        else if (handle.includes('n')) { shiftX -= (finalDH / 2) * -sin; shiftY -= (finalDH / 2) * cos; }

        const newX = interaction.originX + shiftX - finalDW / 2;
        const newY = interaction.originY + shiftY - finalDH / 2;

        interaction.currentX = Math.round(newX);
        interaction.currentY = Math.round(newY);

        // Apply styles directly
        node.style.width = `${newWidth}px`;
        node.style.height = `${newHeight}px`;
        // For position, we again use translate to avoid modifying top/left if possible?
        // But resize relies on re-centering logic often. 
        // Actually, if we update width/height, the element grows from center (transformOrigin center).
        // But our logic calculates top-left coordinates (newX, newY).
        // The element is positioned at 'left/top' (originX, originY).
        // We need to move it to (newX, newY).
        // Distance to move:
        const offsetX = interaction.currentX - interaction.originX;
        const offsetY = interaction.currentY - interaction.originY;

        node.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`;
      }
    },
    [width, height, zoom]
  );

  const handlePointerUp = useCallback(
    (event) => {
      const interaction = interactionRef.current;
      if (!interaction) return;
      if (interaction.pointerId !== undefined && event.pointerId !== interaction.pointerId) return;

      const node = layerRefs.current.get(interaction.id);

      if (interaction.type === 'drag') {
        if (interaction.currentX !== undefined && interaction.currentY !== undefined) {
          // Commit the changes to React
          onUpdate(interaction.id, { x: interaction.currentX, y: interaction.currentY });
        }
        // Reset local transform so React's re-render takes over cleanly
        // NOTE: If we reset immediately, there might be a flash before React renders.
        // React render will replace 'translate' with 'rotate' and update 'top/left'.
        // Since the result is visually identical, it should be fine.
        if (node) {
          node.style.transform = `rotate(${interaction.rotation || 0}deg)`;
          // Also 'left' and 'top' should ideally be updated by React, but we touched transform.
        }
      }
      else if (interaction.type === 'resize') {
        if (interaction.currentX !== undefined) {
          onUpdate(interaction.id, {
            x: interaction.currentX,
            y: interaction.currentY,
            width: interaction.currentWidth,
            height: interaction.currentHeight
          });
        }
        if (node) {
          // Reset temporary styles
          node.style.transform = `rotate(${interaction.rotation || 0}deg)`;
          // We modified width/height directly. React will overwrite them, which is fine.
        }
      }

      interactionRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    },
    [handlePointerMove, onUpdate] // Removed onUpdate from dependencies? No, we need it.
  );

  const startDrag = useCallback(
    (event, element) => {
      if (event.button !== 0) return;
      if (element.locked) return;

      event.stopPropagation();
      event.preventDefault();
      onSelect(element.id);

      interactionRef.current = {
        type: 'drag',
        id: element.id,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: element.x || 0,
        originY: element.y || 0,
        width: element.width || 0,
        height: element.height || 0,
        rotation: element.rotation || 0,
        // Initialize current vals
        currentX: element.x || 0,
        currentY: element.y || 0
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [onSelect, handlePointerMove, handlePointerUp]
  );

  const startResize = useCallback(
    (event, element, handle) => {
      if (event.button !== 0) return;
      if (element.locked) return;

      event.stopPropagation();
      event.preventDefault();
      onSelect(element.id);

      interactionRef.current = {
        type: 'resize',
        id: element.id,
        handle,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: element.x || 0,
        originY: element.y || 0,
        originWidth: element.width || 0,
        originHeight: element.height || 0,
        rotation: element.rotation || 0,
        constrainProportions: element.constrainProportions,
        aspect: (element.width || 1) / (element.height || 1),
        // Init vals
        currentX: element.x || 0,
        currentY: element.y || 0,
        currentWidth: element.width || 0,
        currentHeight: element.height || 0
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [onSelect, handlePointerMove, handlePointerUp]
  );

  // Cleanups
  React.useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div onClick={() => onSelect(null)}>
      <div
        className="shadow-2xl rounded-xl border border-gray-200 overflow-hidden"
        style={{
          width: width * zoom,
          height: height * zoom,
          backgroundColor: '#f5f5f5',
        }}
      >
        <div
          className="relative origin-top-left"
          style={{ width, height, transform: `scale(${zoom})`, ...backgroundStyle }}
        >
          {elements.map((el, index) => (
            <CanvasLayer
              key={el.id}
              ref={(node) => setLayerRef(el.id, node)}
              element={el}
              index={index}
              isSelected={selectedId === el.id}
              onStartDrag={startDrag}
              onStartResize={startResize}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Convert to forwardRef to expose DOM node
const CanvasLayer = memo(forwardRef(({ element, index, isSelected, onStartDrag, onSelect, onStartResize }, ref) => {
  return (
    <div
      ref={ref}
      className={`absolute cursor-move ${isSelected
        ? 'ring-2 ring-purple-400 shadow-lg'
        : 'ring-1 ring-transparent hover:ring-purple-200'
        }`}
      style={{
        width: element.width || 0,
        height: element.height || 0,
        transformOrigin: 'center',
        left: element.x || 0,
        top: element.y || 0,
        transform: `rotate(${element.rotation || 0}deg)`,
        opacity: element.opacity ?? 1,
        zIndex: index + 1,
        pointerEvents: element.locked ? 'none' : 'auto',
        // Important: we need 'will-change' hint for compositor
        willChange: isSelected ? 'transform, width, height' : 'auto'
      }}
      onPointerDown={(event) => onStartDrag(event, element)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(element.id);
      }}
    >
      {renderElementContent(element)}

      {element.variableName && (
        <div className="absolute -top-5 left-0 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
          {`{{${element.variableName}}}`}
        </div>
      )}

      {isSelected && (
        <>
          <ResizeHandle position="nw" onStart={(e) => onStartResize(e, element, 'nw')} />
          <ResizeHandle position="ne" onStart={(e) => onStartResize(e, element, 'ne')} />
          <ResizeHandle position="sw" onStart={(e) => onStartResize(e, element, 'sw')} />
          <ResizeHandle position="se" onStart={(e) => onStartResize(e, element, 'se')} />
          <ResizeHandle position="n" onStart={(e) => onStartResize(e, element, 'n')} />
          <ResizeHandle position="s" onStart={(e) => onStartResize(e, element, 's')} />
          <ResizeHandle position="w" onStart={(e) => onStartResize(e, element, 'w')} />
          <ResizeHandle position="e" onStart={(e) => onStartResize(e, element, 'e')} />
        </>
      )}
    </div>
  );
}), (prev, next) => {
  return (
    prev.element === next.element &&
    prev.isSelected === next.isSelected &&
    prev.index === next.index
  );
});

// Helper functions (outside component for stability)
function hexToRgba(hex, opacity = 1) {
  if (!hex) return 'rgba(0, 0, 0, 1)';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function renderElementContent(el) {
  if (el.type === 'image') {
    const isContour = el.contour;
    const filter = getDropShadowFilter(el.stroke, el.shadow, isContour);

    return (
      <div className="w-full h-full relative overflow-hidden">
        <img
          src={el.content || el.src}
          alt=""
          className="w-full h-full object-cover pointer-events-none select-none"
          style={{
            objectFit: el.fit || 'cover',
            borderRadius: el.borderRadius || 0,
            opacity: el.opacity ?? 1,
            filter: filter,
            boxShadow: !isContour && el.shadow ? `${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${hexToRgba(el.shadow.color || '#000000', el.shadow.opacity ?? 1)}` : undefined,
            border: !isContour && el.stroke ? `${el.stroke.width}px solid ${el.stroke.color}` : undefined,
          }}
          draggable={false}
        />
      </div>
    );
  }

  if (el.type === 'shape') {
    let background = getBackground(el);
    const shadowStyle = el.shadow
      ? `${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${hexToRgba(el.shadow.color || '#000000', el.shadow.opacity ?? 1)}`
      : undefined;

    return (
      <div
        className="w-full h-full"
        style={{
          background: background,
          borderRadius: el.borderRadius || 0,
          boxShadow: shadowStyle,
          border: el.stroke ? `${el.stroke.width}px solid ${el.stroke.color}` : undefined,
        }}
      />
    );
  }

  if (el.type === 'text') {
    return <TextRenderer el={el} />;
  }

  return null;
}

const TextRenderer = ({ el }) => {
  const textRef = useRef(null);
  const containerRef = useRef(null);

  React.useLayoutEffect(() => {
    if (el.resizing === 'fitty' && textRef.current && containerRef.current) {
      const container = containerRef.current;
      const textNode = textRef.current;

      textNode.style.fontSize = '10px';

      let min = 10;
      let max = 200;
      let optimal = 16;

      while (min <= max) {
        const mid = Math.floor((min + max) / 2);
        textNode.style.fontSize = `${mid}px`;

        if (textNode.scrollHeight <= container.clientHeight && textNode.scrollWidth <= container.clientWidth) {
          optimal = mid;
          min = mid + 1;
        } else {
          max = mid - 1;
        }
      }
      textNode.style.fontSize = `${optimal}px`;
    }
  }, [el.resizing, el.content, el.width, el.height, el.fontFamily, el.lineHeight, el.letterSpacing, el.fontWeight, el.content_preview]);

  const getResizingStyles = () => {
    if (el.resizing === 'single') {
      return {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      };
    }
    if (el.resizing === 'clamp') {
      return {
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      };
    }
    if (el.resizing === 'fitty') {
      return {
        whiteSpace: 'pre-wrap',
      };
    }
    return {
      whiteSpace: 'pre-wrap',
    };
  };

  const processedText = ((el.content_preview || el.content || '')).replace(/\\n/g, '\n').trim();
  const overflowWrapValue = el.wordBreak ? 'anywhere' : 'normal';

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex"
      style={{
        alignItems: resolveAlignItems(el.verticalAlign),
        backgroundColor: el.backgroundColor || 'transparent',
        overflow: 'hidden',
        border: el.stroke && el.type !== 'text' ? `${el.stroke.width}px solid ${el.stroke.color}` : undefined,
      }}
    >
      <div
        ref={textRef}
        style={{
          width: '100%',
          textAlign: el.textAlign || 'left',
          fontSize: el.fontSize || 18,
          color: el.color || '#fff',
          fontWeight: el.fontWeight || 400,
          fontStyle: el.fontStyle || 'normal',
          textDecoration: el.textDecoration || 'none',
          lineHeight: el.lineHeight || 1.2,
          fontFamily: getFontStack(el.fontFamily),
          letterSpacing: typeof el.letterSpacing === 'number' ? `${el.letterSpacing}px` : undefined,
          textTransform: el.textTransform || 'none',
          wordBreak: 'normal',
          overflowWrap: overflowWrapValue,
          textShadow: el.shadow ? `${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${hexToRgba(el.shadow.color || '#000000', el.shadow.opacity ?? 1)}` : undefined,
          WebkitTextStroke: el.stroke ? `${el.stroke.width}px ${el.stroke.color}` : undefined,
          ...getResizingStyles(),
        }}
      >
        {parseQuotes(
          parseHighlightedText(
            processedText,
            el.highlightColor,
            el.highlightPadding,
            el.highlightRadius,
            el.highlightMode
          ),
          el.quote
        )}
      </div>
    </div>
  );
};

const parseHighlightedText = (text, highlightColor, padding = 3, radius = 6, mode = 'background') => {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);

      if (mode === 'text') {
        // Text color mode
        return (
          <span key={index} style={{ color: highlightColor || '#ffeb3b', fontWeight: 'bold' }}>
            {content}
          </span>
        );
      } else {
        // Background mode (default)
        return (
          <React.Fragment key={index}>
            {' '}
            <span
              style={{
                backgroundColor: highlightColor || '#ffeb3b',
                padding: `${padding}px 8px`,
                borderRadius: `${radius}px`,
                display: 'inline',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
              }}
            >
              {content}
            </span>
            {' '}
          </React.Fragment>
        );
      }
    }
    return part;
  });
};

const parseQuotes = (text, quoteSettings) => {
  if (!text || !quoteSettings?.enabled) return text;

  const borderColor = quoteSettings.borderColor || '#9333ea';
  const bgColor = quoteSettings.backgroundColor || '#f3e8ff';
  const borderWidth = quoteSettings.borderWidth || 4;

  // Match «text» or "text"
  const quoteRegex = /«([^»]+)»|"([^"]+)"/g;
  const parts = text.split(quoteRegex);

  return parts.map((part, index) => {
    // Every 3rd element starting from index 1 or 2 is a quote content
    if (index % 3 === 1 || index % 3 === 2) {
      if (part) {
        return (
          <span
            key={index}
            style={{
              display: 'block',
              borderLeft: `${borderWidth}px solid ${borderColor}`,
              backgroundColor: bgColor,
              padding: '8px 12px',
              margin: '8px 0',
            }}
          >
            {part}
          </span>
        );
      }
    }
    return part;
  });
};

function getBackground(el) {
  if (el.gradient?.enabled) {
    const { start, end, angle, stops } = el.gradient;

    if (stops && stops.length > 0) {
      const sortedStops = [...stops].sort((a, b) => a.position - b.position);
      const stopString = sortedStops.map(stop => {
        const color = hexToRgba(stop.color, stop.opacity);
        return `${color} ${stop.position}%`;
      }).join(', ');
      return `linear-gradient(${angle}deg, ${stopString})`;
    }

    const startColor = hexToRgba(start, el.gradient.startOpacity ?? 1);
    const endColor = hexToRgba(end, el.gradient.endOpacity ?? 1);
    const startPos = el.gradient.startPosition ?? 0;
    const endPos = el.gradient.endPosition ?? 100;

    return `linear-gradient(${angle}deg, ${startColor} ${startPos}%, ${endColor} ${endPos}%)`;
  }
  return el.backgroundColor || '#333';
}

function getDropShadowFilter(stroke, shadow, isContour) {
  if (!isContour) return undefined;

  const filters = [];

  if (stroke) {
    const { width, color } = stroke;
    filters.push(`drop-shadow(-${width}px 0 0 ${color})`);
    filters.push(`drop-shadow(${width}px 0 0 ${color})`);
    filters.push(`drop-shadow(0 -${width}px 0 ${color})`);
    filters.push(`drop-shadow(0 ${width}px 0 ${color})`);
  }

  if (shadow) {
    const shadowColor = hexToRgba(shadow.color || '#000000', shadow.opacity ?? 1);
    filters.push(`drop-shadow(${shadow.x || 0}px ${shadow.y || 0}px ${shadow.blur || 0}px ${shadowColor})`);
  }

  return filters.length > 0 ? filters.join(' ') : undefined;
}


function resolveJustify(value = 'left') {
  if (value === 'center') return 'center';
  if (value === 'right') return 'flex-end';
  return 'flex-start';
}

function resolveAlignItems(value = 'top') {
  if (value === 'middle') return 'center';
  if (value === 'bottom') return 'flex-end';
  return 'flex-start';
}

function ResizeHandle({ position, onStart }) {
  const positionStyles = {
    nw: { top: -6, left: -6, cursor: 'nwse-resize' },
    ne: { top: -6, right: -6, cursor: 'nesw-resize' },
    sw: { bottom: -6, left: -6, cursor: 'nesw-resize' },
    se: { bottom: -6, right: -6, cursor: 'nwse-resize' },
    n: { top: -6, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    s: { bottom: -6, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    w: { top: '50%', left: -6, transform: 'translateY(-50%)', cursor: 'ew-resize' },
    e: { top: '50%', right: -6, transform: 'translateY(-50%)', cursor: 'ew-resize' },
  };

  return (
    <div
      className="absolute w-3.5 h-3.5 bg-white border-[3px] border-purple-600 rounded-full hover:scale-125 transition-transform shadow-sm"
      style={positionStyles[position]}
      onPointerDown={onStart}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
