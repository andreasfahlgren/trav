import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { GameStateProvider } from './context/GameStateContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameStateProvider>
      <App />
    </GameStateProvider>
  </React.StrictMode>,
);
