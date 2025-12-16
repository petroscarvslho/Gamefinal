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

// Map Dimensions - Hospital Grande
export const MAP_WIDTH = 80;  // 80 tiles de largura
export const MAP_HEIGHT = 60; // 60 tiles de altura

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

  // ============ LAYOUT DO HOSPITAL GRANDE ============

  // === ÁREA 1: ENTRADA E RECEPÇÃO (parte inferior central) ===
  // Entrada principal
  carveRoom(30, 52, 20, 7, TileType.FLOOR);
  // Portas de entrada
  placeDoor(39, 58);
  placeDoor(40, 58);

  // Recepção
  for (let i = 33; i <= 46; i++) placeObject(i, 54, TileType.DESK_RECEPTION);
  placeObject(36, 53, TileType.COMPUTER_DESK);
  placeObject(40, 53, TileType.COMPUTER_DESK);
  placeObject(44, 53, TileType.COMPUTER_DESK);

  // Plantas decorativas
  placeObject(31, 53, TileType.PLANT);
  placeObject(48, 53, TileType.PLANT);

  // === ÁREA 2: SALA DE ESPERA ===
  carveRoom(52, 48, 26, 10, TileType.FLOOR);
  placeDoor(52, 52, );

  // Cadeiras (fileiras)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      placeObject(55 + col * 3, 50 + row * 2, TileType.CHAIR_WAITING);
    }
  }
  // Máquinas de venda
  placeObject(75, 49, TileType.VENDING_MACHINE);
  placeObject(76, 49, TileType.VENDING_MACHINE);
  // TV
  placeObject(65, 48, TileType.TV_SCREEN);
  // Plantas
  placeObject(53, 49, TileType.PLANT);
  placeObject(77, 56, TileType.PLANT);
  // Bebedouro
  placeObject(74, 56, TileType.WATER_DISPENSER);

  // === ÁREA 3: CORREDOR PRINCIPAL (horizontal) ===
  carveRoom(2, 44, 76, 4, TileType.FLOOR);

  // === ÁREA 4: UTI (esquerda) ===
  carveRoom(2, 30, 24, 12, TileType.FLOOR_OR);
  placeDoor(26, 36);

  // Leitos de UTI (6 leitos)
  for (let i = 0; i < 3; i++) {
    placeObject(4 + i * 7, 32, TileType.BED);
    placeObject(5 + i * 7, 32, TileType.PATIENT_MONITOR);
    placeObject(4 + i * 7, 38, TileType.BED);
    placeObject(5 + i * 7, 38, TileType.PATIENT_MONITOR);
    placeObject(6 + i * 7, 32, TileType.IV_STAND);
    placeObject(6 + i * 7, 38, TileType.IV_STAND);
  }
  // Equipamentos UTI
  placeObject(3, 31, TileType.CRASH_CART);
  placeObject(24, 31, TileType.DEFIBRILLATOR);
  placeObject(3, 40, TileType.VENTILATOR);
  placeObject(24, 40, TileType.INFUSION_PUMP);

  // === ÁREA 5: CRPA - Recuperação Pós-Anestésica ===
  carveRoom(54, 30, 24, 12, TileType.FLOOR_OR);
  placeDoor(54, 36);

  // Leitos CRPA (6 leitos)
  for (let i = 0; i < 3; i++) {
    placeObject(56 + i * 7, 32, TileType.STRETCHER);
    placeObject(57 + i * 7, 32, TileType.PATIENT_MONITOR);
    placeObject(56 + i * 7, 38, TileType.STRETCHER);
    placeObject(57 + i * 7, 38, TileType.PATIENT_MONITOR);
    placeObject(58 + i * 7, 32, TileType.OXYGEN_TANK);
    placeObject(58 + i * 7, 38, TileType.IV_STAND);
  }
  // Posto de enfermagem CRPA
  placeObject(74, 31, TileType.COMPUTER_DESK);
  placeObject(74, 40, TileType.CRASH_CART);

  // === ÁREA 6: COPA (canto inferior esquerdo) ===
  carveRoom(2, 48, 14, 10, TileType.FLOOR);
  placeDoor(16, 52);

  // Móveis da copa
  placeObject(3, 49, TileType.COFFEE_MACHINE);
  placeObject(4, 49, TileType.MICROWAVE);
  placeObject(5, 49, TileType.REFRIGERATOR);
  placeObject(6, 49, TileType.WATER_DISPENSER);
  // Mesa e cadeiras
  placeObject(8, 52, TileType.DINING_TABLE);
  placeObject(7, 52, TileType.CHAIR_WAITING);
  placeObject(9, 52, TileType.CHAIR_WAITING);
  placeObject(11, 52, TileType.DINING_TABLE);
  placeObject(10, 52, TileType.CHAIR_WAITING);
  placeObject(12, 52, TileType.CHAIR_WAITING);
  // Sofá
  placeObject(3, 55, TileType.SOFA);
  placeObject(4, 55, TileType.SOFA);
  // TV
  placeObject(3, 56, TileType.TV_SCREEN);
  // Lockers
  placeObject(13, 49, TileType.LOCKERS);
  placeObject(14, 49, TileType.LOCKERS);

  // === ÁREA 7: REFEITÓRIO (próximo à copa) ===
  carveRoom(18, 48, 12, 10, TileType.FLOOR);
  placeDoor(18, 52);

  // Mesas do refeitório
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      placeObject(20 + col * 5, 50 + row * 4, TileType.DINING_TABLE);
      placeObject(19 + col * 5, 50 + row * 4, TileType.CHAIR_WAITING);
      placeObject(21 + col * 5, 50 + row * 4, TileType.CHAIR_WAITING);
    }
  }

  // === CORREDOR VERTICAL (liga entrada às salas) ===
  carveRoom(38, 2, 4, 50, TileType.FLOOR);

  // === ÁREA 8: BLOCO CIRÚRGICO - 15 SALAS ===
  // Corredor do bloco cirúrgico (horizontal superior)
  carveRoom(2, 18, 76, 4, TileType.FLOOR_OR);

  // Lavabos (centro do corredor)
  for (let i = 0; i < 8; i++) {
    placeObject(32 + i * 2, 19, TileType.SINK);
  }

  // Salas de cirurgia - Lado esquerdo (8 salas)
  const leftORs = [
    { x: 2, y: 2, specialty: 0 },
    { x: 11, y: 2, specialty: 1 },
    { x: 20, y: 2, specialty: 2 },
    { x: 29, y: 2, specialty: 3 },
    { x: 2, y: 10, specialty: 4 },
    { x: 11, y: 10, specialty: 5 },
    { x: 20, y: 10, specialty: 6 },
    { x: 29, y: 10, specialty: 7 },
  ];

  // Salas de cirurgia - Lado direito (7 salas)
  const rightORs = [
    { x: 44, y: 2, specialty: 8 },
    { x: 53, y: 2, specialty: 9 },
    { x: 62, y: 2, specialty: 10 },
    { x: 71, y: 2, specialty: 11 },
    { x: 44, y: 10, specialty: 12 },
    { x: 53, y: 10, specialty: 13 },
    { x: 62, y: 10, specialty: 14 },
  ];

  const createOR = (startX: number, startY: number, specialtyIndex: number) => {
    const orWidth = 8;
    const orHeight = 6;

    // Sala
    carveRoom(startX, startY, orWidth, orHeight, TileType.FLOOR_OR);

    // Porta (parte inferior da sala)
    placeDoor(startX + 3, startY + orHeight);
    placeDoor(startX + 4, startY + orHeight);

    // Mesa cirúrgica (centro)
    placeObject(startX + 3, startY + 2, TileType.OR_TABLE);

    // Foco cirúrgico
    placeObject(startX + 3, startY + 1, TileType.SURGICAL_LIGHT);

    // Equipamento de anestesia (lado esquerdo)
    placeObject(startX + 1, startY + 2, TileType.ANESTHESIA_MACHINE);
    placeObject(startX + 1, startY + 3, TileType.PATIENT_MONITOR);
    placeObject(startX + 1, startY + 4, TileType.IV_STAND);

    // Mesa Mayo
    placeObject(startX + 5, startY + 2, TileType.MAYO_STAND);

    // Back table
    placeObject(startX + 6, startY + 1, TileType.BACK_TABLE);

    // Equipamentos específicos da especialidade
    const specialty = OR_SPECIALTIES[specialtyIndex];
    if (specialty && specialty.equipment.length > 0) {
      specialty.equipment.forEach((eq, idx) => {
        const eqX = startX + 5 + (idx % 2);
        const eqY = startY + 3 + Math.floor(idx / 2);
        if (eqY < startY + orHeight - 1) {
          placeObject(eqX, eqY, eq);
        }
      });
    }

    // Balde e hamper
    placeObject(startX + 1, startY + 5, TileType.KICK_BUCKET);
    placeObject(startX + 6, startY + 5, TileType.HAMPER);
  };

  // Criar todas as salas de cirurgia
  leftORs.forEach(or => createOR(or.x, or.y, or.specialty));
  rightORs.forEach(or => createOR(or.x, or.y, or.specialty));

  // === ÁREA 9: ENFERMARIAS (lado direito inferior) ===
  carveRoom(54, 22, 24, 6, TileType.FLOOR);
  placeDoor(54, 24);

  // Leitos
  for (let i = 0; i < 4; i++) {
    placeObject(56 + i * 6, 23, TileType.BED);
    placeObject(57 + i * 6, 23, TileType.CABINET);
    placeObject(58 + i * 6, 23, TileType.CHAIR_WAITING);
  }

  // === ÁREA 10: FARMÁCIA ===
  carveRoom(28, 30, 12, 6, TileType.FLOOR);
  placeDoor(28, 32);

  // Armários de medicamentos
  for (let i = 0; i < 4; i++) {
    placeObject(30 + i * 2, 31, TileType.CABINET);
    placeObject(30 + i * 2, 34, TileType.CABINET);
  }
  placeObject(38, 31, TileType.COMPUTER_DESK);

  // === ÁREA 11: CENTRAL DE ESTERILIZAÇÃO ===
  carveRoom(28, 38, 12, 5, TileType.FLOOR_OR);
  placeDoor(28, 40);

  // Equipamentos de esterilização
  placeObject(30, 39, TileType.CABINET);
  placeObject(32, 39, TileType.CABINET);
  placeObject(34, 39, TileType.SINK);
  placeObject(36, 39, TileType.CABINET);

  // === ÁREA 12: SALA DE DIAGNÓSTICO POR IMAGEM ===
  carveRoom(2, 22, 12, 6, TileType.FLOOR_OR);
  placeDoor(14, 24);

  placeObject(6, 24, TileType.MRI_MACHINE);
  placeObject(4, 23, TileType.COMPUTER_DESK);
  placeObject(11, 23, TileType.CABINET);

  // === ÁREA 13: POSTO DE ENFERMAGEM CENTRAL ===
  carveRoom(42, 30, 10, 6, TileType.FLOOR);
  placeDoor(42, 32);

  placeObject(44, 31, TileType.COMPUTER_DESK);
  placeObject(46, 31, TileType.COMPUTER_DESK);
  placeObject(48, 31, TileType.COMPUTER_DESK);
  placeObject(44, 34, TileType.DRUG_CART);
  placeObject(48, 34, TileType.CRASH_CART);

  // === DECORAÇÃO E PLANTAS ===
  // Plantas nos corredores
  const plantPositions = [
    [4, 45], [25, 45], [50, 45], [75, 45],
    [4, 19], [25, 19], [50, 19], [75, 19],
    [39, 8], [39, 14], [39, 26], [39, 35],
  ];
  plantPositions.forEach(([px, py]) => placeObject(px, py, TileType.PLANT));

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
