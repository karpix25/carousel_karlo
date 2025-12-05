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
      interaction.captureTarget?.releasePointerCapture?.(interaction.pointerId);
      interactionRef.current = null;
    },
    []
  );

  const startDrag = useCallback(
    (event, element) => {
      if (event.button !== 0) return;
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
        captureTarget: event.currentTarget,
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [onSelect]
  );

  const startResize = useCallback(
    (event, element, handle) => {
      if (event.button !== 0) return;
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
        captureTarget: event.currentTarget,
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [onSelect]
  );

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
              }}
              onPointerDown={(event) => startDrag(event, el)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
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

function renderElementContent(el) {
  if (el.type === 'image') {
    return (
      <img
        src={el.content}
        alt=""
        className="w-full h-full object-cover pointer-events-none"
        style={{
          objectFit: el.fit || 'cover',
          borderRadius: el.borderRadius || 0,
          boxShadow: el.shadow ? `${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${el.shadow.color || '#000000'}` : undefined,
          border: el.stroke ? `${el.stroke.width}px solid ${el.stroke.color}` : undefined,
        }}
      />
    );
  }

  if (el.type === 'shape') {
    return (
      <div
        className="w-full h-full"
        style={{
          backgroundColor: el.backgroundColor || '#333',
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
  const positionStyles = {
    nw: { top: -4, left: -4, cursor: 'nwse-resize' },
    ne: { top: -4, right: -4, cursor: 'nesw-resize' },
    sw: { bottom: -4, left: -4, cursor: 'nesw-resize' },
    se: { bottom: -4, right: -4, cursor: 'nwse-resize' },
    n: { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    s: { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    w: { top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'ew-resize' },
    e: { top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'ew-resize' },
  };

  return (
    <div
      className="absolute w-2 h-2 bg-white border-2 border-purple-600 rounded-full hover:scale-150 transition-transform"
      style={positionStyles[position]}
      onPointerDown={onStart}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
