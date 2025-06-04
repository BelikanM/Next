const fs = require('fs');
const path = require('path');

// Configuration du projet
const projectName = 'modern-react-app';
const projectStructure = {
  'src': {
    'components': {
      'Header': {},
      'Footer': {},
      'Slider': {}
    },
    'pages': {
      'Home': {},
      'About': {},
      'Services': {},
      'Portfolio': {},
      'Contact': {}
    },
    'styles': {},
    'assets': {
      'icons': {}
    }
  },
  'public': {}
};

// Fonction pour créer la structure des dossiers
function createDirectoryStructure(basePath, structure) {
  Object.keys(structure).forEach(key => {
    const currentPath = path.join(basePath, key);
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath, { recursive: true });
    }
    if (typeof structure[key] === 'object' && Object.keys(structure[key]).length > 0) {
      createDirectoryStructure(currentPath, structure[key]);
    }
  });
}

// Fonction pour écrire un fichier
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Créé: ${filePath}`);
}

// Contenu des fichiers
const files = {
  // Package.json
  'package.json': `{
  "name": "${projectName}",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "react-scripts": "5.0.1",
    "lucide-react": "^0.263.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`,

  // Public/index.html
  'public/index.html': `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Application React moderne avec navigation" />
    <title>Modern React App</title>
  </head>
  <body>
    <noscript>Vous devez activer JavaScript pour utiliser cette application.</noscript>
    <div id="root"></div>
  </body>
</html>`,

  // App.js principal
  'src/App.js': `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Services from './pages/Services/Services';
import Portfolio from './pages/Portfolio/Portfolio';
import Contact from './pages/Contact/Contact';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;`,

  // Index.js
  'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

  // Header Component
  'src/components/Header/Header.js': `import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  User, 
  Settings, 
  Briefcase, 
  Mail, 
  Menu, 
  X 
} from 'lucide-react';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Accueil', icon: Home },
    { path: '/about', label: 'À propos', icon: User },
    { path: '/services', label: 'Services', icon: Settings },
    { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
    { path: '/contact', label: 'Contact', icon: Mail }
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <span className="logo-text">ModernApp</span>
          </Link>
        </div>

        <nav className={\`nav \${isMenuOpen ? 'nav-open' : ''}\`}>
          <ul className="nav-list">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.path} className="nav-item">
                  <Link 
                    to={item.path} 
                    className={\`nav-link \${location.pathname === item.path ? 'active' : ''}\`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <IconComponent size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button className="menu-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
};

export default Header;`,

  // Header CSS
  'src/components/Header/Header.css': `.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

.logo-text {
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 2rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateY(-2px);
}

.nav-link.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }

  .nav-open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .nav-list {
    flex-direction: column;
    padding: 1rem;
    gap: 0;
  }

  .nav-link {
    padding: 1rem;
    border-radius: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .menu-toggle {
    display: block;
  }
}`,

  // Footer Component
  'src/components/Footer/Footer.js': `import React from 'react';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin 
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' }
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">ModernApp</h3>
            <p className="footer-description">
              Une application React moderne avec une navigation élégante 
              et un design responsive.
            </p>
            <div className="social-links">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <a 
                    key={index}
                    href={social.href} 
                    className="social-link"
                    aria-label={social.label}
                  >
                    <IconComponent size={20} />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-subtitle">Navigation</h4>
            <ul className="footer-links">
              <li><a href="/">Accueil</a></li>
              <li><a href="/about">À propos</a></li>
              <li><a href="/services">Services</a></li>
              <li><a href="/portfolio">Portfolio</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-subtitle">Contact</h4>
            <div className="contact-info">
              <div className="contact-item">
                <Mail size={16} />
                <span>contact@modernapp.com</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>+33 1 23 45 67 89</span>
              </div>
              <div className="contact-item">
                <MapPin size={16} />
                <span>Paris, France</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} ModernApp. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;`,

  // Footer CSS
  'src/components/Footer/Footer.css': `.footer {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 20px 1rem;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h3,
.footer-section h4 {
  margin-bottom: 1rem;
}

.footer-title {
  font-size: 1.5rem;
  background: linear-gradient(45deg, #3498db, #2ecc71);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-subtitle {
  color: #3498db;
  font-size: 1.1rem;
}

.footer-description {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: #3498db;
  transform: translateY(-2px);
}

.footer-links {
  list-style: none;
  padding: 0;
}

.footer-links li {
  margin-bottom: 0.5rem;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: #3498db;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .social-links {
    justify-content: center;
  }
}`,

  // Slider Component
  'src/components/Slider/Slider.js': `import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Slider.css';

const Slider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "Bienvenue sur ModernApp",
      subtitle: "Une expérience utilisateur exceptionnelle",
      description: "Découvrez notre application React moderne avec une navigation intuitive et un design élégant.",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      id: 2,
      title: "Design Moderne",
      subtitle: "Interface utilisateur responsive",
      description: "Notre design s'adapte parfaitement à tous les appareils pour une expérience optimale.",
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
      id: 3,
      title: "Performance Optimisée",
      subtitle: "Rapidité et efficacité",
      description: "Profitez d'une application rapide et performante grâce aux dernières technologies React.",
      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="slider">
      <div className="slider-container">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={\`slide \${index === currentSlide ? 'active' : ''}\`}
            style={{ background: slide.background }}
          >
            <div className="slide-content">
              <h1 className="slide-title">{slide.title}</h1>
              <h2 className="slide-subtitle">{slide.subtitle}</h2>
              <p className="slide-description">{slide.description}</p>
              <button className="slide-cta">En savoir plus</button>
            </div>
          </div>
        ))}
      </div>

      <button className="slider-btn slider-btn-prev" onClick={prevSlide}>
        <ChevronLeft size={24} />
      </button>
      <button className="slider-btn slider-btn-next" onClick={nextSlide}>
        <ChevronRight size={24} />
      </button>

      <div className="slider-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={\`dot \${index === currentSlide ? 'active' : ''}\`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Slider;`,

  // Slider CSS
  'src/components/Slider/Slider.css': `.slider {
  position: relative;
  height: 500px;
  overflow: hidden;
  border-radius: 12px;
  margin: 2rem 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.slider-container {
  position: relative;
  height: 100%;
}

.slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
}

.slide.active {
  opacity: 1;
}

.slide-content {
  text-align: center;
  color: white;
  max-width: 600px;
  padding: 2rem;
}

.slide-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.slide-subtitle {
  font-size: 1.5rem;
  font-weight: 300;
  margin-bottom: 1rem;
  opacity: 0.9;
}

.slide-description {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  opacity: 0.8;
}

.slide-cta {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  padding: 12px 30px;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.slide-cta:hover {
  background: white;
  color: #333;
  transform: translateY(-2px);
}

.slider-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-50%) scale(1.1);
}

.slider-btn-prev {
  left: 20px;
}

.slider-btn-next {
  right: 20px;
}

.slider-dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  background: white;
  transform: scale(1.2);
}

@media (max-width: 768px) {
  .slider {
    height: 400px;
    margin: 1rem 0;
  }

  .slide-title {
    font-size: 2rem;
  }

  .slide-subtitle {
    font-size: 1.2rem;
  }

  .slide-description {
    font-size: 1rem;
  }

  .slider-btn {
    width: 40px;
    height: 40px;
  }

  .slider-btn-prev {
    left: 10px;
  }

  .slider-btn-next {
    right: 10px;
  }
}`,

  // Page Home
  'src/pages/Home/Home.js': `import React from 'react';
import Slider from '../../components/Slider/Slider';
import { ArrowRight, Star, Users, Award } from 'lucide-react';
import './Home.css';

const Home = () => {
  const features = [
    {
      icon: Star,
      title: "Qualité Premium",
      description: "Des solutions de haute qualité pour vos projets"
    },
    {
      icon: Users,
      title: "Équipe Experte",
      description: "Une équipe de professionnels à votre service"
    },
    {
      icon: Award,
      title: "Reconnu",
      description: "Récompensé pour l'excellence de nos services"
    }
  ];

  return (
    <div className="home">
      <Slider />
      
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Pourquoi nous choisir ?</h2>
          <div className="features-grid">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="feature-card">
                  <div className="feature-icon">
                    <IconComponent size={32} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Prêt à commencer ?</h2>
            <p>Découvrez comment nous pouvons vous aider à atteindre vos objectifs.</p>
            <button className="cta-button">
              Contactez-nous
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;`,

  // Home CSS
  'src/pages/Home/Home.css': `.home {
  min-height: calc(100vh - 140px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.features-section {
  padding: 4rem 0;
  background: #f8f9fa;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: white;
  margin-bottom: 1.5rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

.cta-section {
  padding: 4rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.cta-content {
  text-align: center;
}

.cta-content h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.cta-content p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  color: #667eea;
  border: none;
  padding: 15px 30px;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}`,

  // Page About
  'src/pages/About/About.js': `import React from 'react';
import { Target, Eye, Heart } from 'lucide-react';
import './About.css';

const About = () => {
  return (
    <div className="about">
      <div className="container">
        <div className="hero-section">
          <h1>À propos de nous</h1>
          <p className="hero-text">
            Nous sommes une équipe passionnée dédiée à créer des expériences 
            numériques exceptionnelles qui transforment les idées en réalité.
          </p>
        </div>

        <div className="values-section">
          <h2>Nos valeurs</h2>
          <div className="values-grid">
            <div className="value-card">
              <Target size={48} />
              <h3>Mission</h3>
              <p>Fournir des solutions innovantes qui dépassent les attentes de nos clients.</p>
            </div>
            <div className="value-card">
              <Eye size={48} />
              <h3>Vision</h3>
              <p>Être le leader dans le développement d'applications web modernes.</p>
            </div>
            <div className="value-card">
              <Heart size={48} />
              <h3>Passion</h3>
              <p>Nous aimons ce que nous faisons et cela se reflète dans notre travail.</p>
            </div>
          </div>
        </div>

        <div className="story-section">
          <h2>Notre histoire</h2>
          <p>
            Fondée en 2020, notre entreprise a commencé avec une vision simple : 
            créer des applications web qui allient beauté, fonctionnalité et performance. 
            Depuis, nous avons aidé des dizaines d'entreprises à digitaliser leurs processus 
            et à atteindre leurs objectifs grâce à des solutions sur mesure.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;`,

  // About CSS
  'src/pages/About/About.css': `.about {
  padding: 2rem 0;
  min-height: calc(100vh - 140px);
}

.hero-section {
  text-align: center;
  padding: 3rem 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  margin-bottom: 3rem;
}

.hero-section h1 {
  font-size: 3rem;
  color: #333;
  margin-bottom: 1rem;
}

.hero-text {
  font-size: 1.2rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.values-section {
  margin-bottom: 3rem;
}

.values-section h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #333;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.value-card {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.value-card:hover {
  transform: translateY(-5px);
}

.value-card svg {
  color: #667eea;
  margin-bottom: 1rem;
}

.value-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.value-card p {
  color: #666;
  line-height: 1.6;
}

.story-section {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.story-section h2 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.story-section p {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #666;
}`,

  // Page Services
  'src/pages/Services/Services.js': `import React from 'react';
import { Code, Smartphone, Globe, Zap } from 'lucide-react';
import './Services.css';

const Services = () => {
  const services = [
    {
      icon: Code,
      title: "Développement Web",
      description: "Applications web modernes et performantes avec React, Vue.js et Angular.",
      features: ["React/Vue.js", "Node.js", "API REST", "Base de données"]
    },
    {
      icon: Smartphone,
      title: "Applications Mobile",
      description: "Applications mobiles natives et hybrides pour iOS et Android.",
      features: ["React Native", "Flutter", "iOS/Android", "App Store"]
    },
    {
      icon: Globe,
      title: "Sites Web",
      description: "Sites web responsives et optimisés pour le référencement.",
      features: ["Design responsive", "SEO optimisé", "Performance", "Sécurité"]
    },
    {
      icon: Zap,
      title: "Optimisation",
      description: "Amélioration des performances et de l'expérience utilisateur.",
      features: ["Audit technique", "Optimisation", "Monitoring", "Maintenance"]
    }
  ];

  return (
    <div className="services">
      <div className="container">
        <div className="hero-section">
          <h1>Nos Services</h1>
          <p>Des solutions complètes pour tous vos besoins numériques</p>
        </div>

        <div className="services-grid">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <div key={index} className="service-card">
                <div className="service-icon">
                  <IconComponent size={40} />
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ul className="service-features">
                  {service.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
                <button className="service-btn">En savoir plus</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Services;`,

  // Services CSS
  'src/pages/Services/Services.css': `.services {
  padding: 2rem 0;
  min-height: calc(100vh - 140px);
}

.hero-section {
  text-align: center;
  padding: 3rem 0;
  margin-bottom: 3rem;
}

.hero-section h1 {
  font-size: 3rem;
  color: #333;
  margin-bottom: 1rem;
}

.hero-section p {
  font-size: 1.2rem;
  color: #666;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.service-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  text-align: center;
}

.service-card:hover {
  transform: translateY(-5px);
}

.service-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: white;
  margin-bottom: 1.5rem;
}

.service-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.service-card p {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.service-features {
  list-style: none;
  padding: 0;
  margin-bottom: 2rem;
}

.service-features li {
  padding: 0.5rem 0;
  color: #555;
  border-bottom: 1px solid #eee;
}

.service-features li:last-child {
  border-bottom: none;
}

.service-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.3s ease;
  font-weight: 600;
}

.service-btn:hover {
  transform: translateY(-2px);
}`,

  // Page Portfolio
  'src/pages/Portfolio/Portfolio.js': `import React from 'react';
import { ExternalLink, Github } from 'lucide-react';
import './Portfolio.css';

const Portfolio = () => {
  const projects = [
    {
      id: 1,
      title: "E-commerce Platform",
      description: "Plateforme e-commerce complète avec panier, paiement et gestion des commandes.",
      technologies: ["React", "Node.js", "MongoDB", "Stripe"],
      image: "https://via.placeholder.com/400x250/667eea/ffffff?text=E-commerce",
      demoLink: "#",
      codeLink: "#"
    },
    {
      id: 2,
      title: "Dashboard Analytics",
      description: "Tableau de bord analytique avec graphiques interactifs et données en temps réel.",
      technologies: ["Vue.js", "D3.js", "Express", "PostgreSQL"],
      image: "https://via.placeholder.com/400x250/764ba2/ffffff?text=Dashboard",
      demoLink: "#",
      codeLink: "#"
    },
    {
      id: 3,
      title: "Mobile App",
      description: "Application mobile de gestion de tâches avec synchronisation cloud.",
      technologies: ["React Native", "Firebase", "Redux", "AsyncStorage"],
      image: "https://via.placeholder.com/400x250/f093fb/ffffff?text=Mobile+App",
      demoLink: "#",
      codeLink: "#"
    },
    {
      id: 4,
      title: "Blog Platform",
      description: "Plateforme de blog avec éditeur riche et système de commentaires.",
      technologies: ["Next.js", "Prisma", "MySQL", "TailwindCSS"],
      image: "https://via.placeholder.com/400x250/4facfe/ffffff?text=Blog",
      demoLink: "#",
      codeLink: "#"
    }
  ];

  return (
    <div className="portfolio">
      <div className="container">
        <div className="hero-section">
          <h1>Notre Portfolio</h1>
          <p>Découvrez nos réalisations et projets récents</p>
        </div>

        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-image">
                <img src={project.image} alt={project.title} />
                <div className="project-overlay">
                  <div className="project-links">
                    <a href={project.demoLink} className="project-link">
                      <ExternalLink size={20} />
                    </a>
                    <a href={project.codeLink} className="project-link">
                      <Github size={20} />
                    </a>
                  </div>
                </div>
              </div>
              <div className="project-content">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="project-technologies">
                  {project.technologies.map((tech, index) => (
                    <span key={index} className="tech-tag">{tech}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;`,

  // Portfolio CSS
  'src/pages/Portfolio/Portfolio.css': `.portfolio {
  padding: 2rem 0;
  min-height: calc(100vh - 140px);
}

.hero-section {
  text-align: center;
  padding: 3rem 0;
  margin-bottom: 3rem;
}

.hero-section h1 {
  font-size: 3rem;
  color: #333;
  margin-bottom: 1rem;
}

.hero-section p {
  font-size: 1.2rem;
  color: #666;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.project-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.project-card:hover {
  transform: translateY(-5px);
}

.project-image {
  position: relative;
  overflow: hidden;
}

.project-image img {
  width: 100%;
  height: 250px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.project-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.project-card:hover .project-overlay {
  opacity: 1;
}

.project-card:hover .project-image img {
  transform: scale(1.1);
}

.project-links {
  display: flex;
  gap: 1rem;
}

.project-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.project-link:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.project-content {
  padding: 1.5rem;
}

.project-content h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.project-content p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.project-technologies {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tech-tag {
  background: #f8f9fa;
  color: #667eea;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}`,

  // Page Contact
  'src/pages/Contact/Contact.js': `import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Ici vous pouvez ajouter la logique d'envoi du formulaire
    alert('Message envoyé avec succès !');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="contact">
      <div className="container">
        <div className="hero-section">
          <h1>Contactez-nous</h1>
          <p>Nous sommes là pour répondre à toutes vos questions</p>
        </div>

        <div className="contact-content">
          <div className="contact-info">
            <h2>Informations de contact</h2>
            <div className="contact-item">
              <Mail size={24} />
              <div>
                <h3>Email</h3>
                <p>contact@modernapp.com</p>
              </div>
            </div>
            <div className="contact-item">
              <Phone size={24} />
              <div>
                <h3>Téléphone</h3>
                <p>+33 1 23 45 67 89</p>
              </div>
            </div>
            <div className="contact-item">
              <MapPin size={24} />
              <div>
                <h3>Adresse</h3>
                <p>123 Rue de la Paix<br />75001 Paris, France</p>
              </div>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <h2>Envoyez-nous un message</h2>
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Votre nom"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Votre email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                name="subject"
                placeholder="Sujet"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <textarea
                name="message"
                placeholder="Votre message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            <button type="submit" className="submit-btn">
              <Send size={20} />
              Envoyer le message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;`,

  // Contact CSS
  'src/pages/Contact/Contact.css': `.contact {
  padding: 2rem 0;
  min-height: calc(100vh - 140px);
}

.hero-section {
  text-align: center;
  padding: 3rem 0;
  margin-bottom: 3rem;
}

.hero-section h1 {
  font-size: 3rem;
  color: #333;
  margin-bottom: 1rem;
}

.hero-section p {
  font-size: 1.2rem;
  color: #666;
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;
}

.contact-info h2,
.contact-form h2 {
  font-size: 1.8rem;
  margin-bottom: 2rem;
  color: #333;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.contact-item svg {
  color: #667eea;
  margin-top: 0.25rem;
}

.contact-item h3 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.contact-item p {
  color: #666;
  line-height: 1.6;
}

.contact-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.submit-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s ease;
  width: 100%;
  justify-content: center;
}

.submit-btn:hover {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .contact-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .hero-section h1 {
    font-size: 2rem;
  }
}`,

  // CSS principal
  'src/styles/App.css': `* {
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
}`
};

// Fonction principale pour générer le projet
function generateProject() {
  console.log('🚀 Génération du projet React...\n');

  // Créer le dossier principal
  if (!fs.existsSync(projectName)) {
    fs.mkdirSync(projectName);
  }

  // Créer la structure des dossiers
  createDirectoryStructure(projectName, projectStructure);

  // Créer tous les fichiers
  Object.keys(files).forEach(filePath => {
    const fullPath = path.join(projectName, filePath);
    writeFile(fullPath, files[filePath]);
  });

  console.log('\n✨ Projet généré avec succès !');
  console.log('\n📋 Instructions pour démarrer :');
  console.log(`1. cd ${projectName}`);
  console.log('2. npm install');
  console.log('3. npm start');
  console.log('\n🎉 Votre application sera disponible sur http://localhost:3000');
  console.log('\n📁 Structure du projet :');
  console.log('├── src/');
  console.log('│   ├── components/');
  console.log('│   │   ├── Header/ (Navigation principale)');
  console.log('│   │   ├── Footer/ (Pied de page)');
  console.log('│   │   └── Slider/ (Carrousel d\'images)');
  console.log('│   ├── pages/');
  console.log('│   │   ├── Home/ (Page d\'accueil avec slider)');
  console.log('│   │   ├── About/ (À propos)');
  console.log('│   │   ├── Services/ (Services)');
  console.log('│   │   ├── Portfolio/ (Portfolio)');
  console.log('│   │   └── Contact/ (Contact avec formulaire)');
  console.log('│   └── styles/ (Fichiers CSS)');
  console.log('└── public/ (Fichiers statiques)');
}

// Exécuter la génération
generateProject();
