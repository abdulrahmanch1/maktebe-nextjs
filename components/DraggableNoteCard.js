'use client';
import React, { useState, useRef, useEffect } from 'react';
import { FaGripLines, FaExpandAlt, FaPalette, FaTrash } from 'react-icons/fa';
import { NOTE_COLORS } from '@/utils/colors';

const DraggableNoteCard = ({
    id,
    content,
    initialX = 50,
    initialY = 50,
    initialWidth = 200,
    initialHeight = 150,
    initialColor = '#fbf8cc',
    onUpdate,
    onDelete,
}) => {
    const cardRef = useRef(null);
    const textareaRef = useRef(null);
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
    const [color, setColor] = useState(initialColor);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [localContent, setLocalContent] = useState(content);

    useEffect(() => {
        if (content !== localContent && document.activeElement !== textareaRef.current) {
            setLocalContent(content);
        }
    }, [content, localContent]);

    useEffect(() => {
        if (!content && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [content]);

    // Unified event handler for both mouse and touch
    const getEventCoordinates = (e) => {
        if (e.touches && e.touches[0]) {
            return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
        }
        return { clientX: e.clientX, clientY: e.clientY };
    };

    const handleDragStart = (e) => {
        e.stopPropagation();
        const { clientX: startX, clientY: startY } = getEventCoordinates(e);
        const startLeft = cardRef.current.offsetLeft;
        const startTop = cardRef.current.offsetTop;
        const parentWidth = cardRef.current.offsetParent.offsetWidth;
        const parentHeight = cardRef.current.offsetParent.offsetHeight;

        const onMove = (moveEvent) => {
            moveEvent.preventDefault();
            const { clientX, clientY } = getEventCoordinates(moveEvent);
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;

            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;

            newLeft = Math.max(0, Math.min(newLeft, parentWidth - size.width));
            newTop = Math.max(0, Math.min(newTop, parentHeight - size.height));

            cardRef.current.style.left = `${newLeft}px`;
            cardRef.current.style.top = `${newTop}px`;
        };

        const onEnd = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);

            const finalLeft = cardRef.current.offsetLeft;
            const finalTop = cardRef.current.offsetTop;
            const xPercent = (finalLeft / parentWidth) * 100;
            const yPercent = (finalTop / parentHeight) * 100;

            setPosition({ x: xPercent, y: yPercent });
            onUpdate(id, { req_x: xPercent, req_y: yPercent });
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    };

    const handleResizeStart = (e) => {
        e.stopPropagation();
        const { clientX: startX, clientY: startY } = getEventCoordinates(e);
        const startWidth = size.width;
        const startHeight = size.height;

        const onMove = (moveEvent) => {
            moveEvent.preventDefault();
            const { clientX, clientY } = getEventCoordinates(moveEvent);
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;

            const newWidth = Math.max(150, startWidth + deltaX);
            const newHeight = Math.max(100, startHeight + deltaY);

            setSize({ width: newWidth, height: newHeight });
        };

        const onEnd = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            onUpdate(id, { width: size.width, height: size.height });
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    };

    const handleColorChange = (newColor) => {
        setColor(newColor);
        setIsColorPickerOpen(false);
        onUpdate(id, { color: newColor });
    };

    const handleBlur = () => {
        if (localContent !== content) {
            onUpdate(id, { note: localContent });
        }
    };

    return (
        <div
            ref={cardRef}
            className="draggable-note-card"
            style={{
                position: 'absolute',
                left: `${position.x}%`,
                top: `${position.y}%`,
                width: `${size.width}px`,
                height: `${size.height}px`,
                backgroundColor: color,
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                borderRadius: '8px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
                touchAction: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className="note-card-header"
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                style={{
                    padding: '8px 10px',
                    cursor: 'grab',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    touchAction: 'none'
                }}
            >
                <FaGripLines style={{ color: '#666', opacity: 0.7 }} size={14} />
                <div className="note-card-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setIsColorPickerOpen(!isColorPickerOpen)} title="تغيير اللون" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#555', padding: '4px' }}>
                        <FaPalette size={14} />
                    </button>
                    <button onClick={() => onDelete(id)} title="حذف" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d32f2f', padding: '4px' }}>
                        <FaTrash size={14} />
                    </button>
                </div>
            </div>

            {isColorPickerOpen && (
                <div className="color-picker-popover" style={{
                    position: 'absolute',
                    top: '40px',
                    right: '5px',
                    background: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '6px',
                    zIndex: 101,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                    {NOTE_COLORS.map(c => (
                        <div
                            key={c}
                            onClick={() => handleColorChange(c)}
                            style={{ width: '24px', height: '24px', backgroundColor: c, borderRadius: '50%', cursor: 'pointer', border: '2px solid #ddd' }}
                        />
                    ))}
                </div>
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <textarea
                    ref={textareaRef}
                    value={localContent}
                    onChange={(e) => setLocalContent(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="اكتب ملاحظتك هنا..."
                    style={{
                        flex: 1,
                        width: '100%',
                        border: 'none',
                        resize: 'none',
                        backgroundColor: 'transparent',
                        padding: '12px',
                        fontSize: '0.95rem',
                        lineHeight: '1.5',
                        color: '#333',
                        outline: 'none',
                        fontFamily: 'inherit'
                    }}
                />
            </div>

            <div
                onMouseDown={handleResizeStart}
                onTouchStart={handleResizeStart}
                style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    cursor: 'nwse-resize',
                    padding: '6px',
                    opacity: 0.6,
                    touchAction: 'none'
                }}
            >
                <FaExpandAlt size={14} style={{ transform: 'rotate(90deg)' }} />
            </div>
        </div>
    );
};

export default DraggableNoteCard;
