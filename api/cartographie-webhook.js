const { createClient } = require("@supabase/supabase-js");

const WEBHOOK_SECRET = process.env.CARTO_WEBHOOK_SECRET || "ftgp-carto-2026-secret";

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return String(val).split(",").map(function(s) { return s.trim(); }).filter(Boolean);
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  var auth = req.headers["authorization"] || "";
  if (auth !== "Bearer " + WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  try {
    var body = req.body || {};
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch(e) { body = {}; }
    }

    if (!body.airtable_id || !body.nom_commercial) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

    var { data, error } = await sb
      .from("startups_cartographie")
      .upsert({
        airtable_id:      String(body.airtable_id),
        nom_commercial:   body.nom_commercial || null,
        pitch:            body.pitch || null,
        description_fr:   body.description_fr || null,
        description_en:   body.description_en || null,
        site_web:         body.site_web || null,
        linkedin:         body.linkedin || null,
        logo_url:         body.logo_url || null,
        ville:            body.ville || null,
        annee_creation:   parseInt(body.annee_creation) || null,
        secteurs_cibles:  toArray(body.secteurs_cibles),
        type_solution:    toArray(body.type_solution),
        briques_ia:       toArray(body.briques_ia),
        fonctions_metier: toArray(body.fonctions_metier),
        labels:           toArray(body.labels),
        cas_usage:        body.cas_usage || [],
        contact_nom:      body.contact_nom || null,
        contact_email:    body.contact_email || null
      }, { onConflict: "airtable_id" });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true, message: "Startup ajoutée/mise à jour" });

  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur: " + e.message });
  }
};
