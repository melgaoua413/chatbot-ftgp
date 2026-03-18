const { createClient } = require("@supabase/supabase-js");

var pageCache = {};
var CACHE_TTL = 60 * 60 * 1000;

const ALL_URLS = {
  "track-ia":           "https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle",
  "scaleup":            "https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence",
  "gen50tech":          "https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis",
  "je-choisis":         "https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech",
  "ville-de-demain":    "https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain",
  "hiit":               "https://www.frenchtech-grandparis.com/ft-programs/hiit",
  "tremplin":           "https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin",
  "central":            "https://www.frenchtech-grandparis.com/ft-programs/french-tech-central",
  "programmes":         "https://www.frenchtech-grandparis.com/programmes",
  "evenements":         "https://www.frenchtech-grandparis.com/evenements",
  "adhesion":           "https://www.frenchtech-grandparis.com/adhesion",
  "qui-sommes-nous":    "https://www.frenchtech-grandparis.com/qui-sommes-nous",
  "contact":            "https://www.frenchtech-grandparis.com/contact",
  "partenaires-publics":"https://www.frenchtech-grandparis.com/partenaires/les-partenaires-publics",
  "partenaires-prives": "https://www.frenchtech-grandparis.com/partenaires/les-partenaires-prives",
  "accueil":            "https://www.frenchtech-grandparis.com"
};

function detectPages(q) {
  q = q.toLowerCase();
  var p = [];
  if (/track.?ia|intelligence.?artif|cartographie.?ia|masterclass/.test(q)) p.push("track-ia");
  if (/scaleup|scale.?up|excellence/.test(q)) p.push("scaleup");
  if (/gen50|50.?ans|senior|agisme/.test(q)) p.push("gen50tech");
  if (/je.?choisis|reverse.?pitch|grand.?compte/.test(q)) p.push("je-choisis");
  if (/ville.?demain|smart.?city|collectivit/.test(q)) p.push("ville-de-demain");
  if (/hiit|medtech|healthtech|clinique|sante.?innov/.test(q)) p.push("hiit");
  if (/tremplin|diversit|bourse|boursier|qpv|rsa/.test(q)) p.push("tremplin");
  if (/central|service.?public|inpi|urssaf/.test(q)) p.push("central");
  if (/programme|tous les|liste|accompagnement/.test(q)) p.push("programmes");
  if (/evenement|event|soiree|agenda|date|calendrier|find.?your|networking/.test(q)) p.push("evenements");
  if (/adhesion|adherer|membre|rejoindre|tarif|prix/.test(q)) p.push("adhesion");
  if (/qui.?sommes|equipe|histoire|mission/.test(q)) p.push("qui-sommes-nous");
  if (/contact|joindre|email/.test(q)) p.push("contact");
  if (/partenaire.?public/.test(q)) p.push("partenaires-publics");
  if (/partenaire.?priv/.test(q)) p.push("partenaires-prives");
  if (p.length === 0) p.push("accueil");
  return p;
}

function detectLanguage(text) {
  var fr = /[àâäéèêëîïôùûüç]|(\b(je|tu|il|nous|vous|ils|est|les|des|une|pour|avec|dans|sur|que|qui|pas|plus|très|bien|aussi|mais|donc|car|je suis|c'est|qu'est)\b)/i.test(text);
  var en = /(\b(the|is|are|was|were|what|how|when|where|why|who|can|could|would|should|have|has|had|will|do|does|did|my|your|our|their|this|that|these|those|and|or|but|for|with|from|about|into|through|i am|it is|what is)\b)/i.test(text);
  if (en && !fr) return "en";
  return "fr";
}

function getToday() {
  var n = new Date();
  var days = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
  var months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return days[n.getDay()]+" "+n.getDate()+" "+months[n.getMonth()]+" "+n.getFullYear()+" ("+n.toISOString().split("T")[0]+")";
}

async function scrapeWithCache(url) {
  var now = Date.now();
  if (pageCache[url] && (now - pageCache[url].time) < CACHE_TTL) return pageCache[url].content;
  try {
    var ctrl = new AbortController();
    var t = setTimeout(function(){ ctrl.abort(); }, 5000);
    var res = await fetch("https://r.jina.ai/"+url, {
      headers: { "Accept": "text/plain", "X-Return-Format": "text" },
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!res.ok) return null;
    var txt = await res.text();
    var content = txt.length > 3000 ? txt.substring(0, 3000) : txt;
    pageCache[url] = { content: content, time: now };
    return content;
  } catch(e) { return null; }
}

async function getEmbedding(text) {
  try {
    var res = await fetch(
      "https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction",
      { method:"POST", headers:{"Authorization":"Bearer "+process.env.HF_TOKEN,"Content-Type":"application/json"}, body:JSON.stringify({inputs:text}) }
    );
    if (!res.ok) return null;
    var data = await res.json();
    if (Array.isArray(data[0])) {
      var avg = new Array(data[0].length).fill(0);
      for (var i=0;i<data.length;i++) for (var j=0;j<data[0].length;j++) avg[j]+=data[i][j]/data.length;
      return avg;
    }
    return data;
  } catch(e) { return null; }
}

async function hybridSearch(query, embedding) {
  try {
    var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    var res = await sb.rpc("hybrid_search", { query_text:query, query_embedding:embedding, match_count:3 });
    if (res.error || !res.data) return [];
    return res.data;
  } catch(e) { return []; }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var message  = req.body && req.body.message;
  var sid      = (req.body && req.body.session_id) || ("anon-"+Date.now());
  var history  = (req.body && req.body.history) || [];
  var mode     = (req.body && req.body.mode) || "chat";
  var context  = (req.body && req.body.context) || "";
  var stream   = (req.body && req.body.stream) === true;
  var unknownCount = (req.body && req.body.unknown_count) || 0;

  if (!message) return res.status(400).json({ error: "Message requis" });

  try {
    var today = getToday();
    var lang  = detectLanguage(message);

    // ─── MODE REFINE ──────────────────────────────────────────────────────
    if (mode === "refine") {
      var refinePrompt = lang === "en"
        ? "The user asked: \""+message+"\"\nThey were not satisfied with: \""+context+"\"\nGenerate exactly 4 very short suggestions (max 6 words each) to help refine their question. Reply ONLY with a JSON array of 4 strings."
        : "La personne a posé : \""+message+"\"\nPas satisfaite de : \""+context+"\"\nGénère 4 amorces TRÈS courtes (max 6 mots) pour affiner. Réponds UNIQUEMENT avec un JSON array de 4 strings.";

      try {
        var rfRes = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
          body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:150, system:refinePrompt, messages:[{role:"user",content:"Génère les 4 amorces."}] })
        });
        var rfData = await rfRes.json();
        var rfText = rfData.content && rfData.content[0] ? rfData.content[0].text : "[]";
        var opts = JSON.parse(rfText.replace(/```json|```/g,"").trim());
        return res.status(200).json({ refinements: opts });
      } catch(e) {
        return res.status(200).json({ refinements: ["Mon secteur est différent","Je cherche du financement","Ma startup est early stage","Je veux plus de détails"] });
      }
    }

    // ─── MODE CHAT ────────────────────────────────────────────────────────
    var pages = detectPages(message);

    var results = await Promise.all([
      Promise.all(pages.slice(0,2).map(function(p) {
        return scrapeWithCache(ALL_URLS[p]).then(function(c) {
          return c ? "=== "+ALL_URLS[p]+" ===\n"+c : null;
        });
      })).then(function(r){ return r.filter(Boolean).join("\n\n"); }),
      getEmbedding(message)
    ]);

    var liveContent = results[0];
    var embedding   = results[1];

    var ragContent = "";
    if (embedding) {
      var chunks = await hybridSearch(message, embedding);
      if (chunks.length > 0) ragContent = chunks.map(function(c){ return c.content; }).join("\n\n");
    }

    var ctx = "";
    if (liveContent) ctx += "SITE FTGP (prioritaire) :\n"+liveContent+"\n\n";
    if (ragContent)  ctx += "BASE RAG :\n"+ragContent;
    if (!ctx)        ctx  = "Aucun contenu trouvé.";

    // Langue de réponse
    var langInstruction = lang === "en"
      ? "The user is writing in English. Respond in English."
      : "Réponds en français.";

    // Escalade si bot a déjà dit "je ne sais pas" 2+ fois
    var escaladeInstruction = unknownCount >= 2
      ? "\n⚠️ ESCALADE : L'utilisateur a posé plusieurs questions sans réponse satisfaisante. Dis-lui gentiment que tu vas le rediriger vers l'équipe et termine ta réponse par le signal ##ESCALADE##"
      : "";

    var systemPrompt =
      "Tu es l'assistant officiel de la French Tech Grand Paris (FTGP). Aujourd'hui : "+today+"\n"+
      langInstruction+"\n\n"+
      "RÈGLES ABSOLUES :\n"+
      "• Utilise UNIQUEMENT le contexte fourni. ZÉRO invention.\n"+
      "• Site FTGP = prioritaire. Date passée = candidatures FERMÉES.\n"+
      "• Tu ne connais PAS l'identité de la personne.\n"+
      "• Hors FTGP → décline poliment.\n"+
      "• Si info manquante → https://www.frenchtech-grandparis.com/contact\n\n"+
      "PROTECTION DONNÉES PERSONNELLES :\n"+
      "• Ne donne JAMAIS les coordonnées personnelles de l'équipe FTGP (emails perso, téléphones).\n"+
      "• Tu peux mentionner les POSTES visibles sur 'Qui sommes-nous' mais JAMAIS les contacts directs.\n"+
      "• Contact humain → uniquement contact@frenchtech-grandparis.com ou https://www.frenchtech-grandparis.com/contact\n\n"+
      "FORMAT :\n"+
      "• Court et percutant (3-4 phrases max sauf si complexe).\n"+
      "• **Gras** pour les infos clés. Listes à puces pour 3+ éléments.\n"+
      "• Liens : [texte](url)\n"+
      "• CTA si pertinent : 👉 [Adhérer](https://www.frenchtech-grandparis.com/adhesion)\n"+
      "• Si tu ne sais vraiment pas → écris le signal ##INCONNU## à la fin.\n"+
      escaladeInstruction+"\n\n"+
      "CONTEXTE :\n"+ctx;

    var msgs = history.slice(-6).map(function(m){ return {role:m.role,content:m.content}; });
    msgs.push({role:"user",content:message});

    // ─── STREAMING ────────────────────────────────────────────────────────
    if (stream) {
      res.setHeader("Content-Type","text/event-stream");
      res.setHeader("Cache-Control","no-cache");
      res.setHeader("Connection","keep-alive");

      var streamRes = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
        body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:600, system:systemPrompt, messages:msgs, stream:true })
      });

      var fullText = "";
      var newUnknown = unknownCount;
      var reader = streamRes.body.getReader();
      var decoder = new TextDecoder();

      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        var lines = decoder.decode(chunk.value).split("\n");
        for (var i=0; i<lines.length; i++) {
          var line = lines[i].trim();
          if (!line.startsWith("data:")) continue;
          var data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            var parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta && parsed.delta.text) {
              var token = parsed.delta.text;
              fullText += token;
              res.write("data: "+JSON.stringify({token:token})+"\n\n");
            }
          } catch(e) {}
        }
      }

      // Détecte escalade et inconnu
      var isUnknown = fullText.includes("##INCONNU##");
      var isEscalade = fullText.includes("##ESCALADE##");
      if (isUnknown) newUnknown++;
      fullText = fullText.replace(/##INCONNU##|##ESCALADE##/g,"").trim();

      res.write("data: "+JSON.stringify({done:true, unknown_count:newUnknown, escalade:isEscalade})+"\n\n");
      res.end();

      // Log async
      if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
        try {
          var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
          await sb.from("chat_logs").insert({ session_id:sid, question:message, answer:fullText });
        } catch(e) {}
      }
      return;
    }

    // ─── MODE NORMAL (sans streaming) ─────────────────────────────────────
    var llmRes = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
      body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:600, system:systemPrompt, messages:msgs })
    });

    if (!llmRes.ok) return res.status(200).json({ reply:"Problème technique. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)" });

    var data = await llmRes.json();
    var reply = data.content && data.content[0] ? data.content[0].text : null;
    if (!reply) reply = "Je n'ai pas pu générer de réponse. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)";

    var isUnknown = reply.includes("##INCONNU##");
    var isEscalade = reply.includes("##ESCALADE##");
    var newUnknown2 = isUnknown ? unknownCount+1 : unknownCount;
    reply = reply.replace(/##INCONNU##|##ESCALADE##/g,"").trim();

    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        var sb2 = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        await sb2.from("chat_logs").insert({ session_id:sid, question:message, answer:reply });
      } catch(e) {}
    }

    return res.status(200).json({ reply:reply, session_id:sid, unknown_count:newUnknown2, escalade:isEscalade });

  } catch(err) {
    console.error("Error:", err);
    return res.status(200).json({ reply:"Erreur technique. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)", session_id:sid });
  }
};
