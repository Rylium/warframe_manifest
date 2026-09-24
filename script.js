const PublicExportURL = "https://content.warframe.com/PublicExport/";
const ManifestURL = "./data/ExportManifest.json";
const IndexURL = "./data/warframe-manifest-index.json";

const container = document.getElementById("container");

// -- Load JSON
async function loadManifest() {
  try {
    // 1. Chargement parallèle des deux fichiers JSON
    const [manifestResponse, indexResponse] = await Promise.all([
      fetch(ManifestURL),
      fetch(IndexURL)
    ]);

    const manifestData = await manifestResponse.json();
    const indexData = await indexResponse.json();

    const manifest = manifestData.Manifest || [];

    // 2. Extraction à plat de tous les chemins valides pour un filtrage rapide
    const validPaths = extractValidPaths(indexData);

    // 3. Traitement et filtrage des items du Manifest
    const categorizedItems = {};

    for (let i = 0; i < manifest.length; i++) {
      const item = manifest[i];
      const match = findCategoryMatch(item.uniqueName, indexData);

      if (match) {
        const { category, subCategory } = match;

        if (!categorizedItems[category]) {
          categorizedItems[category] = {};
        }
        if (!categorizedItems[category][subCategory]) {
          categorizedItems[category][subCategory] = [];
        }

        categorizedItems[category][subCategory].push(item);
      } else {
        // Chemin non pris en charge
        console.log(item.uniqueName);
      }
    }

    // 4. Génération de l'arborescence HTML
    renderTree(categorizedItems);

  } catch (error) {
    console.error("Erreur lors du traitement du Manifest :", error);
  }
}

// Extrait la liste complète des "paths" de l'index
function extractValidPaths(indexData) {
  const paths = [];
  for (const cat in indexData) {
    for (const subCat in indexData[cat]) {
      if (indexData[cat][subCat].paths) {
        paths.push(...indexData[cat][subCat].paths);
      }
    }
  }
  return paths;
}

// Associe un uniqueName à sa catégorie et sous-catégorie
function findCategoryMatch(uniqueName, indexData) {
  for (const category in indexData) {
    for (const subCategory in indexData[category]) {
      const paths = indexData[category][subCategory].paths || [];
      for (let i = 0; i < paths.length; i++) {
        if (uniqueName.startsWith(paths[i])) {
          return { category, subCategory };
        }
      }
    }
  }
  return null;
}

// Génère la structure HTML globale
function renderTree(categorizedItems) {
  const mainUl = document.createElement("ul");

  for (const category in categorizedItems) {
    const categoryLi = document.createElement("li");
    
    const categoryTitle = document.createElement("h2");
    categoryTitle.textContent = category;
    categoryLi.appendChild(categoryTitle);

    const subCategoryUl = document.createElement("ul");

    for (const subCategory in categorizedItems[category]) {
      const subCategoryLi = document.createElement("li");
      
      const subCategoryTitle = document.createElement("h3");
      subCategoryTitle.textContent = subCategory;
      subCategoryLi.appendChild(subCategoryTitle);

      // Liste des items
      const itemsUl = document.createElement("ul");
      const items = categorizedItems[category][subCategory];
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < items.length; i++) {
        fragment.appendChild(buildManifestNode(items[i]));
      }

      itemsUl.appendChild(fragment);
      subCategoryLi.appendChild(itemsUl);
      subCategoryUl.appendChild(subCategoryLi);
    }

    categoryLi.appendChild(subCategoryUl);
    mainUl.appendChild(categoryLi);
  }

  container.innerHTML = "";
  container.appendChild(mainUl);
}

// Build HTML nodes for each items (structure HTML identique)
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