import React from 'react';
import './App.css';

interface NavProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NavigationBar: React.FC<NavProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <nav className="nav-pill">
      {/* Decorative background gloss */}
      <div className="nav-gloss" />

      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`nav-button ${activeTab === tab ? 'active' : ''}`}
        >
          {tab}
          
          {/* Active Indicator */}
          {activeTab === tab && (
            <span className="active-indicator" />
          )}
        </button>
      ))}
    </nav>
  );
};

export default NavigationBar;