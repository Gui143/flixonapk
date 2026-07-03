# 📱 FlixOn — Gerar APK na Nuvem (sem Android Studio)

Seu PC é fraco e não roda Android Studio? **Sem problema!** Este guia usa o **GitHub Actions** (gratuito) para compilar o APK nos servidores do GitHub. Você só sobe os arquivos e baixa o APK pronto.

> ⏱️ Tempo total: ~15 min de configuração + ~10 min de build na nuvem

---

## ✅ O que você vai precisar (só uma vez)

1. **Conta no GitHub** (grátis): https://github.com/signup
2. **Git** instalado (se não tiver: https://git-scm.com — next, next, finish)

> O repositório pode ser **privado** (ninguém vê seu código) ou **público**. Ambos rodam o build grátis.

---

## 🚀 Passo a passo

### Passo 1 — Criar o repositório no GitHub

1. Acesse https://github.com/new
2. **Repository name:** `flixon`
3. Escolha **Private** (recomendado) ou **Public**
4. **NÃO** marque "Add a README"
5. Clique em **Create repository**

O GitHub vai te mostrar comandos. **Anote** a URL do repo (algo como `https://github.com/SEU_USUARIO/flixon.git`).

### Passo 2 — Habilitar o GitHub Actions (repo privado)

> Se o repo for **público**, pule este passo (já vem liberado).

Para repo **privado** na conta gratuita:
1. Vá em **Settings → Actions → General**
2. Em "Actions permissions", marque **"Allow all actions and reusable workflows"**
3. Clique em **Save**

### Passo 3 — Subir os arquivos do projeto

Abra o terminal/prompt na pasta `flixon-app` e rode (substitua `SEU_USUARIO`):

```bash
cd flixon-app

# Inicializa o Git
git init
git branch -M main

# Adiciona todos os arquivos (o .gitignore ignora node_modules, release, etc.)
git add .

# Primeiro commit
git commit -m "FlixOn - app de streaming"

# Conecta ao seu repositório (TROQUE PELA SUA URL)
git remote add origin https://github.com/SEU_USUARIO/flixon.git

# Sobe os arquivos
git push -u origin main
```

> 💡 Vai pedir seu usuário/senha do GitHub. Use um **Personal Access Token** como senha (Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token, marque `repo`).

> 📦 Se a pasta for muito grande e der erro de tamanho, faça em partes ou use o **GitHub Desktop** (app gráfico): https://desktop.github.com

### Passo 4 — Disparar o build na nuvem

Assim que o `push` terminar, o build **começa automaticamente**.

Para acompanhar:
1. Vá no seu repo no GitHub
2. Clique na aba **Actions**
3. Você verá "📱 Build Android APK" rodando (círculo amarelo girando)
4. Aguarde ~10 minutos (círculo verde ✓ quando terminar)

> 💡 Também pode disparar manualmente: aba **Actions** → "📱 Build Android APK" → **Run workflow**

### Passo 5 — Baixar o APK pronto 🎉

1. Na aba **Actions**, clique no build concluído (verde)
2. Role até o final da página → seção **Artifacts**
3. Baixe **`FlixOn-debug`** (para testar) ou **`FlixOn-release`** (assinado)
4. Será um `.zip` — extraia e você terá o **`.apk`**
5. Passe pro celular e instale! (ative "Fontes desconhecidas" no Android)

---

## 🏷️ Publicar na aba Releases (opcional, mais fácil de baixar)

Para que o APK apareça numa página pública de download (com link direto):

```bash
# Crie uma tag de versão
git tag v1.0.0
git push origin v1.0.0
```

O build roda e o APK vai direto pra aba **Releases** do seu repo. Aí é só compartilhar o link!

---

## ❓ Resolução de problemas

**Build falhou (X vermelho)?**
- Clique no build → leia o erro em vermelho
- Erro de "keystore": me avise que eu ajusto o workflow
- Erro de "cache": rode novamente (Run workflow)

**APK não instala no celular?**
- Confirme que ativou "Fontes desconhecidas" (Configurações → Segurança)
- Android muito antigo (< 5.1)? Não suporta (mínimo API 22)

**Quero mudar a versão do APK:**
- Edite `android/app/build.gradle`: `versionCode` (sempre aumente) e `versionName`
- Faça commit + push → build novo roda

---

## 📊 Resumo do que o workflow faz

| Step | O que acontece |
|---|---|
| 1-4 | Instala Node 18, Java 17 e Android SDK |
| 5 | `npm ci` (instala dependências) |
| 6 | `vite build` (compila a interface) |
| 7 | `cap sync` (copia pro projeto Android) |
| 8 | Cache do Gradle (acelera) |
| 9 | `gradlew assembleDebug` (APK de teste) |
| 10 | `gradlew assembleRelease` (APK otimizado) |
| 11 | Assina o APK de release |
| 12-13 | Publica como artifact (baixável) |
| 14 | Se for tag `v*`, publica na aba Releases |

**Custo:** GRÁTIS (2000 minutos/mês no plano free para repositórios privados; ilimitado para públicos).

**Compatibilidade:** Android 5.1+ (API 22), 32-bit (armeabi-v7a) e 64-bit (arm64-v8a).
