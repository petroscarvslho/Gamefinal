import React from 'react';

export type GameMode = 'menu' | 'story' | 'build';

interface ModeSelectorProps {
  onSelectMode: (mode: GameMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelectMode }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center z-50">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 31px,
            rgba(255,255,255,0.03) 31px,
            rgba(255,255,255,0.03) 32px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 31px,
            rgba(255,255,255,0.03) 31px,
            rgba(255,255,255,0.03) 32px
          )`
        }} />
      </div>

      <div className="relative text-center">
        {/* Title */}
        <div className="mb-12">
          <h1
            className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-cyan-400 to-cyan-600 mb-2"
            style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '0 4px 20px rgba(34, 211, 238, 0.5)' }}
          >
            MEDIQUEST
          </h1>
          <p className="text-slate-400 text-sm tracking-wider mt-4" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
            HOSPITAL RPG - EDUCATIONAL GAME
          </p>
        </div>

        {/* Mode buttons */}
        <div className="flex flex-col gap-4 items-center">
          {/* Story Mode */}
          <button
            onClick={() => onSelectMode('story')}
            className="group relative w-80 py-6 px-8 bg-gradient-to-br from-emerald-600/90 to-emerald-800/90
                       hover:from-emerald-500 hover:to-emerald-700
                       border-2 border-emerald-400/60 rounded-lg shadow-lg
                       transition-all duration-200 transform hover:scale-105 hover:shadow-emerald-500/30 hover:shadow-xl"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <div className="flex items-center justify-center gap-4">
              <span className="text-3xl">🏥</span>
              <div className="text-left">
                <div className="text-white text-sm mb-1">MODO HISTORIA</div>
                <div className="text-emerald-200/70 text-[8px]">Explore o hospital e aprenda</div>
              </div>
            </div>
            <div className="absolute inset-0 border-2 border-white/10 rounded-lg pointer-events-none" />
          </button>

          {/* Build Mode */}
          <button
            onClick={() => onSelectMode('build')}
            className="group relative w-80 py-6 px-8 bg-gradient-to-br from-purple-600/90 to-purple-800/90
                       hover:from-purple-500 hover:to-purple-700
                       border-2 border-purple-400/60 rounded-lg shadow-lg
                       transition-all duration-200 transform hover:scale-105 hover:shadow-purple-500/30 hover:shadow-xl"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <div className="flex items-center justify-center gap-4">
              <span className="text-3xl">🔧</span>
              <div className="text-left">
                <div className="text-white text-sm mb-1">MODO CONSTRUCAO</div>
                <div className="text-purple-200/70 text-[8px]">Crie seus proprios mapas</div>
              </div>
            </div>
            <div className="absolute inset-0 border-2 border-white/10 rounded-lg pointer-events-none" />
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-slate-500 text-[8px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          <p>USE AS SETAS OU WASD PARA MOVER</p>
          <p className="mt-1">SPACE OU ENTER PARA INTERAGIR</p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-8 -left-8 w-4 h-4 border-t-2 border-l-2 border-cyan-400/40" />
        <div className="absolute -top-8 -right-8 w-4 h-4 border-t-2 border-r-2 border-cyan-400/40" />
        <div className="absolute -bottom-8 -left-8 w-4 h-4 border-b-2 border-l-2 border-cyan-400/40" />
        <div className="absolute -bottom-8 -right-8 w-4 h-4 border-b-2 border-r-2 border-cyan-400/40" />
      </div>
    </div>
  );
};

export default ModeSelector;
