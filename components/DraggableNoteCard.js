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

    // Update local content if prop changes (e.g. from server refresh), but only if not focused?
    // Actually, checking if focused is hard here without extra state.
    // Simple sync:
    useEffect(() => {
        if (content !== localContent && document.activeElement !== textareaRef.current) {
            setLocalContent(content);
        }
    }, [content]);

    // Auto-focus if content is empty (new note)
    useEffect(() => {
        if (!content && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    const handleDragStart = (e) => {
        // ... (Drag logic remains the same, omitted for brevity if unchanged, but I need to include it for replace_file_content unless using chunks. 
        // For safety/simplicity in replace tool, I'll keep the logic as is or just render the whole file if I can't match blocks well. 
        // Actually this tool replaces chunks. I'll paste the whole file content implementation since I'm changing imports and props and render.)
        // wait, replace_file_content is "single contiguous block". 
        // I will use "Whole File" replacement strategy because changes are scattered (imports, props, render).
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = cardRef.current.offsetLeft;
        const startTop = cardRef.current.offsetTop;
        const parentWidth = cardRef.current.offsetParent.offsetWidth;
        const parentHeight = cardRef.current.offsetParent.offsetHeight;

        const onMouseMove = (moveEvent) => {
            moveEvent.preventDefault();
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;

            // Bounds check
            newLeft = Math.max(0, Math.min(newLeft, parentWidth - size.width));
            newTop = Math.max(0, Math.min(newTop, parentHeight - size.height));

            cardRef.current.style.left = `${newLeft}px`;
            cardRef.current.style.top = `${newTop}px`;
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            const finalLeft = cardRef.current.offsetLeft;
            const finalTop = cardRef.current.offsetTop;
            const xPercent = (finalLeft / parentWidth) * 100;
            const yPercent = (finalTop / parentHeight) * 100;

            setPosition({ x: xPercent, y: yPercent });
            onUpdate(id, { req_x: xPercent, req_y: yPercent });
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const handleResizeStart = (e) => {
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = size.width;
        const startHeight = size.height;

        const onMouseMove = (moveEvent) => {
            moveEvent.preventDefault();
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            const newWidth = Math.max(150, startWidth + deltaX);
            const newHeight = Math.max(100, startHeight + deltaY);

            setSize({ width: newWidth, height: newHeight });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            onUpdate(id, { width: size.width, height: size.height });
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
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
                overflow: 'visible'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className="note-card-header"
                onMouseDown={handleDragStart}
                style={{
                    padding: '6px 8px',
                    cursor: 'grab',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px'
                }}
            >
                <FaGripLines style={{ color: '#666', opacity: 0.7 }} size={12} />
                <div className="note-card-actions" style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setIsColorPickerOpen(!isColorPickerOpen)} title="تغيير اللون" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#555', padding: 0 }}><FaPalette size={12} /></button>
                    <button onClick={() => onDelete(id)} title="حذف" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d32f2f', padding: 0 }}><FaTrash size={12} /></button>
                </div>
            </div>

            {isColorPickerOpen && (
                <div className="color-picker-popover" style={{
                    position: 'absolute',
                    top: '35px',
                    right: '5px',
                    background: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    padding: '5px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '5px',
                    zIndex: 101,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    {NOTE_COLORS.map(c => (
                        <div
                            key={c}
                            onClick={() => handleColorChange(c)}
                            style={{ width: '20px', height: '20px', backgroundColor: c, borderRadius: '50%', cursor: 'pointer', border: '1px solid #ddd' }}
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
                        padding: '10px',
                        fontSize: '0.9rem',
                        lineHeight: '1.4',
                        color: '#333',
                        outline: 'none',
                        fontFamily: 'inherit'
                    }}
                />
            </div>

            <div
                onMouseDown={handleResizeStart}
                style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    cursor: 'nwse-resize',
                    padding: '5px',
                    opacity: 0.5
                }}
            >
                <FaExpandAlt size={12} style={{ transform: 'rotate(90deg)' }} />
            </div>
        </div>
    );
};

export default DraggableNoteCard;
