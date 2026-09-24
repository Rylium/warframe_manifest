const PublicExportURL = "https://content.warframe.com/PublicExport/";
const ManifestURL = "./data/ExportManifest.json";
const IndexURL = "./data/warframe-manifest-index.json";

const container = document.getElementById("container");

// -- Load JSON
async function loadManifest() {
  try {
    const response = await fetch(ManifestURL);
    const data = await response.json();
    const manifest = data.Manifest || [];

    // Utilisation d'un DocumentFragment pour limiter les reflows lors de l'injection
    const ul = document.createElement("ul");
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < manifest.length; i++) {
      const liNode = buildManifestNode(manifest[i]);
      fragment.appendChild(liNode);
    }

    ul.appendChild(fragment);
    container.appendChild(ul);
  } catch (error) {
    console.error("Erreur lors du chargement du fichier JSON :", error);
  }
}

// Build HTML nodes for each items
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

  figure.appendChild(img);

  // Assemblage du <li>
  li.appendChild(div);
  li.appendChild(figure);

  return li;
}

// Démarrage
loadManifest();