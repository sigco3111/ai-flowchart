
import React, { useEffect, useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { useFlowchart } from './hooks/useFlowchart';
import { DragDropContext } from './components/DragDropContext';
import { UndoIcon, RedoIcon, AutoLayoutIcon, SaveIcon, LoadIcon, ExportIcon } from './components/icons';
import { FlowchartData } from './types';
import { verifyApiKey } from './services/geminiService';


const saveFlowchartToFile = (flowchartData: FlowchartData) => {
  const dataStr = JSON.stringify(flowchartData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flowchart.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const loadFlowchartFromFile = (
    onLoad: (data: FlowchartData) => void,
    onError: (message: string) => void
) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result;
                if (typeof text !== 'string') {
                    throw new Error('파일을 읽을 수 없습니다.');
                }
                const data = JSON.parse(text);
                if (data && Array.isArray(data.nodes) && Array.isArray(data.edges)) {
                    onLoad(data as FlowchartData);
                } else {
                    throw new Error('유효하지 않은 플로우차트 파일 형식입니다.');
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : '파일을 파싱하는 중 오류가 발생했습니다.';
                onError(message);
            }
        };
        reader.onerror = () => {
            onError('파일을 읽는 중 오류가 발생했습니다.');
        };
        reader.readAsText(file);
    };
    input.click();
};


const App: React.FC = () => {
  const flowchart = useFlowchart();
  const { undo, redo, canUndo, canRedo, autoLayout, isLayoutLoading, nodes, edges, loadFlowchart } = flowchart;
  
  const [exportRequest, setExportRequest] = useState<{ format: 'png' | 'svg' | 'pdf', timestamp: number } | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(false);
  const [isVerifyingKey, setIsVerifyingKey] = useState<boolean>(false);
  const [isApiKeyHardcoded] = useState(!!(process.env.API_KEY && process.env.API_KEY !== ""));


  useEffect(() => {
    if (isApiKeyHardcoded) {
        setIsApiKeyValid(true);
        return;
    }

    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
        setIsVerifyingKey(true);
        verifyApiKey(storedKey).then(isValid => {
            setIsApiKeyValid(isValid);
            setIsVerifyingKey(false);
            if (!isValid) {
                alert("저장된 API 키가 더 이상 유효하지 않습니다. 새 키를 입력해주세요.");
                localStorage.removeItem('gemini_api_key');
            }
        });
    }
  }, [isApiKeyHardcoded]);

  const handleSaveApiKey = async (newKey: string) => {
    if (!newKey) {
        localStorage.removeItem('gemini_api_key');
        setIsApiKeyValid(false);
        alert('API 키가 제거되었습니다.');
        return;
    }
    setIsVerifyingKey(true);
    const isValid = await verifyApiKey(newKey);
    setIsApiKeyValid(isValid);
    if (isValid) {
        localStorage.setItem('gemini_api_key', newKey);
        alert('API 키가 성공적으로 확인 및 저장되었습니다.');
    } else {
        localStorage.removeItem('gemini_api_key');
        alert('API 키가 유효하지 않습니다. 확인 후 다시 시도해주세요.');
    }
    setIsVerifyingKey(false);
};


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
            setIsExportMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = () => {
    if (nodes.length === 0) {
        alert('저장할 플로우차트가 없습니다.');
        return;
    }
    saveFlowchartToFile({ nodes, edges });
  };

  const handleLoad = () => {
    loadFlowchartFromFile(
        (data) => {
            loadFlowchart(data);
            alert('플로우차트를 성공적으로 불러왔습니다.');
        },
        (error) => {
            alert(`오류: ${error}`);
        }
    );
  };
  
  const handleExport = (format: 'png' | 'svg' | 'pdf') => {
    if (nodes.length === 0) {
        alert('내보낼 플로우차트가 없습니다.');
        return;
    }
    setExportRequest({ format, timestamp: Date.now() });
    setIsExportMenuOpen(false);
  };


  return (
    <DragDropContext>
      <div className="flex h-screen bg-gray-100 text-gray-800">
        <Sidebar
            {...flowchart}
            isApiKeyHardcoded={isApiKeyHardcoded}
            isApiKeyValid={isApiKeyValid}
            isVerifyingKey={isVerifyingKey}
            onSaveApiKey={handleSaveApiKey}
        />
        <main className="flex-1 h-full flex flex-col overflow-hidden">
           <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
              <h1 className="text-xl font-bold text-gray-800">AI 플로우차트 생성기 ✨</h1>
              <div className="flex items-center space-x-4">
                 <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
                    <button
                      onClick={undo}
                      disabled={!canUndo}
                      title="실행 취소 (Ctrl+Z)"
                      className="p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors rounded-l-md"
                    >
                      <UndoIcon className={!canUndo ? 'text-gray-400' : 'text-gray-700'} />
                    </button>
                    <div className="w-px h-5 bg-gray-300"></div>
                     <button
                      onClick={redo}
                      disabled={!canRedo}
                      title="다시 실행 (Ctrl+Y)"
                      className="p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors rounded-r-md"
                    >
                      <RedoIcon className={!canRedo ? 'text-gray-400' : 'text-gray-700'}/>
                    </button>
                 </div>
                  <button
                    onClick={() => autoLayout()}
                    disabled={isLayoutLoading || nodes.length < 2}
                    title="자동 정렬"
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLayoutLoading ? (
                        <svg className="animate-spin h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <AutoLayoutIcon className="text-gray-700" />
                    )}
                    <span className="text-sm font-medium text-gray-800">{isLayoutLoading ? '정렬 중...' : '자동 정렬'}</span>
                </button>

                 <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
                    <button onClick={handleSave} title="저장 (JSON)" className="p-2 hover:bg-gray-100 transition-colors rounded-l-md">
                        <SaveIcon className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="w-px h-5 bg-gray-300"></div>
                    <button onClick={handleLoad} title="불러오기 (JSON)" className="p-2 hover:bg-gray-100 transition-colors rounded-r-md">
                        <LoadIcon className="w-5 h-5 text-gray-700" />
                    </button>
                </div>

                <div className="relative" ref={exportMenuRef}>
                    <button onClick={() => setIsExportMenuOpen(prev => !prev)} title="내보내기" className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-100 transition-colors">
                        <ExportIcon className="w-5 h-5 text-gray-700" />
                        <span className="text-sm font-medium text-gray-800">내보내기</span>
                    </button>
                    {isExportMenuOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-xl z-20 border border-gray-200 animate-fade-in-fast">
                           <style>{`.animate-fade-in-fast { animation: fadeIn 0.1s ease-in-out; } @keyframes fadeIn { 0% { opacity: 0; transform: translateY(-5px); } 100% { opacity: 1; transform: translateY(0); } }`}</style>
                           <a onClick={() => handleExport('png')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-t-md">PNG 이미지</a>
                           <a onClick={() => handleExport('svg')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">SVG 이미지</a>
                           <a onClick={() => handleExport('pdf')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-b-md">PDF 문서</a>
                        </div>
                    )}
                </div>

                 <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">Powered by</span>
                    <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
                       Gemini API
                    </span>
                 </div>
              </div>
           </header>
          <Canvas {...flowchart} exportRequest={exportRequest} onExportComplete={() => setExportRequest(null)} />
        </main>
      </div>
    </DragDropContext>
  );
};

export default App;
