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
// Coordenadas (x, y) são em tiles, não pixels
export const TILE_SPRITES: Partial<Record<TileType, SpriteMapping>> = {
  // === HOSPITAL - Camas (linhas 0-10) ===
  [TileType.BED]: { sheet: 'hospital', x: 0, y: 2 },
  [TileType.OR_TABLE]: { sheet: 'hospital', x: 4, y: 6 },
  [TileType.DELIVERY_BED]: { sheet: 'hospital', x: 0, y: 8 },

  // === HOSPITAL - Equipamentos de Monitorização (linhas 20-30) ===
  [TileType.PATIENT_MONITOR]: { sheet: 'hospital', x: 0, y: 24 },
  [TileType.BIS_MONITOR]: { sheet: 'hospital', x: 2, y: 24 },
  [TileType.FETAL_MONITOR]: { sheet: 'hospital', x: 4, y: 24 },

  // === HOSPITAL - Máquinas Grandes (linhas 30-50) ===
  [TileType.ANESTHESIA_MACHINE]: { sheet: 'hospital', x: 0, y: 32 },
  [TileType.VENTILATOR]: { sheet: 'hospital', x: 4, y: 32 },
  [TileType.DEFIBRILLATOR]: { sheet: 'hospital', x: 8, y: 36 },
  [TileType.MRI_MACHINE]: { sheet: 'hospital', x: 0, y: 44 },
  [TileType.ULTRASOUND]: { sheet: 'hospital', x: 8, y: 44 },

  // === HOSPITAL - Carrinhos e Suportes (linhas 50-60) ===
  [TileType.IV_STAND]: { sheet: 'hospital', x: 0, y: 52 },
  [TileType.DRUG_CART]: { sheet: 'hospital', x: 4, y: 52 },
  [TileType.CRASH_CART]: { sheet: 'hospital', x: 8, y: 52 },
  [TileType.INTUBATION_CART]: { sheet: 'hospital', x: 12, y: 52 },
  [TileType.INSTRUMENT_TABLE]: { sheet: 'hospital', x: 0, y: 56 },
  [TileType.BACK_TABLE]: { sheet: 'hospital', x: 4, y: 56 },

  // === HOSPITAL - Equipamentos Cirúrgicos (linhas 60-75) ===
  [TileType.C_ARM]: { sheet: 'hospital', x: 0, y: 64 },
  [TileType.SURGICAL_MICROSCOPE]: { sheet: 'hospital', x: 8, y: 64 },
  [TileType.OPERATING_MICROSCOPE]: { sheet: 'hospital', x: 12, y: 64 },
  [TileType.LAPAROSCOPY_TOWER]: { sheet: 'hospital', x: 0, y: 68 },
  [TileType.ARTHROSCOPY_TOWER]: { sheet: 'hospital', x: 4, y: 68 },
  [TileType.CYSTOSCOPY_TOWER]: { sheet: 'hospital', x: 8, y: 68 },
  [TileType.ELECTROSURGICAL_UNIT]: { sheet: 'hospital', x: 12, y: 68 },

  // === HOSPITAL - Cardíaca/Especialidades (linhas 75-85) ===
  [TileType.CEC_MACHINE]: { sheet: 'hospital', x: 0, y: 76 },
  [TileType.IABP]: { sheet: 'hospital', x: 4, y: 76 },
  [TileType.CELL_SAVER]: { sheet: 'hospital', x: 8, y: 76 },
  [TileType.NEURO_NAVIGATION]: { sheet: 'hospital', x: 0, y: 80 },
  [TileType.PHACO_MACHINE]: { sheet: 'hospital', x: 4, y: 80 },
  [TileType.LITHOTRIPSY]: { sheet: 'hospital', x: 8, y: 80 },
  [TileType.TRACTION_TABLE]: { sheet: 'hospital', x: 12, y: 80 },

  // === HOSPITAL - Neonatal/Aquecimento (linhas 85-95) ===
  [TileType.WARMER]: { sheet: 'hospital', x: 0, y: 88 },
  [TileType.INFANT_WARMER]: { sheet: 'hospital', x: 4, y: 88 },
  [TileType.WHEELCHAIR]: { sheet: 'hospital', x: 12, y: 88 },

  // === HOSPITAL - Mobiliário (linhas 95-110) ===
  [TileType.CABINET]: { sheet: 'hospital', x: 0, y: 96 },
  [TileType.LOCKERS]: { sheet: 'hospital', x: 4, y: 96 },
  [TileType.REFRIGERATOR]: { sheet: 'hospital', x: 8, y: 96 },
  [TileType.SINK]: { sheet: 'hospital', x: 12, y: 100 },

  // === INTERIORS - Móveis Gerais ===
  [TileType.DESK_RECEPTION]: { sheet: 'interiors', x: 0, y: 48 },
  [TileType.COMPUTER_DESK]: { sheet: 'interiors', x: 8, y: 48 },
  [TileType.CHAIR_WAITING]: { sheet: 'interiors', x: 0, y: 80 },
  [TileType.SOFA]: { sheet: 'interiors', x: 0, y: 96 },
  [TileType.DINING_TABLE]: { sheet: 'interiors', x: 0, y: 120 },

  // === INTERIORS - Decoração ===
  [TileType.PLANT]: { sheet: 'interiors', x: 0, y: 160 },
  [TileType.VENDING_MACHINE]: { sheet: 'interiors', x: 8, y: 200 },
};

// Classe para gerenciar carregamento e renderização de sprites
class TilesetManager {
  private images: Map<string, HTMLImageElement> = new Map();
  private loadPromises: Map<string, Promise<HTMLImageElement>> = new Map();
  public isLoaded = false;

  // Carrega todos os sprite sheets
  async loadAll(): Promise<void> {
    const promises = Object.entries(SPRITE_SHEETS).map(([key, path]) =>
      this.loadImage(key, path)
    );
    await Promise.all(promises);
    this.isLoaded = true;
    console.log('TilesetManager: Todos os sprite sheets carregados!');
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
    const mapping = TILE_SPRITES[tileType];
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
    return TILE_SPRITES[tileType] !== undefined;
  }
}

// Singleton
export const tilesetManager = new TilesetManager();
