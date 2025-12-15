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
  COUNTER_TOP = 14
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