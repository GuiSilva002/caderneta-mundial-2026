# WorldTracker2026

App estatica para acompanhar cromos da caderneta do Mundial 2026, organizada por selecoes.

## Abrir localmente

Abre `index.html` no browser. Nao precisa de instalar dependencias.

Os dados ficam guardados no `localStorage` do browser. Usa `Exportar backup` para guardar um ficheiro JSON e `Importar backup` para restaurar.

Opcionalmente, podes correr:

```bash
node server.mjs
```

## O que ja faz

- Perfis para varias pessoas.
- Tracking de cromos em falta, cromos ja obtidos e repetidos.
- Caderneta base com 980 cromos: 48 selecoes organizadas por equipa e 68 cromos especiais. Total confirmado pela colecao oficial Panini 2026: https://www.panini.es/shp_esp_es/fifa-world-cup-2026-official-sticker-collection-lbum-colecci-n-oficial-panini-005460aew-es01.html
- Lista de selecoes baseada na pagina oficial da FIFA publicada em 31/03/2026: https://www.fifa.com/en/articles/world-cup-2026-who-has-qualified
- Entrada rapida por lista ou intervalo, por exemplo `001, 014, 100-106`.
- Comparacao entre dois colecionadores para sugerir trocas.
- Import/export de backups JSON.
- Import de checklist CSV.
- Geracao de uma lista numerica quando ainda nao ha checklist oficial.

## CSV da checklist

O import aceita CSV com cabecalho:

```csv
code,section,name
001,Africa do Sul,Emblema - Africa do Sul
002,Africa do Sul,Foto da equipa - Africa do Sul
723,Portugal,Emblema - Portugal
724,Portugal,Foto da equipa - Portugal
913,Abertura,Logotipo oficial
```

Tambem aceita `;` como separador.

## Publicar online

Como a app e estatica, podes publicar a pasta diretamente em GitHub Pages, Netlify, Vercel ou Cloudflare Pages.

### GitHub Pages sem terminal

1. Cria um repositorio novo no GitHub, por exemplo `caderneta-mundial-2026`.
2. Escolhe `Public` se quiseres usar GitHub Pages no plano gratis normal.
3. No repositorio, clica em `Add file` > `Upload files`.
4. Faz upload destes ficheiros e pastas:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `server.mjs`
   - `.nojekyll`
   - `data/`
   - `README.md`
5. Clica em `Commit changes`.
6. Vai a `Settings` > `Pages`.
7. Em `Build and deployment`, escolhe:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
8. Guarda. O GitHub vai criar um link parecido com:

```text
https://teu-utilizador.github.io/caderneta-mundial-2026/
```

Para usar com outras pessoas em tempo real, o proximo passo e trocar o `localStorage` por backend. Um caminho simples:

1. Criar autenticacao.
2. Guardar `collectors`, `stickers` e `inventory` numa base de dados.
3. Substituir as funcoes `loadState()` e `saveState()` em `app.js` por chamadas ao backend.
4. Manter o JSON export/import como backup manual.
