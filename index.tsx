import React from 'react';
import ReactDOM from 'react-dom/client';
import Auth from './Auth';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
        <Auth />
    </ErrorBoundary>
  </React.StrictMode>
);