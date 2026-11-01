import React from 'react';
import {
  Search, FolderPlus, Upload, Grid, List,
  Sun, Moon, Menu, RefreshCw, Bell
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onNewFolder,
  onUpload,
  onMenuToggle,
  onRefresh,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar">
      {/* Left: hamburger (mobile) + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="mobile-menu-btn"
          onClick={onMenuToggle}
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="navbar-search">
          <Search
            size={16}
            style={{
              position: 'absolute', left: 13, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search files and folders..."
            className="input-field has-icon-left"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search files and folders"
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="navbar-actions">
        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          padding: '3px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
        }}>
          <button
            onClick={() => setViewMode('grid')}
            className="navbar-icon-btn"
            title="Grid View"
            aria-pressed={viewMode === 'grid'}
            style={{
              background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              width: 30, height: 30,
            }}
          >
            <Grid size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="navbar-icon-btn"
            title="List View"
            aria-pressed={viewMode === 'list'}
            style={{
              background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'list' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              width: 30, height: 30,
            }}
          >
            <List size={15} />
          </button>
        </div>

        {/* Refresh */}
        {onRefresh && (
          <button
            className="navbar-icon-btn"
            onClick={onRefresh}
            title="Refresh"
            aria-label="Refresh files"
          >
            <RefreshCw size={16} />
          </button>
        )}

        {/* Notifications */}
        <button className="navbar-icon-btn" title="Notifications" aria-label="Notifications">
          <Bell size={16} />
        </button>

        {/* New Folder */}
        <button className="btn btn-secondary" onClick={onNewFolder} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
          <FolderPlus size={16} />
          <span className="hide-xs">New Folder</span>
        </button>

        {/* Upload File */}
        <label
          className="btn btn-primary"
          style={{ margin: 0, cursor: 'pointer', padding: '8px 16px', fontSize: '0.85rem' }}
          title="Upload File"
        >
          <Upload size={16} />
          <span className="hide-xs">Upload</span>
          <input type="file" onChange={onUpload} style={{ display: 'none' }} multiple aria-label="Upload files" />
        </label>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="navbar-icon-btn"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
