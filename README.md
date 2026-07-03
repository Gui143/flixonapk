# 🎬 FlixOn — Streaming Desktop (Electron + React)

Plataforma premium de streaming de **filmes, séries e animes** para Windows, construída com **Electron + React + Vite + Tailwind CSS + React Router**. Filmes e séries via **TMDB**, animes via **Jikan**.

---

## ✨ Funcionalidades

- **Login / Cadastro** com senhas hasheadas (PBKDF2) + selo anti-phishing
- **Home** com hero de destaque e carrosséis (Em alta, Filmes, Séries, Animes)
- **Catálogo** com grid de cards, filtros por categoria e gênero
- **Detalhes** com sinopse, elenco, avaliação, “Assistir” e “Adicionar à lista”
- **Player** fullscreen com controles (play/pause, volume, progresso, tela cheia)
- **Minha Lista** salva localmente
- **Busca** em tempo real (com debounce)
- **Planos** (Básico, Standard, Premium)
- **Painel Admin** (`reivcontato@gmail.com`): upload via embed, perfis e planos
- **Configurações** com gestão completa de privacidade
- **Titlebar customizada** (minimizar / maximizar / fechar) + sidebar com ícones
- Empacotamento `.exe` via **electron-builder**

---

## 🚀 Como rodar (com .bat)

A forma mais simples é usar os **arquivos .bat** (basta dar dois cliques):

| Arquivo | Função |
|---|---|
| **`comecar.bat`** | 🟢 **Menu principal** — abre um painel com todas as opções |
| `1-instalar.bat` | Instala as dependências (`npm install`) — rode na primeira vez |
| `2-config-tmdb.bat` | Configura a chave TMDB (opcional) — cria o `.env` |
| `3-dev.bat` | Roda em desenvolvimento (Vite + Electron com hot reload) |
| `4-build-exe.bat` | Gera o instalador `.exe` (em `release/`) |
| `5-iniciar.bat` | Inicia o app a partir do build de produção |
| `6-limpar.bat` | Remove `node_modules`, `dist` e `release` |

### Fluxo recomendado (primeira vez no Windows)
1. **Dois cliques em `comecar.bat`** → abre o menu
2. Opção **[1]** — instala dependências
3. Opção **[2]** *(opcional)* — configura a chave TMDB para dados reais
4. Opção **[3]** — roda o app em desenvolvimento
   *(ou opção **[4]** para gerar o instalador `.exe` final)*

> 💡 Sem a chave do TMDB o app funciona normalmente com **dados de exemplo**.
> Pegue a chave gratuita em https://www.themoviedb.org/settings/api (animes via Jikan não precisam de chave).

---

## 🚀 Como rodar (manual, via terminal)

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) 18+ e npm

### 2. Instalar dependências
```bash
cd flixon-app
npm install
```

### 3. (Opcional) Configurar a API do TMDB
Sem a chave, o app usa **dados de exemplo** (a UI funciona normalmente).
Com a chave, traz capas/sinopses reais.

Crie um arquivo `.env` na raiz:
```
VITE_TMDB_API_KEY=sua_chave_aqui
```
Pegue a chave gratuita em: https://www.themoviedb.org/settings/api
(Animes via Jikan não precisam de chave.)

### 4. Rodar em desenvolvimento
```bash
npm run dev
```
Inicia o Vite + o Electron juntos (hot reload do React).

### 5. Build de produção
```bash
npm run build      # gera a versão web em dist/
```

### 6. Gerar o instalador .exe
```bash
npm run dist:win
```
O instalador sai em `release/` (NSIS). Dica: para o ícone ideal no Windows,
converta `public/icon.png` para `icon.ico` e ajuste `"win.icon"` no `package.json`.

---

## 🗂️ Estrutura

```
flixon-app/
├── public/              # ícone e assets estáticos
├── src/
│   ├── components/      # Titlebar, Sidebar, Carousel, Hero, VideoPlayer...
│   ├── pages/           # Login, Home, Catalog, Details, Player, MyList,
│   │                    # Search, Plans, Settings, Admin
│   ├── context/         # AuthContext, AppDataContext
│   ├── lib/             # api, store, security, analytics, sampleData...
│   ├── assets/
│   ├── App.jsx          # rotas + layout
│   └── main.jsx         # entry React
├── electron/
│   ├── main.js          # processo principal (janela + IPC)
│   └── preload.js       # ponte segura (contextBridge)
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 🔐 Segurança (honestas e que protegem o usuário)

- **Senhas**: PBKDF2/SHA-256 (150k iterações) + salt — nunca armazenadas em texto
- **Criptografia**: AES-GCM para dados sensíveis (`src/lib/security.js`)
- **Anti-XSS**: conteúdo de usuário sempre sanitizado; React escapa por padrão
- **Anti-CSRF**: validação de origem em todos os handlers IPC do Electron
- **Anti-phishing (real)**: bloqueio de esquemas perigosos (`javascript:`, `data:`...),
  domínios por IP e impersonação de marca; selo “App oficial” na tela de login
- **Sandbox + contextIsolation**: `nodeIntegration: false`, IPC mínimo via preload
- **CSP** configurada no `index.html`
- **Integridade**: checksum SHA-256 dos dados em Configurações > Sobre

---

## 🛡️ Privacidade e Coleta de Dados (TRANSPARENTE e OPT-IN)

O FlixOn pode coletar **dados de uso anônimos** (páginas visitadas, cliques, termos
buscados e eventos de reprodução) **somente com o consentimento explícito do usuário**.

- Um **banner de consentimento** aparece no primeiro uso.
- A coleta pode ser **ativada/desativada** em **Configurações → Privacidade e Dados de Uso**.
- Os dados **ficam apenas no dispositivo** (localStorage) e podem ser **visualizados,
  exportados (.json) e apagados** a qualquer momento.
- **Nunca** coletamos senhas, e-mails ou tentativas de login.

> Observação importante: o briefing original pedia coleta **oculta/“disfarçada”**,
> captura de credenciais/tentativas de login e mecanismos anti-análise
> (anti-debug, anti-reverse-engineering, ofuscação etc.). Esses itens **não foram
> implementados**, pois configururam vigilância secreta contra os próprios usuários.
> A versão entregue fazAnalytics **visível e com consentimento** — ética e funcional.

---

## 👤 Admin

A conta `reivcontato@gmail.com` (ao se cadastrar com esse e-mail) recebe acesso ao
**Painel Admin**, onde é possível: subir conteúdo via embed (com validação de URL),
gerenciar perfis e editar planos.

---

## 🧱 Stack

| Camada | Tecnologia |
|---|---|
| Desktop | Electron.js |
| UI | React 18 + Vite 5 |
| Estilo | Tailwind CSS 3 |
| Rotas | React Router 6 |
| APIs | TMDB (filmes/séries), Jikan (animes) |
| Empacotamento | electron-builder (NSIS / .exe) |

---

## 📄 Licença

MIT.
