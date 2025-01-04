import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Make environment variables available globally
declare global {
  interface Window {
    env: {
      VITE_ANTHROPIC_API_KEY: string;
    };
  }
}

window.env = {
  VITE_ANTHROPIC_API_KEY: import.meta.env.VITE_ANTHROPIC_API_KEY as string,
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
