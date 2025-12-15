import React, { useEffect, useRef, useCallback } from 'react';
import { INITIAL_MAP, TILE_SIZE, PALETTE, MAP_WIDTH, MAP_HEIGHT, MOVE_SPEED, INTERACTION_DISTANCE, SPRITE_SHEETS } from '../constants';
import { Direction, Entity, NPC, TileType } from '../types';

interface GameEngineProps {
  onInteract: (npc: NPC) => void;
  isDialogueOpen: boolean;
}

const GameEngine: React.FC<GameEngineProps> = ({ onInteract, isDialogueOpen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const frameCountRef = useRef<number>(0);
  const spriteImagesRef = useRef<{ [key: string]: HTMLImageElement | null }>({});
  const spritesLoadedRef = useRef<boolean>(false);
  const spriteOverridesRef = useRef<Record<string, { x: number; y: number }>>({});
  
  const playerRef = useRef<Entity>({
    id: 'player',
    x: 16 * TILE_SIZE,
    y: 20 * TILE_SIZE,
    direction: Direction.UP,
    color: '#3b82f6',
    skinColor: PALETTE.skin,
    type: 'player'
  });

  const npcsRef = useRef<NPC[]>([
    {
      id: 'receptionist',
      x: 16 * TILE_SIZE,
      y: 3 * TILE_SIZE,
      direction: Direction.DOWN,
      color: '#f472b6', 
      skinColor: '#fecaca',
      type: 'npc',
      name: 'Nurse Joy',
      role: 'Receptionist',
      dialoguePrompt: 'Cheerful and organized. Manages patient intake.'
    },
    {
      id: 'surgeon',
      x: 6 * TILE_SIZE,
      y: 5 * TILE_SIZE,
      direction: Direction.RIGHT,
      color: '#10b981',
      skinColor: '#fed7aa',
      type: 'npc',
      name: 'Dr. Strange',
      role: 'Surgeon',
      dialoguePrompt: 'Professional, slightly arrogant. Expert in neurosurgery.'
    },
    {
      id: 'radiologist',
      x: 23 * TILE_SIZE,
      y: 5 * TILE_SIZE, 
      direction: Direction.DOWN,
      color: '#8b5cf6',
      skinColor: '#e5e7eb',
      type: 'npc',
      name: 'Dr. Ray',
      role: 'Radiologist',
      dialoguePrompt: 'Technical, quiet. Loves machines more than people.'
    },
    {
      id: 'patient_waiting',
      x: 23 * TILE_SIZE,
      y: 16 * TILE_SIZE,
      direction: Direction.LEFT,
      color: '#94a3b8',
      skinColor: '#fde047', 
      type: 'npc',
      name: 'Bob',
      role: 'Patient',
      dialoguePrompt: 'Anxious about appointment. Reading a magazine.'
    },
    {
      id: 'patient_bed',
      x: 4 * TILE_SIZE,
      y: 15 * TILE_SIZE,
      direction: Direction.RIGHT,
      color: '#e2e8f0', // White gown
      skinColor: '#ffedd5',
      type: 'npc',
      name: 'Alice',
      role: 'Inpatient',
      dialoguePrompt: 'Resting, recovering from surgery. Hopeful.'
    }
  ]);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  // --- Input & Logic ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
      if (e.code === 'Space' || e.code === 'Enter') {
        if (!isDialogueOpen) checkInteraction();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogueOpen]);

  // --- Load Spritesheets ---
  useEffect(() => {
    const entries = Object.entries(SPRITE_SHEETS);
    let loadedCount = 0;
    if (entries.length === 0) return;

    entries.forEach(([key, sheet]) => {
      const img = new Image();
      img.src = sheet.src;
      img.onload = () => {
        loadedCount += 1;
        if (loadedCount === entries.length) {
          spritesLoadedRef.current = true;
        }
      };
      spriteImagesRef.current[key] = img;
    });

    // Load overrides from localStorage
    try {
      const raw = localStorage.getItem('tileOverrides');
      if (raw) {
        spriteOverridesRef.current = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load tile overrides', e);
    }

    // Listen to override events from Tile Picker UI
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      if (!detail?.type || typeof detail.x !== 'number' || typeof detail.y !== 'number') return;
      spriteOverridesRef.current[detail.type] = { x: detail.x, y: detail.y };
      localStorage.setItem('tileOverrides', JSON.stringify(spriteOverridesRef.current));
    };
    window.addEventListener('setTileOverride', handler);
    return () => window.removeEventListener('setTileOverride', handler);
  }, []);

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
      TileType.SINK
    ].includes(tile);
  };

  const isWalkable = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= MAP_WIDTH * TILE_SIZE || y >= MAP_HEIGHT * TILE_SIZE) return false;

    // Small hitbox at feet
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
  }, [isDialogueOpen]);

  // --- Rendering Helpers ---

  const drawShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number) => {
     ctx.fillStyle = PALETTE.shadow;
     ctx.beginPath();
     ctx.ellipse(x + w/2, y, w/2, 6, 0, 0, Math.PI * 2);
     ctx.fill();
  };

  const drawRoundedBox = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, border: string) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = border;
    ctx.stroke();
  };

  const drawSpriteTile = (
    ctx: CanvasRenderingContext2D,
    sheetKey: keyof typeof SPRITE_SHEETS,
    variant: keyof (typeof SPRITE_SHEETS)['room']['map'] | keyof (typeof SPRITE_SHEETS)['interiors']['map'],
    dx: number,
    dy: number
  ) => {
    const sheet = SPRITE_SHEETS[sheetKey];
    const img = spriteImagesRef.current[sheetKey];
    if (!sheet || !img) return false;
    // Check overrides first (for interiors like bed/chair)
    const override = spriteOverridesRef.current[variant as string];
    const coords = override || sheet.map[variant];
    if (!coords) return false;
    ctx.drawImage(
      img,
      coords.x * sheet.tileSize,
      coords.y * sheet.tileSize,
      sheet.tileSize,
      sheet.tileSize,
      dx,
      dy,
      TILE_SIZE,
      TILE_SIZE
    );
    return true;
  };

  const drawTile = (ctx: CanvasRenderingContext2D, tile: TileType, x: number, y: number) => {
    const spritesReady = spritesLoadedRef.current;

    // 1. Draw Floor
    if (tile !== TileType.WALL) {
      if (tile === TileType.FLOOR_OR) {
        ctx.fillStyle = PALETTE.floorOR;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Sterile Tile Grid
        ctx.fillStyle = PALETTE.floorORGrid;
        ctx.fillRect(x, y + TILE_SIZE - 1, TILE_SIZE, 1);
        ctx.fillRect(x + TILE_SIZE - 1, y, 1, TILE_SIZE);
      } else {
        // Standard or Waiting Room
        const isWaiting = x > 18 * TILE_SIZE && y > 12 * TILE_SIZE;
        const spriteUsed =
          spritesReady &&
          drawSpriteTile(ctx, 'room', isWaiting ? 'floorWarm' : 'floor', x, y);

        if (!spriteUsed) {
          ctx.fillStyle = isWaiting ? PALETTE.floorWarm : PALETTE.floorBase;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          // Soft checker pattern for depth
          const isAlt = ((x / TILE_SIZE) + (y / TILE_SIZE)) % 2 === 0;
          ctx.fillStyle = isWaiting ? 'rgba(255, 213, 128, 0.05)' : 'rgba(148, 163, 184, 0.05)';
          if (isAlt) ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          
          // Detailed Tile border (Subtle)
          ctx.strokeStyle = isWaiting ? PALETTE.floorWarmDark : PALETTE.floorTileEdge;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.rect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.stroke();
        }
      }
    }

    // 2. Draw Objects
    switch (tile) {
      case TileType.WALL:
        const wallSprite =
          spritesReady && (drawSpriteTile(ctx, 'room', 'wall', x, y) || drawSpriteTile(ctx, 'room', 'wallAlt', x, y));
        if (!wallSprite) {
          // Main Wall Face (fallback)
          ctx.fillStyle = PALETTE.wallBase;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          
          // Baseboard (Darker bottom)
          ctx.fillStyle = PALETTE.baseboard;
          ctx.fillRect(x, y + TILE_SIZE - 6, TILE_SIZE, 6);
          
          // Cap (Lighter top)
          ctx.fillStyle = PALETTE.wallCap;
          ctx.fillRect(x, y, TILE_SIZE, 6);
          
          // Side Outline (Subtle depth)
          ctx.fillStyle = 'rgba(0,0,0,0.05)';
          ctx.fillRect(x + TILE_SIZE - 1, y, 1, TILE_SIZE);
        }
        break;

      case TileType.DOOR:
        const doorSprite = spritesReady && drawSpriteTile(ctx, 'room', 'door', x, y);
        if (!doorSprite) {
          ctx.fillStyle = PALETTE.metalBase;
          ctx.fillRect(x, y, 4, TILE_SIZE); 
          ctx.fillRect(x + TILE_SIZE - 4, y, 4, TILE_SIZE); 
          ctx.fillStyle = '#cbd5e1'; 
          ctx.fillRect(x + 4, y + TILE_SIZE - 4, TILE_SIZE - 8, 4);
        }
        break;

      case TileType.BED:
        const bedSprite = spritesReady && drawSpriteTile(ctx, 'interiors', 'bed' as any, x, y);
        if (!bedSprite) {
          drawShadow(ctx, x, y + 28, 28);
          // Frame
          drawRoundedBox(ctx, x + 2, y + 10, TILE_SIZE - 4, 18, 2, '#ffffff', PALETTE.metalBase);
          // Blanket (Rounded Top)
          ctx.fillStyle = PALETTE.bedSheet;
          ctx.beginPath();
          ctx.roundRect(x + 3, y + 14, TILE_SIZE - 6, 13, [4, 4, 0, 0]);
          ctx.fill();
          // Pillow (Soft Round)
          ctx.fillStyle = PALETTE.bedPillow;
          ctx.beginPath();
          ctx.roundRect(x + 6, y + 4, TILE_SIZE - 12, 8, 4);
          ctx.fill();
          ctx.strokeStyle = PALETTE.metalBase;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        break;

      case TileType.MRI_MACHINE:
        drawShadow(ctx, x, y + 30, 32);
        // Back Unit
        drawRoundedBox(ctx, x, y, 32, 32, 4, PALETTE.metalLight, PALETTE.outline);
        // Circle Hole
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 12, 0, Math.PI * 2);
        ctx.fill();
        // Inner detail
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 12, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case TileType.CABINET:
        drawShadow(ctx, x, y + 28, 28);
        drawRoundedBox(ctx, x + 2, y + 4, 28, 24, 2, PALETTE.woodLight, PALETTE.woodOutline);
        // Drawers
        ctx.fillStyle = PALETTE.woodOutline;
        ctx.fillRect(x + 6, y + 12, 20, 1);
        ctx.fillRect(x + 6, y + 20, 20, 1);
        // Knobs (Circles)
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x + 16, y + 9, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 16, y + 17, 2, 0, Math.PI * 2); ctx.fill();
        break;
      
      case TileType.VENDING_MACHINE:
        drawShadow(ctx, x, y + 28, 28);
        drawRoundedBox(ctx, x + 2, y, 28, 28, 4, PALETTE.plasticRed, PALETTE.outline);
        // Glass
        ctx.fillStyle = PALETTE.glassDark;
        ctx.beginPath();
        ctx.roundRect(x + 6, y + 4, 20, 16, 2);
        ctx.fill();
        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 4);
        ctx.lineTo(x + 24, y + 4);
        ctx.lineTo(x + 12, y + 20);
        ctx.lineTo(x + 8, y + 20);
        ctx.fill();
        break;

      case TileType.CHAIR_WAITING:
        const chairSprite = spritesReady && drawSpriteTile(ctx, 'interiors', 'chair' as any, x, y);
        if (!chairSprite) {
          drawShadow(ctx, x + 4, y + 28, 20);
          // Back (Rounded top)
          ctx.beginPath();
          ctx.roundRect(x + 6, y + 6, 20, 10, [4, 4, 2, 2]);
          ctx.fillStyle = '#60a5fa';
          ctx.fill();
          ctx.strokeStyle = '#2563eb';
          ctx.stroke();
          // Seat
          ctx.beginPath();
          ctx.roundRect(x + 6, y + 18, 20, 6, 2);
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
          ctx.stroke();
          // Legs
          ctx.fillStyle = PALETTE.metalBase;
          ctx.fillRect(x + 8, y + 24, 2, 6);
          ctx.fillRect(x + 22, y + 24, 2, 6);
        }
        break;

      case TileType.DESK_RECEPTION:
        drawShadow(ctx, x, y + 28, 30);
        // L-Shape feel, rounded
        drawRoundedBox(ctx, x, y + 4, TILE_SIZE, 24, 2, PALETTE.woodLight, PALETTE.woodOutline);
        // Counter top
        ctx.fillStyle = '#ffedd5';
        ctx.beginPath();
        ctx.roundRect(x, y + 2, TILE_SIZE, 6, 2);
        ctx.fill();
        break;

      case TileType.COMPUTER_DESK:
        drawShadow(ctx, x, y + 28, 32);
        drawRoundedBox(ctx, x, y + 10, 32, 18, 2, PALETTE.woodLight, PALETTE.woodOutline);
        // Monitor Base
        ctx.fillStyle = '#334155';
        ctx.fillRect(x + 12, y + 6, 8, 4);
        // Monitor
        drawRoundedBox(ctx, x + 4, y - 6, 24, 16, 2, '#0f172a', '#334155');
        // Screen
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(x + 6, y - 4, 20, 12);
        break;

      case TileType.OR_TABLE:
        drawShadow(ctx, x + 4, y + 28, 24);
        // Base
        ctx.fillStyle = PALETTE.metalDark;
        ctx.fillRect(x + 12, y + 12, 8, 16);
        // Top
        drawRoundedBox(ctx, x + 2, y + 8, 28, 8, 2, PALETTE.metalLight, PALETTE.metalDark);
        break;

      case TileType.SINK:
        drawShadow(ctx, x, y + 28, 30);
        drawRoundedBox(ctx, x, y + 8, 32, 20, 4, PALETTE.metalBase, PALETTE.metalDark);
        // Basin
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 10, 24, 12, 2);
        ctx.fill();
        // Faucet (Curve)
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 6);
        ctx.quadraticCurveTo(x + 16, y - 4, x + 22, y + 2);
        ctx.stroke();
        break;

      case TileType.PLANT:
        drawShadow(ctx, x + 8, y + 28, 16);
        // Pot
        drawRoundedBox(ctx, x + 10, y + 18, 12, 10, 2, '#b45309', '#78350f');
        // Leaves (Organic Cluster)
        ctx.fillStyle = '#166534';
        const t = frameCountRef.current;
        const sway = Math.sin(t / 20) * 1.5;
        
        ctx.beginPath(); 
        ctx.arc(x + 16 + sway, y + 12, 9, 0, Math.PI*2); 
        ctx.arc(x + 10 + sway, y + 16, 7, 0, Math.PI*2); 
        ctx.arc(x + 22 + sway, y + 16, 7, 0, Math.PI*2); 
        ctx.arc(x + 16 + sway, y + 6, 7, 0, Math.PI*2); 
        ctx.fill();
        
        // Leaf Highlights
        ctx.fillStyle = '#4ade80';
        ctx.beginPath(); ctx.arc(x + 14 + sway, y + 10, 3, 0, Math.PI*2); ctx.fill();
        break;
    }
  };

  const drawEntity = (ctx: CanvasRenderingContext2D, e: Entity) => {
    const px = Math.floor(e.x);
    const py = Math.floor(e.y);
    const isMoving = e.id === 'player' && (keysPressed.current['ArrowUp'] || keysPressed.current['ArrowDown'] || keysPressed.current['ArrowLeft'] || keysPressed.current['ArrowRight'] || keysPressed.current['KeyW']);
    
    const frame = isMoving ? Math.floor(frameCountRef.current / 8) % 2 : 0;
    const bounce = isMoving ? (frame === 0 ? 0 : -2) : 0;

    // Soft Shadow
    drawShadow(ctx, px + 4, py + 28, 24);

    // --- Chibi Body (Rounded) ---
    const cx = px + 16;
    
    // Legs (Little rounded stubs)
    ctx.fillStyle = '#0f172a'; 
    if (e.direction === Direction.LEFT || e.direction === Direction.RIGHT) {
      const legOffset = isMoving ? (frame === 0 ? 3 : -3) : 0;
      ctx.beginPath();
      ctx.roundRect(cx - 3 + legOffset, py + 24, 6, 8, 3);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.roundRect(cx - 7, py + 24, 5, 8, 2);
      ctx.roundRect(cx + 2, py + 24, 5, 8, 2);
      ctx.fill();
    }

    // Torso (Rounded Rect)
    ctx.fillStyle = e.color; 
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Tapered torso
    ctx.roundRect(px + 8, py + 14 + bounce, 16, 12, 3);
    ctx.fill();
    ctx.stroke();

    // V-Neck Detail for Scrubs
    if (e.direction === Direction.DOWN) {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.beginPath();
      ctx.moveTo(cx - 2, py + 14 + bounce);
      ctx.lineTo(cx, py + 18 + bounce);
      ctx.lineTo(cx + 2, py + 14 + bounce);
      ctx.fill();
    }

    // Head (Round shape)
    const headY = py + bounce;
    ctx.fillStyle = e.skinColor || PALETTE.skin;
    ctx.beginPath();
    ctx.roundRect(px + 6, headY, 20, 16, 6);
    ctx.fill();
    ctx.stroke();

    // Hair (Custom shapes per role)
    const role = (e as NPC).role;
    if (role === 'Receptionist') ctx.fillStyle = '#f472b6'; // Pink
    else if (role === 'Surgeon') ctx.fillStyle = '#064e3b'; // Cap
    else if (e.type === 'player') ctx.fillStyle = '#1e3a8a'; // Cap
    else if (e.id === 'patient_waiting') ctx.fillStyle = '#facc15'; // Blonde
    else ctx.fillStyle = '#57534e'; // Brown

    ctx.beginPath();
    if (role === 'Surgeon' || e.type === 'player') {
      // Cap shape
      ctx.roundRect(px + 5, headY - 2, 22, 8, 4);
    } else {
      // Basic Hair shape
      ctx.moveTo(px + 6, headY + 10);
      ctx.lineTo(px + 6, headY + 4);
      ctx.quadraticCurveTo(cx, headY - 4, px + 26, headY + 4);
      ctx.lineTo(px + 26, headY + 10);
      // Bangs
      ctx.lineTo(px + 20, headY + 4);
      ctx.lineTo(px + 12, headY + 4);
      ctx.lineTo(px + 6, headY + 10);
    }
    ctx.fill();

    // Eyes (Rounded)
    ctx.fillStyle = '#0f172a';
    if (e.direction === Direction.DOWN) {
      ctx.beginPath(); ctx.arc(px + 11, headY + 10, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 21, headY + 10, 2, 0, Math.PI*2); ctx.fill();
    } else if (e.direction === Direction.RIGHT) {
      ctx.beginPath(); ctx.arc(px + 21, headY + 10, 2, 0, Math.PI*2); ctx.fill();
    } else if (e.direction === Direction.LEFT) {
      ctx.beginPath(); ctx.arc(px + 11, headY + 10, 2, 0, Math.PI*2); ctx.fill();
    }
  };

  // --- Main Render ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetCamX = Math.max(0, Math.min(playerRef.current.x - canvas.width / 2, MAP_WIDTH * TILE_SIZE - canvas.width));
    const targetCamY = Math.max(0, Math.min(playerRef.current.y - canvas.height / 2, MAP_HEIGHT * TILE_SIZE - canvas.height));
    
    // Pixel-snap camera for crispness
    const camX = Math.floor(targetCamX);
    const camY = Math.floor(targetCamY);

    // Clear
    ctx.fillStyle = '#020617'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camX, -camY);

    // 1. Draw Map & Entities (Y-sorted)
    let nearestNpc: NPC | null = null;
    let nearestDist = Infinity;

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = INITIAL_MAP[y][x];
        drawTile(ctx, tile, x * TILE_SIZE, y * TILE_SIZE);
      }
      
      const rowEntities = [...npcsRef.current, playerRef.current].filter(e => {
        const ey = Math.floor((e.y + TILE_SIZE - 4) / TILE_SIZE);
        return ey === y;
      });
      rowEntities.forEach(e => {
        if (e.type === 'npc' && !isDialogueOpen) {
          const dx = (e.x + TILE_SIZE / 2) - (playerRef.current.x + TILE_SIZE / 2);
          const dy = (e.y + TILE_SIZE / 2) - (playerRef.current.y + TILE_SIZE / 2);
          const d = Math.hypot(dx, dy);
          if (d < nearestDist) {
            nearestDist = d;
            nearestNpc = e as NPC;
          }
        }
        drawEntity(ctx, e);
      });
    }

    // Interaction prompt above closest NPC within range
    if (nearestNpc && nearestDist < INTERACTION_DISTANCE + 4 && !isDialogueOpen) {
      const px = nearestNpc.x + TILE_SIZE / 2;
      const py = nearestNpc.y - 6;
      ctx.save();
      ctx.translate(px, py);
      ctx.font = '10px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(15,23,42,0.8)';
      ctx.strokeStyle = 'rgba(34,211,238,0.9)';
      ctx.lineWidth = 2;
      const w = 80;
      const h = 26;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h, w, h, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e0f2fe';
      ctx.fillText('FALAR [SPACE]', 0, -8);
      ctx.restore();
    }

    ctx.restore();

    // 2. Vignette / Lighting Overlay
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.height / 3,
      canvas.width / 2, canvas.height / 2, canvas.height
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(15,23,42,0.4)'); // Dark Slate tint
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  }, []);

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
