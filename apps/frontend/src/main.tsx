import './index.css'; 
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import 'rsuite/dist/rsuite.min.css';
import { BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';



ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);