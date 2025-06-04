import React, { useState } from 'react';
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

export default Contact;