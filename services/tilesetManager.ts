/**
 * TilesetManager - Gerencia sprites do LimeZu
 * Mapeia TileTypes para coordenadas nos sprite sheets
 */

import { TileType } from '../types';

// Tamanho de cada tile
export const SPRITE_SIZE = 32;

// Sprite sheets disponíveis
export const SPRITE_SHEETS = {
  hospital: '/assets/limezu/interiors/Hospital_32x32.png',
  interiors: '/assets/limezu/interiors/Interiors_32x32.png',
  roomBuilder: '/assets/limezu/interiors/Room_Builder_32x32.png',
  generic: '/assets/limezu/interiors/Generic_32x32.png',
  bathroom: '/assets/limezu/interiors/Bathroom_32x32.png',
  // Sprite sheets separados para facilitar mapeamento
  floors: '/assets/limezu/interiors/Room_Builder_Floors_32x32.png',
  walls: '/assets/limezu/interiors/Room_Builder_Walls_32x32.png',
};

// Interface para mapeamento de sprite
export interface SpriteMapping {
  sheet: keyof typeof SPRITE_SHEETS;
  x: number; // coluna no sprite sheet
  y: number; // linha no sprite sheet
  width?: number; // largura em tiles (default 1)
  height?: number; // altura em tiles (default 1)
}

// Mapeamento de TileType para coordenadas no sprite sheet
// Hospital_32x32.png: 16 colunas x 110 linhas (512x3520 pixels)
// Interiors_32x32.png: 48 colunas x ~400 linhas
// Coordenadas (x, y) são em tiles, não pixels
// NOTA: Mapeamentos verificados visualmente - adicionar mais conforme teste

export const TILE_SPRITES: Partial<Record<TileType, SpriteMapping>> = {
  // === HOSPITAL 32x32 (512x3520 = 16 cols x 110 rows) ===
  // Mapeamentos revisados baseados em análise visual do sprite sheet

  // --- CAMAS (topo do sprite sheet) ---
  [TileType.BED]: { sheet: 'hospital', x: 1, y: 1 }, // Cama hospital azul
  [TileType.OR_TABLE]: { sheet: 'hospital', x: 1, y: 9 }, // Mesa cirúrgica
  [TileType.DELIVERY_BED]: { sheet: 'hospital', x: 9, y: 9 }, // Cama parto
  [TileType.STRETCHER]: { sheet: 'hospital', x: 1, y: 5 }, // Maca/stretcher

  // --- MONITORES E EQUIPAMENTOS ELETRÔNICOS ---
  [TileType.PATIENT_MONITOR]: { sheet: 'hospital', x: 1, y: 25 }, // Monitor
  [TileType.BIS_MONITOR]: { sheet: 'hospital', x: 3, y: 25 }, // Monitor BIS
  [TileType.FETAL_MONITOR]: { sheet: 'hospital', x: 5, y: 25 }, // Monitor fetal

  // --- EQUIPAMENTOS ANESTESIA ---
  [TileType.ANESTHESIA_MACHINE]: { sheet: 'hospital', x: 1, y: 29 }, // Máquina anestesia
  [TileType.VENTILATOR]: { sheet: 'hospital', x: 5, y: 29 }, // Ventilador
  [TileType.DEFIBRILLATOR]: { sheet: 'hospital', x: 9, y: 29 }, // Desfibrilador
  [TileType.IV_STAND]: { sheet: 'hospital', x: 1, y: 33 }, // Suporte soro
  [TileType.DRUG_CART]: { sheet: 'hospital', x: 1, y: 17 }, // Carrinho medicamentos
  [TileType.CRASH_CART]: { sheet: 'hospital', x: 5, y: 17 }, // Crash cart
  [TileType.INTUBATION_CART]: { sheet: 'hospital', x: 9, y: 17 }, // Carrinho intubação
  [TileType.OXYGEN_TANK]: { sheet: 'hospital', x: 13, y: 33 }, // Cilindro O2
  [TileType.SYRINGE_PUMP]: { sheet: 'hospital', x: 3, y: 33 }, // Bomba seringa

  // --- EQUIPAMENTOS CIRÚRGICOS ---
  [TileType.INSTRUMENT_TABLE]: { sheet: 'hospital', x: 1, y: 37 }, // Mesa instrumentos
  [TileType.BACK_TABLE]: { sheet: 'hospital', x: 5, y: 37 }, // Mesa apoio
  [TileType.MAYO_STAND]: { sheet: 'hospital', x: 9, y: 37 }, // Mesa Mayo
  [TileType.SURGICAL_LIGHT]: { sheet: 'hospital', x: 13, y: 37 }, // Foco cirúrgico
  [TileType.SUCTION_MACHINE]: { sheet: 'hospital', x: 1, y: 41 }, // Aspirador

  // --- DIAGNÓSTICO ---
  [TileType.MRI_MACHINE]: { sheet: 'hospital', x: 1, y: 13 }, // Ressonância (grande)
  [TileType.ULTRASOUND]: { sheet: 'hospital', x: 9, y: 41 }, // Ultrassom
  [TileType.C_ARM]: { sheet: 'hospital', x: 5, y: 13 }, // Arco em C

  // --- ESPECIALIDADES ---
  [TileType.CEC_MACHINE]: { sheet: 'hospital', x: 1, y: 45 }, // Máquina CEC
  [TileType.IABP]: { sheet: 'hospital', x: 5, y: 45 }, // Balão intra-aórtico
  [TileType.CELL_SAVER]: { sheet: 'hospital', x: 9, y: 45 }, // Cell saver
  [TileType.INFANT_WARMER]: { sheet: 'hospital', x: 1, y: 49 }, // Berço aquecido
  [TileType.WARMER]: { sheet: 'hospital', x: 5, y: 49 }, // Aquecedor

  // --- MOBÍLIA ---
  [TileType.CABINET]: { sheet: 'hospital', x: 1, y: 21 }, // Armário
  [TileType.LOCKERS]: { sheet: 'hospital', x: 5, y: 21 }, // Lockers
  [TileType.REFRIGERATOR]: { sheet: 'hospital', x: 9, y: 21 }, // Geladeira
  [TileType.SINK]: { sheet: 'hospital', x: 1, y: 53 }, // Pia
  [TileType.DESK_RECEPTION]: { sheet: 'hospital', x: 1, y: 57 }, // Balcão recepção
  [TileType.COMPUTER_DESK]: { sheet: 'hospital', x: 5, y: 57 }, // Mesa computador
  [TileType.SOFA]: { sheet: 'hospital', x: 9, y: 57 }, // Sofá
  [TileType.DINING_TABLE]: { sheet: 'hospital', x: 13, y: 57 }, // Mesa

  // --- CADEIRAS ---
  [TileType.CHAIR_WAITING]: { sheet: 'hospital', x: 1, y: 61 }, // Cadeira espera
  [TileType.WHEELCHAIR]: { sheet: 'hospital', x: 5, y: 61 }, // Cadeira de rodas

  // --- DECORAÇÃO ---
  [TileType.PLANT]: { sheet: 'hospital', x: 1, y: 65 }, // Planta
  [TileType.VENDING_MACHINE]: { sheet: 'hospital', x: 5, y: 65 }, // Máquina vendas

  // === ESTRUTURA DO HOSPITAL ===
  // floors: 15 cols x 40 rows (480x1280px)
  // walls: 32 cols x 40 rows (1024x1280px)
  // roomBuilder: 76 cols x 113 rows (2432x3616px)

  // --- PISOS ---
  // Piso CINZA para hospital - linha 33 (pisos neutros)
  [TileType.FLOOR]: { sheet: 'floors', x: 1, y: 33 },

  // Piso para sala cirúrgica - linha 35 (variação)
  [TileType.FLOOR_OR]: { sheet: 'floors', x: 1, y: 35 },

  // --- PAREDES ---
  // Parede clara para hospital (y:0 = mais clara)
  [TileType.WALL]: { sheet: 'walls', x: 0, y: 0 },

  // --- PORTAS ---
  // Porta cinza do Room_Builder (área de portas na parte inferior)
  // roomBuilder: 76 cols x 113 rows - portas começam ~y:85, porta cinza ~x:47
  [TileType.DOOR]: { sheet: 'roomBuilder', x: 47, y: 86 },
};

// Classe para gerenciar carregamento e renderização de sprites
class TilesetManager {
  private images: Map<string, HTMLImageElement> = new Map();
  private loadPromises: Map<string, Promise<HTMLImageElement>> = new Map();
  private customMappings: Partial<Record<TileType, SpriteMapping>> = {};
  public isLoaded = false;

  // Carrega todos os sprite sheets
  async loadAll(): Promise<void> {
    const promises = Object.entries(SPRITE_SHEETS).map(([key, path]) =>
      this.loadImage(key, path).catch(() => null)
    );
    await Promise.all(promises);
    this.loadCustomMappings();
    this.isLoaded = true;
    console.log('TilesetManager: Todos os sprite sheets carregados!');
  }

  // Carrega mapeamentos customizados do localStorage (salvos pelo TilePicker)
  loadCustomMappings(): void {
    try {
      const saved = localStorage.getItem('tilePicker_mappings');
      if (saved) {
        this.customMappings = JSON.parse(saved);
        console.log(`TilesetManager: ${Object.keys(this.customMappings).length} mapeamentos customizados carregados`);
      }
    } catch (e) {
      console.warn('TilesetManager: Erro ao carregar mapeamentos customizados', e);
    }
  }

  // Atualiza mapeamentos (chamado pelo TilePicker)
  updateMappings(mappings: Partial<Record<TileType, SpriteMapping>>): void {
    this.customMappings = { ...this.customMappings, ...mappings };
  }

  // Carrega uma imagem
  private loadImage(key: string, path: string): Promise<HTMLImageElement> {
    if (this.loadPromises.has(key)) {
      return this.loadPromises.get(key)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        console.log(`TilesetManager: Carregado ${key} (${img.width}x${img.height})`);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`TilesetManager: Falha ao carregar ${path}`);
        reject(new Error(`Failed to load ${path}`));
      };
      img.src = path;
    });

    this.loadPromises.set(key, promise);
    return promise;
  }

  // Obtém a imagem de um sprite sheet
  getImage(sheet: keyof typeof SPRITE_SHEETS): HTMLImageElement | undefined {
    return this.images.get(sheet);
  }

  // Renderiza um tile no canvas
  drawTile(
    ctx: CanvasRenderingContext2D,
    tileType: TileType,
    destX: number,
    destY: number,
    scale: number = 1
  ): boolean {
    // Prioridade: customMappings (TilePicker) > TILE_SPRITES (hardcoded)
    const mapping = this.customMappings[tileType] || TILE_SPRITES[tileType];
    if (!mapping) return false;

    const img = this.images.get(mapping.sheet);
    if (!img) return false;

    const srcX = mapping.x * SPRITE_SIZE;
    const srcY = mapping.y * SPRITE_SIZE;
    const srcW = (mapping.width || 1) * SPRITE_SIZE;
    const srcH = (mapping.height || 1) * SPRITE_SIZE;
    const destW = srcW * scale;
    const destH = srcH * scale;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
    return true;
  }

  // Verifica se um tile tem sprite mapeado
  hasSprite(tileType: TileType): boolean {
    return this.customMappings[tileType] !== undefined || TILE_SPRITES[tileType] !== undefined;
  }
}

// Singleton
export const tilesetManager = new TilesetManager();
