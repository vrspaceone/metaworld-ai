import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RemotePlayerInstance } from '../game/remotePlayers.ts';

interface BillboardLabelsProps {
  camera: THREE.PerspectiveCamera | null;
  viewportSize: { width: number; height: number };
  selfNickname: string;
  selfColor: string;
  selfPosition: THREE.Vector3;
  selfSpeechBubble: string | null;
  remotePlayers: RemotePlayerInstance[];
}

export const BillboardLabels: React.FC<BillboardLabelsProps> = ({
  camera,
  viewportSize,
  selfNickname,
  selfColor,
  selfPosition,
  selfSpeechBubble,
  remotePlayers,
}) => {
  const projectedLabels = useMemo(() => {
    if (!camera || viewportSize.width === 0 || viewportSize.height === 0) return [];

    const list: {
      id: string;
      nickname: string;
      color: string;
      isSelf: boolean;
      screenX: number;
      screenY: number;
      speechBubble: string | null;
      dist: number;
    }[] = [];

    const tmpVec = new THREE.Vector3();

    // Project Local Player
    tmpVec.set(selfPosition.x, selfPosition.y + 1.7, selfPosition.z);
    const distToSelf = tmpVec.distanceTo(camera.position);
    tmpVec.project(camera);

    if (tmpVec.z > -1 && tmpVec.z < 1) {
      const sx = ((tmpVec.x + 1) / 2) * viewportSize.width;
      const sy = ((-tmpVec.y + 1) / 2) * viewportSize.height;
      list.push({
        id: 'self',
        nickname: selfNickname,
        color: selfColor,
        isSelf: true,
        screenX: sx,
        screenY: sy,
        speechBubble: selfSpeechBubble,
        dist: distToSelf,
      });
    }

    // Project Remote Players
    remotePlayers.forEach((rp) => {
      tmpVec.set(rp.currentPos.x, rp.currentPos.y + 1.7, rp.currentPos.z);
      const dist = tmpVec.distanceTo(camera.position);
      // Cull players too far away (> 45m)
      if (dist > 45) return;

      tmpVec.project(camera);

      if (tmpVec.z > -1 && tmpVec.z < 1) {
        const sx = ((tmpVec.x + 1) / 2) * viewportSize.width;
        const sy = ((-tmpVec.y + 1) / 2) * viewportSize.height;
        list.push({
          id: rp.data.id,
          nickname: rp.data.nickname,
          color: rp.data.color,
          isSelf: false,
          screenX: sx,
          screenY: sy,
          speechBubble: rp.activeSpeechBubble,
          dist,
        });
      }
    });

    return list;
  }, [camera, viewportSize, selfPosition, selfNickname, selfColor, selfSpeechBubble, remotePlayers]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {projectedLabels.map((item) => {
        // Scale label subtly based on camera distance
        const scale = Math.max(0.72, Math.min(1.05, 1 - (item.dist - 4) * 0.02));

        return (
          <div
            key={item.id}
            className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center transition-all duration-75"
            style={{
              left: `${item.screenX}px`,
              top: `${item.screenY}px`,
              transform: `translate(-50%, -100%) scale(${scale})`,
            }}
          >
            {/* Active Speech Bubble */}
            {item.speechBubble && (
              <div className="relative mb-2 px-3 py-1.5 bg-white text-slate-900 rounded-xl shadow-lg border border-slate-200 text-xs font-semibold max-w-[200px] text-center break-words animate-in zoom-in-95 duration-150">
                <span>{item.speechBubble}</span>
                {/* Speech tail */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-slate-200" />
              </div>
            )}

            {/* Overhead Nickname Tag */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-700/80 shadow-md backdrop-blur-xs">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[11px] font-bold tracking-tight text-white whitespace-nowrap">
                {item.nickname}
                {item.isSelf && <span className="text-slate-400 font-normal"> (나)</span>}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
