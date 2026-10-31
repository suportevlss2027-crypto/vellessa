# Vellessa Afiliados — Plataforma de membros

Plataforma de membros para afiliados da Vellessa, com visual premium nas cores da marca (creme e dourado), temas claro/escuro e conteúdo de exemplo.

## Como rodar no seu computador

1. Instale o [Node.js](https://nodejs.org) (versão 20 ou mais recente).
2. Abra o terminal na pasta do projeto e rode:

```sh
npm install
npm run dev
```

3. Acesse http://localhost:5173 no navegador.

> O arquivo `src/routeTree.gen.ts` é gerado automaticamente ao rodar o projeto — não precisa existir no pacote nem ser editado à mão.

## Estrutura

- `src/routes/` — páginas: Entrar (`/`), Início (`/painel`), Aulas (`/aulas`), Criativos (`/criativos`), Links e materiais (`/materiais`), Comunidade (`/comunidade`) e Perfil (`/perfil`).
- `src/data/content.ts` — todo o conteúdo de exemplo (aulas, criativos, links, avisos). Edite aqui para trocar textos, links e materiais pelos seus.
- `src/assets/` — foto do produto e capas usadas nas telas.
- `src/styles.css` — cores da marca, temas claro/escuro e gradientes dourados.

## Publicar na internet

Para publicar com um clique, abra o projeto em https://lovable.dev e use o botão Publicar.
