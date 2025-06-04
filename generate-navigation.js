Je vais créer un script Node.js qui génère automatiquement tous les fichiers nécessaires pour le système de navigation.

## Script de génération automatique (generate-navigation.js)

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration des dossiers
const config = {
  srcDir: './src',
  componentsDir: './src/components',
  hooksDir: './src/hooks',
  stylesDir: './src/styles',
  pagesDir: './src/pages'
};

// Créer les dossiers s'ils n'existent pas
function createDirectories() {
  Object.values(config).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Dossier créé: ${dir}`);
    }
  });
}

// Templates des fichiers
const templates = {
  // Package.json dependencies
  packageDependencies: {
    "react-icons": "^4.12.0"
  },

  // NavigationSystem.jsx
  navigationSystem: `import React, { useState, useEffect } from 'react';
import TopNavigation from './TopNavigation';
import SideNavigation from './SideNavigation';
import MobileNavigation from './MobileNavigation';
import '../styles/NavigationSystem.css';

const NavigationSystem = ({ 
  activeTab, 
  onTabChange, 
  user,
  notifications = 0,
  messages = 0
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024 && window.innerWidth > 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width <= 1024 && width > 768);
      
      if (width <= 1024) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    setShowProfileMenu(false);
  };

  return (
    <div className="navigation-system">
      {!isMobile && (
        <TopNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          user={user}
          notifications={notifications}
          messages={messages}
          showProfileMenu={showProfileMenu}
          setShowProfileMenu={setShowProfileMenu}
          sidebarCollapsed={sidebarCollapsed}
        />
      )}

      {!isMobile && (
        <SideNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          isTablet={isTablet}
        />
      )}

      {isMobile && (
        <MobileNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          notifications={notifications}
          messages={messages}
        />
      )}
    </div>
  );
};

export default NavigationSystem;`,

  // TopNavigation.jsx
  topNavigation: `import React from 'react';
import { 
  FaHome, 
  FaUsers, 
  FaComments, 
  FaBell, 
  FaSearch,
  FaPlus,
  FaCog,
  FaSignOutAlt,
  FaChevronDown,
  FaMoon,
  FaGlobe
} from 'react-icons/fa';

const TopNavigation = ({ 
  activeTab, 
  onTabChange, 
  user,
  notifications,
  messages,
  showProfileMenu,
  setShowProfileMenu,
  sidebarCollapsed
}) => {
  const quickNavItems = [
    { id: 'home', icon: FaHome, label: 'Accueil' },
    { id: 'friends', icon: FaUsers, label: 'Amis' },
    { id: 'messages', icon: FaComments, label: 'Messages', badge: messages },
    { id: 'notifications', icon: FaBell, label: 'Notifications', badge: notifications },
  ];

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      onTabChange('search');
    }
  };

  return (
    <nav className={\`top-navigation \${sidebarCollapsed ? 'sidebar-collapsed' : ''}\`}>
      <div className="top-nav-container">
        <div className="top-nav-logo">
          <div className="logo-icon">📱</div>
          <span className="logo-text">SocialHub</span>
        </div>

        <div className="top-nav-search">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Rechercher des personnes, publications, hashtags..." 
            className="search-input"
            onKeyPress={handleSearch}
          />
        </div>

        <div className="top-nav-quick">
          {quickNavItems.map((item) => (
            <div
              key={item.id}
              className={\`top-nav-item \${activeTab === item.id ? 'active' : ''}\`}
              onClick={() => onTabChange(item.id)}
              title={item.label}
            >
              <item.icon className="top-nav-icon" />
              {item.badge > 0 && (
                <span className="top-notification-badge">{item.badge > 99 ? '99+' : item.badge}</span>
              )}
            </div>
          ))}
        </div>

        <div className="top-nav-actions">
          <button 
            className="create-btn"
            onClick={() => onTabChange('create')}
            title="Créer une publication"
          >
            <FaPlus />
          </button>
          
          <button className="theme-btn" title="Changer de thème">
            <FaMoon />
          </button>
        </div>

        <div className="top-nav-profile">
          <div 
            className="profile-container"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <img 
              src={user?.avatar || '/default-avatar.png'} 
              alt={user?.name || 'Profil'} 
              className="profile-avatar"
            />
            <span className="profile-name">{user?.name || 'Utilisateur'}</span>
            <FaChevronDown className={\`chevron \${showProfileMenu ? 'open' : ''}\`} />
          </div>
          
          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-info">
                <img src={user?.avatar} alt="Profile" />
                <div>
                  <div className="profile-name-full">{user?.name}</div>
                  <div className="profile-username">@{user?.username}</div>
                </div>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <div className="dropdown-item" onClick={() => onTabChange('profile')}>
                <FaUsers /> Mon Profil
              </div>
              <div className="dropdown-item" onClick={() => onTabChange('settings')}>
                <FaCog /> Paramètres
              </div>
              <div className="dropdown-item">
                <FaGlobe /> Langue
              </div>
              
              <div className="dropdown-divider"></div>
              
              <div className="dropdown-item logout">
                <FaSignOutAlt /> Déconnexion
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;`,

  // SideNavigation.jsx
  sideNavigation: `import React from 'react';
import { 
  FaHome, 
  FaUsers, 
  FaComments, 
  FaBell, 
  FaUser,
  FaBookmark,
  FaCalendarAlt,
  FaNewspaper,
  FaHashtag,
  FaChevronLeft,
  FaChevronRight,
  FaGamepad,
  FaVideo,
  FaStore,
  FaChartLine,
  FaHeart,
  FaCog,
  FaQuestionCircle
} from 'react-icons/fa';

const SideNavigation = ({ activeTab, onTabChange, isCollapsed, onToggle, isTablet }) => {
  const mainNavItems = [
    { id: 'home', icon: FaHome, label: 'Accueil', color: '#1DA1F2' },
    { id: 'profile', icon: FaUser, label: 'Mon Profil', color: '#17BF63' },
    { id: 'friends', icon: FaUsers, label: 'Amis', color: '#F91880' },
    { id: 'messages', icon: FaComments, label: 'Messages', color: '#FF6B35' },
    { id: 'notifications', icon: FaBell, label: 'Notifications', color: '#794BC4' }
  ];

  const discoverItems = [
    { id: 'explore', icon: FaHashtag, label: 'Explorer', color: '#FF6B35' },
    { id: 'videos', icon: FaVideo, label: 'Vidéos', color: '#FF0000' },
    { id: 'games', icon: FaGamepad, label: 'Jeux', color: '#7B68EE' },
    { id: 'marketplace', icon: FaStore, label: 'Marketplace', color: '#00C851' }
  ];

  const personalItems = [
    { id: 'saved', icon: FaBookmark, label: 'Sauvegardés', color: '#FFB900' },
    { id: 'events', icon: FaCalendarAlt, label: 'Événements', color: '#FF6B35' },
    { id: 'liked', icon: FaHeart, label: 'J\\'aime', color: '#E91E63' },
    { id: 'analytics', icon: FaChartLine, label: 'Statistiques', color: '#00BCD4' }
  ];

  const bottomItems = [
    { id: 'settings', icon: FaCog, label: 'Paramètres' },
    { id: 'help', icon: FaQuestionCircle, label: 'Aide' }
  ];

  const renderNavSection = (items, title, showTitle = true) => (
    <div className="side-nav-section">
      {!isCollapsed && showTitle && <h4 className="section-title">{title}</h4>}
      {items.map((item) => (
        <div
          key={item.id}
          className={\`side-nav-item \${activeTab === item.id ? 'active' : ''}\`}
          onClick={() => onTabChange(item.id)}
          style={{ '--item-color': item.color }}
          title={isCollapsed ? item.label : ''}
        >
          <div className="nav-item-content">
            <item.icon className="side-nav-icon" />
            {!isCollapsed && (
              <span className="side-nav-label">{item.label}</span>
            )}
          </div>
          {activeTab === item.id && <div className="active-indicator"></div>}
        </div>
      ))}
    </div>
  );

  return (
    <aside className={\`side-navigation \${isCollapsed ? 'collapsed' : ''} \${isTablet ? 'tablet' : ''}\`}>
      <button 
        className="sidebar-toggle"
        onClick={onToggle}
        title={isCollapsed ? 'Développer la sidebar' : 'Réduire la sidebar'}
      >
        {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>

      <div className="sidebar-content">
        {renderNavSection(mainNavItems, 'Principal')}
        {renderNavSection(discoverItems, 'Découvrir')}
        {renderNavSection(personalItems, 'Personnel')}
      </div>

      <div className="sidebar-bottom">
        {renderNavSection(bottomItems, '', false)}
      </div>
      
      {!isCollapsed && (
        <div className="sidebar-stats">
          <div className="stat-item">
            <span className="stat-number">1.2K</span>
            <span className="stat-label">Abonnés</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">856</span>
            <span className="stat-label">Abonnements</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default SideNavigation;`,

  // MobileNavigation.jsx
  mobileNavigation: `import React, { useState } from 'react';
import { 
  FaHome, 
  FaSearch, 
  FaPlus, 
  FaHeart, 
  FaUser,
  FaComments,
  FaBell,
  FaUsers,
  FaTimes
} from 'react-icons/fa';

const MobileNavigation = ({ activeTab, onTabChange, notifications, messages }) => {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  
  const mainNavItems = [
    { id: 'home', icon: FaHome, label: 'Accueil' },
    { id: 'search', icon: FaSearch, label: 'Recherche' },
    { id: 'create', icon: FaPlus, label: 'Créer', isCreate: true },
    { id: 'activity', icon: FaHeart, label: 'Activité', badge: notifications },
    { id: 'profile', icon: FaUser, label: 'Profil' }
  ];

  const createMenuItems = [
    { id: 'create-post', label: 'Publication', icon: '📝', color: '#1DA1F2' },
    { id: 'create-story', label: 'Story', icon: '📱', color: '#E91E63' },
    { id: 'create-video', label: 'Vidéo', icon: '🎥', color: '#FF0000' },
    { id: 'create-live', label: 'En direct', icon: '📹', color: '#FF6B35' }
  ];

  const handleCreateClick = () => {
    setShowCreateMenu(!showCreateMenu);
  };

  const handleCreateMenuClick = (createType) => {
    onTabChange(createType);
    setShowCreateMenu(false);
  };

  return (
    <>
      {showCreateMenu && (
        <div className="create-overlay">
          <div className="create-menu">
            <div className="create-header">
              <h3>Créer du contenu</h3>
              <button 
                className="close-create"
                onClick={() => setShowCreateMenu(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="create-options">
              {createMenuItems.map((item) => (
                <div
                  key={item.id}
                  className="create-option"
                  onClick={() => handleCreateMenuClick(item.id)}
                  style={{ '--option-color': item.color }}
                >
                  <div className="create-icon">{item.icon}</div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="mobile-navigation">
        <div className="mobile-quick-bar">
          <div 
            className={\`quick-item \${activeTab === 'messages' ? 'active' : ''}\`}
            onClick={() => onTabChange('messages')}
          >
            <FaComments />
            {messages > 0 && <span className="quick-badge">{messages}</span>}
          </div>
          <div 
            className={\`quick-item \${activeTab === 'notifications' ? 'active' : ''}\`}
            onClick={() => onTabChange('notifications')}
          >
            <FaBell />
            {notifications > 0 && <span className="quick-badge">{notifications}</span>}
          </div>
          <div 
            className={\`quick-item \${activeTab === 'friends' ? 'active' : ''}\`}
            onClick={() => onTabChange('friends')}
          >
            <FaUsers />
          </div>
        </div>

        <div className="mobile-nav-main">
          {mainNavItems.map((item) => (
            <div
              key={item.id}
              className={\`mobile-nav-item \${activeTab === item.id ? 'active' : ''} \${item.isCreate ? 'create-btn' : ''}\`}
              onClick={item.isCreate ? handleCreateClick : () => onTabChange(item.id)}
            >
              <div className="mobile-icon-container">
                <item.icon className={\`mobile-nav-icon \${showCreateMenu && item.isCreate ? 'rotated' : ''}\`} />
                {item.badge > 0 && (
                  <span className="mobile-notification-badge">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
};

export default MobileNavigation;`,

  // useNavigation.js hook
  useNavigation: `import { useState, useEffect, useCallback } from 'react';

const useNavigation = (initialTab = 'home') => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [navigationHistory, setNavigationHistory] = useState([initialTab]);
  const [notifications, setNotifications] = useState({
    messages: 0,
    notifications: 0,
    friendRequests: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        setNotifications(prev => ({
          ...prev,
          messages: prev.messages + Math.floor(Math.random() * 3),
          notifications: prev.notifications + Math.floor(Math.random() * 2)
        }));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setNavigationHistory(prev => [...prev, tabId]);
    
    if (tabId === 'messages') {
      setNotifications(prev => ({ ...prev, messages: 0 }));
    } else if (tabId === 'notifications') {
      setNotifications(prev => ({ ...prev, notifications: 0 }));
    }
    
    localStorage.setItem('lastActiveTab', tabId);
  }, []);

  const goBack = useCallback(() => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop();
      const previousTab = newHistory[newHistory.length - 1];
      setActiveTab(previousTab);
      setNavigationHistory(newHistory);
    }
  }, [navigationHistory]);

  useEffect(() => {
    const savedTab = localStorage.getItem('lastActiveTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  return {
    activeTab,
    handleTabChange,
    goBack,
    navigationHistory,
    notifications,
    setNotifications
  };
};

export default useNavigation;`,

  // CSS complet
  navigationCSS: `/* ===== VARIABLES CSS ===== */
:root {
  --primary-color: #1DA1F2;
  --secondary-color: #14171A;
  --accent-color: #E91E63;
  --background-color: #ffffff;
  --surface-color: #f8f9fa;
  --border-color: #e1e8ed;
  --text-primary: #14171A;
  --text-secondary: #657786;
  --shadow-light: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.15);
  --shadow-heavy: 0 8px 24px rgba(0, 0, 0, 0.2);
  --sidebar-width: 280px;
  --sidebar-collapsed-width: 60px;
  --top-nav-height: 70px;
  --mobile-nav-height: 60px;
  --mobile-quick-height: 40px;
  --border-radius: 12px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ===== NAVIGATION SYSTEM ===== */
.navigation-system {
  position: relative;
  z-index: 1000;
}

/* ===== TOP NAVIGATION ===== */
.top-navigation {
  position: fixed;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  height: var(--top-nav-height);
  background: var(--background-color);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-light);
  z-index: 1001;
  transition: var(--transition);
}

.top-navigation.sidebar-collapsed {
  left: var(--sidebar-collapsed-width);
}

.top-nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 100%;
  max-width: none;
}

/* Logo */
.top-nav-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  color: var(--primary-color);
  min-width: 200px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 20px;
  font-weight: 800;
}

/* Search */
.top-nav-search {
  position: relative;
  flex: 1;
  max-width: 500px;
  margin: 0 24px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 14px;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 2px solid var(--border-color);
  border-radius: 25px;
  background: var(--surface-color);
  font-size: 15px;
  outline: none;
  transition: var(--transition);
}

.search-input:focus {
  background: var(--background-color);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(29, 161, 242, 0.1);
}

/* Quick Navigation */
.top-nav-quick {
  display: flex;
  gap: 8px;
  margin-right: 24px;
}

.top-nav-item {
  position: relative;
  padding: 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition);
  background: transparent;
}

.top-nav-item:hover {
  background: var(--surface-color);
  transform: translateY(-2px);
}

.top-nav-item.active {
  background: var(--primary-color);
  box-shadow: 0 4px 12px rgba(29, 161, 242, 0.3);
}

.top-nav-icon {
  font-size: 18px;
  color: var(--text-secondary);
  transition: var(--transition);
}

.top-nav-item.active .top-nav-icon {
  color: white;
}

.top-notification-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: var(--accent-color);
  color: white;
  border-radius: 12px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(233, 30, 99, 0.3);
}

/* Actions */
.top-nav-actions {
  display: flex;
  gap: 12px;
  margin-right: 24px;
}

.create-btn, .theme-btn {
  padding: 10px;
  border: none;
    border-radius: 50%;
  background: var(--primary-color);
  color: white;
  cursor: pointer;
  transition: var(--transition);
  font-size: 16px;
  box-shadow: var(--shadow-light);
}

.create-btn:hover, .theme-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.theme-btn {
  background: var(--surface-color);
  color: var(--text-secondary);
}

/* Profile */
.top-nav-profile {
  position: relative;
}

.profile-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 25px;
  cursor: pointer;
  transition: var(--transition);
  border: 2px solid transparent;
}

.profile-container:hover {
  background: var(--surface-color);
  border-color: var(--border-color);
}

.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
}

.profile-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.chevron {
  font-size: 12px;
  color: var(--text-secondary);
  transition: transform 0.3s ease;
}

.chevron.open {
  transform: rotate(180deg);
}

.profile-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-heavy);
  min-width: 280px;
  margin-top: 8px;
  overflow: hidden;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--surface-color);
}

.profile-info img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-name-full {
  font-weight: 600;
  color: var(--text-primary);
}

.profile-username {
  font-size: 14px;
  color: var(--text-secondary);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  cursor: pointer;
  transition: var(--transition);
  font-size: 15px;
}

.dropdown-item:hover {
  background: var(--surface-color);
}

.dropdown-item.logout {
  color: var(--accent-color);
}

/* ===== SIDE NAVIGATION ===== */
.side-navigation {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--background-color);
  border-right: 1px solid var(--border-color);
  box-shadow: var(--shadow-light);
  z-index: 1002;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
}

.side-navigation.collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar-toggle {
  position: absolute;
  top: 20px;
  right: -15px;
  width: 30px;
  height: 30px;
  border: 1px solid var(--border-color);
  border-radius: 50%;
  background: var(--background-color);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: var(--transition);
  box-shadow: var(--shadow-light);
  z-index: 1003;
}

.sidebar-toggle:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-medium);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 80px 0 20px;
}

.side-nav-section {
  margin-bottom: 24px;
  padding: 0 12px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 12px 16px;
  opacity: 0.8;
}

.side-nav-item {
  position: relative;
  margin-bottom: 4px;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
  overflow: hidden;
}

.nav-item-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  transition: var(--transition);
}

.side-navigation.collapsed .nav-item-content {
  justify-content: center;
  padding: 16px 8px;
}

.side-nav-item:hover .nav-item-content {
  background: var(--surface-color);
  transform: translateX(4px);
}

.side-nav-item.active .nav-item-content {
  background: linear-gradient(135deg, var(--item-color, var(--primary-color)), rgba(29, 161, 242, 0.8));
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.side-nav-icon {
  font-size: 20px;
  color: var(--text-secondary);
  transition: var(--transition);
  min-width: 20px;
}

.side-nav-item.active .side-nav-icon {
  color: white;
}

.side-nav-label {
  font-weight: 500;
  color: var(--text-primary);
  transition: var(--transition);
  white-space: nowrap;
}

.side-nav-item.active .side-nav-label {
  color: white;
  font-weight: 600;
}

.active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 70%;
  background: var(--item-color, var(--primary-color));
  border-radius: 0 4px 4px 0;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
}

.sidebar-bottom {
  padding: 20px 12px;
  border-top: 1px solid var(--border-color);
}

.sidebar-stats {
  padding: 20px;
  background: var(--surface-color);
  border-radius: var(--border-radius);
  margin: 0 12px 20px;
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* ===== MOBILE NAVIGATION ===== */
.mobile-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--background-color);
  border-top: 1px solid var(--border-color);
  z-index: 1000;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
}

.mobile-quick-bar {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 8px 0;
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  height: var(--mobile-quick-height);
}

.quick-item {
  position: relative;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: var(--transition);
  color: var(--text-secondary);
}

.quick-item:hover, .quick-item.active {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
}

.quick-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: var(--accent-color);
  color: white;
  border-radius: 8px;
  padding: 1px 4px;
  font-size: 10px;
  font-weight: 600;
  min-width: 14px;
  text-align: center;
}

.mobile-nav-main {
  display: flex;
  justify-content: space-around;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  height: var(--mobile-nav-height);
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: var(--transition);
  border-radius: var(--border-radius);
  min-width: 60px;
  position: relative;
}

.mobile-nav-item.create-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  border-radius: 50%;
  padding: 16px;
  margin-top: -20px;
  box-shadow: var(--shadow-medium);
  transform: scale(1.1);
}

.mobile-nav-item.create-btn:active {
  transform: scale(1.05);
}

.mobile-icon-container {
  position: relative;
}

.mobile-nav-icon {
  font-size: 24px;
  color: var(--text-secondary);
  transition: var(--transition);
}

.mobile-nav-icon.rotated {
  transform: rotate(45deg);
}

.mobile-nav-item.active .mobile-nav-icon {
  color: var(--primary-color);
}

.mobile-nav-item.create-btn .mobile-nav-icon {
  color: white;
}

.mobile-nav-label {
  font-size: 10px;
  margin-top: 4px;
  color: var(--text-secondary);
  font-weight: 500;
  transition: var(--transition);
}

.mobile-nav-item.active .mobile-nav-label {
  color: var(--primary-color);
  font-weight: 600;
}

.mobile-nav-item.create-btn .mobile-nav-label {
  display: none;
}

.mobile-notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--accent-color);
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(233, 30, 99, 0.3);
}

/* Create Menu */
.create-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.create-menu {
  background: var(--background-color);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
  padding: 24px;
  width: 100%;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.create-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.create-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.close-create {
  background: var(--surface-color);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: var(--transition);
}

.close-create:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.create-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.create-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
  text-align: center;
}

.create-option:hover {
  border-color: var(--option-color);
  background: rgba(var(--option-color), 0.1);
  transform: translateY(-4px);
  box-shadow: var(--shadow-medium);
}

.create-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.create-option span {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 1024px) and (min-width: 769px) {
  :root {
    --sidebar-width: 220px;
    --sidebar-collapsed-width: 50px;
  }
  
  .top-nav-container {
    padding: 0 16px;
  }
  
  .top-nav-search {
    max-width: 350px;
    margin: 0 16px;
  }
  
  .profile-name {
    display: none;
  }
  
  .top-nav-quick {
    gap: 4px;
  }
}

@media (max-width: 768px) {
  .top-navigation,
  .side-navigation {
    display: none;
  }
  
  .mobile-navigation {
    display: block;
  }
  
  @media (max-width: 480px) {
    .create-options {
      grid-template-columns: 1fr;
    }
    
    .create-option {
      flex-direction: row;
      text-align: left;
      padding: 16px;
    }
    
    .create-icon {
      font-size: 24px;
      margin-bottom: 0;
      margin-right: 16px;
    }
  }
}

@media (min-width: 1440px) {
  :root {
    --sidebar-width: 320px;
  }
  
  .top-nav-search {
    max-width: 600px;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --background-color: #15202B;
    --surface-color: #192734;
    --border-color: #38444d;
    --text-primary: #ffffff;
    --text-secondary: #8899a6;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.top-nav-item:focus-visible,
.side-nav-item:focus-visible,
.mobile-nav-item:focus-visible,
.create-option:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

@media print {
  .navigation-system {
    display: none;
  }
}`,

  // Pages templates
  pages: {
    HomePage: `import React from 'react';
import '../styles/Pages.css';

const HomePage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🏠 Accueil</h1>
        <p>Bienvenue sur votre fil d'actualité!</p>
      </div>
      
      <div className="page-content">
        <div className="feed-container">
          <div className="post-card">
            <div className="post-header">
              <img src="/api/placeholder/40/40" alt="User" className="post-avatar" />
              <div className="post-info">
                <h4>Marie Dubois</h4>
                <span>Il y a 2 heures</span>
              </div>
            </div>
            <div className="post-content">
              <p>Voici ma première publication sur SocialHub! 🎉</p>
              <img src="/api/placeholder/400/200" alt="Post" className="post-image" />
            </div>
            <div className="post-actions">
              <button className="action-btn">❤️ 24</button>
              <button className="action-btn">💬 5</button>
              <button className="action-btn">🔄 2</button>
              <button className="action-btn">📤</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;`,

    ProfilePage: `import React from 'react';
import '../styles/Pages.css';

const ProfilePage = () => {
  return (
    <div className="page-container">
      <div className="profile-header">
        <div className="profile-cover">
          <img src="/api/placeholder/800/200" alt="Cover" />
        </div>
        <div className="profile-info">
          <img src="/api/placeholder/120/120" alt="Profile" className="profile-picture" />
          <div className="profile-details">
            <h1>Marie Dubois</h1>
            <p>@marie_dubois</p>
            <p>Développeuse passionnée | Amatrice de café ☕ | Paris, France</p>
            <div className="profile-stats">
              <span><strong>1,234</strong> Abonnés</span>
              <span><strong>856</strong> Abonnements</span>
              <span><strong>42</strong> Publications</span>
            </div>
          </div>
          <button className="edit-profile-btn">Modifier le profil</button>
        </div>
      </div>
      
      <div className="profile-tabs">
        <button className="tab-btn active">Publications</button>
        <button className="tab-btn">Photos</button>
        <button className="tab-btn">Vidéos</button>
        <button className="tab-btn">À propos</button>
      </div>
      
      <div className="profile-content">
        <p>Vos publications apparaîtront ici...</p>
      </div>
    </div>
  );
};

export default ProfilePage;`,

    MessagesPage: `import React, { useState } from 'react';
import '../styles/Pages.css';

const MessagesPage = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  
  const conversations = [
    { id: 1, name: 'Alice Martin', lastMessage: 'Salut! Comment ça va?', time: '14:30', unread: 2 },
    { id: 2, name: 'Bob Dupont', lastMessage: 'On se voit demain?', time: '13:15', unread: 0 },
    { id: 3, name: 'Claire Moreau', lastMessage: 'Merci pour ton aide!', time: '12:45', unread: 1 }
  ];

  return (
    <div className="page-container">
      <div className="messages-container">
        <div className="conversations-list">
          <div className="conversations-header">
            <h2>Messages</h2>
            <button className="new-message-btn">✏️</button>
          </div>
          
          {conversations.map(conv => (
            <div 
              key={conv.id} 
              className={\`conversation-item \${selectedChat === conv.id ? 'active' : ''}\`}
              onClick={() => setSelectedChat(conv.id)}
            >
              <img src={\`/api/placeholder/40/40\`} alt={conv.name} />
              <div className="conversation-info">
                <h4>{conv.name}</h4>
                <p>{conv.lastMessage}</p>
              </div>
              <div className="conversation-meta">
                <span className="time">{conv.time}</span>
                {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
              </div>
            </div>
          ))}
        </div>
        
        <div className="chat-area">
          {selectedChat ? (
            <div className="chat-content">
              <div className="chat-header">
                <img src="/api/placeholder/40/40" alt="User" />
                <h3>Alice Martin</h3>
                <div className="chat-actions">
                  <button>📞</button>
                  <button>📹</button>
                  <button>ℹ️</button>
                </div>
              </div>
              
              <div className="messages-area">
                <div className="message received">
                  <p>Salut! Comment ça va?</p>
                  <span className="message-time">14:30</span>
                </div>
                <div className="message sent">
                  <p>Ça va bien, merci! Et toi?</p>
                  <span className="message-time">14:32</span>
                </div>
              </div>
              
              <div className="message-input">
                <input type="text" placeholder="Tapez votre message..." />
                <button>📎</button>
                <button>😊</button>
                <button>➤</button>
              </div>
            </div>
          ) : (
            <div className="no-chat-selected">
              <h3>Sélectionnez une conversation</h3>
              <p>Choisissez une conversation pour commencer à discuter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;`,

    NotificationsPage: `import React from 'react';
import '../styles/Pages.css';

const NotificationsPage = () => {
  const notifications = [
    { id: 1, type: 'like', user: 'Alice Martin', action: 'a aimé votre publication', time: '5 min', read: false },
    { id: 2, type: 'comment', user: 'Bob Dupont', action: 'a commenté votre photo', time: '1h', read: false },
    { id: 3, type: 'follow', user: 'Claire Moreau', action: 'a commencé à vous suivre', time: '2h', read: true },
    { id: 4, type: 'mention', user: 'David Leroy', action: 'vous a mentionné dans un commentaire', time: '3h', read: true }
  ];

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👤';
      case 'mention': return '📢';
      default: return '🔔';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔔 Notifications</h1>
        <button className="mark-all-read">Tout marquer comme lu</button>
      </div>
      
      <div className="notifications-list">
        {notifications.map(notif => (
          <div key={notif.id} className={\`notification-item \${!notif.read ? 'unread' : ''}\`}>
            <div className="notification-icon">
              {getNotificationIcon(notif.type)}
            </div>
            <img src="/api/placeholder/40/40" alt={notif.user} className="notification-avatar" />
            <div className="notification-content">
              <p><strong>{notif.user}</strong> {notif.action}</p>
              <span className="notification-time">{notif.time}</span>
            </div>
            {!notif.read && <div className="unread-dot"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;`,

    SearchPage: `import React, { useState } from 'react';
import '../styles/Pages.css';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  const filters = [
    { id: 'all', label: 'Tout', icon: '🔍' },
    { id: 'people', label: 'Personnes', icon: '👥' },
    { id: 'posts', label: 'Publications', icon: '📝' },
    { id: 'hashtags', label: 'Hashtags', icon: '#️⃣' },
    { id: 'videos', label: 'Vidéos', icon: '🎥' }
  ];

  const searchResults = [
    { type: 'person', name: 'Alice Martin', username: '@alice_martin', followers: '1.2K' },
    { type: 'post', content: 'Belle journée pour une promenade! #nature', author: 'Bob Dupont', likes: 45 },
    { type: 'hashtag', tag: '#photography', posts: '2.3K publications' },
    { type: 'video', title: 'Tutoriel React JS', author: 'Claire Dev', views: '15K vues' }
  ];

  return (
    <div className="page-container">
      <div className="search-header">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Rechercher..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button>🔍</button>
        </div>
      </div>
      
      <div className="search-filters">
        {filters.map(filter => (
          <button 
            key={filter.id}
            className={\`filter-btn \${activeFilter === filter.id ? 'active' : ''}\`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.icon} {filter.label}
          </button>
        ))}
      </div>
      
      <div className="search-results">
        {searchResults.map((result, index) => (
          <div key={index} className="search-result-item">
            {result.type === 'person' && (
              <>
                <img src="/api/placeholder/50/50" alt={result.name} />
                <div className="result-info">
                  <h4>{result.name}</h4>
                  <p>{result.username} • {result.followers} abonnés</p>
                </div>
                <button className="follow-btn">Suivre</button>
              </>
            )}
            {result.type === 'post' && (
              <div className="post-result">
                <p>{result.content}</p>
                <span>Par {result.author} • {result.likes} j'aime</span>
              </div>
            )}
            {result.type === 'hashtag' && (
              <div className="hashtag-result">
                <h4>{result.tag}</h4>
                <p>{result.posts}</p>
              </div>
            )}
            {result.type === 'video' && (
              <div className="video-result">
                <div className="video-thumbnail">🎥</div>
                <div className="video-info">
                  <h4>{result.title}</h4>
                  <p>Par {result.author} • {result.views}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchPage;`,

    CreatePage: `import React, { useState } from 'react';
import '../styles/Pages.css';

const CreatePage = () => {
  const [postType, setPostType] = useState('text');
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  const postTypes = [
    { id: 'text', label: 'Texte', icon: '📝' },
    { id: 'photo', label: 'Photo', icon: '📷' },
    { id: 'video', label: 'Vidéo', icon: '🎥' },
    { id: 'poll', label: 'Sondage', icon: '📊' }
  ];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  return (
    <div className="page-container">
      <div className="create-header">
        <h1>✨ Créer une publication</h1>
      </div>
      
      <div className="create-form">
        <div className="post-type-selector">
          {postTypes.map(type => (
            <button 
              key={type.id}
              className={\`type-btn \${postType === type.id ? 'active' : ''}\`}
              onClick={() => setPostType(type.id)}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
        
        <div className="create-content">
          <div className="user-info">
            <img src="/api/placeholder/50/50" alt="Vous" />
            <div>
              <h4>Marie Dubois</h4>
              <select className="privacy-selector">
                <option>🌍 Public</option>
                <option>👥 Amis</option>
                <option>🔒 Privé</option>
              </select>
            </div>
          </div>
          
          <textarea 
            placeholder="Quoi de neuf?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          
          {postType === 'photo' && (
            <div className="media-upload">
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleFileSelect}
                id="photo-upload"
                style={{display: 'none'}}
              />
              <label htmlFor="photo-upload" className="upload-btn">
                📷 Ajouter des photos
              </label>
              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  {selectedFiles.map((file, index) => (
                    <span key={index} className="file-tag">{file.name}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {postType === 'poll' && (
            <div className="poll-creator">
              <input placeholder="Option 1" />
              <input placeholder="Option 2" />
              <button className="add-option">+ Ajouter une option</button>
            </div>
          )}
          
          <div className="post-options">
            <button className="option-btn">📍 Lieu</button>
            <button className="option-btn">😊 Humeur</button>
            <button className="option-btn">🏷️ Taguer</button>
          </div>
          
          <div className="create-actions">
            <button className="cancel-btn">Annuler</button>
            <button className="publish-btn">Publier</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;`,

    FriendsPage: `import React, { useState } from 'react';
import '../styles/Pages.css';

const FriendsPage = () => {
  const [activeTab, setActiveTab] = useState('friends');
  
  const friends = [
    { id: 1, name: 'Alice Martin', mutualFriends: 12, status: 'online' },
    { id: 2, name: 'Bob Dupont', mutualFriends: 8, status: 'offline' },
    { id: 3, name: 'Claire Moreau', mutualFriends: 15, status: 'online' }
  ];
  
  const requests = [
    { id: 1, name: 'David Leroy', mutualFriends: 3 },
    { id: 2, name: 'Emma Rousseau', mutualFriends: 7 }
  ];
  
  const suggestions = [
    { id: 1, name: 'Lucas Bernard', mutualFriends: 5, reason: 'Amis communs' },
    { id: 2, name: 'Sophie Petit', mutualFriends: 2, reason: 'Même ville' }
  ];

  return (
    <div className="page-container">
      <div className="friends-header">
        <h1>👥 Amis</h1>
        <div className="friends-tabs">
          <button 
            className={\`tab-btn \${activeTab === 'friends' ? 'active' : ''}\`}
            onClick={() => setActiveTab('friends')}
          >
            Mes amis ({friends.length})
          </button>
          <button 
            className={\`tab-btn \${activeTab === 'requests' ? 'active' : ''}\`}
            onClick={() => setActiveTab('requests')}
          >
            Demandes ({requests.length})
          </button>
          <button 
            className={\`tab-btn \${activeTab === 'suggestions' ? 'active' : ''}\`}
            onClick={() => setActiveTab('suggestions')}
          >
            Suggestions
          </button>
        </div>
      </div>
      
      <div className="friends-content">
        {activeTab === 'friends' && (
          <div className="friends-list">
            {friends.map(friend => (
              <div key={friend.id} className="friend-card">
                <img src="/api/placeholder/60/60" alt={friend.name} />
                <div className="friend-info">
                  <h4>{friend.name}</h4>
                  <p>{friend.mutualFriends} amis en commun</p>
                  <span className={\`status \${friend.status}\`}>
                    {friend.status === 'online' ? '🟢 En ligne' : '⚫ Hors ligne'}
                  </span>
                </div>
                <div className="friend-actions">
                  <button className="message-btn">💬</button>
                  <button className="more-btn">⋯</button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'requests' && (
          <div className="requests-list">
            {requests.map(request => (
              <div key={request.id} className="request-card">
                <img src="/api/placeholder/60/60" alt={request.name} />
                <div className="request-info">
                  <h4>{request.name}</h4>
                  <p>{request.mutualFriends} amis en commun</p>
                </div>
                <div className="request-actions">
                  <button className="accept-btn">Accepter</button>
                  <button className="decline-btn">Refuser</button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'suggestions' && (
          <div className="suggestions-list">
            {suggestions.map(suggestion => (
              <div key={suggestion.id} className="suggestion-card">
                <img src="/api/placeholder/60/60" alt={suggestion.name} />
                <div className="suggestion-info">
                  <h4>{suggestion.name}</h4>
                  <p>{suggestion.mutualFriends} amis en commun</p>
                  <span className="suggestion-reason">{suggestion.reason}</span>
                </div>
                <div className="suggestion-actions">
                  <button className="add-friend-btn">Ajouter</button>
                  <button className="remove-btn">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;`,

    SettingsPage: `import React, { useState } from 'react';
import '../styles/Pages.css';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('account');
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    publicProfile: true,
    showOnlineStatus: true
  });

  const sections = [
    { id: 'account', label: 'Compte', icon: '👤' },
    { id: 'privacy', label: 'Confidentialité', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'appearance', label: 'Apparence', icon: '🎨' },
    { id: 'security', label: 'Sécurité', icon: '🛡️' }
  ];

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="page-container">
      <div className="settings-container">
        <div className="settings-sidebar">
          <h2>⚙️ Paramètres</h2>
          {sections.map(section => (
            <button 
              key={section.id}
              className={\`settings-nav-btn \${activeSection === section.id ? 'active' : ''}\`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>
        
        <div className="settings-content">
          {activeSection === 'account' && (
            <div className="settings-section">
              <h3>Informations du compte</h3>
              <div className="form-group">
                <label>Nom complet</label>
                <input type="text" defaultValue="Marie Dubois" />
              </div>
              <div className="form-group">
                <label>Nom d'utilisateur</label>
                <input type="text" defaultValue="marie_dubois" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" defaultValue="marie@example.com" />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea defaultValue="Développeuse passionnée | Amatrice de café ☕"></textarea>
              </div>
              <button className="save-btn">Sauvegarder</button>
            </div>
          )}
          
          {activeSection === 'privacy' && (
            <div className="settings-section">
              <h3>Paramètres de confidentialité</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Profil public</h4>
                  <p>Permettre à tout le monde de voir votre profil</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.publicProfile}
                    onChange={() => toggleSetting('publicProfile')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Statut en ligne</h4>
                  <p>Afficher quand vous êtes en ligne</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.showOnlineStatus}
                    onChange={() => toggleSetting('showOnlineStatus')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}
          
          {activeSection === 'notifications' && (
            <div className="settings-section">
              <h3>Préférences de notification</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Notifications push</h4>
                  <p>Recevoir des notifications sur votre appareil</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications}
                    onChange={() => toggleSetting('notifications')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}
          
          {activeSection === 'appearance' && (
            <div className="settings-section">
              <h3>Apparence</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Mode sombre</h4>
                  <p>Utiliser le thème sombre</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.darkMode}
                    onChange={() => toggleSetting('darkMode')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}
          
          {activeSection === 'security' && (
            <div className="settings-section">
              <h3>Sécurité</h3>
              <div className="form-group">
                <label>Mot de passe actuel</label>
                <input type="password" />
              </div>
              <div className="form-group">
                <label>Nouveau mot de passe</label>
                <input type="password" />
              </div>
              <div className="form-group">
                <label>Confirmer le mot de passe</label>
                <input type="password" />
              </div>
              <button className="save-btn">Changer le mot de passe</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;`
  },

  // Pages.css
  pagesCSS: `/* ===== PAGES STYLES ===== */
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: var(--background-color);
  min-height: calc(100vh - var(--top-nav-height));
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--border-color);
}

.page-header h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 32px;
  font-weight: 800;
}

.page-header p {
  color: var(--text-secondary);
  margin: 8px 0 0 0;
  font-size: 16px;
}

/* ===== HOME PAGE ===== */
.feed-container {
  max-width: 600px;
  margin: 0 auto;
}

.post-card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-light);
  transition: var(--transition);
}

.post-card:hover {
  box-shadow: var(--shadow-medium);
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.post-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.post-info h4 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

.post-info span {
  color: var(--text-secondary);
  font-size: 14px;
}

.post-content p {
  margin: 0 0 16px 0;
  color: var(--text-primary);
  line-height: 1.6;
}

.post-image {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 16px;
}

.post-actions {
  display: flex;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.action-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 20px;
  transition: var(--transition);
  font-size: 14px;
}

.action-btn:hover {
  background: var(--surface-color);
  color: var(--primary-color);
}

/* ===== PROFILE PAGE ===== */
.profile-header {
  margin-bottom: 30px;
}

.profile-cover {
  height: 200px;
  border-radius: var(--border-radius);
  overflow: hidden;
  margin-bottom: -60px;
  position: relative;
  z-index: 1;
}

.profile-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  padding: 0 20px;
  position: relative;
  z-index: 2;
}

.profile-picture {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--background-color);
  object-fit: cover;
}

.profile-details {
  flex: 1;
  padding-top: 60px;
}

.profile-details h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
}

.profile-details p {
  margin: 4px 0;
  color: var(--text-secondary);
}

.profile-stats {
  display: flex;
  gap: 20px;
  margin-top: 12px;
}

.profile-stats span {
  color: var(--text-secondary);
  font-size: 14px;
}

.edit-profile-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.edit-profile-btn:hover {
  background: var(--secondary-color);
  transform: translateY(-2px);
}

.profile-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 30px;
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  background: none;
  border: none;
  padding: 16px 24px;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: var(--transition);
  font-weight: 500;
}

.tab-btn.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--surface-color);
}

/* ===== MESSAGES PAGE ===== */
.messages-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  height: calc(100vh - var(--top-nav-height) - 40px);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.conversations-list {
  background: var(--surface-color);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
}

.conversations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.conversations-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.new-message-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: var(--transition);
  border-bottom: 1px solid var(--border-color);
}

.conversation-item:hover {
  background: var(--background-color);
}

.conversation-item.active {
  background: var(--primary-color);
  color: white;
}

.conversation-item img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.conversation-info {
  flex: 1;
}

.conversation-info h4 {
  margin: 0;
  font-weight: 600;
}

.conversation-info p {
  margin: 4px 0 0 0;
  font-size: 14px;
  opacity: 0.8;
}

.conversation-meta {
  text-align: right;
}

.time {
  font-size: 12px;
  opacity: 0.7;
}

.unread-badge {
  background: var(--accent-color);
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  margin-top: 4px;
  display: inline-block;
}

.chat-area {
  display: flex;
  flex-direction: column;
  background: var(--background-color);
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.chat-header img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.chat-header h3 {
  flex: 1;
  margin: 0;
  color: var(--text-primary);
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.chat-actions button {
  background: var(--surface-color);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
}

.messages-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
}

.message.sent {
  background: var(--primary-color);
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

.message.received {
  background: var(--surface-color);
  color: var(--text-primary);
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}

.message p {
  margin: 0;
  line-height: 1.4;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
  display: block;
}

.message-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.message-input input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 25px;
  outline: none;
  font-size: 14px;
}

.message-input button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: var(--transition);
}

.message-input button:hover {
  background: var(--surface-color);
}

.no-chat-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  text-align: center;
}

/* ===== NOTIFICATIONS PAGE ===== */
.mark-all-read {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.mark-all-read:hover {
  background: var(--primary-color);
  color: white;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: var(--transition);
  position: relative;
}

.notification-item.unread {
  background: rgba(29, 161, 242, 0.05);
  border-color: var(--primary-color);
}

.notification-item:hover {
  box-shadow: var(--shadow-light);
  transform: translateY(-1px);
}

.notification-icon {
  font-size: 24px;
  width: 40px;
  text-align: center;
}

.notification-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.notification-content {
  flex: 1;
}

.notification-content p {
  margin: 0;
  color: var(--text-primary);
  line-height: 1.4;
}

.notification-time {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
}

.unread-dot {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  border-radius: 50%;
}

/* ===== SEARCH PAGE ===== */
.search-header {
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  gap: 8px;
  max-width: 600px;
}

.search-bar input {
  flex: 1;
  padding: 16px 20px;
  border: 2px solid var(--border-color);
  border-radius: 25px;
  font-size: 16px;
  outline: none;
  transition: var(--transition);
}

.search-bar input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(29, 161, 242, 0.1);
}

.search-bar button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 16px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
}

.search-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.filter-btn {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  padding: 12px 20px;
  border-radius: 25px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  font-weight: 500;
}

.filter-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.filter-btn:hover {
  background: var(--primary-color);
  color: white;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: var(--transition);
}

.search-result-item:hover {
  box-shadow: var(--shadow-light);
  transform: translateY(-2px);
}

.search-result-item img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.result-info {
  flex: 1;
}

.result-info h4 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

.result-info p {
  margin: 4px 0 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.follow-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition);
}

.follow-btn:hover {
  background: var(--secondary-color);
}

/* ===== CREATE PAGE ===== */
.create-form {
  max-width: 600px;
  margin: 0 auto;
}

.post-type-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.type-btn {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  padding: 12px 20px;
  border-radius: 25px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  font-weight: 500;
}

.type-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.create-content {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.user-info img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info h4 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

.privacy-selector {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.create-content textarea {
  width: 100%;
  min-height: 120px;
  border: none;
  outline: none;
  resize: vertical;
  font-size: 16px;
  color: var(--text-primary);
  background: transparent;
  margin-bottom: 20px;
  font-family: inherit;
}

.create-content textarea::placeholder {
  color: var(--text-secondary);
}

.media-upload {
  margin-bottom: 20px;
}

.upload-btn {
  display: inline-block;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  padding: 12px 20px;
  border-radius: 25px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  text-decoration: none;
}

.upload-btn:hover {
  background: var(--primary-color);
  color: white;
}

.selected-files {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-tag {
  background: var(--primary-color);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.poll-creator {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.poll-creator input {
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  outline: none;
  font-size: 14px;
}

.add-option {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  align-self: flex-start;
}

.post-options {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.option-btn {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  font-size: 14px;
}

.option-btn:hover {
  background: var(--primary-color);
  color: white;
}

.create-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.cancel-btn {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  padding: 12px 24px;
  border-radius: 25px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.publish-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition);
}

.publish-btn:hover {
  background: var(--secondary-color);
  transform: translateY(-2px);
}

/* ===== FRIENDS PAGE ===== */
.friends-header {
  margin-bottom: 30px;
}

.friends-tabs {
  display: flex;
  gap: 8px;
  margin-top: 20px;
}

.friends-list,
.requests-list,
.suggestions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.friend-card,
.request-card,
.suggestion-card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 20px;
  transition: var(--transition);
}

.friend-card:hover,
.request-card:hover,
.suggestion-card:hover {
  box-shadow: var(--shadow-light);
  transform: translateY(-2px);
}

.friend-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.friend-card img,
.request-card img,
.suggestion-card img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.friend-info,
.request-info,
.suggestion-info {
  flex: 1;
}

.friend-info h4,
.request-info h4,
.suggestion-info h4 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

.friend-info p,
.request-info p,
.suggestion-info p {
  margin: 4px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.status {
  font-size: 12px;
  font-weight: 500;
}

.status.online {
  color: #4CAF50;
}

.status.offline {
  color: var(--text-secondary);
}

.friend-actions,
.request-actions,
.suggestion-actions {
  display: flex;
  gap: 8px;
}

.message-btn,
.more-btn,
.accept-btn,
.decline-btn,
.add-friend-btn,
.remove-btn {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: var(--transition);
  font-size: 14px;
}

.accept-btn,
.add-friend-btn {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.decline-btn,
.remove-btn {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.request-card,
.suggestion-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.suggestion-reason {
  font-size: 12px;
  color: var(--primary-color);
  background: rgba(29, 161, 242, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  margin-top: 4px;
  display: inline-block;
}

/* ===== SETTINGS PAGE ===== */
.settings-container {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 30px;
  max-width: 1000px;
  margin: 0 auto;
}

.settings-sidebar {
  background: var(--surface-color);
  border-radius: var(--border-radius);
  padding: 20px;
  height: fit-content;
  border: 1px solid var(--border-color);
}

.settings-sidebar h2 {
  margin: 0 0 20px 0;
  color: var(--text-primary);
  font-size: 20px;
}

.settings-nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: none;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  text-align: left;
  margin-bottom: 4px;
}

.settings-nav-btn:hover {
  background: var(--background-color);
  color: var(--text-primary);
}

.settings-nav-btn.active {
  background: var(--primary-color);
  color: white;
}

.settings-content {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 30px;
}

.settings-section h3 {
  margin: 0 0 24px 0;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: var(--transition);
  background: var(--background-color);
  color: var(--text-primary);
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(29, 161, 242, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.save-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition);
}

.save-btn:hover {
  background: var(--secondary-color);
  transform: translateY(-2px);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info h4 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

.setting-info p {
  margin: 4px 0 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

/* Toggle Switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color);
  transition: var(--transition);
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: var(--transition);
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--primary-color);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
    margin-left: 0;
    margin-top: 0;
    padding-bottom: calc(var(--mobile-nav-height) + var(--mobile-quick-height) + 16px);
  }
  
  .messages-container {
    grid-template-columns: 1fr;
    height: calc(100vh - var(--mobile-nav-height) - var(--mobile-quick-height) - 32px);
  }
  
  .conversations-list {
    display: none;
  }
  
  .settings-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .settings-sidebar {
    order: 2;
  }
  
  .friends-list,
  .requests-list,
  .suggestions-list {
    grid-template-columns: 1fr;
  }
  
  .friend-card,
  .request-card,
  .suggestion-card {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-info {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }
  
  .profile-details {
    padding-top: 20px;
  }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .search-filters {
    justify-content: center;
  }
  
  .post-type-selector {
    justify-content: center;
  }
  
  .create-actions {
    flex-direction: column;
  }
  
  .cancel-btn,
  .publish-btn {
    width: 100%;
  }
}`,

  // App.jsx principal
  appJS: `import React, { useState, useEffect } from 'react';
import NavigationSystem from './components/NavigationSystem';
import useNavigation from './hooks/useNavigation';

// Import des pages
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import SearchPage from './pages/SearchPage';
import CreatePage from './pages/CreatePage';
import FriendsPage from './pages/FriendsPage';
import SettingsPage from './pages/SettingsPage';

import './styles/NavigationSystem.css';
import './styles/Pages.css';
import './App.css';

// Mock user data
const mockUser = {
  id: 1,
  name: 'Marie Dubois',
  username: 'marie_dubois',
  avatar: '/api/placeholder/40/40',
  followers: 1234,
  following: 856,
  verified: true
};

function App() {
  const {
    activeTab,
    handleTabChange,
    goBack,
    navigationHistory,
    notifications
  } = useNavigation('home');

  const [user] = useState(mockUser);
  const [theme, setTheme] = useState('light');

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            handleTabChange('home');
            break;
          case '2':
            e.preventDefault();
            handleTabChange('search');
            break;
          case '3':
            e.preventDefault();
            handleTabChange('notifications');
            break;
          case '4':
            e.preventDefault();
            handleTabChange('messages');
            break;
          case '5':
            e.preventDefault();
            handleTabChange('profile');
            break;
          case 'n':
            e.preventDefault();
            handleTabChange('create');
            break;
          default:
            break;
        }
      }
      
      if (e.key === 'Escape') {
        goBack();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleTabChange, goBack]);

  // Fonction pour rendre la page active
  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'profile':
        return <ProfilePage />;
      case 'messages':
        return <MessagesPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'search':
        return <SearchPage />;
      case 'create':
      case 'create-post':
      case 'create-story':
      case 'create-video':
      case 'create-live':
        return <CreatePage />;
      case 'friends':
        return <FriendsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'explore':
        return <SearchPage />;
      case 'videos':
        return <HomePage />;
      case 'games':
        return <HomePage />;
      case 'marketplace':
        return <HomePage />;
      case 'saved':
        return <HomePage />;
      case 'events':
        return <HomePage />;
      case 'liked':
        return <HomePage />;
      case 'analytics':
        return <HomePage />;
      case 'help':
        return <SettingsPage />;
      case 'activity':
        return <NotificationsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className={\`app \${theme}-theme\`}>
      <NavigationSystem
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={user}
        notifications={notifications.notifications}
        messages={notifications.messages}
      />
      
      <main className="app-main">
        {renderActivePage()}
      </main>
    </div>
  );
}

export default App;`,

  // App.css
  appCSS: `/* App Styles */
.app {
  min-height: 100vh;
  background: var(--background-color);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-main {
  margin-left: var(--sidebar-width);
  margin-top: var(--top-nav-height);
  padding: 24px;
  min-height: calc(100vh - var(--top-nav-height));
  transition: var(--transition);
}

@media (max-width: 768px) {
  .app-main {
    margin-left: 0;
    margin-top: 0;
    padding: 16px;
    padding-bottom: calc(var(--mobile-nav-height) + var(--mobile-quick-height) + 16px);
    min-height: calc(100vh - var(--mobile-nav-height) - var(--mobile-quick-height));
  }
}

.app.sidebar-collapsed .app-main {
  margin-left: var(--sidebar-collapsed-width);
}

.app.light-theme {
  --background-color: #ffffff;
  --surface-color: #f8f9fa;
  --border-color: #e1e8ed;
  --text-primary: #14171A;
  --text-secondary: #657786;
}

.app.dark-theme {
  --background-color: #15202B;
  --surface-color: #192734;
  --border-color: #38444d;
  --text-primary: #ffffff;
  --text-secondary: #8899a6;
}

* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}`
};

// Fonction pour écrire les fichiers
function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fichier créé: ${filePath}`);
}

// Fonction pour installer les dépendances
function installDependencies() {
  console.log('\n📦 Installation des dépendances...');
  
  // Lire le package.json existant
  let packageJson = {};
  if (fs.existsSync('./package.json')) {
    packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  }
  
  // Ajouter les nouvelles dépendances
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }
  
  Object.assign(packageJson.dependencies, templates.packageDependencies);
  
  // Écrire le package.json mis à jour
  fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ package.json mis à jour');
  
  console.log('\n🚀 Exécutez "npm install" pour installer les dépendances');
}

// Fonction principale de génération
function generateNavigation() {
  console.log('🚀 Génération du système de navigation...\n');
  
  // Créer les dossiers
  createDirectories();
  
  // Générer les composants
  writeFile(`${config.componentsDir}/NavigationSystem.jsx`, templates.navigationSystem);
  writeFile(`${config.componentsDir}/TopNavigation.jsx`, templates.topNavigation);
  writeFile(`${config.componentsDir}/SideNavigation.jsx`, templates.sideNavigation);
  writeFile(`${config.componentsDir}/MobileNavigation.jsx`, templates.mobileNavigation);
  
  // Générer le hook
  writeFile(`${config.hooksDir}/useNavigation.js`, templates.useNavigation);
  
  // Générer les styles
  writeFile(`${config.stylesDir}/NavigationSystem.css`, templates.navigationCSS);
  writeFile(`${config.stylesDir}/Pages.css`, templates.pagesCSS);
  
  // Générer les pages
  Object.entries(templates.pages).forEach(([pageName, content]) => {
    writeFile(`${config.pagesDir}/${pageName}.jsx`, content);
  });
  
  // Générer App.jsx et App.css
  writeFile(`${config.srcDir}/App.jsx`, templates.appJS);
  writeFile(`${config.srcDir}/App.css`, templates.appCSS);
  
  // Installer les dépendances
  installDependencies();
  
  console.log('\n🎉 Génération terminée avec succès!');
  console.log('\n📋 Fichiers générés:');
  console.log('   • NavigationSystem.jsx - Système de navigation principal');
  console.log('   • TopNavigation.jsx - Barre de navigation supérieure');
  console.log('   • SideNavigation.jsx - Navigation latérale');
  console.log('   • MobileNavigation.jsx - Navigation mobile');
  console.log('   • useNavigation.js - Hook personnalisé');
  console.log('   • NavigationSystem.css - Styles de navigation');
  console.log('   • Pages.css - Styles des pages');
  console.log('   • 8 pages complètes (Home, Profile, Messages, etc.)');
  console.log('   • App.jsx et App.css mis à jour');
  
  console.log('\n🚀 Pour démarrer:');
  console.log('   1. npm install');
  console.log('   2. npm start');
  
  console.log('\n⌨️  Raccourcis clavier:');
  console.log('   • Ctrl+1-5: Navigation rapide');
  console.log('   • Ctrl+N: Créer du contenu');
  console.log('   • Échap: Retour');
}

// Exécuter le script
if (require.main === module) {
  generateNavigation();
}

module.exports = { generateNavigation, templates, config };

