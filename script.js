const BASE_URL = "https://content.warframe.com/PublicExport";
const container = document.getElementById("container");

fetch("./ExportManifest.json")
  .then((response) => response.json())
  .then((data) => {

    console.log(data);

    data.Manifest.forEach((item) => {

      const img = document.createElement("img");

      img.src = BASE_URL + item.textureLocation;
      img.alt = item.uniqueName;

      container.appendChild(img);

    });

  })
  .catch((error) => {
    console.error("Erreur lors du chargement du JSON :", error);
  });