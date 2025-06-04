import React from 'react';
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

export default About;