import React from 'react';
import { HardDrive, Shield, RefreshCw, Globe, Files } from 'lucide-react';

const StorageCircle = ({ percentage }) => {
  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C - (C * Math.min(percentage, 100)) / 100;
  const isWarning = percentage > 85;

  return (
    <div className="storage-circle-container">
      <svg viewBox="0 0 120 120" width="120" height="120" className="storage-circle-svg">
        <defs>
          <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isWarning ? '#f59e0b' : '#3b82f6'} />
            <stop offset="100%" stopColor={isWarning ? '#ef4444' : '#06b6d4'} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={R} className="storage-circle-track" />
        <circle
          cx="60"
          cy="60"
          r={R}
          className="storage-circle-fill"
          strokeDasharray={C}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="storage-circle-center">
        <span style={{
          fontSize: '1.3rem', fontWeight: 800,
          color: isWarning ? 'var(--accent-rose)' : 'var(--text-main)',
          letterSpacing: '-0.02em'
        }}>
          {percentage}%
        </span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 500 }}>USED</span>
      </div>
    </div>
  );
};

const DashboardStats = ({ storageInfo, fileCount }) => {
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stats = [
    {
      icon: <Files size={20} />,
      iconBg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
      value: fileCount,
      label: 'Total Files',
    },
    {
      icon: <HardDrive size={20} />,
      iconBg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
      value: 'My Drive',
      label: 'Personal Cloud Storage',
    },
    {
      icon: <Shield size={20} />,
      iconBg: 'linear-gradient(135deg,#10b981,#047857)',
      value: 'Secured',
      label: 'AES-256-GCM Status',
    },
    {
      icon: <Globe size={20} />,
      iconBg: 'linear-gradient(135deg,#06b6d4,#0891b2)',
      value: 'Online',
      label: 'Access Anywhere',
    },
  ];

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Stats Row */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.iconBg }}>
              <span style={{ color: '#fff' }}>{s.icon}</span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Storage Usage Card */}
      <div className="glass-card" style={{ padding: '22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <StorageCircle percentage={storageInfo.usage_percentage || 0} />
          <div style={{ flex: 1, minWidth: 160 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>Storage Usage</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Used</span>
                <span style={{ fontWeight: 700 }}>{formatBytes(storageInfo.storage_used_bytes)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total</span>
                <span style={{ fontWeight: 700 }}>{formatBytes(storageInfo.storage_quota_bytes)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Free</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  {formatBytes((storageInfo.storage_quota_bytes || 0) - (storageInfo.storage_used_bytes || 0))}
                </span>
              </div>
            </div>
            <div className="progress-bar" style={{ marginTop: 14 }}>
              <div
                className={`progress-fill ${storageInfo.usage_percentage > 85 ? 'warning' : ''}`}
                style={{ width: `${Math.min(storageInfo.usage_percentage || 0, 100)}%` }}
              />
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Shield size={13} color="var(--accent-emerald)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>Encrypted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 99, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <RefreshCw size={13} color="var(--primary)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)' }}>Synced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
