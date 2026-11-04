import React from 'react';
import * as THREE from 'three';
import { X, Users, MapPin } from 'lucide-react';
import { PlayerData, Vector3D } from '../types/game.ts';
import { ROSE_DIR, CHAIR_DIR, VOLCANO_1_DIR, VOLCANO_2_DIR, VOLCANO_3_DIR, PLANET_RADIUS } from '../game/world.ts';

interface OnlinePlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selfId: string | null;
  selfPos: Vector3D;
  players: PlayerData[];
}

export const OnlinePlayersModal: React.FC<OnlinePlayersModalProps> = ({
  isOpen,
  onClose,
  selfId,
  selfPos,
  players,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-white">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">동일 월드 접속자 목록</h2>
            <span className="px-2 py-0.5 bg-slate-800 text-xs font-mono text-emerald-400 rounded-md border border-slate-700">
              {players.length}명
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2 custom-scrollbar pr-1">
          {players.map((p) => {
            const isMe = p.id === selfId;
            const pVec = new THREE.Vector3(p.position.x, p.position.y, p.position.z);
            const dist = pVec.distanceTo(new THREE.Vector3(selfPos.x, selfPos.y, selfPos.z));
            let locationDesc = '소행성 B612 탐험 중';

            if (pVec.distanceTo(ROSE_DIR.clone().multiplyScalar(PLANET_RADIUS)) < 3.8) {
              locationDesc = '🌹 유리 돔 속 장미';
            } else if (pVec.distanceTo(CHAIR_DIR.clone().multiplyScalar(PLANET_RADIUS)) < 3.8) {
              locationDesc = '🪑 일몰 감상 의자';
            } else if (pVec.distanceTo(VOLCANO_1_DIR.clone().multiplyScalar(PLANET_RADIUS)) < 3.8) {
              locationDesc = '🌋 제1 대형 활화산';
            } else if (pVec.distanceTo(VOLCANO_2_DIR.clone().multiplyScalar(PLANET_RADIUS)) < 3.8) {
              locationDesc = '🌋 제2 작은 활화산';
            } else if (pVec.distanceTo(VOLCANO_3_DIR.clone().multiplyScalar(PLANET_RADIUS)) < 3.8) {
              locationDesc = '🧹 굴뚝 솔 사화산';
            } else if (p.position.y > 13.0) {
              locationDesc = '🪐 소행성 북극 정상';
            }

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isMe
                    ? 'bg-blue-950/40 border-blue-800/60'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                    style={{ backgroundColor: p.color }}
                  />
                  <div>
                    <div className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                      <span>{p.nickname}</span>
                      {isMe && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30">
                          나
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{locationDesc}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">
                    {isMe ? '현재 위치' : `${dist.toFixed(1)}m 거리`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
