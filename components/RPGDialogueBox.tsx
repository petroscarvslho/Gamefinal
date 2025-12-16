/**
 * RPGDialogueBox - Caixa de diálogo estilo SNES/Pokemon
 * Aparece na parte inferior da tela com nome do personagem e texto animado
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { NPC } from '../types';
import { generateNPCDialogue } from '../services/gemini';
import { dialogueManager } from '../services/dialogueManager';

interface RPGDialogueBoxProps {
  npc: NPC;
  onClose: () => void;
}

const RPGDialogueBox: React.FC<RPGDialogueBoxProps> = ({ npc, onClose }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [fullText, setFullText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showContinue, setShowContinue] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const typewriterRef = useRef<number | null>(null);

  // Velocidade de digitação (ms por caractere)
  const TYPING_SPEED = 30;

  // Efeito de digitação (typewriter)
  const typeText = useCallback((text: string) => {
    setFullText(text);
    setDisplayedText('');
    setIsTyping(true);
    setShowContinue(false);

    let index = 0;
    const type = () => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
        typewriterRef.current = window.setTimeout(type, TYPING_SPEED);
      } else {
        setIsTyping(false);
        setShowContinue(true);
      }
    };
    type();
  }, []);

  // Pula a animação de digitação
  const skipTyping = useCallback(() => {
    if (typewriterRef.current) {
      clearTimeout(typewriterRef.current);
      typewriterRef.current = null;
    }
    setDisplayedText(fullText);
    setIsTyping(false);
    setShowContinue(true);
  }, [fullText]);

  // Busca greeting inicial
  useEffect(() => {
    const fetchGreeting = async () => {
      setIsLoading(true);
      const greeting = await generateNPCDialogue(npc, "Olá", []);
      setMessages([greeting]);
      typeText(greeting);
      setIsLoading(false);

      // Adiciona balão flutuante
      dialogueManager.addBubble(npc.id, greeting.slice(0, 50) + (greeting.length > 50 ? '...' : ''), 0, 0, 4000);
    };
    fetchGreeting();

    return () => {
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
    };
  }, [npc, typeText]);

  // Envia mensagem do jogador
  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    setInputText('');
    setInputMode(false);

    // Mostra balão do player
    dialogueManager.addBubble('player', userMsg.slice(0, 40), 0, 0, 2500);

    setIsLoading(true);
    setShowContinue(false);

    const history = [...messages, userMsg];
    const reply = await generateNPCDialogue(npc, userMsg, history);

    setMessages(prev => [...prev, userMsg, reply]);
    typeText(reply);
    setIsLoading(false);

    // Mostra balão do NPC
    dialogueManager.addBubble(npc.id, reply.slice(0, 50) + (reply.length > 50 ? '...' : ''), 0, 0, 4000);
  };

  // Controles de teclado
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (inputMode) {
      if (e.key === 'Escape') {
        setInputMode(false);
      }
      return;
    }

    if (e.key === ' ' || e.key === 'Enter' || e.key === 'z' || e.key === 'Z') {
      e.preventDefault();
      if (isTyping) {
        skipTyping();
      } else if (showContinue) {
        setInputMode(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }

    if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
      e.preventDefault();
      onClose();
    }
  }, [isTyping, showContinue, inputMode, skipTyping, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Foco no input quando ativado
  useEffect(() => {
    if (inputMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputMode]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 pointer-events-none">
      {/* Container principal */}
      <div className="max-w-3xl mx-auto pointer-events-auto">
        {/* Caixa de diálogo estilo SNES */}
        <div
          className="relative bg-[#0a0a1a] border-4 border-[#fbbf24] rounded-lg shadow-[0_0_0_2px_#0a0a1a,0_0_0_4px_#fbbf24,0_8px_32px_rgba(0,0,0,0.5)]"
          style={{
            background: 'linear-gradient(180deg, #0f172a 0%, #0a0a1a 100%)',
          }}
        >
          {/* Borda interna decorativa */}
          <div className="absolute inset-2 border border-[#fbbf24]/20 rounded pointer-events-none" />

          {/* Nome do personagem (tag no topo) */}
          <div className="absolute -top-4 left-4 px-3 py-1 bg-[#fbbf24] rounded-t-md">
            <span className="text-[#0a0a1a] font-bold text-xs tracking-wider uppercase" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              {npc.name}
            </span>
          </div>

          {/* Role badge */}
          <div className="absolute -top-4 right-4 px-2 py-1 bg-[#1e3a8a] border border-[#60a5fa] rounded-t-md">
            <span className="text-[#60a5fa] text-[8px] tracking-wider uppercase" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              {npc.role}
            </span>
          </div>

          {/* Conteúdo */}
          <div className="p-6 pt-8">
            {/* Área de texto */}
            <div className="min-h-[80px]">
              {isLoading && !displayedText ? (
                <div className="flex items-center gap-2">
                  <span className="text-[#fbbf24] animate-pulse" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
                    . . .
                  </span>
                </div>
              ) : (
                <p
                  className="text-white leading-relaxed"
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '11px',
                    lineHeight: '1.8',
                    textShadow: '2px 2px 0 rgba(0,0,0,0.5)'
                  }}
                >
                  {displayedText}
                  {isTyping && (
                    <span className="inline-block w-2 h-3 bg-[#fbbf24] ml-1 animate-pulse" />
                  )}
                </p>
              )}
            </div>

            {/* Input do jogador (quando ativo) */}
            {inputMode && (
              <div className="mt-4 flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSend();
                    }
                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      setInputMode(false);
                    }
                  }}
                  placeholder="Digite sua resposta..."
                  className="flex-1 bg-[#1e293b] border-2 border-[#60a5fa] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-[#fbbf24]"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !inputText.trim()}
                  className="px-4 py-2 bg-[#fbbf24] text-[#0a0a1a] font-bold rounded disabled:opacity-50 hover:bg-[#fcd34d] transition-colors"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
                >
                  ENVIAR
                </button>
              </div>
            )}

            {/* Indicadores de ação */}
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#fbbf24]/20">
              {/* Prompt de continuar */}
              {showContinue && !inputMode && (
                <div className="flex items-center gap-2 animate-pulse">
                  <span
                    className="text-[#fbbf24]"
                    style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
                  >
                    [SPACE] Responder
                  </span>
                  <span className="text-[#fbbf24] animate-bounce">▼</span>
                </div>
              )}
              {inputMode && (
                <span
                  className="text-[#60a5fa]"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
                >
                  [ENTER] Enviar | [ESC] Cancelar
                </span>
              )}
              {isTyping && (
                <span
                  className="text-[#60a5fa]"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
                >
                  [SPACE] Pular
                </span>
              )}

              {/* Botão fechar */}
              <button
                onClick={onClose}
                className="text-[#94a3b8] hover:text-[#fbbf24] transition-colors"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
              >
                [X] Fechar
              </button>
            </div>
          </div>

          {/* Decoração de cantos (estilo SNES) */}
          <div className="absolute top-1 left-1 w-2 h-2 border-l-2 border-t-2 border-[#fbbf24]/40" />
          <div className="absolute top-1 right-1 w-2 h-2 border-r-2 border-t-2 border-[#fbbf24]/40" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-l-2 border-b-2 border-[#fbbf24]/40" />
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-[#fbbf24]/40" />
        </div>
      </div>
    </div>
  );
};

export default RPGDialogueBox;
