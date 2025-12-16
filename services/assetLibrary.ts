/**
 * Asset Library - Biblioteca de assets para o jogo
 * Cache local + Geração via PixelLab
 */

import { TileType } from '../types';
import { pixelLabService } from './pixellab';

// Categoria de assets
export type AssetCategory =
  | 'structure'      // Paredes, pisos, portas
  | 'furniture'      // Móveis gerais
  | 'medical'        // Equipamentos médicos
  | 'surgical'       // Equipamentos cirúrgicos
  | 'decoration'     // Plantas, quadros
  | 'character';     // NPCs, pacientes

// Asset individual
export interface GameAsset {
  id: string;
  name: string;
  nameEn: string;           // Para prompts em inglês
  category: AssetCategory;
  tileType?: TileType;      // Tipo de tile correspondente
  icon: string;             // Emoji ou URL de imagem
  sprite?: string;          // Base64 do sprite gerado
  spriteUrl?: string;       // URL do sprite
  description: string;
  tags: string[];
  size: { width: number; height: number };
  isGenerated: boolean;     // Se foi gerado por IA
}

// Biblioteca base de assets pré-definidos
export const BASE_ASSETS: GameAsset[] = [
  // === ESTRUTURA ===
  {
    id: 'floor_hospital',
    name: 'Piso Hospital',
    nameEn: 'hospital floor tile',
    category: 'structure',
    tileType: TileType.FLOOR,
    icon: '⬜',
    description: 'Piso branco de hospital',
    tags: ['floor', 'hospital', 'white'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },
  {
    id: 'floor_or',
    name: 'Piso Centro Cirúrgico',
    nameEn: 'sterile operating room floor',
    category: 'structure',
    tileType: TileType.FLOOR_OR,
    icon: '🟦',
    description: 'Piso estéril do centro cirúrgico',
    tags: ['floor', 'surgical', 'sterile', 'blue'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },
  {
    id: 'wall',
    name: 'Parede',
    nameEn: 'hospital wall',
    category: 'structure',
    tileType: TileType.WALL,
    icon: '🧱',
    description: 'Parede de hospital',
    tags: ['wall', 'structure'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },
  {
    id: 'door',
    name: 'Porta',
    nameEn: 'hospital door',
    category: 'structure',
    tileType: TileType.DOOR,
    icon: '🚪',
    description: 'Porta de hospital',
    tags: ['door', 'entrance'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },

  // === MÓVEIS ===
  {
    id: 'bed',
    name: 'Cama Hospital',
    nameEn: 'hospital bed with white sheets',
    category: 'furniture',
    tileType: TileType.BED,
    icon: '🛏️',
    description: 'Cama de hospital com lençóis brancos',
    tags: ['bed', 'furniture', 'patient'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },
  {
    id: 'chair',
    name: 'Cadeira Espera',
    nameEn: 'waiting room chair blue',
    category: 'furniture',
    tileType: TileType.CHAIR_WAITING,
    icon: '🪑',
    description: 'Cadeira da sala de espera',
    tags: ['chair', 'waiting', 'furniture'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },
  {
    id: 'desk_reception',
    name: 'Balcão Recepção',
    nameEn: 'hospital reception desk',
    category: 'furniture',
    tileType: TileType.DESK_RECEPTION,
    icon: '🗄️',
    description: 'Balcão da recepção',
    tags: ['desk', 'reception', 'furniture'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },
  {
    id: 'computer_desk',
    name: 'Mesa com Computador',
    nameEn: 'desk with computer monitor',
    category: 'furniture',
    tileType: TileType.COMPUTER_DESK,
    icon: '🖥️',
    description: 'Mesa com computador',
    tags: ['desk', 'computer', 'furniture'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },
  {
    id: 'cabinet',
    name: 'Armário',
    nameEn: 'medical cabinet storage',
    category: 'furniture',
    tileType: TileType.CABINET,
    icon: '🗃️',
    description: 'Armário de medicamentos',
    tags: ['cabinet', 'storage', 'furniture'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },

  // === EQUIPAMENTOS MÉDICOS ===
  {
    id: 'mri',
    name: 'Máquina MRI',
    nameEn: 'MRI machine scanner',
    category: 'medical',
    tileType: TileType.MRI_MACHINE,
    icon: '🔬',
    description: 'Máquina de ressonância magnética',
    tags: ['mri', 'scanner', 'diagnostic', 'equipment'],
    size: { width: 64, height: 64 },
    isGenerated: false,
  },
  {
    id: 'sink',
    name: 'Pia Cirúrgica',
    nameEn: 'surgical scrub sink',
    category: 'medical',
    tileType: TileType.SINK,
    icon: '🚰',
    description: 'Pia para lavagem das mãos',
    tags: ['sink', 'wash', 'surgical'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },
  {
    id: 'or_table',
    name: 'Mesa Cirúrgica',
    nameEn: 'operating room surgical table',
    category: 'surgical',
    tileType: TileType.OR_TABLE,
    icon: '🏥',
    description: 'Mesa de operação',
    tags: ['table', 'surgical', 'operation'],
    size: { width: 64, height: 32 },
    isGenerated: false,
  },
  {
    id: 'vending',
    name: 'Máquina Venda',
    nameEn: 'vending machine red',
    category: 'furniture',
    tileType: TileType.VENDING_MACHINE,
    icon: '🎰',
    description: 'Máquina de vendas',
    tags: ['vending', 'machine', 'snacks'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },

  // === DECORAÇÃO ===
  {
    id: 'plant',
    name: 'Planta',
    nameEn: 'potted plant green',
    category: 'decoration',
    tileType: TileType.PLANT,
    icon: '🪴',
    description: 'Planta decorativa',
    tags: ['plant', 'decoration', 'green'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },

  // === EQUIPAMENTOS CIRÚRGICOS (Para expansão futura) ===
  {
    id: 'iv_stand',
    name: 'Suporte de Soro',
    nameEn: 'IV drip stand medical',
    category: 'surgical',
    icon: '💉',
    description: 'Suporte para soro/medicamentos IV',
    tags: ['iv', 'drip', 'surgical', 'equipment'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },
  {
    id: 'monitor_vital',
    name: 'Monitor Sinais Vitais',
    nameEn: 'vital signs monitor medical',
    category: 'surgical',
    icon: '📟',
    description: 'Monitor de sinais vitais',
    tags: ['monitor', 'vital', 'equipment'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },
  {
    id: 'defibrillator',
    name: 'Desfibrilador',
    nameEn: 'defibrillator medical equipment',
    category: 'surgical',
    icon: '⚡',
    description: 'Desfibrilador para emergências',
    tags: ['defibrillator', 'emergency', 'equipment'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },
  {
    id: 'surgical_light',
    name: 'Foco Cirúrgico',
    nameEn: 'surgical light operating room',
    category: 'surgical',
    icon: '💡',
    description: 'Luz cirúrgica de alta intensidade',
    tags: ['light', 'surgical', 'equipment'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },
  {
    id: 'anesthesia_machine',
    name: 'Máquina Anestesia',
    nameEn: 'anesthesia machine medical',
    category: 'surgical',
    icon: '😴',
    description: 'Máquina de anestesia',
    tags: ['anesthesia', 'surgical', 'equipment'],
    size: { width: 32, height: 64 },
    isGenerated: false,
  },
  {
    id: 'surgical_tray',
    name: 'Mesa Instrumentos',
    nameEn: 'surgical instrument tray table',
    category: 'surgical',
    icon: '🔧',
    description: 'Mesa com instrumentos cirúrgicos',
    tags: ['instruments', 'tray', 'surgical'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },
  {
    id: 'wheelchair',
    name: 'Cadeira de Rodas',
    nameEn: 'wheelchair hospital',
    category: 'medical',
    icon: '🦽',
    description: 'Cadeira de rodas para pacientes',
    tags: ['wheelchair', 'transport', 'patient'],
    size: { width: 32, height: 32 },
    isGenerated: false,
  },
  {
    id: 'stretcher',
    name: 'Maca',
    nameEn: 'hospital stretcher gurney',
    category: 'medical',
    icon: '🛗',
    description: 'Maca para transporte de pacientes',
    tags: ['stretcher', 'gurney', 'transport'],
    size: { width: 64, height: 32 },
    isGenerated: false,
  },
];

// Chave para localStorage
const CACHE_KEY = 'mediquest_asset_cache';
const GENERATED_KEY = 'mediquest_generated_assets';

class AssetLibrary {
  private assets: Map<string, GameAsset> = new Map();
  private spriteCache: Map<string, string> = new Map(); // id -> base64

  constructor() {
    this.loadBaseAssets();
    this.loadCache();
  }

  private loadBaseAssets(): void {
    BASE_ASSETS.forEach(asset => {
      this.assets.set(asset.id, asset);
    });
  }

  private loadCache(): void {
    try {
      // Carrega sprites cacheados
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        Object.entries(data).forEach(([id, sprite]) => {
          this.spriteCache.set(id, sprite as string);
          // Atualiza o asset com o sprite cacheado
          const asset = this.assets.get(id);
          if (asset) {
            asset.sprite = sprite as string;
            asset.isGenerated = true;
          }
        });
      }

      // Carrega assets gerados pelo usuário
      const generated = localStorage.getItem(GENERATED_KEY);
      if (generated) {
        const data = JSON.parse(generated) as GameAsset[];
        data.forEach(asset => {
          this.assets.set(asset.id, asset);
        });
      }
    } catch (e) {
      console.warn('Erro ao carregar cache de assets', e);
    }
  }

  private saveCache(): void {
    try {
      const cacheObj: Record<string, string> = {};
      this.spriteCache.forEach((sprite, id) => {
        cacheObj[id] = sprite;
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
    } catch (e) {
      console.warn('Erro ao salvar cache', e);
    }
  }

  private saveGeneratedAssets(): void {
    try {
      const generated = Array.from(this.assets.values()).filter(a =>
        !BASE_ASSETS.find(b => b.id === a.id)
      );
      localStorage.setItem(GENERATED_KEY, JSON.stringify(generated));
    } catch (e) {
      console.warn('Erro ao salvar assets gerados', e);
    }
  }

  /**
   * Retorna todos os assets
   */
  getAllAssets(): GameAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Retorna assets por categoria
   */
  getByCategory(category: AssetCategory): GameAsset[] {
    return this.getAllAssets().filter(a => a.category === category);
  }

  /**
   * Retorna asset por ID
   */
  getAsset(id: string): GameAsset | undefined {
    return this.assets.get(id);
  }

  /**
   * Retorna asset por TileType
   */
  getByTileType(tileType: TileType): GameAsset | undefined {
    return this.getAllAssets().find(a => a.tileType === tileType);
  }

  /**
   * Busca assets por tag
   */
  searchByTag(tag: string): GameAsset[] {
    const lower = tag.toLowerCase();
    return this.getAllAssets().filter(a =>
      a.tags.some(t => t.toLowerCase().includes(lower)) ||
      a.name.toLowerCase().includes(lower)
    );
  }

  /**
   * Verifica se tem sprite gerado
   */
  hasSprite(id: string): boolean {
    return this.spriteCache.has(id);
  }

  /**
   * Retorna sprite cacheado
   */
  getSprite(id: string): string | undefined {
    return this.spriteCache.get(id);
  }

  /**
   * Gera sprite para um asset usando PixelLab
   */
  async generateSprite(id: string): Promise<{ success: boolean; error?: string }> {
    const asset = this.assets.get(id);
    if (!asset) {
      return { success: false, error: 'Asset não encontrado' };
    }

    if (!pixelLabService.isConfigured()) {
      return { success: false, error: 'PixelLab API não configurada' };
    }

    const prompt = `pixel art ${asset.nameEn}, 32x32, top-down RPG view, game sprite, clean pixels, ${asset.tags.join(', ')}`;

    const result = await pixelLabService.generateImage({
      description: prompt,
      imageSize: { width: asset.size.width, height: asset.size.height },
      noBackground: true,
    });

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.image) {
      this.spriteCache.set(id, result.image);
      asset.sprite = result.image;
      asset.isGenerated = true;
      this.saveCache();
      return { success: true };
    }

    return { success: false, error: 'Sem imagem retornada' };
  }

  /**
   * Adiciona um novo asset customizado
   */
  addCustomAsset(asset: Omit<GameAsset, 'id'>): GameAsset {
    const id = `custom_${Date.now()}`;
    const newAsset: GameAsset = {
      ...asset,
      id,
      isGenerated: !!asset.sprite,
    };
    this.assets.set(id, newAsset);
    this.saveGeneratedAssets();
    return newAsset;
  }

  /**
   * Remove asset customizado
   */
  removeAsset(id: string): boolean {
    if (BASE_ASSETS.find(a => a.id === id)) {
      return false; // Não pode remover assets base
    }
    this.assets.delete(id);
    this.spriteCache.delete(id);
    this.saveGeneratedAssets();
    this.saveCache();
    return true;
  }

  /**
   * Limpa cache de sprites
   */
  clearCache(): void {
    this.spriteCache.clear();
    this.assets.forEach(asset => {
      asset.sprite = undefined;
      asset.isGenerated = false;
    });
    localStorage.removeItem(CACHE_KEY);
  }

  /**
   * Estatísticas
   */
  getStats(): { total: number; generated: number; cached: number } {
    return {
      total: this.assets.size,
      generated: Array.from(this.assets.values()).filter(a => a.isGenerated).length,
      cached: this.spriteCache.size,
    };
  }
}

export const assetLibrary = new AssetLibrary();
export default assetLibrary;
