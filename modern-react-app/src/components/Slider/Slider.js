import React, { useState, useEffect } from 'react';
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
            className={`slide ${index === currentSlide ? 'active' : ''}`}
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
            className={`dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Slider;