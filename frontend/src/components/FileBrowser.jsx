import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder, FileText, FileCode, Image as ImageIcon, Film, Music, Archive,
  Download, Edit2, Trash2, History, Move, ChevronRight, UploadCloud,
  File as GenericFile, Star, StarOff, Eye,
} from 'lucide-react';
import api from '../services/api';
import VersionHistoryModal from './VersionHistoryModal';
import MoveModal from './MoveModal';

// ── File type icon ─────────────────────────────────────────────
const getFileIcon = (filename, type, size = 28) => {
  if (type === 'folder') return <Folder size={size} color="var(--accent-cyan)" />;
  const ext = (filename || '').split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif'].includes(ext))
    return <ImageIcon size={size} color="var(--accent-emerald)" />;
  if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext))
    return <Film size={size} color="var(--accent-rose)" />;
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext))
    return <Music size={size} color="var(--accent-purple)" />;
  if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2'].includes(ext))
    return <Archive size={size} color="var(--accent-amber)" />;
  if (['js', 'py', 'html', 'css', 'json', 'ts', 'jsx', 'tsx', 'sh', 'yaml', 'yml'].includes(ext))
    return <FileCode size={size} color="var(--primary)" />;
  return <FileText size={size} color="var(--text-dim)" />;
};

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

// ── Skeleton loader ───────────────────────────────────────────
const SkeletonRow = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: 6, background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="skeleton" style={{ height: 14, width: '55%', borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 11, width: '30%', borderRadius: 4 }} />
    </div>
    <div className="skeleton" style={{ height: 12, width: 60, borderRadius: 4 }} />
    <div className="skeleton" style={{ height: 12, width: 80, borderRadius: 4 }} />
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3].map((n) => <div key={n} className="skeleton" style={{ width: 30, height: 30, borderRadius: 6 }} />)}
    </div>
  </div>
);

const SkeletonGrid = () => (
  <div className="file-grid">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} style={{ borderRadius: 'var(--radius-md)', padding: '18px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 13, width: '80%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 10, width: '50%', borderRadius: 4 }} />
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────
const FileBrowser = ({ searchQuery, viewMode, onRefreshStorage }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: 'root', name: 'My Drive' }]);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [dragOver, setDragOver] = useState(false);
  const [versionModalFile, setVersionModalFile] = useState(null);
  const [moveModalItem, setMoveModalItem] = useState(null);
  const [favourites, setFavourites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('csv_favourites') || '[]'); }
    catch { return []; }
  });

  const saveFavourites = (fav) => {
    setFavourites(fav);
    localStorage.setItem('csv_favourites', JSON.stringify(fav));
  };

  const toggleFavourite = (id) => {
    const next = favourites.includes(id)
      ? favourites.filter((f) => f !== id)
      : [...favourites, id];
    saveFavourites(next);
  };

  const fetchItems = useCallback(async (folderId, search) => {
    setLoading(true);
    try {
      let url = '/files/?trashed=false';
      if (search) {
        url += `&q=${encodeURIComponent(search)}`;
      } else if (folderId && folderId !== 'root') {
        url += `&parent_id=${folderId}`;
      } else {
        url += '&parent_id=root';
      }
      const res = await api.get(url);
      setItems(res.data.results || []);
    } catch (e) {
      console.error('Error fetching files:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(currentFolderId, searchQuery);
  }, [currentFolderId, searchQuery, fetchItems]);

  const handleOpenFolder = (folder) => {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
  };

  const handleBreadcrumbClick = (index) => {
    const newCrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newCrumbs);
    setCurrentFolderId(newCrumbs[newCrumbs.length - 1].id);
  };

  const uploadFiles = async (filesToUpload) => {
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId && currentFolderId !== 'root') {
        formData.append('parent_id', currentFolderId);
      }
      try {
        await api.post('/files/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch (e) {
        alert(`Failed to upload ${file.name}: ` + (e.response?.data?.error || e.message));
      }
    }
    fetchItems(currentFolderId, searchQuery);
    if (onRefreshStorage) onRefreshStorage();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDownload = async (item) => {
    if (item.type === 'folder') return;
    try {
      const res = await api.get(`/files/${item.id}/content/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', item.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to download file.');
    }
  };

  const handleRename = async (item) => {
    const newName = prompt('Enter new name:', item.name);
    if (!newName || newName === item.name) return;
    const previousItems = [...items];
    setItems(items.map((i) => (i.id === item.id ? { ...i, name: newName } : i)));
    try {
      const endpoint = item.type === 'folder' ? `/folders/${item.id}/` : `/files/${item.id}/`;
      await api.patch(endpoint, { name: newName });
    } catch (e) {
      setItems(previousItems);
      alert('Failed to rename item.');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Move "${item.name}" to trash?`)) return;
    const previousItems = [...items];
    setItems(items.filter((i) => i.id !== item.id));
    try {
      const endpoint = item.type === 'folder' ? `/folders/${item.id}/` : `/files/${item.id}/`;
      await api.delete(endpoint);
      if (onRefreshStorage) onRefreshStorage();
    } catch (e) {
      setItems(previousItems);
      alert('Failed to delete item.');
    }
  };

  // ── Action Buttons (shared) ──────────────────────────────────
  const ActionButtons = ({ item, compact = false }) => {
    const p = compact ? '5px' : '7px 10px';
    const isFav = favourites.includes(item.id);
    return (
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <button
          className="btn btn-ghost btn-icon"
          title={isFav ? 'Remove favourite' : 'Add favourite'}
          onClick={() => toggleFavourite(item.id)}
          style={{ padding: p, color: isFav ? 'var(--accent-amber)' : undefined }}
        >
          {isFav ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
        </button>
        {item.type === 'file' && (
          <>
            <button className="btn btn-ghost btn-icon" style={{ padding: p }} title="Download" onClick={() => handleDownload(item)}>
              <Download size={14} />
            </button>
            <button className="btn btn-ghost btn-icon" style={{ padding: p }} title="Version History" onClick={() => setVersionModalFile(item)}>
              <History size={14} />
            </button>
          </>
        )}
        <button className="btn btn-ghost btn-icon" style={{ padding: p }} title="Rename" onClick={() => handleRename(item)}>
          <Edit2 size={14} />
        </button>
        <button className="btn btn-ghost btn-icon" style={{ padding: p }} title="Move" onClick={() => setMoveModalItem(item)}>
          <Move size={14} />
        </button>
        <button
          className="btn btn-ghost btn-icon"
          style={{ padding: p, color: 'var(--accent-rose)' }}
          title="Move to Trash"
          onClick={() => handleDelete(item)}
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{ position: 'relative', minHeight: 'calc(100vh - 180px)' }}
    >
      {/* Drag Overlay */}
      {dragOver && (
        <div className="drop-zone">
          <UploadCloud size={60} color="var(--primary)" />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 14, color: 'var(--primary)' }}>
            Drop files to upload
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Files will be encrypted and uploaded to current folder
          </p>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        {breadcrumbs.map((b, idx) => (
          <React.Fragment key={b.id}>
            {idx > 0 && <ChevronRight size={14} color="var(--text-dim)" />}
            <button
              onClick={() => handleBreadcrumbClick(idx)}
              className={`breadcrumb-btn ${idx === breadcrumbs.length - 1 ? 'active' : ''}`}
            >
              {idx === 0 && <Folder size={15} color="var(--primary)" />}
              {b.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        viewMode === 'grid' ? <SkeletonGrid /> : <>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <UploadCloud size={64} />
          </div>
          <h3>No files or folders here</h3>
          <p>
            {searchQuery
              ? `No results for "${searchQuery}"`
              : 'Drag & drop files here or click Upload to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID VIEW ── */
        <div className="file-grid">
          {items.map((item) => {
            const isFav = favourites.includes(item.id);
            return (
              <div
                key={item.id}
                className="glass-card"
                style={{
                  padding: '18px', display: 'flex', flexDirection: 'column',
                  gap: 0, cursor: item.type === 'folder' ? 'pointer' : 'default',
                  borderLeft: isFav ? '3px solid var(--accent-amber)' : undefined,
                }}
                onClick={() => item.type === 'folder' && handleOpenFolder(item)}
              >
                {/* Top: icon + hash */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: item.type === 'folder' ? 'rgba(6,182,212,0.1)' : 'rgba(59,130,246,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {getFileIcon(item.name, item.type, 22)}
                  </div>
                  {item.type === 'file' && (
                    <span className="hash-badge" title="SHA-256">
                      {item.content_hash ? item.content_hash.slice(0, 7) : 'File'}
                    </span>
                  )}
                </div>

                {/* Name & Size */}
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 4, wordBreak: 'break-word', lineHeight: 1.3 }}>
                  {item.name}
                </h4>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: 14 }}>
                  {item.type === 'file' ? formatBytes(item.size) : 'Folder'}
                  {item.updated_at && <span style={{ marginLeft: 8 }}>· {formatDate(item.updated_at)}</span>}
                </div>

                {/* Actions */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                  <ActionButtons item={item} compact />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div>
          {/* Table Header */}
          <div className="file-table-header" style={{ display: 'grid', gridTemplateColumns: '2fr 0.7fr 0.9fr 1fr auto', gap: 12 }}>
            <span>Name</span>
            <span>Size</span>
            <span>Type</span>
            <span>Modified</span>
            <span>Actions</span>
          </div>
          <div className="file-list">
            {items.map((item) => {
              const isFav = favourites.includes(item.id);
              const ext = item.name.split('.').pop().toUpperCase();
              return (
                <div
                  key={item.id}
                  className="glass-card"
                  style={{
                    padding: '12px 16px',
                    display: 'grid',
                    gridTemplateColumns: '2fr 0.7fr 0.9fr 1fr auto',
                    gap: 12,
                    alignItems: 'center',
                    cursor: item.type === 'folder' ? 'pointer' : 'default',
                    borderLeft: isFav ? '3px solid var(--accent-amber)' : undefined,
                  }}
                  onClick={() => item.type === 'folder' && handleOpenFolder(item)}
                >
                  {/* Name col */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: item.type === 'folder' ? 'rgba(6,182,212,0.1)' : 'rgba(59,130,246,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {getFileIcon(item.name, item.type, 18)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      {item.content_hash && (
                        <span className="hash-badge" style={{ marginTop: 2 }}>
                          {item.content_hash.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Size */}
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {item.type === 'file' ? formatBytes(item.size) : '—'}
                  </span>

                  {/* Type */}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {item.type === 'folder' ? 'Folder' : (ext || 'File')}
                  </span>

                  {/* Modified */}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {formatDate(item.updated_at || item.created_at)}
                  </span>

                  {/* Actions */}
                  <ActionButtons item={item} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {versionModalFile && (
        <VersionHistoryModal
          file={versionModalFile}
          onClose={() => setVersionModalFile(null)}
          onRestored={() => fetchItems(currentFolderId, searchQuery)}
        />
      )}

      {/* Move Modal */}
      {moveModalItem && (
        <MoveModal
          item={moveModalItem}
          onClose={() => setMoveModalItem(null)}
          onMoved={() => fetchItems(currentFolderId, searchQuery)}
        />
      )}
    </div>
  );
};

export default FileBrowser;
