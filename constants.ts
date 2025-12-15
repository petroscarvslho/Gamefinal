import { TileType } from './types';

export const TILE_SIZE = 32;
export const MOVE_SPEED = 4; 
export const ANIMATION_SPEED = 10;
export const INTERACTION_DISTANCE = 40;

// High-fidelity Palette - Refined for "Minish Cap" feel (softer, pastel-ish)
export const PALETTE = {
  // Outlines (Crucial for RPG look) - tinted blue-black for softness
  outline: '#1e293b', 
  outlineSoft: '#475569',
  
  // Floor Textures
  floorBase: '#f8fafc',
  floorTileEdge: '#e2e8f0',
  floorOR: '#ecfeff',
  floorORGrid: '#a5f3fc', 
  floorWarm: '#fffbeb',    // Warmer waiting room
  floorWarmDark: '#fef3c7',

  // Walls
  wallBase: '#cbd5e1',     
  wallDark: '#94a3b8',
  wallCap: '#f1f5f9',      // Top of wall
  baseboard: '#475569',

  // Furniture Materials
  woodLight: '#e7d5c0',    // Softer wood
  woodDark: '#bfa083',
  woodOutline: '#8c6b5d',
  
  metalLight: '#f1f5f9',
  metalBase: '#cbd5e1',
  metalDark: '#64748b',
  
  // Accents
  plasticRed: '#f87171',
  plasticRedDark: '#dc2626',
  
  glass: '#cffafe',
  glassDark: '#06b6d4',
  
  // Bedding
  bedSheet: '#93c5fd',
  bedSheetDark: '#60a5fa',
  bedPillow: '#ffffff',

  // Shadows
  shadow: 'rgba(0,0,0,0.15)',
  shadowStrong: 'rgba(0,0,0,0.3)',

  skin: '#ffedd5',
};

// Map Dimensions
export const MAP_WIDTH = 32;
export const MAP_HEIGHT = 24;

const createMap = (width: number, height: number, defaultTile: TileType): TileType[][] => {
  return Array(height).fill(null).map(() => Array(width).fill(defaultTile));
};

export const generateHospitalMap = (): TileType[][] => {
  const map = createMap(MAP_WIDTH, MAP_HEIGHT, TileType.WALL); 

  // Helper to carve rooms
  const carveRoom = (x: number, y: number, w: number, h: number, floorType: TileType = TileType.FLOOR) => {
    for (let i = y; i < y + h; i++) {
      for (let j = x; j < x + w; j++) {
        map[i][j] = floorType;
      }
    }
  };

  const placeObject = (x: number, y: number, tile: TileType) => {
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
      map[y][x] = tile;
    }
  };

  // --- LAYOUT ---
  
  // 1. Central Corridor
  carveRoom(12, 4, 8, 18, TileType.FLOOR);

  // 2. Reception Area
  carveRoom(8, 2, 16, 6, TileType.FLOOR);
  
  // Reception Desk (Island)
  placeObject(14, 4, TileType.DESK_RECEPTION);
  placeObject(15, 4, TileType.DESK_RECEPTION);
  placeObject(16, 4, TileType.DESK_RECEPTION);
  placeObject(17, 4, TileType.DESK_RECEPTION);
  placeObject(15, 3, TileType.COMPUTER_DESK); 

  // 3. Waiting Room (Warm floor)
  carveRoom(20, 14, 10, 8, TileType.FLOOR); 
  
  // Doorway
  placeObject(20, 16, TileType.FLOOR);
  placeObject(20, 17, TileType.FLOOR);
  // Chairs
  placeObject(22, 16, TileType.CHAIR_WAITING);
  placeObject(22, 18, TileType.CHAIR_WAITING);
  placeObject(24, 16, TileType.CHAIR_WAITING);
  placeObject(24, 18, TileType.CHAIR_WAITING);
  placeObject(26, 16, TileType.CHAIR_WAITING);
  placeObject(26, 18, TileType.CHAIR_WAITING);
  // Vending Machines
  placeObject(28, 14, TileType.VENDING_MACHINE);
  placeObject(29, 14, TileType.VENDING_MACHINE);
  // Plants
  placeObject(29, 21, TileType.PLANT);
  placeObject(21, 14, TileType.PLANT);

  // 4. Ward / Patient Rooms
  carveRoom(2, 14, 10, 8, TileType.FLOOR);
  placeObject(12, 16, TileType.FLOOR);
  placeObject(12, 17, TileType.FLOOR);
  
  placeObject(3, 15, TileType.BED);
  placeObject(3, 19, TileType.BED);
  placeObject(7, 15, TileType.BED);
  placeObject(7, 19, TileType.BED);
  
  placeObject(4, 15, TileType.CABINET);
  placeObject(4, 19, TileType.CABINET);
  
  // Plants in ward
  placeObject(2, 21, TileType.PLANT);

  // 5. Surgical / MRI Suite (Top Right)
  carveRoom(22, 2, 8, 10, TileType.FLOOR_OR);
  placeObject(22, 6, TileType.DOOR);
  
  // MRI Machine (Multi-tile visual, but logical center here)
  placeObject(27, 5, TileType.MRI_MACHINE);
  placeObject(23, 4, TileType.COMPUTER_DESK);
  placeObject(28, 9, TileType.CABINET);
  placeObject(29, 9, TileType.CABINET);

  // 6. Operating Room (Top Left)
  carveRoom(2, 2, 8, 10, TileType.FLOOR_OR);
  placeObject(10, 6, TileType.DOOR);
  
  // OR Table
  placeObject(5, 6, TileType.OR_TABLE);
  
  // Scrub Sink
  placeObject(3, 2, TileType.SINK);
  placeObject(4, 2, TileType.SINK);
  
  // Med Cabinets
  placeObject(2, 9, TileType.CABINET);
  placeObject(3, 9, TileType.CABINET);

  return map;
};

export const INITIAL_MAP = generateHospitalMap();

// Spritesheets (LimeZu Modern Interiors) - 32x32
export const SPRITE_SHEETS = {
  room: {
    src: '/assets/limezu/interiors/Room_Builder_32x32.png',
    tileSize: 32,
    map: {
      floor: { x: 0, y: 0 },       // piso frio claro
      floorWarm: { x: 1, y: 0 },   // piso mais quente
      wall: { x: 0, y: 5 },        // parede padrão
      wallAlt: { x: 1, y: 5 },
      door: { x: 6, y: 6 }         // porta simples
    }
  },
  interiors: {
    src: '/assets/limezu/interiors/Interiors_32x32.png',
    tileSize: 32,
    map: {
      // Preencher conforme necessidade. Mantém fallback se não definido.
      chair: null as null | { x: number; y: number },
      bed: null as null | { x: number; y: number }
    }
  }
};
