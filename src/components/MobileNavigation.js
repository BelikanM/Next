import React from 'react';
import { 
  FaHome, 
  FaSearch, 
  FaPlus, 
  FaHeart, 
  FaUser 
} from 'react-icons/fa';
import './MobileNavigation.css';

const MobileNavigation = ({ activeTab, onTabChange, notifications = 0 }) => {
  const navItems = [
    { id: 'home', icon: FaHome, label: 'Accueil' },
    { id: 'search', icon: FaSearch, label: 'Recherche' },
    { id: 'create', icon: FaPlus, label: 'Créer', isCreate: true },
    { id: 'activity', icon: FaHeart, label: 'Activité', badge: notifications },
    { id: 'profile', icon: FaUser, label: 'Profil' }
  ];

  return (
    <div className="mobile-navigation">
      {navItems.map((item) => (
        <div
          key={item.id}
          className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''} ${item.isCreate ? 'create-btn' : ''}`}
          onClick={() => onTabChange(item.id)}
        >
          <div className="icon-container">
            <item.icon className="mobile-nav-icon" />
            {item.badge > 0 && (
              <span className="mobile-notification-badge">{item.badge}</span>
            )}
          </div>
          <span className="mobile-nav-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default MobileNavigation;
