export enum NodeType {
  StartEnd = 'start-end',
  Process = 'process',
  Decision = 'decision',
  Io = 'io',
}

export enum EdgeArrowType {
  Default = 'default',
  Bidirectional = 'bi-directional',
  None = 'none',
}

export interface Node {
  id: string;
  type: NodeType;
  text: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  color?: string;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  label?: string;
  arrowType?: EdgeArrowType;
}

export interface FlowchartData {
    nodes: Node[];
    edges: Edge[];
}
