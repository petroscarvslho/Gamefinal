# MediQuest — Fluxo de Atualizações e Deploy

Use este guia em toda sessão de trabalho (novo chat ou agente).

## Antes de começar
- Ler `MEDIQUEST_LOG.md` para entender estado atual e próximos passos.
- Não alterar nada do projeto PixelMed (está em outra pasta/escopo).
- Garantir que a chave de IA (`GEMINI_API_KEY` ou `API_KEY`) esteja no `.env.local` se for testar diálogos.

## Ao fazer mudanças
1) Documentar o que foi feito em `MEDIQUEST_LOG.md` (o que, por quê, arquivos afetados).
2) `git status` para conferir alterações.
3) `git add .`
4) `git commit -m "<mensagem curta>"`  
   Exemplos:  
   - `feat: highlight interativo e sprites refinados`  
   - `chore: ajustar HUD e documentação`
5) `git push` (remoto já configurado para `https://github.com/petroscarvslho/Gamefinal.git`).

## Scripts úteis
- Instalar deps: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`

## Convenções
- Commits pequenos e descritivos.
- Manter UI/UX consistente com o estilo retrô já aplicado (Press Start 2P em detalhes, Space Grotesk no texto).
- Evitar adicionar dependências pesadas; se adicionar, registre no log e justifique.

## Checklist de encerramento de sessão
- Log atualizado (`MEDIQUEST_LOG.md`).
- Testes básicos (rodar `npm run dev` e verificar tela inicial/dialogue) se possível.
- `git status` limpo após push.
