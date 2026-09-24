const PublicExportURL = "https://content.warframe.com/PublicExport/";
const ManifestURL = "./data/ExportManifest.json";
const IndexURL = "./data/warframe-manifest-index.json";

const container = document.getElementById("container");

let manifestData = [];
const ITEM_HEIGHT = 120; // Hauteur fixe de chaque <li> en pixels
const BUFFER_ITEMS = 5; // Éléments hors champ à charger pour un défilement fluide

// Conteneur <ul> unique
const ul = document.createElement("ul");
ul.id = "manifest-listing";
container.appendChild(ul);

// 1. Chargement du JSON
async function loadManifest() {
  try {
    const response = await fetch(ManifestURL);
    const data = await response.json();
    manifestData = data.Manifest || [];

    // Définit la hauteur totale du <ul> pour activer la barre de défilement
    ul.style.height = `${manifestData.length * ITEM_HEIGHT}px`;

    // Écoute du défilement
    container.addEventListener("scroll", renderVisibleItems);
    
    // Premier rendu
    renderVisibleItems();
  } catch (error) {
    console.error("Erreur de chargement du Manifest :", error);
  }
}

// 2. Construction d'un nœud HTML selon ton format
function buildManifestNode(item, topOffset) {
  const li = document.createElement("li");
  li.style.top = `${topOffset}px`;

  // Content <div>
  const div = document.createElement("div");
  const spanName = document.createElement("span");
  spanName.textContent = item.uniqueName;

  const spanTexture = document.createElement("span");
  spanTexture.textContent = item.textureLocation;

  div.appendChild(spanName);
  div.appendChild(spanTexture);

  // Content <figure>
  const figure = document.createElement("figure");
  const img = document.createElement("img");
  
  // Chargement différé de l'image (lazy loading)
  img.loading = "lazy";
  img.src = `${PublicExportURL}${item.textureLocation}`;
  img.title = item.uniqueName;
  img.alt = item.uniqueName;

  figure.appendChild(img);

  // Assemblage dans <li>
  li.appendChild(div);
  li.appendChild(figure);

  return li;
}

// 3. Calcul et rendu dynamique des éléments visibles
function renderVisibleItems() {
  const scrollTop = container.scrollTop;
  const containerHeight = container.clientHeight;

  // Calcul des index d'éléments à afficher
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ITEMS;
  let endIndex = Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_ITEMS;

  startIndex = Math.max(0, startIndex);
  endIndex = Math.min(manifestData.length, endIndex);

  // Reconstitution du contenu du <ul> uniquement avec les éléments visibles
  const fragment = document.createDocumentFragment();

  for (let i = startIndex; i < endIndex; i++) {
    const item = manifestData[i];
    const topOffset = i * ITEM_HEIGHT;
    fragment.appendChild(buildManifestNode(item, topOffset));
  }

  ul.innerHTML = "";
  ul.appendChild(fragment);
}

// Démarrage
loadManifest();