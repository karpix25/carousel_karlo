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
        let newX = interaction.originX;
        let newY = interaction.originY;
        let newWidth = interaction.originWidth;
        let newHeight = interaction.originHeight;

        // Calculate new dimensions based on handle
        if (handle.includes('e')) {
          newWidth = Math.max(20, interaction.originWidth + deltaX);
        }
        if (handle.includes('w')) {
          const proposedWidth = Math.max(20, interaction.originWidth - deltaX);
          newX = interaction.originX + (interaction.originWidth - proposedWidth);
          newWidth = proposedWidth;
        }
        if (handle.includes('s')) {
          newHeight = Math.max(20, interaction.originHeight + deltaY);
        }
        if (handle.includes('n')) {
          const proposedHeight = Math.max(20, interaction.originHeight - deltaY);
          newY = interaction.originY + (interaction.originHeight - proposedHeight);
          newHeight = proposedHeight;
        }

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
        originX: element.x,
        originY: element.y,
        width: element.width,
        height: element.height,
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
        originX: element.x,
        originY: element.y,
        originWidth: element.width,
        originHeight: element.height,
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
                width: el.width,
                height: el.height,
                transformOrigin: 'top left',
                left: el.x,
                top: el.y,
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
        style={{ objectFit: el.fit || 'cover', borderRadius: el.borderRadius || 0 }}
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
        }}
      />
    );
  }

  return (
    <div
      className="w-full h-full flex"
      style={{
        fontSize: el.fontSize || 18,
        color: el.color || '#fff',
        backgroundColor: el.backgroundColor || 'transparent',
        fontWeight: el.fontWeight || 400,
        fontStyle: el.fontStyle || 'normal',
        textDecoration: el.textDecoration || 'none',
        textAlign: el.textAlign || 'left',
        justifyContent: resolveJustify(el.textAlign),
        alignItems: resolveAlignItems(el.verticalAlign),
        lineHeight: el.lineHeight || 1.2,
        fontFamily: getFontStack(el.fontFamily),
        letterSpacing: typeof el.letterSpacing === 'number' ? `${el.letterSpacing}px` : undefined,
        textTransform: el.textTransform || 'none',
        wordBreak: el.wordBreak ? 'break-all' : 'normal',
        whiteSpace: 'pre-line',
      }}
    >
      {(el.content_preview || el.content || '').trim()}
    </div>
  );
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
