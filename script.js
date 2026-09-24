const PublicExportURL = "https://content.warframe.com/PublicExport";
const container = document.getElementById("container");


/*
 * ============================================================
 * CATÉGORISATION DU MANIFEST
 * ============================================================
 *
 * "match" correspond au chemin réel présent dans uniqueName,
 * sans le dossier racine "Lotus".
 *
 * "groups" correspond à la hiérarchie que l'on souhaite afficher.
 *
 * La règle la plus spécifique est toujours prioritaire.
 *
 * Exemple :
 *
 * /Lotus/Interface/Graphics/CustomUI/ConqueraStyle
 *
 * correspond à :
 *
 * ["Interface", "Graphics"]
 *
 * ET :
 *
 * ["Interface", "Graphics", "CustomUI"]
 *
 * La deuxième règle étant plus spécifique, elle sera utilisée.
 */

const GROUP_RULES = [

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  {
    match: ["Interface", "Graphics"],
    groups: ["UI"]
  },

  {
    match: ["Interface", "Graphics", "CustomUI"],
    groups: ["UI", "CustomUI"]
  },


  /*
   * ============================================================
   * Characters
   * ============================================================
   */

  {
    match: ["Characters", "Tenno"],
    groups: ["Characters", "Tenno"]
  },

  {
    match: ["Characters", "Tenno", "Accessory"],
    groups: ["Characters", "Tenno", "Accessories"]
  }

];



/*
 * ============================================================
 * Lazy loading des images
 * ============================================================
 */

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
    // Commence à charger les images avant
    // qu'elles n'entrent dans la fenêtre.
    rootMargin: "300px 0px"
  }
);



/*
 * ============================================================
 * Création d'une image
 * ============================================================
 */

function createImage(item) {

  const img = document.createElement("img");

  img.dataset.src =
    PublicExportURL + item.textureLocation;

  img.alt = item.name;

  // Décodage asynchrone.
  img.decoding = "async";

  // Les images du manifest ne sont pas prioritaires.
  img.fetchPriority = "low";

  // Lazy-loading natif en complément de l'Observer.
  img.loading = "lazy";

  imageObserver.observe(img);

  return img;
}



/*
 * ============================================================
 * Recherche d'une règle de catégorisation
 * ============================================================
 *
 * Si plusieurs règles correspondent au même chemin,
 * celle ayant le "match" le plus long est utilisée.
 *
 * Exemple :
 *
 * Interface / Graphics
 * Interface / Graphics / CustomUI
 *
 * Pour :
 *
 * Interface / Graphics / CustomUI / ConqueraStyle
 *
 * => CustomUI gagne.
 */

function findGroupRule(parts) {

  let bestRule = null;
  let bestLength = -1;

  for (const rule of GROUP_RULES) {

    if (rule.match.length > parts.length) {
      continue;
    }

    let matches = true;

    for (let i = 0; i < rule.match.length; i++) {

      if (parts[i] !== rule.match[i]) {
        matches = false;
        break;
      }
    }

    if (!matches) {
      continue;
    }

    /*
     * La règle ayant le chemin correspondant
     * le plus long est la plus spécifique.
     */
    if (rule.match.length > bestLength) {

      bestRule = rule;
      bestLength = rule.match.length;
    }
  }

  return bestRule;
}



/*
 * ============================================================
 * Construction de l'arbre en mémoire
 * ============================================================
 */

function buildTree(manifest) {

  const root = new Map();

  let categorizedCount = 0;
  let uncategorizedCount = 0;


  for (const item of manifest) {

    if (
      !item ||
      !item.uniqueName ||
      !item.textureLocation
    ) {
      continue;
    }


    const parts = item.uniqueName
      .split("/")
      .filter(Boolean);


    /*
     * On attend au minimum :
     *
     * Lotus / Groupe / Item
     */
    if (parts.length < 3) {
      continue;
    }


    /*
     * Retire "Lotus".
     */
    if (parts[0] === "Lotus") {
      parts.shift();
    }


    /*
     * Le dernier élément est le nom de l'élément.
     *
     * Exemple :
     *
     * Interface
     * Graphics
     * CustomUI
     * ConqueraStyle
     *
     * => ConqueraStyle = élément
     */
    const itemName = parts.pop();


    /*
     * Le reste constitue le chemin réel.
     */
    const originalPath = [...parts];


    /*
     * Recherche de la règle personnalisée.
     */
    const rule = findGroupRule(parts);


    let groupNames;


    if (rule) {

      /*
       * Catégorie personnalisée.
       */
      groupNames = [...rule.groups];

      categorizedCount++;

    } else {

      /*
       * Aucun chemin personnalisé.
       *
       * On conserve le chemin original afin que
       * l'élément reste visible dans l'arborescence.
       */
      groupNames = [...parts];

      uncategorizedCount++;


      /*
       * LOG DES ÉLÉMENTS NON CATÉGORISÉS
       */
      console.warn(
        "[Manifest] Élément non catégorisé :",
        item.uniqueName,
        "\nChemin :",
        originalPath.join(" / ")
      );
    }


    /*
     * Si aucune famille n'existe, on ne peut pas
     * correctement ajouter l'élément.
     */
    if (groupNames.length === 0) {
      continue;
    }


    /*
     * ========================================================
     * Construction des groupes
     * ========================================================
     */

    let currentMap = root;
    let targetGroup = null;


    for (const groupName of groupNames) {

      let group = currentMap.get(groupName);


      if (!group) {

        group = {
          name: groupName,
          children: new Map(),
          items: []
        };

        currentMap.set(
          groupName,
          group
        );
      }


      targetGroup = group;
      currentMap = group.children;
    }


    /*
     * ========================================================
     * Ajout de l'élément
     * ========================================================
     */

    targetGroup.items.push({
      name: itemName,
      textureLocation: item.textureLocation
    });
  }


  /*
   * ============================================================
   * Statistiques
   * ============================================================
   */

  console.log(
    `[Manifest] Catégorisés : ${categorizedCount}`
  );

  console.log(
    `[Manifest] Non catégorisés : ${uncategorizedCount}`
  );

  console.log(
    `[Manifest] Total traité : ${
      categorizedCount + uncategorizedCount
    }`
  );


  return root;
}



/*
 * ============================================================
 * Création d'un groupe
 * ============================================================
 */

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


  /*
   * ==========================================================
   * Rendu différé
   * ==========================================================
   */

  let rendered = false;


  details.addEventListener("toggle", () => {

    if (!details.open || rendered) {
      return;
    }


    rendered = true;


    renderGroupContent(
      group,
      content
    );
  });


  return wrapper;
}



/*
 * ============================================================
 * Rendu du contenu d'un groupe
 * ============================================================
 */

function renderGroupContent(group, container) {

  const fragment =
    document.createDocumentFragment();


  /*
   * ==========================================================
   * Sous-groupes
   * ==========================================================
   */

  for (const childGroup of group.children.values()) {

    fragment.appendChild(
      createGroup(childGroup)
    );
  }


  /*
   * ==========================================================
   * Items
   * ==========================================================
   */

  if (group.items.length > 0) {

    const list = document.createElement("ul");


    for (const item of group.items) {

      const listItem =
        document.createElement("li");


      const img =
        createImage(item);


      listItem.appendChild(img);

      list.appendChild(listItem);
    }


    fragment.appendChild(list);
  }


  /*
   * Une seule opération DOM.
   */
  container.appendChild(fragment);
}



/*
 * ============================================================
 * Rendu initial
 * ============================================================
 */

function renderRoot(root) {

  const fragment =
    document.createDocumentFragment();


  for (const group of root.values()) {

    fragment.appendChild(
      createGroup(group)
    );
  }


  container.appendChild(fragment);
}



/*
 * ============================================================
 * Chargement du Manifest
 * ============================================================
 */

async function loadManifest() {

  try {

    /*
     * ========================================================
     * Fetch + parsing JSON
     * ========================================================
     */

    const fetchStart =
      performance.now();


    const response =
      await fetch("./data/ExportManifest.json");


    if (!response.ok) {

      throw new Error(
        `Impossible de charger ExportManifest.json (${response.status})`
      );
    }


    const data =
      await response.json();


    const fetchEnd =
      performance.now();


    console.log(
      `Manifest chargé en ${
        (fetchEnd - fetchStart).toFixed(2)
      } ms`
    );


    console.log(
      `Nombre d'entrées : ${
        data.Manifest.length
      }`
    );


    /*
     * ========================================================
     * Construction de l'arbre
     * ========================================================
     */

    const treeStart =
      performance.now();


    const tree =
      buildTree(data.Manifest);


    const treeEnd =
      performance.now();


    console.log(
      `Arbre construit en ${
        (treeEnd - treeStart).toFixed(2)
      } ms`
    );


    /*
     * ========================================================
     * Rendu
     * ========================================================
     */

    const renderStart =
      performance.now();


    renderRoot(tree);


    const renderEnd =
      performance.now();


    console.log(
      `Rendu initial en ${
        (renderEnd - renderStart).toFixed(2)
      } ms`
    );


    console.log(
      "Manifest prêt."
    );


  } catch (error) {

    console.error(
      "Erreur lors du chargement du JSON :",
      error
    );
  }
}



/*
 * ============================================================
 * Démarrage
 * ============================================================
 */

loadManifest();