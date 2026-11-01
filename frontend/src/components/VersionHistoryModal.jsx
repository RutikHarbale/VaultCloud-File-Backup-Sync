import React, { useEffect, useState } from 'react';
import { X, History, Download, RotateCcw, ShieldCheck, Clock } from 'lucide-react';
import api from '../services/api';

const VersionHistoryModal = ({ file, onClose, onRestored }) => {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRevisions = async () => {
    if (!file) return;
    try {
      const res = await api.get(`/files/${file.id}/revisions/`);
      setRevisions(res.data);
    } catch (e) {
      console.error('Failed to fetch version history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRevisions(); }, [file]);

  const handleDownloadRevision = async (rev) => {
    try {
      const res = await api.get(`/files/${file.id}/revisions/${rev.id}/content/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file.name}.v${rev.version_number}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to download revision.');
    }
  };

  const handleRestoreRevision = async (rev) => {
    if (!window.confirm(`Restore version ${rev.version_number} as current version?`)) return;
    try {
      await api.post(`/files/${file.id}/revisions/${rev.id}/restore/`);
      alert(`Version ${rev.version_number} restored successfully!`);
      if (onRestored) onRestored();
      onClose();
    } catch (e) {
      alert('Failed to restore revision.');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Version History">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <History size={18} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Version History</h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>{file.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          ) : revisions.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon"><History size={48} /></div>
              <h3>No revisions available</h3>
              <p>Upload a newer version of this file to create a history</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {revisions.map((rev) => {
                const isCurrent = file.current_version_id === rev.id || file.version_number === rev.version_number;
                return (
                  <div
                    key={rev.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: isCurrent ? 'rgba(59,130,246,0.06)' : 'var(--bg-card)',
                      border: `1px solid ${isCurrent ? 'rgba(59,130,246,0.3)' : 'var(--border-color)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    }}
                  >
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>v{rev.version_number}</span>
                        {isCurrent && (
                          <span style={{
                            fontSize: '0.72rem', background: 'var(--primary)', color: '#fff',
                            padding: '2px 9px', borderRadius: 99, fontWeight: 700,
                          }}>
                            Current
                          </span>
                        )}
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />
                          {new Date(rev.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        <span>Size: {formatBytes(rev.size)}</span>
                        {rev.content_hash && (
                          <span className="hash-badge">
                            <ShieldCheck size={11} />
                            {rev.content_hash.slice(0, 14)}...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleDownloadRevision(rev)}
                        title="Download this version"
                        style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                      >
                        <Download size={14} />
                      </button>
                      {!isCurrent && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleRestoreRevision(rev)}
                          title="Restore as current version"
                          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                        >
                          <RotateCcw size={14} />
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;
