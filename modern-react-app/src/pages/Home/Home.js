import React from 'react';
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

export default Home;