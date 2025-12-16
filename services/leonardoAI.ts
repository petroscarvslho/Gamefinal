/**
 * Leonardo AI Integration Service
 * Para geração de sprites e cenários pixel art estilo 16-bit SNES
 *
 * Projeto GRANADO / MediQuest
 */

// Tipos para a API Leonardo
export interface LeonardoConfig {
  apiKey: string;
  modelId?: string; // Pixel Art model
  defaultWidth?: number;
  defaultHeight?: number;
}

export interface GenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numImages?: number;
  guidanceScale?: number;
  seed?: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  nsfw: boolean;
  generationId: string;
}

export interface GenerationResult {
  generationId: string;
  status: 'PENDING' | 'COMPLETE' | 'FAILED';
  images: GeneratedImage[];
}

// Modelos recomendados para pixel art
export const LEONARDO_MODELS = {
  PIXEL_ART: 'ac614f96-1082-45bf-be9d-757f2d31c174', // Leonardo Diffusion - bom para pixel art
  ANIME_PASTEL: 'b63f7119-31dc-4540-969b-2a9df997e173', // Anime Pastel Dream
  DREAMSHAPER: '5c232a9e-9061-4777-980a-ddc8e65647c6', // DreamShaper v7
  SDXL: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3', // SDXL 1.0
};

// Prompts base otimizados para o estilo GRANADO
export const GRANADO_STYLE_PROMPTS = {
  // Estilo visual base
  baseStyle: 'pixel art, 16-bit SNES style, retro game aesthetic, clean pixel edges, limited color palette, nostalgic gaming visuals',

  // Cenários hospitalares
  sceneOR: 'operating room scene, surgical theater, medical equipment, sterile environment, overhead surgical lights',
  sceneICU: 'intensive care unit, hospital monitors, medical beds, life support equipment, clinical setting',
  sceneCorridor: 'hospital corridor, medical facility hallway, clean floors, wall mounted equipment',
  sceneReception: 'hospital reception, waiting area, medical office, front desk',

  // Equipamentos médicos
  equipAnesthesia: 'anesthesia machine, medical ventilator, IV stands, patient monitors, surgical equipment',
  equipMonitor: 'vital signs monitor, ECG display, medical screen, heart rate display',
  equipSurgical: 'surgical instruments, mayo stand, operating table, surgical lights',

  // Personagens
  charDoctor: 'medical professional, doctor character, scrubs uniform, stethoscope, professional pose',
  charNurse: 'nurse character, medical uniform, caring expression, hospital worker',
  charPatient: 'hospital patient, medical gown, hospital bed, recovery scene',
  charAnesthesiologist: 'anesthesiologist, medical specialist, OR scrubs, medical mask, professional',

  // Qualidade e estilo negativo
  negativePrompt: 'blurry, low quality, realistic photo, 3D render, modern art style, watermark, text, signature, deformed, ugly, bad anatomy',
};

// Classe principal do serviço
export class LeonardoAIService {
  private apiKey: string;
  private baseUrl = 'https://cloud.leonardo.ai/api/rest/v1';
  private modelId: string;
  private defaultWidth: number;
  private defaultHeight: number;

  constructor(config: LeonardoConfig) {
    this.apiKey = config.apiKey;
    this.modelId = config.modelId || LEONARDO_MODELS.PIXEL_ART;
    this.defaultWidth = config.defaultWidth || 512;
    this.defaultHeight = config.defaultHeight || 512;
  }

  // Headers padrão para requisições
  private getHeaders(): HeadersInit {
    return {
      'accept': 'application/json',
      'authorization': `Bearer ${this.apiKey}`,
      'content-type': 'application/json',
    };
  }

  // Verificar status da conta/créditos
  async getUserInfo(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/me`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter info do usuário: ${response.status}`);
    }

    return response.json();
  }

  // Iniciar uma geração de imagem
  async generateImage(request: GenerationRequest): Promise<string> {
    // Combinar com estilo GRANADO
    const enhancedPrompt = `${request.prompt}, ${GRANADO_STYLE_PROMPTS.baseStyle}`;
    const negativePrompt = request.negativePrompt || GRANADO_STYLE_PROMPTS.negativePrompt;

    const body = {
      prompt: enhancedPrompt,
      negative_prompt: negativePrompt,
      modelId: this.modelId,
      width: request.width || this.defaultWidth,
      height: request.height || this.defaultHeight,
      num_images: request.numImages || 1,
      guidance_scale: request.guidanceScale || 7,
      seed: request.seed,
      presetStyle: 'NONE',
      public: false,
    };

    const response = await fetch(`${this.baseUrl}/generations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro na geração: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.sdGenerationJob.generationId;
  }

  // Verificar status de uma geração
  async getGenerationStatus(generationId: string): Promise<GenerationResult> {
    const response = await fetch(`${this.baseUrl}/generations/${generationId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao verificar geração: ${response.status}`);
    }

    const data = await response.json();
    const generation = data.generations_by_pk;

    return {
      generationId: generation.id,
      status: generation.status,
      images: generation.generated_images?.map((img: any) => ({
        id: img.id,
        url: img.url,
        nsfw: img.nsfw,
        generationId: generation.id,
      })) || [],
    };
  }

  // Gerar e aguardar resultado (polling)
  async generateAndWait(request: GenerationRequest, maxWaitMs = 120000): Promise<GeneratedImage[]> {
    const generationId = await this.generateImage(request);

    const startTime = Date.now();
    const pollInterval = 3000; // 3 segundos

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const result = await this.getGenerationStatus(generationId);

      if (result.status === 'COMPLETE') {
        return result.images;
      }

      if (result.status === 'FAILED') {
        throw new Error('Geração falhou');
      }
    }

    throw new Error('Timeout aguardando geração');
  }

  // === MÉTODOS DE CONVENIÊNCIA PARA GRANADO ===

  // Gerar cenário de sala de cirurgia
  async generateORScene(specialty?: string): Promise<GeneratedImage[]> {
    const specialtyText = specialty ? `, ${specialty} surgery` : '';
    return this.generateAndWait({
      prompt: `${GRANADO_STYLE_PROMPTS.sceneOR}${specialtyText}, ${GRANADO_STYLE_PROMPTS.equipAnesthesia}`,
      width: 640,
      height: 480,
    });
  }

  // Gerar cenário de UTI
  async generateICUScene(): Promise<GeneratedImage[]> {
    return this.generateAndWait({
      prompt: GRANADO_STYLE_PROMPTS.sceneICU,
      width: 640,
      height: 480,
    });
  }

  // Gerar personagem médico
  async generateMedicalCharacter(
    role: 'doctor' | 'nurse' | 'anesthesiologist' | 'patient',
    options?: { gender?: 'male' | 'female'; ethnicity?: string }
  ): Promise<GeneratedImage[]> {
    const rolePrompts = {
      doctor: GRANADO_STYLE_PROMPTS.charDoctor,
      nurse: GRANADO_STYLE_PROMPTS.charNurse,
      anesthesiologist: GRANADO_STYLE_PROMPTS.charAnesthesiologist,
      patient: GRANADO_STYLE_PROMPTS.charPatient,
    };

    let prompt = rolePrompts[role];

    if (options?.gender) {
      prompt += `, ${options.gender} character`;
    }
    if (options?.ethnicity) {
      prompt += `, ${options.ethnicity}`;
    }

    // Sprite sheet format para personagem
    return this.generateAndWait({
      prompt: `${prompt}, character sprite sheet, front side back views, game character design`,
      width: 512,
      height: 512,
    });
  }

  // Gerar equipamento médico isolado
  async generateEquipment(equipmentType: string): Promise<GeneratedImage[]> {
    return this.generateAndWait({
      prompt: `${equipmentType}, medical equipment, hospital device, ${GRANADO_STYLE_PROMPTS.baseStyle}, isolated on transparent background, game asset, sprite`,
      width: 256,
      height: 256,
    });
  }

  // Gerar tile de ambiente
  async generateTile(tileType: 'floor' | 'wall' | 'door' | 'window'): Promise<GeneratedImage[]> {
    const tilePrompts = {
      floor: 'hospital floor tile, medical facility flooring, clean surface',
      wall: 'hospital wall tile, medical facility wall, clean surface, white/blue colors',
      door: 'hospital door, medical facility door, automatic door',
      window: 'hospital window, medical facility window, glass panel',
    };

    return this.generateAndWait({
      prompt: `${tilePrompts[tileType]}, tileable texture, seamless pattern, ${GRANADO_STYLE_PROMPTS.baseStyle}`,
      width: 128,
      height: 128,
    });
  }
}

// Singleton para uso global (inicializado quando API key for fornecida)
let leonardoInstance: LeonardoAIService | null = null;

export const initLeonardo = (apiKey: string): LeonardoAIService => {
  leonardoInstance = new LeonardoAIService({ apiKey });
  return leonardoInstance;
};

export const getLeonardo = (): LeonardoAIService | null => leonardoInstance;

// Armazenamento seguro da API key (localStorage)
export const saveLeonardoApiKey = (apiKey: string): void => {
  localStorage.setItem('leonardo_api_key', apiKey);
  initLeonardo(apiKey);
};

export const loadLeonardoApiKey = (): string | null => {
  const key = localStorage.getItem('leonardo_api_key');
  if (key) {
    initLeonardo(key);
  }
  return key;
};

export const clearLeonardoApiKey = (): void => {
  localStorage.removeItem('leonardo_api_key');
  leonardoInstance = null;
};
