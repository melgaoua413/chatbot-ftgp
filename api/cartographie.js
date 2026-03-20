const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  // CORS headers pour l'embed Webflow
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    // ── Liste de toutes les startups validées ──
    var { data, error } = await sb
      .from("startups_cartographie")
      .select("id, nom_commercial, pitch, description_fr, site_web, linkedin, logo_url, ville, annee_creation, secteurs_cibles, type_solution, briques_ia, fonctions_metier, labels, cas_usage, contact_nom, contact_email")
      .order("nom_commercial", { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // On renvoie le tout — le filtrage se fait côté client (plus rapide, pas de requêtes multiples)
    return res.status(200).json({
      count: (data || []).length,
      startups: data || []
    });

  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur: " + e.message });
  }
};
