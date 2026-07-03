// ═══════════════════════════════════════════════════════════
//  FlixOn — Notificação de Novo Conteúdo (Discord Webhook)
//  Supabase Edge Function (Deno)
//
//  COMO FUNCIONA:
//  - Disparada AUTOMATICAMENTE quando um filme/série/anime/canal
//    é inserido na tabela "content" (via Supabase Database Webhook).
//  - Monta um Discord Embed com: Nome, Capa, Sinopse, Ano e
//    Classificação Indicativa.
//  - O link do webhook NUNCA vai para o APK — fica como SECRET
//    no Supabase (DISCORD_WEBHOOK_URL).
// ═══════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Cores das classificações indicativas (mesmas do app)
const AGE_COLORS: Record<string, number> = {
  L: 0x00a859,
  "10": 0x00aeef,
  "12": 0xfff200,
  "14": 0xf26522,
  "16": 0xed1c24,
  "18": 0x000000,
};
const TYPE_LABEL: Record<string, string> = {
  movie: "🎬 Filme",
  tv: "📺 Série",
  anime: "🌸 Anime",
  channel: "📡 Canal",
};

Deno.serve(async (req) => {
  // Aceita apenas POST (do Database Webhook do Supabase)
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!WEBHOOK_URL) {
    return new Response("Webhook não configurado (DISCORD_WEBHOOK_URL)", {
      status: 500,
    });
  }

  try {
    // O payload do Supabase Database Webhook vem no corpo
    const body = await req.json();
    const record = body?.record || body?.new || body;
    if (!record) {
      return new Response("Sem registro", { status: 400 });
    }

    // Apenas dispara em INSERT (não em UPDATE/DELETE)
    const type = body?.type || "";
    if (type && type !== "INSERT" && type !== "insert") {
      return new Response("Ignorado (não é INSERT)", { status: 200 });
    }

    const title = record.title || "Novo conteúdo";
    const typeLabel = TYPE_LABEL[record.type] || "Conteúdo";
    const year = record.year ? ` • ${record.year}` : "";
    const age = record.age_rating ? ` • Classificação ${record.age_rating}` : "";
    const poster = record.poster || null;
    const overview =
      (record.overview || "").slice(0, 350) || "Sem sinopse disponível.";
    const ageColor = record.age_rating
      ? AGE_COLORS[String(record.age_rating)] || 0x7c3aed
      : 0x7c3aed;

    // Monta o embed no padrão Discord
    const payload: any = {
      username: "FlixOn",
      embeds: [
        {
          title: `🆕 ${title}`,
          description: overview,
          color: ageColor,
          fields: [
            { name: "Tipo", value: typeLabel, inline: true },
            ...(record.year ? [{ name: "Ano", value: String(record.year), inline: true }] : []),
            ...(record.age_rating ? [{ name: "Classificação", value: String(record.age_rating), inline: true }] : []),
          ],
          footer: { text: "FlixOn • Novo conteúdo adicionado" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Adiciona a imagem da capa, se existir
    if (poster) {
      payload.embeds[0].image = { url: poster };
    }

    // Envia para o Discord
    const resp = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return new Response(`Erro Discord: ${resp.status} ${txt}`, {
        status: 502,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, sent: title }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(`Erro: ${String(e)}`, { status: 500 });
  }
});
