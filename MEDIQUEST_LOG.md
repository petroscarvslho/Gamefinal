# MediQuest RPG — Log & Instruções para agentes

> **Regra:** Sempre que abrir um novo chat sobre este projeto, leia este arquivo antes de qualquer coisa. Documente aqui toda mudança relevante (UI, lógica, build, deps, setup). Não altere nem se relacione ao projeto PixelMed; são projetos distintos.

## Informações rápidas
- **Nome do projeto:** MediQuest (hospital top‑down RPG)
- **Stack:** React + Vite + TypeScript; canvas 2D para mapa/sprites.
- **Pasta base:** `mediquest-rpg`
- **Chave de IA:** use `GEMINI_API_KEY` (ou `API_KEY`) em `.env.local` para diálogos.
- **Script dev:** `npm install` → `npm run dev`
- **Build:** `npm run build`
- **Objetivo:** Polir UI/UX, interações e arte do RPG hospitalar; deixar pronto para deploy.

## Instruções para o fluxo de trabalho
1) Atualize este `MEDIQUEST_LOG.md` a cada alteração significativa (o que foi feito, por quê, arquivos afetados).
2) Não mexer em `pixelmed-v3.html` ou em qualquer coisa do PixelMed; são projetos separados.
3) Manter git organizado: commits pequenos e descritivos. Se criar remotos, registrar aqui a URL.
4) Se adicionar dependências, anotar a razão e qualquer passo extra de setup.
5) Ao finalizar uma sessão, liste “Próximos passos” para o próximo agente.

## Histórico de sessões

### Sessão 2 — 2024-12-15
**O que foi feito:**
- Adicionado `WORKFLOW.md` com checklist de commits/push, convenções e scripts.
- Registrado fluxo para novos agentes: ler este log, documentar mudanças e sempre fazer push.

**Arquivos tocados:** `WORKFLOW.md`, `MEDIQUEST_LOG.md`.

**Próximos passos sugeridos:**
- Seguir o workflow (log → commit → push) em toda alteração.
- Continuar melhorias de UI/arte e interação conforme sessão 1.

### Sessão 3 — 2024-12-15
**O que foi feito:**
- Importado assets do pacote LimeZu (Modern Interiors) para uso futuro no mapa.
- Copiados tiles de interiores 32x32 (`Interiors_32x32.png` e `Room_Builder_32x32.png`) para `assets/limezu/interiors/`.
- Engine agora usa spritesheet para piso/parede/porta (Room_Builder_32x32). Fallback mantém formas antigas se sprites não carregarem.

**Arquivos tocados:** `assets/limezu/interiors/Interiors_32x32.png`, `assets/limezu/interiors/Room_Builder_32x32.png`, `MEDIQUEST_LOG.md`.

**Próximos passos sugeridos:**
- Mapear coordenadas dos tiles e substituir o drawTile para usar spritesheet (manter `TILE_SIZE=32`).
- Selecionar subset (paredes, pisos, cadeiras, camas, portas) para o mapa atual.
- Opcional: adicionar assets de personagens/objetos se necessário.

### Sessão 1 — 2024-12-15
**O que foi feito:**
- UI base: fundo com gradientes, fonte Space Grotesk para texto geral e Press Start 2P para detalhes retrô.
- Overlay/HUD: cartão de controles estilizado, badge de status “pronto para interação”, hint mobile mais polido.
- Diálogo: modal redesenhado com vidro escuro, bordas ciano, balões com contraste e input mais legível.
- Canvas: piso com checker sutil para profundidade e prompt “FALAR [SPACE]” sobre NPC mais próximo no raio.
- Gemini: aceita `GEMINI_API_KEY` além de `API_KEY` em `services/gemini.ts`.
- Repositório: projeto copiado para `mediquest-rpg` (espaço de trabalho write), `git init` criado aqui.

**Arquivos tocados:** `index.html`, `App.tsx`, `components/DialogueBox.tsx`, `components/GameEngine.tsx`, `services/gemini.ts`, `.gitignore` (já existia), novo `MEDIQUEST_LOG.md`.

**Próximos passos sugeridos:**
- Refinar sprites de player/NPC (variação de cabelos/roupas), destacar objetos interativos (portas/mesas) com outline animado.
- Ajustar colisão fina e movimento (suavizar aceleração ou velocidade diagonal).
- Criar uma paleta de UI consistente em um arquivo de tema e reduzir uso de Tailwind CDN se quiser bundling puro.
- Adicionar estados de “missão” ou pequenos objetivos para guiar o jogador.
