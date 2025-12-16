import React, { useState, useEffect, useCallback } from 'react';
import GameEngine from './components/GameEngine';
import RPGDialogueBox from './components/RPGDialogueBox';
import MapEditor from './components/MapEditor';
import SpriteGenerator from './components/SpriteGenerator';
import CharacterGenerator from './components/CharacterGenerator';
import ModeSelector, { GameMode } from './components/ModeSelector';
import Inventory from './components/Inventory';
import LeonardoGenerator from './components/LeonardoGenerator';
import ClinicalCaseViewer from './components/ClinicalCaseViewer';
import TilePicker from './components/TilePicker';
import { NPC, InventoryItem, ItemCategory, GAME_ITEMS } from './types';
import { SPRITE_SHEETS } from './constants';
import { loadLeonardoApiKey } from './services/leonardoAI';

// Starter items for the player
const STARTER_ITEMS: InventoryItem[] = [
  { ...GAME_ITEMS.find(i => i.id === 'estetoscopio')!, quantity: 1 },
  { ...GAME_ITEMS.find(i => i.id === 'laringoscopio')!, quantity: 1 },
  { ...GAME_ITEMS.find(i => i.id === 'propofol')!, quantity: 5 },
  { ...GAME_ITEMS.find(i => i.id === 'fentanil')!, quantity: 3 },
  { ...GAME_ITEMS.find(i => i.id === 'midazolam')!, quantity: 3 },
  { ...GAME_ITEMS.find(i => i.id === 'rocuronio')!, quantity: 2 },
  { ...GAME_ITEMS.find(i => i.id === 'acesso_venoso')!, quantity: 10 },
  { ...GAME_ITEMS.find(i => i.id === 'seringa_20ml')!, quantity: 10 },
  { ...GAME_ITEMS.find(i => i.id === 'luvas')!, quantity: 5 },
  { ...GAME_ITEMS.find(i => i.id === 'prontuario')!, quantity: 1 },
  { ...GAME_ITEMS.find(i => i.id === 'cafe')!, quantity: 2 },
];

const emitKey = (code: string, type: 'keydown' | 'keyup') => {
  window.dispatchEvent(new KeyboardEvent(type, { code }));
};

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [activeNpc, setActiveNpc] = useState<NPC | null>(null);
  const [showTilePicker, setShowTilePicker] = useState(false);
  const [showMapEditor, setShowMapEditor] = useState(false);
  const [showSpriteGenerator, setShowSpriteGenerator] = useState(false);
  const [showCharacterGenerator, setShowCharacterGenerator] = useState(false);
  const [showLeonardoGenerator, setShowLeonardoGenerator] = useState(false);
  const [showClinicalCases, setShowClinicalCases] = useState(false);

  // Inventory state
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(STARTER_ITEMS);

  // Inventory handlers
  const handleUseItem = useCallback((item: InventoryItem) => {
    setInventoryItems(prev => {
      const updated = prev.map(i => {
        if (i.id === item.id) {
          if (i.quantity > 1) {
            return { ...i, quantity: i.quantity - 1 };
          }
          return null;
        }
        return i;
      }).filter(Boolean) as InventoryItem[];
      return updated;
    });
    // Visual feedback
    console.log(`Usando item: ${item.name}`);
  }, []);

  const handleDropItem = useCallback((item: InventoryItem) => {
    setInventoryItems(prev => prev.filter(i => i.id !== item.id));
  }, []);

  // Carregar Leonardo API key ao iniciar o app
  useEffect(() => {
    const apiKey = loadLeonardoApiKey();
    if (apiKey) {
      console.log('Leonardo AI: API key carregada automaticamente');
    }
  }, []);

  // Keyboard listener for inventory (I key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyI' && gameMode === 'story' && !activeNpc && !showMapEditor) {
        setIsInventoryOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode, activeNpc, showMapEditor]);

  // Show menu if no mode selected
  if (gameMode === 'menu') {
    return <ModeSelector onSelectMode={setGameMode} />;
  }

  // Build mode - directly show map editor
  if (gameMode === 'build') {
    return (
      <div className="w-full h-screen relative bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950">
        <MapEditor onClose={() => setGameMode('menu')} />

        {/* Tools sidebar for build mode */}
        <div className="fixed top-4 right-4 z-40 flex flex-col items-end gap-2">
          <button
            onClick={() => setShowSpriteGenerator(true)}
            className="bg-purple-600/90 hover:bg-purple-500 text-white text-xs px-4 py-2 rounded border border-purple-400/30 shadow-lg backdrop-blur font-semibold"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
          >
            GERAR SPRITES (AI)
          </button>
          <button
            onClick={() => setShowLeonardoGenerator(true)}
            className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 hover:from-purple-500 hover:to-pink-500 text-white text-xs px-4 py-2 rounded border border-purple-400/30 shadow-lg backdrop-blur font-semibold"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
          >
            LEONARDO AI
          </button>
          <button
            onClick={() => setShowCharacterGenerator(true)}
            className="bg-cyan-600/90 hover:bg-cyan-500 text-white text-xs px-4 py-2 rounded border border-cyan-400/30 shadow-lg backdrop-blur font-semibold"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
          >
            CRIAR PERSONAGEM
          </button>
        </div>

        {showSpriteGenerator && (
          <SpriteGenerator onClose={() => setShowSpriteGenerator(false)} />
        )}

        {showLeonardoGenerator && (
          <LeonardoGenerator onClose={() => setShowLeonardoGenerator(false)} />
        )}

        {showCharacterGenerator && (
          <CharacterGenerator onClose={() => setShowCharacterGenerator(false)} />
        )}
      </div>
    );
  }

  // Story mode - full game
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
              <span className="bg-white/10 px-2 py-1 rounded border border-white/10">WASD / Setas mover</span>
              <span className="bg-white/10 px-2 py-1 rounded border border-white/10">SPACE / ENTER falar</span>
              <span className="bg-white/10 px-2 py-1 rounded border border-white/10">[I] Inventario</span>
            </div>
          </div>

          <div className="bg-white/5 text-[11px] text-slate-200 px-3 py-2 rounded-md border border-white/10 backdrop-blur pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.2)]" />
              <span className="uppercase tracking-[0.08em] text-xs font-semibold">Ala Clinica - Turno da Noite</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300">Fale com a equipe e pacientes para avancar.</p>
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
            ACAO
          </button>
        </div>
      )}

      {/* Status badge and menu button */}
      {!activeNpc && (
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
          <button
            onClick={() => setGameMode('menu')}
            className="bg-slate-800/80 hover:bg-slate-700 text-white text-xs px-3 py-2 rounded border border-white/20 shadow-lg backdrop-blur"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
          >
            MENU
          </button>
          <button
            onClick={() => setIsInventoryOpen(true)}
            className="bg-amber-600/80 hover:bg-amber-500 text-white text-xs px-3 py-2 rounded border border-amber-400/30 shadow-lg backdrop-blur flex items-center gap-2"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
          >
            <span>🎒</span> INVENTARIO
          </button>
          <button
            onClick={() => setShowClinicalCases(true)}
            className="bg-red-600/80 hover:bg-red-500 text-white text-xs px-3 py-2 rounded border border-red-400/30 shadow-lg backdrop-blur flex items-center gap-2"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
          >
            <span>📋</span> CASOS
          </button>
          <div className="bg-slate-900/70 text-white px-3 py-2 rounded-lg border border-emerald-400/30 shadow-[0_8px_30px_rgba(52,211,153,0.16)] backdrop-blur flex items-center gap-2 text-xs pointer-events-none">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="uppercase tracking-[0.08em] font-semibold">Pronto para interacao</span>
          </div>
        </div>
      )}

      {/* Editor & Tools buttons (Story mode) */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        <button
          onClick={() => setShowMapEditor(true)}
          className="bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded border border-emerald-400/30 shadow-lg backdrop-blur font-semibold"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
        >
          EDITOR DE MAPAS
        </button>
        <button
          onClick={() => setShowSpriteGenerator(true)}
          className="bg-purple-600/90 hover:bg-purple-500 text-white text-xs px-4 py-2 rounded border border-purple-400/30 shadow-lg backdrop-blur font-semibold"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
        >
          GERAR SPRITES (AI)
        </button>
        <button
          onClick={() => setShowLeonardoGenerator(true)}
          className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 hover:from-purple-500 hover:to-pink-500 text-white text-xs px-4 py-2 rounded border border-purple-400/30 shadow-lg backdrop-blur font-semibold"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
        >
          LEONARDO AI
        </button>
        <button
          onClick={() => setShowCharacterGenerator(true)}
          className="bg-cyan-600/90 hover:bg-cyan-500 text-white text-xs px-4 py-2 rounded border border-cyan-400/30 shadow-lg backdrop-blur font-semibold"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
        >
          CRIAR PERSONAGEM
        </button>
        <button
          onClick={() => setShowTilePicker(true)}
          className="bg-slate-800/80 text-white text-xs px-3 py-2 rounded border border-white/10 shadow-lg backdrop-blur"
        >
          Tile Picker
        </button>
      </div>

      {activeNpc && (
        <RPGDialogueBox
          npc={activeNpc}
          onClose={() => setActiveNpc(null)}
        />
      )}

      {/* Map Editor */}
      {showMapEditor && (
        <MapEditor
          onClose={() => setShowMapEditor(false)}
        />
      )}

      {/* Sprite Generator (PixelLab AI) */}
      {showSpriteGenerator && (
        <SpriteGenerator
          onClose={() => setShowSpriteGenerator(false)}
        />
      )}

      {/* Character Generator (LimeZu) */}
      {showCharacterGenerator && (
        <CharacterGenerator
          onClose={() => setShowCharacterGenerator(false)}
        />
      )}

      {/* Inventory */}
      <Inventory
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        items={inventoryItems}
        onUseItem={handleUseItem}
        onDropItem={handleDropItem}
      />

      {/* Leonardo AI Generator */}
      {showLeonardoGenerator && (
        <LeonardoGenerator
          onClose={() => setShowLeonardoGenerator(false)}
        />
      )}

      {/* Tile Picker */}
      {showTilePicker && (
        <TilePicker
          onClose={() => setShowTilePicker(false)}
        />
      )}

      {/* Clinical Cases */}
      <ClinicalCaseViewer
        isOpen={showClinicalCases}
        onClose={() => setShowClinicalCases(false)}
      />
    </div>
  );
};

export default App;
