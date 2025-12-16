/**
 * Replicate API Service - Stable Diffusion e modelos de pixel art
 * Documentação: https://replicate.com/docs
 *
 * Modelos recomendados para pixel art:
 * - nerijs/pixel-art-xl (SDXL fine-tuned para pixel art)
 * - andreasjansson/pixel-art (Stable Diffusion 1.5)
 * - cjwbw/anything-v3.0 (Anime style)
 */

const REPLICATE_API_URL = 'https://api.replicate.com/v1';

const getApiKey = (): string => {
  return (import.meta as any).env?.VITE_REPLICATE_API_KEY || '';
};

// Modelos específicos para pixel art e jogos
export const REPLICATE_MODELS = {
  pixelArtXL: {
    version: 'nerijs/pixel-art-xl:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
    name: 'Pixel Art XL',
    description: 'SDXL fine-tuned para pixel art de alta qualidade',
  },
  pixelArt: {
    version: 'andreasjansson/pixel-art:2a2435bcbc932ebdf368ec8dcf44eb687d89ee5f0f8f1ccc1a8291687b4e7f76',
    name: 'Pixel Art SD 1.5',
    description: 'Stable Diffusion 1.5 otimizado para pixel art',
  },
  sdxl: {
    version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
    name: 'SDXL Base',
    description: 'Stable Diffusion XL base model',
  },
  realvisxl: {
    version: 'adirik/realvisxl-v3.0-turbo:78b2df4e81cca2eb90c68ca20d0e3d6a1a73c8f0b2f67d8799e99f7a5c91fcf8',
    name: 'RealVisXL Turbo',
    description: 'Rápido e versátil',
  },
};

export interface ReplicateGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  model?: keyof typeof REPLICATE_MODELS;
  width?: number;
  height?: number;
  numOutputs?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  scheduler?: string;
}

export interface ReplicateResponse {
  predictionId?: string;
  images?: string[];
  status?: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  error?: string;
}

class ReplicateService {
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
      return { error: 'Replicate API key não configurada. Configure VITE_REPLICATE_API_KEY no .env.local' };
    }

    try {
      const response = await fetch(`${REPLICATE_API_URL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.detail || `Erro ${response.status}` };
      }

      return await response.json();
    } catch (error) {
      return { error: `Erro de conexão: ${error}` };
    }
  }

  /**
   * Inicia uma predição
   */
  async createPrediction(options: ReplicateGenerationOptions): Promise<ReplicateResponse> {
    const modelConfig = REPLICATE_MODELS[options.model || 'pixelArtXL'];

    const input: any = {
      prompt: options.prompt,
      negative_prompt: options.negativePrompt || 'blurry, bad quality, distorted, realistic, 3d render',
      width: options.width || 512,
      height: options.height || 512,
      num_outputs: options.numOutputs || 1,
      guidance_scale: options.guidanceScale || 7.5,
      num_inference_steps: options.numInferenceSteps || 30,
    };

    if (options.scheduler) {
      input.scheduler = options.scheduler;
    }

    const result = await this.request('/predictions', 'POST', {
      version: modelConfig.version.split(':')[1],
      input,
    });

    if (result.error) {
      return { error: result.error };
    }

    return {
      predictionId: result.id,
      status: result.status,
    };
  }

  /**
   * Busca o status de uma predição
   */
  async getPrediction(predictionId: string): Promise<ReplicateResponse> {
    const result = await this.request(`/predictions/${predictionId}`, 'GET');

    if (result.error) {
      return { error: result.error };
    }

    return {
      predictionId: result.id,
      status: result.status,
      images: result.output || [],
    };
  }

  /**
   * Gera e aguarda resultado
   */
  async generateAndWait(options: ReplicateGenerationOptions, maxWaitMs: number = 120000): Promise<ReplicateResponse> {
    const startResult = await this.createPrediction(options);

    if (startResult.error || !startResult.predictionId) {
      return startResult;
    }

    const predictionId = startResult.predictionId;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = await this.getPrediction(predictionId);

      if (result.error) {
        return result;
      }

      if (result.status === 'succeeded') {
        return result;
      }

      if (result.status === 'failed' || result.status === 'canceled') {
        return { error: `Geração ${result.status}` };
      }
    }

    return { error: 'Timeout aguardando geração' };
  }

  /**
   * Gera pixel art com prompt otimizado
   */
  async generatePixelArt(
    description: string,
    size: number = 512,
    style: 'game' | 'retro' | 'modern' = 'game'
  ): Promise<ReplicateResponse> {
    const stylePrompts = {
      game: 'pixel art game asset, 32x32 sprite, clean pixels, game ready, transparent background',
      retro: '8-bit pixel art, retro game style, NES era, limited color palette',
      modern: 'HD pixel art, detailed sprites, vibrant colors, high quality',
    };

    return this.generateAndWait({
      prompt: `${stylePrompts[style]}, ${description}, no antialiasing, sharp pixels`,
      negativePrompt: 'blurry, smooth, 3d, realistic, photograph, watermark, text',
      model: 'pixelArtXL',
      width: size,
      height: size,
      guidanceScale: 8,
      numInferenceSteps: 35,
    });
  }

  /**
   * Gera sprite sheet de personagem
   */
  async generateCharacterSprite(
    description: string,
    directions: boolean = true
  ): Promise<ReplicateResponse> {
    const directionPrompt = directions
      ? 'sprite sheet with 4 directions (front, back, left, right), walking animation frames'
      : 'single character sprite, front view';

    return this.generateAndWait({
      prompt: `pixel art RPG character sprite, ${directionPrompt}, ${description}, 32x32 per frame, top-down view, game asset, clean pixel art style`,
      negativePrompt: 'blurry, smooth gradients, 3d, realistic, watermark',
      model: 'pixelArtXL',
      width: 512,
      height: 512,
      guidanceScale: 8,
    });
  }

  /**
   * Gera tileset
   */
  async generateTileset(
    theme: string,
    seamless: boolean = true
  ): Promise<ReplicateResponse> {
    const seamlessPrompt = seamless ? 'seamless tileable pattern' : 'individual tiles arranged in grid';

    return this.generateAndWait({
      prompt: `pixel art tileset, ${theme}, ${seamlessPrompt}, 32x32 tiles, top-down RPG view, organized grid layout, game asset`,
      negativePrompt: 'blurry, 3d, realistic, watermark, messy',
      model: 'pixelArtXL',
      width: 512,
      height: 512,
      guidanceScale: 7,
    });
  }

  /**
   * Gera assets médicos/hospitalares
   */
  async generateMedicalAsset(
    assetType: 'doctor' | 'nurse' | 'patient' | 'bed' | 'equipment' | 'room'
  ): Promise<ReplicateResponse> {
    const prompts = {
      doctor: 'pixel art doctor character sprite, white coat, stethoscope, professional, 32x32, top-down RPG style, 4 directional sprite sheet',
      nurse: 'pixel art nurse character sprite, medical scrubs, caring expression, 32x32, top-down RPG style, 4 directional sprite sheet',
      patient: 'pixel art hospital patient character sprite, hospital gown, 32x32, top-down RPG style, sprite sheet',
      bed: 'pixel art hospital bed sprite, white sheets, medical equipment nearby, 32x32 tile, top-down view, game asset',
      equipment: 'pixel art medical equipment sprites sheet, IV stand, monitor, wheelchair, medical cart, 32x32 each, top-down view',
      room: 'pixel art hospital room tileset, sterile white and blue colors, floor tiles, walls, doors, windows, 32x32 seamless tiles',
    };

    return this.generateAndWait({
      prompt: prompts[assetType],
      negativePrompt: 'blurry, realistic, 3d render, watermark, complex',
      model: 'pixelArtXL',
      width: 512,
      height: 512,
      guidanceScale: 8,
    });
  }
}

export const replicateService = new ReplicateService();
export default replicateService;
