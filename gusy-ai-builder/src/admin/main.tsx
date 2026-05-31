import { createRoot } from 'react-dom/client';
import apiFetch from '@wordpress/api-fetch';
import './styles.css';
import { App } from './App';

const settings = window.GusyBuilderSettings;

if (settings?.nonce && 'createNonceMiddleware' in apiFetch) {
  apiFetch.use(apiFetch.createNonceMiddleware(settings.nonce));
}

const root = document.getElementById('gusy-app');

if (root && settings) {
  createRoot(root).render(<App settings={settings} />);
}
