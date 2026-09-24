const PublicExportURL = "https://content.warframe.com/PublicExport";

const ManifestURL = "./data/ExportManifest.json";
const IndexURL = "./data/warframe-manifest-index.json";

const container = document.getElementById("container");


// -----------------------------------------------------------------------------
// Construction de l'index des catégories
// -----------------------------------------------------------------------------

function buildCategoryIndex(index) {

    const categories = [];

    function walk(node, groups) {

        if (!node || typeof node !== "object") {
            return;
        }


        // Paths associés à la catégorie actuelle.

        if (Array.isArray(node.paths)) {

            for (const path of node.paths) {

                if (typeof path !== "string" || !path) {
                    continue;
                }

                categories.push({
                    path,
                    groups
                });
            }
        }


        // Sous-catégories.

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

    /*
     * Les chemins les plus longs sont placés en premier.
     *
     * Ainsi, on peut arrêter la recherche dès qu'une correspondance
     * est trouvée.
     */

    categories.sort(
        (a, b) => b.path.length - a.path.length
    );

    return categories;
}


// -----------------------------------------------------------------------------
// Recherche d'une catégorie
// -----------------------------------------------------------------------------

function findCategory(uniqueName, categories) {

    for (const category of categories) {

        if (uniqueName.startsWith(category.path)) {
            return category;
        }
    }

    return null;
}


// -----------------------------------------------------------------------------
// Création d'une entrée
// -----------------------------------------------------------------------------

function createManifestItem(item, category) {

    const li = document.createElement("li");


    // -------------------------------------------------------------------------
    // Informations
    // -------------------------------------------------------------------------

    const info = document.createElement("div");


    const uniqueName = document.createElement("span");

    uniqueName.textContent = item.uniqueName;


    const textureLocation = document.createElement("span");

    textureLocation.textContent = item.textureLocation;


    info.appendChild(uniqueName);
    info.appendChild(textureLocation);


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
    // Bouton
    // -------------------------------------------------------------------------

    const openButton = document.createElement("button");

    openButton.type = "button";
    openButton.dataset.imageUrl =
        PublicExportURL + item.textureLocation;

    openButton.textContent = "Ouvrir l'image";

    info.appendChild(openButton);


    // -------------------------------------------------------------------------
    // Image
    // -------------------------------------------------------------------------

    const figure = document.createElement("figure");

    const img = document.createElement("img");

    const imageURL =
        PublicExportURL + item.textureLocation;

    img.src = imageURL;
    img.alt = item.uniqueName;

    /*
     * Le navigateur gère lui-même le chargement différé.
     *
     * Contrairement à un IntersectionObserver qui doit maintenir
     * une liste de milliers de cibles, loading="lazy" est géré
     * directement par le moteur du navigateur.
     */

    img.loading = "lazy";
    img.decoding = "async";
    img.fetchPriority = "low";


    figure.appendChild(img);


    // -------------------------------------------------------------------------
    // Assemblage
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

    const fragment = document.createDocumentFragment();

    const uncategorized = [];


    // -------------------------------------------------------------------------
    // Premier passage : éléments catégorisés
    // -------------------------------------------------------------------------

    for (const item of manifest) {

        const category = findCategory(
            item.uniqueName,
            categories
        );


        if (category) {

            fragment.appendChild(
                createManifestItem(
                    item,
                    category
                )
            );

        } else {

            uncategorized.push(item);
        }
    }


    // -------------------------------------------------------------------------
    // Deuxième passage : éléments non catégorisés
    // -------------------------------------------------------------------------

    for (const item of uncategorized) {

        fragment.appendChild(
            createManifestItem(
                item,
                null
            )
        );
    }


    // -------------------------------------------------------------------------
    // Une seule insertion dans le DOM
    // -------------------------------------------------------------------------

    list.appendChild(fragment);

    container.replaceChildren(list);


    // -------------------------------------------------------------------------
    // Ouverture des images
    // -------------------------------------------------------------------------
    //
    // Un seul listener pour tous les boutons.
    //

    list.addEventListener("click", event => {

        const button = event.target.closest(
            "button[data-image-url]"
        );

        if (!button) {
            return;
        }

        window.open(
            button.dataset.imageUrl,
            "_blank",
            "noopener,noreferrer"
        );
    });


    // -------------------------------------------------------------------------
    // Statistiques
    // -------------------------------------------------------------------------

    console.log(
        `[Manifest] ${manifest.length} élément(s) total.`
    );

    console.log(
        `[Manifest] ${manifest.length - uncategorized.length} élément(s) catégorisé(s).`
    );

    console.log(
        `[Manifest] ${uncategorized.length} élément(s) non catégorisé(s).`
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
        // Chargement parallèle des deux JSON
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
        // Parsing parallèle
        // ---------------------------------------------------------------------

        const [
            manifestData,
            index
        ] = await Promise.all([
            manifestResponse.json(),
            indexResponse.json()
        ]);


        const manifest = manifestData.Manifest;


        const loadEnd = performance.now();


        console.log(
            `[Manifest] JSON chargés en ${(loadEnd - start).toFixed(2)} ms`
        );


        // ---------------------------------------------------------------------
        // Construction de l'index
        // ---------------------------------------------------------------------

        const indexStart = performance.now();

        const categories =
            buildCategoryIndex(index);


        const indexEnd = performance.now();


        console.log(
            `[Manifest] ${categories.length} règle(s) de catégorisation.`
        );

        console.log(
            `[Manifest] Index construit en ${(indexEnd - indexStart).toFixed(2)} ms`
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
            `[Manifest] DOM construit en ${(renderEnd - renderStart).toFixed(2)} ms`
        );

        console.log(
            `[Manifest] Prêt. Temps total : ${(renderEnd - start).toFixed(2)} ms`
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