import React, { createContext, useContext, useReducer } from 'react';

// État initial
const initialState = {
  theme: 'light',
  loading: false,
  user: null,
  notifications: []
};

// Actions
const AppActionTypes = {
  SET_THEME: 'SET_THEME',
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case AppActionTypes.SET_THEME:
      return { ...state, theme: action.payload };
    case AppActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case AppActionTypes.SET_USER:
      return { ...state, user: action.payload };
    case AppActionTypes.ADD_NOTIFICATION:
      return { 
        ...state, 
        notifications: [...state.notifications, action.payload] 
      };
    case AppActionTypes.REMOVE_NOTIFICATION:
      return { 
        ...state, 
        notifications: state.notifications.filter(n => n.id !== action.payload) 
      };
    default:
      return state;
  }
};

// Context
const AppContext = createContext();

// Provider
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actions = {
    setTheme: (theme) => dispatch({ type: AppActionTypes.SET_THEME, payload: theme }),
    setLoading: (loading) => dispatch({ type: AppActionTypes.SET_LOADING, payload: loading }),
    setUser: (user) => dispatch({ type: AppActionTypes.SET_USER, payload: user }),
    addNotification: (notification) => dispatch({ 
      type: AppActionTypes.ADD_NOTIFICATION, 
      payload: { ...notification, id: Date.now() } 
    }),
    removeNotification: (id) => dispatch({ type: AppActionTypes.REMOVE_NOTIFICATION, payload: id })
  };

  return (
    <AppContext.Provider value={{ state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook personnalisé
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};