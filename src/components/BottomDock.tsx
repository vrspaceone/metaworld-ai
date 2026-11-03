import React, { useState } from 'react';
import { Camera, Volume2, VolumeX, Users, HelpCircle, ChevronDown, ChevronUp, Server } from 'lucide-react';
import { CameraPreset } from '../types/game.ts';

interface BottomDockProps {
  currentPreset: CameraPreset;
  onSelectPreset: (preset: CameraPreset) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  playerCount: number;
  onOpenPlayersList: () => void;
  onOpenControlsHelp: () => void;
  onOpenServerConfig?: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  currentPreset,
  onSelectPreset,
  isMuted,
  onToggleMute,
  playerCount,
  onOpenPlayersList,
  onOpenControlsHelp,
  onOpenServerConfig,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const presets: { id: CameraPreset; label: string }[] = [
    { id: 'close', label: '근접' },
    { id: 'normal', label: '표준' },
    { id: 'far', label: '원거리' },
    { id: 'top', label: '탑다운' },
  ];

  return (
    <aside
      aria-label="3D 메타월드 도구 및 카메라 컨트롤"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-auto transition-transform duration-300"
      style={{
        maxWidth: 'min(760px, 92vw)',
        transform: isCollapsed ? 'translate(-50%, calc(100% - 24px))' : 'translate(-50%, 0)',
      }}
    >
      {/* Collapse Toggle Tab */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-3 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-t-lg border-t border-x border-slate-700/80 text-[11px] font-medium flex items-center gap-1 shadow-md transition-colors"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            <span>컨트롤 열기</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            <span>시네마 뷰 (숨기기)</span>
          </>
        )}
      </button>

      {/* Main Dock Container */}
      <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 flex items-center justify-between gap-3 text-slate-200">
        {/* Camera Presets Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-1 px-2 text-xs font-semibold text-slate-400">
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">시점</span>
          </div>
          {presets.map((p) => {
            const isActive = currentPreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPreset(p.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl border transition-all ${
              isMuted
                ? 'bg-red-950/60 border-red-800/60 text-red-400 hover:bg-red-900/60'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Online Players Button */}
          <button
            onClick={onOpenPlayersList}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-xs font-medium text-slate-200 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">접속자</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono font-semibold">
              {playerCount}
            </span>
          </button>

          {/* Server Config */}
          {onOpenServerConfig && (
            <button
              onClick={onOpenServerConfig}
              className="p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-slate-300 hover:text-white transition-colors"
              title="게임 서버 설정"
            >
              <Server className="w-4 h-4 text-blue-400" />
            </button>
          )}

          {/* Controls Help */}
          <button
            onClick={onOpenControlsHelp}
            className="p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-slate-300 hover:text-white transition-colors"
            title="조작 안내"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
