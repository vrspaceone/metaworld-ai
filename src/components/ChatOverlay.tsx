import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { ChatMessage } from '../types/game.ts';

interface ChatOverlayProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  selfNickname: string;
  isChatFocused: boolean;
  setIsChatFocused: (focused: boolean) => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  messages,
  onSendMessage,
  selfNickname,
  isChatFocused,
  setIsChatFocused,
}) => {
  const [inputText, setInputText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when parent triggers focus
  useEffect(() => {
    if (isChatFocused) {
      inputRef.current?.focus();
    }
  }, [isChatFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    inputRef.current?.blur();
    setIsChatFocused(false);
  };

  const handleQuickEmoji = (emoji: string) => {
    onSendMessage(emoji);
  };

  return (
    <div className="fixed bottom-6 left-6 z-30 w-80 md:w-96 flex flex-col font-sans transition-all duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-t border-x border-slate-700/80 rounded-t-xl text-xs text-slate-300">
        <div className="flex items-center gap-2 font-medium">
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          <span>월드 실시간 채팅</span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white transition-colors p-0.5"
          title={isCollapsed ? '채팅창 펼치기' : '채팅창 접기'}
        >
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="bg-slate-900/80 border-b border-x border-slate-700/80 rounded-b-xl shadow-xl flex flex-col overflow-hidden">
          {/* Message List */}
          <div className="h-48 overflow-y-auto p-3 space-y-2 custom-scrollbar text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic">
                메시지가 없습니다. 대화를 시작해보세요!
              </div>
            ) : (
              messages.map((msg) => {
                const isSystem = msg.playerId === 'system';
                const isMe = msg.nickname === selfNickname;

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center py-0.5 text-[11px] text-slate-400 font-mono">
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex flex-col gap-0.5 leading-relaxed">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-bold text-[11px] drop-shadow-sm"
                        style={{ color: msg.color }}
                      >
                        {msg.nickname}
                        {isMe && <span className="text-[10px] text-slate-400 font-normal"> (나)</span>}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="bg-slate-800/70 text-slate-100 rounded-lg px-2.5 py-1.5 max-w-[95%] break-words self-start border border-slate-700/40">
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reaction Buttons */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-800/50 border-t border-slate-700/40 text-xs">
            <span className="text-[10px] text-slate-400 mr-1">빠른 반응:</span>
            {['👋 안녕!', '🔥 모닥불', '🌲 자연 좋다', '✨ 최고', '🏃 같이 가요'].map((reaction) => (
              <button
                key={reaction}
                type="button"
                onClick={() => handleQuickEmoji(reaction)}
                className="px-2 py-0.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded text-[11px] transition-colors whitespace-nowrap"
              >
                {reaction}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-2 bg-slate-900 flex items-center gap-1.5 border-t border-slate-700/60">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value.slice(0, 150))}
              onFocus={() => setIsChatFocused(true)}
              onBlur={() => setIsChatFocused(false)}
              placeholder="메시지 입력 (Enter로 전송)..."
              maxLength={150}
              className="flex-1 bg-slate-800/90 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
