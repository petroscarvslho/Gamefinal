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
// Interiors_32x32.png: 48 colunas x ~400 linhas
// Coordenadas (x, y) são em tiles, não pixels
// NOTA: Mapeamentos verificados visualmente - adicionar mais conforme teste

export const TILE_SPRITES: Partial<Record<TileType, SpriteMapping>> = {
  // === HOSPITAL - Camas (verificado) ===
  [TileType.BED]: { sheet: 'hospital', x: 0, y: 0 },

  // === INTERIORS - Cadeiras (funcionando!) ===
  [TileType.CHAIR_WAITING]: { sheet: 'interiors', x: 20, y: 30 },

  // TODO: Adicionar mais mapeamentos conforme identificamos no sprite sheet
  // Por enquanto, deixar os outros tiles usarem o fallback canvas
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
