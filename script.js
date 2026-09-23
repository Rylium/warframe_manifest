const PublicExportURL = "https://content.warframe.com/PublicExport";
const container = document.getElementById("container");

document.addEventListener("DOMContentLoaded", async () => {
    const DATA_URL = "data/ExportManifest.json";

    if (!container) {
        console.error("L'élément #container est introuvable.");
        return;
    }

    try {
        const response = await fetch(DATA_URL);

        if (!response.ok) {
            throw new Error(
                `Impossible de charger ${DATA_URL} (${response.status} ${response.statusText})`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data.Manifest)) {
            throw new Error("La propriété Manifest est absente ou invalide.");
        }

        const root = createNode("");

        for (const item of data.Manifest) {
            if (!item || !item.uniqueName || !item.textureLocation) {
                continue;
            }

            const parts = item.uniqueName
                .split("/")
                .filter(Boolean);

            // "Lotus" est le dossier racine. Il ne compte pas comme famille.
            if (parts[0] === "Lotus") {
                parts.shift();
            }

            if (parts.length < 1) {
                continue;
            }

            insertItem(root, parts, item);
        }

        container.innerHTML = "";
        renderNode(root, container);

    } catch (error) {
        console.error(
            "Erreur lors du chargement du Manifest :",
            error
        );

        container.textContent =
            "Impossible de charger les données du manifest.";
    }


    /* === Création d'un nœud */

    function createNode(name) {
        return {
            name,
            children: new Map(),
            items: []
        };
    }


    /* === Construction de l'arbre */

    function insertItem(node, parts, item) {

        /*
         * Le dernier segment est toujours l'élément.
         *
         * Exemple :
         *
         * Upgrades
         * └── Skins
         *     └── Duelist
         *         └── DuelistSkin
         *
         * Familles :
         *   Upgrades
         *   Skins
         *   Duelist
         *
         * Élément :
         *   DuelistSkin
         */

        if (parts.length === 1) {
            node.items.push(item);
            return;
        }

        const familyName = parts.shift();

        if (!node.children.has(familyName)) {
            node.children.set(
                familyName,
                createNode(familyName)
            );
        }

        insertItem(
            node.children.get(familyName),
            parts,
            item
        );
    }


    /* === Rendu des familles */

    function renderNode(node, parentElement) {

        /* Éléments appartenant directement à cette famille. */
        for (const item of node.items) {
            parentElement.appendChild(
                createItemElement(item)
            );
        }


        /* Sous-familles. */
        for (const child of node.children.values()) {

            const family = document.createElement("div");
            family.className = "manifest-family";


            /* Nom de la famille */
            const title = document.createElement("div");

            title.className = "manifest-family-title";
            title.textContent = child.name;

            family.appendChild(title);


            /* Contenu de la famille */
            const content = document.createElement("div");

            content.className = "manifest-family-content";

            family.appendChild(content);


            /* Ajout au container */
            parentElement.appendChild(family);


            /* Rendu récursif */
            renderNode(child, content);
        }
    }


    /* === Création d'un élément */

    function createItemElement(item) {

        const wrapper = document.createElement("div");
        wrapper.className = "manifest-item";


        const image = document.createElement("img");

        image.src = PublicExportURL + item.textureLocation;
        image.alt = item.uniqueName;
        image.loading = "lazy";


        wrapper.appendChild(image);

        return wrapper;
    }
});