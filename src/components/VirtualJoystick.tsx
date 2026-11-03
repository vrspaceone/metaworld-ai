import React, { useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (move: { x: number; z: number }) => void;
  className?: string;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, className = '' }) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const activeTouchIdRef = useRef<number | null>(null);

  const maxRadius = 40; // Max movement radius in pixels

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    activeTouchIdRef.current = touch.identifier;
    setIsActive(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (activeTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchIdRef.current) {
        resetJoystick();
        break;
      }
    }
  };

  const resetJoystick = () => {
    activeTouchIdRef.current = null;
    setIsActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, z: 0 });
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    let normX = 0;
    let normZ = 0;

    if (distance === 0) {
      setKnobPos({ x: 0, y: 0 });
    } else if (distance > maxRadius) {
      const angle = Math.atan2(dy, dx);
      normX = Math.cos(angle);
      normZ = Math.sin(angle);
      setKnobPos({
        x: normX * maxRadius,
        y: normZ * maxRadius,
      });
    } else {
      normX = dx / maxRadius;
      normZ = dy / maxRadius;
      setKnobPos({ x: dx, y: dy });
    }

    // In 3D space, Y screen drag corresponds to Z axis movement (up on screen = forward = -Z)
    onMove({
      x: normX,
      z: normZ,
    });
  };

  return (
    <div
      ref={baseRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetJoystick}
      className={`relative w-28 h-28 rounded-full bg-slate-900/60 border-2 ${
        isActive ? 'border-blue-400 bg-slate-900/80 shadow-lg' : 'border-slate-600/70'
      } backdrop-blur-xs flex items-center justify-center touch-control select-none z-30 transition-colors ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Direction Cross Markings */}
      <div className="absolute w-1 h-3 bg-slate-500/40 top-1 rounded-full" />
      <div className="absolute w-1 h-3 bg-slate-500/40 bottom-1 rounded-full" />
      <div className="absolute h-1 w-3 bg-slate-500/40 left-1 rounded-full" />
      <div className="absolute h-1 w-3 bg-slate-500/40 right-1 rounded-full" />

      {/* Movable Thumb Knob */}
      <div
        className={`w-12 h-12 rounded-full border-2 transition-transform duration-75 shadow-md flex items-center justify-center ${
          isActive
            ? 'bg-blue-500 border-white scale-105'
            : 'bg-slate-700/90 border-slate-400/80'
        }`}
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          touchAction: 'none',
        }}
      >
        <div className="w-3.5 h-3.5 rounded-full bg-white/40" />
      </div>
    </div>
  );
};

interface TouchJumpButtonProps {
  onJump: () => void;
  className?: string;
}

export const TouchJumpButton: React.FC<TouchJumpButtonProps> = ({ onJump, className = '' }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(true);
    onJump();
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <button
      type="button"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center shadow-xl active:scale-95 transition-all touch-control select-none z-30 font-bold text-xs ${
        isPressed
          ? 'bg-emerald-500 border-white text-white scale-95 shadow-emerald-500/40'
          : 'bg-slate-900/80 border-slate-600/80 text-slate-200'
      } ${className}`}
      style={{ touchAction: 'none' }}
      title="점프 (Jump)"
    >
      <svg
        className="w-5 h-5 mb-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      <span className="text-[10px] tracking-wider uppercase font-mono">JUMP</span>
    </button>
  );
};
