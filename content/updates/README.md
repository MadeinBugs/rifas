# Novidades / Updates

Cada atualização é uma pasta aqui dentro, nomeada assim:

```
AAAA-MM-DD-um-slug-curto
```

Exemplo: `2026-07-05-primeira-quimio`.

- A **data** (`AAAA-MM-DD`) define a ordem (mais recente primeiro) e a data
  exibida na página.
- O **slug** (o resto do nome) vira o endereço:
  `/novidades/um-slug-curto` (PT) e `/updates/um-slug-curto` (EN).

Dentro da pasta, coloque um ou dois arquivos:

- `pt.md` — versão em português (aparece em salveosuspiro.vercel.app)
- `en.md` — versão em inglês (aparece em savesuspiro.vercel.app)

Uma atualização só aparece no idioma cujo arquivo existir. Você pode publicar
só em PT, só em EN, ou nos dois.

> **Publicar = commit + deploy.** As novidades fazem parte do código do site;
> ao enviar os arquivos e fazer o deploy, elas aparecem online.

## Frontmatter (topo do arquivo)

```md
---
titulo: "Título da atualização"
resumo: "Um resumo curto que aparece no cartão da lista."
capa: "/updates/meu-slug/capa.jpg"
---
```

- `titulo` (**obrigatório**) — título exibido.
- `resumo` (opcional) — texto que aparece no cartão da listagem.
- `capa` (opcional) — imagem em miniatura do cartão.

## Corpo (markdown)

Depois do frontmatter, escreva normalmente em markdown: títulos (`##`),
**negrito**, _itálico_, listas, links, citações (`>`), tabelas, etc.

### Imagens

Coloque o arquivo em `public/updates/<slug>/` e referencie pelo caminho
começando em `/updates/`:

```md
![Descrição da imagem](/updates/<slug>/foto.jpg)
```

### Vídeo enviado por você (arquivo .mp4)

Coloque o vídeo em `public/updates/<slug>/` e cole no meio do texto:

```html
<video class="video-embed" controls preload="metadata" src="/updates/<slug>/video.mp4"></video>
```

### Vídeo do YouTube

Copie o ID do vídeo (a parte depois de `watch?v=` no link do YouTube) e cole:

```html
<iframe
  class="video-embed"
  src="https://www.youtube.com/embed/VIDEO_ID"
  title="YouTube"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen
></iframe>
```

A classe `video-embed` deixa o YouTube responsivo (proporção 16:9) e dá o
mesmo acabamento arredondado das imagens.

## Dicas

- As mídias de cada atualização ficam organizadas em uma pasta própria dentro
  de `public/updates/<slug>/`, com o mesmo slug da pasta de conteúdo.
- Você pode reaproveitar fotos que já existem em `public/photos/` — basta usar
  o caminho delas (ex.: `/photos/saudavel/retrato-1.jpeg`).
- A pasta `2026-07-05-primeira-atualizacao/` é um exemplo: sinta-se à vontade
  para editá-la ou apagá-la quando publicar a novidade de verdade.
