import React, { useState } from 'react';
import { Compass, Users, Sparkles, Move3d, Server, AlertCircle, CheckCircle2 } from 'lucide-react';

interface WorldEntryModalProps {
  onJoin: (nickname: string, color: string) => void;
  isConnected: boolean;
  onOpenServerConfig: () => void;
}

const AVATAR_COLORS = [
  { name: '오션 블루', hex: '#3b82f6' },
  { name: '에메랄드 포레스트', hex: '#10b981' },
  { name: '앰버 선셋', hex: '#f59e0b' },
  { name: '미스틱 바이올렛', hex: '#8b5cf6' },
  { name: '로즈 코랄', hex: '#f43f5e' },
  { name: '나이트 슬레이트', hex: '#475569' },
];

export const WorldEntryModal: React.FC<WorldEntryModalProps> = ({
  onJoin,
  isConnected,
  onOpenServerConfig,
}) => {
  const [nickname, setNickname] = useState(() => `탐험가_${Math.floor(Math.random() * 899 + 100)}`);
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0].hex);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nickname.trim() || '탐험가';
    onJoin(cleanName, selectedColor);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 md:p-8 text-white overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: selectedColor }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-300"
              style={{ backgroundColor: selectedColor }}
            >
              <Compass className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Meta World (메타월드)
              </h1>
              <p className="text-xs md:text-sm text-slate-400">
                웹 브라우저 3D 자연 멀티플레이 프로토타입
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenServerConfig}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="소켓 서버 설정"
          >
            <Server className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">서버 설정</span>
          </button>
        </div>

        {/* Connection Notice */}
        <div
          className={`mb-4 px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs ${
            isConnected
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
              : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {isConnected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>
              {isConnected
                ? '실시간 멀티플레이 서버 연결 완료'
                : '소켓 서버 연결 대기 중... (Render 서버 깨어나는 중이거나 URL 설정 필요)'}
            </span>
          </div>
          {!isConnected && (
            <button
              type="button"
              onClick={onOpenServerConfig}
              className="underline hover:text-white text-[11px] shrink-0 font-semibold ml-2"
            >
              URL 입력
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              플레이어 닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 14))}
              placeholder="닉네임을 입력하세요"
              maxLength={14}
              required
              className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
            />
          </div>

          {/* Avatar Color Swatches */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              캐릭터 의상 컬러 선택
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {AVATAR_COLORS.map((c) => {
                const isSelected = selectedColor === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    className={`h-11 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-2 ring-white scale-105 shadow-md'
                        : 'opacity-70 hover:opacity-100 hover:scale-102'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {isSelected && <Sparkles className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls Quick Guide */}
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-medium text-slate-200">
              <Move3d className="w-4 h-4 text-emerald-400" />
              <span>3D 조작 안내</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
              <div><strong className="text-slate-200 font-mono">W, A, S, D</strong> : 캐릭터 3D 이동</div>
              <div><strong className="text-slate-200 font-mono">Space</strong> : 점프</div>
              <div><strong className="text-slate-200">마우스 드래그</strong> : 360° 시점 회전</div>
              <div><strong className="text-slate-200 font-mono">Enter</strong> : 실시간 채팅</div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide text-white transition-all shadow-lg hover:shadow-xl active:scale-[0.99] flex items-center justify-center gap-2"
            style={{ backgroundColor: selectedColor }}
          >
            <Users className="w-4 h-4" />
            자연 월드 입장하기
          </button>
        </form>
      </div>
    </div>
  );
};
