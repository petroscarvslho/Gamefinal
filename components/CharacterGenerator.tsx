/**
 * CharacterGenerator - Cria personagens combinando partes do LimeZu
 * Body + Outfit + Hairstyle + Eyes = Personagem único
 * Com animação de preview e galeria de premades
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface CharacterGeneratorProps {
  onClose: () => void;
  onCharacterCreated?: (characterData: CharacterData) => void;
}

export interface CharacterData {
  id: string;
  name: string;
  body: number;
  outfit: { style: number; color: number };
  hairstyle: { style: number; color: number };
  eyes: number;
  spriteUrl?: string;
  isPremade?: boolean;
  premadeId?: number;
}

type TabType = 'create' | 'premade' | 'saved';
type Direction = 'down' | 'left' | 'right' | 'up';

// Definições dos assets disponíveis baseado nos arquivos reais
const BODIES = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  file: `Body_32x32_0${i + 1}.png`,
  name: `Corpo ${i + 1}`,
}));

// Componente de ícone pixel art
const PixelIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 16 }) => {
  const icons: Record<string, { bg: string; symbol: string; color: string }> = {
    // Roupas
    casual: { bg: '#4ade80', symbol: 'C', color: '#fff' },
    formal: { bg: '#3b82f6', symbol: 'F', color: '#fff' },
    sport: { bg: '#f97316', symbol: 'S', color: '#fff' },
    jaleco: { bg: '#f8fafc', symbol: '+', color: '#ef4444' },
    scrubs: { bg: '#06b6d4', symbol: 'H', color: '#fff' },
    paciente: { bg: '#a78bfa', symbol: 'P', color: '#fff' },
    vestido: { bg: '#ec4899', symbol: 'V', color: '#fff' },
    uniforme: { bg: '#1e40af', symbol: 'U', color: '#fbbf24' },
    // Cabelos
    curto: { bg: '#78716c', symbol: '▪', color: '#fff' },
    medio: { bg: '#78716c', symbol: '▬', color: '#fff' },
    longo: { bg: '#78716c', symbol: '▼', color: '#fff' },
    rabo: { bg: '#78716c', symbol: '◐', color: '#fff' },
    coque: { bg: '#78716c', symbol: '●', color: '#fff' },
    franja: { bg: '#78716c', symbol: '▲', color: '#fff' },
    undercut: { bg: '#78716c', symbol: '◧', color: '#fff' },
    afro: { bg: '#78716c', symbol: '◉', color: '#fff' },
    // Seções
    corpo: { bg: '#22d3ee', symbol: '♦', color: '#0f172a' },
    roupa: { bg: '#22d3ee', symbol: '■', color: '#0f172a' },
    cabelo: { bg: '#22d3ee', symbol: '▲', color: '#0f172a' },
    olhos: { bg: '#22d3ee', symbol: '◎', color: '#0f172a' },
    // Ações
    random: { bg: '#a855f7', symbol: '?', color: '#fff' },
    salvar: { bg: '#10b981', symbol: '◆', color: '#fff' },
    exportar: { bg: '#f59e0b', symbol: '↓', color: '#fff' },
    vazio: { bg: '#334155', symbol: '○', color: '#64748b' },
  };

  const icon = icons[type] || { bg: '#64748b', symbol: '?', color: '#fff' };

  return (
    <span
      className="inline-flex items-center justify-center font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: icon.bg,
        color: icon.color,
        fontSize: size * 0.6,
        borderRadius: 2,
        border: '1px solid rgba(0,0,0,0.3)',
        boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.2)',
        fontFamily: 'monospace',
      }}
    >
      {icon.symbol}
    </span>
  );
};

// Roupas organizadas por estilo e variação de cor (baseado nos arquivos reais)
const OUTFIT_STYLES = [
  { id: 1, name: 'Casual', colors: 10, iconType: 'casual' },
  { id: 2, name: 'Formal', colors: 4, iconType: 'formal' },
  { id: 3, name: 'Esportivo', colors: 4, iconType: 'sport' },
  { id: 4, name: 'Jaleco', colors: 3, iconType: 'jaleco' },
  { id: 5, name: 'Scrubs', colors: 5, iconType: 'scrubs' },
  { id: 6, name: 'Paciente', colors: 4, iconType: 'paciente' },
  { id: 7, name: 'Vestido', colors: 6, iconType: 'vestido' },
  { id: 8, name: 'Uniforme', colors: 4, iconType: 'uniforme' },
];

// Cabelos organizados por estilo e cor
const HAIRSTYLE_STYLES = [
  { id: 1, name: 'Curto', colors: 7, iconType: 'curto' },
  { id: 2, name: 'Médio', colors: 7, iconType: 'medio' },
  { id: 3, name: 'Longo', colors: 7, iconType: 'longo' },
  { id: 4, name: 'Rabo', colors: 7, iconType: 'rabo' },
  { id: 5, name: 'Coque', colors: 7, iconType: 'coque' },
  { id: 6, name: 'Franja', colors: 7, iconType: 'franja' },
  { id: 7, name: 'Undercut', colors: 7, iconType: 'undercut' },
  { id: 8, name: 'Afro', colors: 7, iconType: 'afro' },
];

const EYES = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  file: `Eyes_32x32_0${i + 1}.png`,
  name: `Olhos ${i + 1}`,
}));

const HAIR_COLORS = [
  { id: 1, name: 'Preto', color: '#1a1a1a' },
  { id: 2, name: 'Castanho', color: '#4a3728' },
  { id: 3, name: 'Marrom', color: '#8b4513' },
  { id: 4, name: 'Loiro', color: '#d4a574' },
  { id: 5, name: 'Dourado', color: '#ffd700' },
  { id: 6, name: 'Ruivo', color: '#ff6b6b' },
  { id: 7, name: 'Roxo', color: '#8b5cf6' },
];

const PREMADE_CHARACTERS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  file: `Premade_Character_32x32_${String(i + 1).padStart(2, '0')}.png`,
  name: `Personagem ${i + 1}`,
}));

const CharacterGenerator: React.FC<CharacterGeneratorProps> = ({ onClose, onCharacterCreated }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const frameRef = useRef<number>(0);

  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [characterName, setCharacterName] = useState('Novo Personagem');
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentDirection, setCurrentDirection] = useState<Direction>('down');
  const [savedCharacters, setSavedCharacters] = useState<CharacterData[]>([]);

  // Seleções atuais
  const [selectedBody, setSelectedBody] = useState(1);
  const [selectedOutfitStyle, setSelectedOutfitStyle] = useState(5); // Scrubs por padrão
  const [selectedOutfitColor, setSelectedOutfitColor] = useState(1);
  const [selectedHairstyleStyle, setSelectedHairstyleStyle] = useState(1);
  const [selectedHairstyleColor, setSelectedHairstyleColor] = useState(2);
  const [selectedEyes, setSelectedEyes] = useState(1);
  const [selectedPremade, setSelectedPremade] = useState<number | null>(null);

  // Imagens carregadas
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Carrega personagens salvos
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('mediquest_characters') || '[]');
    setSavedCharacters(saved);
  }, []);

  // Carrega uma imagem
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  // Direções para sprite sheet (row order: down, left, right, up)
  const directionRow: Record<Direction, number> = {
    down: 0,
    left: 1,
    right: 2,
    up: 3,
  };

  // Renderiza o personagem animado
  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpa canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo gradiente
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.height / 2
    );
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Quadriculado sutil
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 32) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    const basePath = '/assets/limezu/characters';
    const row = directionRow[currentDirection];
    const frame = isAnimating ? Math.floor(frameRef.current / 10) % 4 : 0;

    // Sprite size é 32x32, cada spritesheet tem 12 colunas (3 frames x 4 direções) e 4 rows
    // Layout: 3 frames por direção, 4 direções (down, left, right, up)
    const sx = frame * 32;
    const sy = row * 32;
    const spriteSize = 32;
    const scale = 4; // Escala 4x para melhor visualização
    const dx = (canvas.width - spriteSize * scale) / 2;
    const dy = (canvas.height - spriteSize * scale) / 2 - 20;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, dy + spriteSize * scale - 10, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.imageSmoothingEnabled = false;

    if (selectedPremade) {
      // Desenha personagem pré-feito
      const premadeImg = loadedImages[`${basePath}/premade/Premade_Character_32x32_${String(selectedPremade).padStart(2, '0')}.png`];
      if (premadeImg) {
        ctx.drawImage(premadeImg, sx, sy, spriteSize, spriteSize, dx, dy, spriteSize * scale, spriteSize * scale);
      }
    } else {
      // Desenha as camadas do personagem customizado
      // Body
      const bodyImg = loadedImages[`${basePath}/bodies/Body_32x32_0${selectedBody}.png`];
      if (bodyImg) {
        ctx.drawImage(bodyImg, sx, sy, spriteSize, spriteSize, dx, dy, spriteSize * scale, spriteSize * scale);
      }

      // Outfit
      const outfitNum = String(selectedOutfitStyle).padStart(2, '0');
      const outfitColorNum = String(selectedOutfitColor).padStart(2, '0');
      const outfitImg = loadedImages[`${basePath}/outfits/Outfit_${outfitNum}_32x32_${outfitColorNum}.png`];
      if (outfitImg) {
        ctx.drawImage(outfitImg, sx, sy, spriteSize, spriteSize, dx, dy, spriteSize * scale, spriteSize * scale);
      }

      // Eyes
      const eyesImg = loadedImages[`${basePath}/eyes/Eyes_32x32_0${selectedEyes}.png`];
      if (eyesImg) {
        ctx.drawImage(eyesImg, sx, sy, spriteSize, spriteSize, dx, dy, spriteSize * scale, spriteSize * scale);
      }

      // Hairstyle
      const hairNum = String(selectedHairstyleStyle).padStart(2, '0');
      const hairColorNum = String(selectedHairstyleColor).padStart(2, '0');
      const hairImg = loadedImages[`${basePath}/hairstyles/Hairstyle_${hairNum}_32x32_${hairColorNum}.png`];
      if (hairImg) {
        ctx.drawImage(hairImg, sx, sy, spriteSize, spriteSize, dx, dy, spriteSize * scale, spriteSize * scale);
      }
    }

    // Indicador de direção
    ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(currentDirection.toUpperCase(), canvas.width / 2, canvas.height - 10);

  }, [loadedImages, selectedBody, selectedOutfitStyle, selectedOutfitColor, selectedHairstyleStyle, selectedHairstyleColor, selectedEyes, selectedPremade, currentDirection, isAnimating]);

  // Loop de animação
  useEffect(() => {
    const animate = () => {
      frameRef.current++;
      renderPreview();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [renderPreview]);

  // Carrega imagens quando seleção muda
  useEffect(() => {
    const loadCurrentImages = async () => {
      setIsLoading(true);
      const basePath = '/assets/limezu/characters';

      const imagesToLoad: string[] = [];

      if (selectedPremade) {
        imagesToLoad.push(`${basePath}/premade/Premade_Character_32x32_${String(selectedPremade).padStart(2, '0')}.png`);
      } else {
        imagesToLoad.push(
          `${basePath}/bodies/Body_32x32_0${selectedBody}.png`,
          `${basePath}/outfits/Outfit_${String(selectedOutfitStyle).padStart(2, '0')}_32x32_${String(selectedOutfitColor).padStart(2, '0')}.png`,
          `${basePath}/hairstyles/Hairstyle_${String(selectedHairstyleStyle).padStart(2, '0')}_32x32_${String(selectedHairstyleColor).padStart(2, '0')}.png`,
          `${basePath}/eyes/Eyes_32x32_0${selectedEyes}.png`
        );
      }

      const newImages: Record<string, HTMLImageElement> = { ...loadedImages };

      for (const src of imagesToLoad) {
        if (!newImages[src]) {
          try {
            newImages[src] = await loadImage(src);
          } catch (e) {
            console.warn(`Falha ao carregar: ${src}`);
          }
        }
      }

      setLoadedImages(newImages);
      setIsLoading(false);
    };

    loadCurrentImages();
  }, [selectedBody, selectedOutfitStyle, selectedOutfitColor, selectedHairstyleStyle, selectedHairstyleColor, selectedEyes, selectedPremade, loadImage]);

  // Randomiza personagem
  const randomize = () => {
    setSelectedPremade(null);
    setSelectedBody(Math.floor(Math.random() * 9) + 1);
    const outfitStyle = Math.floor(Math.random() * OUTFIT_STYLES.length) + 1;
    setSelectedOutfitStyle(outfitStyle);
    const maxColors = OUTFIT_STYLES[outfitStyle - 1]?.colors || 4;
    setSelectedOutfitColor(Math.floor(Math.random() * maxColors) + 1);
    const hairStyle = Math.floor(Math.random() * HAIRSTYLE_STYLES.length) + 1;
    setSelectedHairstyleStyle(hairStyle);
    setSelectedHairstyleColor(Math.floor(Math.random() * 7) + 1);
    setSelectedEyes(Math.floor(Math.random() * 7) + 1);
  };

  // Salva personagem
  const saveCharacter = () => {
    const characterData: CharacterData = {
      id: `char_${Date.now()}`,
      name: characterName,
      body: selectedBody,
      outfit: { style: selectedOutfitStyle, color: selectedOutfitColor },
      hairstyle: { style: selectedHairstyleStyle, color: selectedHairstyleColor },
      eyes: selectedEyes,
      isPremade: !!selectedPremade,
      premadeId: selectedPremade || undefined,
    };

    const saved = [...savedCharacters, characterData];
    setSavedCharacters(saved);
    localStorage.setItem('mediquest_characters', JSON.stringify(saved));

    if (onCharacterCreated) {
      onCharacterCreated(characterData);
    }

    alert(`Personagem "${characterName}" salvo!`);
  };

  // Deleta personagem salvo
  const deleteCharacter = (id: string) => {
    const filtered = savedCharacters.filter(c => c.id !== id);
    setSavedCharacters(filtered);
    localStorage.setItem('mediquest_characters', JSON.stringify(filtered));
  };

  // Carrega personagem salvo
  const loadCharacter = (char: CharacterData) => {
    setCharacterName(char.name);
    if (char.isPremade && char.premadeId) {
      setSelectedPremade(char.premadeId);
    } else {
      setSelectedPremade(null);
      setSelectedBody(char.body);
      setSelectedOutfitStyle(char.outfit.style);
      setSelectedOutfitColor(char.outfit.color);
      setSelectedHairstyleStyle(char.hairstyle.style);
      setSelectedHairstyleColor(char.hairstyle.color);
      setSelectedEyes(char.eyes);
    }
    setActiveTab('create');
  };

  // Exporta sprite sheet
  const exportSpriteSheet = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    const basePath = '/assets/limezu/characters';

    // Desenha todas as direções e frames
    if (selectedPremade) {
      const img = loadedImages[`${basePath}/premade/Premade_Character_32x32_${String(selectedPremade).padStart(2, '0')}.png`];
      if (img) {
        ctx.drawImage(img, 0, 0);
      }
    } else {
      const layers = [
        loadedImages[`${basePath}/bodies/Body_32x32_0${selectedBody}.png`],
        loadedImages[`${basePath}/outfits/Outfit_${String(selectedOutfitStyle).padStart(2, '0')}_32x32_${String(selectedOutfitColor).padStart(2, '0')}.png`],
        loadedImages[`${basePath}/eyes/Eyes_32x32_0${selectedEyes}.png`],
        loadedImages[`${basePath}/hairstyles/Hairstyle_${String(selectedHairstyleStyle).padStart(2, '0')}_32x32_${String(selectedHairstyleColor).padStart(2, '0')}.png`],
      ];

      layers.forEach(img => {
        if (img) ctx.drawImage(img, 0, 0);
      });
    }

    const link = document.createElement('a');
    link.download = `${characterName.replace(/\s+/g, '_')}_spritesheet.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-900/50 to-slate-900 border-b border-cyan-500/30">
          <div className="flex items-center gap-4">
            <h2 className="text-cyan-400 text-sm" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              CRIAR PERSONAGEM
            </h2>
            {/* Tabs */}
            <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-3 py-1.5 rounded text-xs transition-all ${
                  activeTab === 'create'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Criar
              </button>
              <button
                onClick={() => setActiveTab('premade')}
                className={`px-3 py-1.5 rounded text-xs transition-all ${
                  activeTab === 'premade'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Prontos ({PREMADE_CHARACTERS.length})
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1.5 rounded text-xs transition-all ${
                  activeTab === 'saved'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Salvos ({savedCharacters.length})
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl px-2">
            ✕
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Preview Panel */}
          <div className="w-80 bg-slate-950 border-r border-slate-700 flex flex-col items-center p-4">
            <canvas
              ref={canvasRef}
              width={256}
              height={256}
              className="rounded-lg border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Controles de direção */}
            <div className="mt-4 flex gap-2">
              {(['down', 'left', 'right', 'up'] as Direction[]).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setCurrentDirection(dir)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center text-lg ${
                    currentDirection === dir
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400'
                      : 'border-slate-600 hover:border-slate-400 bg-slate-800 text-slate-400'
                  }`}
                >
                  {dir === 'down' ? '↓' : dir === 'left' ? '←' : dir === 'right' ? '→' : '↑'}
                </button>
              ))}
            </div>

            {/* Toggle animação */}
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className={`mt-3 px-4 py-2 rounded-lg text-xs transition-all ${
                isAnimating
                  ? 'bg-emerald-600/50 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-700 text-slate-400 border border-slate-600'
              }`}
            >
              {isAnimating ? '⏸ Pausar' : '▶ Animar'}
            </button>

            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="mt-4 w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-center text-sm focus:border-cyan-500 focus:outline-none"
              placeholder="Nome do personagem"
            />

            <div className="flex gap-2 mt-4 w-full">
              <button
                onClick={randomize}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-medium transition-colors border border-purple-400/30 flex items-center justify-center gap-2"
              >
                <PixelIcon type="random" size={14} /> Random
              </button>
              <button
                onClick={saveCharacter}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-xs font-medium transition-colors border border-emerald-400/30 flex items-center justify-center gap-2"
              >
                <PixelIcon type="salvar" size={14} /> Salvar
              </button>
            </div>

            <button
              onClick={exportSpriteSheet}
              className="mt-2 w-full py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-xs font-medium transition-colors border border-amber-400/30 flex items-center justify-center gap-2"
            >
              <PixelIcon type="exportar" size={14} /> Exportar PNG
            </button>

            {isLoading && (
              <p className="mt-2 text-cyan-400 text-xs animate-pulse">Carregando sprites...</p>
            )}
          </div>

          {/* Content Panel */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'create' && (
              <div className="space-y-6">
                {/* Body */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-cyan-400 text-xs font-bold mb-3 flex items-center gap-2">
                    <PixelIcon type="corpo" size={20} />
                    CORPO
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {BODIES.map(body => {
                      const bodyIcons = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
                      const skinTones = ['#ffedd5', '#fde68a', '#fecaca', '#d4a574', '#a78bfa', '#f0abfc', '#fcd34d', '#fca5a5', '#fed7aa'];
                      return (
                        <button
                          key={body.id}
                          onClick={() => { setSelectedBody(body.id); setSelectedPremade(null); }}
                          className={`w-14 h-14 rounded-lg border-2 transition-all flex items-center justify-center ${
                            selectedBody === body.id && !selectedPremade
                              ? 'border-cyan-400 bg-cyan-500/20 scale-110 shadow-lg shadow-cyan-500/20'
                              : 'border-slate-600 hover:border-slate-400 bg-slate-800/50'
                          }`}
                          title={body.name}
                        >
                          <span
                            className="w-8 h-8 rounded flex items-center justify-center text-slate-900 font-bold text-lg"
                            style={{
                              backgroundColor: skinTones[body.id - 1],
                              border: '2px solid rgba(0,0,0,0.2)',
                              boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.15)',
                              fontFamily: '"Press Start 2P", monospace',
                              fontSize: '10px'
                            }}
                          >
                            {bodyIcons[body.id - 1]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Outfit */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-cyan-400 text-xs font-bold mb-3 flex items-center gap-2">
                    <PixelIcon type="roupa" size={20} />
                    ROUPA
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {OUTFIT_STYLES.map(style => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setSelectedOutfitStyle(style.id);
                          setSelectedOutfitColor(1);
                          setSelectedPremade(null);
                        }}
                        className={`px-3 py-2 rounded-lg border-2 text-xs transition-all flex items-center gap-2 ${
                          selectedOutfitStyle === style.id && !selectedPremade
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400'
                            : 'border-slate-600 hover:border-slate-400 bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <PixelIcon type={style.iconType} size={16} />
                        {style.name}
                      </button>
                    ))}
                  </div>

                  <p className="text-slate-400 text-xs mb-2">Cor da roupa:</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: OUTFIT_STYLES[selectedOutfitStyle - 1]?.colors || 4 }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => { setSelectedOutfitColor(i + 1); setSelectedPremade(null); }}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          selectedOutfitColor === i + 1 && !selectedPremade
                            ? 'border-cyan-400 scale-110 shadow-lg'
                            : 'border-slate-600 hover:border-slate-400'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, hsl(${(i * 35) % 360}, 60%, 55%), hsl(${(i * 35) % 360}, 60%, 35%))`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Hair */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-cyan-400 text-xs font-bold mb-3 flex items-center gap-2">
                    <PixelIcon type="cabelo" size={20} />
                    CABELO
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {HAIRSTYLE_STYLES.map(style => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setSelectedHairstyleStyle(style.id);
                          setSelectedHairstyleColor(1);
                          setSelectedPremade(null);
                        }}
                        className={`px-3 py-2 rounded-lg border-2 text-xs transition-all flex items-center gap-2 ${
                          selectedHairstyleStyle === style.id && !selectedPremade
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400'
                            : 'border-slate-600 hover:border-slate-400 bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <PixelIcon type={style.iconType} size={16} />
                        {style.name}
                      </button>
                    ))}
                  </div>

                  <p className="text-slate-400 text-xs mb-2">Cor do cabelo:</p>
                  <div className="flex flex-wrap gap-2">
                    {HAIR_COLORS.map(hc => (
                      <button
                        key={hc.id}
                        onClick={() => { setSelectedHairstyleColor(hc.id); setSelectedPremade(null); }}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          selectedHairstyleColor === hc.id && !selectedPremade
                            ? 'border-cyan-400 scale-110 shadow-lg'
                            : 'border-slate-600 hover:border-slate-400'
                        }`}
                        style={{ backgroundColor: hc.color }}
                        title={hc.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Eyes */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-cyan-400 text-xs font-bold mb-3 flex items-center gap-2">
                    <PixelIcon type="olhos" size={20} />
                    OLHOS
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {EYES.map(eye => {
                      const eyeStyles = [
                        { symbol: '◎', label: 'Normal' },
                        { symbol: '◠', label: 'Feliz' },
                        { symbol: '◡', label: 'Alegre' },
                        { symbol: '—', label: 'Neutro' },
                        { symbol: '−', label: 'Fechado' },
                        { symbol: '?', label: 'Confuso' },
                        { symbol: 'z', label: 'Sono' },
                      ];
                      const style = eyeStyles[eye.id - 1];
                      return (
                        <button
                          key={eye.id}
                          onClick={() => { setSelectedEyes(eye.id); setSelectedPremade(null); }}
                          className={`w-14 h-14 rounded-lg border-2 transition-all flex items-center justify-center ${
                            selectedEyes === eye.id && !selectedPremade
                              ? 'border-cyan-400 bg-cyan-500/20 scale-110 shadow-lg shadow-cyan-500/20'
                              : 'border-slate-600 hover:border-slate-400 bg-slate-800/50'
                          }`}
                          title={style.label}
                        >
                          <span
                            className="w-8 h-8 rounded flex items-center justify-center font-bold"
                            style={{
                              backgroundColor: '#1e293b',
                              color: '#94a3b8',
                              border: '2px solid #334155',
                              fontFamily: 'monospace',
                              fontSize: '18px'
                            }}
                          >
                            {style.symbol}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'premade' && (
              <div>
                <p className="text-slate-400 text-sm mb-4">
                  Selecione um personagem pré-feito para usar imediatamente:
                </p>
                <div className="grid grid-cols-5 gap-3">
                  {PREMADE_CHARACTERS.map(char => (
                    <button
                      key={char.id}
                      onClick={() => {
                        setSelectedPremade(char.id);
                        setCharacterName(`Personagem ${char.id}`);
                      }}
                      className={`aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center p-2 ${
                        selectedPremade === char.id
                          ? 'border-cyan-400 bg-cyan-500/20 scale-105 shadow-lg shadow-cyan-500/20'
                          : 'border-slate-600 hover:border-slate-400 bg-slate-800/50'
                      }`}
                    >
                      <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center mb-1">
                        <img
                          src={`/assets/limezu/characters/premade/${char.file}`}
                          alt={char.name}
                          className="w-12 h-12 object-cover"
                          style={{ imageRendering: 'pixelated', objectPosition: '0 0' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">{char.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'saved' && (
              <div>
                {savedCharacters.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-4 flex justify-center">
                      <PixelIcon type="vazio" size={64} />
                    </div>
                    <p className="text-slate-400">Nenhum personagem salvo ainda.</p>
                    <p className="text-slate-500 text-sm mt-2">
                      Crie e salve personagens na aba "Criar".
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {savedCharacters.map(char => (
                      <div
                        key={char.id}
                        className="bg-slate-800/50 rounded-lg border border-slate-700 p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-cyan-400 text-sm font-medium truncate">
                            {char.name}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => loadCharacter(char)}
                              className="text-emerald-400 hover:text-emerald-300 text-xs px-2 py-1 bg-emerald-500/10 rounded"
                            >
                              Carregar
                            </button>
                            <button
                              onClick={() => deleteCharacter(char.id)}
                              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-500/10 rounded"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {char.isPremade ? `Premade #${char.premadeId}` : 'Customizado'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-800/80 border-t border-slate-700 text-[10px] text-slate-500 flex items-center justify-between">
          <span>
            Assets por{' '}
            <a href="https://limezu.itch.io/moderninteriors" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">
              LimeZu
            </a>
            {' '}- Creditos obrigatorios conforme licenca
          </span>
          <span className="text-slate-600">
            {Object.keys(loadedImages).length} sprites carregados
          </span>
        </div>
      </div>
    </div>
  );
};

export default CharacterGenerator;
