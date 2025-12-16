# Diário de Progresso - MediQuest

---

## Sessão 5 - 16/12/2025

### O que foi feito:
- **MapCreator v3 Enhanced**
  - Canvas limpo (sem quadrados brancos feios)
  - Tiles vazios representados como `[-1, 0, 0]`
  - Mini-mapa com indicador de viewport (toggle M)
  - Undo/Redo com histórico de 50 estados
  - Toast notifications para feedback
  - Tiles recentes (últimas 16 usadas)
  - Cursor preview antes de pintar
  - Eraser preview com contorno tracejado
  - Fill tool (balde) para preencher áreas
  - Zoom com Ctrl+Scroll
  - Coordenadas do cursor exibidas

### Arquivos modificados:
- `components/MapCreator.tsx` - Editor de mapas v3
- `CLAUDE.md` - Documentação atualizada
- `iniciar_novo_terminal.txt` - Texto para continuar

### Commit:
- Hash: `2509c87`
- Mensagem: feat: MapCreator v3 Enhanced + melhorias de UX

### Próxima sessão:
- [ ] Melhorar coordenadas de pisos/paredes
- [ ] Sistema de auto-tiling
- [ ] Mais NPCs com diálogos

---

## Sessão 4 - 16/12/2025

### O que foi feito:
- Menu "CRIE SEU JOGO" simplificado (2 opções)
- MapCreator integrado com SpriteGenerator
- SceneEditor focado apenas em NPCs
- Removido botão LEONARDO AI

---

## Sessão 3 - 16/12/2025

### O que foi feito:
- SceneEditor completo
- 47+ templates de NPCs
- Sistema de camadas (Chão e Objetos)
- Salvar/Carregar projetos

---

## Sessão 2 - 16/12/2024

### O que foi feito:
- Layout compacto do hospital (35x45 tiles)
- Modo construção
- Mapeamento correto de pisos e paredes LimeZu

---

## Sessão 1 - 16/12/2024

### O que foi feito:
- Estrutura inicial do projeto
- TilePicker para mapear sprites
- GameEngine básico
- Sistema de câmera suave
- Mini-mapa do jogo
