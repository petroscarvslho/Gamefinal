export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum TileType {
  FLOOR = 0,
  WALL = 1,
  DOOR = 2,
  FLOOR_OR = 3, // Operating Room Floor
  BED = 4,
  MRI_MACHINE = 5,
  DESK_RECEPTION = 6,
  CABINET = 7,
  PLANT = 8,
  CHAIR_WAITING = 9,
  VENDING_MACHINE = 10,
  OR_TABLE = 11,
  COMPUTER_DESK = 12,
  SINK = 13,
  COUNTER_TOP = 14,
  // Equipamentos de Anestesia
  ANESTHESIA_MACHINE = 15,    // Aparelho de anestesia principal
  IV_STAND = 16,               // Suporte de soro / IV pole
  PATIENT_MONITOR = 17,        // Monitor multiparâmetro
  SYRINGE_PUMP = 18,           // Bomba de seringa
  VENTILATOR = 19,             // Ventilador mecânico
  DRUG_CART = 20,              // Carrinho de medicamentos
  DEFIBRILLATOR = 21,          // Desfibrilador
  OXYGEN_TANK = 22,            // Cilindro de oxigênio
  INTUBATION_CART = 23,        // Carrinho de via aérea
  SURGICAL_LIGHT = 24,         // Foco cirúrgico
  STRETCHER = 25,              // Maca
  MAYO_STAND = 26,             // Mesa Mayo
  SUCTION_MACHINE = 27,        // Aspirador
  INFUSION_PUMP = 28,          // Bomba de infusão
  CRASH_CART = 29,             // Carrinho de emergência
  WARMER = 30,                 // Aquecedor de fluidos
  BIS_MONITOR = 31,            // Monitor BIS (profundidade anestésica)
  ULTRASOUND = 32,             // Ultrassom portátil

  // Equipamentos de Especialidades Cirúrgicas
  // Cirurgia Cardíaca
  CEC_MACHINE = 33,            // Máquina de Circulação Extracorpórea / Bypass
  IABP = 34,                   // Balão Intra-Aórtico
  CELL_SAVER = 35,             // Recuperador de sangue

  // Ortopedia
  C_ARM = 36,                  // Arco em C / Fluoroscopia
  ARTHROSCOPY_TOWER = 37,      // Torre de artroscopia
  BONE_SAW = 38,               // Serra óssea / Drill
  TRACTION_TABLE = 39,         // Mesa de tração ortopédica

  // Neurocirurgia
  SURGICAL_MICROSCOPE = 40,    // Microscópio cirúrgico
  NEURO_NAVIGATION = 41,       // Sistema de navegação
  CRANIOTOME = 42,             // Craniotomo

  // Laparoscopia / Cirurgia Geral
  LAPAROSCOPY_TOWER = 43,      // Torre de laparoscopia
  ELECTROSURGICAL_UNIT = 44,   // Bisturi elétrico / Cautery
  INSUFFLATOR = 45,            // Insuflador de CO2

  // Oftalmologia
  PHACO_MACHINE = 46,          // Facoemulsificador
  OPERATING_MICROSCOPE = 47,   // Microscópio operatório

  // Urologia
  LITHOTRIPSY = 48,            // Litotriptor
  CYSTOSCOPY_TOWER = 49,       // Torre de cistoscopia

  // Obstetrícia
  DELIVERY_BED = 50,           // Cama de parto
  FETAL_MONITOR = 51,          // Monitor fetal / CTG
  INFANT_WARMER = 52,          // Berço aquecido

  // Mobiliário Hospitalar Adicional
  SURGICAL_STOOL = 53,         // Banco cirúrgico
  KICK_BUCKET = 54,            // Balde de chute
  HAMPER = 55,                 // Hamper de roupa
  INSTRUMENT_TABLE = 56,       // Mesa de instrumentos
  BACK_TABLE = 57,             // Mesa auxiliar grande

  // Áreas Comuns
  COFFEE_MACHINE = 58,         // Máquina de café
  MICROWAVE = 59,              // Micro-ondas
  REFRIGERATOR = 60,           // Geladeira
  DINING_TABLE = 61,           // Mesa de refeitório
  LOCKERS = 62,                // Armários / Lockers
  WATER_DISPENSER = 63,        // Bebedouro
  SOFA = 64,                   // Sofá
  TV_SCREEN = 65,              // TV / Tela
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  color: string;
  type: 'player' | 'npc';
  skinColor?: string;
}

export interface NPC extends Entity {
  name: string;
  role: string;
  dialoguePrompt: string;
}

export interface GameState {
  player: Entity;
  npcs: NPC[];
  isDialogueOpen: boolean;
  activeNpcId: string | null;
  dialogueHistory: string[];
  isTalking: boolean;
}

export interface ChatMessage {
  sender: 'Player' | 'NPC';
  text: string;
}

// === SISTEMA DE INVENTÁRIO ===

export enum ItemCategory {
  MEDICAMENTO = 'Medicamentos',
  EQUIPAMENTO = 'Equipamentos',
  DOCUMENTO = 'Documentos',
  SUPRIMENTO = 'Suprimentos',
  FERRAMENTA = 'Ferramentas',
  CONSUMIVEL = 'Consumíveis',
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  icon: string; // Emoji ou identificador do sprite
  quantity: number;
  maxStack: number;
  usable: boolean;
  rarity: 'comum' | 'incomum' | 'raro' | 'epico';
}

export interface PlayerInventory {
  items: InventoryItem[];
  maxSlots: number;
  selectedSlot: number | null;
}

// Items pré-definidos do jogo
export const GAME_ITEMS: Omit<InventoryItem, 'quantity'>[] = [
  // Medicamentos
  { id: 'propofol', name: 'Propofol', description: 'Anestésico intravenoso de ação rápida', category: ItemCategory.MEDICAMENTO, icon: '💉', maxStack: 10, usable: true, rarity: 'comum' },
  { id: 'fentanil', name: 'Fentanil', description: 'Opioide potente para analgesia', category: ItemCategory.MEDICAMENTO, icon: '💊', maxStack: 10, usable: true, rarity: 'comum' },
  { id: 'midazolam', name: 'Midazolam', description: 'Benzodiazepínico para sedação', category: ItemCategory.MEDICAMENTO, icon: '💊', maxStack: 10, usable: true, rarity: 'comum' },
  { id: 'rocuronio', name: 'Rocurônio', description: 'Bloqueador neuromuscular', category: ItemCategory.MEDICAMENTO, icon: '💉', maxStack: 5, usable: true, rarity: 'incomum' },
  { id: 'sugamadex', name: 'Sugamadex', description: 'Reversor de bloqueio neuromuscular', category: ItemCategory.MEDICAMENTO, icon: '💉', maxStack: 3, usable: true, rarity: 'raro' },
  { id: 'adrenalina', name: 'Adrenalina', description: 'Catecolamina para emergências', category: ItemCategory.MEDICAMENTO, icon: '🔴', maxStack: 10, usable: true, rarity: 'comum' },
  { id: 'atropina', name: 'Atropina', description: 'Anticolinérgico para bradicardia', category: ItemCategory.MEDICAMENTO, icon: '💊', maxStack: 10, usable: true, rarity: 'comum' },
  { id: 'noradrenalina', name: 'Noradrenalina', description: 'Vasopressor potente', category: ItemCategory.MEDICAMENTO, icon: '🟡', maxStack: 5, usable: true, rarity: 'incomum' },
  { id: 'sevoflurano', name: 'Sevoflurano', description: 'Anestésico inalatório', category: ItemCategory.MEDICAMENTO, icon: '☁️', maxStack: 3, usable: true, rarity: 'incomum' },
  { id: 'lidocaina', name: 'Lidocaína', description: 'Anestésico local', category: ItemCategory.MEDICAMENTO, icon: '💉', maxStack: 10, usable: true, rarity: 'comum' },

  // Equipamentos
  { id: 'laringoscopio', name: 'Laringoscópio', description: 'Para visualização da via aérea', category: ItemCategory.EQUIPAMENTO, icon: '🔦', maxStack: 1, usable: true, rarity: 'comum' },
  { id: 'tubo_et', name: 'Tubo Endotraqueal', description: 'Para intubação orotraqueal', category: ItemCategory.EQUIPAMENTO, icon: '🌬️', maxStack: 5, usable: true, rarity: 'comum' },
  { id: 'mascara_laringea', name: 'Máscara Laríngea', description: 'Dispositivo supraglótico', category: ItemCategory.EQUIPAMENTO, icon: '😷', maxStack: 3, usable: true, rarity: 'comum' },
  { id: 'bougie', name: 'Bougie', description: 'Guia para intubação difícil', category: ItemCategory.EQUIPAMENTO, icon: '📏', maxStack: 2, usable: true, rarity: 'incomum' },
  { id: 'videolaringoscopio', name: 'Videolaringoscópio', description: 'Laringoscópio com câmera', category: ItemCategory.EQUIPAMENTO, icon: '📹', maxStack: 1, usable: true, rarity: 'raro' },
  { id: 'estetoscopio', name: 'Estetoscópio', description: 'Para ausculta', category: ItemCategory.EQUIPAMENTO, icon: '🩺', maxStack: 1, usable: true, rarity: 'comum' },
  { id: 'oximetro', name: 'Oxímetro de Pulso', description: 'Monitor de saturação', category: ItemCategory.EQUIPAMENTO, icon: '❤️', maxStack: 2, usable: true, rarity: 'comum' },
  { id: 'capnografo', name: 'Capnógrafo', description: 'Monitor de CO2 expirado', category: ItemCategory.EQUIPAMENTO, icon: '📊', maxStack: 1, usable: true, rarity: 'incomum' },

  // Suprimentos
  { id: 'acesso_venoso', name: 'Jelco 18G', description: 'Cateter venoso periférico', category: ItemCategory.SUPRIMENTO, icon: '💧', maxStack: 20, usable: true, rarity: 'comum' },
  { id: 'seringa_20ml', name: 'Seringa 20ml', description: 'Seringa descartável', category: ItemCategory.SUPRIMENTO, icon: '🔬', maxStack: 20, usable: true, rarity: 'comum' },
  { id: 'soro_fisiologico', name: 'Soro Fisiológico', description: 'SF 0.9% 500ml', category: ItemCategory.SUPRIMENTO, icon: '💧', maxStack: 10, usable: true, rarity: 'comum' },
  { id: 'ringer_lactato', name: 'Ringer Lactato', description: 'Solução cristaloide', category: ItemCategory.SUPRIMENTO, icon: '💧', maxStack: 10, usable: true, rarity: 'comum' },
  { id: 'luvas', name: 'Luvas Estéreis', description: 'Luvas cirúrgicas', category: ItemCategory.SUPRIMENTO, icon: '🧤', maxStack: 10, usable: true, rarity: 'comum' },
  { id: 'mascara_n95', name: 'Máscara N95', description: 'Proteção respiratória', category: ItemCategory.SUPRIMENTO, icon: '😷', maxStack: 5, usable: true, rarity: 'incomum' },

  // Documentos
  { id: 'prontuario', name: 'Prontuário', description: 'Histórico médico do paciente', category: ItemCategory.DOCUMENTO, icon: '📋', maxStack: 1, usable: true, rarity: 'comum' },
  { id: 'ficha_anestesica', name: 'Ficha Anestésica', description: 'Registro anestésico', category: ItemCategory.DOCUMENTO, icon: '📄', maxStack: 5, usable: true, rarity: 'comum' },
  { id: 'exames_lab', name: 'Exames Laboratoriais', description: 'Resultados de exames', category: ItemCategory.DOCUMENTO, icon: '🔬', maxStack: 10, usable: true, rarity: 'comum' },
  { id: 'ecg', name: 'ECG', description: 'Eletrocardiograma do paciente', category: ItemCategory.DOCUMENTO, icon: '📈', maxStack: 5, usable: true, rarity: 'comum' },
  { id: 'consentimento', name: 'Termo de Consentimento', description: 'Autorização do paciente', category: ItemCategory.DOCUMENTO, icon: '✍️', maxStack: 5, usable: true, rarity: 'comum' },

  // Consumíveis
  { id: 'cafe', name: 'Café', description: 'Recupera energia +10', category: ItemCategory.CONSUMIVEL, icon: '☕', maxStack: 5, usable: true, rarity: 'comum' },
  { id: 'energetico', name: 'Energético', description: 'Recupera energia +25', category: ItemCategory.CONSUMIVEL, icon: '🥤', maxStack: 3, usable: true, rarity: 'incomum' },
  { id: 'snack', name: 'Snack', description: 'Recupera energia +5', category: ItemCategory.CONSUMIVEL, icon: '🍫', maxStack: 10, usable: true, rarity: 'comum' },
];