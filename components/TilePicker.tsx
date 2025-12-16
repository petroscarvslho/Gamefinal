/**
 * TilePicker - Ferramenta visual para mapear sprites do LimeZu
 * Permite clicar no sprite sheet e associar a um TileType
 */
import React, { useState, useRef, useEffect } from 'react';
import { TileType } from '../types';
import { SPRITE_SHEETS, TILE_SPRITES, SpriteMapping, tilesetManager } from '../services/tilesetManager';

interface TilePickerProps {
  onClose: () => void;
  onMappingChange?: (mappings: Record<string, SpriteMapping>) => void;
}

// Lista de TileTypes disponíveis para mapear
const MAPPABLE_TILES: { type: TileType; name: string; category: string }[] = [
  // Estrutura
  { type: TileType.WALL, name: 'Parede', category: 'Estrutura' },
  { type: TileType.DOOR, name: 'Porta', category: 'Estrutura' },
  { type: TileType.FLOOR, name: 'Piso Normal', category: 'Estrutura' },
  { type: TileType.FLOOR_OR, name: 'Piso Centro Cirúrgico', category: 'Estrutura' },

  // Mobiliário Hospital
  { type: TileType.BED, name: 'Cama', category: 'Hospital' },
  { type: TileType.OR_TABLE, name: 'Mesa Cirúrgica', category: 'Hospital' },
  { type: TileType.DELIVERY_BED, name: 'Cama Parto', category: 'Hospital' },
  { type: TileType.STRETCHER, name: 'Maca', category: 'Hospital' },

  // Monitores
  { type: TileType.PATIENT_MONITOR, name: 'Monitor Paciente', category: 'Monitores' },
  { type: TileType.BIS_MONITOR, name: 'Monitor BIS', category: 'Monitores' },
  { type: TileType.FETAL_MONITOR, name: 'Monitor Fetal', category: 'Monitores' },

  // Equipamentos Anestesia
  { type: TileType.ANESTHESIA_MACHINE, name: 'Máquina Anestesia', category: 'Anestesia' },
  { type: TileType.VENTILATOR, name: 'Ventilador', category: 'Anestesia' },
  { type: TileType.DEFIBRILLATOR, name: 'Desfibrilador', category: 'Anestesia' },
  { type: TileType.IV_STAND, name: 'Suporte Soro', category: 'Anestesia' },
  { type: TileType.DRUG_CART, name: 'Carrinho Drogas', category: 'Anestesia' },
  { type: TileType.CRASH_CART, name: 'Crash Cart', category: 'Anestesia' },
  { type: TileType.INTUBATION_CART, name: 'Carrinho Intubação', category: 'Anestesia' },
  { type: TileType.OXYGEN_TANK, name: 'Cilindro O2', category: 'Anestesia' },
  { type: TileType.SYRINGE_PUMP, name: 'Bomba Seringa', category: 'Anestesia' },

  // Equipamentos Cirúrgicos
  { type: TileType.INSTRUMENT_TABLE, name: 'Mesa Instrumentos', category: 'Cirurgia' },
  { type: TileType.BACK_TABLE, name: 'Mesa Apoio', category: 'Cirurgia' },
  { type: TileType.MAYO_STAND, name: 'Mesa Mayo', category: 'Cirurgia' },
  { type: TileType.C_ARM, name: 'Arco em C', category: 'Cirurgia' },
  { type: TileType.SURGICAL_MICROSCOPE, name: 'Microscópio', category: 'Cirurgia' },
  { type: TileType.ELECTROSURGICAL_UNIT, name: 'Bisturi Elétrico', category: 'Cirurgia' },
  { type: TileType.LAPAROSCOPY_TOWER, name: 'Torre Laparo', category: 'Cirurgia' },
  { type: TileType.SURGICAL_LIGHT, name: 'Foco Cirúrgico', category: 'Cirurgia' },
  { type: TileType.SUCTION_MACHINE, name: 'Aspirador', category: 'Cirurgia' },

  // Diagnóstico
  { type: TileType.MRI_MACHINE, name: 'Ressonância', category: 'Diagnóstico' },
  { type: TileType.ULTRASOUND, name: 'Ultrassom', category: 'Diagnóstico' },

  // Especialidades Cardíaca
  { type: TileType.CEC_MACHINE, name: 'Máquina CEC', category: 'Cardíaca' },
  { type: TileType.IABP, name: 'Balão Intra-Aórtico', category: 'Cardíaca' },
  { type: TileType.CELL_SAVER, name: 'Cell Saver', category: 'Cardíaca' },

  // Neonatal
  { type: TileType.INFANT_WARMER, name: 'Berço Aquecido', category: 'Neonatal' },
  { type: TileType.WARMER, name: 'Aquecedor', category: 'Neonatal' },

  // Mobiliário Geral
  { type: TileType.CABINET, name: 'Armário', category: 'Mobília' },
  { type: TileType.LOCKERS, name: 'Lockers', category: 'Mobília' },
  { type: TileType.REFRIGERATOR, name: 'Geladeira', category: 'Mobília' },
  { type: TileType.SINK, name: 'Pia', category: 'Mobília' },
  { type: TileType.DESK_RECEPTION, name: 'Balcão Recepção', category: 'Mobília' },
  { type: TileType.COMPUTER_DESK, name: 'Mesa Computador', category: 'Mobília' },
  { type: TileType.CHAIR_WAITING, name: 'Cadeira Espera', category: 'Mobília' },
  { type: TileType.SOFA, name: 'Sofá', category: 'Mobília' },
  { type: TileType.DINING_TABLE, name: 'Mesa Refeitório', category: 'Mobília' },

  // Decoração
  { type: TileType.PLANT, name: 'Planta', category: 'Decoração' },
  { type: TileType.VENDING_MACHINE, name: 'Máquina Vendas', category: 'Decoração' },
  { type: TileType.WHEELCHAIR, name: 'Cadeira Rodas', category: 'Decoração' },
];

const TilePicker: React.FC<TilePickerProps> = ({ onClose, onMappingChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSheet, setSelectedSheet] = useState<keyof typeof SPRITE_SHEETS>('hospital');
  const [sheetImage, setSheetImage] = useState<HTMLImageElement | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [selectedTileType, setSelectedTileType] = useState<TileType | null>(null);
  const [mappings, setMappings] = useState<Record<string, SpriteMapping>>({});
  const [zoom, setZoom] = useState(2);
  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const TILE_SIZE = 32;

  // Carrega imagem do sprite sheet
  useEffect(() => {
    const img = new Image();
    img.onload = () => setSheetImage(img);
    img.src = SPRITE_SHEETS[selectedSheet];
  }, [selectedSheet]);

  // Carrega mapeamentos existentes
  useEffect(() => {
    const saved = localStorage.getItem('tilePicker_mappings');
    if (saved) {
      setMappings(JSON.parse(saved));
    }
  }, []);

  // Renderiza sprite sheet no canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sheetImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidth = sheetImage.width * zoom;
    const displayHeight = sheetImage.height * zoom;

    canvas.width = Math.min(displayWidth, 800);
    canvas.height = Math.min(displayHeight, 500);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sheetImage,
      scrollPos.x, scrollPos.y,
      canvas.width / zoom, canvas.height / zoom,
      0, 0,
      canvas.width, canvas.height
    );

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    const tileDisplaySize = TILE_SIZE * zoom;

    for (let x = 0; x < canvas.width; x += tileDisplaySize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += tileDisplaySize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Highlight hover
    if (hoveredTile) {
      const hx = (hoveredTile.x * TILE_SIZE - scrollPos.x) * zoom;
      const hy = (hoveredTile.y * TILE_SIZE - scrollPos.y) * zoom;
      ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
      ctx.fillRect(hx, hy, tileDisplaySize, tileDisplaySize);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx, hy, tileDisplaySize, tileDisplaySize);
    }

    // Highlight selected
    if (selectedTile) {
      const sx = (selectedTile.x * TILE_SIZE - scrollPos.x) * zoom;
      const sy = (selectedTile.y * TILE_SIZE - scrollPos.y) * zoom;
      ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.fillRect(sx, sy, tileDisplaySize, tileDisplaySize);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx, sy, tileDisplaySize, tileDisplaySize);
    }

  }, [sheetImage, zoom, scrollPos, hoveredTile, selectedTile]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const tileX = Math.floor((x / zoom + scrollPos.x) / TILE_SIZE);
    const tileY = Math.floor((y / zoom + scrollPos.y) / TILE_SIZE);

    setHoveredTile({ x: tileX, y: tileY });
  };

  const handleCanvasClick = () => {
    if (hoveredTile) {
      setSelectedTile({ ...hoveredTile });
    }
  };

  const handleScroll = (e: React.WheelEvent) => {
    if (!sheetImage) return;

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      e.preventDefault();
      const newZoom = Math.max(1, Math.min(4, zoom + (e.deltaY > 0 ? -0.5 : 0.5)));
      setZoom(newZoom);
    } else {
      // Scroll
      const maxX = Math.max(0, sheetImage.width - 800 / zoom);
      const maxY = Math.max(0, sheetImage.height - 500 / zoom);
      setScrollPos(prev => ({
        x: Math.max(0, Math.min(maxX, prev.x + e.deltaX)),
        y: Math.max(0, Math.min(maxY, prev.y + e.deltaY)),
      }));
    }
  };

  const saveMapping = () => {
    if (!selectedTile || !selectedTileType) return;

    const newMappings = {
      ...mappings,
      [selectedTileType]: {
        sheet: selectedSheet,
        x: selectedTile.x,
        y: selectedTile.y,
      } as SpriteMapping,
    };

    setMappings(newMappings);
    localStorage.setItem('tilePicker_mappings', JSON.stringify(newMappings));

    // Atualiza tilesetManager imediatamente para refletir no jogo
    tilesetManager.updateMappings(newMappings as Partial<Record<TileType, SpriteMapping>>);

    if (onMappingChange) {
      onMappingChange(newMappings);
    }

    console.log(`TilePicker: Mapeado ${MAPPABLE_TILES.find(t => t.type === selectedTileType)?.name} → ${selectedSheet}(${selectedTile.x}, ${selectedTile.y})`);
  };

  const exportMappings = () => {
    const code = Object.entries(mappings)
      .map(([type, mapping]) => {
        const m = mapping as SpriteMapping;
        return `  [TileType.${type}]: { sheet: '${m.sheet}', x: ${m.x}, y: ${m.y} },`;
      })
      .join('\n');

    const fullCode = `export const TILE_SPRITES: Partial<Record<TileType, SpriteMapping>> = {\n${code}\n};`;

    navigator.clipboard.writeText(fullCode);
    alert('Código copiado para a área de transferência!');
  };

  const categories = ['all', ...new Set(MAPPABLE_TILES.map(t => t.category))];
  const filteredTiles = filterCategory === 'all'
    ? MAPPABLE_TILES
    : MAPPABLE_TILES.filter(t => t.category === filterCategory);

  return (
    <div className="fixed inset-0 z-[80] bg-black/95 flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-cyan-400 text-lg" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          TILE PICKER
        </h2>
        <div className="flex gap-2">
          <button
            onClick={exportMappings}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white text-sm"
          >
            Exportar Código
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm"
          >
            Fechar
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Sprite Sheet Viewer */}
        <div className="flex-1 flex flex-col">
          {/* Sheet selector */}
          <div className="flex gap-2 mb-2">
            {Object.keys(SPRITE_SHEETS).map(sheet => (
              <button
                key={sheet}
                onClick={() => setSelectedSheet(sheet as keyof typeof SPRITE_SHEETS)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedSheet === sheet
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {sheet}
              </button>
            ))}
            <span className="text-slate-400 text-sm ml-4">
              Zoom: {zoom}x | Scroll: roda do mouse | Zoom: Ctrl+roda
            </span>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden rounded-lg border border-slate-700">
            <canvas
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onClick={handleCanvasClick}
              onWheel={handleScroll}
              className="cursor-crosshair"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* Info */}
          <div className="mt-2 flex gap-4 text-sm">
            {hoveredTile && (
              <span className="text-slate-400">
                Hover: ({hoveredTile.x}, {hoveredTile.y})
              </span>
            )}
            {selectedTile && (
              <span className="text-green-400">
                Selecionado: ({selectedTile.x}, {selectedTile.y})
              </span>
            )}
          </div>
        </div>

        {/* Tile Type Selector */}
        <div className="w-80 flex flex-col bg-slate-800 rounded-lg p-4">
          <h3 className="text-cyan-400 text-sm font-bold mb-3">SELECIONE O TILE TYPE</h3>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1 mb-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-1 rounded text-xs ${
                  filterCategory === cat
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>

          {/* Tile list */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredTiles.map(tile => {
              const hasMapping = mappings[tile.type];
              return (
                <button
                  key={tile.type}
                  onClick={() => setSelectedTileType(tile.type)}
                  className={`w-full px-3 py-2 rounded text-left text-sm flex items-center justify-between ${
                    selectedTileType === tile.type
                      ? 'bg-cyan-600 text-white'
                      : hasMapping
                      ? 'bg-green-900/50 text-green-300 hover:bg-green-800/50'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <span>{tile.name}</span>
                  {hasMapping && <span className="text-xs opacity-70">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Save button */}
          <button
            onClick={saveMapping}
            disabled={!selectedTile || !selectedTileType}
            className={`mt-4 w-full py-3 rounded font-bold text-sm ${
              selectedTile && selectedTileType
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            SALVAR MAPEAMENTO
          </button>

          {/* Preview */}
          {selectedTile && sheetImage && (
            <div className="mt-4 p-3 bg-slate-900 rounded-lg">
              <p className="text-slate-400 text-xs mb-2">Preview:</p>
              <canvas
                width={64}
                height={64}
                className="mx-auto"
                style={{ imageRendering: 'pixelated' }}
                ref={previewCanvas => {
                  if (!previewCanvas) return;
                  const ctx = previewCanvas.getContext('2d');
                  if (!ctx) return;
                  ctx.imageSmoothingEnabled = false;
                  ctx.fillStyle = '#0f172a';
                  ctx.fillRect(0, 0, 64, 64);
                  ctx.drawImage(
                    sheetImage,
                    selectedTile.x * TILE_SIZE,
                    selectedTile.y * TILE_SIZE,
                    TILE_SIZE,
                    TILE_SIZE,
                    0, 0, 64, 64
                  );
                }}
              />
            </div>
          )}

          {/* Mappings count */}
          <div className="mt-4 text-center text-slate-500 text-xs">
            {Object.keys(mappings).length} tiles mapeados
          </div>
        </div>
      </div>
    </div>
  );
};

export default TilePicker;
