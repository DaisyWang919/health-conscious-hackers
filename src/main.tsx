import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { MemosProvider } from './hooks/useMemos.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MemosProvider>
        <App />
      </MemosProvider>
    </BrowserRouter>
  </StrictMode>
);