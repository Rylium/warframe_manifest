// Application data handler
const PublicExportURL = "https://content.warframe.com/PublicExport";
const mediasData = "./data/ExportManifest.json";
const nomenclator = "./nomenclator/omenclator_fr.json";

const manifestContainer = document.getElementById("manifestData");

// Fetch JSON data //
const jsonCache = new Map();

async function fetchArchivaData(itemsType) {
  if (jsonCache.has(itemsType)) {
    return jsonCache.get(itemsType); // Retourne la donnée déjà en mémoire
  }

  const response = await fetch(`./archiva/${itemsType}.json`);
  const data = await response.json();
  jsonCache.set(itemsType, data);
  return data;
}

async function fetchAPIData(itemsType) {
  if (jsonCache.has(itemsType)) {
    return jsonCache.get(itemsType); // Retourne la donnée déjà en mémoire
  }

  const response = await fetch(`./data/${itemsType}.json`);
  const data = await response.json();
  jsonCache.set(itemsType, data);
  return data;
}

// Handle JSON data //


// Parse JSON data //


// Build node elements //


// Handle TextIcons //
// E.g: `<DT_ELECTRICITY_COLOR>` => Colored Electricity Statut Icon


// Debug //

