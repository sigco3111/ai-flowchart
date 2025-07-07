import React, { useState, useEffect, useRef } from 'react';
import { Node, NodeType } from '../types';

interface MinimapProps {
    nodes: Node[];
    contentDimensions: { width: number, height: number };
    canvasRef: React.RefObject<HTMLDivElement>;
    zoom: number;
}

const MINIMAP_WIDTH = 200;

export const Minimap: React.FC<MinimapProps> = ({ nodes, contentDimensions, canvasRef, zoom }) => {
    const minimapRef = useRef<SVGSVGElement>(null);
    const [scale, setScale] = useState(1);
    const [viewport, setViewport] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const panState = useRef({ isPanning: false, startX: 0, startY: 0 });

    useEffect(() => {
        if (contentDimensions.width > 0) {
            setScale(MINIMAP_WIDTH / contentDimensions.width);
        }
    }, [contentDimensions.width]);

    useEffect(() => {
        const updateViewport = () => {
            if (!canvasRef.current) return;
            const { scrollLeft, scrollTop, clientWidth, clientHeight } = canvasRef.current;
            setViewport({
                width: clientWidth / zoom * scale,
                height: clientHeight / zoom * scale,
                x: scrollLeft / zoom * scale,
                y: scrollTop / zoom * scale,
            });
        };

        updateViewport(); // Initial update

        const canvasElement = canvasRef.current;
        canvasElement?.addEventListener('scroll', updateViewport);
        // Also update when window resizes
        window.addEventListener('resize', updateViewport);

        return () => {
            canvasElement?.removeEventListener('scroll', updateViewport);
            window.removeEventListener('resize', updateViewport);
        };
    }, [canvasRef, zoom, scale]);

    const handlePan = (e: React.MouseEvent) => {
        e.preventDefault();
        const minimap = minimapRef.current;
        if (!minimap || !canvasRef.current) return;

        const rect = minimap.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Convert minimap click to main canvas scroll position
        const targetScrollLeft = (clickX - viewport.width / 2) / scale * zoom;
        const targetScrollTop = (clickY - viewport.height / 2) / scale * zoom;
        
        canvasRef.current.scrollTo({
            left: targetScrollLeft,
            top: targetScrollTop,
            behavior: 'smooth'
        });
    };
    
    const startViewportPan = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        panState.current = {
            isPanning: true,
            startX: e.clientX,
            startY: e.clientY
        };
        window.addEventListener('mousemove', handleViewportPan);
        window.addEventListener('mouseup', endViewportPan);
    };

    const handleViewportPan = (e: MouseEvent) => {
        if (!panState.current.isPanning || !canvasRef.current) return;
        e.preventDefault();

        const dx = e.clientX - panState.current.startX;
        const dy = e.clientY - panState.current.startY;
        
        panState.current.startX = e.clientX;
        panState.current.startY = e.clientY;

        // Convert mouse delta to scroll delta
        const scrollDx = dx / scale * zoom;
        const scrollDy = dy / scale * zoom;

        canvasRef.current.scrollBy(scrollDx, scrollDy);
    };

    const endViewportPan = (e: MouseEvent) => {
        e.preventDefault();
        panState.current.isPanning = false;
        window.removeEventListener('mousemove', handleViewportPan);
        window.removeEventListener('mouseup', endViewportPan);
    };


    if (contentDimensions.width <= 0) return null;

    const minimapHeight = contentDimensions.height * scale;

    return (
        <div className="absolute top-4 right-4 bg-white/80 border border-gray-300 shadow-lg rounded-md overflow-hidden backdrop-blur-sm">
            <svg
                ref={minimapRef}
                width={MINIMAP_WIDTH}
                height={minimapHeight}
                viewBox={`0 0 ${contentDimensions.width} ${contentDimensions.height}`}
                onClick={handlePan}
                className="cursor-pointer"
            >
                <rect width={contentDimensions.width} height={contentDimensions.height} fill="#f3f4f6" />

                {/* Render nodes */}
                {nodes.map(node => {
                    const width = node.type === NodeType.Decision ? 120 : 150;
                    const height = node.type === NodeType.Decision ? 120 : 60;
                    return (
                        <rect
                            key={node.id}
                            x={node.position.x}
                            y={node.position.y}
                            width={width}
                            height={height}
                            fill="#a5b4fc"
                            stroke="#6366f1"
                            strokeWidth="10"
                        />
                    );
                })}

                {/* Render viewport */}
                 <rect
                    x={viewport.x / scale}
                    y={viewport.y / scale}
                    width={viewport.width / scale}
                    height={viewport.height / scale}
                    fill="rgba(59, 130, 246, 0.3)"
                    stroke="rgba(59, 130, 246, 0.8)"
                    strokeWidth="10"
                    className="cursor-move"
                    onMouseDown={startViewportPan}
                />
            </svg>
        </div>
    );
};