import React, { useState } from 'react';
import './Tooltip.css';

export default function Tooltip({ text, children, position = 'top' }) {
    const [visible, setVisible] = useState(false);
    let timeout;

    const handleMouseEnter = () => {
        timeout = setTimeout(() => setVisible(true), 500);
    };

    const handleMouseLeave = () => {
        clearTimeout(timeout);
        setVisible(false);
    };

    return (
        <div
            className="tooltip-wrapper"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {visible && text && (
                <div className={`tooltip tooltip-${position}`}>
                    {text}
                </div>
            )}
        </div>
    );
}
