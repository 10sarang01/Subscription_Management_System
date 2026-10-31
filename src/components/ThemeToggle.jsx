import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ showLabel = false, className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
      aria-label={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
    >
      {isDark ? (
        <Sun size={18} style={{ color: '#fbbf24' }} />
      ) : (
        <Moon size={18} style={{ color: '#6366f1' }} />
      )}
      {showLabel && (
        <span style={{ fontSize: '0.82rem', fontWeight: 600, marginLeft: '6px' }}>
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}

