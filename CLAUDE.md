# MediQuest - Projeto de Jogo Hospital RPG

**Última atualização:** 2025-12-16

## ⚠️ IMPORTANTE - ANTES DE FECHAR O CHAT
Sempre atualize este arquivo (CLAUDE.md) e o arquivo `/Users/priscoleao/iniciar_novo_terminal.txt` com o estado atual do projeto antes de encerrar a sessão.

## Localização do Projeto
```
/Users/priscoleao/Gamefinal
```

## Comandos Importantes
```bash
cd /Users/priscoleao/Gamefinal
npm run dev          # Inicia servidor de desenvolvimento (porta 3001)
npm run build        # Build de produção
```

## Tecnologias
- React + TypeScript
- Vite
- Tailwind CSS
- Canvas 2D para renderização do jogo

## Estrutura Principal
```
/Users/priscoleao/Gamefinal/
├── App.tsx                    # Componente principal
├── components/
│   ├── GameEngine.tsx         # Motor do jogo (renderização, movimento)
│   ├── TilePicker.tsx         # Ferramenta visual de mapeamento de tiles
│   ├── MapEditor.tsx          # Editor de mapas
│   ├── CharacterGenerator.tsx # Criador de personagens
│   └── ...
├── services/
│   └── tilesetManager.ts      # Gerenciador de sprites LimeZu
├── public/assets/limezu/      # Assets de sprites
│   └── interiors/
│       ├── Hospital_32x32.png     # Equipamentos médicos (16x110 tiles)
│       ├── Room_Builder_32x32.png # Paredes, pisos, portas (76x113 tiles)
│       ├── Interiors_32x32.png    # Móveis gerais
│       ├── Generic_32x32.png      # Itens genéricos
│       └── Bathroom_32x32.png     # Banheiro
└── types.ts                   # Tipos TypeScript (TileType, NPC, etc.)
```

## Assets LimeZu (Comprados)
Localização completa dos assets:
```
/Users/priscoleao/Downloads/moderninteriors-win 3/
├── 1_Interiors/32x32/          # Tilesets
├── 2_Characters/               # Personagens
├── 3_Animated_objects/         # Objetos animados
├── 4_User_Interface_Elements/  # UI
└── 6_Home_Designs/             # Designs prontos
```

## Mapeamento de Tiles
Os mapeamentos de sprites são definidos em:
- `/Users/priscoleao/Gamefinal/services/tilesetManager.ts`
- Mapeamentos customizados salvos em localStorage (chave: 'tilePicker_mappings')

## Funcionalidades do Jogo
- Movimentação WASD/Setas
- Interação com NPCs (SPACE)
- Mini-mapa (toggle com M)
- Inventário (I)
- Sistema de partículas
- Balões de fala dos NPCs
- Iluminação por zona

## Para Capturar Screenshots (macOS)
```bash
screencapture -x /tmp/game_screenshot.png
```

## URLs
- Jogo: http://localhost:3001/
- Preview de Tiles: http://localhost:3001/tile-preview.html

## Changelog

### 2024-12-16 (Atualização 2)
- **Layout do Hospital Compacto (35x45 tiles):**
  - Novo mapa baseado na referência LimeZu
  - Recepção, corredores, quartos, farmácia, enfermaria, sala de espera
  - Área administrativa e entrada principal

- **Sprite Sheets Separados:**
  - Adicionado `Room_Builder_Floors_32x32.png` para pisos
  - Adicionado `Room_Builder_Walls_32x32.png` para paredes
  - Adicionado `Hospital_Theme_32x32.png` para referência

- **Mapeamento Correto de Pisos e Paredes (FINAL v2):**
  - Piso cinza claro hospital: floors x:1, y:33
  - Piso creme sala cirúrgica: floors x:1, y:1
  - Parede branca hospital: walls x:0, y:2
  - Porta: roomBuilder x:47, y:86

- **Correção importante no GameEngine:**
  - Sprites LimeZu agora são renderizados PRIMEIRO (antes do fallback canvas)
  - Mapa agora usa mapRef.current (editável) em vez de INITIAL_MAP

- **Modo Construção:**
  - Botão "MODO CONSTRUÇÃO" adicionado acima de "Editor de Mapas"
  - Permite editar tiles clicando diretamente no mapa
  - UI com seleção de tile (Piso, Parede, Centro Cir., Porta)

- **UX Melhorada:**
  - Jogo inicia direto no modo história
  - Modo construção acessível pelo botão "Editor de Mapas"

### 2024-12-16
- **Melhorias Visuais:**
  - Adicionado sistema de câmera suave com interpolação
  - Implementado mini-mapa no canto superior direito (toggle com M)
  - Sistema de iluminação por zona (CC azul, UTI quente, espera aconchegante)
  - Sistema de partículas aprimorado (poeira + sparkles)
  - Feedback visual de interação com NPCs (highlight pulsante, seta, nome)

- **TilePicker:**
  - Ferramenta visual para mapear sprites LimeZu
  - Salva mapeamentos no localStorage
  - Integração com tilesetManager

- **Mapeamento de Sprites:**
  - 40+ mapeamentos de equipamentos médicos do Hospital_32x32.png
  - Camas, monitores, máquinas de anestesia, carrinhos, etc.
  - Sistema de fallback canvas para tiles não mapeados

- **Referências:**
  - Imagem de referência salva: `/public/assets/reference_hospital.png`
  - Estilo visual baseado no LimeZu Modern Interiors

## Próximos Passos
- [x] ~~Melhorar mapeamento de paredes e pisos do Room_Builder~~
- [x] ~~Recriar layout do mapa baseado na referência~~
- [x] ~~Criar Editor de Cenas avançado~~
- [ ] Adicionar mais animações aos equipamentos (usando 3_Animated_objects)
- [ ] Melhorar textura das paredes com sistema de auto-tiling
- [ ] Adicionar mais NPCs com diálogos específicos
- [ ] Integrar minigames do PixelMed Pro

### 2024-12-16 (Atualização 3 - Editor de Cenas)
- **Editor de Cenas Completo** (`/components/SceneEditor.tsx`):
  - Seletor visual de tiles de TODOS os sprite sheets LimeZu
  - Sistema de camadas (Chão e Objetos)
  - Ferramentas: Pintar, Apagar, Adicionar NPC, Colisão, Spawn Point
  - Templates de NPCs (Médico, Enfermeira, Cirurgião, Anestesista, etc.)
  - Sistema de múltiplas cenas com templates
  - Salvar/Carregar projetos no localStorage
  - Exportar código para uso no jogo
  - Zoom configurável (0.5x a 2x)
  - Grid e visualização de colisões
  - Brush configurável (1x1, 3x3, 5x5)

- **Acesso:**
  - Botão "EDITOR DE CENAS" (roxo) no lado direito do jogo

- **Tile Preview** melhorado (`/public/tile-preview.html`):
  - Tabs para todos os sprite sheets
  - Zoom, navegação por linha
  - Preview e código para copiar

### 2024-12-16 (Atualização 4 - Simplificação da Interface)
- **Menu "CRIE SEU JOGO" Simplificado:**
  - Apenas 2 opções: "CRIAR MAPA" e "EDITOR DE CENAS (NPCs)"
  - Removido botão "LEONARDO AI" (não é mais necessário)
  - Removido botão standalone "GERAR SPRITES (AI)"

- **MapCreator Completo** (`/components/MapCreator.tsx`):
  - Editor de mapas visual com todas as tiles LimeZu
  - Categorias: Pisos, Paredes, Hospital, Móveis, Objetos, Banheiro, Construção
  - Ferramentas: Pincel, Borracha com tamanhos configuráveis (1, 3, 5, 7)
  - Zoom, grid toggle, pan de câmera
  - Novo/Abrir/Salvar mapas no localStorage
  - **"GERAR SPRITES (AI)" integrado** - agora está dentro do editor de mapas

- **SceneEditor Focado em NPCs** (`/components/SceneEditor.tsx`):
  - Removidas todas as opções de tiles
  - Apenas para adicionar NPCs em mapas existentes
  - 47+ templates de NPCs organizados por categoria
  - Seção "ESCOLHA UM MAPA" para carregar mapas salvos

- **Estrutura Atualizada:**
  ```
  components/
  ├── MapCreator.tsx       # NOVO - Editor completo de mapas + GERAR SPRITES
  ├── SceneEditor.tsx      # Modificado - Apenas NPCs
  ├── SpriteGenerator.tsx  # Gerador de sprites PixelLab (chamado pelo MapCreator)
  └── ...
  ```

### 2025-12-16 (Atualização 5 - MapCreator v3 Enhanced)
- **MapCreator v3 - Melhorias de UX:**
  - **Canvas Limpo:** Mapa inicia vazio com padrão xadrez escuro (sem quadrados brancos feios)
  - **Tiles Vazios:** Sistema de tiles vazios `[-1, 0, 0]` para áreas não pintadas
  - **Undo/Redo:** Histórico de 50 estados com Ctrl+Z e Ctrl+Shift+Z
  - **Toast Notifications:** Feedback visual para ações (salvar, carregar, undo/redo)
  - **Mini-mapa:** Navegação rápida com indicador de viewport (toggle com M)
  - **Coordenadas:** Exibe posição do cursor no mapa (📍 x, y)
  - **Cursor Preview:** Visualização do tile antes de pintar (transparência 50%)
  - **Eraser Preview:** Contorno tracejado vermelho ao apagar
  - **Tiles Recentes:** Aba com últimas 16 tiles usadas (salvo no localStorage)
  - **Fill Tool:** Ferramenta balde para preencher áreas (tecla F)
  - **Zoom com Ctrl+Scroll:** Zoom suave no mapa

- **Atalhos de Teclado:**
  - `B` - Pincel
  - `E` - Borracha
  - `F` - Balde (fill)
  - `G` - Toggle grid
  - `M` - Toggle mini-mapa
  - `1-4` - Tamanho do pincel (1, 3, 5, 7)
  - `+/-` - Zoom
  - `Ctrl+Z` - Desfazer
  - `Ctrl+Shift+Z` - Refazer
  - `Ctrl+S` - Salvar mapa
  - `ESC` - Fechar modais

- **Correções de Bugs:**
  - Canvas ref callbacks não causam mais re-renders
  - Scroll do tile selector limitado ao tamanho da imagem
  - Câmera não ultrapassa limites do mapa
  - Deletar mapas salvos funciona corretamente
