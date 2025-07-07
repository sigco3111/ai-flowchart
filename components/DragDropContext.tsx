import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

type DraggableCallback = (delta: { x: number; y: number }) => void;
type DroppableCallback = (e: React.DragEvent<HTMLDivElement>) => void;

interface DragDropContextType {
  registerDraggable: (ref: React.RefObject<HTMLDivElement>, onDragEnd: DraggableCallback, shouldStartDrag?: (e: MouseEvent) => boolean) => () => void;
  registerDroppable: (ref: React.RefObject<HTMLDivElement>, onDrop: DroppableCallback) => () => void;
  startSidebarDrag: (type: string) => void;
  clearSidebarDragData: () => void;
  getSidebarDragData: () => string | null;
}

const DndContext = createContext<DragDropContextType | null>(null);

export const useDragDrop = () => {
  const context = useContext(DndContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};

export const DragDropContext: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [draggingElement, setDraggingElement] = useState<{
    element: HTMLDivElement;
    startPosition: { x: number; y: number };
    callback: DraggableCallback;
  } | null>(null);
  
  const sidebarDragData = useRef<string | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingElement) return;
    e.preventDefault();

    const deltaX = e.clientX - draggingElement.startPosition.x;
    const deltaY = e.clientY - draggingElement.startPosition.y;

    draggingElement.element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    draggingElement.element.style.zIndex = '1000';
  }, [draggingElement]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!draggingElement) return;
    e.preventDefault();

    const deltaX = e.clientX - draggingElement.startPosition.x;
    const deltaY = e.clientY - draggingElement.startPosition.y;

    draggingElement.element.style.transform = '';
    draggingElement.element.style.zIndex = '';
    draggingElement.callback({ x: deltaX, y: deltaY });
    
    setDraggingElement(null);
  }, [draggingElement]);

  React.useEffect(() => {
    if (draggingElement) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingElement, handleMouseMove, handleMouseUp]);

  const registerDraggable = useCallback((ref: React.RefObject<HTMLDivElement>, onDragEnd: DraggableCallback, shouldStartDrag?: (e: MouseEvent) => boolean) => {
    const element = ref.current;
    if (!element) return () => {};

    const handleMouseDown = (e: MouseEvent) => {
      if (shouldStartDrag && !shouldStartDrag(e)) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();

      setDraggingElement({
        element,
        startPosition: { x: e.clientX, y: e.clientY },
        callback: onDragEnd,
      });
    };

    element.addEventListener('mousedown', handleMouseDown);

    return () => {
        if(element) element.removeEventListener('mousedown', handleMouseDown);
    }
  }, []);

  const registerDroppable = useCallback((ref: React.RefObject<HTMLDivElement>, onDrop: DroppableCallback) => {
    const element = ref.current;
    if (!element) return () => {};

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      onDrop(e as unknown as React.DragEvent<HTMLDivElement>);
    };

    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);

    return () => {
      if(element) {
        element.removeEventListener('dragover', handleDragOver);
        element.removeEventListener('drop', handleDrop);
      }
    }
  }, []);

  const startSidebarDrag = useCallback((type: string) => {
    sidebarDragData.current = type;
  }, []);

  const clearSidebarDragData = useCallback(() => {
    sidebarDragData.current = null;
  }, []);
  
  const getSidebarDragData = useCallback(() => {
      return sidebarDragData.current;
  }, []);

  const value = { 
      registerDraggable, 
      registerDroppable,
      startSidebarDrag,
      clearSidebarDragData,
      getSidebarDragData
    };

  return (
    <DndContext.Provider value={value}>
      {children}
    </DndContext.Provider>
  );
};