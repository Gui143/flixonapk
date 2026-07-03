# 📱 FlixOn — Versão Android (APK)

Guia para gerar o `.apk` do FlixOn. **Não altera a versão de PC** — o mesmo código serve para desktop (Electron) e mobile (Capacitor), com mudanças condicionais.

> ⚠️ **Android mínimo: 5.1 (API 22)**. Android 4.4 (API 19) é impossível com React 18/hls.js/Supabase — a engine do WebView 4.4 (Chromium 30) não roda JavaScript moderno. API 22 cobre ~99% dos Androids ativos.

---

## ✅ Pré-requisitos (uma vez no seu PC)

1. **[Android Studio](https://developer.android.com/studio)** (instala o Android SDK + JDK + Gradle automaticamente)
2. **Node.js 18+** (mesmo que já usa pra versão de PC)

---

## 🚀 Gerar o APK (passo a passo)

### 1. Instalar dependências
```bash
cd flixon-app
npm install
```

### 2. Compilar a interface e sincronizar com o Android
```bash
npm run cap:sync
```
Isso roda o `vite build` e copia o resultado para dentro do projeto Android.

### 3. Abrir no Android Studio
```bash
npm run cap:open
```
(Ou abra a pasta `flixon-app/android` no Android Studio.)

### 4. Na primeira vez, o Gradle baixa dependências (~aguarde)

### 5. Gerar o APK
**Opção A — APK de debug (rápido, para testar):**
- No Android Studio: menu **Build → Build Bundle(s)/APK(s) → Build APK(s)**
- Ou na linha de comando:
```bash
npm run apk:debug
```
- O APK sai em `android/app/build/outputs/apk/debug/app-debug.apk`

**Opção B — APK de release (assinado, para distribuir):**
- No Android Studio: **Build → Generate Signed Bundle / APK → APK**
- Crie uma keystore (guarde a senha!) e assine
- Ou (sem assinatura, só pra testar em outro celular):
```bash
npm run apk:release
```
- O APK sai em `android/app/build/outputs/apk/release/app-release-unsigned.apk`

### 6. Instalar no celular
Passe o `.apk` pro celular e instale (ative "Fontes desconhecidas" nas configurações do Android).

---

## ⚙️ Otimizações já aplicadas

| Otimização | Efeito |
|---|---|
| `minifyEnabled` + `shrinkResources` | APK menor |
| `abiFilters: armeabi-v7a, arm64-v8a` | Suporte a **32-bit** + leve (sem x86) |
| WebView fullscreen imersivo | Sem barra de título |
| `usesCleartextTraffic` + `allowMixedContent` | Players de embed funcionam |
| UI responsiva | Navegação inferior, toque otimizado |
| minSdk 22 | Roda em aparelhos antigos/fracos |

---

## 🎨 Trocar o ícone do app (opcional)

Coloque um `icon.png` (1024×1024) e um `splash.png` (2732×2732) na pasta `assets/`, depois:
```bash
npm install -D @capacitor/assets
npx @capacitor/assets generate
npm run cap:sync
```

---

## 🔌 Webhook do Discord (alerta de novo conteúdo)

O alerta dispara **automaticamente** quando você cadastra um filme no Painel Admin. O link do webhook **nunca fica no APK** — fica como segredo no Supabase.

### 1. Configurar o segredo do webhook
No Supabase: **Project Settings → Edge Functions → Add secret**
- Name: `DISCORD_WEBHOOK_URL`
- Value: *cole aqui a URL do seu webhook do Discord* (Botão direito num canal do Discord → Integrations → Webhooks → Copy URL)

### 2. Deploy da função
```bash
# Instale a CLI do Supabase (uma vez)
npm install -g supabase

# Login + link
supabase login
supabase link --project-ref xblsyamjutnxhwzwncpo

# Deploy da função
supabase functions deploy notify-new-content --no-verify-jwt
```

A função está em `supabase/functions/notify-new-content/index.ts`.

### 3. Criar o gatilho (Database Webhook)
No Supabase: **Database → Webhooks → Create a new hook**
- Name: `notify-new-content`
- Table: `content`
- Events: `Insert`
- Webhook URL (Edge Function): `https://xblsyamjutnxhwzwncpo.supabase.co/functions/v1/notify-new-content`
- HTTP method: `POST`

A partir de agora, todo filme/série/anime/canal que você criar no admin envia **automaticamente** um card pro Discord com: **nome, capa, sinopse, ano e classificação indicativa**.

---

## 🧩 Notas técnicas

- **Embeds (fembed, etc.)**: o WebView do Android costuma ser mais permissivo com `X-Frame-Options` que o navegador de PC, então os players devem funcionar. Se um host específico bloquear, é limitação do host.
- **Login/Perfis**: o mesmo backend Supabase — a conta e os perfis funcionam tanto no PC quanto no Android.
- **Versão de PC**: **não foi alterada**. `npm run dist:win` continua gerando o `.exe` exatamente como antes.
