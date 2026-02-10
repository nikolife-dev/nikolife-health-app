import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Log {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface LiveLogsProps {
  logs: string[];
  onClear?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  maxHeight?: string;
}

export function LiveLogs({ logs, onClear, position = 'bottom-right', maxHeight = '64' }: LiveLogsProps) {
  if (logs.length === 0) return null;

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 max-w-md z-50',
    'bottom-left': 'fixed bottom-4 left-4 max-w-md z-50',
    'inline': 'w-full'
  };

  return (
    <Card className={`${positionClasses[position]} p-4 bg-gray-900 text-green-400 font-mono text-xs shadow-2xl animate-slide-up`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Логи в реальном времени
        </h3>
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-white text-xs flex items-center gap-1"
        >
          <Icon name="X" size={14} />
          Очистить
        </button>
      </div>
      <div className={`space-y-1 max-h-${maxHeight} overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900`}>
        {logs.map((log, i) => {
          const getLogColor = (logText: string) => {
            if (logText.includes('✅')) return 'text-green-400';
            if (logText.includes('❌')) return 'text-red-400';
            if (logText.includes('⚠️')) return 'text-yellow-400';
            if (logText.includes('ℹ️')) return 'text-blue-400';
            return 'text-green-400';
          };

          return (
            <div key={i} className={`text-xs break-all ${getLogColor(log)}`}>
              {log}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

const LOGS_ENABLED = false;

export function useLiveLogs() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    if (!LOGS_ENABLED) return;
    const timestamp = new Date().toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => setLogs([]);

  const logInfo = (message: string) => {
    if (!LOGS_ENABLED) return;
    addLog(`ℹ️ ${message}`);
  };
  
  const logSuccess = (message: string) => {
    if (!LOGS_ENABLED) return;
    addLog(`✅ ${message}`);
  };
  
  const logError = (message: string) => {
    if (!LOGS_ENABLED) return;
    addLog(`❌ ${message}`);
  };
  
  const logWarning = (message: string) => {
    if (!LOGS_ENABLED) return;
    addLog(`⚠️ ${message}`);
  };

  return {
    logs,
    addLog,
    clearLogs,
    logInfo,
    logSuccess,
    logError,
    logWarning
  };
}