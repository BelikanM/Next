import { useState, useEffect, useCallback } from 'react';

const useNavigation = (initialTab = 'home') => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [navigationHistory, setNavigationHistory] = useState([initialTab]);
  const [notifications, setNotifications] = useState({
    messages: 0,
    notifications: 0,
    friendRequests: 0
  });

  // Simuler des notifications en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      // Simuler l'arrivée de nouvelles notifications
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

  // Gestion du changement d'onglet
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setNavigationHistory(prev => [...prev, tabId]);
    
    // Réinitialiser les notifications pour l'onglet visité
    if (tabId === 'messages') {
      setNotifications(prev => ({ ...prev, messages: 0 }));
    } else if (tabId === 'notifications') {
      setNotifications(prev => ({ ...prev, notifications: 0 }));
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('lastActiveTab', tabId);
  }, []);

  // Naviguer vers l'arrière
  const goBack = useCallback(() => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Retirer l'onglet actuel
      const previousTab = newHistory[newHistory.length - 1];
      setActiveTab(previousTab);
      setNavigationHistory(newHistory);
    }
  }, [navigationHistory]);

  // Restaurer l'onglet depuis localStorage au montage
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

export default useNavigation;
