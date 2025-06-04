const fs = require('fs');
const path = require('path');

// Configuration du projet
const projectName = 'netflix-pwa'; // ou le nom de votre projet
const baseDir = './src'; // Répertoire de base

// Structure des dossiers et fichiers à créer
const structure = {
  components: {
    Header: ['Header.js', 'Header.css'],
    Footer: ['Footer.js', 'Footer.css'],
    ScrollToTop: ['ScrollToTop.js'],
    LoadingSpinner: ['LoadingSpinner.js', 'LoadingSpinner.css'],
    Slider: ['Slider.js', 'Slider.css']
  },
  pages: {
    Home: ['Home.js', 'Home.css'],
    About: ['About.js', 'About.css'],
    Services: ['Services.js', 'Services.css'],
    Portfolio: ['Portfolio.js', 'Portfolio.css'],
    Contact: ['Contact.js', 'Contact.css'],
    NotFound: ['NotFound.js', 'NotFound.css']
  },
  styles: ['App.css', 'Variables.css', 'Animations.css'],
  contexts: ['AppContext.js']
};

// Templates pour les différents types de fichiers
const templates = {
  // Template pour les composants React
  component: (name) => `import React from 'react';
import './${name}.css';

const ${name} = () => {
  return (
    <div className="${name.toLowerCase()}">
      <h1>${name} Component</h1>
      <p>Contenu du composant ${name}</p>
    </div>
  );
};

export default ${name};`,

  // Template pour les pages React
  page: (name) => `import React from 'react';
import './${name}.css';

const ${name} = () => {
  return (
    <div className="${name.toLowerCase()}-page">
      <div className="container">
        <h1>Page ${name}</h1>
        <p>Contenu de la page ${name}</p>
      </div>
    </div>
  );
};

export default ${name};`,

  // Template pour les fichiers CSS
  css: (name) => `.${name.toLowerCase()} {
  padding: 2rem 0;
  min-height: calc(100vh - 140px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.${name.toLowerCase()} h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 1rem;
  text-align: center;
}

.${name.toLowerCase()} p {
  font-size: 1.1rem;
  color: #666;
  line-height: 1.6;
  text-align: center;
}

@media (max-width: 768px) {
  .${name.toLowerCase()} h1 {
    font-size: 2rem;
  }
}`,

  // Template spécifique pour ScrollToTop
  scrollToTop: () => `import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;`,

  // Template spécifique pour LoadingSpinner
  loadingSpinner: () => `import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', color = 'primary' }) => {
  return (
    <div className={\`loading-spinner \${size} \${color}\`}>
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner;`,

  // Template pour LoadingSpinner CSS
  loadingSpinnerCSS: () => `.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.spinner {
  border: 3px solid rgba(102, 126, 234, 0.1);
  border-radius: 50%;
  border-top: 3px solid #667eea;
  animation: spin 1s linear infinite;
}

.loading-spinner.small .spinner {
  width: 20px;
  height: 20px;
}

.loading-spinner.medium .spinner {
  width: 40px;
  height: 40px;
}

.loading-spinner.large .spinner {
  width: 60px;
  height: 60px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`,

  // Template pour AppContext
  appContext: () => `import React, { createContext, useContext, useReducer } from 'react';

// État initial
const initialState = {
  theme: 'light',
  loading: false,
  user: null,
  notifications: []
};

// Actions
const AppActionTypes = {
  SET_THEME: 'SET_THEME',
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case AppActionTypes.SET_THEME:
      return { ...state, theme: action.payload };
    case AppActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case AppActionTypes.SET_USER:
      return { ...state, user: action.payload };
    case AppActionTypes.ADD_NOTIFICATION:
      return { 
        ...state, 
        notifications: [...state.notifications, action.payload] 
      };
    case AppActionTypes.REMOVE_NOTIFICATION:
      return { 
        ...state, 
        notifications: state.notifications.filter(n => n.id !== action.payload) 
      };
    default:
      return state;
  }
};

// Context
const AppContext = createContext();

// Provider
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actions = {
    setTheme: (theme) => dispatch({ type: AppActionTypes.SET_THEME, payload: theme }),
    setLoading: (loading) => dispatch({ type: AppActionTypes.SET_LOADING, payload: loading }),
    setUser: (user) => dispatch({ type: AppActionTypes.SET_USER, payload: user }),
    addNotification: (notification) => dispatch({ 
      type: AppActionTypes.ADD_NOTIFICATION, 
      payload: { ...notification, id: Date.now() } 
    }),
    removeNotification: (id) => dispatch({ type: AppActionTypes.REMOVE_NOTIFICATION, payload: id })
  };

  return (
    <AppContext.Provider value={{ state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook personnalisé
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};`,

  // Templates pour les styles globaux
  appCSS: () => `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
}

.App {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Animations globales */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.6s ease-out;
}

/* Styles pour les liens */
a {
  color: #667eea;
  text-decoration: none;
  transition: color 0.3s ease;
}

a:hover {
  color: #764ba2;
}

/* Styles pour les boutons */
button {
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }
}

/* Scrollbar personnalisée */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #764ba2;
}`,

  variablesCSS: () => `:root {
  /* Couleurs principales */
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #f093fb;
  
  /* Couleurs neutres */
  --white: #ffffff;
  --black: #000000;
  --gray-100: #f8f9fa;
  --gray-200: #e9ecef;
  --gray-300: #dee2e6;
  --gray-400: #ced4da;
  --gray-500: #adb5bd;
  --gray-600: #6c757d;
  --gray-700: #495057;
  --gray-800: #343a40;
  --gray-900: #212529;
  
  /* Couleurs d'état */
  --success-color: #28a745;
  --warning-color: #ffc107;
  --error-color: #dc3545;
  --info-color: #17a2b8;
  
  /* Typographie */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
  --font-size-4xl: 2.5rem;
  
  /* Espacements */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Bordures */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
  --border-radius-full: 9999px;
  
  /* Ombres */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
  --transition-slow: 0.5s ease;
}`,

  animationsCSS: () => `/* Animations d'entrée */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Classes utilitaires pour les animations */
.fade-in {
  animation: fadeIn 0.5s ease-out;
}

.slide-in-left {
  animation: slideInLeft 0.5s ease-out;
}

.slide-in-right {
  animation: slideInRight 0.5s ease-out;
}

.scale-in {
  animation: scaleIn 0.3s ease-out;
}

/* Animations au hover */
.hover-lift {
  transition: transform 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-5px);
}

.hover-scale {
  transition: transform 0.3s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}

/* Animation de chargement */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spin {
  animation: spin 1s linear infinite;
}

/* Animation de pulsation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}`
};

// Fonction pour créer un dossier s'il n'existe pas
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Dossier créé: ${dirPath}`);
  }
}

// Fonction pour écrire un fichier
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fichier créé: ${filePath}`);
}

// Fonction pour obtenir le contenu approprié selon le type de fichier
function getFileContent(fileName, componentName, type) {
  const name = componentName || fileName.replace('.js', '').replace('.css', '');
  
  // Cas spéciaux
  if (fileName === 'ScrollToTop.js') {
    return templates.scrollToTop();
  }
  
  if (fileName === 'LoadingSpinner.js') {
    return templates.loadingSpinner();
  }
  
  if (fileName === 'LoadingSpinner.css') {
    return templates.loadingSpinnerCSS();
  }
  
  if (fileName === 'AppContext.js') {
    return templates.appContext();
  }
  
  if (fileName === 'App.css') {
    return templates.appCSS();
  }
  
  if (fileName === 'Variables.css') {
    return templates.variablesCSS();
  }
  
  if (fileName === 'Animations.css') {
    return templates.animationsCSS();
  }
  
  // Cas généraux
  if (fileName.endsWith('.js')) {
    if (type === 'page') {
      return templates.page(name);
    } else {
      return templates.component(name);
    }
  }
  
  if (fileName.endsWith('.css')) {
    return templates.css(name);
  }
  
  return `/* ${fileName} */\n`;
}

// Fonction principale pour générer tous les fichiers
function generateFiles() {
  console.log('🚀 Génération des fichiers manquants...\n');
  
  // Créer les composants
  Object.keys(structure.components).forEach(componentName => {
    const componentDir = path.join(baseDir, 'components', componentName);
    ensureDirectoryExists(componentDir);
    
    structure.components[componentName].forEach(fileName => {
      const filePath = path.join(componentDir, fileName);
      if (!fs.existsSync(filePath)) {
        const content = getFileContent(fileName, componentName, 'component');
        writeFile(filePath, content);
      }
    });
  });
  
  // Créer les pages
  Object.keys(structure.pages).forEach(pageName => {
    const pageDir = path.join(baseDir, 'pages', pageName);
    ensureDirectoryExists(pageDir);
    
    structure.pages[pageName].forEach(fileName => {
      const filePath = path.join(pageDir, fileName);
      if (!fs.existsSync(filePath)) {
        const content = getFileContent(fileName, pageName, 'page');
        writeFile(filePath, content);
      }
    });
  });
  
  // Créer les styles
  const stylesDir = path.join(baseDir, 'styles');
  ensureDirectoryExists(stylesDir);
  
  structure.styles.forEach(fileName => {
    const filePath = path.join(stylesDir, fileName);
    if (!fs.existsSync(filePath)) {
      const content = getFileContent(fileName);
      writeFile(filePath, content);
    }
  });
  
  // Créer les contexts
  const contextsDir = path.join(baseDir, 'contexts');
  ensureDirectoryExists(contextsDir);
  
  structure.contexts.forEach(fileName => {
    const filePath = path.join(contextsDir, fileName);
    if (!fs.existsSync(filePath)) {
      const content = getFileContent(fileName);
      writeFile(filePath, content);
    }
  });
  
  console.log('\n✨ Tous les fichiers ont été générés avec succès !');
  console.log('\n📋 Prochaines étapes :');
  console.log('1. Installer les dépendances manquantes :');
  console.log('   npm install react-helmet-async');
  console.log('2. Redémarrer le serveur de développement');
  console.log('3. Personnaliser le contenu des composants selon vos besoins');
  
  console.log('\n📁 Structure créée :');
  console.log('src/');
  console.log('├── components/');
  console.log('│   ├── Header/');
  console.log('│   ├── Footer/');
  console.log('│   ├── ScrollToTop/');
  console.log('│   ├── LoadingSpinner/');
  console.log('│   └── Slider/');
  console.log('├── pages/');
  console.log('│   ├── Home/');
  console.log('│   ├── About/');
  console.log('│   ├── Services/');
  console.log('│   ├── Portfolio/');
  console.log('│   ├── Contact/');
  console.log('│   └── NotFound/');
  console.log('├── styles/');
  console.log('└── contexts/');
}

// Exécuter la génération
generateFiles();
