import React from 'react';

import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

// Fix the react-dom/client import
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <ToastContainer position="bottom-right" />
    </AuthProvider>
  </React.StrictMode>
);
