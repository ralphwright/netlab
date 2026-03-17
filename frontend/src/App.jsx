import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { UserProvider } from './useUser';
import Dashboard from './components/Dashboard';
import LabView from './components/LabView';
import TheoryList from './components/TheoryList';
import TheoryPage from './components/TheoryPage';
import UserBadge from './components/UserBadge';
import { Network } from 'lucide-react';

function AppInner() {
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
          <Link to="/theory" className={location.pathname.startsWith('/theory') ? 'active' : ''}>
            Theory
          </Link>
          <a href="https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/Cisco_IOS_Configuration_Fundamentals_Command_Reference.html"
             target="_blank" rel="noopener noreferrer">
            IOS Reference
          </a>
          <UserBadge />
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lab/:slug" element={<LabView />} />
          <Route path="/theory" element={<TheoryList />} />
          <Route path="/theory/:slug" element={<TheoryPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppInner />
    </UserProvider>
  );
}
