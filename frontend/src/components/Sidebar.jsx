import React, { useEffect, useState } from 'react';
import {
  Cloud, HardDrive, Trash2, LogOut, ShieldCheck,
  RefreshCw, Smartphone, Lock, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Sidebar = ({ activeTab, setActiveTab, mobileOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [storageInfo, setStorageInfo] = useState({
    storage_used_bytes: 0,
    storage_quota_bytes: 5368709120,
    usage_percentage: 0,
  });

  const fetchStorage = async () => {
    try {
      const res = await api.get('/storage/usage/');
      setStorageInfo(res.data);
    } catch (e) {
      console.error('Failed to fetch storage usage', e);
    }
  };

  useEffect(() => {
    fetchStorage();
    const interval = setInterval(fetchStorage, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isWarning = storageInfo.usage_percentage > 85;
  const userInitial = (user?.email || 'U')[0].toUpperCase();

  const navItems = [
    { id: 'drive', icon: <HardDrive size={17} />, label: 'My Drive' },
    { id: 'trash', icon: <Trash2 size={17} />, label: 'Trash / Recycled' },
  ];

  const infoItems = [
    { icon: <Lock size={14} />, label: 'End-to-End Encrypted', color: 'var(--accent-emerald)' },
    { icon: <RefreshCw size={14} />, label: 'Real-Time Sync', color: 'var(--primary)' },
    { icon: <Smartphone size={14} />, label: 'Multi-Device Access', color: 'var(--accent-purple)' },
  ];

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Mobile close btn */}
      <button
        onClick={onClose}
        className="btn-ghost btn btn-icon"
        style={{ alignSelf: 'flex-end', marginBottom: 8, display: 'none' }}
        aria-label="Close menu"
        id="sidebar-close-btn"
      >
        <X size={18} />
      </button>

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Cloud size={22} color="#fff" />
        </div>
        <div className="sidebar-logo-text">
          <h2>CloudSyncVault</h2>
          <span><ShieldCheck size={11} /> Encrypted Storage</span>
        </div>
      </div>

      {/* Main Nav */}
      <span className="sidebar-section-label">Navigation</span>
      <nav className="sidebar-nav">
        {navItems.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`sidebar-nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => { setActiveTab(id); onClose(); }}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>

      {/* Info items */}
      <span className="sidebar-section-label" style={{ marginTop: 16 }}>Platform</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {infoItems.map(({ icon, label, color }) => (
          <div
            key={label}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', fontSize: '0.82rem',
              color: 'var(--text-dim)', borderRadius: 'var(--radius-sm)',
            }}
          >
            <span style={{ color }}>{icon}</span>
            {label}
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* Storage Indicator */}
      <div className="sidebar-info-card">
        <div className="sidebar-storage-label">
          <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>Storage</span>
          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: isWarning ? 'var(--accent-rose)' : 'var(--text-main)' }}>
            {storageInfo.usage_percentage}%
          </span>
        </div>
        <div className="progress-bar" style={{ marginBottom: 10 }}>
          <div
            className={`progress-fill ${isWarning ? 'warning' : ''}`}
            style={{ width: `${Math.min(storageInfo.usage_percentage, 100)}%` }}
          />
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
          <span>{formatBytes(storageInfo.storage_used_bytes)} used</span>
          <span>{formatBytes(storageInfo.storage_quota_bytes)} total</span>
        </div>
      </div>

      {/* User Footer */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">{userInitial}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-email" title={user?.email}>{user?.email}</div>
          <div className="sidebar-user-role">Personal Account</div>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          className="btn btn-ghost btn-icon"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
