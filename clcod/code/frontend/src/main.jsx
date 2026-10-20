import { createRoot } from 'react-dom/client';
import './lib/storage-helper.js'; // window.MD_Storage — was <script src="js/storage-helper.js">
import './index.css';
import App from './App.jsx';

// No <StrictMode>: page controllers are the original imperative scripts and must run exactly once per visit.
createRoot(document.getElementById('root')).render(<App />);
