import React, { useEffect, useRef, useCallback } from 'react';
import { INITIAL_MAP, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, MOVE_SPEED, INTERACTION_DISTANCE, CHARACTER_SPRITES } from '../constants';
import { Direction, Entity, NPC, TileType } from '../types';
import { dialogueManager } from '../services/dialogueManager';

interface GameEngineProps {
  onInteract: (npc: NPC) => void;
  isDialogueOpen: boolean;
}

// Mapeamento de personagens para sprites pré-feitos LimeZu
const CHARACTER_SPRITE_MAP: Record<string, number> = {
  player: 1,
  receptionist: 3,
  surgeon: 7,
  radiologist: 5,
  patient_waiting: 9,
  patient_bed: 11,
};

// Cores estilo SNES/GBA para tiles
const COLORS = {
  floor: { base: '#e8e4d9', shadow: '#d4d0c4', line: '#cdc9bc' },
  floorOR: { base: '#d4eaf7', shadow: '#b8dbed', line: '#9fcee0' },
  wall: { top: '#f5f5f0', base: '#d8d4c8', dark: '#a8a498', bottom: '#78746a' },
  wood: { light: '#d4a574', base: '#b8885c', dark: '#8c6644' },
  metal: { light: '#e0e4e8', base: '#b0b8c0', dark: '#808890' },
  bed: { frame: '#e8e8e8', sheet: '#6eb5f0', pillow: '#fff' },
  plant: { pot: '#b45309', leaf: '#22a055', leafLight: '#4ade80' },
};

const GameEngine: React.FC<GameEngineProps> = ({ onInteract, isDialogueOpen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const frameCountRef = useRef<number>(0);

  // Sprite images - apenas personagens
  const characterImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const charactersLoadedRef = useRef(false);

  const playerRef = useRef<Entity>({
    id: 'player',
    x: 40 * TILE_SIZE,  // Centro do hospital
    y: 55 * TILE_SIZE,  // Entrada principal
    direction: Direction.UP,
    color: '#3b82f6',
    skinColor: '#ffedd5',
    type: 'player'
  });

  const npcsRef = useRef<NPC[]>([
    {
      id: 'receptionist',
      x: 40 * TILE_SIZE,
      y: 53 * TILE_SIZE,
      direction: Direction.DOWN,
      color: '#f472b6',
      skinColor: '#fecaca',
      type: 'npc',
      name: 'Enfermeira Ana',
      role: 'Recepcionista',
      dialoguePrompt: 'Alegre e organizada. Gerencia a entrada de pacientes.'
    },
    {
      id: 'surgeon',
      x: 5 * TILE_SIZE,
      y: 4 * TILE_SIZE,
      direction: Direction.DOWN,
      color: '#10b981',
      skinColor: '#fed7aa',
      type: 'npc',
      name: 'Dr. Carlos',
      role: 'Cirurgião Geral',
      dialoguePrompt: 'Profissional e experiente. Especialista em laparoscopia.'
    },
    {
      id: 'anesthesiologist',
      x: 14 * TILE_SIZE,
      y: 4 * TILE_SIZE,
      direction: Direction.DOWN,
      color: '#3b82f6',
      skinColor: '#fde68a',
      type: 'npc',
      name: 'Dra. Marina',
      role: 'Anestesiologista',
      dialoguePrompt: 'Calma e precisa. Especialista em anestesia cardiovascular.'
    },
    {
      id: 'radiologist',
      x: 6 * TILE_SIZE,
      y: 24 * TILE_SIZE,
      direction: Direction.RIGHT,
      color: '#8b5cf6',
      skinColor: '#e5e7eb',
      type: 'npc',
      name: 'Dr. Paulo',
      role: 'Radiologista',
      dialoguePrompt: 'Técnico e observador. Especialista em diagnóstico por imagem.'
    },
    {
      id: 'nurse_uti',
      x: 10 * TILE_SIZE,
      y: 35 * TILE_SIZE,
      direction: Direction.DOWN,
      color: '#ec4899',
      skinColor: '#fef3c7',
      type: 'npc',
      name: 'Enfermeira Sofia',
      role: 'Enfermeira UTI',
      dialoguePrompt: 'Dedicada e atenta. Cuida dos pacientes críticos.'
    },
    {
      id: 'patient_waiting',
      x: 60 * TILE_SIZE,
      y: 52 * TILE_SIZE,
      direction: Direction.LEFT,
      color: '#94a3b8',
      skinColor: '#fde047',
      type: 'npc',
      name: 'Roberto',
      role: 'Paciente',
      dialoguePrompt: 'Ansioso com a consulta. Lendo uma revista.'
    },
    {
      id: 'patient_bed',
      x: 5 * TILE_SIZE,
      y: 32 * TILE_SIZE,
      direction: Direction.RIGHT,
      color: '#e2e8f0',
      skinColor: '#ffedd5',
      type: 'npc',
      name: 'Dona Maria',
      role: 'Paciente Internada',
      dialoguePrompt: 'Descansando, recuperando de uma cirurgia. Esperançosa.'
    },
    {
      id: 'nurse_crpa',
      x: 60 * TILE_SIZE,
      y: 35 * TILE_SIZE,
      direction: Direction.LEFT,
      color: '#14b8a6',
      skinColor: '#fce7f3',
      type: 'npc',
      name: 'Enfermeiro João',
      role: 'Enfermeiro CRPA',
      dialoguePrompt: 'Experiente em recuperação pós-anestésica.'
    }
  ]);

  const keysPressed = useRef<Record<string, boolean>>({});
  const lastChatterTimeRef = useRef<Record<string, number>>({});

  // === Sistema de Partículas ===
  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
  }
  const particlesRef = useRef<Particle[]>([]);
  const lastParticleTimeRef = useRef<number>(0);

  // Falas ambientais dos NPCs
  const NPC_CHATTER: Record<string, string[]> = {
    receptionist: [
      'Proximo paciente...',
      'Sala 3 liberada!',
      'Dr. Carlos na linha 2.',
      'Preciso do prontuario.',
    ],
    surgeon: [
      'Bisturi, por favor.',
      'Irrigacao...',
      'Hemostasia ok.',
      'Vamos fechar.',
    ],
    anesthesiologist: [
      'Paciente estavel.',
      'BIS em 45.',
      'SpO2 98%.',
      'Ajustando sevoflurano.',
    ],
    radiologist: [
      'Imagem adquirida.',
      'Contraste ok.',
      'Posicionar paciente.',
      'TC limpa.',
    ],
    nurse_uti: [
      'Sinais vitais ok.',
      'Medicacao administrada.',
      'Balanco hidrico...',
      'Troca de decubito.',
    ],
    patient_waiting: [
      '...',
      '*suspiro*',
      'Quanto tempo...',
      '*folheando revista*',
    ],
    patient_bed: [
      'Obrigada...',
      'Estou melhor.',
      '*descansando*',
      'Quando posso ir?',
    ],
    nurse_crpa: [
      'Acordando bem.',
      'Escala de dor?',
      'Pode respirar fundo.',
      'Oxigenio a 2L.',
    ],
  };

  // --- Load Character Sprites (LimeZu premade) ---
  useEffect(() => {
    const spriteIds = [...new Set(Object.values(CHARACTER_SPRITE_MAP))];
    let loadedCount = 0;
    const totalToLoad = spriteIds.length;

    spriteIds.forEach(id => {
      const img = new Image();
      const paddedId = String(id).padStart(2, '0');
      img.src = `${CHARACTER_SPRITES.basePath}/Premade_Character_32x32_${paddedId}.png`;

      img.onload = () => {
        characterImagesRef.current[`premade_${id}`] = img;
        loadedCount++;
        if (loadedCount >= totalToLoad) {
          charactersLoadedRef.current = true;
        }
      };

      img.onerror = () => {
        console.warn(`Character sprite not found: ${img.src}`);
        loadedCount++;
      };
    });
  }, []);

  // --- Input handlers ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
      if ((e.code === 'Space' || e.code === 'Enter') && !isDialogueOpen) {
        checkInteraction();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isDialogueOpen]);

  const checkInteraction = () => {
    const p = playerRef.current;
    let interactionX = p.x + TILE_SIZE / 2;
    let interactionY = p.y + TILE_SIZE / 2;

    if (p.direction === Direction.UP) interactionY -= TILE_SIZE;
    if (p.direction === Direction.DOWN) interactionY += TILE_SIZE;
    if (p.direction === Direction.LEFT) interactionX -= TILE_SIZE;
    if (p.direction === Direction.RIGHT) interactionX += TILE_SIZE;

    const closestNPC = npcsRef.current.find(npc => {
      const npcCenterX = npc.x + TILE_SIZE / 2;
      const npcCenterY = npc.y + TILE_SIZE / 2;
      const dist = Math.hypot(npcCenterX - interactionX, npcCenterY - interactionY);
      return dist < INTERACTION_DISTANCE;
    });

    if (closestNPC) {
      const dx = p.x - closestNPC.x;
      const dy = p.y - closestNPC.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        closestNPC.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
      } else {
        closestNPC.direction = dy > 0 ? Direction.DOWN : Direction.UP;
      }

      // Mostrar balao de saudacao antes do dialogo
      const greetings: Record<string, string> = {
        receptionist: 'Ola! Posso ajudar?',
        surgeon: 'Oi, colega.',
        anesthesiologist: 'Bom dia!',
        radiologist: 'Ola, doutor.',
        nurse_uti: 'Oi! Tudo bem?',
        patient_waiting: 'Com licenca...',
        patient_bed: 'Doutor...',
        nurse_crpa: 'Ola!',
      };
      const greeting = greetings[closestNPC.id] || 'Ola!';
      dialogueManager.addBubble(closestNPC.id, greeting, closestNPC.x, closestNPC.y, 2000);

      onInteract(closestNPC);
    }
  };

  const isSolid = (tile: TileType) => {
    return [
      TileType.WALL,
      TileType.MRI_MACHINE,
      TileType.BED,
      TileType.CABINET,
      TileType.VENDING_MACHINE,
      TileType.OR_TABLE,
      TileType.DESK_RECEPTION,
      TileType.COMPUTER_DESK,
      TileType.PLANT,
      TileType.SINK,
      // Equipamentos de Anestesia
      TileType.ANESTHESIA_MACHINE,
      TileType.PATIENT_MONITOR,
      TileType.VENTILATOR,
      TileType.DRUG_CART,
      TileType.DEFIBRILLATOR,
      TileType.INTUBATION_CART,
      TileType.CRASH_CART,
      TileType.WARMER,
      TileType.BIS_MONITOR,
      TileType.ULTRASOUND,
      // Especialidades
      TileType.CEC_MACHINE,
      TileType.IABP,
      TileType.CELL_SAVER,
      TileType.C_ARM,
      TileType.ARTHROSCOPY_TOWER,
      TileType.TRACTION_TABLE,
      TileType.SURGICAL_MICROSCOPE,
      TileType.NEURO_NAVIGATION,
      TileType.LAPAROSCOPY_TOWER,
      TileType.ELECTROSURGICAL_UNIT,
      TileType.PHACO_MACHINE,
      TileType.OPERATING_MICROSCOPE,
      TileType.LITHOTRIPSY,
      TileType.CYSTOSCOPY_TOWER,
      TileType.DELIVERY_BED,
      TileType.FETAL_MONITOR,
      TileType.INFANT_WARMER,
      // Mobiliário
      TileType.INSTRUMENT_TABLE,
      TileType.BACK_TABLE,
      TileType.LOCKERS,
      TileType.REFRIGERATOR,
      TileType.SOFA,
      TileType.DINING_TABLE,
    ].includes(tile);
  };

  const isWalkable = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= MAP_WIDTH * TILE_SIZE || y >= MAP_HEIGHT * TILE_SIZE) return false;

    const margin = 10;
    const corners = [
      { cx: x + margin, cy: y + TILE_SIZE - 2 },
      { cx: x + TILE_SIZE - margin, cy: y + TILE_SIZE - 2 },
      { cx: x + margin, cy: y + TILE_SIZE - 12 },
      { cx: x + TILE_SIZE - margin, cy: y + TILE_SIZE - 12 }
    ];

    for (const corner of corners) {
      const tx = Math.floor(corner.cx / TILE_SIZE);
      const ty = Math.floor(corner.cy / TILE_SIZE);
      const tile = INITIAL_MAP[ty]?.[tx];
      if (tile === undefined || isSolid(tile)) return false;
    }
    return true;
  };

  const update = useCallback(() => {
    if (isDialogueOpen) return;
    frameCountRef.current++;

    const p = playerRef.current;
    let dx = 0;
    let dy = 0;

    if (keysPressed.current['ArrowUp'] || keysPressed.current['KeyW']) dy = -MOVE_SPEED;
    if (keysPressed.current['ArrowDown'] || keysPressed.current['KeyS']) dy = MOVE_SPEED;
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA']) dx = -MOVE_SPEED;
    if (keysPressed.current['ArrowRight'] || keysPressed.current['KeyD']) dx = MOVE_SPEED;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    if (dx !== 0) {
      if (isWalkable(p.x + dx, p.y)) p.x += dx;
      p.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
    }
    if (dy !== 0) {
      if (isWalkable(p.x, p.y + dy)) p.y += dy;
      if (Math.abs(dy) > Math.abs(dx)) p.direction = dy > 0 ? Direction.DOWN : Direction.UP;
    }

    // === Partículas de Poeira ao Andar ===
    const now = Date.now();
    const isMoving = dx !== 0 || dy !== 0;

    if (isMoving && now - lastParticleTimeRef.current > 150) {
      // Spawn partícula de poeira
      const dustColors = ['#d4d0c4', '#cdc9bc', '#b8b4a8'];
      particlesRef.current.push({
        x: p.x + TILE_SIZE / 2 + (Math.random() - 0.5) * 8,
        y: p.y + TILE_SIZE - 4,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.8 - 0.2,
        life: 30,
        maxLife: 30,
        size: Math.random() * 3 + 2,
        color: dustColors[Math.floor(Math.random() * dustColors.length)]
      });
      lastParticleTimeRef.current = now;
    }

    // Atualiza partículas
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02; // gravidade leve
      p.life--;
      return p.life > 0;
    });

    // === NPC Chatter Ambiental ===
    const CHATTER_INTERVAL = 8000; // 8 segundos entre falas
    const CHATTER_CHANCE = 0.15; // 15% chance a cada intervalo

    npcsRef.current.forEach(npc => {
      const lastChatter = lastChatterTimeRef.current[npc.id] || 0;
      const timeSinceChatter = now - lastChatter;

      // Verificar se NPC esta proximo do player
      const distToPlayer = Math.hypot(npc.x - p.x, npc.y - p.y);
      const isNearPlayer = distToPlayer < TILE_SIZE * 8; // 8 tiles de distancia

      if (isNearPlayer && timeSinceChatter > CHATTER_INTERVAL && Math.random() < CHATTER_CHANCE) {
        const chatterLines = NPC_CHATTER[npc.id];
        if (chatterLines && chatterLines.length > 0) {
          const randomLine = chatterLines[Math.floor(Math.random() * chatterLines.length)];
          dialogueManager.addBubble(npc.id, randomLine, npc.x, npc.y, 3000);
          lastChatterTimeRef.current[npc.id] = now;
        }
      }
    });
  }, [isDialogueOpen]);

  // --- Drawing Functions ---

  const drawTile = (ctx: CanvasRenderingContext2D, tile: TileType, x: number, y: number) => {
    const S = TILE_SIZE; // 32
    const tx = Math.floor(x / S);
    const ty = Math.floor(y / S);
    const isAlt = (tx + ty) % 2 === 0;

    // 1. PISO BASE (sempre desenha primeiro)
    if (tile !== TileType.WALL) {
      const isOR = tile === TileType.FLOOR_OR;
      const isWaiting = tx > 18 && ty > 12;

      // Base do piso
      if (isOR) {
        ctx.fillStyle = isAlt ? '#d0eef8' : '#c0e8f4';
      } else if (isWaiting) {
        ctx.fillStyle = isAlt ? '#f5edd8' : '#efe7d0';
      } else {
        ctx.fillStyle = isAlt ? '#e8e4da' : '#dedad0';
      }
      ctx.fillRect(x, y, S, S);

      // Linhas de rejunte (estilo pixel)
      ctx.fillStyle = isOR ? '#a8d8ea' : isWaiting ? '#d8d0c0' : '#c8c4b8';
      ctx.fillRect(x, y + S - 1, S, 1);
      ctx.fillRect(x + S - 1, y, 1, S);
    }

    // 2. OBJETOS
    switch (tile) {
      case TileType.WALL: {
        // Parede estilo SNES - com borda e gradiente
        ctx.fillStyle = COLORS.wall.base;
        ctx.fillRect(x, y, S, S);
        // Topo claro
        ctx.fillStyle = COLORS.wall.top;
        ctx.fillRect(x, y, S, 4);
        // Rodapé escuro
        ctx.fillStyle = COLORS.wall.bottom;
        ctx.fillRect(x, y + S - 5, S, 5);
        // Linha de divisão
        ctx.fillStyle = COLORS.wall.dark;
        ctx.fillRect(x, y + S - 6, S, 1);
        // Borda direita sutil
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(x + S - 1, y, 1, S);
        break;
      }

      case TileType.DOOR: {
        // Moldura
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(x + 2, y, S - 4, S);
        // Porta em si
        ctx.fillStyle = '#a08060';
        ctx.fillRect(x + 4, y + 2, S - 8, S - 2);
        // Painéis
        ctx.fillStyle = '#907050';
        ctx.fillRect(x + 6, y + 4, S - 12, 10);
        ctx.fillRect(x + 6, y + 16, S - 12, 10);
        // Maçaneta
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + S - 10, y + 14, 4, 4);
        break;
      }

      case TileType.BED: {
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 3, y + S - 3, S - 4, 3);
        // Estrutura
        ctx.fillStyle = COLORS.bed.frame;
        ctx.fillRect(x + 2, y + 6, S - 4, S - 8);
        // Lençol
        ctx.fillStyle = COLORS.bed.sheet;
        ctx.fillRect(x + 4, y + 8, S - 8, S - 12);
        // Travesseiro
        ctx.fillStyle = COLORS.bed.pillow;
        ctx.fillRect(x + 5, y + 2, S - 10, 8);
        // Borda travesseiro
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 5, y + 2, S - 10, 8);
        // Cabeceira
        ctx.fillStyle = '#b0a090';
        ctx.fillRect(x + 2, y, S - 4, 3);
        break;
      }

      case TileType.MRI_MACHINE: {
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + S - 2, 13, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Corpo principal
        ctx.fillStyle = COLORS.metal.base;
        ctx.fillRect(x + 2, y + 4, S - 4, S - 8);
        // Topo
        ctx.fillStyle = COLORS.metal.light;
        ctx.fillRect(x + 2, y + 4, S - 4, 4);
        // Abertura (túnel)
        ctx.fillStyle = '#1a2030';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 9, 0, Math.PI * 2);
        ctx.fill();
        // Anel interno
        ctx.strokeStyle = COLORS.metal.dark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 9, 0, Math.PI * 2);
        ctx.stroke();
        // Luzes
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(x + 4, y + 6, 3, 2);
        ctx.fillRect(x + S - 7, y + 6, 3, 2);
        break;
      }

      case TileType.CABINET: {
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 5, y + S - 2, S - 6, 2);
        // Corpo
        ctx.fillStyle = COLORS.wood.base;
        ctx.fillRect(x + 4, y + 2, S - 8, S - 4);
        // Topo
        ctx.fillStyle = COLORS.wood.light;
        ctx.fillRect(x + 4, y + 2, S - 8, 3);
        // Gaveta superior
        ctx.fillStyle = COLORS.wood.dark;
        ctx.strokeStyle = '#6b5030';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 6, y + 7, S - 12, 9);
        // Gaveta inferior
        ctx.strokeRect(x + 6, y + 18, S - 12, 9);
        // Puxadores
        ctx.fillStyle = '#d4a040';
        ctx.fillRect(x + 14, y + 10, 4, 3);
        ctx.fillRect(x + 14, y + 21, 4, 3);
        break;
      }

      case TileType.VENDING_MACHINE: {
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x + 5, y + S - 2, S - 6, 2);
        // Corpo
        ctx.fillStyle = '#d03030';
        ctx.fillRect(x + 4, y + 1, S - 8, S - 3);
        // Frente mais clara
        ctx.fillStyle = '#e04040';
        ctx.fillRect(x + 4, y + 1, S - 8, 2);
        // Vidro
        ctx.fillStyle = '#40a0d0';
        ctx.fillRect(x + 6, y + 4, S - 12, 14);
        // Reflexo
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x + 7, y + 5, 4, 12);
        // Painel de botões
        ctx.fillStyle = '#202020';
        ctx.fillRect(x + 6, y + 20, S - 12, 8);
        // Botões
        ctx.fillStyle = '#60ff60';
        ctx.fillRect(x + 8, y + 22, 3, 3);
        ctx.fillStyle = '#ff6060';
        ctx.fillRect(x + 13, y + 22, 3, 3);
        break;
      }

      case TileType.CHAIR_WAITING: {
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 9, y + S - 2, 14, 2);
        // Pernas
        ctx.fillStyle = '#505860';
        ctx.fillRect(x + 10, y + 24, 3, 6);
        ctx.fillRect(x + 19, y + 24, 3, 6);
        // Assento
        ctx.fillStyle = '#5080d0';
        ctx.fillRect(x + 8, y + 16, 16, 8);
        // Encosto
        ctx.fillStyle = '#4070c0';
        ctx.fillRect(x + 8, y + 6, 16, 10);
        // Highlight
        ctx.fillStyle = '#6090e0';
        ctx.fillRect(x + 8, y + 6, 16, 2);
        break;
      }

      case TileType.DESK_RECEPTION: {
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 3, y + S - 2, S - 4, 2);
        // Frente do balcão
        ctx.fillStyle = COLORS.wood.base;
        ctx.fillRect(x + 2, y + 8, S - 4, S - 10);
        // Tampo
        ctx.fillStyle = COLORS.wood.light;
        ctx.fillRect(x + 2, y + 6, S - 4, 4);
        // Borda frontal
        ctx.fillStyle = COLORS.wood.dark;
        ctx.fillRect(x + 2, y + 10, S - 4, 2);
        break;
      }

      case TileType.COMPUTER_DESK: {
        // Mesa
        ctx.fillStyle = COLORS.wood.base;
        ctx.fillRect(x + 2, y + 14, S - 4, S - 16);
        ctx.fillStyle = COLORS.wood.light;
        ctx.fillRect(x + 2, y + 14, S - 4, 2);
        // Base do monitor
        ctx.fillStyle = '#303030';
        ctx.fillRect(x + 12, y + 10, 8, 4);
        // Monitor
        ctx.fillStyle = '#202428';
        ctx.fillRect(x + 5, y, 22, 14);
        // Tela
        ctx.fillStyle = '#20a0e0';
        ctx.fillRect(x + 7, y + 2, 18, 10);
        // Conteúdo da tela
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 9, y + 4, 10, 2);
        ctx.fillRect(x + 9, y + 7, 14, 2);
        // LED
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 14, y + 12, 3, 1);
        break;
      }

      case TileType.OR_TABLE: {
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 5, y + S - 2, S - 8, 2);
        // Coluna central
        ctx.fillStyle = COLORS.metal.dark;
        ctx.fillRect(x + 12, y + 18, 8, 10);
        // Tampo
        ctx.fillStyle = COLORS.metal.light;
        ctx.fillRect(x + 3, y + 8, S - 6, 12);
        // Borda do tampo
        ctx.fillStyle = COLORS.metal.base;
        ctx.fillRect(x + 3, y + 8, S - 6, 2);
        ctx.fillRect(x + 3, y + 18, S - 6, 2);
        break;
      }

      case TileType.SINK: {
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 5, y + S - 2, S - 8, 2);
        // Gabinete
        ctx.fillStyle = COLORS.metal.light;
        ctx.fillRect(x + 4, y + 8, S - 8, S - 10);
        // Pia
        ctx.fillStyle = COLORS.metal.base;
        ctx.fillRect(x + 6, y + 10, S - 12, 14);
        // Interior da pia
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(x + 8, y + 12, S - 16, 10);
        // Torneira
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(x + 14, y + 2, 4, 10);
        ctx.fillRect(x + 12, y + 2, 8, 4);
        // Água (gota)
        ctx.fillStyle = '#60c0ff';
        ctx.fillRect(x + 15, y + 11, 2, 3);
        break;
      }

      case TileType.PLANT: {
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + S - 1, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Vaso
        ctx.fillStyle = COLORS.plant.pot;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 20);
        ctx.lineTo(x + 9, y + S - 2);
        ctx.lineTo(x + 23, y + S - 2);
        ctx.lineTo(x + 22, y + 20);
        ctx.closePath();
        ctx.fill();
        // Borda do vaso
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x + 9, y + 18, 14, 3);
        // Folhas (múltiplas camadas)
        ctx.fillStyle = COLORS.plant.leaf;
        ctx.beginPath();
        ctx.arc(x + 16, y + 12, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 12, y + 14, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 20, y + 14, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 16, y + 8, 4, 0, Math.PI * 2);
        ctx.fill();
        // Highlights
        ctx.fillStyle = COLORS.plant.leafLight;
        ctx.beginPath();
        ctx.arc(x + 14, y + 10, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 18, y + 7, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      // ============ EQUIPAMENTOS DE ANESTESIA ============

      case TileType.ANESTHESIA_MACHINE: {
        // Máquina de anestesia principal - equipamento grande
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 4, y + S - 3, S - 6, 3);
        // Corpo principal
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(x + 4, y + 8, S - 8, S - 12);
        // Topo
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(x + 4, y + 6, S - 8, 4);
        // Tela do monitor
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x + 6, y + 10, 12, 8);
        // Ondas no monitor (ECG)
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 7, y + 14);
        ctx.lineTo(x + 9, y + 14);
        ctx.lineTo(x + 10, y + 11);
        ctx.lineTo(x + 11, y + 16);
        ctx.lineTo(x + 12, y + 14);
        ctx.lineTo(x + 16, y + 14);
        ctx.stroke();
        // Vaporizadores (cilindros coloridos)
        ctx.fillStyle = '#4080ff';
        ctx.fillRect(x + 20, y + 8, 4, 10);
        ctx.fillStyle = '#ff8040';
        ctx.fillRect(x + 24, y + 8, 4, 10);
        // Fluxômetros
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 6, y + 20, 8, 6);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 7, y + 21, 2, 4);
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(x + 10, y + 22, 2, 3);
        // Rodas
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 6, y + S - 4, 4, 4);
        ctx.fillRect(x + 22, y + S - 4, 4, 4);
        break;
      }

      case TileType.IV_STAND: {
        // Suporte de soro / IV pole
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + S - 1, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Base
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 14, y + S - 4, 4, 4);
        // Haste
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(x + 15, y + 6, 2, S - 10);
        // Ganchos no topo
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 10, y + 4, 12, 2);
        ctx.fillRect(x + 10, y + 4, 2, 4);
        ctx.fillRect(x + 20, y + 4, 2, 4);
        // Bolsa de soro
        ctx.fillStyle = '#e0f0ff';
        ctx.fillRect(x + 11, y + 8, 5, 8);
        // Líquido na bolsa
        ctx.fillStyle = '#80c0ff';
        ctx.fillRect(x + 12, y + 10, 3, 5);
        // Equipo (tubo)
        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 13, y + 16);
        ctx.lineTo(x + 13, y + 24);
        ctx.stroke();
        break;
      }

      case TileType.PATIENT_MONITOR: {
        // Monitor multiparâmetro
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x + 5, y + S - 2, S - 8, 2);
        // Suporte/base
        ctx.fillStyle = '#505050';
        ctx.fillRect(x + 12, y + 22, 8, 8);
        // Corpo do monitor
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(x + 4, y + 2, S - 8, 20);
        // Tela
        ctx.fillStyle = '#0a1a2a';
        ctx.fillRect(x + 6, y + 4, S - 12, 14);
        // Linha ECG (verde)
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 7, y + 8);
        ctx.lineTo(x + 10, y + 8);
        ctx.lineTo(x + 11, y + 5);
        ctx.lineTo(x + 12, y + 11);
        ctx.lineTo(x + 13, y + 8);
        ctx.lineTo(x + 20, y + 8);
        ctx.stroke();
        // SpO2 (azul)
        ctx.strokeStyle = '#00ccff';
        ctx.beginPath();
        ctx.moveTo(x + 7, y + 12);
        ctx.quadraticCurveTo(x + 12, y + 10, x + 20, y + 12);
        ctx.stroke();
        // Valores numéricos
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(x + 21, y + 6, 3, 3);
        ctx.fillStyle = '#00ccff';
        ctx.fillRect(x + 21, y + 11, 3, 3);
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(x + 21, y + 15, 3, 3);
        break;
      }

      case TileType.SYRINGE_PUMP: {
        // Bomba de seringa
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Corpo
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x + 4, y + 12, S - 8, 14);
        // Display
        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(x + 6, y + 14, 10, 6);
        // Números no display
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 7, y + 15, 4, 4);
        // Seringa
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 6, y + 6, 16, 4);
        ctx.fillStyle = '#80c0ff';
        ctx.fillRect(x + 8, y + 7, 10, 2);
        // Êmbolo
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(x + 22, y + 6, 4, 4);
        // Botões
        ctx.fillStyle = '#4080ff';
        ctx.fillRect(x + 18, y + 14, 4, 3);
        ctx.fillStyle = '#ff4040';
        ctx.fillRect(x + 18, y + 19, 4, 3);
        break;
      }

      case TileType.VENTILATOR: {
        // Ventilador mecânico
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 4, y + S - 3, S - 6, 3);
        // Corpo principal
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 4, y + 8, S - 8, S - 12);
        // Tela grande
        ctx.fillStyle = '#0a1a2a';
        ctx.fillRect(x + 6, y + 10, S - 12, 10);
        // Curvas de ventilação
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 7, y + 14);
        ctx.lineTo(x + 10, y + 12);
        ctx.lineTo(x + 14, y + 12);
        ctx.lineTo(x + 17, y + 16);
        ctx.lineTo(x + 20, y + 14);
        ctx.stroke();
        // Painel de controle
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 6, y + 22, S - 12, 4);
        // Botões/knobs
        ctx.fillStyle = '#60a0ff';
        ctx.beginPath();
        ctx.arc(x + 10, y + 24, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff6060';
        ctx.beginPath();
        ctx.arc(x + 22, y + 24, 2, 0, Math.PI * 2);
        ctx.fill();
        // Tubos
        ctx.fillStyle = '#80c0ff';
        ctx.fillRect(x + 14, y + 2, 4, 6);
        break;
      }

      case TileType.DRUG_CART: {
        // Carrinho de medicamentos
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 4, y + S - 2, S - 6, 2);
        // Corpo do carrinho
        ctx.fillStyle = '#4080c0';
        ctx.fillRect(x + 4, y + 4, S - 8, S - 8);
        // Gavetas
        ctx.fillStyle = '#3070b0';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(x + 6, y + 6 + i * 6, S - 12, 5);
          // Puxador
          ctx.fillStyle = '#c0c0c0';
          ctx.fillRect(x + 12, y + 8 + i * 6, 8, 2);
          ctx.fillStyle = '#3070b0';
        }
        // Rodas
        ctx.fillStyle = '#303030';
        ctx.beginPath();
        ctx.arc(x + 8, y + S - 2, 2, 0, Math.PI * 2);
        ctx.arc(x + 24, y + S - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case TileType.DEFIBRILLATOR: {
        // Desfibrilador
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Corpo
        ctx.fillStyle = '#ff4040';
        ctx.fillRect(x + 4, y + 8, S - 8, S - 12);
        ctx.fillStyle = '#cc3030';
        ctx.fillRect(x + 4, y + 8, S - 8, 3);
        // Tela
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + 6, y + 12, 12, 8);
        // ECG na tela
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 7, y + 16);
        ctx.lineTo(x + 9, y + 16);
        ctx.lineTo(x + 10, y + 13);
        ctx.lineTo(x + 11, y + 18);
        ctx.lineTo(x + 12, y + 16);
        ctx.lineTo(x + 16, y + 16);
        ctx.stroke();
        // Pás (paddles)
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 20, y + 10, 6, 4);
        ctx.fillRect(x + 20, y + 16, 6, 4);
        // Botão de choque
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(x + 8, y + 22, 8, 3);
        break;
      }

      case TileType.OXYGEN_TANK: {
        // Cilindro de oxigênio
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + S - 1, 5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Cilindro
        ctx.fillStyle = '#40a040';
        ctx.fillRect(x + 10, y + 8, 12, S - 12);
        // Topo arredondado
        ctx.beginPath();
        ctx.arc(x + 16, y + 8, 6, Math.PI, 0);
        ctx.fill();
        // Válvula
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 14, y + 2, 4, 6);
        // Manômetro
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + 16, y + 4, 2, 0, Math.PI * 2);
        ctx.fill();
        // Ponteiro
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x + 16, y + 3, 2, 1);
        // Label "O2"
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 13, y + 14, 6, 4);
        break;
      }

      case TileType.INTUBATION_CART: {
        // Carrinho de via aérea
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 4, y + S - 2, S - 6, 2);
        // Corpo do carrinho
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 4, y + 6, S - 8, S - 10);
        // Tampo
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x + 4, y + 4, S - 8, 4);
        // Laringoscópio no topo
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 6, y + 5, 10, 2);
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 16, y + 4, 2, 4);
        // Gavetas
        ctx.fillStyle = '#d0d0d0';
        ctx.strokeStyle = '#a0a0a0';
        ctx.lineWidth = 1;
        ctx.fillRect(x + 6, y + 10, S - 12, 6);
        ctx.strokeRect(x + 6, y + 10, S - 12, 6);
        ctx.fillRect(x + 6, y + 18, S - 12, 6);
        ctx.strokeRect(x + 6, y + 18, S - 12, 6);
        // Puxadores
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 12, y + 12, 8, 2);
        ctx.fillRect(x + 12, y + 20, 8, 2);
        // Rodas
        ctx.fillStyle = '#303030';
        ctx.beginPath();
        ctx.arc(x + 8, y + S - 2, 2, 0, Math.PI * 2);
        ctx.arc(x + 24, y + S - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case TileType.SURGICAL_LIGHT: {
        // Foco cirúrgico
        // Haste
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 14, y, 4, 12);
        // Articulação
        ctx.fillStyle = '#606060';
        ctx.beginPath();
        ctx.arc(x + 16, y + 12, 3, 0, Math.PI * 2);
        ctx.fill();
        // Braço
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 8, y + 11, 16, 3);
        // Cabeça do foco
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 20, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // LEDs
        ctx.fillStyle = '#ffffcc';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 20, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Brilho central
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 20, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case TileType.STRETCHER: {
        // Maca
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 2, y + S - 2, S - 2, 2);
        // Estrutura
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 4, y + 20, S - 6, 4);
        // Pernas
        ctx.fillRect(x + 6, y + 24, 3, 6);
        ctx.fillRect(x + 23, y + 24, 3, 6);
        // Colchão
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 2, y + 8, S - 4, 14);
        // Lençol
        ctx.fillStyle = '#a0d0ff';
        ctx.fillRect(x + 4, y + 10, S - 8, 10);
        // Travesseiro
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4, y + 4, 8, 6);
        // Grades laterais
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(x + 2, y + 8, 2, 12);
        ctx.fillRect(x + S - 4, y + 8, 2, 12);
        break;
      }

      case TileType.MAYO_STAND: {
        // Mesa Mayo
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + S - 1, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Base
        ctx.fillStyle = '#707070';
        ctx.fillRect(x + 12, y + S - 4, 8, 4);
        // Haste
        ctx.fillStyle = '#909090';
        ctx.fillRect(x + 14, y + 14, 4, S - 18);
        // Bandeja
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 4, y + 10, S - 8, 6);
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(x + 4, y + 10, S - 8, 2);
        // Instrumentos na bandeja
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 6, y + 12, 3, 2);
        ctx.fillRect(x + 10, y + 12, 5, 2);
        ctx.fillRect(x + 16, y + 12, 4, 2);
        ctx.fillRect(x + 21, y + 12, 3, 2);
        break;
      }

      case TileType.SUCTION_MACHINE: {
        // Aspirador cirúrgico
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Corpo
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x + 6, y + 10, S - 12, S - 14);
        // Reservatório transparente
        ctx.fillStyle = '#e0f0ff';
        ctx.fillRect(x + 8, y + 14, S - 16, 10);
        // Líquido
        ctx.fillStyle = '#ffcccc';
        ctx.fillRect(x + 9, y + 18, S - 18, 5);
        // Painel de controle
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 8, y + 10, S - 16, 3);
        // Botão liga/desliga
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 18, y + 11, 3, 2);
        // Tubo de sucção
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 14, y + 4, 4, 6);
        // Conector
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.arc(x + 16, y + 4, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case TileType.INFUSION_PUMP: {
        // Bomba de infusão
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Corpo
        ctx.fillStyle = '#f0f0e8';
        ctx.fillRect(x + 4, y + 6, S - 8, S - 10);
        // Display
        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(x + 6, y + 8, 12, 8);
        // Valores no display
        ctx.fillStyle = '#00ff00';
        ctx.font = '6px monospace';
        ctx.fillRect(x + 8, y + 10, 6, 4);
        // Câmara de gotejamento
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 20, y + 8, 4, 12);
        ctx.fillStyle = '#80c0ff';
        ctx.fillRect(x + 21, y + 14, 2, 5);
        // Botões
        ctx.fillStyle = '#4080ff';
        ctx.fillRect(x + 6, y + 18, 5, 4);
        ctx.fillStyle = '#ff4040';
        ctx.fillRect(x + 13, y + 18, 5, 4);
        // Clamp do tubo
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 20, y + 22, 4, 3);
        break;
      }

      case TileType.CRASH_CART: {
        // Carrinho de emergência (vermelho)
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x + 4, y + S - 2, S - 6, 2);
        // Corpo do carrinho
        ctx.fillStyle = '#cc3030';
        ctx.fillRect(x + 4, y + 4, S - 8, S - 8);
        // Topo
        ctx.fillStyle = '#e04040';
        ctx.fillRect(x + 4, y + 4, S - 8, 3);
        // Gavetas
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = '#b02020';
          ctx.fillRect(x + 6, y + 9 + i * 7, S - 12, 6);
          ctx.fillStyle = '#c0c0c0';
          ctx.fillRect(x + 12, y + 11 + i * 7, 8, 2);
        }
        // Desfibrilador no topo
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 8, y + 1, 8, 3);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 10, y + 2, 4, 1);
        // Rodas
        ctx.fillStyle = '#303030';
        ctx.beginPath();
        ctx.arc(x + 8, y + S - 2, 2, 0, Math.PI * 2);
        ctx.arc(x + 24, y + S - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case TileType.WARMER: {
        // Aquecedor de fluidos
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 8, y + S - 2, S - 14, 2);
        // Corpo
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x + 6, y + 8, S - 12, S - 12);
        // Área de aquecimento (laranja/quente)
        ctx.fillStyle = '#ff8040';
        ctx.fillRect(x + 8, y + 12, S - 16, 10);
        // Indicador de temperatura
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(x + 10, y + 14, S - 20, 2);
        // Slot para bolsa
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 10, y + 18, S - 20, 3);
        // Display de temperatura
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + 10, y + 8, 8, 4);
        ctx.fillStyle = '#ff4040';
        ctx.fillRect(x + 11, y + 9, 6, 2);
        // Botão
        ctx.fillStyle = '#40a040';
        ctx.fillRect(x + 20, y + 9, 3, 3);
        break;
      }

      case TileType.BIS_MONITOR: {
        // Monitor BIS (profundidade anestésica)
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 8, y + S - 2, S - 14, 2);
        // Corpo compacto
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(x + 6, y + 6, S - 12, S - 10);
        // Tela
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(x + 8, y + 8, S - 16, 12);
        // Valor BIS grande
        ctx.fillStyle = '#00ccff';
        ctx.fillRect(x + 10, y + 10, 8, 8);
        // Barra de nível
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 20, y + 10, 3, 8);
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(x + 20, y + 14, 3, 4);
        // Sensor/cabo
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 14, y + 22, 4, 4);
        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 26);
        ctx.lineTo(x + 16, y + 30);
        ctx.stroke();
        break;
      }

      case TileType.ULTRASOUND: {
        // Ultrassom portátil
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Corpo
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(x + 4, y + 10, S - 8, S - 14);
        // Tela
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(x + 6, y + 12, S - 12, 10);
        // Imagem ultrassom (azul/cinza)
        ctx.fillStyle = '#203040';
        ctx.fillRect(x + 8, y + 14, S - 16, 6);
        ctx.fillStyle = '#406080';
        ctx.beginPath();
        ctx.arc(x + 16, y + 17, 3, 0, Math.PI * 2);
        ctx.fill();
        // Botões
        ctx.fillStyle = '#505050';
        ctx.fillRect(x + 8, y + 24, S - 16, 3);
        // Transdutor/sonda
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 14, y + 4, 4, 6);
        ctx.fillStyle = '#606060';
        ctx.beginPath();
        ctx.arc(x + 16, y + 4, 3, Math.PI, 0);
        ctx.fill();
        // Cabo
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 10);
        ctx.lineTo(x + 20, y + 12);
        ctx.stroke();
        break;
      }

      // ============ EQUIPAMENTOS DE ESPECIALIDADES ============

      // --- CIRURGIA CARDÍACA ---

      case TileType.CEC_MACHINE: {
        // Máquina de Circulação Extracorpórea (Bypass)
        // Sombra grande
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x + 2, y + S - 3, S - 2, 3);
        // Corpo principal (grande)
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(x + 2, y + 4, S - 4, S - 8);
        // Painel frontal
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(x + 4, y + 6, S - 8, 12);
        // Bombas roletes (círculos vermelhos)
        ctx.fillStyle = '#cc3030';
        ctx.beginPath();
        ctx.arc(x + 10, y + 12, 4, 0, Math.PI * 2);
        ctx.arc(x + 22, y + 12, 4, 0, Math.PI * 2);
        ctx.fill();
        // Centro das bombas
        ctx.fillStyle = '#ff6060';
        ctx.beginPath();
        ctx.arc(x + 10, y + 12, 2, 0, Math.PI * 2);
        ctx.arc(x + 22, y + 12, 2, 0, Math.PI * 2);
        ctx.fill();
        // Reservatório de sangue
        ctx.fillStyle = '#e0f0ff';
        ctx.fillRect(x + 6, y + 20, 8, 6);
        ctx.fillStyle = '#cc4040';
        ctx.fillRect(x + 7, y + 22, 6, 3);
        // Oxigenador
        ctx.fillStyle = '#4080c0';
        ctx.fillRect(x + 18, y + 20, 8, 6);
        // Tubos
        ctx.strokeStyle = '#c04040';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 2);
        ctx.lineTo(x + 10, y + 8);
        ctx.moveTo(x + 22, y + 2);
        ctx.lineTo(x + 22, y + 8);
        ctx.stroke();
        // Rodas
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 4, y + S - 4, 4, 4);
        ctx.fillRect(x + 24, y + S - 4, 4, 4);
        break;
      }

      case TileType.IABP: {
        // Balão Intra-Aórtico
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Corpo
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 6, y + 8, S - 12, S - 12);
        // Topo
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 6, y + 6, S - 12, 4);
        // Tela grande
        ctx.fillStyle = '#0a1a2a';
        ctx.fillRect(x + 8, y + 10, S - 16, 10);
        // Curva de pressão arterial
        ctx.strokeStyle = '#ff4040';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 9, y + 15);
        ctx.lineTo(x + 12, y + 12);
        ctx.lineTo(x + 14, y + 18);
        ctx.lineTo(x + 16, y + 13);
        ctx.lineTo(x + 18, y + 16);
        ctx.lineTo(x + 21, y + 15);
        ctx.stroke();
        // Cilindro de hélio
        ctx.fillStyle = '#4080c0';
        ctx.fillRect(x + 10, y + 22, 6, 4);
        // Indicador de inflação
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(x + 18, y + 22, 4, 2);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(x + 18, y + 24, 4, 2);
        break;
      }

      case TileType.CELL_SAVER: {
        // Recuperador de sangue autólogo
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Corpo
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(x + 6, y + 6, S - 12, S - 10);
        // Bowl de centrifugação (transparente com sangue)
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cc4040';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff6060';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 2, 0, Math.PI * 2);
        ctx.fill();
        // Painel de controle
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 8, y + 6, S - 16, 4);
        // LEDs
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 10, y + 7, 2, 2);
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(x + 14, y + 7, 2, 2);
        // Tubos de entrada/saída
        ctx.strokeStyle = '#c04040';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 24);
        ctx.lineTo(x + 10, y + 28);
        ctx.moveTo(x + 22, y + 24);
        ctx.lineTo(x + 22, y + 28);
        ctx.stroke();
        break;
      }

      // --- ORTOPEDIA ---

      case TileType.C_ARM: {
        // Arco em C / Fluoroscopia
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + S - 1, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Base com rodas
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 10, y + S - 4, 12, 4);
        // Coluna
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 14, y + 14, 4, S - 18);
        // Arco em C (formato de C)
        ctx.strokeStyle = '#a0a0a0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x + 16, y + 12, 12, Math.PI * 0.7, Math.PI * 2.3);
        ctx.stroke();
        // Emissor de raios-X (topo)
        ctx.fillStyle = '#505050';
        ctx.fillRect(x + 4, y + 4, 8, 6);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(x + 6, y + 6, 4, 2);
        // Receptor (base do arco)
        ctx.fillStyle = '#505050';
        ctx.fillRect(x + 20, y + 16, 8, 8);
        ctx.fillStyle = '#303030';
        ctx.fillRect(x + 22, y + 18, 4, 4);
        break;
      }

      case TileType.ARTHROSCOPY_TOWER: {
        // Torre de artroscopia
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Rack/torre
        ctx.fillStyle = '#303030';
        ctx.fillRect(x + 6, y + 4, S - 12, S - 8);
        // Monitor no topo
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(x + 8, y + 6, S - 16, 10);
        // Imagem artroscópica
        ctx.fillStyle = '#ff9090';
        ctx.beginPath();
        ctx.arc(x + 16, y + 11, 4, 0, Math.PI * 2);
        ctx.fill();
        // Fonte de luz
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 8, y + 18, S - 16, 4);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(x + 10, y + 19, 4, 2);
        // Shaver/câmera
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 8, y + 24, S - 16, 3);
        ctx.fillStyle = '#4080ff';
        ctx.fillRect(x + 16, y + 24, 4, 3);
        break;
      }

      case TileType.BONE_SAW: {
        // Serra óssea / Drill ortopédico
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 8, y + S - 2, S - 14, 2);
        // Corpo do drill
        ctx.fillStyle = '#4080c0';
        ctx.fillRect(x + 8, y + 10, S - 16, 12);
        // Empunhadura
        ctx.fillStyle = '#303030';
        ctx.fillRect(x + 10, y + 22, S - 20, 6);
        // Mandril/broca
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 14, y + 4, 4, 8);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 15, y + 2, 2, 4);
        // Gatilho
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 18, y + 14, 4, 6);
        // LED indicador
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 10, y + 12, 2, 2);
        break;
      }

      case TileType.TRACTION_TABLE: {
        // Mesa de tração ortopédica
        // Sombra grande
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 2, y + S - 2, S - 2, 2);
        // Base/estrutura
        ctx.fillStyle = '#707070';
        ctx.fillRect(x + 4, y + 22, S - 8, 6);
        // Pernas
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 6, y + 26, 4, 6);
        ctx.fillRect(x + 22, y + 26, 4, 6);
        // Colchão principal
        ctx.fillStyle = '#4080a0';
        ctx.fillRect(x + 2, y + 8, S - 4, 14);
        // Divisória central
        ctx.fillStyle = '#306080';
        ctx.fillRect(x + 14, y + 10, 4, 10);
        // Suportes de perna
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 2, y + 18, 6, 3);
        ctx.fillRect(x + 24, y + 18, 6, 3);
        // Manivela de tração
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.arc(x + 28, y + 14, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      // --- NEUROCIRURGIA ---

      case TileType.SURGICAL_MICROSCOPE: {
        // Microscópio cirúrgico
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + S - 1, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Base pesada
        ctx.fillStyle = '#505050';
        ctx.fillRect(x + 8, y + S - 4, 16, 4);
        // Coluna
        ctx.fillStyle = '#707070';
        ctx.fillRect(x + 14, y + 12, 4, S - 16);
        // Braço articulado
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 6, y + 10, 20, 3);
        // Cabeça do microscópio
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 4, y + 2, 12, 10);
        // Oculares
        ctx.fillStyle = '#303030';
        ctx.beginPath();
        ctx.arc(x + 7, y + 4, 2, 0, Math.PI * 2);
        ctx.arc(x + 13, y + 4, 2, 0, Math.PI * 2);
        ctx.fill();
        // Lente objetiva
        ctx.fillStyle = '#4080c0';
        ctx.beginPath();
        ctx.arc(x + 10, y + 10, 4, 0, Math.PI * 2);
        ctx.fill();
        // Contrapeso
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 20, y + 4, 8, 6);
        break;
      }

      case TileType.NEURO_NAVIGATION: {
        // Sistema de navegação neurocirúrgica
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Torre/rack
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(x + 6, y + 6, S - 12, S - 10);
        // Monitor principal
        ctx.fillStyle = '#0a1a2a';
        ctx.fillRect(x + 8, y + 8, S - 16, 12);
        // Imagem cerebral 3D
        ctx.fillStyle = '#ff8080';
        ctx.beginPath();
        ctx.arc(x + 16, y + 14, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 14);
        ctx.lineTo(x + 20, y + 14);
        ctx.moveTo(x + 16, y + 10);
        ctx.lineTo(x + 16, y + 18);
        ctx.stroke();
        // Câmeras infravermelhas
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 10, y + 2, 4, 4);
        ctx.fillRect(x + 18, y + 2, 4, 4);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x + 11, y + 3, 2, 2);
        ctx.fillRect(x + 19, y + 3, 2, 2);
        // Painel de controle
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 8, y + 22, S - 16, 4);
        break;
      }

      case TileType.CRANIOTOME: {
        // Craniotomo
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 8, y + S - 2, S - 14, 2);
        // Corpo da unidade
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 6, y + 14, S - 12, 12);
        // Display
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(x + 8, y + 16, 8, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 9, y + 17, 4, 2);
        // Handpiece (peça de mão)
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 10, y + 4, 12, 6);
        // Broca/corte
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 8, y + 5, 4, 4);
        // Cabo
        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 10);
        ctx.lineTo(x + 16, y + 14);
        ctx.stroke();
        // Botões
        ctx.fillStyle = '#4080ff';
        ctx.fillRect(x + 18, y + 16, 4, 4);
        ctx.fillStyle = '#ff4040';
        ctx.fillRect(x + 18, y + 22, 4, 3);
        break;
      }

      // --- LAPAROSCOPIA / CIRURGIA GERAL ---

      case TileType.LAPAROSCOPY_TOWER: {
        // Torre de laparoscopia
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Rack alto
        ctx.fillStyle = '#303030';
        ctx.fillRect(x + 6, y + 2, S - 12, S - 6);
        // Monitor HD
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(x + 8, y + 4, S - 16, 10);
        // Imagem laparoscópica
        ctx.fillStyle = '#ff9090';
        ctx.fillRect(x + 10, y + 6, S - 20, 6);
        // Fonte de luz
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 8, y + 16, S - 16, 3);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(x + 10, y + 17, 4, 1);
        // Insuflador
        ctx.fillStyle = '#4080c0';
        ctx.fillRect(x + 8, y + 21, S - 16, 3);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 18, y + 22, 3, 1);
        // Gravador
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 8, y + 26, S - 16, 2);
        break;
      }

      case TileType.ELECTROSURGICAL_UNIT: {
        // Bisturi elétrico / Cautery
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Corpo
        ctx.fillStyle = '#e8e8e0';
        ctx.fillRect(x + 4, y + 10, S - 8, S - 14);
        // Painel frontal
        ctx.fillStyle = '#f0f0e8';
        ctx.fillRect(x + 6, y + 12, S - 12, 12);
        // Displays
        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(x + 8, y + 14, 6, 4);
        ctx.fillRect(x + 16, y + 14, 6, 4);
        // Valores (watts)
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 9, y + 15, 4, 2);
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(x + 17, y + 15, 4, 2);
        // Knobs/dials
        ctx.fillStyle = '#4080ff';
        ctx.beginPath();
        ctx.arc(x + 11, y + 22, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(x + 21, y + 22, 3, 0, Math.PI * 2);
        ctx.fill();
        // Caneta de cautério
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 6, y + 4, 16, 4);
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 22, y + 5, 4, 2);
        break;
      }

      case TileType.INSUFFLATOR: {
        // Insuflador de CO2
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 8, y + S - 2, S - 14, 2);
        // Corpo
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 6, y + 10, S - 12, S - 14);
        // Display de pressão
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(x + 8, y + 12, 10, 6);
        // Valor de pressão
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(x + 10, y + 14, 6, 2);
        // Display de fluxo
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(x + 8, y + 20, 10, 4);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(x + 10, y + 21, 4, 2);
        // Botões
        ctx.fillStyle = '#40a040';
        ctx.fillRect(x + 20, y + 12, 4, 4);
        ctx.fillStyle = '#a04040';
        ctx.fillRect(x + 20, y + 18, 4, 4);
        // Conexão de gás
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 14, y + 4, 4, 6);
        ctx.fillStyle = '#606060';
        ctx.beginPath();
        ctx.arc(x + 16, y + 4, 3, Math.PI, 0);
        ctx.fill();
        break;
      }

      // --- OFTALMOLOGIA ---

      case TileType.PHACO_MACHINE: {
        // Facoemulsificador (cirurgia de catarata)
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Corpo principal
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(x + 4, y + 8, S - 8, S - 12);
        // Tela touch
        ctx.fillStyle = '#0a1a2a';
        ctx.fillRect(x + 6, y + 10, S - 12, 10);
        // Interface (olho estilizado)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + 16, y + 15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4080c0';
        ctx.beginPath();
        ctx.arc(x + 16, y + 15, 2, 0, Math.PI * 2);
        ctx.fill();
        // Painel inferior
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(x + 6, y + 22, S - 12, 4);
        // Pedal indicator
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 8, y + 23, 3, 2);
        // Cassette
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 16, y + 22, 6, 4);
        // Handpiece
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 12, y + 2, 8, 4);
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 15, y + 1, 2, 3);
        break;
      }

      case TileType.OPERATING_MICROSCOPE: {
        // Microscópio operatório (oftalmologia)
        // Similar ao microscópio cirúrgico mas mais compacto
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + S - 1, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Base
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 10, y + S - 4, 12, 4);
        // Coluna fina
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 14, y + 14, 4, S - 18);
        // Cabeça do microscópio
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(x + 6, y + 4, 12, 10);
        // Oculares
        ctx.fillStyle = '#303030';
        ctx.fillRect(x + 7, y + 2, 4, 4);
        ctx.fillRect(x + 13, y + 2, 4, 4);
        // Lente objetiva grande
        ctx.fillStyle = '#4080c0';
        ctx.beginPath();
        ctx.arc(x + 12, y + 12, 5, 0, Math.PI * 2);
        ctx.fill();
        // Iluminação coaxial
        ctx.fillStyle = '#ffffcc';
        ctx.beginPath();
        ctx.arc(x + 12, y + 12, 2, 0, Math.PI * 2);
        ctx.fill();
        // Braço de suporte
        ctx.fillStyle = '#707070';
        ctx.fillRect(x + 18, y + 8, 8, 3);
        break;
      }

      // --- UROLOGIA ---

      case TileType.LITHOTRIPSY: {
        // Litotriptor (ondas de choque)
        // Sombra grande
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 2, y + S - 3, S - 2, 3);
        // Base
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 4, y + 16, S - 8, 12);
        // Cabeça emissora
        ctx.fillStyle = '#4080c0';
        ctx.beginPath();
        ctx.arc(x + 16, y + 12, 8, 0, Math.PI * 2);
        ctx.fill();
        // Centro focal
        ctx.fillStyle = '#60a0d0';
        ctx.beginPath();
        ctx.arc(x + 16, y + 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#80c0e0';
        ctx.beginPath();
        ctx.arc(x + 16, y + 12, 2, 0, Math.PI * 2);
        ctx.fill();
        // Ondas de choque (estilizado)
        ctx.strokeStyle = '#a0c0e0';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(x + 16, y + 12, 10 + i * 3, Math.PI * 0.25, Math.PI * 0.75);
          ctx.stroke();
        }
        // Painel de controle
        ctx.fillStyle = '#303030';
        ctx.fillRect(x + 6, y + 20, S - 12, 6);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 8, y + 22, 4, 2);
        break;
      }

      case TileType.CYSTOSCOPY_TOWER: {
        // Torre de cistoscopia
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Rack
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(x + 6, y + 4, S - 12, S - 8);
        // Monitor
        ctx.fillStyle = '#0a1a2a';
        ctx.fillRect(x + 8, y + 6, S - 16, 10);
        // Imagem da bexiga
        ctx.fillStyle = '#ffcccc';
        ctx.beginPath();
        ctx.arc(x + 16, y + 11, 4, 0, Math.PI * 2);
        ctx.fill();
        // Fonte de luz
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 8, y + 18, S - 16, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 10, y + 19, 4, 1);
        // Irrigação
        ctx.fillStyle = '#80c0ff';
        ctx.fillRect(x + 8, y + 23, S - 16, 3);
        ctx.fillStyle = '#60a0e0';
        ctx.fillRect(x + 16, y + 24, 4, 1);
        break;
      }

      // --- OBSTETRÍCIA ---

      case TileType.DELIVERY_BED: {
        // Cama de parto
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 2, y + S - 2, S - 2, 2);
        // Estrutura
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 2, y + 8, S - 4, S - 12);
        // Colchão
        ctx.fillStyle = '#f0a0c0';
        ctx.fillRect(x + 4, y + 10, S - 8, S - 16);
        // Cabeceira elevada
        ctx.fillStyle = '#d090b0';
        ctx.fillRect(x + 4, y + 6, S - 8, 6);
        // Estribos
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 2, y + 20, 4, 6);
        ctx.fillRect(x + 26, y + 20, 4, 6);
        // Apoio de pernas
        ctx.fillStyle = '#909090';
        ctx.fillRect(x + 3, y + 18, 3, 3);
        ctx.fillRect(x + 26, y + 18, 3, 3);
        // Base
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 6, y + S - 4, S - 12, 4);
        break;
      }

      case TileType.FETAL_MONITOR: {
        // Monitor fetal / Cardiotocógrafo (CTG)
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Corpo
        ctx.fillStyle = '#f0f0e8';
        ctx.fillRect(x + 4, y + 6, S - 8, S - 10);
        // Tela principal
        ctx.fillStyle = '#0a1a0a';
        ctx.fillRect(x + 6, y + 8, S - 12, 12);
        // Batimento fetal (linha rosa)
        ctx.strokeStyle = '#ff80a0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 7, y + 12);
        ctx.lineTo(x + 10, y + 12);
        ctx.lineTo(x + 11, y + 10);
        ctx.lineTo(x + 12, y + 14);
        ctx.lineTo(x + 13, y + 12);
        ctx.lineTo(x + 18, y + 12);
        ctx.stroke();
        // Contrações (linha verde)
        ctx.strokeStyle = '#80ff80';
        ctx.beginPath();
        ctx.moveTo(x + 7, y + 17);
        ctx.quadraticCurveTo(x + 12, y + 15, x + 18, y + 17);
        ctx.stroke();
        // Display de BPM
        ctx.fillStyle = '#ff80a0';
        ctx.fillRect(x + 20, y + 10, 3, 3);
        // Impressora térmica
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(x + 8, y + 22, S - 16, 4);
        // Papel saindo
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(x + 12, y + 24, 8, 4);
        break;
      }

      case TileType.INFANT_WARMER: {
        // Berço aquecido
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 4, y + S - 2, S - 6, 2);
        // Base
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 4, y + 18, S - 8, 10);
        // Colchão do berço
        ctx.fillStyle = '#80c0ff';
        ctx.fillRect(x + 6, y + 20, S - 12, 6);
        // Lateral transparente
        ctx.fillStyle = 'rgba(200,220,255,0.5)';
        ctx.fillRect(x + 4, y + 14, 2, 8);
        ctx.fillRect(x + 26, y + 14, 2, 8);
        // Aquecedor radiante
        ctx.fillStyle = '#ff8040';
        ctx.fillRect(x + 8, y + 6, S - 16, 4);
        // Elementos aquecedores
        ctx.fillStyle = '#ff4020';
        ctx.fillRect(x + 10, y + 7, 3, 2);
        ctx.fillRect(x + 15, y + 7, 3, 2);
        ctx.fillRect(x + 20, y + 7, 3, 2);
        // Suporte
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 14, y + 10, 4, 4);
        // Painel de controle
        ctx.fillStyle = '#303030';
        ctx.fillRect(x + 22, y + 12, 6, 6);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 24, y + 14, 2, 2);
        break;
      }

      // --- MOBILIÁRIO HOSPITALAR ---

      case TileType.SURGICAL_STOOL: {
        // Banco cirúrgico
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + S - 1, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Base com rodas
        ctx.fillStyle = '#606060';
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const bx = 16 + Math.cos(angle) * 6;
          const by = S - 3 + Math.sin(angle) * 2;
          ctx.fillRect(x + bx - 2, y + by - 1, 4, 2);
        }
        // Coluna
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 14, y + 14, 4, S - 18);
        // Assento
        ctx.fillStyle = '#303030';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 14, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#404040';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 12, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case TileType.KICK_BUCKET: {
        // Balde de chute
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + S - 1, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Suporte com rodas
        ctx.fillStyle = '#707070';
        ctx.fillRect(x + 10, y + S - 4, 12, 4);
        // Balde
        ctx.fillStyle = '#a0a0a0';
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 8);
        ctx.lineTo(x + 6, y + S - 4);
        ctx.lineTo(x + 26, y + S - 4);
        ctx.lineTo(x + 24, y + 8);
        ctx.closePath();
        ctx.fill();
        // Borda do balde
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 7, y + 6, 18, 3);
        // Saco plástico dentro
        ctx.fillStyle = '#4080c0';
        ctx.fillRect(x + 10, y + 10, 12, S - 16);
        break;
      }

      case TileType.HAMPER: {
        // Hamper de roupa
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Suporte
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 6, y + 20, S - 12, 8);
        // Rodas
        ctx.fillStyle = '#404040';
        ctx.beginPath();
        ctx.arc(x + 10, y + S - 2, 2, 0, Math.PI * 2);
        ctx.arc(x + 22, y + S - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        // Saco/bolsa
        ctx.fillStyle = '#4080c0';
        ctx.fillRect(x + 4, y + 4, S - 8, 18);
        // Aro superior
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(x + 3, y + 2, S - 6, 3);
        // Tampa aberta
        ctx.fillStyle = '#3070b0';
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x + 8, y);
        ctx.lineTo(x + 24, y);
        ctx.lineTo(x + 28, y + 4);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case TileType.INSTRUMENT_TABLE: {
        // Mesa de instrumentos
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 4, y + S - 2, S - 6, 2);
        // Pernas
        ctx.fillStyle = '#707070';
        ctx.fillRect(x + 6, y + 20, 4, 10);
        ctx.fillRect(x + 22, y + 20, 4, 10);
        // Tampo
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 4, y + 16, S - 8, 6);
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(x + 4, y + 14, S - 8, 3);
        // Instrumentos
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 6, y + 17, 4, 1);
        ctx.fillRect(x + 12, y + 17, 6, 1);
        ctx.fillRect(x + 20, y + 17, 4, 1);
        ctx.fillRect(x + 8, y + 19, 8, 1);
        ctx.fillRect(x + 18, y + 19, 5, 1);
        break;
      }

      case TileType.BACK_TABLE: {
        // Mesa auxiliar grande
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x + 2, y + S - 2, S - 2, 2);
        // Estrutura/pernas
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 4, y + 22, 4, 8);
        ctx.fillRect(x + 24, y + 22, 4, 8);
        // Tampo grande
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 2, y + 18, S - 4, 6);
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(x + 2, y + 16, S - 4, 3);
        // Campos/panos verdes
        ctx.fillStyle = '#40a080';
        ctx.fillRect(x + 4, y + 18, S - 8, 4);
        // Instrumentos organizados
        ctx.fillStyle = '#e0e0e0';
        for (let i = 0; i < 6; i++) {
          ctx.fillRect(x + 6 + i * 4, y + 19, 3, 2);
        }
        break;
      }

      // --- ÁREAS COMUNS ---

      case TileType.COFFEE_MACHINE: {
        // Máquina de café
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 6, y + S - 2, S - 10, 2);
        // Corpo
        ctx.fillStyle = '#303030';
        ctx.fillRect(x + 6, y + 6, S - 12, S - 10);
        // Painel frontal
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 8, y + 8, S - 16, 12);
        // Display
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(x + 10, y + 10, 8, 4);
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(x + 11, y + 11, 6, 2);
        // Botões
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 10, y + 16, 4, 3);
        ctx.fillRect(x + 16, y + 16, 4, 3);
        // Área de dispensar
        ctx.fillStyle = '#202020';
        ctx.fillRect(x + 10, y + 22, S - 20, 4);
        // Xícara
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x + 13, y + 23, 6, 3);
        // Café saindo
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(x + 15, y + 20, 2, 3);
        break;
      }

      case TileType.MICROWAVE: {
        // Micro-ondas
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 4, y + S - 2, S - 6, 2);
        // Corpo
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 4, y + 10, S - 8, S - 14);
        // Porta/janela
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(x + 6, y + 12, 14, 10);
        // Interior (quando ligado)
        ctx.fillStyle = '#ffff80';
        ctx.fillRect(x + 8, y + 14, 10, 6);
        // Painel lateral
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 22, y + 12, 4, 10);
        // Botões
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 23, y + 14, 2, 2);
        ctx.fillRect(x + 23, y + 18, 2, 2);
        // Timer display
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 22, y + 22, 5, 2);
        break;
      }

      case TileType.REFRIGERATOR: {
        // Geladeira
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 4, y + S - 2, S - 6, 2);
        // Corpo
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x + 4, y + 2, S - 8, S - 6);
        // Divisão freezer/geladeira
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(x + 4, y + 12, S - 8, 2);
        // Freezer (topo)
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(x + 6, y + 4, S - 12, 7);
        // Geladeira (baixo)
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(x + 6, y + 15, S - 12, 12);
        // Puxadores
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(x + 22, y + 6, 2, 4);
        ctx.fillRect(x + 22, y + 18, 2, 8);
        // LED indicador
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 8, y + 6, 2, 2);
        break;
      }

      case TileType.DINING_TABLE: {
        // Mesa de refeitório
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 4, y + S - 2, S - 6, 2);
        // Pernas
        ctx.fillStyle = '#707070';
        ctx.fillRect(x + 6, y + 22, 4, 8);
        ctx.fillRect(x + 22, y + 22, 4, 8);
        // Tampo
        ctx.fillStyle = COLORS.wood.base;
        ctx.fillRect(x + 2, y + 18, S - 4, 6);
        ctx.fillStyle = COLORS.wood.light;
        ctx.fillRect(x + 2, y + 16, S - 4, 3);
        // Borda
        ctx.fillStyle = COLORS.wood.dark;
        ctx.fillRect(x + 2, y + 23, S - 4, 1);
        break;
      }

      case TileType.LOCKERS: {
        // Armários / Lockers
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 4, y + S - 2, S - 6, 2);
        // Corpo
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 4, y + 2, S - 8, S - 6);
        // Portas (3 lockers)
        for (let i = 0; i < 3; i++) {
          const lx = x + 6 + i * 8;
          ctx.fillStyle = '#4080c0';
          ctx.fillRect(lx, y + 4, 6, S - 10);
          // Ventilação
          ctx.fillStyle = '#306090';
          ctx.fillRect(lx + 1, y + 6, 4, 1);
          ctx.fillRect(lx + 1, y + 8, 4, 1);
          // Fechadura
          ctx.fillStyle = '#303030';
          ctx.fillRect(lx + 4, y + 14, 2, 3);
        }
        break;
      }

      case TileType.WATER_DISPENSER: {
        // Bebedouro
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 8, y + S - 2, S - 14, 2);
        // Base
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 8, y + 18, S - 16, 10);
        // Galão de água
        ctx.fillStyle = '#80c0ff';
        ctx.fillRect(x + 10, y + 2, S - 20, 16);
        ctx.fillStyle = '#60a0e0';
        ctx.fillRect(x + 12, y + 4, S - 24, 12);
        // Tampa do galão
        ctx.fillStyle = '#4080c0';
        ctx.fillRect(x + 12, y, S - 24, 3);
        // Torneiras
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 11, y + 20, 4, 3);
        ctx.fillRect(x + 17, y + 20, 4, 3);
        // Indicadores (frio/quente)
        ctx.fillStyle = '#4080ff';
        ctx.fillRect(x + 12, y + 21, 2, 1);
        ctx.fillStyle = '#ff4040';
        ctx.fillRect(x + 18, y + 21, 2, 1);
        // Bandeja
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(x + 10, y + 24, S - 20, 2);
        break;
      }

      case TileType.SOFA: {
        // Sofá
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 2, y + S - 2, S - 2, 2);
        // Estrutura
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(x + 2, y + S - 6, S - 4, 6);
        // Pernas
        ctx.fillRect(x + 4, y + S - 3, 3, 3);
        ctx.fillRect(x + 25, y + S - 3, 3, 3);
        // Assento
        ctx.fillStyle = '#4080a0';
        ctx.fillRect(x + 4, y + 14, S - 8, 10);
        // Encosto
        ctx.fillStyle = '#3070a0';
        ctx.fillRect(x + 4, y + 6, S - 8, 10);
        // Braços
        ctx.fillStyle = '#306090';
        ctx.fillRect(x + 2, y + 10, 4, 14);
        ctx.fillRect(x + 26, y + 10, 4, 14);
        // Almofadas
        ctx.fillStyle = '#50a0c0';
        ctx.fillRect(x + 6, y + 16, 8, 6);
        ctx.fillRect(x + 18, y + 16, 8, 6);
        break;
      }

      case TileType.TV_SCREEN: {
        // TV / Tela
        // Suporte de parede
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 14, y, 4, 6);
        // Moldura
        ctx.fillStyle = '#202020';
        ctx.fillRect(x + 4, y + 4, S - 8, S - 14);
        // Tela
        ctx.fillStyle = '#1a2a3a';
        ctx.fillRect(x + 6, y + 6, S - 12, S - 18);
        // Conteúdo na tela (barras de notícia estilizadas)
        ctx.fillStyle = '#4080c0';
        ctx.fillRect(x + 8, y + 8, 12, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 8, y + 16, 14, 2);
        ctx.fillRect(x + 8, y + 20, 10, 1);
        // LED indicador
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x + 15, y + S - 12, 2, 2);
        break;
      }
    }
  };

  const drawCharacter = (ctx: CanvasRenderingContext2D, entity: Entity, isMoving: boolean) => {
    const px = Math.floor(entity.x);
    const py = Math.floor(entity.y);
    const spriteId = CHARACTER_SPRITE_MAP[entity.id] || 1;
    const img = characterImagesRef.current[`premade_${spriteId}`];

    // Direção para row no spritesheet (down=0, left=1, right=2, up=3)
    const directionRow: Record<Direction, number> = {
      [Direction.DOWN]: 0,
      [Direction.LEFT]: 1,
      [Direction.RIGHT]: 2,
      [Direction.UP]: 3,
    };

    const row = directionRow[entity.direction];
    const frame = isMoving ? Math.floor(frameCountRef.current / 8) % 4 : 0;
    const spriteSize = 32;

    // === Animação de Respiração (Idle) ===
    const breatheOffset = !isMoving ? Math.sin(frameCountRef.current * 0.08) * 1.5 : 0;
    const adjustedPy = py + breatheOffset;

    // Sombra (escala com respiração)
    const shadowScale = 1 + (!isMoving ? Math.sin(frameCountRef.current * 0.08) * 0.05 : 0);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE - 2, 12 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    if (img && charactersLoadedRef.current) {
      // Desenha sprite do personagem com breathing offset
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        img,
        frame * spriteSize,
        row * spriteSize,
        spriteSize,
        spriteSize,
        px,
        Math.floor(adjustedPy),
        TILE_SIZE,
        TILE_SIZE
      );
    } else {
      // Fallback: personagem estilizado
      drawFallbackCharacter(ctx, entity, px, Math.floor(adjustedPy), frame, isMoving);
    }
  };

  const drawFallbackCharacter = (
    ctx: CanvasRenderingContext2D,
    entity: Entity,
    px: number,
    py: number,
    frame: number,
    isMoving: boolean
  ) => {
    const cx = px + 16;
    const bounce = isMoving ? (frame % 2 === 0 ? -1 : 1) : 0;

    // Corpo
    ctx.fillStyle = entity.color;
    ctx.beginPath();
    ctx.roundRect(cx - 8, py + 12 + bounce, 16, 14, 4);
    ctx.fill();

    // Cabeça
    ctx.fillStyle = entity.skinColor || '#ffedd5';
    ctx.beginPath();
    ctx.arc(cx, py + 10 + bounce, 9, 0, Math.PI * 2);
    ctx.fill();

    // Cabelo
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(cx, py + 6 + bounce, 8, Math.PI, Math.PI * 2);
    ctx.fill();

    // Olhos (se olhando para frente ou lados)
    if (entity.direction !== Direction.UP) {
      ctx.fillStyle = '#1e293b';
      const eyeOffset = entity.direction === Direction.LEFT ? -2 :
                        entity.direction === Direction.RIGHT ? 2 : 0;
      ctx.beginPath();
      ctx.arc(cx - 3 + eyeOffset, py + 9 + bounce, 1.5, 0, Math.PI * 2);
      ctx.arc(cx + 3 + eyeOffset, py + 9 + bounce, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pernas
    ctx.fillStyle = '#1e293b';
    const legOffset = isMoving ? (frame % 2 === 0 ? 2 : -2) : 0;
    ctx.fillRect(cx - 5 + legOffset, py + 26, 4, 6);
    ctx.fillRect(cx + 1 - legOffset, py + 26, 4, 6);
  };

  // --- Speech Bubble ---
  const drawSpeechBubble = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    opacity: number = 1
  ) => {
    ctx.save();
    ctx.globalAlpha = opacity;

    const padding = 8;
    const maxWidth = 160;
    const lineHeight = 12;

    ctx.font = '9px "Press Start 2P", monospace';

    // Quebra texto
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth - padding * 2) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    let bubbleWidth = 0;
    for (const line of lines) {
      bubbleWidth = Math.max(bubbleWidth, ctx.measureText(line).width);
    }
    bubbleWidth += padding * 2;
    bubbleWidth = Math.max(bubbleWidth, 50);

    const bubbleHeight = lines.length * lineHeight + padding * 2;
    const bubbleX = x - bubbleWidth / 2;
    const bubbleY = y - bubbleHeight - 10;

    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(bubbleX + 2, bubbleY + 2, bubbleWidth, bubbleHeight, 4);
    ctx.fill();

    // Fundo
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 4);
    ctx.fill();

    // Borda
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Triângulo
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(x - 6, bubbleY + bubbleHeight - 1);
    ctx.lineTo(x + 6, bubbleY + bubbleHeight - 1);
    ctx.lineTo(x, bubbleY + bubbleHeight + 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(x - 6, bubbleY + bubbleHeight);
    ctx.lineTo(x, bubbleY + bubbleHeight + 8);
    ctx.lineTo(x + 6, bubbleY + bubbleHeight);
    ctx.stroke();

    // Texto
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    lines.forEach((line, i) => {
      ctx.fillText(line, bubbleX + padding, bubbleY + padding + i * lineHeight);
    });

    ctx.restore();
  };

  // --- Desenha Partículas ---
  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = alpha * 0.6;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  // --- Efeito de Luz Pulsante em Equipamentos ---
  const drawEquipmentGlow = (ctx: CanvasRenderingContext2D, x: number, y: number, tile: TileType) => {
    // Equipamentos que têm luzes pulsantes
    const glowingEquipment = [
      TileType.ANESTHESIA_MACHINE,
      TileType.PATIENT_MONITOR,
      TileType.VENTILATOR,
      TileType.DEFIBRILLATOR,
      TileType.BIS_MONITOR,
      TileType.CEC_MACHINE,
      TileType.FETAL_MONITOR,
    ];

    if (!glowingEquipment.includes(tile)) return;

    const pulse = Math.sin(frameCountRef.current * 0.1) * 0.5 + 0.5;
    const glowSize = 3 + pulse * 2;

    // Cor do glow baseada no equipamento
    let glowColor = '#00ff88';
    if (tile === TileType.DEFIBRILLATOR) glowColor = '#ff4444';
    if (tile === TileType.CEC_MACHINE) glowColor = '#4488ff';
    if (tile === TileType.FETAL_MONITOR) glowColor = '#ff88ff';

    ctx.save();
    ctx.globalAlpha = 0.3 + pulse * 0.4;
    ctx.shadowBlur = glowSize * 2;
    ctx.shadowColor = glowColor;
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE / 2, y + 12, glowSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // --- Main Render ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Camera
    const camX = Math.max(0, Math.min(
      playerRef.current.x - canvas.width / 2,
      MAP_WIDTH * TILE_SIZE - canvas.width
    ));
    const camY = Math.max(0, Math.min(
      playerRef.current.y - canvas.height / 2,
      MAP_HEIGHT * TILE_SIZE - canvas.height
    ));

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-Math.floor(camX), -Math.floor(camY));

    // Desenha tiles e entidades por Y (depth sorting)
    let nearestNpc: NPC | null = null;
    let nearestDist = Infinity;

    const isPlayerMoving = keysPressed.current['ArrowUp'] || keysPressed.current['ArrowDown'] ||
      keysPressed.current['ArrowLeft'] || keysPressed.current['ArrowRight'] ||
      keysPressed.current['KeyW'] || keysPressed.current['KeyA'] ||
      keysPressed.current['KeyS'] || keysPressed.current['KeyD'];

    for (let y = 0; y < MAP_HEIGHT; y++) {
      // Desenha tiles desta linha
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = INITIAL_MAP[y][x];
        drawTile(ctx, tile, x * TILE_SIZE, y * TILE_SIZE);
        // Efeito de luz pulsante em equipamentos
        drawEquipmentGlow(ctx, x * TILE_SIZE, y * TILE_SIZE, tile);
      }

      // Desenha entidades nesta linha (Y-sorting)
      const allEntities = [...npcsRef.current, playerRef.current];
      const rowEntities = allEntities.filter(e => {
        const entityRow = Math.floor((e.y + TILE_SIZE - 4) / TILE_SIZE);
        return entityRow === y;
      });

      rowEntities.forEach(e => {
        const isPlayer = e.id === 'player';
        const isMoving = isPlayer && isPlayerMoving;

        drawCharacter(ctx, e, isMoving);

        // Verifica NPC mais próximo
        if (e.type === 'npc' && !isDialogueOpen) {
          const dx = (e.x + TILE_SIZE / 2) - (playerRef.current.x + TILE_SIZE / 2);
          const dy = (e.y + TILE_SIZE / 2) - (playerRef.current.y + TILE_SIZE / 2);
          const d = Math.hypot(dx, dy);
          if (d < nearestDist) {
            nearestDist = d;
            nearestNpc = e as NPC;
          }
        }
      });
    }

    // Indicador de interação
    if (nearestNpc && nearestDist < INTERACTION_DISTANCE + 4 && !isDialogueOpen) {
      const px = nearestNpc.x + TILE_SIZE / 2;
      const py = nearestNpc.y - 8;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;

      const w = 72;
      const h = 22;
      ctx.beginPath();
      ctx.roundRect(px - w / 2, py - h, w, h, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e0f2fe';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('SPACE', px, py - 6);
    }

    // Partículas de poeira
    drawParticles(ctx);

    // Balões de fala ativos
    const bubbles = dialogueManager.updateBubbles();
    bubbles.forEach(bubble => {
      const entity = bubble.speakerId === 'player'
        ? playerRef.current
        : npcsRef.current.find(n => n.id === bubble.speakerId);

      if (entity) {
        drawSpeechBubble(ctx, bubble.text, entity.x + TILE_SIZE / 2, entity.y - 10, bubble.opacity);
      }
    });

    ctx.restore();

    // Vinheta
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.height / 3,
      canvas.width / 2, canvas.height / 2, canvas.height
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(15,23,42,0.35)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  }, [isDialogueOpen]);

  // Game loop
  const tick = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(tick);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tick]);

  // Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="block w-full h-full bg-slate-950" />;
};

export default GameEngine;
