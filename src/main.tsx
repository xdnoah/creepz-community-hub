import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { WindowProvider } from './contexts/WindowContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <WindowProvider>
        <App />
      </WindowProvider>
    </AuthProvider>
  </React.StrictMode>
);
