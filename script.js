const PublicExportURL = "https://content.warframe.com/PublicExport";

const ManifestURL = "./data/ExportManifest.json";
const IndexURL = "./data/warframe-manifest-index.json";

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
// Construction de l'index des chemins
// -----------------------------------------------------------------------------
//
// Transforme :
//
// "Gears": {
//     "Accessories": {
//         "paths": [
//             "/Lotus/Characters/Tenno/Accessory/"
//         ]
//     }
// }
//
// en une liste interne :
//
// {
//     path: "/Lotus/Characters/Tenno/Accessory/",
//     groups: ["Gears", "Accessories"]
// }
//
// Cela rend ensuite la recherche beaucoup plus simple.
// -----------------------------------------------------------------------------

function buildCategoryIndex(index) {

    const categories = [];


    function walk(node, groups) {

        if (!node || typeof node !== "object") {
            return;
        }


        // Les paths appartiennent à la catégorie actuelle.

        if (Array.isArray(node.paths)) {

            for (const path of node.paths) {

                if (typeof path !== "string") {
                    continue;
                }

                categories.push({
                    path,
                    groups: [...groups]
                });
            }
        }


        // Parcours des sous-catégories.

        for (const [name, child] of Object.entries(node)) {

            if (name === "paths") {
                continue;
            }

            if (!child || typeof child !== "object") {
                continue;
            }

            walk(
                child,
                [...groups, name]
            );
        }
    }


    walk(index, []);

    return categories;
}


// -----------------------------------------------------------------------------
// Recherche de la catégorie d'un élément
// -----------------------------------------------------------------------------
//
// Si plusieurs chemins correspondent, le chemin le plus long gagne.
//
// Exemple :
//
// /Lotus/Characters/
// /Lotus/Characters/Tenno/
// /Lotus/Characters/Tenno/Accessory/
//
// Pour un élément sous Accessory, la dernière règle est utilisée.
// -----------------------------------------------------------------------------

function findCategory(uniqueName, categories) {

    let bestMatch = null;
    let bestLength = -1;


    for (const category of categories) {

        if (!uniqueName.startsWith(category.path)) {
            continue;
        }


        if (category.path.length > bestLength) {

            bestMatch = category;
            bestLength = category.path.length;
        }
    }


    return bestMatch;
}


// -----------------------------------------------------------------------------
// Création d'une entrée
// -----------------------------------------------------------------------------

function createManifestItem(item, category = null) {

    const li = document.createElement("li");


    // -------------------------------------------------------------------------
    // Partie gauche
    // -------------------------------------------------------------------------

    const info = document.createElement("div");


    const uniqueName = document.createElement("span");

    uniqueName.textContent = item.uniqueName;


    const textureLocation = document.createElement("span");

    textureLocation.textContent = item.textureLocation;


    // -------------------------------------------------------------------------
    // Catégorie
    // -------------------------------------------------------------------------

    if (category) {

        const categoryElement = document.createElement("span");

        categoryElement.textContent =
            category.groups.join(" / ");

        info.appendChild(categoryElement);
    }


    // -------------------------------------------------------------------------
    // URL de l'image
    // -------------------------------------------------------------------------

    const imageURL =
        PublicExportURL + item.textureLocation;


    // -------------------------------------------------------------------------
    // Bouton d'ouverture
    // -------------------------------------------------------------------------

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


    // -------------------------------------------------------------------------
    // Image
    // -------------------------------------------------------------------------

    const figure = document.createElement("figure");

    const img = document.createElement("img");

    img.dataset.src = imageURL;
    img.alt = item.uniqueName;

    img.decoding = "async";
    img.loading = "lazy";
    img.fetchPriority = "low";

    imageObserver.observe(img);

    figure.appendChild(img);


    // -------------------------------------------------------------------------
    // Assemblage du <li>
    // -------------------------------------------------------------------------

    li.appendChild(info);
    li.appendChild(figure);


    return li;
}


// -----------------------------------------------------------------------------
// Rendu du manifest
// -----------------------------------------------------------------------------

function renderManifest(manifest, categories) {

    const list = document.createElement("ul");

    const categorized = [];
    const uncategorized = [];


    // -------------------------------------------------------------------------
    // Catégorisation
    // -------------------------------------------------------------------------

    for (const item of manifest) {

        const category = findCategory(
            item.uniqueName,
            categories
        );


        if (category) {

            categorized.push({
                item,
                category
            });

        } else {

            uncategorized.push(item);
        }
    }


    // -------------------------------------------------------------------------
    // Construction du DOM
    // -------------------------------------------------------------------------

    const fragment = document.createDocumentFragment();


    // Catégorisés en premier.

    for (const entry of categorized) {

        fragment.appendChild(
            createManifestItem(
                entry.item,
                entry.category
            )
        );
    }


    // Non catégorisés ensuite.

    for (const item of uncategorized) {

        fragment.appendChild(
            createManifestItem(item)
        );
    }


    list.appendChild(fragment);

    container.replaceChildren(list);


    // -------------------------------------------------------------------------
    // Statistiques
    // -------------------------------------------------------------------------

    console.log(
        `[Manifest] ${categorized.length} élément(s) catégorisé(s).`
    );

    console.log(
        `[Manifest] ${uncategorized.length} élément(s) non catégorisé(s).`
    );

    console.log(
        `[Manifest] ${manifest.length} élément(s) au total.`
    );


    // -------------------------------------------------------------------------
    // Éléments non catégorisés
    // -------------------------------------------------------------------------

    if (uncategorized.length > 0) {

        console.group(
            "[Manifest] Éléments non catégorisés"
        );

        for (const item of uncategorized) {

            console.warn(
                item.uniqueName
            );
        }

        console.groupEnd();
    }
}


// -----------------------------------------------------------------------------
// Chargement
// -----------------------------------------------------------------------------

async function loadManifest() {

    try {

        const start = performance.now();


        // ---------------------------------------------------------------------
        // Chargement des deux fichiers en parallèle
        // ---------------------------------------------------------------------

        const [
            manifestResponse,
            indexResponse
        ] = await Promise.all([
            fetch(ManifestURL),
            fetch(IndexURL)
        ]);


        if (!manifestResponse.ok) {

            throw new Error(
                `Impossible de charger ExportManifest.json (${manifestResponse.status})`
            );
        }


        if (!indexResponse.ok) {

            throw new Error(
                `Impossible de charger warframe-manifest-index.json (${indexResponse.status})`
            );
        }


        // ---------------------------------------------------------------------
        // Parsing JSON
        // ---------------------------------------------------------------------

        const [
            manifestData,
            index
        ] = await Promise.all([
            manifestResponse.json(),
            indexResponse.json()
        ]);


        const manifest = manifestData.Manifest;


        // ---------------------------------------------------------------------
        // Construction de l'index
        // ---------------------------------------------------------------------

        const categories = buildCategoryIndex(index);


        const end = performance.now();


        console.log(
            `[Manifest] Données chargées en ${(end - start).toFixed(2)} ms`
        );

        console.log(
            `[Manifest] ${manifest.length} entrée(s) dans le manifest.`
        );

        console.log(
            `[Manifest] ${categories.length} règle(s) de catégorisation.`
        );


        // ---------------------------------------------------------------------
        // Rendu
        // ---------------------------------------------------------------------

        const renderStart = performance.now();


        renderManifest(
            manifest,
            categories
        );


        const renderEnd = performance.now();


        console.log(
            `[Manifest] Rendu effectué en ${(renderEnd - renderStart).toFixed(2)} ms`
        );

        console.log(
            "[Manifest] Prêt."
        );

    } catch (error) {

        console.error(
            "[Manifest] Erreur lors du chargement :",
            error
        );
    }
}


// -----------------------------------------------------------------------------
// Démarrage
// -----------------------------------------------------------------------------

loadManifest();