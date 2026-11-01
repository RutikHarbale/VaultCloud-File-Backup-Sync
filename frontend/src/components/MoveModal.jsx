import React, { useEffect, useState } from 'react';
import { X, Folder, Move, ChevronRight, Home } from 'lucide-react';
import api from '../services/api';

const MoveModal = ({ item, onClose, onMoved }) => {
  const [folders, setFolders] = useState([]);
  const [selectedParent, setSelectedParent] = useState('root');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const res = await api.get('/files/?trashed=false');
        const onlyFolders = res.data.results.filter(
          (i) => i.type === 'folder' && i.id !== item.id
        );
        setFolders(onlyFolders);
      } catch (e) {
        console.error('Failed to load folders for move modal', e);
      } finally {
        setLoading(false);
      }
    };
    loadFolders();
  }, [item]);

  const handleMove = async () => {
    try {
      const endpoint = item.type === 'folder' ? `/folders/${item.id}/` : `/files/${item.id}/`;
      await api.patch(endpoint, {
        parent_id: selectedParent === 'root' ? null : selectedParent,
      });
      if (onMoved) onMoved();
      onClose();
    } catch (e) {
      alert('Failed to move item: ' + (e.response?.data?.error || e.message));
    }
  };

  const FolderOption = ({ id, name, isRoot = false }) => {
    const selected = selectedParent === id;
    return (
      <div
        role="option"
        aria-selected={selected}
        onClick={() => setSelectedParent(id)}
        style={{
          padding: '11px 14px',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
          border: `1px solid ${selected ? 'var(--primary)' : 'var(--border-color)'}`,
          background: selected ? 'rgba(59,130,246,0.08)' : 'var(--bg-card)',
          transition: 'var(--transition)',
          marginBottom: 6,
        }}
      >
        {isRoot
          ? <Home size={17} color="var(--primary)" />
          : <Folder size={17} color="var(--accent-cyan)" />}
        <span style={{ fontSize: '0.88rem', fontWeight: selected ? 700 : 500 }}>
          {name}
        </span>
        {selected && <ChevronRight size={15} color="var(--primary)" style={{ marginLeft: 'auto' }} />}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Move Item">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Move size={18} color="var(--accent-purple)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Move Item</h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Moving: <strong>{item.name}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 14 }}>
          Select destination folder:
        </p>

        {/* Folder List */}
        <div
          role="listbox"
          aria-label="Destination folders"
          style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 24, paddingRight: 2 }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton" style={{ height: 44, borderRadius: 'var(--radius-sm)' }} />
              ))}
            </div>
          ) : (
            <>
              <FolderOption id="root" name="My Drive (Root)" isRoot />
              {folders.map((f) => (
                <FolderOption key={f.id} id={f.id} name={f.name} />
              ))}
              {folders.length === 0 && (
                <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', textAlign: 'center', padding: '16px 0' }}>
                  No other folders available
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '9px 18px' }}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleMove}
            disabled={loading}
            style={{ padding: '9px 20px' }}
          >
            <Move size={15} />
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveModal;
