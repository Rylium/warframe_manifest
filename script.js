const PublicExportURL = "https://content.warframe.com/PublicExport";
const container = document.getElementById("container");

// IntersectionObserver définit 'src' uniquement lorsque l'image arrive sur l'écran
const imageObserver = new IntersectionObserver((entries, observer) => {

  entries.forEach((entry) => {

    if (!entry.isIntersecting) {
      return;
    }

    const img = entry.target;

    img.src = img.dataset.src;

    observer.unobserve(img);
  });

});

// Crée une image à partir d'un élément du Manifest
function createImage(item) {

  const img = document.createElement("img");

  const parts = item.uniqueName.split("/").filter(Boolean);
  const itemName = parts[parts.length - 1];

  img.dataset.src = PublicExportURL + item.textureLocation;
  img.alt = itemName;

  imageObserver.observe(img);

  return img;
}


// Crée un groupe
function createGroup(name) {
  // Conteneur général du groupe
  const wrapper = document.createElement("div");

  // Titre du groupe
  const title = document.createElement("h2");
  title.textContent = name;

  // Conteneur du contenu du groupe
  const content = document.createElement("div");

  // Permet d'identifier le groupe
  content.dataset.parent = name;

  wrapper.appendChild(title);
  wrapper.appendChild(content);

  return {
    wrapper,
    content
  };
}


// Recherche un groupe enfant existant
function findGroup(parent, name) {
  return Array.from(parent.children).find((element) => {
    return (
      element.dataset &&
      element.dataset.parent === name
    );
  });
}


// Chargement du Manifest
fetch("./ExportManifest.json")
  .then((response) => {

    if (!response.ok) {
      throw new Error(
        `Impossible de charger ExportManifest.json (${response.status})`
      );
    }

    return response.json();
  })

  .then((data) => {

    console.log("Manifest chargé :", data);

    data.Manifest.forEach((item) => {

      // Découpe du uniqueName
      const parts = item.uniqueName
        .split("/")
        .filter(Boolean);


      /*
        Exemple :
        "/Lotus/Characters/Tenno/Accessory/Scarves/GrnBannerScarf/GrnBannerScarfItem"
        devient :
        [ "Lotus", "Characters", "Tenno", "Accessory", "Scarves", "GrnBannerScarf", "GrnBannerScarfItem" ]
      */


      // Vérifications
      if (parts.length < 3) {
        console.warn(
          "uniqueName trop court :",
          item.uniqueName
        );

        return;
      }

      // Suppression de "Lotus"
      const path = parts.slice(1);
      // path: [ "Characters", "Tenno", "Accessory", "Scarves", "GrnBannerScarf", "GrnBannerScarfItem" ]

      // Le dernier élément est le nom de l'item: "GrnBannerScarfItem"
      const itemName = path.pop();

      // Construction de l'arborescence
      let currentContainer = container;

      path.forEach((groupName) => {

        // Cherche si ce groupe existe déjà
        let groupContent = findGroup(
          currentContainer,
          groupName
        );


        // Si le groupe n'existe pas, on le crée
        if (!groupContent) {
          const group = createGroup(groupName);

          currentContainer.appendChild(group.wrapper);
          groupContent = group.content;
        }

        currentContainer = groupContent; // Descend dans le groupe
      });


      // Ajout de l'image
      let list = currentContainer.querySelector(":scope > ul");

      if (!list) {
        list = document.createElement("ul");
        currentContainer.appendChild(list);
      }


      const listItem = document.createElement("li");
      const img = createImage(item);

      // On utilise explicitement le dernier élément comme ' alt="" '
      img.alt = itemName;

      listItem.appendChild(img);
      list.appendChild(listItem);
    });

  })

  .catch((error) => {
    console.error(
      "Erreur lors du chargement du JSON :",
      error
    );
  });