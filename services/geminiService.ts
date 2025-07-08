
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FlowchartData, NodeType, Node, Edge, EdgeArrowType } from '../types';

const getApiKey = (): string | null => {
  // process.env.API_KEY is replaced at build time. If it's not defined, it will be `undefined`.
  if (process.env.API_KEY && process.env.API_KEY !== "") {
    return process.env.API_KEY;
  }
  return localStorage.getItem("gemini_api_key");
};

export const verifyApiKey = async (key: string): Promise<boolean> => {
    if (!key) return false;
    try {
        const ai = new GoogleGenAI({ apiKey: key });
        // Use a minimal request to check for authentication
        await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "test",
            config: { thinkingConfig: { thinkingBudget: 0 } } // fastest possible check
        });
        return true;
    } catch (e) {
        console.error("API Key verification failed", e);
        return false;
    }
};

const handleApiError = (error: unknown, context: string): never => {
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error("제공된 Gemini API 키가 유효하지 않습니다. 확인 후 다시 시도해주세요.");
        }
        console.error(`Failed to ${context}:`, error.message);
    } else {
        console.error(`An unknown error occurred during ${context}:`, error);
    }
    throw error;
};


const generationSystemInstruction = `You are a specialized AI that converts natural language descriptions into a specific JSON format representing a flowchart. Your ONLY output must be a single, valid JSON object that conforms to the schema below.

**Strict Output Requirements:**
- The output MUST be a raw, minified JSON object.
- **Language:** The \`text\` property of each node and the \`label\` property of each edge MUST be in **Korean**.
- DO NOT use markdown (like \`\`\`json\`).
- DO NOT include explanations, commentary, or any text outside the main JSON object.
- DO NOT include any non-JSON tokens or words (like "Messages") inside the JSON structure itself.
- Adhere strictly to the types specified in the schema.
- For all nodes, you MUST provide a \`position\` object. Arrange the nodes in a logical, top-to-bottom flow to create a readable initial layout. A simple column with an x-coordinate of around 400 is a good starting point. For example, place the first node at \`{"x": 400, "y": 100}\` and subsequent nodes with an incremented \`y\` value (e.g., \`{"x": 400, "y": 250}\`).

**JSON Schema:**
{
  "nodes": [
    {
      "id": "string (unique)",
      "text": "string (label, must be in Korean)",
      "type": "start-end" | "process" | "decision" | "io",
      "position": { "x": "number", "y": "number" }
    }
  ],
  "edges": [
    {
      "from": "string (must match a node.id)",
      "to": "string (must match a node.id)",
      "label": "string (optional, must be in Korean if present)",
      "arrowType": "default" | "bi-directional" | "none" (optional, defaults to 'default')
    }
  ]
}

**Example Interaction:**

User Prompt: "사용자가 로그인합니다. 성공하면 대시보드가 보이고, 실패하면 오류가 표시됩니다."

Your ONLY Response (example):
{"nodes":[{"id":"start","text":"시작","type":"start-end","position":{"x":400,"y":100}},{"id":"login","text":"사용자 로그인","type":"process","position":{"x":400,"y":250}},{"id":"check","text":"성공?","type":"decision","position":{"x":400,"y":400}},{"id":"dashboard","text":"대시보드 표시","type":"process","position":{"x":550,"y":550}},{"id":"error","text":"오류 표시","type":"process","position":{"x":250,"y":550}},{"id":"end","text":"종료","type":"start-end","position":{"x":400,"y":700}}],"edges":[{"from":"start","to":"login"},{"from":"login","to":"check"},{"from":"check","to":"dashboard","label":"예"},{"from":"check","to":"error","label":"아니오"},{"from":"dashboard","to":"end"},{"from":"error","to":"end"}]}

Now, process the user's request.`;


const editSystemInstruction = `You are a specialized AI that modifies a given flowchart JSON based on a user's instruction.

**Your Task:**
1.  You will be provided with a user's instruction and the current flowchart data in a specific JSON format.
2.  Your task is to apply the requested changes to the JSON data. This might involve adding, removing, or modifying nodes and edges.
3.  **Node and Edge Integrity:**
    *   **IDs:** All node IDs MUST remain unique. Keep existing IDs for unchanged nodes. Create new, simple, descriptive IDs for new nodes (e.g., "new_node_1").
    *   **Connections:** If you delete a node, you MUST also delete any edges connected to it. When adding a node between two others, re-wire the edges correctly.
4.  **Attribute Preservation:**
    *   **Existing Items:** You MUST preserve attributes (\`position\`, \`size\`, \`color\`, \`arrowType\`, etc.) of existing nodes and edges unless the user explicitly asks to change them.
    *   **New Nodes:** When adding a new node, you MUST include a \`position\` object (e.g., \`{"x": 100, "y": 100}\`). Do not add \`size\` or \`color\` to new nodes unless specified.
    *   **New Edges:** New edges should default to \`arrowType: 'default'\` unless otherwise specified.
5.  Your ONLY output must be the complete, modified, and valid flowchart JSON object.

**Strict Output Requirements:**
-   The output MUST be a raw, minified JSON object.
-   **Language:** When adding new nodes or edges, the \`text\` and \`label\` properties MUST be in **Korean**. Keep the language of existing items unless the user asks to change it.
-   DO NOT use markdown (like \`\`\`json\`).
-   DO NOT include explanations, commentary, or any text outside the main JSON object.
-   DO NOT include any non-JSON tokens or words (like "Messages") inside the JSON structure itself.
-   The output JSON must conform to the schema below.

**JSON Schema:**
{
  "nodes": [
    { "id": "string (unique)", "text": "string (label, must be in Korean)", "type": "start-end" | "process" | "decision" | "io", "position": { "x": "number", "y": "number" }, "size": { "width": "number", "height": "number" } (optional), "color": "string" (optional, hex code) }
  ],
  "edges": [
    { "from": "string (must match a node.id)", "to": "string (must match a node.id)", "label": "string (optional, must be in Korean if present)", "arrowType": "default" | "bi-directional" | "none" (optional, defaults to 'default') }
  ]
}

Now, process the user's request based on the a given flowchart.`;

const layoutSystemInstruction = `You are an expert AI flowchart layout algorithm. Your task is to take a given flowchart JSON and rearrange the positions of the nodes to create a clean, readable, and aesthetically pleasing layout.

**Core Principles for Layout:**
1.  **Logical Flow:** Arrange nodes to follow a logical path, typically top-to-bottom and left-to-right. The "Start" node should usually be at the top.
2.  **Minimize Edge Crossings:** Adjust node positions to prevent connection lines from crossing over each other as much as possible.
3.  **Even Spacing:** Distribute nodes evenly to avoid clustering and large empty areas. Maintain consistent vertical and horizontal spacing between nodes.
4.  **Alignment:** Align nodes that are at the same logical level, either horizontally or vertically.

**Strict Output Requirements:**
-   **DO NOT** add, remove, or modify any nodes or edges. The set of nodes and edges, their IDs, text, types, connections, \`size\`, \`color\`, and \`arrowType\` MUST remain exactly the same.
-   Your ONLY job is to update the \`position: { x: number; y: number }\` object for each node in the \`nodes\` array.
-   The output MUST be a raw, minified JSON object, identical in structure to the input, containing the complete \`nodes\` and \`edges\` arrays.
-   DO NOT use markdown (like \`\`\`json\`), explanations, or any other text outside the JSON object.
-   DO NOT include any non-JSON tokens or words (like "Messages") inside the JSON structure itself.

Now, process the provided flowchart JSON and return the newly laid-out version.`;

const analysisSystemInstruction = `You are an expert AI flowchart analyst. Your task is to analyze a given flowchart JSON for logical errors, potential issues, and areas for improvement.

**Analysis Checklist:**
1.  **Connectivity:**
    *   **Orphaned Nodes:** Are there any nodes (other than 'start-end' nodes) that have no incoming or outgoing edges?
    *   **Unreachable Nodes:** Can all nodes be reached from the 'start' node?
    *   **Dead Ends:** Do all paths eventually lead to an 'end' node? Are there process flows that just stop without a conclusion?
2.  **Decision Logic:**
    *   **Incomplete Decisions:** Does every 'decision' node have at least two outgoing edges, typically for "Yes" and "No" (or similar binary) cases? Report if a decision node has only one path out.
3.  **Best Practices:**
    *   **Efficiency:** Are there redundant steps or unnecessarily complex paths?
    *   **Clarity:** Is the purpose of each node and the overall flow clear?
    *   **Error Handling:** Are there potential failure points handled? For example, does an I/O operation have a path for failure?

**Strict Output Requirements:**
-   Your ONLY output must be a single, valid, minified JSON object.
-   The JSON object must have a single key "suggestions" which is an array of strings.
-   Each string in the array should be a concise, helpful suggestion for the user in Korean.
-   If no issues are found, return an empty suggestions array: \`{"suggestions": []}\`.
-   DO NOT use markdown (like \`\`\`json\`).
-   DO NOT include explanations or any text outside the main JSON object.

**Example Response (with issues found):**
{"suggestions":["결정 노드 'Successful?'에 'No' 경로에 대한 연결이 없습니다.","'Show Error' 노드에서 최종 'End' 노드로의 연결이 없습니다.","'Extra Step' 노드는 어떤 노드와도 연결되어 있지 않아 보입니다."]}

**Example Response (no issues found):**
{"suggestions":[]}

Now, analyze the provided flowchart JSON and return your suggestions.`;


const parseAndValidateFlowchartResponse = (response: GenerateContentResponse): FlowchartData | null => {
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }

    const firstBrace = jsonStr.indexOf('{');
    if (firstBrace === -1) {
        console.error("No opening brace '{' found in response text:", jsonStr);
        return null;
    }

    let braceCount = 0;
    let lastBrace = -1;
    for (let i = firstBrace; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') braceCount++;
        else if (jsonStr[i] === '}') braceCount--;
        if (braceCount === 0) {
            lastBrace = i;
            break;
        }
    }
    
    if (lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    
    // Sanitize by removing trailing commas
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

    try {
        const parsedData = JSON.parse(jsonStr);

        if (parsedData && Array.isArray(parsedData.nodes) && Array.isArray(parsedData.edges)) {
            const validNodeTypes = Object.values(NodeType);
            const validArrowTypes = Object.values(EdgeArrowType);
            
            const nodes: Node[] = parsedData.nodes.map((node: any): Node | null => {
                if (!node || typeof node !== 'object' ||
                    typeof node.id !== 'string' ||
                    typeof node.text !== 'string' ||
                    typeof node.type !== 'string' ||
                    !validNodeTypes.includes(node.type as NodeType) ||
                    !node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number'
                ) {
                    return null;
                }

                const validatedNode: Node = {
                    id: node.id,
                    text: node.text,
                    type: node.type,
                    position: node.position
                };

                if (node.color && typeof node.color === 'string') {
                    validatedNode.color = node.color;
                }
                if (node.size && typeof node.size.width === 'number' && typeof node.size.height === 'number') {
                    validatedNode.size = node.size;
                }

                return validatedNode;
            }).filter((node): node is Node => node !== null);

            const validNodeIds = new Set(nodes.map(n => n.id));

            const edges: Edge[] = parsedData.edges.map((edge: any, index: number): Edge | null => {
                if (!edge || typeof edge !== 'object' ||
                    typeof edge.from !== 'string' ||
                    typeof edge.to !== 'string' ||
                    !validNodeIds.has(edge.from) ||
                    !validNodeIds.has(edge.to)
                ) {
                    return null;
                }
                const validatedEdge: Edge = {
                    id: edge.id || `edge-${Date.now()}-${index}`,
                    from: edge.from,
                    to: edge.to,
                };
                if (edge.label && typeof edge.label === 'string') {
                    validatedEdge.label = edge.label;
                }
                if (edge.arrowType && validArrowTypes.includes(edge.arrowType as EdgeArrowType)) {
                    validatedEdge.arrowType = edge.arrowType;
                }
                return validatedEdge;
            }).filter((edge): edge is Edge => edge !== null);

            return { nodes, edges };
        }

        console.error("Parsed data is not in the expected format:", parsedData);
        return null;
    } catch (e) {
        console.error("Failed to parse JSON response:", e);
        console.error("Response text that was attempted for parsing:", jsonStr);
        return null;
    }
}


const parseAndValidateAnalysisResponse = (response: GenerateContentResponse): { suggestions: string[] } | null => {
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }

    const firstBrace = jsonStr.indexOf('{');
    if (firstBrace === -1) {
        console.error("No opening brace '{' found in analysis response text:", jsonStr);
        return null;
    }

    let braceCount = 0;
    let lastBrace = -1;
    for (let i = firstBrace; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') braceCount++;
        else if (jsonStr[i] === '}') braceCount--;
        if (braceCount === 0) {
            lastBrace = i;
            break;
        }
    }

    if (lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    
    // Sanitize by removing trailing commas
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

    try {
        const parsedData = JSON.parse(jsonStr);

        if (parsedData && Array.isArray(parsedData.suggestions)) {
             const suggestions: string[] = parsedData.suggestions.filter((s: any): s is string => typeof s === 'string');
             return { suggestions };
        }

        console.error("Parsed analysis data is not in the expected format:", parsedData);
        return null;
    } catch (e) {
        console.error("Failed to parse JSON response for analysis:", e);
        console.error("Response text that was attempted for parsing:", jsonStr);
        return null;
    }
}


export const generateFlowchartFromText = async (description: string): Promise<FlowchartData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API 키가 설정되지 않았습니다. 사이드바에서 키를 입력하고 저장해주세요.");
    }
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: description,
            config: {
                systemInstruction: generationSystemInstruction,
                responseMimeType: "application/json",
            },
        });
        
        return parseAndValidateFlowchartResponse(response);

    } catch (error) {
        handleApiError(error, 'generate flowchart');
    }
};

export const editFlowchartWithText = async (description: string, currentFlowchart: FlowchartData): Promise<FlowchartData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API 키가 설정되지 않았습니다. 사이드바에서 키를 입력하고 저장해주세요.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const userPrompt = `Instruction: "${description}"\n\nCurrent Flowchart JSON: ${JSON.stringify(currentFlowchart)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: editSystemInstruction,
                responseMimeType: "application/json",
            },
        });

        return parseAndValidateFlowchartResponse(response);

    } catch (error) {
        handleApiError(error, 'edit flowchart');
    }
};

export const layoutFlowchart = async (currentFlowchart: FlowchartData): Promise<FlowchartData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API 키가 설정되지 않았습니다. 사이드바에서 키를 입력하고 저장해주세요.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const userPrompt = `Current Flowchart JSON: ${JSON.stringify(currentFlowchart)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: layoutSystemInstruction,
                responseMimeType: "application/json",
            },
        });

        return parseAndValidateFlowchartResponse(response);

    } catch (error) {
        handleApiError(error, 'layout flowchart');
    }
};

export const analyzeFlowchart = async (currentFlowchart: FlowchartData): Promise<{ suggestions: string[] } | null> => {
    if (currentFlowchart.nodes.length === 0) {
        return { suggestions: ["분석할 플로우차트가 없습니다."] };
    }
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API 키가 설정되지 않았습니다. 사이드바에서 키를 입력하고 저장해주세요.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const userPrompt = `Flowchart to analyze: ${JSON.stringify(currentFlowchart)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: analysisSystemInstruction,
                responseMimeType: "application/json",
            },
        });

        return parseAndValidateAnalysisResponse(response);

    } catch (error) {
        handleApiError(error, 'analyze flowchart');
    }
};
