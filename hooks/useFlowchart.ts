import React, { useState, useCallback } from 'react';
import { Node, Edge, NodeType, FlowchartData, EdgeArrowType } from '../types';
import { layoutFlowchart as performAutoLayout, analyzeFlowchart as performAnalysis } from '../services/geminiService';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export interface Selection {
  nodes: string[];
  edges: string[];
}

const initialSelection: Selection = { nodes: [], edges: [] };

export const useFlowchart = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selection, setSelection] = useState<Selection>(initialSelection);
  
  const [history, setHistory] = useState<FlowchartData[]>([]);
  const [future, setFuture] = useState<FlowchartData[]>([]);
  const [isLayoutLoading, setIsLayoutLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<string[] | null>(null);


  const canUndo = history.length > 0;
  const canRedo = future.length > 0;

  const pushToHistory = useCallback((currentState?: {nodes: Node[], edges: Edge[]}) => {
    setHistory(h => [...h, currentState || { nodes, edges }]);
    setFuture([]);
  }, [nodes, edges]);

  const addNode = useCallback((type: NodeType, position: { x: number; y: number }) => {
    pushToHistory();
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      text: '새 노드',
      position,
    };
    setNodes((currentNodes) => [...currentNodes, newNode]);
    setAnalysisResults(null);
  }, [pushToHistory]);
  
  const updateNodePosition = useCallback((nodeId: string, position: { x: number, y: number }) => {
    setNodes(currentNodes =>
      currentNodes.map(node =>
        node.id === nodeId ? { ...node, position } : node
      )
    );
     setAnalysisResults(null);
  }, []);

  const updateMultiNodePositions = useCallback((nodeIds: string[], delta: { x: number, y: number }) => {
    if (nodeIds.length === 0) return;
    const nodeIdsSet = new Set(nodeIds);
    setNodes(currentNodes => 
        currentNodes.map(node => {
            if (nodeIdsSet.has(node.id)) {
                return {
                    ...node,
                    position: {
                        x: Math.max(0, node.position.x + delta.x),
                        y: Math.max(0, node.position.y + delta.y)
                    }
                };
            }
            return node;
        })
    );
    setAnalysisResults(null);
  }, []);

  const updateNodeText = useCallback((id:string, text: string) => {
    pushToHistory();
    setNodes((currentNodes) => 
        currentNodes.map((node) => (node.id === id ? { ...node, text } : node))
    );
    setAnalysisResults(null);
  }, [pushToHistory]);
  
  const updateNodeColor = useCallback((nodeId: string, color: string) => {
    pushToHistory();
    setNodes(currentNodes => 
        currentNodes.map(node => node.id === nodeId ? {...node, color: color || undefined } : node)
    );
  }, [pushToHistory]);

  const updateNodeSize = useCallback((nodeId: string, size: { width: number, height: number }, position: {x: number, y: number}) => {
    setNodes(currentNodes =>
      currentNodes.map(node => 
        node.id === nodeId ? {...node, size, position} : node
      )
    );
  }, []);

  const connectNodes = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return; // Cannot connect to self
    
    const edgeExists = edges.some(edge => (edge.from === fromId && edge.to === toId));
    if(edgeExists) return;

    pushToHistory();
    const newEdge: Edge = {
      id: `edge-${Date.now()}`,
      from: fromId,
      to: toId,
    };
    setEdges((currentEdges) => [...currentEdges, newEdge]);
    setAnalysisResults(null);
  }, [edges, pushToHistory]);

  const updateEdgeLabel = useCallback((edgeId: string, label: string) => {
    pushToHistory();
    setEdges(currentEdges =>
      currentEdges.map(edge =>
        edge.id === edgeId ? { ...edge, label } : edge
      )
    );
  }, [pushToHistory]);
  
  const updateEdgeConnection = useCallback((edgeId: string, connection: { from?: string, to?: string }) => {
    pushToHistory();
    setEdges(currentEdges =>
      currentEdges.map(edge =>
        edge.id === edgeId ? { ...edge, ...connection } : edge
      )
    );
    setAnalysisResults(null);
  }, [pushToHistory]);

  const flipEdgeDirection = useCallback((edgeId: string) => {
    pushToHistory();
    setEdges(currentEdges =>
        currentEdges.map(edge =>
            edge.id === edgeId ? { ...edge, from: edge.to, to: edge.from } : edge
        )
    );
    setAnalysisResults(null);
  }, [pushToHistory]);


  const updateEdgeArrowType = useCallback((edgeId: string, arrowType: EdgeArrowType) => {
    pushToHistory();
    setEdges(currentEdges =>
      currentEdges.map(edge =>
        edge.id === edgeId ? { ...edge, arrowType } : edge
      )
    );
  }, [pushToHistory]);

  const deleteSelected = useCallback(() => {
    if (selection.nodes.length === 0 && selection.edges.length === 0) return;
    
    pushToHistory({ nodes, edges });

    const selectedNodeIds = new Set(selection.nodes);
    const selectedEdgeIds = new Set(selection.edges);

    setNodes(currentNodes => currentNodes.filter(n => !selectedNodeIds.has(n.id)));
    setEdges(currentEdges => currentEdges.filter(e => 
        !selectedEdgeIds.has(e.id) &&
        !selectedNodeIds.has(e.from) &&
        !selectedNodeIds.has(e.to)
    ));
    
    setSelection(initialSelection);
    setAnalysisResults(null);
  }, [selection, nodes, edges, pushToHistory]);

  const loadFlowchart = useCallback((data: FlowchartData) => {
    pushToHistory();
    setNodes(data.nodes);
    setEdges(data.edges);
    setSelection(initialSelection);
    setAnalysisResults(null);
  }, [pushToHistory]);

  const clearFlowchart = useCallback(() => {
    if (nodes.length === 0 && edges.length === 0) return;
    pushToHistory();
    setNodes([]);
    setEdges([]);
    setSelection(initialSelection);
    setAnalysisResults(null);
  }, [nodes, edges, pushToHistory]);
  
  const autoLayout = useCallback(async () => {
    if (nodes.length < 2) return;
    
    setIsLayoutLoading(true);
    setAnalysisResults(null);
    try {
        const currentState = {nodes, edges};
        const newLayout = await performAutoLayout(currentState);
        if (newLayout && newLayout.nodes.length === nodes.length) {
            pushToHistory(currentState);
            setNodes(newLayout.nodes);
            setEdges(newLayout.edges || edges);
        } else {
            console.error("Auto-layout failed or returned invalid data.");
        }
    } catch (e) {
        console.error("Error during auto-layout:", e);
    } finally {
        setIsLayoutLoading(false);
    }
}, [nodes, edges, pushToHistory]);

  const analyzeCurrentFlowchart = useCallback(async () => {
    if (nodes.length < 1) return;
    
    setIsAnalyzing(true);
    setAnalysisResults(null);
    try {
        const result = await performAnalysis({ nodes, edges });
        if (result && result.suggestions) {
            setAnalysisResults(result.suggestions);
        } else {
            setAnalysisResults(["오류: 분석 결과를 가져오지 못했습니다."]);
        }
    } catch (e) {
        console.error("Error during flowchart analysis:", e);
        setAnalysisResults(["오류: 분석 중 문제가 발생했습니다."]);
    } finally {
        setIsAnalyzing(false);
    }
  }, [nodes, edges]);

  const clearAnalysisResults = useCallback(() => {
    setAnalysisResults(null);
  }, []);

  const undo = useCallback(() => {
    if (!canUndo) return;
    const previousState = history[history.length - 1];
    setFuture(f => [{ nodes, edges }, ...f]);
    setHistory(h => h.slice(0, h.length - 1));
    setNodes(previousState.nodes);
    setEdges(previousState.edges);
    setSelection(initialSelection);
    setAnalysisResults(null);
  }, [canUndo, history, nodes, edges]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const nextState = future[0];
    setHistory(h => [...h, { nodes, edges }]);
    setFuture(f => f.slice(1));
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
    setSelection(initialSelection);
    setAnalysisResults(null);
  }, [canRedo, future, nodes, edges]);


  return {
    nodes,
    edges,
    selection,
    setSelection,
    addNode,
    updateNodePosition,
    updateMultiNodePositions,
    updateNodeText,
    updateNodeColor,
    updateNodeSize,
    connectNodes,
    updateEdgeLabel,
    updateEdgeConnection,
    flipEdgeDirection,
    updateEdgeArrowType,
    deleteSelected,
    loadFlowchart,
    clearFlowchart,
    pushToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    autoLayout,
    isLayoutLoading,
    analyzeCurrentFlowchart,
    isAnalyzing,
    analysisResults,
    clearAnalysisResults,
  };
};

export type UseFlowchartReturn = ReturnType<typeof useFlowchart>;