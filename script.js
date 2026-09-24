const PublicExportURL = "https://content.warframe.com/PublicExport/";
const ManifestURL = "./data/ExportManifest.json";
const IndexURL = "./data/warframe-manifest-index.json";

const container = document.getElementById("container");

let manifestData = [];
let currentIndex = 0;
const BATCH_SIZE = 50; // Nombre d'éléments chargés à chaque palier

// Création de la liste <ul> principale et du marqueur de défilement
const ul = document.createElement("ul");
const sentinel = document.createElement("div");
sentinel.id = "sentinel";

container.appendChild(ul);
container.appendChild(sentinel);

// 1. Chargement du JSON
async function loadManifest() {
  try {
    const response = await fetch(ManifestURL);
    const data = await response.json();
    manifestData = data.Manifest || [];

    // Initialisation de l'observateur pour le défilement infini
    initObserver();
  } catch (error) {
    console.error("Erreur de chargement du Manifest :", error);
  }
}

// 2. Construction d'un nœud HTML selon ton format strict
function buildManifestNode(item) {
  const li = document.createElement("li");

  // Div enfant
  const div = document.createElement("div");
  const spanName = document.createElement("span");
  spanName.textContent = item.uniqueName;

  const spanTexture = document.createElement("span");
  spanTexture.textContent = item.textureLocation;

  div.appendChild(spanName);
  div.appendChild(spanTexture);

  // Figure enfant
  const figure = document.createElement("figure");
  const img = document.createElement("img");
  img.src = `${PublicExportURL}${item.textureLocation}`;
  img.title = item.uniqueName;
  img.alt = item.uniqueName;
  img.loading = "lazy"; // Évite de surcharger le réseau avec les images non visibles

  figure.appendChild(img);

  // Assemblage dans le <li>
  li.appendChild(div);
  li.appendChild(figure);

  return li;
}

// 3. Injection progressive des éléments par lots
function renderNextBatch() {
  if (currentIndex >= manifestData.length) return;

  const fragment = document.createDocumentFragment();
  const nextIndex = Math.min(currentIndex + BATCH_SIZE, manifestData.length);

  for (let i = currentIndex; i < nextIndex; i++) {
    fragment.appendChild(buildManifestNode(manifestData[i]));
  }

  ul.appendChild(fragment);
  currentIndex = nextIndex;
}

// 4. Détection du bas de page via IntersectionObserver
function initObserver() {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      renderNextBatch();
    }
  }, {
    rootMargin: "200px" // Anticipe le chargement 200px avant d'atteindre le bas
  });

  observer.observe(sentinel);
}

// Démarrage
loadManifest();