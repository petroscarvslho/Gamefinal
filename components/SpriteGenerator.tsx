/**
 * SpriteGenerator - Painel para gerar sprites com PixelLab AI
 */
import React, { useState } from 'react';
import { pixelLabService } from '../services/pixellab';

interface SpriteGeneratorProps {
  onClose: () => void;
  onSpriteGenerated?: (imageBase64: string, name: string) => void;
}

type GeneratorTab = 'character' | 'npc' | 'tile' | 'custom';

const SpriteGenerator: React.FC<SpriteGeneratorProps> = ({ onClose, onSpriteGenerated }) => {
  const [activeTab, setActiveTab] = useState<GeneratorTab>('npc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  // Form states
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedRole, setSelectedRole] = useState<'doctor' | 'nurse' | 'patient' | 'receptionist'>('doctor');
  const [selectedTile, setSelectedTile] = useState<'floor' | 'wall' | 'bed' | 'desk' | 'chair' | 'equipment'>('bed');
  const [spriteSize, setSpriteSize] = useState(32);
  const [characterStyle, setCharacterStyle] = useState<'rpg' | 'chibi' | 'realistic'>('rpg');

  // Verifica saldo
  const checkBalance = async () => {
    const result = await pixelLabService.getBalance();
    if (result.balance !== undefined) {
      setBalance(result.balance);
    } else {
      setError(result.error || 'Erro ao verificar saldo');
    }
  };

  // Gera NPC médico
  const generateMedicalNPC = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    const result = await pixelLabService.generateMedicalNPC(selectedRole);

    if (result.image) {
      setGeneratedImage(result.image);
    } else {
      setError(result.error || 'Erro ao gerar sprite');
    }

    setIsLoading(false);
  };

  // Gera tile
  const generateTile = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    const result = await pixelLabService.generateHospitalTile(selectedTile, spriteSize);

    if (result.image) {
      setGeneratedImage(result.image);
    } else {
      setError(result.error || 'Erro ao gerar tile');
    }

    setIsLoading(false);
  };

  // Gera personagem customizado
  const generateCustomCharacter = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    const result = await pixelLabService.generateCharacter(
      customPrompt,
      spriteSize,
      characterStyle
    );

    if (result.image) {
      setGeneratedImage(result.image);
    } else {
      setError(result.error || 'Erro ao gerar sprite');
    }

    setIsLoading(false);
  };

  // Gera com prompt customizado
  const generateCustom = async () => {
    if (!customPrompt.trim()) {
      setError('Digite uma descrição');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    const result = await pixelLabService.generateImage({
      description: customPrompt,
      imageSize: { width: spriteSize, height: spriteSize },
      noBackground: true,
    });

    if (result.image) {
      setGeneratedImage(result.image);
    } else {
      setError(result.error || 'Erro ao gerar imagem');
    }

    setIsLoading(false);
  };

  // Baixa a imagem
  const downloadImage = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = `data:image/png;base64,${generatedImage}`;
    link.download = `sprite_${Date.now()}.png`;
    link.click();
  };

  // Usa no jogo
  const useInGame = () => {
    if (generatedImage && onSpriteGenerated) {
      onSpriteGenerated(generatedImage, `generated_${Date.now()}`);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-cyan-500/30">
          <h2
            className="text-cyan-400 text-sm"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            GERADOR DE SPRITES (PixelLab AI)
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={checkBalance}
              className="text-slate-400 hover:text-white text-xs"
            >
              {balance !== null ? `$${balance.toFixed(2)}` : 'Ver saldo'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <span className="text-xl">&times;</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {[
            { id: 'npc', label: 'NPCs Médicos' },
            { id: 'tile', label: 'Tiles' },
            { id: 'character', label: 'Personagem' },
            { id: 'custom', label: 'Customizado' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as GeneratorTab)}
              className={`px-4 py-2 text-xs ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Options Panel */}
            <div className="space-y-4">
              {/* NPC Tab */}
              {activeTab === 'npc' && (
                <>
                  <div>
                    <label className="block text-slate-400 text-xs mb-2">Tipo de NPC</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                    >
                      <option value="doctor">Médico</option>
                      <option value="nurse">Enfermeiro(a)</option>
                      <option value="patient">Paciente</option>
                      <option value="receptionist">Recepcionista</option>
                    </select>
                  </div>
                  <button
                    onClick={generateMedicalNPC}
                    disabled={isLoading}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-white text-sm font-semibold"
                  >
                    {isLoading ? 'Gerando...' : 'Gerar NPC'}
                  </button>
                </>
              )}

              {/* Tile Tab */}
              {activeTab === 'tile' && (
                <>
                  <div>
                    <label className="block text-slate-400 text-xs mb-2">Tipo de Tile</label>
                    <select
                      value={selectedTile}
                      onChange={(e) => setSelectedTile(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                    >
                      <option value="floor">Chão</option>
                      <option value="wall">Parede</option>
                      <option value="bed">Cama</option>
                      <option value="desk">Mesa/Balcão</option>
                      <option value="chair">Cadeira</option>
                      <option value="equipment">Equipamento</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-2">Tamanho</label>
                    <select
                      value={spriteSize}
                      onChange={(e) => setSpriteSize(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                    >
                      <option value="16">16x16</option>
                      <option value="32">32x32</option>
                      <option value="64">64x64</option>
                    </select>
                  </div>
                  <button
                    onClick={generateTile}
                    disabled={isLoading}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-white text-sm font-semibold"
                  >
                    {isLoading ? 'Gerando...' : 'Gerar Tile'}
                  </button>
                </>
              )}

              {/* Character Tab */}
              {activeTab === 'character' && (
                <>
                  <div>
                    <label className="block text-slate-400 text-xs mb-2">Descrição</label>
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Ex: médico idoso com barba"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-2">Estilo</label>
                    <select
                      value={characterStyle}
                      onChange={(e) => setCharacterStyle(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                    >
                      <option value="rpg">RPG (SNES)</option>
                      <option value="chibi">Chibi</option>
                      <option value="realistic">Realista</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-2">Tamanho</label>
                    <select
                      value={spriteSize}
                      onChange={(e) => setSpriteSize(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                    >
                      <option value="32">32x32</option>
                      <option value="64">64x64</option>
                      <option value="128">128x128</option>
                    </select>
                  </div>
                  <button
                    onClick={generateCustomCharacter}
                    disabled={isLoading || !customPrompt.trim()}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-white text-sm font-semibold"
                  >
                    {isLoading ? 'Gerando...' : 'Gerar Personagem'}
                  </button>
                </>
              )}

              {/* Custom Tab */}
              {activeTab === 'custom' && (
                <>
                  <div>
                    <label className="block text-slate-400 text-xs mb-2">Prompt (descrição livre)</label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Descreva o que você quer gerar em detalhes..."
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-2">Tamanho</label>
                    <select
                      value={spriteSize}
                      onChange={(e) => setSpriteSize(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                    >
                      <option value="32">32x32</option>
                      <option value="64">64x64</option>
                      <option value="128">128x128</option>
                      <option value="256">256x256</option>
                    </select>
                  </div>
                  <button
                    onClick={generateCustom}
                    disabled={isLoading || !customPrompt.trim()}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-white text-sm font-semibold"
                  >
                    {isLoading ? 'Gerando...' : 'Gerar'}
                  </button>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs">
                  {error}
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <div className="flex flex-col items-center justify-center">
              <div
                className="w-48 h-48 bg-slate-800 border-2 border-slate-600 rounded-lg flex items-center justify-center"
                style={{
                  backgroundImage: 'repeating-conic-gradient(#374151 0% 25%, #1f2937 0% 50%)',
                  backgroundSize: '16px 16px',
                }}
              >
                {isLoading ? (
                  <div className="text-slate-400 text-xs animate-pulse">Gerando...</div>
                ) : generatedImage ? (
                  <img
                    src={`data:image/png;base64,${generatedImage}`}
                    alt="Generated sprite"
                    className="max-w-full max-h-full"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="text-slate-500 text-xs text-center">
                    Preview do sprite<br />aparecerá aqui
                  </div>
                )}
              </div>

              {/* Actions */}
              {generatedImage && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={downloadImage}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs"
                  >
                    Download
                  </button>
                  {onSpriteGenerated && (
                    <button
                      onClick={useInGame}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white text-xs"
                    >
                      Usar no Jogo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-800 border-t border-slate-700 text-xs text-slate-400">
          Powered by <a href="https://pixellab.ai" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">PixelLab AI</a>
          {' • '}Cada geração consome créditos da API
        </div>
      </div>
    </div>
  );
};

export default SpriteGenerator;
