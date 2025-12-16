/**
 * DialogueManager - Sistema de diálogos estilo SNES/Pokemon
 * Gerencia filas de diálogo, balões de fala e sequências narrativas
 */

export interface DialogueLine {
  speaker: string;        // ID do NPC ou 'player'
  speakerName: string;    // Nome para exibir
  text: string;           // Texto do diálogo
  duration?: number;      // Duração em ms (auto-calculado se não fornecido)
  emotion?: 'normal' | 'happy' | 'sad' | 'angry' | 'surprised';
}

export interface DialogueSequence {
  id: string;
  lines: DialogueLine[];
  onComplete?: () => void;
  onLineChange?: (lineIndex: number) => void;
}

export interface ActiveBubble {
  id: string;
  speakerId: string;
  text: string;
  x: number;
  y: number;
  startTime: number;
  duration: number;
  opacity: number;
}

type DialogueCallback = (line: DialogueLine | null, index: number) => void;

class DialogueManager {
  private currentSequence: DialogueSequence | null = null;
  private currentLineIndex: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private activeBubbles: ActiveBubble[] = [];
  private bubbleIdCounter: number = 0;
  private listeners: Set<DialogueCallback> = new Set();
  private autoAdvance: boolean = false;
  private lineStartTime: number = 0;

  // Configurações
  private readonly CHARS_PER_SECOND = 30; // Velocidade de leitura
  private readonly MIN_DURATION = 2000;   // Mínimo 2 segundos por linha
  private readonly MAX_DURATION = 8000;   // Máximo 8 segundos
  private readonly BUBBLE_FADE_TIME = 300; // Tempo de fade do balão

  /**
   * Inicia uma sequência de diálogo
   */
  startSequence(sequence: DialogueSequence, autoAdvance: boolean = false): void {
    this.currentSequence = sequence;
    this.currentLineIndex = 0;
    this.isPlaying = true;
    this.isPaused = false;
    this.autoAdvance = autoAdvance;
    this.showCurrentLine();
  }

  /**
   * Avança para a próxima linha
   */
  nextLine(): boolean {
    if (!this.currentSequence || !this.isPlaying) return false;

    this.currentLineIndex++;

    if (this.currentLineIndex >= this.currentSequence.lines.length) {
      this.endSequence();
      return false;
    }

    this.currentSequence.onLineChange?.(this.currentLineIndex);
    this.showCurrentLine();
    return true;
  }

  /**
   * Volta para a linha anterior
   */
  previousLine(): boolean {
    if (!this.currentSequence || this.currentLineIndex <= 0) return false;

    this.currentLineIndex--;
    this.showCurrentLine();
    return true;
  }

  /**
   * Mostra a linha atual
   */
  private showCurrentLine(): void {
    if (!this.currentSequence) return;

    const line = this.currentSequence.lines[this.currentLineIndex];
    this.lineStartTime = Date.now();
    this.notifyListeners(line, this.currentLineIndex);
  }

  /**
   * Finaliza a sequência atual
   */
  endSequence(): void {
    const sequence = this.currentSequence;
    this.currentSequence = null;
    this.currentLineIndex = 0;
    this.isPlaying = false;
    this.notifyListeners(null, -1);
    sequence?.onComplete?.();
  }

  /**
   * Pula toda a sequência
   */
  skipSequence(): void {
    this.endSequence();
  }

  /**
   * Pausa/Resume o diálogo
   */
  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  /**
   * Adiciona um balão de fala flutuante (para balões acima dos NPCs)
   */
  addBubble(speakerId: string, text: string, x: number, y: number, duration?: number): string {
    const id = `bubble_${this.bubbleIdCounter++}`;
    const calculatedDuration = duration || this.calculateDuration(text);

    this.activeBubbles.push({
      id,
      speakerId,
      text,
      x,
      y,
      startTime: Date.now(),
      duration: calculatedDuration,
      opacity: 1
    });

    return id;
  }

  /**
   * Remove um balão específico
   */
  removeBubble(id: string): void {
    this.activeBubbles = this.activeBubbles.filter(b => b.id !== id);
  }

  /**
   * Remove todos os balões de um speaker
   */
  removeBubblesBySpeaker(speakerId: string): void {
    this.activeBubbles = this.activeBubbles.filter(b => b.speakerId !== speakerId);
  }

  /**
   * Atualiza os balões (chamar a cada frame)
   */
  updateBubbles(): ActiveBubble[] {
    const now = Date.now();

    this.activeBubbles = this.activeBubbles.filter(bubble => {
      const elapsed = now - bubble.startTime;

      // Calcula opacidade para fade out
      if (elapsed > bubble.duration - this.BUBBLE_FADE_TIME) {
        bubble.opacity = Math.max(0, 1 - (elapsed - (bubble.duration - this.BUBBLE_FADE_TIME)) / this.BUBBLE_FADE_TIME);
      }

      return elapsed < bubble.duration;
    });

    // Auto-advance se configurado
    if (this.autoAdvance && this.isPlaying && !this.isPaused && this.currentSequence) {
      const line = this.currentSequence.lines[this.currentLineIndex];
      const duration = line.duration || this.calculateDuration(line.text);
      if (Date.now() - this.lineStartTime > duration) {
        this.nextLine();
      }
    }

    return this.activeBubbles;
  }

  /**
   * Calcula duração baseada no tamanho do texto
   */
  calculateDuration(text: string): number {
    const baseTime = (text.length / this.CHARS_PER_SECOND) * 1000;
    return Math.min(Math.max(baseTime, this.MIN_DURATION), this.MAX_DURATION);
  }

  /**
   * Registra um listener para mudanças de diálogo
   */
  addListener(callback: DialogueCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notifica todos os listeners
   */
  private notifyListeners(line: DialogueLine | null, index: number): void {
    this.listeners.forEach(cb => cb(line, index));
  }

  // Getters
  get currentLine(): DialogueLine | null {
    return this.currentSequence?.lines[this.currentLineIndex] || null;
  }

  get lineIndex(): number {
    return this.currentLineIndex;
  }

  get totalLines(): number {
    return this.currentSequence?.lines.length || 0;
  }

  get playing(): boolean {
    return this.isPlaying;
  }

  get paused(): boolean {
    return this.isPaused;
  }

  get bubbles(): ActiveBubble[] {
    return this.activeBubbles;
  }

  /**
   * Cria uma sequência de diálogo simples
   */
  static createSimpleSequence(
    id: string,
    lines: Array<{ speaker: string; name: string; text: string }>,
    onComplete?: () => void
  ): DialogueSequence {
    return {
      id,
      lines: lines.map(l => ({
        speaker: l.speaker,
        speakerName: l.name,
        text: l.text
      })),
      onComplete
    };
  }
}

// Singleton
export const dialogueManager = new DialogueManager();
export default dialogueManager;
