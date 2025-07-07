import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FlowchartNode } from './FlowchartNode';
import { Edge as EdgeComponent } from './Edge';
import { UseFlowchartReturn } from '../hooks/useFlowchart';
import { Node, NodeType } from '../types';
import { useDragDrop } from './DragDropContext';
import { Minimap } from './Minimap';
import ZoomControls from './ZoomControls';

declare const html2canvas: any;
declare const jspdf: { jsPDF: new (options: any) => any };

const getCssText = async () => {
    let cssText = '';
    const styleSheets = Array.from(document.styleSheets);
    for (const sheet of styleSheets) {
        // For external stylesheets, try to fetch them
        if (sheet.href) {
            try {
                const res = await fetch(sheet.href);
                if (res.ok) {
                    cssText += await res.text();
                }
            } catch (e) {
                console.warn(`Could not fetch stylesheet for SVG export: ${sheet.href}`, e);
            }
        } else { // For inline stylesheets
            try {
                const rules = sheet.cssRules;
                for (const rule of Array.from(rules)) {
                    cssText += rule.cssText;
                }
            } catch (e) {
                 console.warn(`Could not read css rules from stylesheet`, e);
            }
        }
    }
    return cssText;
}

const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
a.click();
    document.body.removeChild(a);
};

const preExportCleanup = (doc: Document) => {
    // Hide selection rings, handles, etc. for a cleaner look
    doc.querySelectorAll('.ring-4, .ring-2, [class*="cursor-pointer"], [class*="cursor-se-resize"], [class*="cursor-move"]').forEach(el => {
        if (el instanceof HTMLElement) {
            el.style.display = 'none';
        }
    });
};

const exportToPng = async (element: HTMLElement, fileName: string) => {
    if (!element) return;
    try {
        const canvas = await html2canvas(element, {
            useCORS: true,
            backgroundColor: null, // Transparent background
            scale: 2, 
            onclone: (clonedDoc) => preExportCleanup(clonedDoc)
        });
        downloadDataUrl(canvas.toDataURL('image/png'), fileName);
    } catch (error) {
        console.error('Error exporting to PNG:', error);
        alert('PNG로 내보내는 중 오류가 발생했습니다.');
    }
};

const exportToSvg = async (element: HTMLElement, fileName: string) => {
    if (!element) return;
    try {
        const { width, height } = element.getBoundingClientRect();
        const clonedElement = element.cloneNode(true) as HTMLElement;

        // Manual cleanup on the clone
        clonedElement.querySelectorAll('.ring-4, .ring-2, [class*="cursor-pointer"], [class*="cursor-se-resize"], [class*="cursor-move"]').forEach(el => {
            el.remove();
        });

        const cssText = await getCssText();

        const svgString = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <foreignObject x="0" y="0" width="100%" height="100%">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%;">
                        <style>
                            ${cssText}
                        </style>
                        ${clonedElement.innerHTML}
                    </div>
                </foreignObject>
            </svg>
        `;
        
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
        downloadDataUrl(dataUrl, fileName);

    } catch (error) {
        console.error('Error exporting to SVG:', error);
        alert('SVG로 내보내는 중 오류가 발생했습니다.');
    }
};

const exportToPdf = async (element: HTMLElement, fileName: string) => {
    if (!element) return;
    try {
        const canvas = await html2canvas(element, { 
            useCORS: true,
            scale: 2,
            onclone: (clonedDoc) => preExportCleanup(clonedDoc)
        });
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = jspdf;
        
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(fileName);

    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('PDF로 내보내는 중 오류가 발생했습니다.');
    }
};


type InteractionMode = 'none' | 'dragging' | 'resizing' | 'connecting' | 'reconnecting' | 'panning' | 'marquee';
const SNAP_DISTANCE = 8;
const MIN_NODE_WIDTH = 80;
const MIN_NODE_HEIGHT = 40;

const getNodeDimensions = (node: Node) => {
    const defaultWidth = node.type === NodeType.Decision ? 120 : 150;
    const defaultHeight = node.type === NodeType.Decision ? 120 : 60;
    return {
        width: node.size?.width ?? defaultWidth,
        height: node.size?.height ?? defaultHeight,
    };
};

interface CanvasProps extends UseFlowchartReturn {
    exportRequest: { format: 'png' | 'svg' | 'pdf', timestamp: number } | null;
    onExportComplete: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  nodes, edges, selection, setSelection, addNode, updateNodePosition, updateMultiNodePositions,
  updateNodeText, updateNodeSize, connectNodes, deleteSelected, pushToHistory,
  updateEdgeLabel, updateEdgeConnection, updateEdgeArrowType, exportRequest, onExportComplete
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [contentDimensions, setContentDimensions] = useState({ width: 0, height: 0 });
  
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('none');
  const interactionState = useRef<any>(null);

  const [tempMousePos, setTempMousePos] = useState({ x: 0, y: 0 });
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [snapLines, setSnapLines] = useState<{h: number[], v: number[]}>({h: [], v: []});

  const { registerDroppable, getSidebarDragData, clearSidebarDragData } = useDragDrop();
  
    useEffect(() => {
        if (!exportRequest || !contentWrapperRef.current) return;

        const { format } = exportRequest;
        const element = contentWrapperRef.current;
        const fileName = `flowchart-${new Date().toISOString().slice(0, 10)}.${format}`;
        
        // Give DOM time to update before starting export
        setTimeout(() => {
            const exportPromise = (() => {
                switch (format) {
                    case 'png': return exportToPng(element, fileName);
                    case 'svg': return exportToSvg(element, fileName);
                    case 'pdf': return exportToPdf(element, fileName);
                    default: return Promise.resolve();
                }
            })();

            exportPromise.finally(() => {
                onExportComplete();
            });
        }, 100);

    }, [exportRequest, onExportComplete]);

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / zoom + canvasRef.current.scrollLeft;
    const y = (clientY - rect.top) / zoom + canvasRef.current.scrollTop;
    return { x, y };
  }, [zoom]);

  // Dynamic content dimensions
  useEffect(() => {
    if (!canvasRef.current) return;
    const padding = 300;
    let maxX = 0;
    let maxY = 0;
    if (nodes.length > 0) {
      nodes.forEach(node => {
        const dim = getNodeDimensions(node);
        maxX = Math.max(maxX, node.position.x + dim.width);
        maxY = Math.max(maxY, node.position.y + dim.height);
      });
      maxX += padding;
      maxY += padding;
    }
    setContentDimensions({
      width: Math.max(canvasRef.current.clientWidth / zoom, maxX),
      height: Math.max(canvasRef.current.clientHeight / zoom, maxY),
    });
  }, [nodes, zoom]); 

  // Add/remove global mouse listeners based on interaction mode
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        const pos = getCanvasCoordinates(e.clientX, e.clientY);
        setTempMousePos(pos);
        
        if (interactionMode === 'dragging') handleDrag(e, pos);
        else if (interactionMode === 'resizing') handleResize(e, pos);
        else if (interactionMode === 'panning') handlePan(e);
        else if (interactionMode === 'marquee') handleMarquee(e, pos);
    };

    const handleMouseUp = (e: MouseEvent) => {
        const pos = getCanvasCoordinates(e.clientX, e.clientY);
        if (interactionMode === 'dragging') handleDragEnd(e, pos);
        else if (interactionMode === 'resizing') handleResizeEnd(e, pos);
        else if (interactionMode === 'connecting') handleConnectEnd(e, pos);
        else if (interactionMode === 'reconnecting') handleReconnectEnd(e, pos);
        else if (interactionMode === 'panning' && interactionState.current?.moved) handlePanEnd(e);
        else if (interactionMode === 'marquee') handleMarqueeEnd(e, pos);
        
        if (interactionMode !== 'none') {
            setInteractionMode('none');
            interactionState.current = null;
            setSnapLines({h: [], v: []});
        }
    };

    if (interactionMode !== 'none') {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp, { once: true });
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interactionMode, getCanvasCoordinates]);

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const nodeToDrag = nodes.find(n => n.id === nodeId);
      if (!nodeToDrag) return;

      const nodesToDragIds = selection.nodes.includes(nodeId) ? selection.nodes : [nodeId];
      const initialPositions = new Map<string, {x: number, y: number}>();
      nodes.forEach(n => {
        if(nodesToDragIds.includes(n.id)) {
            initialPositions.set(n.id, n.position);
        }
      });
      
      interactionState.current = {
          startPos: getCanvasCoordinates(e.clientX, e.clientY),
          initialPositions
      };
      setInteractionMode('dragging');
  };
  
  const handleDrag = (e: MouseEvent, pos: {x:number, y:number}) => {
    if (!interactionState.current) return;
    let deltaX = pos.x - interactionState.current.startPos.x;
    let deltaY = pos.y - interactionState.current.startPos.y;
    
    // Snapping logic
    const { initialPositions } = interactionState.current;
    const primaryNodeId = Array.from(initialPositions.keys())[0];
    const primaryNode = nodes.find(n => n.id === primaryNodeId);
    if (!primaryNode) return;
    
    const primaryNodeInitialPos = initialPositions.get(primaryNodeId)!;
    const primaryNodeDim = getNodeDimensions(primaryNode);
    
    const dragBounds = {
        left: primaryNodeInitialPos.x + deltaX,
        top: primaryNodeInitialPos.y + deltaY,
        hCenter: primaryNodeInitialPos.x + deltaX + primaryNodeDim.width / 2,
        vCenter: primaryNodeInitialPos.y + deltaY + primaryNodeDim.height / 2,
        right: primaryNodeInitialPos.x + deltaX + primaryNodeDim.width,
        bottom: primaryNodeInitialPos.y + deltaY + primaryNodeDim.height
    };
    
    const activeSnapLines: {h: number[], v: number[]} = {h: [], v: []};
    
    const snapTargets = nodes.filter(n => !initialPositions.has(n.id));

    snapTargets.forEach(target => {
        const targetDim = getNodeDimensions(target);
        const targetBounds = {
            left: target.position.x,
            top: target.position.y,
            hCenter: target.position.x + targetDim.width / 2,
            vCenter: target.position.y + targetDim.height / 2,
            right: target.position.x + targetDim.width,
            bottom: target.position.y + targetDim.height
        };

        const checkSnap = (dragVal: number, targetVal: number, setter: (newVal: number) => void, line: number) => {
            if (Math.abs(dragVal - targetVal) < SNAP_DISTANCE) {
                setter(targetVal);
                return line;
            }
            return null;
        };

        const vLines = [
            checkSnap(dragBounds.left, targetBounds.left, v => deltaX += v - dragBounds.left, targetBounds.left),
            checkSnap(dragBounds.left, targetBounds.hCenter, v => deltaX += v - dragBounds.left, targetBounds.hCenter),
            checkSnap(dragBounds.left, targetBounds.right, v => deltaX += v - dragBounds.left, targetBounds.right),
            checkSnap(dragBounds.hCenter, targetBounds.left, v => deltaX += v - dragBounds.hCenter, targetBounds.left),
            checkSnap(dragBounds.hCenter, targetBounds.hCenter, v => deltaX += v - dragBounds.hCenter, targetBounds.hCenter),
            checkSnap(dragBounds.hCenter, targetBounds.right, v => deltaX += v - dragBounds.hCenter, targetBounds.right),
            checkSnap(dragBounds.right, targetBounds.left, v => deltaX += v - dragBounds.right, targetBounds.left),
            checkSnap(dragBounds.right, targetBounds.hCenter, v => deltaX += v - dragBounds.right, targetBounds.hCenter),
            checkSnap(dragBounds.right, targetBounds.right, v => deltaX += v - dragBounds.right, targetBounds.right),
        ].filter(v => v !== null) as number[];
        
        const hLines = [
            checkSnap(dragBounds.top, targetBounds.top, v => deltaY += v - dragBounds.top, targetBounds.top),
            checkSnap(dragBounds.top, targetBounds.vCenter, v => deltaY += v - dragBounds.top, targetBounds.vCenter),
            checkSnap(dragBounds.top, targetBounds.bottom, v => deltaY += v - dragBounds.top, targetBounds.bottom),
            checkSnap(dragBounds.vCenter, targetBounds.top, v => deltaY += v - dragBounds.vCenter, targetBounds.top),
            checkSnap(dragBounds.vCenter, targetBounds.vCenter, v => deltaY += v - dragBounds.vCenter, targetBounds.vCenter),
            checkSnap(dragBounds.vCenter, targetBounds.bottom, v => deltaY += v - dragBounds.vCenter, targetBounds.bottom),
            checkSnap(dragBounds.bottom, targetBounds.top, v => deltaY += v - dragBounds.bottom, targetBounds.top),
            checkSnap(dragBounds.bottom, targetBounds.vCenter, v => deltaY += v - dragBounds.bottom, targetBounds.vCenter),
            checkSnap(dragBounds.bottom, targetBounds.bottom, v => deltaY += v - dragBounds.bottom, targetBounds.bottom),
        ].filter(v => v !== null) as number[];
        
        activeSnapLines.v.push(...vLines);
        activeSnapLines.h.push(...hLines);
    });

    setSnapLines(activeSnapLines);
    
    initialPositions.forEach((initialPos, id) => {
        const newPos = {
            x: Math.max(0, initialPos.x + deltaX),
            y: Math.max(0, initialPos.y + deltaY)
        };
        updateNodePosition(id, newPos);
    });
  };

  const handleDragEnd = (e: MouseEvent, pos: {x:number, y:number}) => {
    if (!interactionState.current?.initialPositions) return;
    const { initialPositions } = interactionState.current;
    if (Array.from(initialPositions.keys()).some(id => {
      const initial = initialPositions.get(id)!;
      const finalNode = nodes.find(n => n.id === id);
      if (!finalNode) return false; // Node was deleted during drag
      return initial.x !== finalNode.position.x || initial.y !== finalNode.position.y;
    })) {
        pushToHistory({
            nodes: nodes.map(n => initialPositions.has(n.id) ? {...n, position: initialPositions.get(n.id)!} : n),
            edges: edges
        });
    }
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const dim = getNodeDimensions(node);
    interactionState.current = {
        nodeId,
        startPos: getCanvasCoordinates(e.clientX, e.clientY),
        initialSize: { width: dim.width, height: dim.height },
        initialNodePos: node.position
    };
    setInteractionMode('resizing');
  };

  const handleResize = (e: MouseEvent, pos: {x:number, y:number}) => {
    if (!interactionState.current) return;
    const { nodeId, startPos, initialSize, initialNodePos } = interactionState.current;
    const deltaX = pos.x - startPos.x;
    const deltaY = pos.y - startPos.y;
    const newSize = {
        width: Math.max(MIN_NODE_WIDTH, initialSize.width + deltaX),
        height: Math.max(MIN_NODE_HEIGHT, initialSize.height + deltaY)
    };
    updateNodeSize(nodeId, newSize, initialNodePos);
  };
  
  const handleResizeEnd = (e: MouseEvent, pos: {x:number, y:number}) => {
     if (!interactionState.current) return;
      const { nodeId, initialSize, initialNodePos } = interactionState.current;
      const finalNode = nodes.find(n => n.id === nodeId);
      if (!finalNode || !finalNode.size) {
        // if size is not defined after resize, it's a click without drag
        // so no history push is needed.
        return;
      }
      
      const finalSize = finalNode.size;
      if(initialSize.width !== finalSize.width || initialSize.height !== finalSize.height) {
        pushToHistory({
            nodes: nodes.map(n => n.id === nodeId ? {...n, size: initialSize, position: initialNodePos} : n),
            edges
        });
      }
  };

  // Connect handlers
  const handleConnectStart = (e: React.MouseEvent, fromId: string) => {
      e.stopPropagation();
      e.preventDefault();
      const node = nodes.find(n => n.id === fromId);
      if (!node) return;
      const dim = getNodeDimensions(node);
      const fromPos = { x: node.position.x + dim.width / 2, y: node.position.y + dim.height };
      interactionState.current = { from: fromId, fromPos };
      setInteractionMode('connecting');
  };
  
  const handleConnectEnd = (e: MouseEvent, pos: {x:number, y:number}) => {
    const targetNodeEl = (e.target as HTMLElement).closest('.flowchart-node');
    if (targetNodeEl && interactionState.current) {
        connectNodes(interactionState.current.from, targetNodeEl.id);
    }
  };
  
  // Reconnect handlers
  const handleReconnectStart = (e: React.MouseEvent, edgeId: string, handle: 'from' | 'to') => {
    e.stopPropagation();
    e.preventDefault();
    interactionState.current = { edgeId, handle };
    setInteractionMode('reconnecting');
  };

  const handleReconnectEnd = (e: MouseEvent, pos: {x:number, y:number}) => {
      const targetNodeEl = (e.target as HTMLElement).closest('.flowchart-node');
      if (targetNodeEl && interactionState.current) {
          const { edgeId, handle } = interactionState.current;
          const currentEdge = edges.find(ed => ed.id === edgeId);
          if (!currentEdge) return;

          const newConnection: { from?: string; to?: string } = { [handle]: targetNodeEl.id };

          // Prevent self-connection and duplicate edges
          const finalFrom = newConnection.from || currentEdge.from;
          const finalTo = newConnection.to || currentEdge.to;
          if(finalFrom === finalTo) return;
          const edgeExists = edges.some(ed => ed.id !== edgeId && ed.from === finalFrom && ed.to === finalTo);
          if (edgeExists) return;

          updateEdgeConnection(edgeId, newConnection);
      }
  };

  // Canvas interaction handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger on direct clicks to the canvas background, not on nodes/edges
    const target = e.target as HTMLElement;
    if (target.closest('.flowchart-node, .edge-g')) return;
    
    if (e.shiftKey) {
        const startPos = getCanvasCoordinates(e.clientX, e.clientY);
        interactionState.current = { start: startPos, end: startPos };
        setInteractionMode('marquee');
    } else {
        interactionState.current = {
            startX: e.clientX,
            startY: e.clientY,
            scrollLeft: canvasRef.current!.scrollLeft,
            scrollTop: canvasRef.current!.scrollTop,
            moved: false
        };
        setInteractionMode('panning');
    }
  };
  
  const handlePan = (e: MouseEvent) => {
    if (!interactionState.current || !canvasRef.current) return;
    const { startX, startY, scrollLeft, scrollTop } = interactionState.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!interactionState.current.moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        interactionState.current.moved = true;
    }
    canvasRef.current.scrollLeft = scrollLeft - dx;
    canvasRef.current.scrollTop = scrollTop - dy;
  };
  
  const handlePanEnd = (e: MouseEvent) => {
      if(!interactionState.current?.moved) {
          setSelection({nodes: [], edges: []});
          setEditingNodeId(null);
      }
      canvasRef.current!.style.cursor = 'grab';
  };
  
  const handleMarquee = (e: MouseEvent, pos: {x:number, y:number}) => {
    if (!interactionState.current) return;
    interactionState.current.end = pos;
  };

  const handleMarqueeEnd = (e: MouseEvent, pos: {x:number, y:number}) => {
    const { start } = interactionState.current;
    const marqueeRect = {
      x: Math.min(start.x, pos.x), y: Math.min(start.y, pos.y),
      width: Math.abs(start.x - pos.x), height: Math.abs(start.y - pos.y),
    };
    const nodesInMarquee = nodes.filter(node => {
        const dim = getNodeDimensions(node);
        return (
            node.position.x < marqueeRect.x + marqueeRect.width &&
            node.position.x + dim.width > marqueeRect.x &&
            node.position.y < marqueeRect.y + marqueeRect.height &&
            node.position.y + dim.height > marqueeRect.y
        );
    }).map(n => n.id);

    if (nodesInMarquee.length > 0) {
        setSelection(curr => ({...curr, nodes: [...new Set([...curr.nodes, ...nodesInMarquee])]}));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const nodeType = getSidebarDragData() as NodeType;
    if (nodeType && canvasRef.current) {
        const position = getCanvasCoordinates(e.clientX, e.clientY);
        addNode(nodeType, position);
    }
    clearSidebarDragData();
  }, [addNode, getSidebarDragData, clearSidebarDragData, getCanvasCoordinates]);

  useEffect(() => {
    const cleanup = registerDroppable(canvasRef, handleDrop);
    return cleanup;
  }, [registerDroppable, handleDrop]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
      if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = -e.deltaY / 100;
          setZoom(prevZoom => Math.max(0.2, Math.min(2.5, prevZoom + delta)));
      }
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    if (canvasRef.current && contentDimensions.width > 0) {
        const { clientWidth, clientHeight } = canvasRef.current;
        canvasRef.current.scrollLeft = (contentDimensions.width - clientWidth) / 2;
        canvasRef.current.scrollTop = (contentDimensions.height - clientHeight) / 2;
    }
  }, [contentDimensions]);
  
  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
     e.stopPropagation();
     if (e.shiftKey) {
        setSelection(curr => {
          const newNodes = new Set(curr.nodes);
          newNodes.has(nodeId) ? newNodes.delete(nodeId) : newNodes.add(nodeId);
          return { ...curr, nodes: Array.from(newNodes), edges: curr.edges };
        });
     } else {
        setSelection({ nodes: [nodeId], edges: [] });
     }
  };

  const handleEdgeSelect = (e: React.MouseEvent, edgeId: string) => {
    e.stopPropagation();
     if (e.shiftKey) {
        setSelection(curr => {
          const newEdges = new Set(curr.edges);
          newEdges.has(edgeId) ? newEdges.delete(edgeId) : newEdges.add(edgeId);
          return { ...curr, edges: Array.from(newEdges), nodes: curr.nodes };
        });
     } else {
        setSelection({ nodes: [], edges: [edgeId] });
     }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selection.nodes.length > 0 || selection.edges.length > 0)) {
        if(document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, selection]);
  
  // Visual elements for interactions
  const renderInteractionVisuals = () => {
    if (interactionMode === 'connecting' && interactionState.current) {
      return <line x1={interactionState.current.fromPos.x} y1={interactionState.current.fromPos.y} x2={tempMousePos.x} y2={tempMousePos.y} stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />;
    }
    if (interactionMode === 'reconnecting' && interactionState.current) {
      const { edgeId, handle } = interactionState.current;
      const edge = edges.find(e => e.id === edgeId);
      if(!edge) return null;
      
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return null;

      const fromDim = getNodeDimensions(fromNode);
      const toDim = getNodeDimensions(toNode);
      const fromCenter = {x: fromNode.position.x + fromDim.width / 2, y: fromNode.position.y + fromDim.height / 2};
      const toCenter = {x: toNode.position.x + toDim.width / 2, y: toNode.position.y + toDim.height / 2};
      const start = handle === 'to' ? fromCenter : tempMousePos;
      const end = handle === 'from' ? toCenter : tempMousePos;
      return <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />;
    }
    if (interactionMode === 'marquee' && interactionState.current) {
        const {start, end} = interactionState.current;
        const marqueeRect = {x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(start.x - end.x), height: Math.abs(start.y - end.y)};
        return <rect {...marqueeRect} className="fill-blue-500/20 stroke-blue-600 stroke-2 stroke-dashed" />
    }
    return null;
  }
  
  return (
    <div className="h-full w-full bg-gray-50 relative">
        <div
            ref={canvasRef}
            className="w-full h-full overflow-auto cursor-grab"
            onMouseDown={handleCanvasMouseDown}
            onDragOver={(e) => e.preventDefault()}
            onWheel={handleWheel}
            style={{cursor: interactionMode === 'panning' ? 'grabbing': 'grab'}}
        >
            <div
                ref={contentWrapperRef}
                className="relative bg-gray-50"
                style={{ 
                    width: contentDimensions.width, 
                    height: contentDimensions.height,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                }}
            >
                <svg
                className="absolute top-0 left-0"
                style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                >
                <defs>
                    <pattern id="pattern-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="1" fill="#d1d5db"></circle>
                    </pattern>
                    <marker id="arrow-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" className="marker-arrow" />
                    </marker>
                    <marker id="arrow-end-selected" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" className="marker-arrow-selected" />
                    </marker>
                    <marker id="arrow-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 10 0 L 0 5 L 10 10 z" className="marker-arrow" />
                    </marker>
                    <marker id="arrow-start-selected" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 10 0 L 0 5 L 10 10 z" className="marker-arrow-selected" />
                    </marker>
                </defs>
                <rect width="100%" height="100%" fill="url(#pattern-grid)"></rect>
                {edges.map((edge) => (
                    <EdgeComponent 
                        key={edge.id} 
                        edge={edge} 
                        nodes={nodes}
                        isSelected={selection.edges.includes(edge.id)}
                        onSelect={handleEdgeSelect}
                        onUpdateLabel={updateEdgeLabel}
                        onReconnectStart={handleReconnectStart}
                    />
                ))}
                {renderInteractionVisuals()}
                {snapLines.v.map((x, i) => <line key={`v-${i}`} x1={x} y1={0} x2={x} y2={contentDimensions.height} stroke="#fb923c" strokeWidth="1" strokeDasharray="4,4" />)}
                {snapLines.h.map((y, i) => <line key={`h-${i}`} x1={0} y1={y} x2={contentDimensions.width} y2={y} stroke="#fb923c" strokeWidth="1" strokeDasharray="4,4" />)}
                </svg>
                {nodes.map((node) => (
                <FlowchartNode
                    key={node.id}
                    node={node}
                    isSelected={selection.nodes.includes(node.id)}
                    isEditing={editingNodeId === node.id}
                    isConnectionTarget={
                      (interactionMode === 'connecting' || interactionMode === 'reconnecting') &&
                      tempMousePos.x > node.position.x && tempMousePos.x < node.position.x + getNodeDimensions(node).width &&
                      tempMousePos.y > node.position.y && tempMousePos.y < node.position.y + getNodeDimensions(node).height
                    }
                    onNodeMouseDown={handleDragStart}
                    onResizeHandleMouseDown={handleResizeStart}
                    onNodeClick={handleNodeClick}
                    onNodeDoubleClick={setEditingNodeId}
                    onTextUpdate={(id, text) => { updateNodeText(id, text); setEditingNodeId(null); }}
                    onConnectStart={handleConnectStart}
                />
                ))}
            </div>
        </div>
        <Minimap 
            nodes={nodes}
            contentDimensions={contentDimensions}
            canvasRef={canvasRef}
            zoom={zoom}
        />
        <ZoomControls zoom={zoom} setZoom={setZoom} resetView={resetView} />
    </div>
  );
};