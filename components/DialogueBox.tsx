import React, { useEffect, useRef, useState } from 'react';
import { NPC } from '../types';
import { generateNPCDialogue } from '../services/gemini';

interface DialogueBoxProps {
  npc: NPC;
  onClose: () => void;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({ npc, onClose }) => {
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    const fetchGreeting = async () => {
      setIsLoading(true);
      const greeting = await generateNPCDialogue(npc, "Hello", []);
      setMessages([{ sender: npc.name, text: greeting }]);
      setIsLoading(false);
    };
    fetchGreeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [npc]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    const newMessages = [...messages, { sender: 'You', text: userMsg }];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    const history = newMessages.map(m => m.text);
    const reply = await generateNPCDialogue(npc, userMsg, history);
    
    setMessages(prev => [...prev, { sender: npc.name, text: reply }]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-end justify-center p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-cyan-400/30 w-full max-w-2xl rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col font-retro text-sm overflow-hidden" style={{ height: '44vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/70 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.18)]" />
            <div className="flex flex-col">
              <span className="uppercase tracking-[0.1em]" style={{ fontSize: '11px' }}>{npc.name}</span>
              <span className="text-[10px] text-cyan-200 uppercase">{npc.role}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-200 bg-white/10 hover:bg-white/20 border border-white/10 rounded px-3 py-1 text-[10px] font-semibold">
            CLOSE
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/60">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-slate-400 mb-1">{msg.sender}</span>
              <div className={`px-3 py-2 rounded-lg max-w-[82%] border ${
                msg.sender === 'You' 
                  ? 'bg-cyan-600/80 border-cyan-300/60 text-white shadow-[0_8px_24px_rgba(34,211,238,0.24)] rounded-br-none' 
                  : 'bg-slate-700/80 border-white/10 text-white rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start animate-pulse">
               <div className="bg-slate-700/80 text-slate-200 px-3 py-2 rounded-lg border border-white/10 rounded-bl-none">
                 ...
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-slate-950/70 border-t border-white/10 flex gap-2">
          <input 
            autoFocus
            className="flex-1 bg-slate-900 text-white px-3 py-2 outline-none border border-slate-700 focus:border-cyan-400 font-sans rounded-lg text-sm"
            placeholder="Diga algo rápido..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg border border-cyan-300/50 disabled:opacity-50 font-semibold text-xs"
          >
            ENVIAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogueBox;
