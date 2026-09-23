const PublicExportURL = "https://content.warframe.com/PublicExport";
const container = document.getElementById("container");


// Lazy loading des images
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
    // Commence à charger les images avant qu'elles
    // n'entrent dans la fenêtre.
    rootMargin: "300px 0px"
  }
);


// Image
function createImage(item) {

  const img = document.createElement("img");

  img.dataset.src = PublicExportURL + item.textureLocation;
  img.alt = item.name;

  // Décodage asynchrone
  img.decoding = "async";

  // Les images du manifest ne sont pas prioritaires.
  img.fetchPriority = "low";

  // Lazy-loading natif en complément de l'Observer.
  img.loading = "lazy";

  imageObserver.observe(img);

  return img;
}


// Construction de l'arbre en mémoire
function buildTree(manifest) {

  const root = new Map();

  for (const item of manifest) {

    const parts = item.uniqueName
      .split("/")
      .filter(Boolean);

    /*
      Exemple :
      /Lotus/Characters/Tenno/Accessory/Scarves/GrnBannerScarf/GrnBannerScarfItem

      parts :
      [ "Lotus", "Characters", "Tenno", "Accessory", "Scarves", "GrnBannerScarf", "GrnBannerScarfItem" ]
    */

    if (parts.length < 3) {
      continue;
    }

    let currentMap = root; // Retire "Lotus"
    const itemName = parts[parts.length - 1]; // L'item = dernier élément de la liste


    // Construction des groupes
    for (let i = 1; i < parts.length - 1; i++) {

      const groupName = parts[i];

      let group = currentMap.get(groupName);

      if (!group) {

        group = {
          name: groupName,
          children: new Map(),
          items: []
        };

        currentMap.set(groupName, group);
      }

      currentMap = group.children;


      // Dernier groupe
      if (i === parts.length - 2) {

        group.items.push({
          name: itemName,
          textureLocation: item.textureLocation
        });
      }
    }
  }

  return root;
}


// Création d'un groupe
function createGroup(group) {

  const wrapper = document.createElement("div");
  wrapper.className = "manifest-group";

  const details = document.createElement("details");

  const summary = document.createElement("summary");

  const title = document.createElement("h2");
  title.textContent = group.name;

  summary.appendChild(title);
  details.appendChild(summary);


  const content = document.createElement("div");

  content.className = "manifest-group-content";
  content.dataset.parent = group.name;

  details.appendChild(content);
  wrapper.appendChild(details);


  // Rendu différé
  let rendered = false;

  details.addEventListener("toggle", () => {

    if (!details.open || rendered) {
      return;
    }

    rendered = true;

    renderGroupContent(group, content);

  });


  return wrapper;
}


// Rendu du contenu d'un groupe
function renderGroupContent(group, container) {

  const fragment = document.createDocumentFragment();


  // Sous-groupes
  for (const childGroup of group.children.values()) {

    fragment.appendChild(
      createGroup(childGroup)
    );
  }


  // Items
  if (group.items.length > 0) {

    const list = document.createElement("ul");

    for (const item of group.items) {

      const listItem = document.createElement("li");

      const img = createImage(item);

      listItem.appendChild(img);
      list.appendChild(listItem);
    }

    fragment.appendChild(list);
  }


  // Une seule opération DOM
  container.appendChild(fragment);
}


// Rendu initial
function renderRoot(root) {

  const fragment = document.createDocumentFragment();

  for (const group of root.values()) {

    fragment.appendChild(
      createGroup(group)
    );
  }

  container.appendChild(fragment);
}


// Chargement
async function loadManifest() {

  try {

    // Fetch + parsing JSON
    const fetchStart = performance.now();

    const response = await fetch("./ExportManifest.json");

    if (!response.ok) {

      throw new Error(
        `Impossible de charger ExportManifest.json (${response.status})`
      );
    }

    const data = await response.json();

    const fetchEnd = performance.now();

    console.log(
      `Manifest chargé en ${(fetchEnd - fetchStart).toFixed(2)} ms`
    );

    console.log(
      `Nombre d'entrées : ${data.Manifest.length}`
    );


    // Construction de l'arbre
    const treeStart = performance.now();

    const tree = buildTree(data.Manifest);

    const treeEnd = performance.now();

    console.log(
      `Arbre construit en ${(treeEnd - treeStart).toFixed(2)} ms`
    );


    // Rendu
    const renderStart = performance.now();

    renderRoot(tree);

    const renderEnd = performance.now();

    console.log(
      `Rendu initial en ${(renderEnd - renderStart).toFixed(2)} ms`
    );

    console.log("Manifest prêt.");


    /*
      data.Manifest n'est désormais plus nécessaire.

      On laisse simplement data sortir de portée avec la fin
      de cette fonction afin que le garbage collector puisse
      récupérer la mémoire lorsqu'il le souhaite.
    */

  } catch (error) {

    console.error(
      "Erreur lors du chargement du JSON :",
      error
    );
  }
}

// Démarrage
loadManifest();