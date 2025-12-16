# MediQuest - Projeto de Jogo Hospital RPG

**Última atualização:** 2024-12-16

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

- **Mapeamento Correto de Pisos e Paredes:**
  - Piso bege quadriculado (floors x:4, y:4)
  - Piso azulejo branco para sala cirúrgica (floors x:0, y:0)
  - Parede textura bege/creme hospital (walls x:2, y:4)

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
- [ ] Adicionar mais animações aos equipamentos (usando 3_Animated_objects)
- [ ] Melhorar textura das paredes com sistema de auto-tiling
- [ ] Adicionar mais NPCs com diálogos específicos
- [ ] Integrar minigames do PixelMed Pro
