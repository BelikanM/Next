import React, { useState, useEffect } from 'react';
import TopNavigation from './TopNavigation';
import SideNavigation from './SideNavigation';
import MobileNavigation from './MobileNavigation';
import './NavigationSystem.css';

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
      
      // Auto-collapse sidebar on tablet
      if (width <= 1024) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    setShowProfileMenu(false);
  };

  return (
    <div className="navigation-system">
      {/* Top Navigation - Always visible on desktop and tablet */}
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

      {/* Side Navigation - Desktop and tablet only */}
      {!isMobile && (
        <SideNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          isTablet={isTablet}
        />
      )}

      {/* Mobile Navigation - Mobile only */}
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

export default NavigationSystem;
