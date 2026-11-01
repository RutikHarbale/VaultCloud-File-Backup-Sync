import React, { useEffect, useState } from 'react';
import { Trash2, RotateCcw, XCircle, Folder, FileText, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const TrashView = ({ onRefreshStorage }) => {
  const [trashedItems, setTrashedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await api.get('/files/?trashed=true');
      setTrashedItems(res.data.results || []);
    } catch (e) {
      console.error('Failed to load trash items', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrash(); }, []);

  const handleRestore = async (item) => {
    try {
      if (item.type === 'folder') {
        await api.patch(`/folders/${item.id}/`, { deleted: false });
      } else {
        await api.post(`/files/${item.id}/restore/`);
      }
      fetchTrash();
      if (onRefreshStorage) onRefreshStorage();
    } catch (e) {
      alert('Failed to restore item.');
    }
  };

  const handlePermanentDelete = async (item) => {
    if (!window.confirm(`Permanently delete "${item.name}"? This action cannot be undone.`)) return;
    try {
      const endpoint = item.type === 'folder' ? `/folders/${item.id}/` : `/files/${item.id}/permanent/`;
      await api.delete(endpoint);
      fetchTrash();
      if (onRefreshStorage) onRefreshStorage();
    } catch (e) {
      alert('Failed to permanently delete item.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: 'rgba(244,63,94,0.12)',
          border: '1px solid rgba(244,63,94,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Trash2 size={20} color="var(--accent-rose)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Trash / Recycled</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Items here will be permanently deleted after 30 days.
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      {trashedItems.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          marginBottom: 20, fontSize: '0.84rem', color: 'var(--accent-amber)',
        }}>
          <AlertTriangle size={16} />
          <span>
            <strong>{trashedItems.length} item{trashedItems.length !== 1 ? 's' : ''}</strong> in trash.
            Restore items or delete them permanently.
          </span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{
              height: 64, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            }} className="skeleton" />
          ))}
        </div>
      ) : trashedItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Trash2 size={60} /></div>
          <h3>Trash is empty</h3>
          <p>Deleted files and folders will appear here</p>
        </div>
      ) : (
        <div className="file-list">
          {trashedItems.map((item) => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                padding: '14px 18px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: 16,
              }}
            >
              {/* Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: item.type === 'folder' ? 'rgba(6,182,212,0.08)' : 'rgba(244,63,94,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {item.type === 'folder'
                    ? <Folder size={20} color="var(--accent-cyan)" />
                    : <FileText size={20} color="var(--accent-rose)" />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: 2 }}>
                    Deleted {item.type} · Awaiting permanent deletion
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleRestore(item)}
                  style={{ padding: '8px 14px', fontSize: '0.83rem' }}
                  title="Restore"
                >
                  <RotateCcw size={14} />
                  Restore
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handlePermanentDelete(item)}
                  style={{ padding: '8px 14px', fontSize: '0.83rem' }}
                  title="Delete Permanently"
                >
                  <XCircle size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashView;
