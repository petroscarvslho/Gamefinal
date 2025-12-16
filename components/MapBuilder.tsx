import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SPRITE_SHEETS, SPRITE_SIZE, tilesetManager, SpriteMapping } from '../services/tilesetManager';
import { TileType } from '../types';
import { INITIAL_MAP, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../constants';

interface MapBuilderProps {
  onClose: () => void;
}

// Configuração dos sprite sheets para o seletor
const SHEET_CONFIG = {
  floors: { name: 'Pisos', cols: 15, rows: 40 },
  walls: { name: 'Paredes', cols: 32, rows: 40 },
  hospital: { name: 'Hospital', cols: 16, rows: 110 },
  interiors: { name: 'Interiores', cols: 48, rows: 400 },
  generic: { name: 'Genérico', cols: 48, rows: 64 },
  bathroom: { name: 'Banheiro', cols: 48, rows: 64 },
  roomBuilder: { name: 'Room Builder', cols: 76, rows: 113 },
};

const MapBuilder: React.FC<MapBuilderProps> = ({ onClose }) => {
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const tileCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Estados
  const [selectedSheet, setSelectedSheet] = useState<keyof typeof SPRITE_SHEETS>('floors');
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [mapData, setMapData] = useState<number[][][]>(() => {
    // Converte INITIAL_MAP para formato com sheet + x + y
    return INITIAL_MAP.map(row =>
      row.map(tile => {
        // Mapeia TileType para coordenadas do sprite sheet
        const mapping = getMappingForTileType(tile);
        return [getSheetIndex(mapping.sheet), mapping.x, mapping.y];
      })
    );
  });
  const [zoom, setZoom] = useState(1);
  const [tileZoom, setTileZoom] = useState(2);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [tileScroll, setTileScroll] = useState(0);
  const [sheetImages, setSheetImages] = useState<Record<string, HTMLImageElement>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [brushSize, setBrushSize] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const lastPaintPos = useRef<{ x: number; y: number } | null>(null);

  // Helper para obter índice do sheet
  function getSheetIndex(sheet: keyof typeof SPRITE_SHEETS): number {
    const sheets = Object.keys(SPRITE_SHEETS);
    return sheets.indexOf(sheet);
  }

  // Helper para obter sheet do índice
  function getSheetFromIndex(index: number): keyof typeof SPRITE_SHEETS {
    const sheets = Object.keys(SPRITE_SHEETS) as (keyof typeof SPRITE_SHEETS)[];
    return sheets[index] || 'floors';
  }

  // Helper para obter mapeamento de TileType
  function getMappingForTileType(tile: TileType): SpriteMapping {
    const mappings: Record<TileType, SpriteMapping> = {
      [TileType.FLOOR]: { sheet: 'floors', x: 1, y: 33 },
      [TileType.WALL]: { sheet: 'walls', x: 0, y: 0 },
      [TileType.FLOOR_OR]: { sheet: 'floors', x: 1, y: 35 },
      [TileType.DOOR]: { sheet: 'roomBuilder', x: 47, y: 86 },
      [TileType.BED]: { sheet: 'hospital', x: 1, y: 1 },
      [TileType.OR_TABLE]: { sheet: 'hospital', x: 1, y: 9 },
      [TileType.ANESTHESIA_MACHINE]: { sheet: 'hospital', x: 1, y: 29 },
      [TileType.PATIENT_MONITOR]: { sheet: 'hospital', x: 1, y: 25 },
      [TileType.IV_STAND]: { sheet: 'hospital', x: 1, y: 33 },
      [TileType.CABINET]: { sheet: 'hospital', x: 1, y: 21 },
      [TileType.SINK]: { sheet: 'hospital', x: 1, y: 53 },
      [TileType.COMPUTER_DESK]: { sheet: 'hospital', x: 5, y: 57 },
      [TileType.DESK_RECEPTION]: { sheet: 'hospital', x: 1, y: 57 },
      [TileType.CHAIR_WAITING]: { sheet: 'hospital', x: 1, y: 61 },
      [TileType.SOFA]: { sheet: 'hospital', x: 9, y: 57 },
      [TileType.PLANT]: { sheet: 'hospital', x: 1, y: 65 },
      [TileType.VENDING_MACHINE]: { sheet: 'hospital', x: 5, y: 65 },
      [TileType.WHEELCHAIR]: { sheet: 'hospital', x: 5, y: 61 },
      [TileType.STRETCHER]: { sheet: 'hospital', x: 1, y: 5 },
      [TileType.CRASH_CART]: { sheet: 'hospital', x: 5, y: 17 },
      [TileType.DRUG_CART]: { sheet: 'hospital', x: 1, y: 17 },
      [TileType.DEFIBRILLATOR]: { sheet: 'hospital', x: 9, y: 29 },
      [TileType.SURGICAL_LIGHT]: { sheet: 'hospital', x: 13, y: 37 },
      [TileType.MRI_MACHINE]: { sheet: 'hospital', x: 1, y: 13 },
      [TileType.ULTRASOUND]: { sheet: 'hospital', x: 9, y: 41 },
      [TileType.VENTILATOR]: { sheet: 'hospital', x: 5, y: 29 },
      [TileType.OXYGEN_TANK]: { sheet: 'hospital', x: 13, y: 33 },
      [TileType.SYRINGE_PUMP]: { sheet: 'hospital', x: 3, y: 33 },
      [TileType.BIS_MONITOR]: { sheet: 'hospital', x: 3, y: 25 },
      [TileType.INSTRUMENT_TABLE]: { sheet: 'hospital', x: 1, y: 37 },
      [TileType.BACK_TABLE]: { sheet: 'hospital', x: 5, y: 37 },
      [TileType.MAYO_STAND]: { sheet: 'hospital', x: 9, y: 37 },
      [TileType.SUCTION_MACHINE]: { sheet: 'hospital', x: 1, y: 41 },
      [TileType.FETAL_MONITOR]: { sheet: 'hospital', x: 5, y: 25 },
      [TileType.C_ARM]: { sheet: 'hospital', x: 5, y: 13 },
      [TileType.DELIVERY_BED]: { sheet: 'hospital', x: 9, y: 9 },
      [TileType.INFANT_WARMER]: { sheet: 'hospital', x: 1, y: 49 },
      [TileType.INTUBATION_CART]: { sheet: 'hospital', x: 9, y: 17 },
      [TileType.CEC_MACHINE]: { sheet: 'hospital', x: 1, y: 45 },
      [TileType.IABP]: { sheet: 'hospital', x: 5, y: 45 },
      [TileType.CELL_SAVER]: { sheet: 'hospital', x: 9, y: 45 },
      [TileType.WARMER]: { sheet: 'hospital', x: 5, y: 49 },
      [TileType.LOCKERS]: { sheet: 'hospital', x: 5, y: 21 },
      [TileType.REFRIGERATOR]: { sheet: 'hospital', x: 9, y: 21 },
      [TileType.DINING_TABLE]: { sheet: 'hospital', x: 13, y: 57 },
    };
    return mappings[tile] || { sheet: 'floors', x: 0, y: 0 };
  }

  // Carregar imagens dos sprite sheets
  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      const images: Record<string, HTMLImageElement> = {};

      await Promise.all(
        Object.entries(SPRITE_SHEETS).map(([key, path]) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              images[key] = img;
              resolve();
            };
            img.onerror = () => resolve();
            img.src = path;
          })
        )
      );

      setSheetImages(images);
      setIsLoading(false);
    };

    loadImages();
  }, []);

  // Renderizar o seletor de tiles
  useEffect(() => {
    if (!tileCanvasRef.current || !sheetImages[selectedSheet]) return;

    const canvas = tileCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = sheetImages[selectedSheet];
    const config = SHEET_CONFIG[selectedSheet as keyof typeof SHEET_CONFIG];
    const tileDisplaySize = SPRITE_SIZE * tileZoom;

    // Calcular quantas tiles cabem na largura do canvas
    const tilesPerRow = Math.floor(400 / tileDisplaySize);
    const totalRows = Math.ceil(config.cols * config.rows / tilesPerRow);

    canvas.width = tilesPerRow * tileDisplaySize;
    canvas.height = Math.min(totalRows * tileDisplaySize, 500);

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const startRow = Math.floor(tileScroll / tileDisplaySize);
    const visibleRows = Math.ceil(canvas.height / tileDisplaySize) + 1;

    for (let i = 0; i < tilesPerRow * visibleRows; i++) {
      const globalIndex = startRow * tilesPerRow + i;
      const srcY = Math.floor(globalIndex / config.cols);
      const srcX = globalIndex % config.cols;

      if (srcY >= config.rows) continue;

      const destX = (i % tilesPerRow) * tileDisplaySize;
      const destY = Math.floor(i / tilesPerRow) * tileDisplaySize - (tileScroll % tileDisplaySize);

      if (destY + tileDisplaySize < 0 || destY > canvas.height) continue;

      ctx.drawImage(
        img,
        srcX * SPRITE_SIZE, srcY * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE,
        destX, destY, tileDisplaySize, tileDisplaySize
      );

      // Highlight selected tile
      if (selectedTile && srcX === selectedTile.x && srcY === selectedTile.y) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.strokeRect(destX + 1, destY + 1, tileDisplaySize - 2, tileDisplaySize - 2);
      }

      // Mostrar coordenadas ao passar o mouse
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(destX, destY + tileDisplaySize - 12, tileDisplaySize, 12);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '8px monospace';
      ctx.fillText(`${srcX},${srcY}`, destX + 2, destY + tileDisplaySize - 3);
    }
  }, [selectedSheet, sheetImages, tileScroll, tileZoom, selectedTile]);

  // Renderizar preview da tile selecionada
  useEffect(() => {
    if (!previewCanvasRef.current || !selectedTile || !sheetImages[selectedSheet]) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 96, 96);

    ctx.drawImage(
      sheetImages[selectedSheet],
      selectedTile.x * SPRITE_SIZE, selectedTile.y * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE,
      0, 0, 96, 96
    );
  }, [selectedTile, selectedSheet, sheetImages]);

  // Renderizar o mapa
  useEffect(() => {
    if (!mapCanvasRef.current) return;

    const canvas = mapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displaySize = TILE_SIZE * zoom;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const startX = Math.max(0, Math.floor(camera.x / displaySize));
    const startY = Math.max(0, Math.floor(camera.y / displaySize));
    const endX = Math.min(MAP_WIDTH, startX + Math.ceil(canvas.width / displaySize) + 1);
    const endY = Math.min(MAP_HEIGHT, startY + Math.ceil(canvas.height / displaySize) + 1);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const [sheetIdx, tileX, tileY] = mapData[y]?.[x] || [0, 0, 0];
        const sheetKey = getSheetFromIndex(sheetIdx);
        const img = sheetImages[sheetKey];

        const destX = x * displaySize - camera.x;
        const destY = y * displaySize - camera.y;

        if (img) {
          ctx.drawImage(
            img,
            tileX * SPRITE_SIZE, tileY * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE,
            destX, destY, displaySize, displaySize
          );
        } else {
          // Fallback color
          ctx.fillStyle = '#334155';
          ctx.fillRect(destX, destY, displaySize, displaySize);
        }

        // Grid
        if (showGrid) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.strokeRect(destX, destY, displaySize, displaySize);
        }
      }
    }
  }, [mapData, camera, zoom, sheetImages, showGrid]);

  // Handler para clicar no seletor de tiles
  const handleTileClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tileCanvasRef.current) return;

    const rect = tileCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top + tileScroll;

    const tileDisplaySize = SPRITE_SIZE * tileZoom;
    const tilesPerRow = Math.floor(400 / tileDisplaySize);
    const config = SHEET_CONFIG[selectedSheet as keyof typeof SHEET_CONFIG];

    const clickedCol = Math.floor(x / tileDisplaySize);
    const clickedRow = Math.floor(y / tileDisplaySize);
    const globalIndex = clickedRow * tilesPerRow + clickedCol;

    const srcY = Math.floor(globalIndex / config.cols);
    const srcX = globalIndex % config.cols;

    if (srcX < config.cols && srcY < config.rows) {
      setSelectedTile({ x: srcX, y: srcY });
    }
  }, [selectedSheet, tileScroll, tileZoom]);

  // Handler para pintar no mapa
  const paintAtPosition = useCallback((canvasX: number, canvasY: number) => {
    if (!selectedTile || !mapCanvasRef.current) return;

    const displaySize = TILE_SIZE * zoom;
    const tileX = Math.floor((canvasX + camera.x) / displaySize);
    const tileY = Math.floor((canvasY + camera.y) / displaySize);

    // Aplicar com tamanho do brush
    const newMapData = [...mapData];
    const halfBrush = Math.floor(brushSize / 2);

    for (let dy = -halfBrush; dy <= halfBrush; dy++) {
      for (let dx = -halfBrush; dx <= halfBrush; dx++) {
        const nx = tileX + dx;
        const ny = tileY + dy;

        if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
          newMapData[ny] = [...newMapData[ny]];
          newMapData[ny][nx] = [getSheetIndex(selectedSheet), selectedTile.x, selectedTile.y];
        }
      }
    }

    setMapData(newMapData);
  }, [selectedTile, selectedSheet, camera, zoom, mapData, brushSize]);

  // Handler para clique no mapa
  const handleMapMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0 && selectedTile) {
      setIsPainting(true);
      const rect = mapCanvasRef.current?.getBoundingClientRect();
      if (rect) {
        paintAtPosition(e.clientX - rect.left, e.clientY - rect.top);
        lastPaintPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }
    } else if (e.button === 2) {
      setIsDragging(true);
    }
  }, [selectedTile, paintAtPosition]);

  const handleMapMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setCamera(prev => ({
        x: Math.max(0, prev.x - e.movementX),
        y: Math.max(0, prev.y - e.movementY)
      }));
    } else if (isPainting && selectedTile) {
      const rect = mapCanvasRef.current?.getBoundingClientRect();
      if (rect) {
        paintAtPosition(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  }, [isDragging, isPainting, selectedTile, paintAtPosition]);

  const handleMapMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPainting(false);
    lastPaintPos.current = null;
  }, []);

  // Scroll no seletor de tiles
  const handleTileScroll = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setTileScroll(prev => Math.max(0, prev + e.deltaY));
  }, []);

  // Salvar mapa
  const saveMap = useCallback(() => {
    const data = JSON.stringify(mapData);
    localStorage.setItem('mapBuilder_savedMap', data);
    alert('Mapa salvo!');
  }, [mapData]);

  // Carregar mapa
  const loadMap = useCallback(() => {
    const saved = localStorage.getItem('mapBuilder_savedMap');
    if (saved) {
      setMapData(JSON.parse(saved));
      alert('Mapa carregado!');
    }
  }, []);

  // Exportar como código
  const exportCode = useCallback(() => {
    const code = `// Mapa exportado do MapBuilder\nexport const CUSTOM_MAP = ${JSON.stringify(mapData, null, 2)};`;
    navigator.clipboard.writeText(code);
    alert('Código copiado para a área de transferência!');
  }, [mapData]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
        <div className="text-cyan-400 text-xl">Carregando sprite sheets...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex z-50">
      {/* Painel Esquerdo - Seletor de Tiles */}
      <div className="w-[450px] bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-3 border-b border-slate-700">
          <h2 className="text-cyan-400 font-bold mb-2">SELETOR DE TILES</h2>

          {/* Tabs de Sprite Sheets */}
          <div className="flex flex-wrap gap-1 mb-2">
            {Object.entries(SHEET_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => { setSelectedSheet(key as keyof typeof SPRITE_SHEETS); setTileScroll(0); }}
                className={`px-2 py-1 text-xs rounded ${
                  selectedSheet === key
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {config.name}
              </button>
            ))}
          </div>

          {/* Zoom do seletor */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Zoom:</span>
            {[1, 2, 3].map(z => (
              <button
                key={z}
                onClick={() => setTileZoom(z)}
                className={`px-2 py-1 rounded ${tileZoom === z ? 'bg-cyan-600 text-white' : 'bg-slate-700'}`}
              >
                {z}x
              </button>
            ))}
          </div>
        </div>

        {/* Canvas do Seletor */}
        <div className="flex-1 overflow-hidden p-2">
          <canvas
            ref={tileCanvasRef}
            className="cursor-pointer"
            onClick={handleTileClick}
            onWheel={handleTileScroll}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Preview da tile selecionada */}
        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-4">
            <canvas
              ref={previewCanvasRef}
              width={96}
              height={96}
              className="border-2 border-cyan-500 rounded"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="text-sm">
              <div className="text-cyan-400 font-bold">TILE SELECIONADA</div>
              {selectedTile ? (
                <>
                  <div className="text-slate-300">Sheet: {selectedSheet}</div>
                  <div className="text-green-400 font-mono">x: {selectedTile.x}, y: {selectedTile.y}</div>
                </>
              ) : (
                <div className="text-slate-500">Clique em uma tile</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Painel Central - Mapa */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-slate-800 p-2 border-b border-slate-700 flex items-center gap-4">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
          >
            Fechar
          </button>

          <div className="h-6 w-px bg-slate-600" />

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Zoom:</span>
            {[0.5, 1, 2].map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-2 py-1 rounded ${zoom === z ? 'bg-cyan-600 text-white' : 'bg-slate-700'}`}
              >
                {z}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Brush:</span>
            {[1, 3, 5].map(s => (
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                className={`px-2 py-1 rounded ${brushSize === s ? 'bg-cyan-600 text-white' : 'bg-slate-700'}`}
              >
                {s}x{s}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-1 rounded text-sm ${showGrid ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            Grid
          </button>

          <div className="h-6 w-px bg-slate-600" />

          <button onClick={saveMap} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm">
            Salvar
          </button>
          <button onClick={loadMap} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm">
            Carregar
          </button>
          <button onClick={exportCode} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm">
            Exportar Código
          </button>
        </div>

        {/* Canvas do Mapa */}
        <div className="flex-1 overflow-hidden">
          <canvas
            ref={mapCanvasRef}
            width={800}
            height={600}
            className="cursor-crosshair w-full h-full"
            style={{ imageRendering: 'pixelated' }}
            onMouseDown={handleMapMouseDown}
            onMouseMove={handleMapMouseMove}
            onMouseUp={handleMapMouseUp}
            onMouseLeave={handleMapMouseUp}
            onContextMenu={e => e.preventDefault()}
          />
        </div>

        {/* Status Bar */}
        <div className="bg-slate-800 p-2 border-t border-slate-700 text-xs text-slate-400 flex gap-4">
          <span>Mapa: {MAP_WIDTH}x{MAP_HEIGHT}</span>
          <span>Camera: {Math.round(camera.x)}, {Math.round(camera.y)}</span>
          <span>Clique esquerdo: Pintar | Clique direito: Arrastar</span>
        </div>
      </div>
    </div>
  );
};

export default MapBuilder;
