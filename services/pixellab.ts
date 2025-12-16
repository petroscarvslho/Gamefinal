/**
 * PixelLab API Service - Integração para geração de pixel art com IA
 * Documentação: https://api.pixellab.ai/v1/docs
 */

const PIXELLAB_API_URL = 'https://api.pixellab.ai/v1';

// Chave da API (pode ser sobrescrita via .env.local)
const getApiKey = (): string => {
  return (import.meta as any).env?.VITE_PIXELLAB_API_KEY ||
         (import.meta as any).env?.PIXELLAB_API_KEY ||
         '';
};

// Tipos
export interface ImageSize {
  width: number;
  height: number;
}

export interface SkeletonKeypoint {
  x: number;
  y: number;
}

export interface SkeletonKeypoints {
  head: SkeletonKeypoint;
  neck: SkeletonKeypoint;
  right_shoulder?: SkeletonKeypoint;
  right_elbow?: SkeletonKeypoint;
  right_hand?: SkeletonKeypoint;
  left_shoulder?: SkeletonKeypoint;
  left_elbow?: SkeletonKeypoint;
  left_hand?: SkeletonKeypoint;
  hip: SkeletonKeypoint;
  right_knee?: SkeletonKeypoint;
  right_foot?: SkeletonKeypoint;
  left_knee?: SkeletonKeypoint;
  left_foot?: SkeletonKeypoint;
}

export type Direction = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest';
export type View = 'side' | 'low top-down' | 'high top-down';

export interface GenerateImageOptions {
  description: string;
  imageSize?: ImageSize;
  textGuidanceScale?: number; // 1.0-20.0
  initImage?: string; // base64
  colorImage?: string; // base64 para paleta de cores
  noBackground?: boolean;
}

export interface AnimateOptions {
  referenceImage: string; // base64
  action: string; // ex: "walk", "run", "idle"
  description?: string;
  nFrames?: number; // 2-20
  view?: View;
  direction?: Direction;
}

export interface RotateOptions {
  fromImage: string; // base64
  fromDirection: Direction;
  toDirection: Direction;
  fromView?: View;
  toView?: View;
}

export interface PixelLabResponse {
  image?: string; // base64
  images?: string[]; // para animações (múltiplos frames)
  credits_used?: number;
  error?: string;
}

class PixelLabService {
  private apiKey: string;

  constructor() {
    this.apiKey = getApiKey();
  }

  /**
   * Define a API key manualmente
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Verifica se a API está configurada
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Faz requisição para a API
   */
  private async request(endpoint: string, body: object): Promise<PixelLabResponse> {
    if (!this.apiKey) {
      return { error: 'API key não configurada. Configure VITE_PIXELLAB_API_KEY no .env.local' };
    }

    try {
      const response = await fetch(`${PIXELLAB_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          return { error: 'API key inválida' };
        }
        if (response.status === 402) {
          return { error: 'Créditos insuficientes' };
        }
        return { error: errorData.detail || `Erro ${response.status}` };
      }

      return await response.json();
    } catch (error) {
      return { error: `Erro de conexão: ${error}` };
    }
  }

  /**
   * Gera uma imagem pixel art a partir de descrição
   */
  async generateImage(options: GenerateImageOptions): Promise<PixelLabResponse> {
    const body: any = {
      description: options.description,
      image_size: options.imageSize || { width: 32, height: 32 },
      text_guidance_scale: options.textGuidanceScale || 8.0,
      no_background: options.noBackground ?? true,
    };

    if (options.initImage) {
      body.init_image = { type: 'base64', base64: options.initImage };
    }
    if (options.colorImage) {
      body.color_image = { type: 'base64', base64: options.colorImage };
    }

    return this.request('/generate-image-pixflux', body);
  }

  /**
   * Gera um personagem para jogo RPG
   */
  async generateCharacter(
    description: string,
    size: number = 32,
    style: 'rpg' | 'chibi' | 'realistic' = 'rpg'
  ): Promise<PixelLabResponse> {
    const stylePrompts = {
      rpg: 'pixel art RPG character sprite, 16-bit SNES style, top-down view',
      chibi: 'pixel art chibi character sprite, cute proportions, top-down view',
      realistic: 'pixel art character sprite, detailed, top-down view',
    };

    return this.generateImage({
      description: `${stylePrompts[style]}, ${description}`,
      imageSize: { width: size, height: size },
      noBackground: true,
    });
  }

  /**
   * Gera animação de um personagem
   */
  async animateCharacter(options: AnimateOptions): Promise<PixelLabResponse> {
    const body: any = {
      reference_image: { type: 'base64', base64: options.referenceImage },
      action: options.action,
      n_frames: options.nFrames || 4,
      view: options.view || 'high top-down',
      direction: options.direction || 'south',
    };

    if (options.description) {
      body.description = options.description;
    }

    return this.request('/animate-with-text', body);
  }

  /**
   * Rotaciona um sprite para outra direção
   */
  async rotateSprite(options: RotateOptions): Promise<PixelLabResponse> {
    const body: any = {
      from_image: { type: 'base64', base64: options.fromImage },
      from_direction: options.fromDirection,
      to_direction: options.toDirection,
    };

    if (options.fromView) body.from_view = options.fromView;
    if (options.toView) body.to_view = options.toView;

    return this.request('/rotate', body);
  }

  /**
   * Gera todas as 4 direções de um personagem
   */
  async generateAllDirections(
    baseImage: string,
    baseDirection: Direction = 'south'
  ): Promise<{ [key in Direction]?: string }> {
    const directions: Direction[] = ['north', 'east', 'south', 'west'];
    const results: { [key in Direction]?: string } = {};

    results[baseDirection] = baseImage;

    for (const dir of directions) {
      if (dir === baseDirection) continue;

      const response = await this.rotateSprite({
        fromImage: baseImage,
        fromDirection: baseDirection,
        toDirection: dir,
      });

      if (response.image) {
        results[dir] = response.image;
      }
    }

    return results;
  }

  /**
   * Gera um tileset para hospital
   */
  async generateHospitalTile(
    tileType: 'floor' | 'wall' | 'bed' | 'desk' | 'chair' | 'equipment',
    size: number = 32
  ): Promise<PixelLabResponse> {
    const prompts = {
      floor: 'hospital floor tile, clean white tiles, top-down view, pixel art, seamless',
      wall: 'hospital wall tile, white with blue trim, top-down view, pixel art',
      bed: 'hospital bed, white sheets, blue blanket, top-down view, pixel art sprite',
      desk: 'hospital reception desk, wood and white, top-down view, pixel art sprite',
      chair: 'waiting room chair, blue cushion, metal legs, top-down view, pixel art sprite',
      equipment: 'medical equipment, MRI machine, top-down view, pixel art sprite',
    };

    return this.generateImage({
      description: prompts[tileType],
      imageSize: { width: size, height: size },
      noBackground: tileType !== 'floor' && tileType !== 'wall',
    });
  }

  /**
   * Gera NPC médico
   */
  async generateMedicalNPC(
    role: 'doctor' | 'nurse' | 'patient' | 'receptionist',
    customDescription?: string
  ): Promise<PixelLabResponse> {
    const rolePrompts = {
      doctor: 'male doctor in white coat, stethoscope, professional, standing',
      nurse: 'female nurse in scrubs, caring expression, standing',
      patient: 'hospital patient in gown, sitting or standing',
      receptionist: 'hospital receptionist, professional attire, friendly',
    };

    const description = customDescription || rolePrompts[role];

    return this.generateCharacter(
      `${description}, hospital setting`,
      32,
      'rpg'
    );
  }

  /**
   * Verifica o saldo da conta
   */
  async getBalance(): Promise<{ balance?: number; error?: string }> {
    if (!this.apiKey) {
      return { error: 'API key não configurada' };
    }

    try {
      const response = await fetch(`${PIXELLAB_API_URL}/balance`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return { error: `Erro ${response.status}` };
      }

      const data = await response.json();
      return { balance: data.balance };
    } catch (error) {
      return { error: `Erro de conexão: ${error}` };
    }
  }
}

// Singleton
export const pixelLabService = new PixelLabService();
export default pixelLabService;
