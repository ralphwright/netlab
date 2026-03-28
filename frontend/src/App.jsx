import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { UserProvider } from './useUser';
import { ThemeProvider } from './useTheme';
import Dashboard from './components/Dashboard';
import LabView from './components/LabView';
import TheoryList from './components/TheoryList';
import TheoryPage from './components/TheoryPage';
import UserBadge from './components/UserBadge';
import ThemeToggle from './components/ThemeToggle';
import SearchBar from './components/SearchBar';
import { Network, Terminal, BookOpen, ExternalLink } from 'lucide-react';

function AppInner() {
  const location = useLocation();
  const onTheory = location.pathname === '/' || location.pathname.startsWith('/theory');
  const onLabs   = location.pathname.startsWith('/labs') || location.pathname.startsWith('/lab/');

  return (
    <div className="app-container">
      <header className="app-header">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          <Network size={28} strokeWidth={2.5} color="var(--accent)" />
          <span>Net<span className="accent">Lab</span></span>
        </Link>
        {/* Desktop nav — hidden on mobile */}
        <nav className="app-nav-desktop">
          <Link to="/" className={onTheory ? 'active' : ''}>Theory</Link>
          <Link to="/labs" className={onLabs ? 'active' : ''}>Labs</Link>
          <a href="https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/Cisco_IOS_Configuration_Fundamentals_Command_Reference.html"
             target="_blank" rel="noopener noreferrer">
            IOS Reference
          </a>
          <SearchBar />
          <ThemeToggle />
          <UserBadge />
        </nav>
        {/* Mobile header right — search + theme + user */}
        <div className="app-nav-mobile-header">
          <SearchBar />
          <ThemeToggle />
          <UserBadge />
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<TheoryList />} />
          <Route path="/theory/:slug" element={<TheoryPage />} />
          <Route path="/labs" element={<Dashboard />} />
          <Route path="/lab/:slug" element={<LabView />} />
        </Routes>
      </main>

      {/* Bottom tab bar — mobile only */}
      <nav className="bottom-tab-bar">
        <Link to="/" className={`bottom-tab ${onTheory ? 'active' : ''}`}>
          <BookOpen size={22} />
          <span>Theory</span>
        </Link>
        <Link to="/labs" className={`bottom-tab ${onLabs ? 'active' : ''}`}>
          <Terminal size={22} />
          <span>Labs</span>
        </Link>
        <a
          href="https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/Cisco_IOS_Configuration_Fundamentals_Command_Reference.html"
          target="_blank" rel="noopener noreferrer"
          className="bottom-tab"
        >
          <ExternalLink size={22} />
          <span>IOS Ref</span>
        </a>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppInner />
      </UserProvider>
    </ThemeProvider>
  );
}
