import React, { useRef, useCallback } from 'react';

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
      if (!interaction || interaction.type !== 'drag') {
        return;
      }
      if (interaction.pointerId !== undefined && event.pointerId !== interaction.pointerId) {
        return;
      }
      const deltaX = (event.clientX - interaction.startClientX) / zoom;
      const deltaY = (event.clientY - interaction.startClientY) / zoom;
      const nextX = clamp(interaction.originX + deltaX, 0, Math.max(0, width - interaction.width));
      const nextY = clamp(interaction.originY + deltaY, 0, Math.max(0, height - interaction.height));
      onUpdate(interaction.id, { x: Math.round(nextX), y: Math.round(nextY) });
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
              className={`absolute cursor-move transition-all duration-150 ${
                selectedId === el.id
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
      className="w-full h-full whitespace-pre-wrap flex items-center justify-center text-white"
      style={{
        fontSize: el.fontSize || 18,
        color: el.color || '#fff',
        fontWeight: el.fontWeight || 400,
        textAlign: el.textAlign || 'left',
        justifyContent: resolveJustify(el.textAlign),
        lineHeight: el.lineHeight || '1.2',
        display: 'flex',
      }}
    >
      {el.content || ''}
    </div>
  );
}

function resolveJustify(value = 'left') {
  if (value === 'center') return 'center';
  if (value === 'right') return 'flex-end';
  return 'flex-start';
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
