import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SPRITE_SHEETS, SPRITE_SIZE } from '../services/tilesetManager';
import { TileType, NPC, Direction } from '../types';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../constants';

interface SceneEditorProps {
  onClose: () => void;
}

// Configuração dos sprite sheets
const SHEET_CONFIG: Record<string, { name: string; cols: number; rows: number }> = {
  floors: { name: 'Pisos', cols: 15, rows: 40 },
  walls: { name: 'Paredes', cols: 32, rows: 40 },
  hospital: { name: 'Hospital', cols: 16, rows: 110 },
  interiors: { name: 'Interiores', cols: 48, rows: 400 },
  generic: { name: 'Genérico', cols: 48, rows: 64 },
  bathroom: { name: 'Banheiro', cols: 48, rows: 64 },
  roomBuilder: { name: 'Room Builder', cols: 76, rows: 113 },
};

// Templates de NPCs - Todos os tipos de médicos e profissionais de saúde
const NPC_TEMPLATES = [
  // === MÉDICOS ESPECIALISTAS ===
  { id: 'surgeon', name: 'Cirurgião', color: '#3b82f6', role: 'Cirurgião Geral' },
  { id: 'anesthesiologist', name: 'Anestesista', color: '#8b5cf6', role: 'Anestesiologista' },
  { id: 'cardiologist', name: 'Cardiologista', color: '#ef4444', role: 'Cardiologista' },
  { id: 'cardiac_surgeon', name: 'Cirurgião Cardíaco', color: '#dc2626', role: 'Cirurgião Cardiovascular' },
  { id: 'neurosurgeon', name: 'Neurocirurgião', color: '#7c3aed', role: 'Neurocirurgião' },
  { id: 'orthopedist', name: 'Ortopedista', color: '#0891b2', role: 'Ortopedista' },
  { id: 'obstetrician', name: 'Obstetra', color: '#ec4899', role: 'Obstetra/Ginecologista' },
  { id: 'pediatrician', name: 'Pediatra', color: '#f97316', role: 'Pediatra' },
  { id: 'intensivist', name: 'Intensivista', color: '#dc2626', role: 'Médico Intensivista (UTI)' },
  { id: 'emergency_physician', name: 'Emergencista', color: '#ef4444', role: 'Médico Emergencista' },
  { id: 'radiologist', name: 'Radiologista', color: '#64748b', role: 'Radiologista' },
  { id: 'pathologist', name: 'Patologista', color: '#78716c', role: 'Patologista' },
  { id: 'oncologist', name: 'Oncologista', color: '#a855f7', role: 'Oncologista' },
  { id: 'urologist', name: 'Urologista', color: '#0ea5e9', role: 'Urologista' },
  { id: 'gastroenterologist', name: 'Gastro', color: '#84cc16', role: 'Gastroenterologista' },
  { id: 'pulmonologist', name: 'Pneumologista', color: '#06b6d4', role: 'Pneumologista' },
  { id: 'nephrologist', name: 'Nefrologista', color: '#14b8a6', role: 'Nefrologista' },
  { id: 'dermatologist', name: 'Dermatologista', color: '#fbbf24', role: 'Dermatologista' },
  { id: 'ophthalmologist', name: 'Oftalmologista', color: '#22d3ee', role: 'Oftalmologista' },
  { id: 'otolaryngologist', name: 'Otorrino', color: '#a3e635', role: 'Otorrinolaringologista' },
  { id: 'plastic_surgeon', name: 'Plástico', color: '#f472b6', role: 'Cirurgião Plástico' },
  { id: 'vascular_surgeon', name: 'Vascular', color: '#e11d48', role: 'Cirurgião Vascular' },
  { id: 'thoracic_surgeon', name: 'Torácico', color: '#be185d', role: 'Cirurgião Torácico' },

  // === RESIDENTES ===
  { id: 'resident_r1', name: 'Residente R1', color: '#22c55e', role: 'Residente 1º ano' },
  { id: 'resident_r2', name: 'Residente R2', color: '#16a34a', role: 'Residente 2º ano' },
  { id: 'resident_r3', name: 'Residente R3', color: '#15803d', role: 'Residente 3º ano' },

  // === EQUIPE DE ENFERMAGEM ===
  { id: 'nurse', name: 'Enfermeira', color: '#f472b6', role: 'Enfermeira' },
  { id: 'nurse_chief', name: 'Enf. Chefe', color: '#db2777', role: 'Enfermeira Chefe' },
  { id: 'surgical_nurse', name: 'Instrumentadora', color: '#10b981', role: 'Instrumentadora Cirúrgica' },
  { id: 'circulating_nurse', name: 'Circulante', color: '#34d399', role: 'Enfermeira Circulante' },
  { id: 'icu_nurse', name: 'Enf. UTI', color: '#f43f5e', role: 'Enfermeira Intensivista' },
  { id: 'nursing_tech', name: 'Téc. Enfermagem', color: '#fb7185', role: 'Técnico de Enfermagem' },

  // === OUTROS PROFISSIONAIS ===
  { id: 'perfusionist', name: 'Perfusionista', color: '#6366f1', role: 'Perfusionista (CEC)' },
  { id: 'physiotherapist', name: 'Fisioterapeuta', color: '#f59e0b', role: 'Fisioterapeuta' },
  { id: 'pharmacist', name: 'Farmacêutico', color: '#84cc16', role: 'Farmacêutico' },
  { id: 'lab_technician', name: 'Téc. Lab', color: '#a78bfa', role: 'Técnico de Laboratório' },
  { id: 'radiology_tech', name: 'Téc. Radiologia', color: '#94a3b8', role: 'Técnico em Radiologia' },
  { id: 'biomedical', name: 'Biomédico', color: '#2dd4bf', role: 'Engenheiro Biomédico' },

  // === ADMINISTRATIVO ===
  { id: 'receptionist', name: 'Recepcionista', color: '#ec4899', role: 'Recepcionista' },
  { id: 'admin', name: 'Administrativo', color: '#64748b', role: 'Administrativo' },
  { id: 'security', name: 'Segurança', color: '#1e293b', role: 'Segurança' },
  { id: 'cleaning', name: 'Limpeza', color: '#0d9488', role: 'Serviços Gerais' },

  // === PACIENTES E ACOMPANHANTES ===
  { id: 'patient', name: 'Paciente', color: '#fbbf24', role: 'Paciente' },
  { id: 'patient_surgical', name: 'Pac. Cirúrgico', color: '#eab308', role: 'Paciente Cirúrgico' },
  { id: 'patient_icu', name: 'Pac. UTI', color: '#ca8a04', role: 'Paciente UTI' },
  { id: 'visitor', name: 'Visitante', color: '#94a3b8', role: 'Visitante/Acompanhante' },
];

// Templates de cenas
const SCENE_TEMPLATES = [
  { id: 'reception', name: 'Recepção', description: 'Entrada do hospital' },
  { id: 'waiting_room', name: 'Sala de Espera', description: 'Pacientes aguardando' },
  { id: 'pre_op', name: 'Pré-Operatório', description: 'Preparação do paciente' },
  { id: 'operating_room', name: 'Centro Cirúrgico', description: 'Sala de cirurgia' },
  { id: 'post_op', name: 'Pós-Operatório', description: 'Recuperação' },
  { id: 'icu', name: 'UTI', description: 'Unidade de Terapia Intensiva' },
  { id: 'pharmacy', name: 'Farmácia', description: 'Medicamentos' },
  { id: 'corridor', name: 'Corredor', description: 'Passagem' },
];

// Interface para uma cena
interface Scene {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  layers: {
    floor: number[][][];    // [y][x] = [sheetIdx, tileX, tileY]
    objects: number[][][];  // Objetos sobre o chão
    collision: boolean[][]; // Mapa de colisão
  };
  npcs: PlacedNPC[];
  triggers: Trigger[];
  spawnPoint: { x: number; y: number };
}

interface PlacedNPC {
  id: string;
  templateId: string;
  name: string;
  x: number;
  y: number;
  direction: Direction;
  dialogue: string;
}

interface Trigger {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'scene_change' | 'dialogue' | 'event';
  targetSceneId?: string;
  eventId?: string;
}

type EditorTool = 'paint' | 'erase' | 'npc' | 'trigger' | 'collision' | 'spawn';
type EditorLayer = 'floor' | 'objects';

const SceneEditor: React.FC<SceneEditorProps> = ({ onClose }) => {
  // Refs
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const tileCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // State
  const [sheetImages, setSheetImages] = useState<Record<string, HTMLImageElement>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Scene state
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState<string>('');
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [newSceneTemplate, setNewSceneTemplate] = useState('');

  // Map selection state
  const [savedMaps, setSavedMaps] = useState<{ id: string; name: string; data: any }[]>([]);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState<string>('');

  // Editor state - apenas NPC tools
  const [currentTool, setCurrentTool] = useState<EditorTool>('npc');
  const [selectedNpcTemplate, setSelectedNpcTemplate] = useState<string>('');
  const [showGrid, setShowGrid] = useState(true);
  const [showNpcs, setShowNpcs] = useState(true);
  const [showTriggers, setShowTriggers] = useState(true);

  // View state
  const [zoom, setZoom] = useState(1);
  const [camera, setCamera] = useState({ x: 0, y: 0 });

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);

  // NPC dialog state
  const [editingNpc, setEditingNpc] = useState<PlacedNPC | null>(null);

  // Get current scene
  const currentScene = scenes.find(s => s.id === currentSceneId);

  // Helper functions
  const getSheetIndex = (sheet: string): number => Object.keys(SPRITE_SHEETS).indexOf(sheet);
  const getSheetFromIndex = (index: number): string => Object.keys(SPRITE_SHEETS)[index] || 'floors';

  // Load sprite sheets and saved maps
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

      // Load saved maps from localStorage
      const maps: { id: string; name: string; data: any }[] = [];
      const mapBuilderData = localStorage.getItem('mapBuilder_savedMap');
      if (mapBuilderData) {
        maps.push({ id: 'mapBuilder', name: 'Mapa do Editor', data: JSON.parse(mapBuilderData) });
      }
      // Também carregar mapas salvos do SceneEditor anterior
      const savedScenes = localStorage.getItem('sceneEditor_project');
      if (savedScenes) {
        const parsedScenes = JSON.parse(savedScenes);
        parsedScenes.forEach((scene: any, index: number) => {
          maps.push({ id: `scene_${index}`, name: scene.name || `Mapa ${index + 1}`, data: scene.layers?.floor });
        });
      }
      setSavedMaps(maps);

      setIsLoading(false);

      // Show map selector if no scene exists
      if (scenes.length === 0) {
        setShowMapSelector(true);
      }
    };

    loadImages();
  }, []);

  // Create new scene
  const createNewScene = useCallback((name: string, templateId: string) => {
    const template = SCENE_TEMPLATES.find(t => t.id === templateId);
    const width = 30;
    const height = 20;

    // Initialize empty layers
    const floorLayer: number[][][] = Array(height).fill(null).map(() =>
      Array(width).fill(null).map(() => [0, 1, 33]) // Default floor
    );
    const objectsLayer: number[][][] = Array(height).fill(null).map(() =>
      Array(width).fill(null).map(() => [-1, 0, 0]) // Empty
    );
    const collisionLayer: boolean[][] = Array(height).fill(null).map(() =>
      Array(width).fill(false)
    );

    // Add walls around the scene
    for (let x = 0; x < width; x++) {
      floorLayer[0][x] = [1, 0, 0]; // Top wall
      floorLayer[height - 1][x] = [1, 0, 0]; // Bottom wall
      collisionLayer[0][x] = true;
      collisionLayer[height - 1][x] = true;
    }
    for (let y = 0; y < height; y++) {
      floorLayer[y][0] = [1, 0, 0]; // Left wall
      floorLayer[y][width - 1] = [1, 0, 0]; // Right wall
      collisionLayer[y][0] = true;
      collisionLayer[y][width - 1] = true;
    }

    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      name,
      description: template?.description || '',
      width,
      height,
      layers: {
        floor: floorLayer,
        objects: objectsLayer,
        collision: collisionLayer,
      },
      npcs: [],
      triggers: [],
      spawnPoint: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
    };

    setScenes(prev => [...prev, newScene]);
    setCurrentSceneId(newScene.id);
    setShowSceneModal(false);
    setNewSceneName('');
    setNewSceneTemplate('');
  }, []);

  // Render tile selector
  useEffect(() => {
    if (!tileCanvasRef.current || !sheetImages[selectedSheet]) return;

    const canvas = tileCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = sheetImages[selectedSheet];
    const config = SHEET_CONFIG[selectedSheet];
    if (!config) return;

    const tileDisplaySize = SPRITE_SIZE * tileZoom;
    const tilesPerRow = Math.floor(350 / tileDisplaySize);
    const visibleRows = Math.ceil(400 / tileDisplaySize) + 1;

    canvas.width = tilesPerRow * tileDisplaySize;
    canvas.height = 400;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const startRow = Math.floor(tileScroll / tileDisplaySize);

    for (let row = 0; row < visibleRows; row++) {
      for (let col = 0; col < tilesPerRow; col++) {
        const globalIndex = (startRow + row) * tilesPerRow + col;
        const srcY = Math.floor(globalIndex / config.cols);
        const srcX = globalIndex % config.cols;

        if (srcY >= config.rows) continue;

        const destX = col * tileDisplaySize;
        const destY = row * tileDisplaySize - (tileScroll % tileDisplaySize);

        if (destY + tileDisplaySize < 0 || destY > canvas.height) continue;

        ctx.drawImage(
          img,
          srcX * SPRITE_SIZE, srcY * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE,
          destX, destY, tileDisplaySize, tileDisplaySize
        );

        // Highlight selected
        if (selectedTile && srcX === selectedTile.x && srcY === selectedTile.y) {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.strokeRect(destX + 1, destY + 1, tileDisplaySize - 2, tileDisplaySize - 2);
        }

        // Coordinates
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(destX, destY + tileDisplaySize - 10, tileDisplaySize, 10);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '7px monospace';
        ctx.fillText(`${srcX},${srcY}`, destX + 1, destY + tileDisplaySize - 2);
      }
    }
  }, [selectedSheet, sheetImages, tileScroll, tileZoom, selectedTile]);

  // Render preview
  useEffect(() => {
    if (!previewCanvasRef.current || !selectedTile || !sheetImages[selectedSheet]) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 64, 64);

    ctx.drawImage(
      sheetImages[selectedSheet],
      selectedTile.x * SPRITE_SIZE, selectedTile.y * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE,
      0, 0, 64, 64
    );
  }, [selectedTile, selectedSheet, sheetImages]);

  // Render map
  useEffect(() => {
    if (!mapCanvasRef.current || !currentScene) return;

    const canvas = mapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displaySize = TILE_SIZE * zoom;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const { floor, objects, collision } = currentScene.layers;

    // Render floor layer
    for (let y = 0; y < currentScene.height; y++) {
      for (let x = 0; x < currentScene.width; x++) {
        const destX = x * displaySize - camera.x;
        const destY = y * displaySize - camera.y;

        if (destX + displaySize < 0 || destX > canvas.width) continue;
        if (destY + displaySize < 0 || destY > canvas.height) continue;

        const [sheetIdx, tileX, tileY] = floor[y]?.[x] || [0, 0, 0];
        const sheetKey = getSheetFromIndex(sheetIdx);
        const img = sheetImages[sheetKey];

        if (img && sheetIdx >= 0) {
          ctx.drawImage(
            img,
            tileX * SPRITE_SIZE, tileY * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE,
            destX, destY, displaySize, displaySize
          );
        }

        // Render objects layer
        const [objSheetIdx, objTileX, objTileY] = objects[y]?.[x] || [-1, 0, 0];
        if (objSheetIdx >= 0) {
          const objSheetKey = getSheetFromIndex(objSheetIdx);
          const objImg = sheetImages[objSheetKey];
          if (objImg) {
            ctx.drawImage(
              objImg,
              objTileX * SPRITE_SIZE, objTileY * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE,
              destX, destY, displaySize, displaySize
            );
          }
        }

        // Grid
        if (showGrid) {
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.strokeRect(destX, destY, displaySize, displaySize);
        }

        // Collision
        if (showCollision && collision[y]?.[x]) {
          ctx.fillStyle = 'rgba(255,0,0,0.3)';
          ctx.fillRect(destX, destY, displaySize, displaySize);
        }
      }
    }

    // Render spawn point
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(
      currentScene.spawnPoint.x * displaySize - camera.x + displaySize / 2,
      currentScene.spawnPoint.y * displaySize - camera.y + displaySize / 2,
      displaySize / 3,
      0, Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Render NPCs
    if (showNpcs) {
      currentScene.npcs.forEach(npc => {
        const template = NPC_TEMPLATES.find(t => t.id === npc.templateId);
        const destX = npc.x * displaySize - camera.x;
        const destY = npc.y * displaySize - camera.y;

        ctx.fillStyle = template?.color || '#888';
        ctx.fillRect(destX + 4, destY + 4, displaySize - 8, displaySize - 8);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(destX + 4, destY + 4, displaySize - 8, displaySize - 8);

        ctx.fillStyle = '#fff';
        ctx.font = '8px sans-serif';
        ctx.fillText(npc.name.substring(0, 6), destX + 2, destY - 2);
      });
    }

    // Render triggers
    if (showTriggers) {
      currentScene.triggers.forEach(trigger => {
        const destX = trigger.x * displaySize - camera.x;
        const destY = trigger.y * displaySize - camera.y;
        const w = trigger.width * displaySize;
        const h = trigger.height * displaySize;

        ctx.strokeStyle = trigger.type === 'scene_change' ? '#f59e0b' : '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(destX, destY, w, h);
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
      });
    }

  }, [currentScene, camera, zoom, sheetImages, showGrid, showCollision, showNpcs, showTriggers]);

  // Handle tile click
  const handleTileClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tileCanvasRef.current || !SHEET_CONFIG[selectedSheet]) return;

    const rect = tileCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top + tileScroll;

    const tileDisplaySize = SPRITE_SIZE * tileZoom;
    const tilesPerRow = Math.floor(350 / tileDisplaySize);
    const config = SHEET_CONFIG[selectedSheet];

    const clickedCol = Math.floor(x / tileDisplaySize);
    const clickedRow = Math.floor(y / tileDisplaySize);
    const globalIndex = clickedRow * tilesPerRow + clickedCol;

    const srcY = Math.floor(globalIndex / config.cols);
    const srcX = globalIndex % config.cols;

    if (srcX < config.cols && srcY < config.rows) {
      setSelectedTile({ x: srcX, y: srcY });
    }
  }, [selectedSheet, tileScroll, tileZoom]);

  // Paint on map
  const paintAtPosition = useCallback((canvasX: number, canvasY: number) => {
    if (!currentScene) return;

    const displaySize = TILE_SIZE * zoom;
    const tileX = Math.floor((canvasX + camera.x) / displaySize);
    const tileY = Math.floor((canvasY + camera.y) / displaySize);

    if (tileX < 0 || tileX >= currentScene.width || tileY < 0 || tileY >= currentScene.height) return;

    setScenes(prev => prev.map(scene => {
      if (scene.id !== currentSceneId) return scene;

      const newScene = { ...scene, layers: { ...scene.layers } };
      const halfBrush = Math.floor(brushSize / 2);

      for (let dy = -halfBrush; dy <= halfBrush; dy++) {
        for (let dx = -halfBrush; dx <= halfBrush; dx++) {
          const nx = tileX + dx;
          const ny = tileY + dy;

          if (nx < 0 || nx >= scene.width || ny < 0 || ny >= scene.height) continue;

          if (currentTool === 'paint' && selectedTile) {
            if (currentLayer === 'floor') {
              newScene.layers.floor = [...newScene.layers.floor];
              newScene.layers.floor[ny] = [...newScene.layers.floor[ny]];
              newScene.layers.floor[ny][nx] = [getSheetIndex(selectedSheet), selectedTile.x, selectedTile.y];
            } else {
              newScene.layers.objects = [...newScene.layers.objects];
              newScene.layers.objects[ny] = [...newScene.layers.objects[ny]];
              newScene.layers.objects[ny][nx] = [getSheetIndex(selectedSheet), selectedTile.x, selectedTile.y];
            }
          } else if (currentTool === 'erase') {
            if (currentLayer === 'floor') {
              newScene.layers.floor = [...newScene.layers.floor];
              newScene.layers.floor[ny] = [...newScene.layers.floor[ny]];
              newScene.layers.floor[ny][nx] = [0, 1, 33]; // Default floor
            } else {
              newScene.layers.objects = [...newScene.layers.objects];
              newScene.layers.objects[ny] = [...newScene.layers.objects[ny]];
              newScene.layers.objects[ny][nx] = [-1, 0, 0]; // Empty
            }
          } else if (currentTool === 'collision') {
            newScene.layers.collision = [...newScene.layers.collision];
            newScene.layers.collision[ny] = [...newScene.layers.collision[ny]];
            newScene.layers.collision[ny][nx] = !newScene.layers.collision[ny][nx];
          } else if (currentTool === 'spawn') {
            newScene.spawnPoint = { x: nx, y: ny };
          }
        }
      }

      return newScene;
    }));
  }, [currentScene, currentSceneId, currentTool, currentLayer, selectedTile, selectedSheet, camera, zoom, brushSize]);

  // Add NPC
  const addNpcAtPosition = useCallback((canvasX: number, canvasY: number) => {
    if (!currentScene || !selectedNpcTemplate) return;

    const displaySize = TILE_SIZE * zoom;
    const tileX = Math.floor((canvasX + camera.x) / displaySize);
    const tileY = Math.floor((canvasY + camera.y) / displaySize);

    const template = NPC_TEMPLATES.find(t => t.id === selectedNpcTemplate);
    if (!template) return;

    const newNpc: PlacedNPC = {
      id: `npc_${Date.now()}`,
      templateId: selectedNpcTemplate,
      name: template.name,
      x: tileX,
      y: tileY,
      direction: Direction.DOWN,
      dialogue: '',
    };

    setScenes(prev => prev.map(scene => {
      if (scene.id !== currentSceneId) return scene;
      return { ...scene, npcs: [...scene.npcs, newNpc] };
    }));
  }, [currentScene, currentSceneId, selectedNpcTemplate, camera, zoom]);

  // Map mouse handlers
  const handleMapMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      if (currentTool === 'npc') {
        const rect = mapCanvasRef.current?.getBoundingClientRect();
        if (rect) addNpcAtPosition(e.clientX - rect.left, e.clientY - rect.top);
      } else {
        setIsPainting(true);
        const rect = mapCanvasRef.current?.getBoundingClientRect();
        if (rect) paintAtPosition(e.clientX - rect.left, e.clientY - rect.top);
      }
    } else if (e.button === 2) {
      setIsDragging(true);
    }
  }, [currentTool, paintAtPosition, addNpcAtPosition]);

  const handleMapMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setCamera(prev => ({
        x: Math.max(0, prev.x - e.movementX),
        y: Math.max(0, prev.y - e.movementY)
      }));
    } else if (isPainting) {
      const rect = mapCanvasRef.current?.getBoundingClientRect();
      if (rect) paintAtPosition(e.clientX - rect.left, e.clientY - rect.top);
    }
  }, [isDragging, isPainting, paintAtPosition]);

  const handleMapMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPainting(false);
  }, []);

  // Tile scroll
  const handleTileScroll = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setTileScroll(prev => Math.max(0, prev + e.deltaY));
  }, []);

  // Save/Load
  const saveProject = useCallback(() => {
    const data = JSON.stringify(scenes);
    localStorage.setItem('sceneEditor_project', data);
    alert('Projeto salvo!');
  }, [scenes]);

  const loadProject = useCallback(() => {
    const saved = localStorage.getItem('sceneEditor_project');
    if (saved) {
      const loadedScenes = JSON.parse(saved);
      setScenes(loadedScenes);
      if (loadedScenes.length > 0) setCurrentSceneId(loadedScenes[0].id);
      alert('Projeto carregado!');
    }
  }, []);

  const exportProject = useCallback(() => {
    const code = `// Cenas exportadas do SceneEditor\nexport const SCENES = ${JSON.stringify(scenes, null, 2)};`;
    navigator.clipboard.writeText(code);
    alert('Código copiado!');
  }, [scenes]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
        <div className="text-cyan-400 text-xl">Carregando sprite sheets...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex z-50">
      {/* Left Panel - Map Selection & NPCs */}
      <div className="w-[400px] bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden">
        {/* Map Selection Section */}
        <div className="p-3 border-b border-slate-700">
          <h3 className="text-cyan-400 font-bold text-sm mb-2">📍 ESCOLHA UM MAPA</h3>
          {savedMaps.length > 0 ? (
            <div className="space-y-2">
              <select
                value={selectedMapId}
                onChange={e => setSelectedMapId(e.target.value)}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
              >
                <option value="">Selecione um mapa...</option>
                {savedMaps.map(map => (
                  <option key={map.id} value={map.id}>{map.name}</option>
                ))}
              </select>
              {selectedMapId && (
                <div className="text-xs text-green-400">✓ Mapa selecionado</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-400">
              <p className="mb-2">Nenhum mapa salvo encontrado.</p>
              <p className="text-xs">Crie um mapa primeiro no <strong>Editor de Mapas</strong> (CRIE SEU JOGO → Editor de Mapas)</p>
            </div>
          )}
        </div>

        {/* Tools Section - apenas NPC e Spawn */}
        <div className="p-3 border-b border-slate-700">
          <h3 className="text-cyan-400 font-bold text-sm mb-2">🛠️ FERRAMENTAS</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { tool: 'npc' as EditorTool, icon: '👤', label: 'Adicionar NPC' },
              { tool: 'spawn' as EditorTool, icon: '🎯', label: 'Ponto Inicial' },
              { tool: 'trigger' as EditorTool, icon: '⚡', label: 'Trigger' },
            ].map(({ tool, icon, label }) => (
              <button
                key={tool}
                onClick={() => setCurrentTool(tool)}
                className={`px-3 py-2 text-xs rounded flex items-center gap-2 ${
                  currentTool === tool ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* NPC Templates */}
        {currentTool === 'npc' && (
          <div className="p-3 border-b border-slate-700 max-h-[300px] overflow-y-auto">
            <h3 className="text-cyan-400 font-bold text-sm mb-3">TEMPLATES DE NPC</h3>

            {/* Médicos Especialistas */}
            <div className="mb-3">
              <div className="text-[10px] text-blue-400 font-bold mb-1 flex items-center gap-1">
                <span>👨‍⚕️</span> MÉDICOS ESPECIALISTAS
              </div>
              <div className="flex flex-wrap gap-1">
                {NPC_TEMPLATES.filter(t => ['surgeon', 'anesthesiologist', 'cardiologist', 'cardiac_surgeon', 'neurosurgeon', 'orthopedist', 'obstetrician', 'pediatrician', 'intensivist', 'emergency_physician', 'radiologist', 'pathologist', 'oncologist', 'urologist', 'gastroenterologist', 'pulmonologist', 'nephrologist', 'dermatologist', 'ophthalmologist', 'otolaryngologist', 'plastic_surgeon', 'vascular_surgeon', 'thoracic_surgeon'].includes(t.id)).map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedNpcTemplate(template.id)}
                    title={template.role}
                    className={`px-2 py-1 text-[9px] rounded ${selectedNpcTemplate === template.id ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: template.color, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Residentes */}
            <div className="mb-3">
              <div className="text-[10px] text-green-400 font-bold mb-1 flex items-center gap-1">
                <span>🎓</span> RESIDENTES
              </div>
              <div className="flex flex-wrap gap-1">
                {NPC_TEMPLATES.filter(t => t.id.startsWith('resident')).map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedNpcTemplate(template.id)}
                    title={template.role}
                    className={`px-2 py-1 text-[9px] rounded ${selectedNpcTemplate === template.id ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: template.color, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Enfermagem */}
            <div className="mb-3">
              <div className="text-[10px] text-pink-400 font-bold mb-1 flex items-center gap-1">
                <span>👩‍⚕️</span> ENFERMAGEM
              </div>
              <div className="flex flex-wrap gap-1">
                {NPC_TEMPLATES.filter(t => ['nurse', 'nurse_chief', 'surgical_nurse', 'circulating_nurse', 'icu_nurse', 'nursing_tech'].includes(t.id)).map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedNpcTemplate(template.id)}
                    title={template.role}
                    className={`px-2 py-1 text-[9px] rounded ${selectedNpcTemplate === template.id ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: template.color, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Outros Profissionais */}
            <div className="mb-3">
              <div className="text-[10px] text-purple-400 font-bold mb-1 flex items-center gap-1">
                <span>🔬</span> OUTROS PROFISSIONAIS
              </div>
              <div className="flex flex-wrap gap-1">
                {NPC_TEMPLATES.filter(t => ['perfusionist', 'physiotherapist', 'pharmacist', 'lab_technician', 'radiology_tech', 'biomedical'].includes(t.id)).map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedNpcTemplate(template.id)}
                    title={template.role}
                    className={`px-2 py-1 text-[9px] rounded ${selectedNpcTemplate === template.id ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: template.color, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Administrativo */}
            <div className="mb-3">
              <div className="text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                <span>🏢</span> ADMINISTRATIVO
              </div>
              <div className="flex flex-wrap gap-1">
                {NPC_TEMPLATES.filter(t => ['receptionist', 'admin', 'security', 'cleaning'].includes(t.id)).map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedNpcTemplate(template.id)}
                    title={template.role}
                    className={`px-2 py-1 text-[9px] rounded ${selectedNpcTemplate === template.id ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: template.color, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Pacientes */}
            <div className="mb-2">
              <div className="text-[10px] text-yellow-400 font-bold mb-1 flex items-center gap-1">
                <span>🛏️</span> PACIENTES
              </div>
              <div className="flex flex-wrap gap-1">
                {NPC_TEMPLATES.filter(t => ['patient', 'patient_surgical', 'patient_icu', 'visitor'].includes(t.id)).map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedNpcTemplate(template.id)}
                    title={template.role}
                    className={`px-2 py-1 text-[9px] rounded ${selectedNpcTemplate === template.id ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: template.color, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="flex-1 p-3 overflow-y-auto">
          {/* NPC Selecionado Info */}
          {selectedNpcTemplate && (
            <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
              <h4 className="text-cyan-400 font-bold text-xs mb-2">NPC SELECIONADO</h4>
              {(() => {
                const template = NPC_TEMPLATES.find(t => t.id === selectedNpcTemplate);
                return template ? (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: template.color }}
                    >
                      {template.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-bold">{template.name}</div>
                      <div className="text-slate-400 text-xs">{template.role}</div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* NPCs na Cena */}
          {currentScene && currentScene.npcs.length > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
              <h4 className="text-cyan-400 font-bold text-xs mb-2">NPCs NA CENA ({currentScene.npcs.length})</h4>
              <div className="space-y-1 max-h-[150px] overflow-y-auto">
                {currentScene.npcs.map(npc => {
                  const template = NPC_TEMPLATES.find(t => t.id === npc.templateId);
                  return (
                    <div key={npc.id} className="flex items-center justify-between bg-slate-800 rounded px-2 py-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: template?.color }} />
                        <span className="text-xs text-white">{npc.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setScenes(prev => prev.map(s =>
                            s.id === currentSceneId
                              ? { ...s, npcs: s.npcs.filter(n => n.id !== npc.id) }
                              : s
                          ));
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Instruções */}
          <div className="bg-slate-900/50 rounded-lg p-3">
            <h4 className="text-slate-400 font-bold text-xs mb-2">COMO USAR</h4>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>1. Escolha um mapa salvo</li>
              <li>2. Selecione um tipo de NPC</li>
              <li>3. Clique no mapa para posicionar</li>
              <li>4. Use 🎯 para definir ponto inicial</li>
              <li>5. Salve sua cena</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Area - Map Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-slate-800 p-2 border-b border-slate-700 flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
          >
            Fechar
          </button>

          <div className="h-5 w-px bg-slate-600" />

          {/* Scene selector */}
          <select
            value={currentSceneId}
            onChange={e => setCurrentSceneId(e.target.value)}
            className="bg-slate-700 text-white px-2 py-1 rounded text-sm"
          >
            {scenes.map(scene => (
              <option key={scene.id} value={scene.id}>{scene.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowSceneModal(true)}
            className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm"
          >
            + Nova Cena
          </button>

          <div className="h-5 w-px bg-slate-600" />

          {/* Zoom */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>Zoom:</span>
            {[0.5, 1, 1.5, 2].map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-2 py-1 rounded ${zoom === z ? 'bg-cyan-600 text-white' : 'bg-slate-700'}`}
              >
                {z}x
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-slate-600" />

          {/* View toggles */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-1 rounded text-xs ${showGrid ? 'bg-cyan-600' : 'bg-slate-700'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setShowCollision(!showCollision)}
            className={`px-2 py-1 rounded text-xs ${showCollision ? 'bg-red-600' : 'bg-slate-700'}`}
          >
            Colisão
          </button>
          <button
            onClick={() => setShowNpcs(!showNpcs)}
            className={`px-2 py-1 rounded text-xs ${showNpcs ? 'bg-green-600' : 'bg-slate-700'}`}
          >
            NPCs
          </button>

          <div className="flex-1" />

          {/* Save/Load */}
          <button onClick={saveProject} className="px-3 py-1 bg-green-600 text-white rounded text-sm">
            Salvar
          </button>
          <button onClick={loadProject} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
            Carregar
          </button>
          <button onClick={exportProject} className="px-3 py-1 bg-purple-600 text-white rounded text-sm">
            Exportar
          </button>
        </div>

        {/* Map Canvas */}
        <div className="flex-1 overflow-hidden bg-slate-950">
          <canvas
            ref={mapCanvasRef}
            width={1000}
            height={700}
            className="cursor-crosshair"
            style={{ imageRendering: 'pixelated' }}
            onMouseDown={handleMapMouseDown}
            onMouseMove={handleMapMouseMove}
            onMouseUp={handleMapMouseUp}
            onMouseLeave={handleMapMouseUp}
            onContextMenu={e => e.preventDefault()}
          />
        </div>

        {/* Status Bar */}
        <div className="bg-slate-800 p-2 text-xs text-slate-400 flex gap-4 border-t border-slate-700">
          <span>Cena: {currentScene?.name || '-'}</span>
          <span>Tamanho: {currentScene?.width || 0}x{currentScene?.height || 0}</span>
          <span>NPCs: {currentScene?.npcs.length || 0}</span>
          <span>Clique esquerdo: {currentTool === 'npc' ? 'Adicionar NPC' : 'Pintar'} | Clique direito: Mover câmera</span>
        </div>
      </div>

      {/* New Scene Modal */}
      {showSceneModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60">
          <div className="bg-slate-800 p-6 rounded-lg w-96">
            <h2 className="text-cyan-400 font-bold mb-4">Nova Cena</h2>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-1">Nome da Cena</label>
              <input
                type="text"
                value={newSceneName}
                onChange={e => setNewSceneName(e.target.value)}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded"
                placeholder="Ex: Sala de Cirurgia"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-1">Template</label>
              <div className="grid grid-cols-2 gap-2">
                {SCENE_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setNewSceneTemplate(template.id)}
                    className={`p-2 text-left rounded text-sm ${
                      newSceneTemplate === template.id
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className="font-bold">{template.name}</div>
                    <div className="text-xs opacity-70">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (newSceneName && newSceneTemplate) {
                    createNewScene(newSceneName, newSceneTemplate);
                  }
                }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded"
              >
                Criar
              </button>
              <button
                onClick={() => setShowSceneModal(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SceneEditor;
