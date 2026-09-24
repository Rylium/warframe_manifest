const PublicExportURL = "https://content.warframe.com/PublicExport";
const container = document.getElementById("container");


// -----------------------------------------------------------------------------
// Lazy loading des images
// -----------------------------------------------------------------------------

const imageObserver = new IntersectionObserver(
  (entries, observer) => {

    for (const entry of entries) {

      if (!entry.isIntersecting) {
        continue;
      }

      const img = entry.target;
      const src = img.dataset.src;

      if (src) {
        img.src = src;
        delete img.dataset.src;
      }

      observer.unobserve(img);
    }
  },
  {
    rootMargin: "300px 0px"
  }
);


// -----------------------------------------------------------------------------
// Création d'une entrée
// -----------------------------------------------------------------------------

function createManifestItem(item) {

  const li = document.createElement("li");

  // ---------------------------------------------------------------------------
  // Partie gauche
  // ---------------------------------------------------------------------------

  const info = document.createElement("div");

  // UniqueName
  const uniqueName = document.createElement("span");
  uniqueName.textContent = item.uniqueName;

  // TextureLocation
  const textureLocation = document.createElement("span");
  textureLocation.textContent = item.textureLocation;

  // URL complète de l'image
  const imageURL = PublicExportURL + item.textureLocation;

  // Bouton d'ouverture de l'image
  const openButton = document.createElement("button");

  openButton.type = "button";
  openButton.textContent = "Ouvrir l'image";

  openButton.addEventListener("click", () => {
    window.open(
      imageURL,
      "_blank",
      "noopener,noreferrer"
    );
  });


  info.appendChild(uniqueName);
  info.appendChild(textureLocation);
  info.appendChild(openButton);


  // ---------------------------------------------------------------------------
  // Partie droite
  // ---------------------------------------------------------------------------

  const figure = document.createElement("figure");

  const img = document.createElement("img");

  img.dataset.src = imageURL;
  img.alt = item.uniqueName;

  // Chargement/décodage non bloquant
  img.decoding = "async";
  img.loading = "lazy";
  img.fetchPriority = "low";

  imageObserver.observe(img);

  figure.appendChild(img);


  // ---------------------------------------------------------------------------
  // Assemblage du <li>
  // ---------------------------------------------------------------------------

  li.appendChild(info);
  li.appendChild(figure);

  return li;
}


// -----------------------------------------------------------------------------
// Rendu de la liste
// -----------------------------------------------------------------------------

function renderManifest(manifest) {

  const list = document.createElement("ul");

  const fragment = document.createDocumentFragment();

  for (const item of manifest) {

    fragment.appendChild(
      createManifestItem(item)
    );
  }

  list.appendChild(fragment);

  container.replaceChildren(list);
}


// -----------------------------------------------------------------------------
// Chargement du manifest
// -----------------------------------------------------------------------------

async function loadManifest() {

  try {

    const start = performance.now();

    const response = await fetch(
      "./data/ExportManifest.json"
    );

    if (!response.ok) {

      throw new Error(
        `Impossible de charger ExportManifest.json (${response.status})`
      );
    }

    const data = await response.json();

    const end = performance.now();

    console.log(
      `Manifest chargé en ${(end - start).toFixed(2)} ms`
    );

    console.log(
      `Nombre d'entrées : ${data.Manifest.length}`
    );


    // -------------------------------------------------------------------------
    // Rendu
    // -------------------------------------------------------------------------

    const renderStart = performance.now();

    renderManifest(data.Manifest);

    const renderEnd = performance.now();

    console.log(
      `Rendu initial en ${(renderEnd - renderStart).toFixed(2)} ms`
    );

    console.log("Manifest prêt.");

  } catch (error) {

    console.error(
      "Erreur lors du chargement du JSON :",
      error
    );
  }
}


// -----------------------------------------------------------------------------
// Démarrage
// -----------------------------------------------------------------------------

loadManifest();