import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LabView from './components/LabView';
import { Network } from 'lucide-react';

export default function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      <header className="app-header">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          <Network size={28} strokeWidth={2.5} color="var(--accent)" />
          <span>Net<span className="accent">Lab</span></span>
        </Link>
        <nav>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Labs
          </Link>
          <a href="https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/Cisco_IOS_Configuration_Fundamentals_Command_Reference.html"
             target="_blank" rel="noopener noreferrer">
            IOS Reference
          </a>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lab/:slug" element={<LabView />} />
        </Routes>
      </main>
    </div>
  );
}
