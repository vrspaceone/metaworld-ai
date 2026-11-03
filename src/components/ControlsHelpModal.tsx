import React from 'react';
import { X, Keyboard, Mouse, MessageSquare, Compass } from 'lucide-react';

interface ControlsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsHelpModal: React.FC<ControlsHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">3D 메타월드 조작 방법</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-200 mb-0.5">캐릭터 3인칭 이동</div>
              <div className="text-slate-400 space-y-1">
                <div><code className="bg-slate-700 text-amber-300 px-1 py-0.5 rounded font-mono">W / S</code> : 앞/뒤 이동</div>
                <div><code className="bg-slate-700 text-amber-300 px-1 py-0.5 rounded font-mono">A / D</code> : 좌/우 이동</div>
                <div><code className="bg-slate-700 text-amber-300 px-1 py-0.5 rounded font-mono">Space</code> : 점프</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
              <Mouse className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-200 mb-0.5">3D 카메라 시점 제어</div>
              <div className="text-slate-400 space-y-1">
                <div>화면 아무 곳이나 <strong>마우스 드래그</strong> (또는 우클릭 드래그)로 360° 자유 회전</div>
                <div><strong>마우스 휠 스크롤</strong>로 줌인 / 줌아웃</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-200 mb-0.5">실시간 멀티플레이 대화</div>
              <div className="text-slate-400">
                <code className="bg-slate-700 text-purple-300 px-1 py-0.5 rounded font-mono">Enter</code> 키를 누르면 채팅 입력창이 활성화되며, 메시지를 전송하면 머리 위 3D 말풍선과 전체 채팅창에 실시간으로 전달됩니다.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-md"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
