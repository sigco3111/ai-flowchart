
import React, { useState, useEffect } from 'react';
import { NodeType, EdgeArrowType } from '../types';
import { UseFlowchartReturn } from '../hooks/useFlowchart';
import { StartEndIcon, ProcessIcon, DecisionIcon, IoIcon, LightbulbIcon, CloseIcon, ColorPickerIcon, TrashIcon, ArrowRightIcon, ArrowLeftRightIcon, LineIcon, SwitchArrowsIcon, EyeIcon, EyeOffIcon } from './icons';
import { generateFlowchartFromText, editFlowchartWithText } from '../services/geminiService';
import { useDragDrop } from './DragDropContext';

const NodeButton = ({ icon, label, type, onDragStart, onDragEnd }: { icon: React.ReactNode; label: string; type: NodeType, onDragStart: (e: React.DragEvent<HTMLButtonElement>) => void, onDragEnd: (e: React.DragEvent<HTMLButtonElement>) => void }) => (
  <button
    draggable
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    data-node-type={type}
    className="flex flex-col items-center justify-center p-3 space-y-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-grab"
  >
    {icon}
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </button>
);

const defaultColors: string[] = ['#fecaca', '#fed7aa', '#fef08a', '#d9f99d', '#bfdbfe', '#e9d5ff', '#fbcfe8', '#e5e7eb'];

const arrowTypes = [
    { type: EdgeArrowType.Default, icon: <ArrowRightIcon className="w-5 h-5" />, label: '단방향' },
    { type: EdgeArrowType.Bidirectional, icon: <ArrowLeftRightIcon className="w-5 h-5" />, label: '양방향' },
    { type: EdgeArrowType.None, icon: <LineIcon className="w-5 h-5" />, label: '선만' },
];

const ApiKeyManager: React.FC<{
    isHardcoded: boolean;
    isValid: boolean;
    isVerifying: boolean;
    onSave: (key: string) => Promise<void>;
}> = ({ isHardcoded, isValid, isVerifying, onSave }) => {
    const [localKey, setLocalKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        if (!isHardcoded) {
            setLocalKey(localStorage.getItem('gemini_api_key') || '');
        }
    }, [isHardcoded]);

    const handleSave = () => {
        if (isHardcoded) return;
        onSave(localKey);
    };

    const StatusIndicator = () => {
        if (isHardcoded) {
            return <div className="flex items-center space-x-2 text-sm text-green-700" title="API 키가 환경 변수에 안전하게 설정되었습니다.">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                <span>활성 (보안 설정됨)</span>
            </div>
        }
        if (isVerifying) {
            return <div className="flex items-center space-x-2 text-sm text-yellow-700">
                 <svg className="animate-spin h-4 w-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>확인 중...</span>
            </div>
        }
        if (isValid) {
             return <div className="flex items-center space-x-2 text-sm text-green-700">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                <span>활성</span>
            </div>
        }
        return <div className="flex items-center space-x-2 text-sm text-red-700">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            <span>비활성 또는 없음</span>
        </div>
    };

    return (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-semibold text-gray-800">Gemini API 키</h3>
                <StatusIndicator />
            </div>
            <div className="space-y-3">
                {isHardcoded && (
                     <div className="text-xs text-orange-800 bg-orange-100 p-2 rounded-md border border-orange-200">
                        <p className="font-semibold">환경 변수 키 사용 중</p>
                        <p>애플리케이션에 API 키가 내장되어 있어 우선적으로 사용됩니다. 아래 입력란은 비활성화됩니다.</p>
                    </div>
                )}
                <p className="text-xs text-gray-500">API 키는 브라우저의 로컬 스토리지에만 저장됩니다.</p>
                <div className="relative">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={isHardcoded ? '••••••••••••••••••••• (보안 설정됨)' : localKey}
                        onChange={(e) => setLocalKey(e.target.value)}
                        placeholder="Gemini API 키를 여기에 붙여넣으세요"
                        className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm disabled:bg-gray-200 disabled:cursor-not-allowed"
                        disabled={isVerifying || isHardcoded}
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                        title={showKey ? '키 숨기기' : '키 보기'}
                        disabled={isHardcoded}
                    >
                        {showKey ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isVerifying || isHardcoded}
                    className="w-full bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center text-sm"
                >
                     {isVerifying && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                     )}
                    {isVerifying ? '저장 중...' : '키 저장 및 확인'}
                </button>
            </div>
        </div>
    );
};

interface SidebarProps extends UseFlowchartReturn {
    isApiKeyHardcoded: boolean;
    isApiKeyValid: boolean;
    isVerifyingKey: boolean;
    onSaveApiKey: (key: string) => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    nodes, 
    edges, 
    selection,
    loadFlowchart, 
    clearFlowchart,
    analyzeCurrentFlowchart,
    isAnalyzing,
    analysisResults,
    clearAnalysisResults,
    updateNodeColor,
    updateEdgeArrowType,
    flipEdgeDirection,
    deleteSelected,
    isApiKeyHardcoded,
    isApiKeyValid,
    isVerifyingKey,
    onSaveApiKey
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { startSidebarDrag, clearSidebarDragData } = useDragDrop();

  const isEditing = nodes.length > 0;
  const selectedNode = selection.nodes.length === 1 ? nodes.find(n => n.id === selection.nodes[0]) : null;
  const selectedEdge = selection.edges.length === 1 ? edges.find(e => e.id === selection.edges[0]) : null;
  const isCustomColor = selectedNode && selectedNode.color && !defaultColors.includes(selectedNode.color);


  const handleAiAction = async () => {
    if (!isApiKeyValid) {
      setError('Gemini API 키가 유효하지 않습니다. 사이드바에서 키를 설정해주세요.');
      return;
    }
    if (!prompt.trim()) {
      setError(isEditing ? '수정할 내용을 입력해주세요.' : '플로우차트로 변환할 설명을 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);
    clearAnalysisResults();
    try {
      let flowchartData;
      if (isEditing) {
        const currentFlowchart = { nodes, edges };
        flowchartData = await editFlowchartWithText(prompt, currentFlowchart);
      } else {
        flowchartData = await generateFlowchartFromText(prompt);
      }

      if(flowchartData) {
        loadFlowchart(flowchartData);
      } else {
         setError('AI가 유효한 플로우차트 데이터를 생성하지 못했습니다. 다시 시도해 주세요.');
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    const nodeType = e.currentTarget.getAttribute('data-node-type');
    if (nodeType) {
        startSidebarDrag(nodeType);
        e.dataTransfer.effectAllowed = 'copy';
    }
  };
  
  const handleDragEnd = () => {
    clearSidebarDragData();
  };


  return (
    <aside className="w-80 flex-shrink-0 bg-white h-full p-5 flex flex-col shadow-lg border-r border-gray-200 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">AI 플로우차트 도우미</h2>
      <div className="flex flex-col space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">
          {isEditing
            ? '수정하고 싶은 내용을 설명하면 AI가 다이어그램을 업데이트합니다.'
            : '플로우차트에 대한 설명을 입력하면 AI가 자동으로 다이어그램을 생성해줍니다.'
          }
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            isEditing
              ? "예: '로그인' 다음에 '2단계 인증' 단계를 추가해줘."
              : "예: 사용자가 로그인하면, 성공 시 대시보드로 이동하고 실패 시 에러 메시지를 보여준다."
          }
          className="w-full h-32 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          disabled={isLoading || isAnalyzing || isVerifyingKey}
        />
        <button
          onClick={handleAiAction}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors duration-200 flex items-center justify-center"
          disabled={isLoading || isAnalyzing || isVerifyingKey || !isApiKeyValid}
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          {isLoading ? (isEditing ? '수정 중...' : '생성 중...') : (isEditing ? '수정하기' : '생성하기')}
        </button>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      <div className="mt-6">
          <button
            onClick={analyzeCurrentFlowchart}
            className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            disabled={isLoading || isAnalyzing || nodes.length === 0 || isVerifyingKey || !isApiKeyValid}
          >
            {isAnalyzing ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
                <LightbulbIcon className="mr-2 h-5 w-5" />
            )}
            <span className="font-semibold">{isAnalyzing ? '분석 중...' : '플로우차트 분석'}</span>
          </button>
      </div>

      {analysisResults && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg animate-fade-in">
            <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }`}</style>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-semibold text-yellow-800 flex items-center">
                    <LightbulbIcon className="w-5 h-5 mr-2 text-yellow-600"/>
                    AI 분석 및 제안
                </h3>
                <button onClick={clearAnalysisResults} className="text-yellow-500 hover:text-yellow-700" title="결과 닫기">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="border-t border-yellow-200 my-2"></div>
            {analysisResults.length > 0 ? (
                <ul className="space-y-2.5 pl-1">
                    {analysisResults.map((suggestion, index) => (
                        <li key={index} className="flex items-start text-sm text-yellow-900">
                           <svg className="w-4 h-4 mr-2.5 mt-0.5 flex-shrink-0 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                           <span>{suggestion}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-yellow-900 text-center py-2">
                    분석 결과, 특별한 문제점을 찾지 못했습니다. 좋은 플로우차트입니다! 👍
                </p>
            )}
        </div>
      )}

      {selectedNode && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-md font-semibold text-gray-800 mb-3">노드 속성</h3>
              <div className="space-y-3">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                          노드 색상
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                          {defaultColors.map(color => (
                              <button
                                key={color}
                                onClick={() => updateNodeColor(selectedNode.id, color)}
                                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${selectedNode.color === color ? 'border-blue-500 ring-2 ring-blue-500' : 'border-white'}`}
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                          ))}
                          <label 
                            className={`relative w-7 h-7 rounded-full border-2 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${isCustomColor ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'}`}
                            title="사용자 정의 색상"
                            style={{ backgroundColor: isCustomColor ? selectedNode.color : '#FFFFFF' }}
                          >
                              {!isCustomColor && <ColorPickerIcon className="w-4 h-4 text-gray-500" />}
                              <input
                                type="color"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                value={selectedNode?.color || '#ffffff'}
                                onChange={(e) => {
                                    if (selectedNode) {
                                        updateNodeColor(selectedNode.id, e.target.value);
                                    }
                                }}
                              />
                          </label>
                          <button
                              onClick={() => updateNodeColor(selectedNode.id, '')}
                              className={`w-7 h-7 rounded-full border bg-white flex items-center justify-center transition-transform hover:scale-110 ${!selectedNode.color ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'}`}
                              title="기본 색상으로 리셋"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                      </div>
                  </div>
              </div>
               <div className="mt-4 border-t border-gray-200 pt-4">
                  <button
                    onClick={deleteSelected}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-red-300 rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    title="노드 삭제"
                  >
                    <TrashIcon className="w-5 h-5" />
                    <span>노드 삭제</span>
                  </button>
              </div>
          </div>
      )}

      {selectedEdge && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-md font-semibold text-gray-800 mb-3">연결선 속성</h3>
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">화살표 스타일</label>
                      <div className="flex items-center rounded-md border border-gray-300 overflow-hidden">
                          {arrowTypes.map(({ type, icon, label }) => (
                              <button
                                  key={type}
                                  title={label}
                                  onClick={() => updateEdgeArrowType(selectedEdge.id, type)}
                                  className={`flex-1 p-2 text-sm flex items-center justify-center space-x-1.5 transition-colors focus:z-10 focus:ring-2 focus:ring-blue-500 ${
                                      (selectedEdge.arrowType ?? EdgeArrowType.Default) === type
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white hover:bg-gray-100 text-gray-600'
                                  }`}
                              >
                                  {icon}
                                  <span className="hidden sm:inline">{label}</span>
                              </button>
                          ))}
                      </div>
                  </div>
                   <div>
                      <button
                          onClick={() => flipEdgeDirection(selectedEdge.id)}
                          className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-100 transition-colors"
                          title="방향 전환"
                      >
                          <SwitchArrowsIcon className="w-5 h-5 text-gray-600" />
                          <span>방향 전환</span>
                      </button>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                      <button
                          onClick={deleteSelected}
                          className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-red-300 rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                          title="연결선 삭제"
                      >
                          <TrashIcon className="w-5 h-5" />
                          <span>연결선 삭제</span>
                      </button>
                  </div>
              </div>
          </div>
      )}


      <h2 className="text-lg font-semibold mt-8 mb-4 text-gray-800">노드 추가하기</h2>
      <p className="text-sm text-gray-600 mb-4">노드를 캔버스로 드래그하세요.</p>
      <div className="grid grid-cols-2 gap-4">
        <NodeButton icon={<StartEndIcon />} label="시작/종료" type={NodeType.StartEnd} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
        <NodeButton icon={<ProcessIcon />} label="프로세스" type={NodeType.Process} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
        <NodeButton icon={<DecisionIcon />} label="결정" type={NodeType.Decision} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
        <NodeButton icon={<IoIcon />} label="입력/출력" type={NodeType.Io} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
      </div>

       <div className="mt-auto pt-8 space-y-4">
        <ApiKeyManager
            isHardcoded={isApiKeyHardcoded}
            isValid={isApiKeyValid}
            isVerifying={isVerifyingKey}
            onSave={onSaveApiKey}
        />
         <button
          onClick={clearFlowchart}
          className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-md hover:bg-red-600 transition-colors duration-200"
        >
          캔버스 비우기
        </button>
      </div>
    </aside>
  );
};
