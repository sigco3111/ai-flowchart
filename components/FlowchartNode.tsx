import React, { useState, useRef, useEffect } from 'react';
import { Node, NodeType } from '../types';

interface FlowchartNodeProps {
  node: Node;
  isSelected: boolean;
  isEditing: boolean;
  isConnectionTarget: boolean;
  onNodeMouseDown: (e: React.MouseEvent, id: string) => void;
  onResizeHandleMouseDown: (e: React.MouseEvent, id: string) => void;
  onNodeClick: (e: React.MouseEvent, id: string) => void;
  onNodeDoubleClick: (id: string) => void;
  onTextUpdate: (id: string, text: string) => void;
  onConnectStart: (e: React.MouseEvent, id: string) => void;
}

const nodeStyles: Record<NodeType, string> = {
  [NodeType.StartEnd]: 'rounded-full bg-green-200 border-green-400',
  [NodeType.Process]: 'rounded-md bg-blue-200 border-blue-400',
  [NodeType.Decision]: 'transform rotate-45 bg-yellow-200 border-yellow-400',
  [NodeType.Io]: 'transform -skew-x-12 bg-purple-200 border-purple-400',
};

const MIN_WIDTH = 80;
const MIN_HEIGHT = 40;

const darkenColor = (hex: string, amount: number): string => {
    let color = hex.startsWith('#') ? hex.slice(1) : hex;
    if (color.length === 3) {
      color = color.split('').map(c => c + c).join('');
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) - amount;
    let g = ((num >> 8) & 0x00FF) - amount;
    let b = (num & 0x0000FF) - amount;

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
}

export const FlowchartNode: React.FC<FlowchartNodeProps> = ({
  node,
  isSelected,
  isEditing,
  isConnectionTarget,
  onNodeMouseDown,
  onResizeHandleMouseDown,
  onNodeClick,
  onNodeDoubleClick,
  onTextUpdate,
  onConnectStart,
}) => {
  const [text, setText] = useState(node.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(node.text);
  }, [node.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
    }
  }, [isEditing]);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleTextBlur = () => {
    onTextUpdate(node.id, text);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleTextBlur();
    }
     if (e.key === 'Escape') {
      setText(node.text);
      onTextUpdate(node.id, node.text);
    }
  };
  
  const nodeBaseClasses = 'absolute flex items-center justify-center p-2 border-2 transition-shadow duration-150 shadow-md hover:shadow-lg';
  let selectedClasses = isSelected ? 'ring-4 ring-offset-2 ring-blue-500 ' : 'hover:ring-2 hover:ring-blue-300 ';
  if(isConnectionTarget) {
      selectedClasses += 'ring-4 ring-green-400 ';
  }

  const defaultWidth = node.type === NodeType.Decision ? 120 : 150;
  const defaultHeight = node.type === NodeType.Decision ? 120 : 60;
  const width = node.size?.width ?? defaultWidth;
  const height = node.size?.height ?? defaultHeight;

  const nodeStyle: React.CSSProperties = {
    left: `${node.position.x}px`,
    top: `${node.position.y}px`,
    width: `${width}px`,
    height: `${height}px`,
  };

  if (node.color) {
      nodeStyle.backgroundColor = node.color;
      nodeStyle.borderColor = darkenColor(node.color, 30);
  }

  return (
    <div
      id={node.id}
      className={`flowchart-node ${nodeBaseClasses} ${node.color ? '' : nodeStyles[node.type]} ${selectedClasses}`}
      style={nodeStyle}
      onMouseDown={(e) => onNodeMouseDown(e, node.id)}
      onClick={(e) => onNodeClick(e, node.id)}
      onDoubleClick={() => onNodeDoubleClick(node.id)}
    >
      <div
        className={`w-full h-full flex items-center justify-center text-center text-sm font-medium text-gray-800 ${node.type === NodeType.Decision ? '-rotate-45' : ''} ${node.type === NodeType.Io ? 'skew-x-12' : ''}`}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full bg-transparent text-center border-none focus:ring-0 resize-none p-1"
          />
        ) : (
          <span className="px-2 break-words select-none">{node.text}</span>
        )}
      </div>
       {isSelected && (
        <>
          <div 
            className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-pointer border-2 border-white hover:scale-125 transition-transform"
            onMouseDown={(e) => onConnectStart(e, node.id)}
            title="노드 연결하기"
          />
          <div
            className="absolute -right-1.5 -bottom-1.5 w-4 h-4 bg-white border-2 border-blue-500 rounded-sm cursor-se-resize hover:bg-blue-100"
            onMouseDown={(e) => onResizeHandleMouseDown(e, node.id)}
            title="크기 조절"
          />
        </>
      )}
    </div>
  );
};
