const fs = require("fs");
const path = require("path");

// Dossier racine des pages
const pagesDir = path.join(__dirname, "src", "pages");

// Liste des composants dossiers à générer (avec index.js)
const components = [
  "About",
  "Contact",
  "Services",
  "Portfolio",
  "NotFound",
];

// Contenu template du fichier index.js par défaut
const template = (componentName) => `import React from 'react';

const ${componentName} = () => {
  return (
    <div>
      <h1>${componentName} Page</h1>
      <p>Contenu de la page ${componentName}.</p>
    </div>
  );
};

export default ${componentName};
`;

// Fonction qui crée un dossier + index.js
const createComponent = (name) => {
  const dir = path.join(pagesDir, name);

  // Crée le dossier s'il n'existe pas
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Dossier créé : ${dir}`);
  } else {
    console.log(`Dossier déjà existant : ${dir}`);
  }

  // Crée/écrase le fichier index.js
  const filePath = path.join(dir, "index.js");
  fs.writeFileSync(filePath, template(name), "utf-8");
  console.log(`Fichier créé : ${filePath}`);
};

// Lancer la génération
components.forEach(createComponent);

console.log("Génération terminée !");
