/**
 * TilePalette - Seletor de tiles para o editor de mapas
 */
import React from 'react';
import { TileType } from '../types';
import { PALETTE } from '../constants';

interface TilePaletteProps {
  selectedTile: TileType;
  onSelectTile: (tile: TileType) => void;
}

// Definição dos tiles disponíveis com metadados
const TILE_CATEGORIES = [
  {
    name: 'Estrutura',
    tiles: [
      { type: TileType.FLOOR, name: 'Chão', icon: '▢' },
      { type: TileType.FLOOR_OR, name: 'Chão Centro Cirúrgico', icon: '▣' },
      { type: TileType.WALL, name: 'Parede', icon: '▮' },
      { type: TileType.DOOR, name: 'Porta', icon: '⊡' },
    ]
  },
  {
    name: 'Móveis',
    tiles: [
      { type: TileType.BED, name: 'Cama', icon: '🛏' },
      { type: TileType.CHAIR_WAITING, name: 'Cadeira', icon: '💺' },
      { type: TileType.DESK_RECEPTION, name: 'Balcão', icon: '▬' },
      { type: TileType.COMPUTER_DESK, name: 'Computador', icon: '🖥' },
      { type: TileType.CABINET, name: 'Armário', icon: '🗄' },
      { type: TileType.OR_TABLE, name: 'Mesa Cirúrgica', icon: '⊟' },
      { type: TileType.SINK, name: 'Pia', icon: '🚰' },
    ]
  },
  {
    name: 'Equipamentos',
    tiles: [
      { type: TileType.MRI_MACHINE, name: 'Ressonância', icon: '◎' },
      { type: TileType.VENDING_MACHINE, name: 'Máquina Venda', icon: '🏧' },
    ]
  },
  {
    name: 'Decoração',
    tiles: [
      { type: TileType.PLANT, name: 'Planta', icon: '🌿' },
    ]
  }
];

// Cores de preview para cada tipo de tile
const getTileColor = (type: TileType): string => {
  switch (type) {
    case TileType.FLOOR: return PALETTE.floorBase;
    case TileType.FLOOR_OR: return PALETTE.floorOR;
    case TileType.WALL: return PALETTE.wallBase;
    case TileType.DOOR: return '#94a3b8';
    case TileType.BED: return PALETTE.bedSheet;
    case TileType.CHAIR_WAITING: return '#3b82f6';
    case TileType.DESK_RECEPTION: return PALETTE.woodLight;
    case TileType.COMPUTER_DESK: return '#0ea5e9';
    case TileType.CABINET: return PALETTE.woodLight;
    case TileType.OR_TABLE: return PALETTE.metalLight;
    case TileType.SINK: return PALETTE.metalBase;
    case TileType.MRI_MACHINE: return PALETTE.metalLight;
    case TileType.VENDING_MACHINE: return PALETTE.plasticRed;
    case TileType.PLANT: return '#166534';
    default: return '#64748b';
  }
};

const TilePalette: React.FC<TilePaletteProps> = ({ selectedTile, onSelectTile }) => {
  return (
    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 w-56 max-h-[80vh] overflow-y-auto">
      <h3
        className="text-cyan-400 text-xs mb-3 pb-2 border-b border-cyan-500/20"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        TILES
      </h3>

      {TILE_CATEGORIES.map(category => (
        <div key={category.name} className="mb-4">
          <h4 className="text-slate-400 text-[10px] uppercase tracking-wider mb-2">
            {category.name}
          </h4>
          <div className="grid grid-cols-4 gap-1">
            {category.tiles.map(tile => (
              <button
                key={tile.type}
                onClick={() => onSelectTile(tile.type)}
                className={`
                  relative w-12 h-12 rounded border-2 transition-all
                  flex flex-col items-center justify-center gap-1
                  ${selectedTile === tile.type
                    ? 'border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)] scale-105'
                    : 'border-slate-700 hover:border-slate-500'
                  }
                `}
                title={tile.name}
              >
                {/* Preview do tile */}
                <div
                  className="w-7 h-7 rounded-sm border border-slate-600"
                  style={{ backgroundColor: getTileColor(tile.type) }}
                />
                {/* Nome curto ou ícone */}
                <span className="text-[8px] text-slate-400 truncate max-w-full px-0.5">
                  {tile.icon}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Ferramentas */}
      <div className="mt-4 pt-3 border-t border-cyan-500/20">
        <h4 className="text-slate-400 text-[10px] uppercase tracking-wider mb-2">
          Ferramentas
        </h4>
        <div className="flex gap-2">
          <button
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 text-[10px]"
            title="Borracha (usa Chão)"
            onClick={() => onSelectTile(TileType.FLOOR)}
          >
            🧹 Limpar
          </button>
        </div>
      </div>

      {/* Tile selecionado */}
      <div className="mt-4 pt-3 border-t border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded border-2 border-cyan-400"
            style={{ backgroundColor: getTileColor(selectedTile) }}
          />
          <div>
            <p className="text-white text-[10px]">
              {TILE_CATEGORIES.flatMap(c => c.tiles).find(t => t.type === selectedTile)?.name || 'Tile'}
            </p>
            <p className="text-slate-500 text-[8px]">Selecionado</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TilePalette;
