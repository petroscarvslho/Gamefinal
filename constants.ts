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

// Map Dimensions - Hospital Compacto (baseado na referência LimeZu)
export const MAP_WIDTH = 35;  // 35 tiles de largura
export const MAP_HEIGHT = 45; // 45 tiles de altura

const createMap = (width: number, height: number, defaultTile: TileType): TileType[][] => {
  return Array(height).fill(null).map(() => Array(width).fill(defaultTile));
};

// Especialidades cirúrgicas e seus equipamentos
interface OREquipment {
  specialty: string;
  equipment: TileType[];
}

const OR_SPECIALTIES: OREquipment[] = [
  { specialty: 'Cirurgia Geral', equipment: [TileType.LAPAROSCOPY_TOWER, TileType.ELECTROSURGICAL_UNIT] },
  { specialty: 'Cirurgia Cardíaca', equipment: [TileType.CEC_MACHINE, TileType.IABP, TileType.CELL_SAVER] },
  { specialty: 'Ortopedia', equipment: [TileType.C_ARM, TileType.ARTHROSCOPY_TOWER, TileType.TRACTION_TABLE] },
  { specialty: 'Neurocirurgia', equipment: [TileType.SURGICAL_MICROSCOPE, TileType.NEURO_NAVIGATION, TileType.CRANIOTOME] },
  { specialty: 'Urologia', equipment: [TileType.LITHOTRIPSY, TileType.CYSTOSCOPY_TOWER] },
  { specialty: 'Oftalmologia', equipment: [TileType.PHACO_MACHINE, TileType.OPERATING_MICROSCOPE] },
  { specialty: 'Obstetrícia', equipment: [TileType.DELIVERY_BED, TileType.FETAL_MONITOR, TileType.INFANT_WARMER] },
  { specialty: 'Laparoscopia', equipment: [TileType.LAPAROSCOPY_TOWER, TileType.INSUFFLATOR] },
  { specialty: 'Vascular', equipment: [TileType.C_ARM, TileType.ULTRASOUND] },
  { specialty: 'Torácica', equipment: [TileType.VENTILATOR, TileType.ELECTROSURGICAL_UNIT] },
  { specialty: 'Plástica', equipment: [TileType.SURGICAL_MICROSCOPE, TileType.ELECTROSURGICAL_UNIT] },
  { specialty: 'Otorrino', equipment: [TileType.SURGICAL_MICROSCOPE, TileType.NEURO_NAVIGATION] },
  { specialty: 'Pediatria', equipment: [TileType.INFANT_WARMER, TileType.PATIENT_MONITOR] },
  { specialty: 'Emergência', equipment: [TileType.CRASH_CART, TileType.DEFIBRILLATOR, TileType.ULTRASOUND] },
  { specialty: 'Transplante', equipment: [TileType.CEC_MACHINE, TileType.CELL_SAVER, TileType.PATIENT_MONITOR] },
];

export const generateHospitalMap = (): TileType[][] => {
  const map = createMap(MAP_WIDTH, MAP_HEIGHT, TileType.WALL);

  // Helper to carve rooms
  const carveRoom = (x: number, y: number, w: number, h: number, floorType: TileType = TileType.FLOOR) => {
    for (let i = y; i < y + h && i < MAP_HEIGHT; i++) {
      for (let j = x; j < x + w && j < MAP_WIDTH; j++) {
        if (i >= 0 && j >= 0) map[i][j] = floorType;
      }
    }
  };

  const placeObject = (x: number, y: number, tile: TileType) => {
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
      map[y][x] = tile;
    }
  };

  const placeDoor = (x: number, y: number) => {
    placeObject(x, y, TileType.DOOR);
  };

  const placeHorizontalLine = (x: number, y: number, length: number, tile: TileType) => {
    for (let i = 0; i < length; i++) placeObject(x + i, y, tile);
  };

  const placeVerticalLine = (x: number, y: number, length: number, tile: TileType) => {
    for (let i = 0; i < length; i++) placeObject(x, y + i, tile);
  };

  // ============ LAYOUT DO HOSPITAL (Baseado na Referência LimeZu) ============
  // Mapa: 35 largura x 45 altura

  // === RECEPÇÃO (topo) ===
  carveRoom(1, 1, 33, 6, TileType.FLOOR);

  // Balcão de recepção
  placeHorizontalLine(10, 2, 15, TileType.DESK_RECEPTION);
  placeObject(12, 1, TileType.COMPUTER_DESK);
  placeObject(17, 1, TileType.COMPUTER_DESK);
  placeObject(22, 1, TileType.COMPUTER_DESK);

  // Cadeiras de espera (fileira)
  for (let i = 0; i < 8; i++) {
    placeObject(3 + i * 2, 5, TileType.CHAIR_WAITING);
  }

  // Decoração recepção
  placeObject(2, 2, TileType.VENDING_MACHINE);
  placeObject(3, 2, TileType.REFRIGERATOR);
  placeObject(30, 2, TileType.CABINET);
  placeObject(31, 2, TileType.CABINET);
  placeObject(32, 2, TileType.PLANT);
  placeObject(27, 5, TileType.PLANT);

  // === CORREDOR HORIZONTAL PRINCIPAL ===
  carveRoom(1, 7, 33, 3, TileType.FLOOR);
  // Plantas no corredor
  placeObject(5, 8, TileType.PLANT);
  placeObject(29, 8, TileType.PLANT);

  // === SALA DE RADIOLOGIA (esquerda) ===
  carveRoom(1, 10, 12, 8, TileType.FLOOR_OR);
  placeDoor(13, 13);

  placeObject(3, 12, TileType.MRI_MACHINE);
  placeObject(6, 11, TileType.PATIENT_MONITOR);
  placeObject(9, 11, TileType.COMPUTER_DESK);
  placeObject(3, 15, TileType.CHAIR_WAITING);
  placeObject(5, 15, TileType.CHAIR_WAITING);
  placeObject(10, 14, TileType.CABINET);

  // === CONSULTÓRIO (centro) ===
  carveRoom(14, 10, 8, 8, TileType.FLOOR);
  placeDoor(14, 13);

  placeObject(16, 11, TileType.COMPUTER_DESK);
  placeObject(18, 12, TileType.BED);
  placeObject(20, 11, TileType.CABINET);
  placeObject(15, 15, TileType.CHAIR_WAITING);
  placeObject(17, 15, TileType.PLANT);

  // === QUARTOS DE PACIENTES (direita) ===
  carveRoom(23, 10, 11, 8, TileType.FLOOR);
  placeDoor(23, 13);

  // Camas com cortinas e monitores
  placeObject(25, 11, TileType.BED);
  placeObject(27, 11, TileType.PATIENT_MONITOR);
  placeObject(28, 11, TileType.IV_STAND);

  placeObject(30, 11, TileType.BED);
  placeObject(32, 11, TileType.PATIENT_MONITOR);

  placeObject(25, 15, TileType.BED);
  placeObject(27, 15, TileType.CABINET);
  placeObject(30, 15, TileType.BED);
  placeObject(32, 15, TileType.PLANT);

  // === CORREDOR VERTICAL ===
  carveRoom(16, 18, 3, 10, TileType.FLOOR);

  // === FARMÁCIA (esquerda inferior) ===
  carveRoom(1, 18, 14, 9, TileType.FLOOR);
  placeDoor(15, 22);

  // Estantes de medicamentos
  placeVerticalLine(2, 19, 4, TileType.CABINET);
  placeVerticalLine(4, 19, 4, TileType.CABINET);
  placeVerticalLine(6, 19, 4, TileType.CABINET);
  placeVerticalLine(8, 19, 4, TileType.CABINET);

  placeObject(11, 19, TileType.COMPUTER_DESK);
  placeObject(13, 19, TileType.REFRIGERATOR);
  placeObject(2, 25, TileType.DRUG_CART);
  placeObject(12, 25, TileType.CRASH_CART);

  // === ENFERMARIA (direita inferior) ===
  carveRoom(20, 18, 14, 9, TileType.FLOOR);
  placeDoor(20, 22);

  // Camas da enfermaria
  placeObject(22, 19, TileType.BED);
  placeObject(24, 19, TileType.PATIENT_MONITOR);
  placeObject(27, 19, TileType.BED);
  placeObject(29, 19, TileType.PATIENT_MONITOR);
  placeObject(31, 19, TileType.IV_STAND);

  placeObject(22, 24, TileType.BED);
  placeObject(24, 24, TileType.CABINET);
  placeObject(27, 24, TileType.BED);
  placeObject(29, 24, TileType.CABINET);
  placeObject(31, 24, TileType.PLANT);

  // === CORREDOR INFERIOR ===
  carveRoom(1, 27, 33, 3, TileType.FLOOR);

  // === SALA DE ESPERA GRANDE (inferior) ===
  carveRoom(1, 30, 20, 14, TileType.FLOOR);
  placeDoor(10, 30);

  // Sofás e cadeiras
  placeObject(2, 32, TileType.SOFA);
  placeObject(3, 32, TileType.SOFA);
  placeObject(5, 32, TileType.CHAIR_WAITING);
  placeObject(7, 32, TileType.CHAIR_WAITING);

  placeObject(2, 36, TileType.CHAIR_WAITING);
  placeObject(4, 36, TileType.CHAIR_WAITING);
  placeObject(6, 36, TileType.CHAIR_WAITING);
  placeObject(8, 36, TileType.CHAIR_WAITING);

  placeObject(2, 40, TileType.CHAIR_WAITING);
  placeObject(4, 40, TileType.CHAIR_WAITING);
  placeObject(6, 40, TileType.CHAIR_WAITING);
  placeObject(8, 40, TileType.CHAIR_WAITING);

  // Máquinas e decoração
  placeObject(18, 31, TileType.VENDING_MACHINE);
  placeObject(18, 33, TileType.VENDING_MACHINE);
  placeObject(12, 38, TileType.PLANT);
  placeObject(16, 38, TileType.PLANT);

  // TV na parede
  placeObject(10, 31, TileType.TV_SCREEN);

  // === ÁREA ADMINISTRATIVA (direita inferior) ===
  carveRoom(22, 30, 12, 8, TileType.FLOOR);
  placeDoor(22, 33);

  placeObject(24, 31, TileType.COMPUTER_DESK);
  placeObject(26, 31, TileType.COMPUTER_DESK);
  placeObject(28, 31, TileType.CABINET);
  placeObject(31, 31, TileType.CABINET);
  placeObject(24, 35, TileType.CHAIR_WAITING);
  placeObject(26, 35, TileType.CHAIR_WAITING);
  placeObject(30, 35, TileType.PLANT);

  // === ENTRADA PRINCIPAL (inferior) ===
  carveRoom(22, 38, 12, 6, TileType.FLOOR);
  placeDoor(27, 43);
  placeDoor(28, 43);

  // Decoração entrada
  placeObject(23, 39, TileType.PLANT);
  placeObject(32, 39, TileType.PLANT);
  placeObject(25, 41, TileType.CHAIR_WAITING);
  placeObject(27, 41, TileType.DESK_RECEPTION);
  placeObject(29, 41, TileType.CHAIR_WAITING);

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
      chair: { x: 0, y: 5 },
      bed: { x: 0, y: 8 },
      desk: { x: 0, y: 12 },
      cabinet: { x: 4, y: 10 },
      plant: { x: 16, y: 0 },
      computer: { x: 8, y: 4 },
      vending: { x: 24, y: 8 },
    }
  },
  hospital: {
    src: '/assets/limezu/interiors/Hospital_32x32.png',
    tileSize: 32,
    map: {
      // Equipamentos médicos
      hospitalBed: { x: 0, y: 0 },
      hospitalBed2: { x: 2, y: 0 },
      wheelchair: { x: 4, y: 0 },
      stretcher: { x: 6, y: 0 },
      ivStand: { x: 8, y: 0 },
      monitor: { x: 10, y: 0 },
      // Móveis
      desk: { x: 0, y: 4 },
      cabinet: { x: 2, y: 4 },
      sink: { x: 4, y: 4 },
      // Equipamentos especiais
      mri: { x: 0, y: 8 },
      xray: { x: 4, y: 8 },
      surgicalTable: { x: 8, y: 8 },
      surgicalLight: { x: 12, y: 8 },
      defibrillator: { x: 14, y: 8 },
    }
  },
  generic: {
    src: '/assets/limezu/interiors/Generic_32x32.png',
    tileSize: 32,
    map: {
      sofa: { x: 0, y: 0 },
      table: { x: 4, y: 0 },
      chair: { x: 8, y: 0 },
      lamp: { x: 12, y: 0 },
      plant: { x: 16, y: 0 },
    }
  },
  bathroom: {
    src: '/assets/limezu/interiors/Bathroom_32x32.png',
    tileSize: 32,
    map: {
      toilet: { x: 0, y: 0 },
      sink: { x: 2, y: 0 },
      shower: { x: 4, y: 0 },
      bathtub: { x: 6, y: 0 },
    }
  }
};

// Personagens pré-feitos LimeZu
export const CHARACTER_SPRITES = {
  basePath: '/assets/limezu/characters/premade',
  characters: [
    { id: 1, name: 'Personagem 1', file: 'Premade_Character_32x32_01.png' },
    { id: 2, name: 'Personagem 2', file: 'Premade_Character_32x32_02.png' },
    { id: 3, name: 'Personagem 3', file: 'Premade_Character_32x32_03.png' },
    { id: 4, name: 'Personagem 4', file: 'Premade_Character_32x32_04.png' },
    { id: 5, name: 'Personagem 5', file: 'Premade_Character_32x32_05.png' },
    { id: 6, name: 'Personagem 6', file: 'Premade_Character_32x32_06.png' },
    { id: 7, name: 'Personagem 7', file: 'Premade_Character_32x32_07.png' },
    { id: 8, name: 'Personagem 8', file: 'Premade_Character_32x32_08.png' },
    { id: 9, name: 'Personagem 9', file: 'Premade_Character_32x32_09.png' },
    { id: 10, name: 'Personagem 10', file: 'Premade_Character_32x32_10.png' },
  ],
};
