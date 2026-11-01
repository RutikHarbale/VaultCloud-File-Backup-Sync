import React, { useState, useEffect } from 'react';
import {
  RefreshCw, CheckCircle, Upload, FolderPlus, Trash2,
  Clock, Activity, Wifi
} from 'lucide-react';

const RightSidebar = ({ refreshKey }) => {
  const [lastSynced, setLastSynced] = useState(new Date());
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'syncing'

  // Update last synced whenever refreshKey changes
  useEffect(() => {
    setSyncStatus('syncing');
    const t = setTimeout(() => {
      setSyncStatus('synced');
      setLastSynced(new Date());
    }, 1200);
    return () => clearTimeout(t);
  }, [refreshKey]);

  const formatTime = (d) => {
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Mock recent activity (in real app you'd fetch this from an activity API)
  const activities = [
    { icon: <Upload size={13} />, color: 'var(--primary)', text: 'Files synced to cloud', time: formatTime(lastSynced) },
    { icon: <CheckCircle size={13} />, color: 'var(--accent-emerald)', text: 'Sync completed', time: formatTime(lastSynced) },
    { icon: <FolderPlus size={13} />, color: 'var(--accent-purple)', text: 'Folder structure updated', time: '5m ago' },
    { icon: <Trash2 size={13} />, color: 'var(--accent-rose)', text: 'Trash auto-cleaned', time: '1h ago' },
  ];

  return (
    <div className="right-panel">
      {/* Sync Status Card */}
      <div className="right-panel-card">
        <div className="right-panel-title">
          <Wifi size={15} color="var(--primary)" />
          Sync Status
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          background: syncStatus === 'synced'
            ? 'rgba(16,185,129,0.08)'
            : 'rgba(59,130,246,0.08)',
          border: `1px solid ${syncStatus === 'synced' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`,
        }}>
          {syncStatus === 'synced' ? (
            <CheckCircle size={16} color="var(--accent-emerald)" />
          ) : (
            <RefreshCw size={16} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
          )}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: syncStatus === 'synced' ? 'var(--accent-emerald)' : 'var(--primary)' }}>
              {syncStatus === 'synced' ? 'All files up to date' : 'Syncing...'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
              <Clock size={11} style={{ display: 'inline', marginRight: 4 }} />
              Last synced: {formatTime(lastSynced)}
            </div>
          </div>
        </div>

        {/* Sync Progress Bar */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 6 }}>Sync Progress</div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: syncStatus === 'synced' ? '100%' : '60%', transition: 'width 0.8s ease' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 6 }}>
          <span>{syncStatus === 'synced' ? 'Complete' : 'In Progress'}</span>
          <span>{syncStatus === 'synced' ? '100%' : '60%'}</span>
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="right-panel-card">
        <div className="right-panel-title">
          <Activity size={15} color="var(--accent-purple)" />
          Recent Activity
        </div>
        <div>
          {activities.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="activity-dot" style={{ background: a.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{a.text}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                  {a.icon} {a.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
