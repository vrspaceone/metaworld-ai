/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Move3d, Server, AlertCircle, CheckCircle2, Shirt, Rocket } from 'lucide-react';
import { CharacterAppearance } from '../types/game.ts';
import { CHARACTER_PRESETS, CharacterPreset } from '../game/character.ts';
import { CharacterPreviewCanvas } from './CharacterPreviewCanvas.tsx';
import { CharacterCustomizerModal } from './CharacterCustomizerModal.tsx';

interface WorldEntryModalProps {
  onJoin: (nickname: string, color: string, appearance: CharacterAppearance) => void;
  isConnected: boolean;
  onOpenServerConfig: () => void;
}

const DEFAULT_NICKNAMES = ['어린왕자', '별여행자', '사막여우', '붉은장미', '비행사', '우주비행사'];

export const WorldEntryModal: React.FC<WorldEntryModalProps> = ({
  onJoin,
  isConnected,
  onOpenServerConfig,
}) => {
  const [nickname, setNickname] = useState(() => {
    const prefix = DEFAULT_NICKNAMES[Math.floor(Math.random() * DEFAULT_NICKNAMES.length)];
    return `${prefix}_${Math.floor(Math.random() * 899 + 100)}`;
  });
  const [appearance, setAppearance] = useState<CharacterAppearance>(CHARACTER_PRESETS[0].appearance);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nickname.trim() || '어린왕자';
    onJoin(cleanName, appearance.shirtColor, appearance);
  };

  const handleSelectPreset = (preset: CharacterPreset) => {
    setAppearance({ ...preset.appearance });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl bg-slate-950/95 border border-amber-500/30 rounded-3xl shadow-2xl p-5 sm:p-7 text-white overflow-hidden max-h-[92vh] overflow-y-auto">
          {/* Subtle cosmic decorative background gradient */}
          <div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none transition-colors duration-500"
            style={{ backgroundColor: appearance.shirtColor }}
          />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-300 border border-white/10"
                style={{ backgroundColor: appearance.shirtColor }}
              >
                <span className="text-2xl">🪐</span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  소행성 B612
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    어린 왕자의 별 · 3D 소행성
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  장미와 일몰, 세 개의 화산이 있는 작은 구형 소행성으로 여행을 떠나세요
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenServerConfig}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="소켓 서버 설정"
            >
              <Server className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">서버 설정</span>
            </button>
          </div>

          {/* Connection Notice */}
          <div
            className={`mb-4 px-3.5 py-2 rounded-xl border flex items-center justify-between text-xs ${
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
                  ? '실시간 우주 정거장 서버 연결 완료'
                  : '소켓 서버 연결 중...'}
              </span>
            </div>
            {!isConnected && (
              <button
                type="button"
                onClick={onOpenServerConfig}
                className="underline hover:text-white text-[11px] shrink-0 font-semibold ml-2"
              >
                URL 확인
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Character Preview & Archetype Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
              {/* 3D Character Preview (5 cols) */}
              <div className="sm:col-span-5 h-56 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-inner flex flex-col items-center justify-center p-2 relative">
                <CharacterPreviewCanvas appearance={appearance} className="w-full h-full" />
                <button
                  type="button"
                  onClick={() => setIsCustomizerOpen(true)}
                  className="absolute bottom-2 left-2 right-2 py-1.5 px-2 bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-700/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md backdrop-blur-sm"
                >
                  <Shirt className="w-3.5 h-3.5" />
                  <span>세부 스타일 & 옷장</span>
                </button>
              </div>

              {/* Character Presets & Nickname (7 cols) */}
              <div className="sm:col-span-7 space-y-3">
                {/* Nickname Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    여행자 닉네임
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.slice(0, 14))}
                    placeholder="닉네임을 입력하세요"
                    maxLength={14}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium text-sm"
                  />
                </div>

                {/* Quick Archetype Preset Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      아바타 스타일 선택
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomizerOpen(true)}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      직접 커스텀
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {CHARACTER_PRESETS.map((preset) => {
                      const isSelected =
                        appearance.hairStyle === preset.appearance.hairStyle &&
                        appearance.outfit === preset.appearance.outfit &&
                        appearance.accessory === preset.appearance.accessory;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'bg-amber-950/50 border-amber-400 text-white ring-1 ring-amber-400 shadow'
                              : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="text-lg">{preset.icon}</span>
                          <span className="text-xs font-bold truncate">{preset.name.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls & Asteroid Guide */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <Move3d className="w-4 h-4 text-amber-400" />
                  <span>소행성 탐험 조작 안내</span>
                </div>
                <span className="text-[10px] text-amber-300/80 font-mono">360° 구면 중심 중력</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] text-slate-400 pt-1">
                <div><strong className="text-slate-200 font-mono">W, A, S, D</strong> 구면 이동</div>
                <div><strong className="text-slate-200 font-mono">Space</strong> 중력 점프</div>
                <div><strong className="text-slate-200">마우스 드래그</strong> 우주 시점</div>
                <div><strong className="text-slate-200 font-mono">1~5 키</strong> 감정표현</div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide text-white transition-all shadow-lg hover:shadow-xl active:scale-[0.99] flex items-center justify-center gap-2 hover:brightness-110 border border-white/20"
              style={{ backgroundColor: appearance.shirtColor }}
            >
              <Rocket className="w-4 h-4" />
              <span>소행성 B612 착륙하기</span>
            </button>
          </form>
        </div>
      </div>

      {/* Wardrobe Customizer Modal */}
      <CharacterCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        currentAppearance={appearance}
        onApplyAppearance={(newApp) => setAppearance(newApp)}
      />
    </>
  );
};
