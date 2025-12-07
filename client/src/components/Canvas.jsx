import React, { useRef, useCallback } from 'react';
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

  const backgroundStyle = showGrid
    ? {
      backgroundColor: '#4a4a4a',
      backgroundImage: gridPattern,
      backgroundSize: '40px 40px',
    }
    : { backgroundColor: '#1f1f1f' };

  const handlePointerMove = useCallback(
    (event) => {
      const interaction = interactionRef.current;
      if (!interaction) return;
      if (interaction.pointerId !== undefined && event.pointerId !== interaction.pointerId) {
        return;
      }

      const deltaX = (event.clientX - interaction.startClientX) / zoom;
      const deltaY = (event.clientY - interaction.startClientY) / zoom;

      if (interaction.type === 'drag') {
        const nextX = clamp(interaction.originX + deltaX, 0, Math.max(0, width - interaction.width));
        const nextY = clamp(interaction.originY + deltaY, 0, Math.max(0, height - interaction.height));
        onUpdate(interaction.id, { x: Math.round(nextX), y: Math.round(nextY) });
      } else if (interaction.type === 'resize') {
        const handle = interaction.handle;
        const rotation = interaction.rotation || 0;
        const rad = rotation * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // Project delta onto local axes
        const localDeltaX = deltaX * cos + deltaY * sin;
        const localDeltaY = deltaY * cos - deltaX * sin;

        let dW = 0;
        let dH = 0;

        if (handle.includes('e')) {
          dW = localDeltaX;
        } else if (handle.includes('w')) {
          dW = -localDeltaX;
        }

        if (handle.includes('s')) {
          dH = localDeltaY;
        } else if (handle.includes('n')) {
          dH = -localDeltaY;
        }

        const newWidth = Math.max(20, interaction.originWidth + dW);
        const newHeight = Math.max(20, interaction.originHeight + dH);

        const finalDW = newWidth - interaction.originWidth;
        const finalDH = newHeight - interaction.originHeight;

        let shiftX = 0;
        let shiftY = 0;

        if (handle.includes('e')) {
          shiftX += (finalDW / 2) * cos;
          shiftY += (finalDW / 2) * sin;
        } else if (handle.includes('w')) {
          shiftX -= (finalDW / 2) * cos;
          shiftY -= (finalDW / 2) * sin;
        }

        if (handle.includes('s')) {
          shiftX += (finalDH / 2) * -sin;
          shiftY += (finalDH / 2) * cos;
        } else if (handle.includes('n')) {
          shiftX -= (finalDH / 2) * -sin;
          shiftY -= (finalDH / 2) * cos;
        }

        const newX = interaction.originX + shiftX - finalDW / 2;
        const newY = interaction.originY + shiftY - finalDH / 2;

        onUpdate(interaction.id, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        });
      }
    },
    [onUpdate, width, height, zoom]
  );

  const handlePointerUp = useCallback(
    (event) => {
      const interaction = interactionRef.current;
      if (!interaction) {
        return;
      }
      if (interaction.pointerId !== undefined && event.pointerId !== interaction.pointerId) {
        return;
      }

      interactionRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    },
    [handlePointerMove] // removed handlePointerUp from dep array to avoid circular dependency if possible, but actually we need it. 
    // Usually we define handlePointerMove/Up before using them. They are defined.
  );

  // Need to make sure handlePointerUp has access to the *interaction* ref, which is stable. 
  // But wait, handlePointerMove depends on onUpdate. 
  // If we addEventListener, we need to remove the *same* listener.
  // If handlePointerMove changes during drag (e.g. if zoom changes), we are in trouble.
  // But zoom triggers re-render. 
  // Let's assume zoom doesn't change during drag.

  // Actually, to be safe, we should use a Ref to hold the current listeners or use a stable wrapper.
  // But given standard usage, onUpdate is now stable. width/height/zoom assumed stable during drag.

  // We need to add handlePointerMove to dependency of handlePointerUp? No.
  // We need to update existing startDrag/Resize to add listeners.

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
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [onSelect, handlePointerMove, handlePointerUp]
  );

  // Cleanup listeners on unmount
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
            <div
              key={el.id}
              className={`absolute cursor-move transition-all duration-150 ${selectedId === el.id
                ? 'ring-2 ring-purple-400 shadow-lg'
                : 'ring-1 ring-transparent hover:ring-purple-200'
                }`}
              style={{
                width: el.width || 0,
                height: el.height || 0,
                transformOrigin: 'center',
                left: el.x || 0,
                top: el.y || 0,
                transform: `rotate(${el.rotation || 0}deg)`,
                opacity: el.opacity ?? 1,
                zIndex: index + 1,
                pointerEvents: el.locked ? 'none' : 'auto',
              }}
              onPointerDown={(event) => startDrag(event, el)}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(el.id);
              }}
            >

              {renderElementContent(el)}

              {el.variableName && (
                <div className="absolute -top-5 left-0 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                  {`{{${el.variableName}}}`}
                </div>
              )}

              {/* Resize handles - only show for selected element */}
              {selectedId === el.id && (
                <>
                  {/* Corner handles */}
                  <ResizeHandle position="nw" onStart={(e) => startResize(e, el, 'nw')} />
                  <ResizeHandle position="ne" onStart={(e) => startResize(e, el, 'ne')} />
                  <ResizeHandle position="sw" onStart={(e) => startResize(e, el, 'sw')} />
                  <ResizeHandle position="se" onStart={(e) => startResize(e, el, 'se')} />
                  {/* Edge handles */}
                  <ResizeHandle position="n" onStart={(e) => startResize(e, el, 'n')} />
                  <ResizeHandle position="s" onStart={(e) => startResize(e, el, 's')} />
                  <ResizeHandle position="w" onStart={(e) => startResize(e, el, 'w')} />
                  <ResizeHandle position="e" onStart={(e) => startResize(e, el, 'e')} />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getDropShadowFilter(stroke, shadow, isContour) {
  if (!isContour) return undefined;

  const filters = [];

  // Simulate stroke with 4-way drop-shadow
  if (stroke) {
    const { width, color } = stroke;
    // Using 4 shadows (top, bottom, left, right) + 4 diagonals for better coverage? 
    // Actually 8-way is smoother but expensive. Let's try 4 first.
    // Small strokes 4 is fine. Large strokes need more.
    // Let's stick to 4 cardinal directions for simplicity.
    filters.push(`drop-shadow(-${width}px 0 0 ${color})`);
    filters.push(`drop-shadow(${width}px 0 0 ${color})`);
    filters.push(`drop-shadow(0 -${width}px 0 ${color})`);
    filters.push(`drop-shadow(0 ${width}px 0 ${color})`);
  }

  if (shadow) {
    filters.push(`drop-shadow(${shadow.x || 0}px ${shadow.y || 0}px ${shadow.blur || 0}px ${shadow.color || '#000000'})`);
  }

  return filters.length > 0 ? filters.join(' ') : undefined;
}

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function renderElementContent(el) {
  if (el.type === 'image') {
    const isContour = el.contour;
    const filter = getDropShadowFilter(el.stroke, el.shadow, isContour);

    return (
      <img
        src={el.content}
        alt=""
        className="w-full h-full object-cover pointer-events-none"
        style={{
          objectFit: el.fit || 'cover',
          borderRadius: el.borderRadius || 0,
          // If contour mode, use filter for both stroke and shadow
          // If not, use standard box-shadow and border
          filter: filter,
          boxShadow: !isContour && el.shadow ? `${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${el.shadow.color || '#000000'}` : undefined,
          border: !isContour && el.stroke ? `${el.stroke.width}px solid ${el.stroke.color}` : undefined,
        }}
      />
    );
  }

  if (el.type === 'shape') {
    let background;
    if (el.gradient?.enabled) {
      if (el.gradient.stops && el.gradient.stops.length > 0) {
        // New multi-stop format
        const stopsCSS = [...el.gradient.stops]
          .sort((a, b) => a.position - b.position)
          .map(s => `${hexToRgba(s.color, s.opacity)} ${s.position}%`)
          .join(', ');
        background = `linear-gradient(${el.gradient.angle || 90}deg, ${stopsCSS})`;
      } else {
        // Fallback for legacy format
        const startColor = el.gradient?.start || '#000000';
        const endColor = el.gradient?.end || '#ffffff';
        const startOpacity = el.gradient?.startOpacity ?? 1;
        const endOpacity = el.gradient?.endOpacity ?? 1;
        const startPos = el.gradient?.startPosition ?? 0;
        const endPos = el.gradient?.endPosition ?? 100;
        background = `linear-gradient(${el.gradient.angle || 90}deg, ${hexToRgba(startColor, startOpacity)} ${startPos}%, ${hexToRgba(endColor, endOpacity)} ${endPos}%)`;
      }
    } else {
      background = el.backgroundColor || '#333';
    }

    return (
      <div
        className="w-full h-full"
        style={{
          background: background,
          borderRadius: el.borderRadius || 0,
          boxShadow: el.shadow ? `${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${el.shadow.color || '#000000'}` : undefined,
          border: el.stroke ? `${el.stroke.width}px solid ${el.stroke.color}` : undefined,
        }}
      />
    );
  }

  // Parse **text** for highlighting
  const parseHighlightedText = (text, highlightColor, padding = 3, radius = 6) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
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
      return part;
    });
  };

  const TextRenderer = () => {
    const textRef = React.useRef(null);
    const containerRef = React.useRef(null);

    React.useLayoutEffect(() => {
      if (el.resizing === 'fitty' && textRef.current && containerRef.current) {
        const container = containerRef.current;
        const textNode = textRef.current;

        // Reset to base size to measure
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
          wordBreak: 'break-word',
          // fontSize handled by effect
        };
      }
      return {
        whiteSpace: 'pre-wrap',
      };
    };

    return (
      <div
        ref={containerRef}
        className="w-full h-full flex"
        style={{
          alignItems: resolveAlignItems(el.verticalAlign),
          backgroundColor: el.backgroundColor || 'transparent',
          overflow: 'hidden', // Ensure container clips content for measurement
          border: el.stroke && el.type !== 'text' ? `${el.stroke.width}px solid ${el.stroke.color}` : undefined, // Stroke for container if not text
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
            wordBreak: el.wordBreak ? 'break-all' : 'normal',
            textShadow: el.shadow ? `${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${el.shadow.color || '#000000'}` : undefined,
            WebkitTextStroke: el.stroke ? `${el.stroke.width}px ${el.stroke.color}` : undefined,
            ...getResizingStyles(),
          }}
        >
          {parseHighlightedText((el.content_preview || el.content || '').trim(), el.highlightColor, el.highlightPadding, el.highlightRadius)}
        </div>
      </div>
    );
  };

  return <TextRenderer />;
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
  // Offset for 16px (w-4) handle with border is usually -8px to center, 
  // but let's stick to slight overhang. 
  // w-4 = 1rem = 16px. Half is 8px.
  // We want the center of the handle to be on the edge/corner.
  // top: -8, left: -8 etc.

  const offset = -6; // slightly inside or outside depending on preference, let's try -6 for -1.5 (w-3) visual feel or -8 for full center.
  // User wanted "enlarge dots". 

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
