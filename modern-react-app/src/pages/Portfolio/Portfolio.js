import React from 'react';
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

export default Portfolio;