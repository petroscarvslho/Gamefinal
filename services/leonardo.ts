/**
 * Leonardo.ai API Service - Geração de sprites e assets para jogos
 * Documentação: https://docs.leonardo.ai/
 */

const LEONARDO_API_URL = 'https://cloud.leonardo.ai/api/rest/v1';

const getApiKey = (): string => {
  return (import.meta as any).env?.VITE_LEONARDO_API_KEY || '';
};

// Modelos otimizados para pixel art e jogos
export const LEONARDO_MODELS = {
  pixelArt: {
    id: 'a097c2df-8f0c-4029-ae0f-8fd349055e61', // Pixel Art model
    name: 'Pixel Art',
  },
  gameAssets: {
    id: '5c232a9e-9061-4777-980a-ddc8e65647c6', // RPG style
    name: 'RPG 4.0',
  },
  characterDesign: {
    id: 'e316348f-7773-490e-adcd-46757c738eb7', // Character focused
    name: 'Character Design',
  },
  anime: {
    id: '1aa0f478-51be-4f6f-bd72-9e1e3d0e5a1e', // Anime style
    name: 'Anime Style',
  },
};

export interface LeonardoGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  modelId?: string;
  width?: number;
  height?: number;
  numImages?: number;
  guidanceScale?: number;
  scheduler?: 'EULER' | 'EULER_ANCESTRAL' | 'DPM_SOLVER' | 'PNDM';
  presetStyle?: 'NONE' | 'ANIME' | 'CINEMATIC' | 'CREATIVE' | 'DYNAMIC' | 'ENVIRONMENT' | 'GENERAL' | 'ILLUSTRATION' | 'PHOTOGRAPHY' | 'RAYTRACED' | 'RENDER_3D' | 'SKETCH_BW' | 'SKETCH_COLOR' | 'STOCK_PHOTO' | 'VIBRANT';
  tiling?: boolean;
}

export interface LeonardoResponse {
  generationId?: string;
  images?: string[];
  error?: string;
}

class LeonardoService {
  private apiKey: string;

  constructor() {
    this.apiKey = getApiKey();
  }

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private async request(endpoint: string, method: string = 'POST', body?: object): Promise<any> {
    if (!this.apiKey) {
      return { error: 'Leonardo API key não configurada. Configure VITE_LEONARDO_API_KEY no .env.local' };
    }

    try {
      const response = await fetch(`${LEONARDO_API_URL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.error || `Erro ${response.status}` };
      }

      return await response.json();
    } catch (error) {
      return { error: `Erro de conexão: ${error}` };
    }
  }

  /**
   * Inicia uma geração de imagem
   */
  async generateImage(options: LeonardoGenerationOptions): Promise<LeonardoResponse> {
    const body = {
      prompt: options.prompt,
      negative_prompt: options.negativePrompt || 'blurry, low quality, distorted, deformed',
      modelId: options.modelId || LEONARDO_MODELS.pixelArt.id,
      width: options.width || 512,
      height: options.height || 512,
      num_images: options.numImages || 1,
      guidance_scale: options.guidanceScale || 7,
      scheduler: options.scheduler || 'EULER_ANCESTRAL',
      presetStyle: options.presetStyle || 'NONE',
      tiling: options.tiling || false,
      public: false,
    };

    const result = await this.request('/generations', 'POST', body);

    if (result.error) {
      return { error: result.error };
    }

    return { generationId: result.sdGenerationJob?.generationId };
  }

  /**
   * Busca o resultado de uma geração
   */
  async getGeneration(generationId: string): Promise<LeonardoResponse> {
    const result = await this.request(`/generations/${generationId}`, 'GET');

    if (result.error) {
      return { error: result.error };
    }

    const generation = result.generations_by_pk;
    if (!generation) {
      return { error: 'Geração não encontrada' };
    }

    if (generation.status === 'PENDING') {
      return { generationId, images: [] };
    }

    if (generation.status === 'FAILED') {
      return { error: 'Geração falhou' };
    }

    const images = generation.generated_images?.map((img: any) => img.url) || [];
    return { generationId, images };
  }

  /**
   * Gera e aguarda resultado (polling)
   */
  async generateAndWait(options: LeonardoGenerationOptions, maxWaitMs: number = 60000): Promise<LeonardoResponse> {
    const startResult = await this.generateImage(options);

    if (startResult.error || !startResult.generationId) {
      return startResult;
    }

    const generationId = startResult.generationId;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2s

      const result = await this.getGeneration(generationId);

      if (result.error) {
        return result;
      }

      if (result.images && result.images.length > 0) {
        return result;
      }
    }

    return { error: 'Timeout aguardando geração' };
  }

  /**
   * Gera sprite sheet de personagem RPG
   */
  async generateCharacterSpriteSheet(
    description: string,
    style: 'pixel' | 'chibi' | '16bit' = 'pixel'
  ): Promise<LeonardoResponse> {
    const stylePrompts = {
      pixel: '32x32 pixel art sprite sheet, 4 directions (front, back, left, right), walk cycle animation, transparent background, RPG Maker style',
      chibi: 'chibi character sprite sheet, cute proportions, 4 directional views, walk animation frames, game asset',
      '16bit': '16-bit SNES style character sprite sheet, top-down RPG view, 4 directions, walking animation, retro game style',
    };

    return this.generateAndWait({
      prompt: `${stylePrompts[style]}, ${description}, game sprite, clean lines, no background`,
      negativePrompt: 'blurry, realistic, 3D render, photograph, complex background, watermark',
      modelId: LEONARDO_MODELS.pixelArt.id,
      width: 512,
      height: 512,
      guidanceScale: 8,
    });
  }

  /**
   * Gera tileset para cenário
   */
  async generateTileset(
    theme: string,
    tileSize: 16 | 32 | 64 = 32
  ): Promise<LeonardoResponse> {
    return this.generateAndWait({
      prompt: `${tileSize}x${tileSize} pixel art tileset, ${theme}, seamless tiles, top-down view, game asset, RPG Maker style, organized grid`,
      negativePrompt: 'blurry, 3D, realistic, watermark, text',
      modelId: LEONARDO_MODELS.pixelArt.id,
      width: 512,
      height: 512,
      tiling: true,
      guidanceScale: 7,
    });
  }

  /**
   * Gera assets de hospital especificamente
   */
  async generateHospitalAsset(
    assetType: 'character' | 'furniture' | 'equipment' | 'tileset'
  ): Promise<LeonardoResponse> {
    const prompts = {
      character: 'pixel art hospital staff sprite sheet, doctor nurse patient, medical uniform, 32x32, 4 directions, walk animation, RPG style',
      furniture: 'pixel art hospital furniture set, bed desk chair cabinet, 32x32 tiles, top-down view, medical theme, clean style',
      equipment: 'pixel art medical equipment sprites, MRI machine, monitor, IV stand, wheelchair, 32x32, top-down RPG view',
      tileset: 'pixel art hospital tileset, floor walls doors, sterile white blue colors, 32x32 seamless tiles, top-down view',
    };

    return this.generateAndWait({
      prompt: prompts[assetType],
      negativePrompt: 'blurry, realistic, 3D, complex, watermark',
      modelId: LEONARDO_MODELS.pixelArt.id,
      width: 512,
      height: 512,
      guidanceScale: 8,
    });
  }

  /**
   * Verifica créditos disponíveis
   */
  async getCredits(): Promise<{ credits?: number; error?: string }> {
    const result = await this.request('/me', 'GET');

    if (result.error) {
      return { error: result.error };
    }

    return { credits: result.user_details?.[0]?.tokenRenewalDate };
  }
}

export const leonardoService = new LeonardoService();
export default leonardoService;
