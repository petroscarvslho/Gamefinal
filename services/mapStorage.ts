/**
 * MapStorage - Serviço de salvamento e carregamento de mapas
 */
import { TileType, NPC } from '../types';

export interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileType[][];
  npcs: NPCPlacement[];
  metadata: MapMetadata;
  createdAt: number;
  updatedAt: number;
}

export interface NPCPlacement {
  id: string;
  name: string;
  role: string;
  tileX: number;
  tileY: number;
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  color: string;
  skinColor: string;
  dialoguePrompt: string;
}

export interface MapMetadata {
  author?: string;
  description?: string;
  tags?: string[];
  thumbnail?: string;
}

const STORAGE_KEY = 'mediquest_maps';
const CURRENT_MAP_KEY = 'mediquest_current_map';

class MapStorage {
  /**
   * Salva um mapa
   */
  saveMap(map: MapData): void {
    const maps = this.getAllMaps();
    const existingIndex = maps.findIndex(m => m.id === map.id);

    map.updatedAt = Date.now();

    if (existingIndex >= 0) {
      maps[existingIndex] = map;
    } else {
      map.createdAt = Date.now();
      maps.push(map);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
  }

  /**
   * Carrega um mapa pelo ID
   */
  loadMap(id: string): MapData | null {
    const maps = this.getAllMaps();
    return maps.find(m => m.id === id) || null;
  }

  /**
   * Retorna todos os mapas salvos
   */
  getAllMaps(): MapData[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Deleta um mapa
   */
  deleteMap(id: string): void {
    const maps = this.getAllMaps().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
  }

  /**
   * Exporta um mapa como JSON
   */
  exportMap(map: MapData): string {
    return JSON.stringify(map, null, 2);
  }

  /**
   * Importa um mapa de JSON
   */
  importMap(json: string): MapData | null {
    try {
      const map = JSON.parse(json) as MapData;
      // Gera novo ID para evitar conflitos
      map.id = `map_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      map.createdAt = Date.now();
      map.updatedAt = Date.now();
      return map;
    } catch {
      return null;
    }
  }

  /**
   * Salva o mapa atual em edição
   */
  setCurrentMap(map: MapData | null): void {
    if (map) {
      localStorage.setItem(CURRENT_MAP_KEY, JSON.stringify(map));
    } else {
      localStorage.removeItem(CURRENT_MAP_KEY);
    }
  }

  /**
   * Carrega o mapa atual em edição
   */
  getCurrentMap(): MapData | null {
    try {
      const raw = localStorage.getItem(CURRENT_MAP_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Cria um novo mapa vazio
   */
  createEmptyMap(name: string, width: number = 32, height: number = 24): MapData {
    const tiles: TileType[][] = [];

    for (let y = 0; y < height; y++) {
      const row: TileType[] = [];
      for (let x = 0; x < width; x++) {
        // Borda = parede, interior = chão
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          row.push(TileType.WALL);
        } else {
          row.push(TileType.FLOOR);
        }
      }
      tiles.push(row);
    }

    return {
      id: `map_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      width,
      height,
      tiles,
      npcs: [],
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /**
   * Duplica um mapa existente
   */
  duplicateMap(map: MapData, newName?: string): MapData {
    return {
      ...map,
      id: `map_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: newName || `${map.name} (cópia)`,
      tiles: map.tiles.map(row => [...row]),
      npcs: map.npcs.map(npc => ({ ...npc })),
      metadata: { ...map.metadata },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
}

// Singleton
export const mapStorage = new MapStorage();
export default mapStorage;
