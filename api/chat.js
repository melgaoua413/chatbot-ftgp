const { createClient } = require("@supabase/supabase-js");

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
sous le Haut Patronage du Président de la République.
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
Pour adhérer : https://www.frenchtechgrandparis.com`,
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
RÈGLES : Réponds UNIQUEMENT en français. Sois concis (2-4 phrases). 
Ton professionnel mais chaleureux. Si tu ne sais pas, oriente vers contact@frenchtechgrandparis.com.
Ne fabrique jamais d'information. Utilise uniquement le contexte fourni.
CONTEXTE : {context}`;

function findRelevantChunks(query) {
  var queryLower = query.toLowerCase();
  var scored = KNOWLEDGE_BASE.map(function(chunk) {
    var words = chunk.content.toLowerCase().split(/\s+/);
    var queryWords = queryLower.split(/\s+/);
    var score = 0;
    for (var i = 0; i < queryWords.length; i++) {
      var qw = queryWords[i];
      if (qw.length < 3) continue;
      if (chunk.topic.includes(qw)) score += 5;
      for (var j = 0; j < words.length; j++) {
        if (words[j].includes(qw) || qw.includes(words[j])) score += 1;
      }
    }
    var keywords = {
      "track-ia": ["ia", "intelligence", "artificielle", "ai", "track"],
      "hiit": ["hiit", "sante", "health", "medtech", "healthtech"],
      "gen50tech": ["50", "senior", "age", "agisme", "gen50"],
      "tremplin": ["tremplin", "diversite", "entrepreneuriat"],
      "adhesion": ["adhesion", "adherer", "membre", "inscription", "rejoindre", "prix", "tarif"],
      "evenements": ["evenement", "event", "soiree", "vivatech", "salon", "conference"],
      "presentation": ["qui", "quoi", "presentation", "french tech"],
    };
    var kws = keywords[chunk.topic] || [];
    for (var k = 0; k < kws.length; k++) {
      if (queryLower.includes(kws[k])) score += 10;
    }
    return { content: chunk.content, score: score };
  });
  return scored
    .sort(function(a, b) { return b.score - a.score; })
    .slice(0, 3)
    .filter(function(c) { return c.score > 0; })
    .map(function(c) { return c.content; });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var message = req.body && req.body.message;
  var session_id = req.body && req.body.session_id;
  var history = (req.body && req.body.history) || [];

  if (!message) return res.status(400).json({ error: "Message requis" });

  try {
    var chunks = findRelevantChunks(message);
    var context = chunks.length > 0 ? chunks.join("\n\n---\n\n") : "Pas d'info specifique trouvee.";
    var systemPrompt = SYSTEM_PROMPT.replace("{context}", context);

    var messages = [];
    var recent = history.slice(-10);
    for (var i = 0; i < recent.length; i++) {
      messages.push({ role: recent[i].role, content: recent[i].content });
    }
    messages.push({ role: "user", content: message });

    var mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.MISTRAL_API_KEY,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "system", content: systemPrompt }].concat(messages),
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!mistralRes.ok) {
      var errText = await mistralRes.text();
      console.error("Mistral error:", errText);
      return res.status(200).json({ reply: "Désolé, problème technique. Contactez contact@frenchtechgrandparis.com" });
    }

    var data = await mistralRes.json();
    var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
      ? data.choices[0].message.content
      : "Désolé, je n'ai pas pu générer de réponse.";

    var sid = session_id || "anon-" + Date.now();

    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        await sb.from("chat_logs").insert({ session_id: sid, question: message, answer: reply });
      } catch(e) { console.error("Supabase error:", e); }
    }

    return res.status(200).json({ reply: reply, session_id: sid });

  } catch (error) {
    console.error("Error:", error);
    return res.status(200).json({ reply: "Désolé, une erreur est survenue. Contactez contact@frenchtechgrandparis.com" });
  }
};
