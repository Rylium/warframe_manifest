const PublicExportURL = "https://content.warframe.com/PublicExport";
const ManifestURL = "./data/ExportManifest.json";
const IndexURL = "./data/warframe-manifest-index.json";

const container = document.getElementById("container");

// -- Load JSON
async function loadManifest() {
  try {
    const [manifestResponse, indexResponse] = await Promise.all([
      fetch(ManifestURL),
      fetch(IndexURL)
    ]);

    const manifestData = await manifestResponse.json();
    const indexData = await indexResponse.json();

    const manifest = manifestData.Manifest || [];

    // 1. Aplatit la carte de recherche pour garder d'excellentes performances
    const pathMap = buildPathMap(indexData);

    // 2. Traitement et classement des items
    const categorizedItems = {};

    for (let i = 0; i < manifest.length; i++) {
      const item = manifest[i];
      const match = findMatch(item.uniqueName, pathMap);

      if (match) {
        // Crée dynamiquement l'arborescence selon les clés (ex: ["Gears", "Warframes", "Ash"])
        insertCategorizedItem(categorizedItems, match.categories, item);
      } else {
        console.log(item.uniqueName + '-> (' + PublicExportURL + item.textureLocation + ')');
      }
    }

    // 3. Génération dynamique de l'arborescence HTML avec les "nest"
    renderTree(categorizedItems, container, 1);

  } catch (error) {
    console.error("Erreur lors du traitement du Manifest :", error);
  }
}

// Parcours récursif pour récupérer TOUS les 'paths' et garder leur chemin de catégories
function buildPathMap(obj, currentCategories = []) {
  let map = [];

  for (const key in obj) {
    if (key === "paths" && Array.isArray(obj[key])) {
      obj[key].forEach(path => {
        map.push({ path, categories: currentCategories });
      });
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      map = map.concat(buildPathMap(obj[key], [...currentCategories, key]));
    }
  }

  return map;
}

// Trouve si le uniqueName commence par un des chemins enregistrés
function findMatch(uniqueName, pathMap) {
  for (let i = 0; i < pathMap.length; i++) {
    if (uniqueName.startsWith(pathMap[i].path)) {
      return pathMap[i];
    }
  }
  return null;
}

// Insère un élément dans l'objet imbriqué
function insertCategorizedItem(target, categories, item) {
  let current = target;
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    if (i === categories.length - 1) {
      if (!current[cat]) current[cat] = [];
      current[cat].push(item);
    } else {
      if (!current[cat]) current[cat] = {};
      current = current[cat];
    }
  }
}

// Génère dynamiquement les <ul> et <hX> en fonction de la profondeur
// Génère dynamiquement la structure avec des wrappers repliables <details>
function renderTree(nodes, parentElement, depth) {
  const ul = document.createElement("ul");
  ul.setAttribute("data-nest", depth);

  for (const key in nodes) {
    const li = document.createElement("li");

    // Création du wrapper repliable
    const details = document.createElement("details");
    const summary = document.createElement("summary");

    // Titre dynamique selon la profondeur
    const titleTag = "h" + Math.min(depth + 1, 6);
    const title = document.createElement(titleTag);
    title.textContent = key;

    // Icône d'état d'ouverture / fermeture
    const icon = document.createElement("span");
    icon.className = "accordion-icon";

    summary.appendChild(title);
    summary.appendChild(icon);
    details.appendChild(summary);

    if (Array.isArray(nodes[key])) {
      // Liste finale des cartes d'items
      const itemsUl = document.createElement("ul");
      itemsUl.setAttribute("data-nest", depth + 1);
      itemsUl.classList.add("items-list");

      const fragment = document.createDocumentFragment();
      nodes[key].forEach(item => {
        fragment.appendChild(buildManifestNode(item));
      });

      itemsUl.appendChild(fragment);
      details.appendChild(itemsUl);
    } else {
      // Sous-groupe : appel récursif
      renderTree(nodes[key], details, depth + 1);
    }

    li.appendChild(details);
    ul.appendChild(li);
  }

  parentElement.appendChild(ul);
}

// Construction de la carte item HTML
function buildManifestNode(item) {
  const li = document.createElement("li");

  const div = document.createElement("div");
  const spanName = document.createElement("span");
  spanName.textContent = item.uniqueName;

  const spanTexture = document.createElement("span");
  spanTexture.textContent = item.textureLocation;

  div.appendChild(spanName);
  div.appendChild(spanTexture);

  const figure = document.createElement("figure");
  const img = document.createElement("img");
  img.src = `${PublicExportURL}${item.textureLocation}`;
  img.title = item.uniqueName;

  figure.appendChild(img);

  li.appendChild(div);
  li.appendChild(figure);

  return li;
}

// Démarrage
loadManifest();