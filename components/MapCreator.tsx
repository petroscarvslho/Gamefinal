/**
 * MapCreator - Editor de Mapas Completo (v3 - Enhanced UX)
 * Interface moderna e profissional para criação de mapas
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SPRITE_SHEETS, SPRITE_SIZE } from '../services/tilesetManager';
import SpriteGenerator from './SpriteGenerator';

interface MapCreatorProps {
  onClose: () => void;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface HistoryState {
  data: number[][][];
  description: string;
}

interface RecentTile {
  sheet: string;
  x: number;
  y: number;
}

const TILE_CATEGORIES = [
  { id: 'floors', name: 'Pisos', icon: '🏠', sheet: 'floors' as keyof typeof SPRITE_SHEETS },
  { id: 'walls', name: 'Paredes', icon: '🧱', sheet: 'walls' as keyof typeof SPRITE_SHEETS },
  { id: 'hospital', name: 'Hospital', icon: '🏥', sheet: 'hospital' as keyof typeof SPRITE_SHEETS },
  { id: 'interiors', name: 'Móveis', icon: '🪑', sheet: 'interiors' as keyof typeof SPRITE_SHEETS },
  { id: 'generic', name: 'Objetos', icon: '📦', sheet: 'generic' as keyof typeof SPRITE_SHEETS },
  { id: 'bathroom', name: 'Banheiro', icon: '🚿', sheet: 'bathroom' as keyof typeof SPRITE_SHEETS },
  { id: 'roomBuilder', name: 'Construção', icon: '🏗️', sheet: 'roomBuilder' as keyof typeof SPRITE_SHEETS },
];

type Tool = 'brush' | 'eraser' | 'fill' | 'picker';

const MapCreator: React.FC<MapCreatorProps> = ({ onClose }) => {
  // Refs
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const tileCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const miniMapRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  // Map state
  const [mapWidth, setMapWidth] = useState(30);
  const [mapHeight, setMapHeight] = useState(20);
  const [mapData, setMapData] = useState<number[][][]>([]);
  const [mapName, setMapName] = useState('Meu Mapa');

  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistorySize = 50;

  // Tile selection state
  const [selectedCategory, setSelectedCategory] = useState(TILE_CATEGORIES[0]);
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [sheetImages, setSheetImages] = useState<Record<string, HTMLImageElement>>({});
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [recentTiles, setRecentTiles] = useState<RecentTile[]>([]);

  // Tool state
  const [currentTool, setCurrentTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(1);
  const [showGrid, setShowGrid] = useState(true);

  // View state
  const [zoom, setZoom] = useState(1);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [tileZoom, setTileZoom] = useState(2);
  const [tileScroll, setTileScroll] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 700 });

  // Interaction state
  const [isPainting, setIsPainting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastPaintPos, setLastPaintPos] = useState<{ x: number; y: number } | null>(null);
  const [mapHoverPos, setMapHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Modals & UI
  const [showNewMapModal, setShowNewMapModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedMaps, setSavedMaps] = useState<{ name: string; data: any }[]>([]);
  const [showSpriteGenerator, setShowSpriteGenerator] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [leftPanelTab, setLeftPanelTab] = useState<'tiles' | 'recent'>('tiles');

  // Toast notification system
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // Add to recent tiles
  const addToRecentTiles = useCallback((sheet: string, x: number, y: number) => {
    setRecentTiles(prev => {
      const filtered = prev.filter(t => !(t.sheet === sheet && t.x === x && t.y === y));
      return [{ sheet, x, y }, ...filtered].slice(0, 16);
    });
  }, []);

  // Initialize map with history - empty tiles represented as [-1, 0, 0]
  const initializeMap = useCallback((width: number, height: number, addToHistory = true) => {
    const newMap: number[][][] = [];
    for (let y = 0; y < height; y++) {
      const row: number[][] = [];
      for (let x = 0; x < width; x++) {
        row.push([-1, 0, 0]); // Empty tile - no sprite
      }
      newMap.push(row);
    }
    setMapData(newMap);
    setMapWidth(width);
    setMapHeight(height);

    if (addToHistory) {
      setHistory([{ data: newMap, description: 'Novo mapa' }]);
      setHistoryIndex(0);
    }
  }, []);

  // Add to history
  const addToHistory = useCallback((newData: number[][][], description: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ data: JSON.parse(JSON.stringify(newData)), description });
      if (newHistory.length > maxHistorySize) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  }, [historyIndex]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setMapData(JSON.parse(JSON.stringify(history[newIndex].data)));
      showToast(`↩️ ${history[newIndex].description}`, 'info');
    }
  }, [historyIndex, history, showToast]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setMapData(JSON.parse(JSON.stringify(history[newIndex].data)));
      showToast(`↪️ ${history[newIndex].description}`, 'info');
    }
  }, [historyIndex, history, showToast]);

  // Resize canvas
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
      }
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
        else if (e.key === 's') { e.preventDefault(); saveMap(); }
      } else {
        switch (e.key.toLowerCase()) {
          case 'b': setCurrentTool('brush'); break;
          case 'e': setCurrentTool('eraser'); break;
          case 'f': setCurrentTool('fill'); break;
          case 'g': setShowGrid(p => !p); break;
          case 'm': setShowMiniMap(p => !p); break;
          case '1': setBrushSize(1); break;
          case '2': setBrushSize(3); break;
          case '3': setBrushSize(5); break;
          case '4': setBrushSize(7); break;
          case '+': case '=': setZoom(p => Math.min(3, p + 0.5)); break;
          case '-': setZoom(p => Math.max(0.5, p - 0.5)); break;
          case 'escape':
            if (showNewMapModal) setShowNewMapModal(false);
            else if (showSaveModal) setShowSaveModal(false);
            else if (showSpriteGenerator) setShowSpriteGenerator(false);
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, showNewMapModal, showSaveModal, showSpriteGenerator]);

  // Load images
  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      const images: Record<string, HTMLImageElement> = {};
      await Promise.all(
        Object.entries(SPRITE_SHEETS).map(([key, path]) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => { images[key] = img; resolve(); };
            img.onerror = () => resolve();
            img.src = path;
          })
        )
      );
      setSheetImages(images);
      setIsLoading(false);

      try {
        const saved = localStorage.getItem('mapCreator_maps');
        if (saved) setSavedMaps(JSON.parse(saved));
        const recent = localStorage.getItem('mapCreator_recentTiles');
        if (recent) setRecentTiles(JSON.parse(recent));
      } catch (e) {}

      initializeMap(30, 20);
    };
    loadImages();
  }, [initializeMap]);

  // Save recent tiles
  useEffect(() => {
    if (recentTiles.length > 0) {
      localStorage.setItem('mapCreator_recentTiles', JSON.stringify(recentTiles));
    }
  }, [recentTiles]);

  const getSheetIndex = useCallback((sheet: keyof typeof SPRITE_SHEETS): number => {
    return Object.keys(SPRITE_SHEETS).indexOf(sheet);
  }, []);

  const getSheetFromIndex = useCallback((index: number): keyof typeof SPRITE_SHEETS => {
    return Object.keys(SPRITE_SHEETS)[index] as keyof typeof SPRITE_SHEETS || 'floors';
  }, []);

  // Render tile selector
  useEffect(() => {
    if (!tileCanvasRef.current || !sheetImages[selectedCategory.sheet]) return;

    const canvas = tileCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = sheetImages[selectedCategory.sheet];
    const cols = Math.floor(img.width / SPRITE_SIZE);
    const rows = Math.floor(img.height / SPRITE_SIZE);
    const tileDisplaySize = SPRITE_SIZE * tileZoom;
    const tilesPerRow = Math.floor(canvas.width / tileDisplaySize);

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const startRow = Math.floor(tileScroll / tileDisplaySize);
    const visibleRows = Math.ceil(canvas.height / tileDisplaySize) + 1;

    for (let row = 0; row < visibleRows; row++) {
      for (let col = 0; col < tilesPerRow; col++) {
        const srcRow = startRow + row;
        const srcCol = col;
        if (srcRow >= rows || srcCol >= cols) continue;

        const destX = col * tileDisplaySize;
        const destY = row * tileDisplaySize - (tileScroll % tileDisplaySize);
        if (destY + tileDisplaySize < 0 || destY > canvas.height) continue;

        // Checkerboard
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(destX, destY, tileDisplaySize, tileDisplaySize);
        ctx.fillStyle = '#334155';
        const half = tileDisplaySize / 2;
        ctx.fillRect(destX, destY, half, half);
        ctx.fillRect(destX + half, destY + half, half, half);

        // Tile
        ctx.drawImage(img, srcCol * SPRITE_SIZE, srcRow * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE,
          destX, destY, tileDisplaySize, tileDisplaySize);

        // Hover
        if (hoveredTile && srcCol === hoveredTile.x && srcRow === hoveredTile.y) {
          ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
          ctx.fillRect(destX, destY, tileDisplaySize, tileDisplaySize);
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2;
          ctx.strokeRect(destX + 1, destY + 1, tileDisplaySize - 2, tileDisplaySize - 2);
        }

        // Selected
        if (selectedTile && srcCol === selectedTile.x && srcRow === selectedTile.y) {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.strokeRect(destX + 2, destY + 2, tileDisplaySize - 4, tileDisplaySize - 4);
          ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
          ctx.fillRect(destX, destY, tileDisplaySize, tileDisplaySize);
        }
      }
    }
  }, [selectedCategory, sheetImages, tileScroll, tileZoom, selectedTile, hoveredTile]);

  // Render preview
  useEffect(() => {
    if (!selectedTile || !sheetImages[selectedCategory.sheet] || !previewCanvasRef.current) return;
    const ctx = previewCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 96, 96);
    ctx.drawImage(sheetImages[selectedCategory.sheet],
      selectedTile.x * SPRITE_SIZE, selectedTile.y * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE,
      0, 0, 96, 96);
  }, [selectedTile, selectedCategory, sheetImages]);

  // Render mini-map
  useEffect(() => {
    if (!miniMapRef.current || mapData.length === 0 || !showMiniMap) return;
    const canvas = miniMapRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = Math.min(150 / mapWidth, 100 / mapHeight);
    canvas.width = mapWidth * scale;
    canvas.height = mapHeight * scale;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const [sheetIdx, tileX, tileY] = mapData[y]?.[x] || [-1, 0, 0];

        if (sheetIdx === -1) {
          // Empty tile - subtle pattern
          const isLight = (x + y) % 2 === 0;
          ctx.fillStyle = isLight ? '#1a1f2e' : '#141820';
          ctx.fillRect(x * scale, y * scale, scale, scale);
        } else {
          const sheetKey = getSheetFromIndex(sheetIdx);
          const img = sheetImages[sheetKey];
          if (img) {
            ctx.drawImage(img, tileX * SPRITE_SIZE, tileY * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE,
              x * scale, y * scale, scale, scale);
          }
        }
      }
    }

    // Draw viewport
    const viewportW = canvasSize.width / (SPRITE_SIZE * zoom);
    const viewportH = canvasSize.height / (SPRITE_SIZE * zoom);
    const viewportX = camera.x / (SPRITE_SIZE * zoom);
    const viewportY = camera.y / (SPRITE_SIZE * zoom);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(viewportX * scale, viewportY * scale, viewportW * scale, viewportH * scale);
  }, [mapData, mapWidth, mapHeight, camera, zoom, canvasSize, sheetImages, showMiniMap, getSheetFromIndex]);

  // Render map
  useEffect(() => {
    if (!mapCanvasRef.current || mapData.length === 0) return;
    const canvas = mapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    animationRef.current = requestAnimationFrame(() => {
      const displaySize = SPRITE_SIZE * zoom;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const startX = Math.max(0, Math.floor(camera.x / displaySize));
      const startY = Math.max(0, Math.floor(camera.y / displaySize));
      const endX = Math.min(mapWidth, Math.ceil((camera.x + canvas.width) / displaySize));
      const endY = Math.min(mapHeight, Math.ceil((camera.y + canvas.height) / displaySize));

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const destX = x * displaySize - camera.x;
          const destY = y * displaySize - camera.y;
          const [sheetIdx, tileX, tileY] = mapData[y]?.[x] || [-1, 0, 0];

          // Empty tile - show clean checkerboard pattern
          if (sheetIdx === -1) {
            const isLight = (x + y) % 2 === 0;
            ctx.fillStyle = isLight ? '#1a1f2e' : '#141820';
            ctx.fillRect(destX, destY, displaySize, displaySize);
          } else {
            const img = sheetImages[getSheetFromIndex(sheetIdx)];
            if (img) {
              ctx.drawImage(img, tileX * SPRITE_SIZE, tileY * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE,
                destX, destY, displaySize, displaySize);
            }
          }

          if (showGrid) {
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.strokeRect(destX, destY, displaySize, displaySize);
          }
        }
      }

      // Map border
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.strokeRect(-camera.x, -camera.y, mapWidth * displaySize, mapHeight * displaySize);

      // Cursor preview
      if (cursorPos && selectedTile && currentTool === 'brush' && sheetImages[selectedCategory.sheet]) {
        const halfBrush = Math.floor(brushSize / 2);
        ctx.globalAlpha = 0.5;
        for (let dy = -halfBrush; dy <= halfBrush; dy++) {
          for (let dx = -halfBrush; dx <= halfBrush; dx++) {
            const nx = cursorPos.x + dx;
            const ny = cursorPos.y + dy;
            if (nx >= 0 && nx < mapWidth && ny >= 0 && ny < mapHeight) {
              const destX = nx * displaySize - camera.x;
              const destY = ny * displaySize - camera.y;
              ctx.drawImage(sheetImages[selectedCategory.sheet],
                selectedTile.x * SPRITE_SIZE, selectedTile.y * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE,
                destX, destY, displaySize, displaySize);
            }
          }
        }
        ctx.globalAlpha = 1;

        // Cursor outline
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        const cursorX = (cursorPos.x - halfBrush) * displaySize - camera.x;
        const cursorY = (cursorPos.y - halfBrush) * displaySize - camera.y;
        ctx.strokeRect(cursorX, cursorY, brushSize * displaySize, brushSize * displaySize);
      }

      // Eraser preview
      if (cursorPos && currentTool === 'eraser') {
        const halfBrush = Math.floor(brushSize / 2);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        const cursorX = (cursorPos.x - halfBrush) * displaySize - camera.x;
        const cursorY = (cursorPos.y - halfBrush) * displaySize - camera.y;
        ctx.strokeRect(cursorX, cursorY, brushSize * displaySize, brushSize * displaySize);
        ctx.setLineDash([]);
      }
    });

    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [mapData, mapWidth, mapHeight, camera, zoom, sheetImages, showGrid, canvasSize, getSheetFromIndex, cursorPos, selectedTile, selectedCategory, currentTool, brushSize]);

  // Handle tile click
  const handleTileClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tileCanvasRef.current || !sheetImages[selectedCategory.sheet]) return;

    const rect = tileCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top + tileScroll;

    const img = sheetImages[selectedCategory.sheet];
    const cols = Math.floor(img.width / SPRITE_SIZE);
    const rows = Math.floor(img.height / SPRITE_SIZE);
    const tileDisplaySize = SPRITE_SIZE * tileZoom;
    const col = Math.floor(x / tileDisplaySize);
    const row = Math.floor(y / tileDisplaySize);

    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      setSelectedTile({ x: col, y: row });
      setCurrentTool('brush');
      addToRecentTiles(selectedCategory.sheet, col, row);
    }
  }, [selectedCategory, sheetImages, tileScroll, tileZoom, addToRecentTiles]);

  // Handle tile hover
  const handleTileMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tileCanvasRef.current || !sheetImages[selectedCategory.sheet]) return;

    const rect = tileCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top + tileScroll;

    const img = sheetImages[selectedCategory.sheet];
    const cols = Math.floor(img.width / SPRITE_SIZE);
    const tileDisplaySize = SPRITE_SIZE * tileZoom;
    const col = Math.floor(x / tileDisplaySize);
    const row = Math.floor(y / tileDisplaySize);

    if (col >= 0 && col < cols) setHoveredTile({ x: col, y: row });
  }, [selectedCategory, sheetImages, tileScroll, tileZoom]);

  // Flood fill
  const floodFill = useCallback((startX: number, startY: number) => {
    if (!selectedTile) return;
    const targetTile = mapData[startY]?.[startX];
    if (!targetTile) return;

    const targetKey = targetTile.join(',');
    const newTileData = [getSheetIndex(selectedCategory.sheet), selectedTile.x, selectedTile.y];
    if (targetKey === newTileData.join(',')) return;

    const newData = mapData.map(row => row.map(cell => [...cell]));
    const stack: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;
      if (visited.has(key) || x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) continue;
      if (newData[y][x].join(',') !== targetKey) continue;

      visited.add(key);
      newData[y][x] = [...newTileData];
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    setMapData(newData);
    addToHistory(newData, 'Preencher área');
  }, [mapData, mapWidth, mapHeight, selectedTile, selectedCategory, getSheetIndex, addToHistory]);

  // Paint
  const paintAtPosition = useCallback((canvasX: number, canvasY: number, isNewStroke = false) => {
    if (!selectedTile && currentTool === 'brush') return;

    const displaySize = SPRITE_SIZE * zoom;
    const tileX = Math.floor((canvasX + camera.x) / displaySize);
    const tileY = Math.floor((canvasY + camera.y) / displaySize);

    if (tileX < 0 || tileX >= mapWidth || tileY < 0 || tileY >= mapHeight) return;
    if (!isNewStroke && lastPaintPos?.x === tileX && lastPaintPos?.y === tileY) return;
    setLastPaintPos({ x: tileX, y: tileY });

    if (currentTool === 'fill') { floodFill(tileX, tileY); return; }

    setMapData(prev => {
      const newData = prev.map(row => row.map(cell => [...cell]));
      const halfBrush = Math.floor(brushSize / 2);

      for (let dy = -halfBrush; dy <= halfBrush; dy++) {
        for (let dx = -halfBrush; dx <= halfBrush; dx++) {
          const nx = tileX + dx, ny = tileY + dy;
          if (nx >= 0 && nx < mapWidth && ny >= 0 && ny < mapHeight) {
            if (currentTool === 'brush' && selectedTile) {
              newData[ny][nx] = [getSheetIndex(selectedCategory.sheet), selectedTile.x, selectedTile.y];
            } else if (currentTool === 'eraser') {
              newData[ny][nx] = [-1, 0, 0]; // Empty tile
            }
          }
        }
      }
      return newData;
    });
  }, [selectedTile, selectedCategory, currentTool, camera, zoom, mapWidth, mapHeight, brushSize, lastPaintPos, floodFill, getSheetIndex]);

  // Map mouse handlers
  const handleMapMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      setIsPainting(true);
      setLastPaintPos(null);
      const rect = mapCanvasRef.current?.getBoundingClientRect();
      if (rect) paintAtPosition(e.clientX - rect.left, e.clientY - rect.top, true);
    } else if (e.button === 2 || e.button === 1) {
      setIsDragging(true);
    }
  }, [paintAtPosition]);

  const handleMapMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = mapCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const displaySize = SPRITE_SIZE * zoom;
    const tileX = Math.floor((canvasX + camera.x) / displaySize);
    const tileY = Math.floor((canvasY + camera.y) / displaySize);

    if (tileX >= 0 && tileX < mapWidth && tileY >= 0 && tileY < mapHeight) {
      setMapHoverPos({ x: tileX, y: tileY });
      setCursorPos({ x: tileX, y: tileY });
    } else {
      setCursorPos(null);
    }

    if (isDragging) {
      const maxX = Math.max(0, mapWidth * displaySize - canvasSize.width);
      const maxY = Math.max(0, mapHeight * displaySize - canvasSize.height);
      setCamera(prev => ({
        x: Math.max(0, Math.min(maxX, prev.x - e.movementX)),
        y: Math.max(0, Math.min(maxY, prev.y - e.movementY))
      }));
    } else if (isPainting) {
      paintAtPosition(canvasX, canvasY);
    }
  }, [isDragging, isPainting, paintAtPosition, mapWidth, mapHeight, zoom, canvasSize, camera]);

  const handleMapMouseUp = useCallback(() => {
    if (isPainting && (currentTool === 'brush' || currentTool === 'eraser')) {
      addToHistory(mapData, currentTool === 'brush' ? 'Pintar' : 'Apagar');
    }
    setIsDragging(false);
    setIsPainting(false);
    setLastPaintPos(null);
  }, [isPainting, currentTool, mapData, addToHistory]);

  const handleMapMouseLeave = useCallback(() => {
    handleMapMouseUp();
    setCursorPos(null);
    setMapHoverPos(null);
  }, [handleMapMouseUp]);

  const handleMapWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(p => Math.max(0.5, Math.min(3, p + (e.deltaY > 0 ? -0.25 : 0.25))));
    }
  }, []);

  const handleTileScroll = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const img = sheetImages[selectedCategory.sheet];
    if (!img) return;
    const maxScroll = Math.max(0, img.height * tileZoom - 400);
    setTileScroll(p => Math.max(0, Math.min(maxScroll, p + e.deltaY)));
  }, [sheetImages, selectedCategory, tileZoom]);

  // Save/Load
  const saveMap = useCallback(() => {
    if (!mapName.trim()) { showToast('❌ Digite um nome', 'error'); return; }
    const mapToSave = { name: mapName, data: mapData, width: mapWidth, height: mapHeight, savedAt: new Date().toISOString() };
    const updatedMaps = [...savedMaps.filter(m => m.name !== mapName), mapToSave];
    setSavedMaps(updatedMaps);
    localStorage.setItem('mapCreator_maps', JSON.stringify(updatedMaps));
    localStorage.setItem('mapCreator_currentMap', JSON.stringify(mapToSave));
    showToast(`💾 "${mapName}" salvo!`, 'success');
  }, [mapName, mapData, mapWidth, mapHeight, savedMaps, showToast]);

  const loadMap = useCallback((map: any) => {
    setMapName(map.name);
    setMapData(map.data);
    if (map.width) setMapWidth(map.width);
    if (map.height) setMapHeight(map.height);
    setShowSaveModal(false);
    setCamera({ x: 0, y: 0 });
    setHistory([{ data: JSON.parse(JSON.stringify(map.data)), description: 'Carregar mapa' }]);
    setHistoryIndex(0);
    showToast(`📂 "${map.name}" carregado!`, 'success');
  }, [showToast]);

  const deleteMap = useCallback((name: string) => {
    const updated = savedMaps.filter(m => m.name !== name);
    setSavedMaps(updated);
    localStorage.setItem('mapCreator_maps', JSON.stringify(updated));
    showToast(`🗑️ "${name}" excluído`, 'info');
  }, [savedMaps, showToast]);

  const createNewMap = useCallback((width: number, height: number, name: string) => {
    setMapName(name);
    initializeMap(width, height);
    setShowNewMapModal(false);
    setCamera({ x: 0, y: 0 });
    showToast(`📄 "${name}" criado!`, 'success');
  }, [initializeMap, showToast]);

  // Select recent tile
  const selectRecentTile = useCallback((tile: RecentTile) => {
    const cat = TILE_CATEGORIES.find(c => c.sheet === tile.sheet);
    if (cat) {
      setSelectedCategory(cat);
      setSelectedTile({ x: tile.x, y: tile.y });
      setCurrentTool('brush');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-cyan-400 text-xl font-bold">Carregando Editor</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex z-50">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 rounded-lg shadow-lg animate-slide-in ${
            t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-slate-700'
          } text-white`}>{t.message}</div>
        ))}
      </div>

      {/* Left Panel */}
      <div className="w-[340px] bg-slate-800/50 backdrop-blur border-r border-slate-600/50 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-slate-600/50 bg-gradient-to-r from-cyan-900/30 to-purple-900/30">
          <div className="flex gap-2">
            <button onClick={() => setLeftPanelTab('tiles')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${leftPanelTab === 'tiles' ? 'bg-cyan-500 text-white' : 'bg-slate-700/50 text-slate-300'}`}>
              🎨 Tiles
            </button>
            <button onClick={() => setLeftPanelTab('recent')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${leftPanelTab === 'recent' ? 'bg-cyan-500 text-white' : 'bg-slate-700/50 text-slate-300'}`}>
              ⏱️ Recentes ({recentTiles.length})
            </button>
          </div>
        </div>

        {leftPanelTab === 'tiles' ? (
          <>
            {/* Categories */}
            <div className="p-2 border-b border-slate-600/50">
              <div className="grid grid-cols-4 gap-1.5">
                {TILE_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => { setSelectedCategory(cat); setTileScroll(0); }}
                    className={`p-1.5 rounded-lg text-center transition-all ${
                      selectedCategory.id === cat.id
                        ? 'bg-cyan-500 text-white shadow-lg scale-105'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                    }`}>
                    <div className="text-lg">{cat.icon}</div>
                    <div className="text-[9px] leading-tight">{cat.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-2 border-b border-slate-600/50 bg-slate-900/30 flex items-center gap-3">
              {selectedTile ? (
                <canvas ref={previewCanvasRef} width={96} height={96}
                  className="border-2 border-green-500 rounded-lg" style={{ imageRendering: 'pixelated', width: 64, height: 64 }} />
              ) : (
                <div className="w-16 h-16 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center">
                  <span className="text-slate-500 text-[10px] text-center">Clique em<br/>uma tile</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm ${selectedTile ? 'text-green-400' : 'text-slate-400'}`}>
                  {selectedTile ? `✓ (${selectedTile.x}, ${selectedTile.y})` : 'Nenhuma tile'}
                </div>
                <div className="text-slate-400 text-xs truncate">{selectedCategory.icon} {selectedCategory.name}</div>
                {hoveredTile && <div className="text-cyan-400 text-xs">Hover: ({hoveredTile.x}, {hoveredTile.y})</div>}
              </div>
            </div>

            {/* Tile Canvas */}
            <div className="flex-1 overflow-hidden relative">
              <canvas ref={tileCanvasRef} width={330} height={400}
                className="cursor-pointer" onClick={handleTileClick}
                onMouseMove={handleTileMouseMove} onMouseLeave={() => setHoveredTile(null)}
                onWheel={handleTileScroll} style={{ imageRendering: 'pixelated' }} />
            </div>

            {/* Zoom */}
            <div className="p-2 border-t border-slate-600/50 flex items-center justify-between">
              <span className="text-slate-400 text-xs">Zoom:</span>
              <div className="flex gap-1">
                {[1, 2, 3].map(z => (
                  <button key={z} onClick={() => setTileZoom(z)}
                    className={`w-8 h-6 text-xs font-bold rounded ${tileZoom === z ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                    {z}x
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Recent Tiles */
          <div className="flex-1 p-3 overflow-y-auto">
            {recentTiles.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {recentTiles.map((tile, i) => {
                  const img = sheetImages[tile.sheet];
                  return (
                    <button key={i} onClick={() => selectRecentTile(tile)}
                      className="aspect-square bg-slate-700/50 rounded-lg overflow-hidden hover:ring-2 ring-cyan-500 transition-all">
                      {img && (
                        <canvas width={32} height={32} className="w-full h-full"
                          style={{ imageRendering: 'pixelated' }}
                          ref={c => {
                            if (c) {
                              const ctx = c.getContext('2d');
                              if (ctx) {
                                ctx.imageSmoothingEnabled = false;
                                ctx.drawImage(img, tile.x * SPRITE_SIZE, tile.y * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE, 0, 0, 32, 32);
                              }
                            }
                          }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8">
                <div className="text-3xl mb-2">⏱️</div>
                <div className="text-sm">Tiles usadas aparecem aqui</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-slate-800/80 px-3 py-2 border-b border-slate-600/50 flex items-center gap-2 flex-wrap">
          <button onClick={onClose} className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white rounded-lg font-bold text-sm">✕</button>

          <div className="w-px h-6 bg-slate-600" />

          <button onClick={undo} disabled={historyIndex <= 0} className={`p-1.5 rounded ${historyIndex <= 0 ? 'opacity-30' : 'hover:bg-slate-700'}`} title="Ctrl+Z">↩️</button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className={`p-1.5 rounded ${historyIndex >= history.length - 1 ? 'opacity-30' : 'hover:bg-slate-700'}`} title="Ctrl+Shift+Z">↪️</button>

          <div className="w-px h-6 bg-slate-600" />

          <input type="text" value={mapName} onChange={e => setMapName(e.target.value)}
            className="bg-slate-700/50 text-white px-2 py-1 rounded text-sm border border-slate-600 w-28" />

          <div className="w-px h-6 bg-slate-600" />

          {[
            { tool: 'brush' as Tool, icon: '🖌️', label: 'B' },
            { tool: 'eraser' as Tool, icon: '🧹', label: 'E' },
            { tool: 'fill' as Tool, icon: '🪣', label: 'F' },
          ].map(({ tool, icon, label }) => (
            <button key={tool} onClick={() => setCurrentTool(tool)} title={label}
              className={`px-2 py-1 rounded text-sm ${currentTool === tool ? 'bg-cyan-500 text-white' : 'bg-slate-700/50 text-slate-300'}`}>
              {icon}
            </button>
          ))}

          <div className="flex items-center gap-1 bg-slate-700/30 px-2 py-1 rounded">
            {[1, 3, 5, 7].map((s, i) => (
              <button key={s} onClick={() => setBrushSize(s)} title={`${i + 1}`}
                className={`w-6 h-6 text-xs font-bold rounded ${brushSize === s ? 'bg-orange-500 text-white' : 'bg-slate-600/50 text-slate-300'}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-600" />

          <div className="flex items-center gap-1 bg-slate-700/30 px-2 py-1 rounded">
            {[0.5, 1, 1.5, 2].map(z => (
              <button key={z} onClick={() => setZoom(z)}
                className={`px-1.5 py-0.5 text-xs font-bold rounded ${zoom === z ? 'bg-cyan-500 text-white' : 'bg-slate-600/50 text-slate-300'}`}>
                {z}x
              </button>
            ))}
          </div>

          <button onClick={() => setShowGrid(!showGrid)} title="G"
            className={`px-2 py-1 text-sm rounded ${showGrid ? 'bg-cyan-500/30 text-cyan-400' : 'bg-slate-700/50 text-slate-400'}`}>🔲</button>

          <button onClick={() => setShowMiniMap(!showMiniMap)} title="M"
            className={`px-2 py-1 text-sm rounded ${showMiniMap ? 'bg-cyan-500/30 text-cyan-400' : 'bg-slate-700/50 text-slate-400'}`}>🗺️</button>

          <div className="flex-1" />

          <button onClick={() => setShowNewMapModal(true)} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded text-sm">📄</button>
          <button onClick={() => setShowSaveModal(true)} className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-white rounded text-sm">📂</button>
          <button onClick={saveMap} title="Ctrl+S" className="px-3 py-1.5 bg-green-500 hover:bg-green-400 text-white rounded text-sm">💾</button>
          <button onClick={() => setShowSpriteGenerator(true)} className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded text-sm font-bold">🎨</button>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 overflow-hidden relative bg-slate-950">
          <canvas ref={mapCanvasRef} width={canvasSize.width} height={canvasSize.height}
            className={currentTool === 'brush' ? 'cursor-crosshair' : currentTool === 'eraser' ? 'cursor-cell' : 'cursor-pointer'}
            style={{ imageRendering: 'pixelated' }}
            onMouseDown={handleMapMouseDown} onMouseMove={handleMapMouseMove}
            onMouseUp={handleMapMouseUp} onMouseLeave={handleMapMouseLeave}
            onWheel={handleMapWheel} onContextMenu={e => e.preventDefault()} />

          {/* Coordinates */}
          {mapHoverPos && (
            <div className="absolute top-3 left-3 bg-slate-800/90 px-3 py-1.5 rounded-lg text-sm text-white font-mono">
              📍 {mapHoverPos.x}, {mapHoverPos.y}
            </div>
          )}

          {/* Mini-map */}
          {showMiniMap && (
            <div className="absolute bottom-3 right-3 bg-slate-800/90 p-2 rounded-lg border border-slate-600/50">
              <canvas ref={miniMapRef} className="rounded" style={{ imageRendering: 'pixelated' }} />
            </div>
          )}

          {/* Controls hint */}
          <div className="absolute bottom-3 left-3 bg-slate-800/80 px-3 py-1.5 rounded-lg text-xs text-slate-400">
            <span className="text-cyan-400">LMB:</span> Pintar <span className="text-cyan-400 ml-2">RMB:</span> Mover <span className="text-cyan-400 ml-2">Ctrl+Scroll:</span> Zoom
          </div>
        </div>

        {/* Status */}
        <div className="bg-slate-800/80 px-3 py-1 border-t border-slate-600/50 flex items-center gap-4 text-xs text-slate-400">
          <span>📐 {mapWidth}×{mapHeight}</span>
          <span>🔍 {zoom}x</span>
          <span>🖌️ {brushSize}×{brushSize}</span>
          <span>📜 {historyIndex + 1}/{history.length}</span>
          <div className="flex-1" />
          <span className="text-slate-500">LimeZu Pixel Art Editor</span>
        </div>
      </div>

      {/* New Map Modal */}
      {showNewMapModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-slate-800 rounded-xl w-[380px] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4">
              <h2 className="text-white font-bold">📄 Novo Mapa</h2>
            </div>
            <div className="p-4 space-y-3">
              <input type="text" defaultValue="Novo Mapa" id="newMapName" placeholder="Nome"
                className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" defaultValue={30} min={10} max={100} id="newMapWidth"
                  className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600" placeholder="Largura" />
                <input type="number" defaultValue={20} min={10} max={100} id="newMapHeight"
                  className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600" placeholder="Altura" />
              </div>
              <div className="flex gap-2">
                {[{ w: 20, h: 15, l: 'P' }, { w: 30, h: 20, l: 'M' }, { w: 50, h: 40, l: 'G' }].map(p => (
                  <button key={p.l} onClick={() => {
                    (document.getElementById('newMapWidth') as HTMLInputElement).value = String(p.w);
                    (document.getElementById('newMapHeight') as HTMLInputElement).value = String(p.h);
                  }} className="flex-1 px-2 py-1 bg-slate-600 hover:bg-cyan-600 text-slate-300 rounded text-xs">
                    {p.l} ({p.w}×{p.h})
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 bg-slate-900/50 flex gap-2">
              <button onClick={() => setShowNewMapModal(false)} className="flex-1 py-2 bg-slate-700 text-white rounded">Cancelar</button>
              <button onClick={() => {
                const n = (document.getElementById('newMapName') as HTMLInputElement).value || 'Novo Mapa';
                const w = Math.max(10, Math.min(100, parseInt((document.getElementById('newMapWidth') as HTMLInputElement).value) || 30));
                const h = Math.max(10, Math.min(100, parseInt((document.getElementById('newMapHeight') as HTMLInputElement).value) || 20));
                createNewMap(w, h, n);
              }} className="flex-1 py-2 bg-cyan-500 text-white rounded font-bold">Criar</button>
            </div>
          </div>
        </div>
      )}

      {/* Load Map Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-slate-800 rounded-xl w-[400px] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
              <h2 className="text-white font-bold">📂 Mapas Salvos</h2>
            </div>
            <div className="p-3 max-h-[300px] overflow-y-auto">
              {savedMaps.length > 0 ? savedMaps.map((m, i) => (
                <div key={i} className="bg-slate-700/50 rounded p-3 mb-2 flex items-center group">
                  <div className="flex-1 cursor-pointer" onClick={() => loadMap(m)}>
                    <div className="text-white font-medium">{m.name}</div>
                    <div className="text-slate-400 text-xs">{m.width}×{m.height}</div>
                  </div>
                  <button onClick={() => loadMap(m)} className="px-2 py-1 bg-purple-500 text-white rounded text-sm mr-2">Abrir</button>
                  <button onClick={() => deleteMap(m.name)} className="px-2 py-1 bg-red-500/50 hover:bg-red-500 text-white rounded text-sm opacity-0 group-hover:opacity-100">🗑️</button>
                </div>
              )) : <div className="text-center text-slate-500 py-8">Nenhum mapa salvo</div>}
            </div>
            <div className="p-3 bg-slate-900/50">
              <button onClick={() => setShowSaveModal(false)} className="w-full py-2 bg-slate-700 text-white rounded">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {showSpriteGenerator && <SpriteGenerator onClose={() => setShowSpriteGenerator(false)} />}

      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default MapCreator;
