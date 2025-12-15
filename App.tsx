import React, { useState } from 'react';
import GameEngine from './components/GameEngine';
import DialogueBox from './components/DialogueBox';
import { NPC } from './types';

const emitKey = (code: string, type: 'keydown' | 'keyup') => {
  window.dispatchEvent(new KeyboardEvent(type, { code }));
};

const App: React.FC = () => {
  const [activeNpc, setActiveNpc] = useState<NPC | null>(null);

  return (
    <div className="w-full h-screen relative bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950">
      <GameEngine 
        isDialogueOpen={!!activeNpc} 
        onInteract={(npc) => setActiveNpc(npc)} 
      />
      
      {/* UI Overlay for controls hint */}
      {!activeNpc && (
        <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-3">
          <div className="bg-slate-900/70 text-white px-3 py-2 rounded-lg font-retro text-[10px] border border-cyan-400/40 shadow-[0_8px_30px_rgba(6,182,212,0.2)] backdrop-blur">
            <h1 className="text-amber-300 mb-2 text-xs tracking-tight">MEDIQUEST</h1>
            <div className="flex gap-3 flex-wrap text-[10px] leading-relaxed">
              <span className="bg-white/10 px-2 py-1 rounded border border-white/10">WASD / ←↑↓→ mover</span>
              <span className="bg-white/10 px-2 py-1 rounded border border-white/10">SPACE / ENTER falar</span>
            </div>
          </div>

          <div className="bg-white/5 text-[11px] text-slate-200 px-3 py-2 rounded-md border border-white/10 backdrop-blur pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.2)]" />
              <span className="uppercase tracking-[0.08em] text-xs font-semibold">Ala Clínica — Turno da Noite</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300">Fale com a equipe e pacientes para avançar.</p>
          </div>
        </div>
      )}

      {/* Mobile D-Pad Hint (Visual Only) */}
      <div className="absolute bottom-4 left-4 pointer-events-none md:hidden opacity-70">
        <div className="bg-slate-800/70 border border-white/10 p-4 rounded-full w-24 h-24 flex items-center justify-center shadow-lg backdrop-blur">
            <span className="text-white text-[11px] text-center leading-tight">Touch<br/>Controls</span>
        </div>
      </div>

      {/* Mobile Controls (D-Pad + Action) */}
      {!activeNpc && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between md:hidden gap-4 pointer-events-none">
          <div className="pointer-events-auto flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <button
                className="w-12 h-12 rounded-full bg-slate-800/70 border border-cyan-300/40 text-white text-xl shadow-lg backdrop-blur"
                onPointerDown={() => emitKey('ArrowUp', 'keydown')}
                onPointerUp={() => emitKey('ArrowUp', 'keyup')}
              >
                ↑
              </button>
            </div>
            <div className="flex gap-2">
              <button
                className="w-12 h-12 rounded-full bg-slate-800/70 border border-cyan-300/40 text-white text-xl shadow-lg backdrop-blur"
                onPointerDown={() => emitKey('ArrowLeft', 'keydown')}
                onPointerUp={() => emitKey('ArrowLeft', 'keyup')}
              >
                ←
              </button>
              <button
                className="w-12 h-12 rounded-full bg-slate-800/70 border border-cyan-300/40 text-white text-xl shadow-lg backdrop-blur"
                onPointerDown={() => emitKey('ArrowDown', 'keydown')}
                onPointerUp={() => emitKey('ArrowDown', 'keyup')}
              >
                ↓
              </button>
              <button
                className="w-12 h-12 rounded-full bg-slate-800/70 border border-cyan-300/40 text-white text-xl shadow-lg backdrop-blur"
                onPointerDown={() => emitKey('ArrowRight', 'keydown')}
                onPointerUp={() => emitKey('ArrowRight', 'keyup')}
              >
                →
              </button>
            </div>
          </div>

          <button
            className="pointer-events-auto w-16 h-16 rounded-full bg-emerald-600/80 border border-emerald-300/60 text-white text-sm font-semibold shadow-[0_10px_30px_rgba(16,185,129,0.35)] backdrop-blur"
            onPointerDown={() => emitKey('Space', 'keydown')}
            onPointerUp={() => emitKey('Space', 'keyup')}
          >
            AÇÃO
          </button>
        </div>
      )}

      {/* Status badge */}
      {!activeNpc && (
        <div className="absolute top-4 right-4 pointer-events-none">
          <div className="bg-slate-900/70 text-white px-3 py-2 rounded-lg border border-emerald-400/30 shadow-[0_8px_30px_rgba(52,211,153,0.16)] backdrop-blur flex items-center gap-2 text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="uppercase tracking-[0.08em] font-semibold">Pronto para interação</span>
          </div>
        </div>
      )}

      {activeNpc && (
        <DialogueBox 
          npc={activeNpc} 
          onClose={() => setActiveNpc(null)} 
        />
      )}
    </div>
  );
};

export default App;
