import React, { useEffect, useState } from 'react';

interface SpeechBubbleProps {
  text: string;
  speakerName?: string;
  x: number;
  y: number;
  opacity?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  emotion?: 'normal' | 'happy' | 'sad' | 'angry' | 'surprised';
  maxWidth?: number;
  onComplete?: () => void;
}

// Emoticons por emocao
const EMOTION_ICONS: Record<string, string> = {
  normal: '',
  happy: '',
  sad: '',
  angry: '!',
  surprised: '?!',
};

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  speakerName,
  x,
  y,
  opacity = 1,
  direction = 'up',
  emotion = 'normal',
  maxWidth = 200,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Efeito de digitacao (typewriter)
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
        onComplete?.();
      }
    }, 30); // 30ms por caractere

    return () => clearInterval(interval);
  }, [text, onComplete]);

  // Calcular posicao do "rabo" do balao baseado na direcao
  const getTailStyle = () => {
    const base = {
      position: 'absolute' as const,
      width: 0,
      height: 0,
    };

    switch (direction) {
      case 'down':
        return {
          ...base,
          bottom: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '10px solid rgba(15, 23, 42, 0.95)',
        };
      case 'up':
        return {
          ...base,
          top: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '10px solid rgba(15, 23, 42, 0.95)',
        };
      case 'left':
        return {
          ...base,
          left: -10,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderRight: '10px solid rgba(15, 23, 42, 0.95)',
        };
      case 'right':
        return {
          ...base,
          right: -10,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderLeft: '10px solid rgba(15, 23, 42, 0.95)',
        };
    }
  };

  // Cor de borda baseada na emocao
  const getEmotionBorder = () => {
    switch (emotion) {
      case 'happy': return 'border-emerald-400/60';
      case 'sad': return 'border-blue-400/60';
      case 'angry': return 'border-red-400/60';
      case 'surprised': return 'border-amber-400/60';
      default: return 'border-cyan-400/40';
    }
  };

  return (
    <div
      className="absolute z-40 pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -100%)',
        opacity,
        transition: 'opacity 0.3s ease-out',
      }}
    >
      {/* Balao principal */}
      <div
        className={`
          relative bg-slate-900/95 backdrop-blur-sm
          border-2 ${getEmotionBorder()}
          rounded-lg px-3 py-2
          shadow-[0_4px_20px_rgba(0,0,0,0.5)]
        `}
        style={{
          maxWidth,
          fontFamily: '"Press Start 2P", monospace',
        }}
      >
        {/* Nome do speaker */}
        {speakerName && (
          <div className="text-[8px] text-cyan-300 mb-1 border-b border-slate-700/50 pb-1">
            {speakerName}
            {emotion !== 'normal' && (
              <span className="ml-2 text-amber-300">{EMOTION_ICONS[emotion]}</span>
            )}
          </div>
        )}

        {/* Texto com efeito typewriter */}
        <div className="text-[10px] text-white leading-relaxed">
          {displayedText}
          {isTyping && (
            <span className="inline-block w-2 h-3 bg-white/80 ml-0.5 animate-pulse" />
          )}
        </div>

        {/* Rabo do balao */}
        <div style={getTailStyle()} />

        {/* Borda pixelada decorativa (cantos) */}
        <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 border-cyan-300/30 rounded-tl" />
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 border-cyan-300/30 rounded-tr" />
        <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 border-cyan-300/30 rounded-bl" />
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 border-cyan-300/30 rounded-br" />
      </div>
    </div>
  );
};

// Componente para renderizar multiplos baloes
interface BubbleData {
  id: string;
  text: string;
  speakerName?: string;
  x: number;
  y: number;
  opacity: number;
  emotion?: 'normal' | 'happy' | 'sad' | 'angry' | 'surprised';
}

interface SpeechBubblesLayerProps {
  bubbles: BubbleData[];
  offsetX?: number;
  offsetY?: number;
}

export const SpeechBubblesLayer: React.FC<SpeechBubblesLayerProps> = ({
  bubbles,
  offsetX = 0,
  offsetY = 0,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {bubbles.map((bubble) => (
        <SpeechBubble
          key={bubble.id}
          text={bubble.text}
          speakerName={bubble.speakerName}
          x={bubble.x + offsetX}
          y={bubble.y + offsetY}
          opacity={bubble.opacity}
          emotion={bubble.emotion}
          direction="down"
        />
      ))}
    </div>
  );
};

export default SpeechBubble;
