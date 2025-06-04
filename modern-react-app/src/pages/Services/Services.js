import React from 'react';
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

export default Services;