import React, { useState, useEffect } from 'react';
import {
  LeonardoAIService,
  saveLeonardoApiKey,
  loadLeonardoApiKey,
  clearLeonardoApiKey,
  getLeonardo,
  initLeonardo,
  GeneratedImage,
  GRANADO_STYLE_PROMPTS,
} from '../services/leonardoAI';

interface LeonardoGeneratorProps {
  onClose: () => void;
}

type GenerationType = 'scene_or' | 'scene_icu' | 'character' | 'equipment' | 'custom';

const LeonardoGenerator: React.FC<LeonardoGeneratorProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generationType, setGenerationType] = useState<GenerationType>('scene_or');
  const [customPrompt, setCustomPrompt] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [characterRole, setCharacterRole] = useState<'doctor' | 'nurse' | 'anesthesiologist' | 'patient'>('anesthesiologist');
  const [characterGender, setCharacterGender] = useState<'male' | 'female'>('male');
  const [equipmentType, setEquipmentType] = useState('anesthesia machine');
  const [userInfo, setUserInfo] = useState<any>(null);

  // Carregar API key salva
  useEffect(() => {
    const savedKey = loadLeonardoApiKey();
    if (savedKey) {
      setApiKey(savedKey);
      setIsConfigured(true);
      fetchUserInfo();
    }
  }, []);

  const fetchUserInfo = async () => {
    const service = getLeonardo();
    if (service) {
      try {
        const info = await service.getUserInfo();
        setUserInfo(info.user_details?.[0] || null);
      } catch (err) {
        console.error('Erro ao obter info do usuário:', err);
      }
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      saveLeonardoApiKey(apiKey.trim());
      setIsConfigured(true);
      fetchUserInfo();
      setError(null);
    }
  };

  const handleClearApiKey = () => {
    clearLeonardoApiKey();
    setApiKey('');
    setIsConfigured(false);
    setUserInfo(null);
  };

  const handleGenerate = async () => {
    const service = getLeonardo();
    if (!service) {
      setError('API não configurada');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      let images: GeneratedImage[] = [];

      switch (generationType) {
        case 'scene_or':
          images = await service.generateORScene(specialty || undefined);
          break;
        case 'scene_icu':
          images = await service.generateICUScene();
          break;
        case 'character':
          images = await service.generateMedicalCharacter(characterRole, {
            gender: characterGender,
          });
          break;
        case 'equipment':
          images = await service.generateEquipment(equipmentType);
          break;
        case 'custom':
          images = await service.generateAndWait({
            prompt: customPrompt,
            width: 512,
            height: 512,
          });
          break;
      }

      setGeneratedImages(images);
    } catch (err: any) {
      setError(err.message || 'Erro na geração');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `granado_${generationType}_${image.id}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-purple-400/80 rounded-lg shadow-[0_0_40px_rgba(168,85,247,0.3)] max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b-2 border-purple-400/50 p-4 flex items-center justify-between z-10">
          <h2 className="text-purple-300 text-sm flex items-center gap-2">
            <span className="text-lg">🎨</span>
            LEONARDO AI - GRANADO
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-400 text-xs px-2 py-1 border border-slate-600 rounded hover:border-red-400 transition-colors"
          >
            [X]
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* API Key Configuration */}
          <div className="bg-slate-800/50 border border-slate-600 rounded p-3">
            <h3 className="text-amber-300 text-[10px] mb-2">CONFIGURACAO API</h3>

            {!isConfigured ? (
              <div className="space-y-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Cole sua API Key do Leonardo.ai"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-xs focus:border-purple-400 focus:outline-none"
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={!apiKey.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white text-[10px] py-2 rounded border border-purple-400/50 transition-colors"
                >
                  SALVAR API KEY
                </button>
                <p className="text-[8px] text-slate-500">
                  Obtenha sua API key em: https://app.leonardo.ai/settings
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-green-400 text-[10px] flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    API Configurada
                  </span>
                  {userInfo && (
                    <span className="text-[8px] text-slate-400 block mt-1">
                      Tokens: {userInfo.subscriptionTokens || 'N/A'}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleClearApiKey}
                  className="text-red-400 text-[8px] px-2 py-1 border border-red-400/50 rounded hover:bg-red-400/20"
                >
                  LIMPAR
                </button>
              </div>
            )}
          </div>

          {isConfigured && (
            <>
              {/* Generation Type Selector */}
              <div className="bg-slate-800/50 border border-slate-600 rounded p-3">
                <h3 className="text-amber-300 text-[10px] mb-3">TIPO DE GERACAO</h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {[
                    { id: 'scene_or', label: 'Sala Cirurgica', icon: '🏥' },
                    { id: 'scene_icu', label: 'UTI', icon: '🛏️' },
                    { id: 'character', label: 'Personagem', icon: '👨‍⚕️' },
                    { id: 'equipment', label: 'Equipamento', icon: '🔬' },
                    { id: 'custom', label: 'Personalizado', icon: '✨' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setGenerationType(type.id as GenerationType)}
                      className={`p-2 rounded border text-[8px] transition-all ${
                        generationType === type.id
                          ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                          : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      <span className="text-lg block mb-1">{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>

                {/* Type-specific options */}
                {generationType === 'scene_or' && (
                  <div className="space-y-2">
                    <label className="text-[8px] text-slate-400">Especialidade (opcional):</label>
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-[10px]"
                    >
                      <option value="">Geral</option>
                      <option value="cardiac">Cardiaca</option>
                      <option value="orthopedic">Ortopedia</option>
                      <option value="neurosurgery">Neurocirurgia</option>
                      <option value="laparoscopic">Laparoscopia</option>
                      <option value="obstetric">Obstetricia</option>
                      <option value="ophthalmology">Oftalmologia</option>
                      <option value="pediatric">Pediatrica</option>
                    </select>
                  </div>
                )}

                {generationType === 'character' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] text-slate-400 block mb-1">Funcao:</label>
                      <select
                        value={characterRole}
                        onChange={(e) => setCharacterRole(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-[10px]"
                      >
                        <option value="anesthesiologist">Anestesiologista</option>
                        <option value="doctor">Medico</option>
                        <option value="nurse">Enfermeiro(a)</option>
                        <option value="patient">Paciente</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] text-slate-400 block mb-1">Genero:</label>
                      <select
                        value={characterGender}
                        onChange={(e) => setCharacterGender(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-[10px]"
                      >
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                      </select>
                    </div>
                  </div>
                )}

                {generationType === 'equipment' && (
                  <div>
                    <label className="text-[8px] text-slate-400 block mb-1">Equipamento:</label>
                    <select
                      value={equipmentType}
                      onChange={(e) => setEquipmentType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-[10px]"
                    >
                      <option value="anesthesia machine">Aparelho de Anestesia</option>
                      <option value="patient monitor vital signs">Monitor Multiparametro</option>
                      <option value="IV stand infusion pole">Suporte de Soro</option>
                      <option value="defibrillator">Desfibrilador</option>
                      <option value="ventilator breathing machine">Ventilador</option>
                      <option value="surgical table operating bed">Mesa Cirurgica</option>
                      <option value="crash cart emergency">Carrinho de Emergencia</option>
                      <option value="laparoscopy tower">Torre de Laparoscopia</option>
                      <option value="C-arm fluoroscopy">Arco em C</option>
                      <option value="surgical microscope">Microscopio Cirurgico</option>
                    </select>
                  </div>
                )}

                {generationType === 'custom' && (
                  <div>
                    <label className="text-[8px] text-slate-400 block mb-1">Prompt personalizado:</label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Descreva o que deseja gerar..."
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-2 text-white text-[10px] resize-none"
                    />
                    <p className="text-[7px] text-slate-500 mt-1">
                      O estilo pixel art 16-bit sera aplicado automaticamente.
                    </p>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || (generationType === 'custom' && !customPrompt.trim())}
                className={`w-full py-3 rounded border text-[10px] transition-all ${
                  isGenerating
                    ? 'bg-purple-900/50 border-purple-600 text-purple-400 cursor-wait'
                    : 'bg-purple-600 hover:bg-purple-500 border-purple-400 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">🔄</span>
                    GERANDO... (pode levar ate 2 min)
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>🎨</span>
                    GERAR IMAGEM
                  </span>
                )}
              </button>

              {/* Error Display */}
              {error && (
                <div className="bg-red-900/30 border border-red-400/50 rounded p-2 text-red-300 text-[9px]">
                  Erro: {error}
                </div>
              )}

              {/* Generated Images */}
              {generatedImages.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-600 rounded p-3">
                  <h3 className="text-amber-300 text-[10px] mb-3">IMAGENS GERADAS</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {generatedImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.url}
                          alt="Generated"
                          className="w-full h-auto rounded border border-slate-600"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDownloadImage(image)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[8px] px-2 py-1 rounded"
                          >
                            BAIXAR
                          </button>
                          <button
                            onClick={() => window.open(image.url, '_blank')}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[8px] px-2 py-1 rounded"
                          >
                            ABRIR
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="bg-slate-900/50 border border-slate-700 rounded p-3">
                <h4 className="text-slate-400 text-[8px] mb-2">DICAS PARA ECONOMIZAR TOKENS:</h4>
                <ul className="text-[7px] text-slate-500 space-y-1">
                  <li>• Use templates de cena e modifique com Canvas do Leonardo</li>
                  <li>• Gere personagens em sprite sheets (4 direcoes de uma vez)</li>
                  <li>• Reutilize backgrounds e mude apenas overlays</li>
                  <li>• Equipamentos isolados podem ser compostos manualmente</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeonardoGenerator;
