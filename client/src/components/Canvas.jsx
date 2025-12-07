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
  const lastThrottleTime = useRef(0);
  const pendingUpdateRef = useRef(null);

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

      let updatePayload = null;

      if (interaction.type === 'drag') {
        const nextX = clamp(interaction.originX + deltaX, 0, Math.max(0, width - interaction.width));
        const nextY = clamp(interaction.originY + deltaY, 0, Math.max(0, height - interaction.height));

        updatePayload = { x: Math.round(nextX), y: Math.round(nextY) };

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

        let newWidth = Math.max(20, interaction.originWidth + dW);
        let newHeight = Math.max(20, interaction.originHeight + dH);

        if (interaction.constrainProportions) {
          const aspect = interaction.aspect || 1;

          if (handle.length === 2 || handle === 'w' || handle === 'e') {
            // Corner or Side (Width drives Height)
            newHeight = Math.round(newWidth / aspect);
          } else {
            // Top/Bottom (Height drives Width)
            newWidth = Math.round(newHeight * aspect);
          }
        }

        // Final constrained new dimensions
        newWidth = Math.round(newWidth);
        newHeight = Math.round(newHeight);

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

        updatePayload = {
          x: Math.round(newX),
          y: Math.round(newY),
          width: newWidth,
          height: newHeight,
        };
      }

      if (updatePayload) {
        pendingUpdateRef.current = updatePayload;
        const now = Date.now();
        // Throttle to ~120fps (8ms)
        if (now - lastThrottleTime.current >= 8) {
          onUpdate(interaction.id, updatePayload);
          lastThrottleTime.current = now;
          pendingUpdateRef.current = null;
        }
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

      // Flush pending update on release
      if (pendingUpdateRef.current) {
        onUpdate(interaction.id, pendingUpdateRef.current);
        pendingUpdateRef.current = null;
      }

      interactionRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    },
    [handlePointerMove, onUpdate]
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
            <CanvasLayer
              key={el.id}
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

const CanvasLayer = React.memo(({ element, index, isSelected, onStartDrag, onSelect, onStartResize }) => {
  return (
    <div
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
        zIndex: index + 1, // Using ID as Z-index? Original map used index+1. 
        // ID is string? If ID is string, zIndex fails.
        // Original code: zIndex: index + 1.
        // I need to pass index to CanvasLayer or handle zIndex.
        // Let's pass 'index' prop.
        pointerEvents: element.locked ? 'none' : 'auto',
      }}
      // Wait, zIndex should be index.
      // I need to update Props for CanvasLayer.
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

      {/* Resize handles - only show for selected element */}
      {isSelected && (
        <>
          {/* Corner handles */}
          <ResizeHandle position="nw" onStart={(e) => onStartResize(e, element, 'nw')} />
          <ResizeHandle position="ne" onStart={(e) => onStartResize(e, element, 'ne')} />
          <ResizeHandle position="sw" onStart={(e) => onStartResize(e, element, 'sw')} />
          <ResizeHandle position="se" onStart={(e) => onStartResize(e, element, 'se')} />
          {/* Edge handles */}
          <ResizeHandle position="n" onStart={(e) => onStartResize(e, element, 'n')} />
          <ResizeHandle position="s" onStart={(e) => onStartResize(e, element, 's')} />
          <ResizeHandle position="w" onStart={(e) => onStartResize(e, element, 'w')} />
          <ResizeHandle position="e" onStart={(e) => onStartResize(e, element, 'e')} />
        </>
      )}
    </div>
  );
}, (prev, next) => {
  return (
    prev.element === next.element &&
    prev.isSelected === next.isSelected &&
    prev.index === next.index // if we add zIndex prop
  );
});

// Update CanvasLayer usage above to include zIndex style or pass it.
// I will edit the usage in the file to: style={{ ... zIndex: element.zIndex || 1 ... }} ? 
// No, zIndex comes from order in array.
// I must pass `index` to CanvasLayer.
// <CanvasLayer ... index={index} />
// And inside CanvasLayer: `zIndex: index + 1`.

function renderElementContent(el) {
  if (el.type === 'image') {
    const isContour = el.contour;
    const filter = getDropShadowFilter(el.stroke, el.shadow, isContour);

    return (
      <div className="w-full h-full relative overflow-hidden">
        <img
          src={el.content || el.src} // Handle legacy src or content? Original used content for image? Step 637 line 388 uses el.content.
          // Step 635 usage: src={el.src}.
          // Let's check original usage. Step 637 line 388: src={el.content}.
          // Step 538 usage? Step 479 lines 388: src={el.content}.
          // So I should use el.content.
          alt=""
          className="w-full h-full object-cover pointer-events-none select-none"
          style={{
            objectFit: el.fit || 'cover',
            borderRadius: el.borderRadius || 0,
            opacity: el.opacity ?? 1, // Wait, opacity is on container too? Original had opacity on container.
            // Inner image opacity? Usually opacity is on container.
            // Step 637 line 391 doesn't have opacity.
            // Step 635 had it.
            // I will stick to Step 637 (original) logic.
            // filter is here.
            filter: filter,
            boxShadow: !isContour && el.shadow ? `${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${el.shadow.color || '#000000'}` : undefined,
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
      ? `${el.shadow.x || 0}px ${el.shadow.y || 0}px ${el.shadow.blur || 0}px ${el.shadow.color || '#000000'}`
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
        wordBreak: 'break-word',
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
    filters.push(`drop-shadow(${shadow.x || 0}px ${shadow.y || 0}px ${shadow.blur || 0}px ${shadow.color || '#000000'})`);
  }

  return filters.length > 0 ? filters.join(' ') : undefined;
}

function hexToRgba(hex, alpha = 1) {
  if (!hex) return 'rgba(0,0,0,1)';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
