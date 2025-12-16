# MediQuest / GRANADO - Configuracao do Projeto

## Informacoes do Projeto

**Nome:** MediQuest (codinome GRANADO)
**Tipo:** RPG educacional de anestesiologia
**Estilo Visual:** Pixel art 16-bit SNES
**Stack:** React + TypeScript + Vite + TailwindCSS

## APIs e Servicos Externos

### Leonardo AI
- **Proposito:** Geracao de sprites e cenarios pixel art
- **API Key Storage:** localStorage (chave: `leonardo_api_key`)
- **Inicializacao:** Automatica ao carregar o app (`loadLeonardoApiKey()`)
- **Configurar:** Botao "LEONARDO AI" no jogo → colar API key
- **Obter key:** https://app.leonardo.ai/settings

### Modelo Leonardo Recomendado
- Pixel Art: `ac614f96-1082-45bf-be9d-757f2d31c174` (Leonardo Diffusion)

## Estrutura do Projeto

```
/components
  - GameEngine.tsx         # Motor do jogo (canvas 2D, baloes de fala)
  - MapEditor.tsx          # Editor visual de mapas
  - Inventory.tsx          # Sistema de inventario RPG
  - LeonardoGenerator.tsx  # Interface para Leonardo AI
  - ClinicalCaseViewer.tsx # Casos clinicos educacionais
  - SpeechBubble.tsx       # Componente de baloes de fala
  - RPGDialogueBox.tsx     # Dialogos com NPCs
  - CharacterGenerator.tsx
  - SpriteGenerator.tsx
  - ModeSelector.tsx

/services
  - leonardoAI.ts          # Integracao com API Leonardo
  - dialogueManager.ts     # Gerenciador de dialogos e baloes
  - clinicalCases.ts       # Sistema de casos clinicos
  - mapStorage.ts          # Salvar/carregar mapas

/types.ts                  # Todos os tipos (TileType, Items, etc.)
/constants.ts              # Mapa do hospital, configuracoes
```

## Mapa do Hospital

- **Dimensoes:** 80x60 tiles (32x32 pixels cada)
- **15 Salas de Cirurgia** com especialidades:
  1. Cirurgia Geral
  2. Cirurgia Cardiaca
  3. Ortopedia
  4. Neurocirurgia
  5. Urologia
  6. Oftalmologia
  7. Obstetricia
  8. Laparoscopia
  9. Vascular
  10. Toracica
  11. Plastica
  12. Otorrino
  13. Pediatria
  14. Emergencia
  15. Transplante

- **Areas:** UTI, CRPA, Copa, Refeitorio, Recepcao, Farmacia, Esterilizacao

## Equipamentos Medicos (65+ tipos)

### Anestesia
- Aparelho de anestesia, Monitor multiparametro, Ventilador
- BIS, Capnografo, Bomba de seringa/infusao
- Carrinho de via aerea, Desfibrilador, Crash cart

### Especialidades
- CEC, BIA, Cell Saver (Cardiaca)
- Arco em C, Torre artroscopia (Ortopedia)
- Microscopio, Navegacao (Neuro)
- Torre laparoscopia, Insuflador (Laparo)
- etc.

## Sistema de Inventario

- **33 items pre-definidos** (medicamentos, equipamentos, documentos)
- **Tecla [I]** para abrir inventario
- **Categorias:** Medicamentos, Equipamentos, Documentos, Suprimentos, Consumiveis
- **Raridades:** comum, incomum, raro, epico

## Sistema de Baloes de Fala

- **Chatter Ambiental:** NPCs falam automaticamente quando o player esta proximo
- **Saudacao:** NPCs cumprimentam ao interagir
- **Canvas Rendering:** Baloes desenhados diretamente no canvas com estilo SNES
- **DialogueManager:** `services/dialogueManager.ts` gerencia filas e timing

## Sistema de Casos Clinicos

- **Localizacao:** `services/clinicalCases.ts` + `components/ClinicalCaseViewer.tsx`
- **Botao:** "CASOS" no canto superior direito
- **Casos disponiveis:**
  1. Colecistectomia Laparoscopica (Beginner)
  2. Revascularizacao Miocardica com CEC (Advanced)
- **Estrutura de um caso:**
  - Informacoes do paciente (idade, peso, ASA, alergias, comorbidades)
  - Sinais vitais e exames laboratoriais
  - Decisoes pre-operatorias com feedback
  - Eventos intraoperatorios com complicacoes
  - Pontuacao e objetivos de aprendizado

## Efeitos Visuais e Animacoes

- **Particulas de Poeira:** Spawn automatico ao andar, gravidade leve, fade-out
- **Animacao de Respiracao (Idle):** Personagens sobem/descem suavemente quando parados
- **Luzes Pulsantes:** Equipamentos medicos (monitores, desfibrilador, CEC) com glow animado
- **Sombras Dinamicas:** Escala com animacao de respiracao
- **Vinheta:** Efeito escuro nas bordas da tela
- **Y-Sorting:** Depth sorting correto para entidades

### Equipamentos com Glow Animado
- Maquina de Anestesia (verde)
- Monitor Multiparametro (verde)
- Ventilador (verde)
- Desfibrilador (vermelho)
- Monitor BIS (verde)
- Maquina de CEC (azul)
- Monitor Fetal (rosa)

## Controles do Jogo

- **WASD / Setas:** Mover
- **SPACE / ENTER:** Interagir/Falar
- **I:** Inventario
- **ESC:** Fechar menus

## Comandos de Build

```bash
npm run dev      # Desenvolvimento
npm run build    # Producao
npm run preview  # Preview do build
```

## Notas para Novos Chats

1. **Leonardo API:** Ja configurada para carregar automaticamente do localStorage
2. **Estilo GRANADO:** Prompts otimizados em `services/leonardoAI.ts`
3. **Economia de tokens:** Usar templates e modificar com Canvas do Leonardo
4. **Mapa grande:** 80x60 tiles com 15 ORs especializadas
5. **Pixel art programatico:** Equipamentos desenhados em canvas (nao sprites)

## Links Uteis

- Leonardo AI: https://app.leonardo.ai
- Documentacao Leonardo API: https://docs.leonardo.ai
- LimeZu Assets: https://limezu.itch.io/moderninteriors
