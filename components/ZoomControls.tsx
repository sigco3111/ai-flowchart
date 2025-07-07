import React from 'react';
import { PlusIcon, MinusIcon, FitToScreenIcon } from './icons';

interface ZoomControlsProps {
    zoom: number;
    setZoom: (zoom: number | ((prevZoom: number) => number)) => void;
    resetView: () => void;
}

const ControlButton: React.FC<{ onClick: () => void, children: React.ReactNode, title: string }> = ({ onClick, children, title }) => (
    <button
        onClick={onClick}
        title={title}
        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors"
    >
        {children}
    </button>
);

const ZoomControls: React.FC<ZoomControlsProps> = ({ zoom, setZoom, resetView }) => {
    
    const handleZoomIn = () => setZoom(z => Math.min(2.5, z + 0.15));
    const handleZoomOut = () => setZoom(z => Math.max(0.2, z - 0.15));

    return (
        <div className="absolute bottom-4 right-4 bg-white border border-gray-300 shadow-lg rounded-md flex items-center overflow-hidden">
            <ControlButton onClick={handleZoomOut} title="축소">
                <MinusIcon />
            </ControlButton>
            <div 
                className="w-16 h-10 text-center text-sm font-semibold flex items-center justify-center text-gray-700 cursor-pointer"
                onClick={resetView}
                title="뷰 리셋 (100%)"
            >
                {Math.round(zoom * 100)}%
            </div>
            <ControlButton onClick={handleZoomIn} title="확대">
                <PlusIcon />
            </ControlButton>
             <div className="w-px h-6 bg-gray-300"></div>
             <ControlButton onClick={resetView} title="뷰 리셋">
                <FitToScreenIcon />
            </ControlButton>
        </div>
    );
};

export default ZoomControls;
