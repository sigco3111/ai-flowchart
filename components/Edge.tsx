import React, { useState, useEffect, useRef } from 'react';
import { Edge as EdgeType, Node, NodeType, EdgeArrowType } from '../types';

interface EdgeProps {
  edge: EdgeType;
  nodes: Node[];
  isSelected: boolean;
  onSelect: (e: React.MouseEvent, id: string) => void;
  onUpdateLabel: (edgeId: string, label: string) => void;
  onReconnectStart: (e: React.MouseEvent, edgeId: string, handle: 'from' | 'to') => void;
}

const getNodeDimensions = (node: Node) => {
    const defaultWidth = node.type === NodeType.Decision ? 120 : 150;
    const defaultHeight = node.type === NodeType.Decision ? 120 : 60;
    return {
        width: node.size?.width ?? defaultWidth,
        height: node.size?.height ?? defaultHeight
    };
}

// Helper function to calculate the best connection points between two nodes
const getEdgePoints = (fromNode: Node, toNode: Node) => {
    const fromDim = getNodeDimensions(fromNode);
    const toDim = getNodeDimensions(toNode);

    const fromBBox = {
        left: fromNode.position.x,
        top: fromNode.position.y,
        right: fromNode.position.x + fromDim.width,
        bottom: fromNode.position.y + fromDim.height,
        centerX: fromNode.position.x + fromDim.width / 2,
        centerY: fromNode.position.y + fromDim.height / 2,
    };
    const toBBox = {
        left: toNode.position.x,
        top: toNode.position.y,
        right: toNode.position.x + toDim.width,
        bottom: toNode.position.y + toDim.height,
        centerX: toNode.position.x + toDim.width / 2,
        centerY: toNode.position.y + toDim.height / 2,
    };

    const fromPoints = [
        { x: fromBBox.centerX, y: fromBBox.top },
        { x: fromBBox.right, y: fromBBox.centerY },
        { x: fromBBox.centerX, y: fromBBox.bottom },
        { x: fromBBox.left, y: fromBBox.centerY },
    ];
    const toPoints = [
        { x: toBBox.centerX, y: toBBox.top },
        { x: toBBox.right, y: toBBox.centerY },
        { x: toBBox.centerX, y: toBBox.bottom },
        { x: toBBox.left, y: toBBox.centerY },
    ];

    let minDistance = Infinity;
    let startPoint = fromPoints[2];
    let endPoint = toPoints[0];

    for (const p1 of fromPoints) {
        for (const p2 of toPoints) {
            const distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
            if (distance < minDistance) {
                minDistance = distance;
                startPoint = p1;
                endPoint = p2;
            }
        }
    }
    
    return { startPoint, endPoint };
};


export const Edge: React.FC<EdgeProps> = ({ edge, nodes, isSelected, onSelect, onUpdateLabel, onReconnectStart }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(edge.label || '');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setLabel(edge.label || '');
  }, [edge.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [isEditing]);
  
  const fromNode = nodes.find((node) => node.id === edge.from);
  const toNode = nodes.find((node) => node.id === edge.to);

  if (!fromNode || !toNode) {
    return null;
  }
  
  const { startPoint, endPoint } = getEdgePoints(fromNode, toNode);

  const midX = (startPoint.x + endPoint.x) / 2;
  const midY = (startPoint.y + endPoint.y) / 2;

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  };
  
  const handleLabelUpdate = () => {
    onUpdateLabel(edge.id, label);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleLabelUpdate();
    } else if (e.key === 'Escape') {
        setLabel(edge.label || '');
        setIsEditing(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const strokeColor = isSelected ? '#3b82f6' : '#6b7280';
  const strokeWidth = isSelected ? 3 : 2;
  
  const type = edge.arrowType ?? EdgeArrowType.Default;
  let markerStart, markerEnd;

  if (type !== EdgeArrowType.None) {
      markerEnd = isSelected ? 'url(#arrow-end-selected)' : 'url(#arrow-end)';
      if (type === EdgeArrowType.Bidirectional) {
          markerStart = isSelected ? 'url(#arrow-start-selected)' : 'url(#arrow-start)';
      }
  }

  return (
    <g 
        className="cursor-pointer edge-g" 
        onClick={(e) => {
            if (isEditing) return;
            onSelect(e, edge.id)
        }} 
        onDoubleClick={handleDoubleClick}
        style={{ pointerEvents: 'auto' }}
    >
      <path
        d={`M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`}
        stroke="transparent"
        strokeWidth="15"
        fill="none"
      />
      <path
        d={`M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        markerStart={markerStart}
        markerEnd={markerEnd}
      />
      
      {isEditing ? (
        <foreignObject x={midX - 50} y={midY - 15} width="100" height="30">
          <input
            ref={inputRef}
            type="text"
            value={label}
            onChange={handleLabelChange}
            onBlur={handleLabelUpdate}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
            className="w-full text-center text-sm bg-white border border-blue-500 rounded-md p-1"
          />
        </foreignObject>
      ) : edge.label && (
        <text
          x={midX}
          y={midY - 8}
          fill={strokeColor}
          fontSize="13"
          fontWeight="medium"
          textAnchor="middle"
          style={{paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: '3px', strokeLinecap: 'butt', strokeLinejoin: 'miter'}}
        >
          {edge.label}
        </text>
      )}

      {isSelected && (
        <>
          <circle 
            cx={startPoint.x} 
            cy={startPoint.y} 
            r="6" 
            fill="white" 
            stroke={strokeColor} 
            strokeWidth="2" 
            className="cursor-move"
            onMouseDown={(e) => onReconnectStart(e, edge.id, 'from')}
          />
          <circle 
            cx={endPoint.x} 
            cy={endPoint.y} 
            r="6" 
            fill="white" 
            stroke={strokeColor} 
            strokeWidth="2" 
            className="cursor-move" 
            onMouseDown={(e) => onReconnectStart(e, edge.id, 'to')}
          />
        </>
      )}
    </g>
  );
};
