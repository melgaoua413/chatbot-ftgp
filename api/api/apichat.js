import { createClient } from "@supabase/supabase-js";

const KNOWLEDGE_BASE = [
  {
    topic: "presentation",
    content: `French Tech Grand Paris est une association loi 1901 et une Communauté labellisée French Tech.
Elle accompagne les startups et PME innovantes du territoire Grand Paris : Paris, Hauts-de-Seine, 
Seine-Saint-Denis, Val-de-Marne, Essonne, Val-d'Oise, Seine-et-Marne, Yvelines.
Site web : https://www.frenchtechgrandparis.com
Contact : contact@frenchtechgrandparis.com`,
  },
  {
    topic: "track-ia",
    content: `Track IA est le programme d'accompagnement dédié à l'Intelligence Artificielle.
4 piliers : Sensibilisation (événements, contenus), Formation (ateliers pratiques), 
Expérimentation (POC avec startups IA), Mise en réseau (connexion grands groupes / startups).
Il s'adresse aux startups, PME et grands groupes du territoire.`,
  },
  {
    topic: "hiit",
    content: `HIIT (Health Innovation Intensive Training) est un programme d'accélération MedTech/HealthTech 
sous le Haut Patronage du Président de la République, sponsorisé par Dr. Olivier Véran.
24 startups sélectionnées par un jury d'experts. Programme intensif avec mentorat, 
mise en réseau hospitalière, et préparation au financement.`,
  },
  {
    topic: "gen50tech",
    content: `Gen50Tech est une initiative contre l'âgisme dans la tech.
Objectif : valoriser les talents de 50+ ans dans le numérique et l'innovation.
Le programme propose un réseau d'ambassadeurs, des événements dédiés, 
et une charte d'engagement signée par les entreprises membres.`,
  },
  {
    topic: "tremplin",
    content: `French Tech Tremplin est un programme d'entrepreneuriat de 2 mois intensifs 
pour les porteurs de projets issus de la diversité.
Il offre un accompagnement personnalisé, du mentorat, et un accès au réseau French Tech.`,
  },
  {
    topic: "adhesion",
    content: `L'adhésion à French Tech Grand Paris est annuelle.
Elle donne accès à : tous les programmes (Track IA, HIIT, Gen50Tech, Tremplin), 
les événements exclusifs, le réseau de startups membres, 
la visibilité dans l'écosystème (annuaire, communications).
Pour adhérer, rendez-vous sur le site : https://www.frenchtechgrandparis.com`,
  },
  {
    topic: "evenements",
    content: `French Tech Grand Paris organise régulièrement :
- Soirées networking et BizDev thématiques
- HealthTech Day (PariSanté Campus)
- Participation au salon VivaTech (village French Tech Grand Paris)
- Conférences sur l'IA, la santé numérique, l'innovation
- Adopt AI : salon dédié à l'adoption de l'IA en entreprise`,
  },
];

const SYSTEM_PROMPT = `Tu es l'assistant officiel de French Tech Grand Paris. 

RÈGLES STRICTES :
- Réponds UNIQUEMENT en français.
- Sois concis : 2-4 phrases max, sauf si on te demande plus de détails.
- Ton professionnel mais chaleureux, pas corporate, pas robotique.
- Si tu ne connais pas la réponse → dis-le honnêtement et oriente vers contact@frenchtechgrandparis.com
- Ne fabrique JAMAIS d'information. Utilise uniquement le contexte fourni.
- Si la question sort du périmètre French Tech Grand Paris → décline poliment et recentre.
- Ne mentionne jamais que tu utilises un "contexte" ou des "documents". Réponds naturellement.

CONTEXTE (utilise ces informations pour répondre) :
{context}`;

function findRelevantChunks(query, topK = 3) {
  const queryLower = query.toLowerCase();
  const scored = KNOWLEDGE_BASE.map((chunk) => {
    const words = chunk.content.toLowerCase().split(/\s+/);
    const queryWords = queryLower.split(/\s+/);
    let score = 0;
    for (const qw of queryWords) {
      if (qw.length < 3) continue;
      if (chunk.topic.includes(qw)) score += 5;
      for (const w of words) {
        if (w.includes(qw) || qw.includes(w)) score += 1;
      }
    }
    const keywords = {
      "track-ia": ["ia", "intelligence", "artificielle", "ai", "track"],
      hiit: ["hiit", "santé", "health", "medtech", "healthtech", "médical"],
      gen50tech: ["50", "senior", "âge", "agisme", "gen50"],
      tremplin: ["tremplin", "diversité", "entrepreneuriat"],
      adhesion: ["adhésion", "adhérer", "membre", "inscription", "rejoindre", "prix", "tarif", "coût"],
      evenements: ["événement", "event", "soirée", "vivatech", "salon", "conférence"],
      presentation: ["qui", "quoi", "présentation", "c'est quoi", "french tech"],
    };
    for (const [topic, kws] of Object.entries(keywords)) {
      if (chunk.topic === topic) {
        for (const kw of kws) {
          if (queryLower.includes(kw)) score += 10;
        }
      }
    }
    return { ...chunk, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((c) => c.score > 0)
    .map((c) => c.content);
}

let supabase = null;
function getSupabase() {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  }
  return supabase;
}

async function logConversation(sessionId, question, answer) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("chat_logs").insert({
      session_id: sessionId,
      question,
      answer,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Supabase log error:", e);
  }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, session_id, history = [] } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const relevantChunks = findRelevantChunks(message);
    const context =
      relevantChunks.length > 0
        ? relevantChunks.join("\n\n---\n\n")
        : "Aucune information spécifique trouvée. Réponds de manière générale sur French Tech Grand Paris.";

    const systemPrompt = SYSTEM_PROMPT.replace("{context}", context);

    const messages = [];
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: "user", content: message });

    const mistralResponse = await fetch(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          max_tokens: 500,
          temperature: 0.3,
        }),
      }
    );

    if (!mistralResponse.ok) {
      const errText = await mistralResponse.text();
      console.error("Mistral API error:", errText);
      return res.status(502).json({
        error: "Erreur du service IA",
        reply:
          "Désolé, je rencontre un problème technique. Contactez-nous à contact@frenchtechgrandparis.com",
      });
    }

    const data = await mistralResponse.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "Désolé, je n'ai pas pu générer de réponse.";

    const sid = session_id || "anonymous-" + Date.now();
    logConversation(sid, message, reply);

    return res.status(200).json({
      reply,
      session_id: sid,
    });
  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({
      error: "Internal error",
      reply:
        "Désolé, une erreur est survenue. Contactez-nous à contact@frenchtechgrandparis.com",
    });
  }
}
