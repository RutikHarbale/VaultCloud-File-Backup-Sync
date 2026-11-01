import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import FileBrowser from './components/FileBrowser';
import TrashView from './components/TrashView';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardStats from './components/DashboardStats';
import RightSidebar from './components/RightSidebar';
import api from './services/api';

// ── Loading Screen ─────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 20,
  }}>
    <div style={{
      width: 56, height: 56, borderRadius: 14,
      background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 30px rgba(59,130,246,0.4)',
    }}>
      {/* Cloud SVG inline */}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    </div>
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>CloudSyncVault</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>Loading your secure vault...</p>
    </div>
    <div style={{
      width: 200, height: 3, borderRadius: 99,
      background: 'var(--border-color)', overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: '60%', borderRadius: 99,
        background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)',
        animation: 'loadBar 1.5s ease-in-out infinite',
      }} />
    </div>
    <style>{`
      @keyframes loadBar {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(300%); }
      }
    `}</style>
  </div>
);

// ── Dashboard Layout (authenticated) ──────────────────────────
const DashboardLayout = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('drive');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storageInfo, setStorageInfo] = useState({
    storage_used_bytes: 0,
    storage_quota_bytes: 5368709120,
    usage_percentage: 0,
  });
  const [fileCount, setFileCount] = useState(0);

  const fetchStorage = async () => {
    try {
      const res = await api.get('/storage/usage/');
      setStorageInfo(res.data);
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    fetchStorage();
  }, [refreshTrigger]);

  const handleNewFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    try {
      await api.post('/folders/', { name: folderName });
      setRefreshTrigger((prev) => prev + 1);
    } catch (e) {
      alert('Failed to create folder: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleDirectUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      try {
        await api.post('/files/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch (err) {
        alert(`Failed to upload ${files[i].name}: ` + (err.response?.data?.error || err.message));
      }
    }
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleRefresh = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <div className="app-container">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onNewFolder={handleNewFolder}
          onUpload={handleDirectUpload}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onRefresh={handleRefresh}
        />

        <main className="content-body">
          {/* Dashboard stats — only on drive tab */}
          {activeTab === 'drive' && (
            <DashboardStats
              storageInfo={storageInfo}
              fileCount={fileCount}
            />
          )}

          {/* Main content + right panel */}
          <div className="content-layout">
            <div className="content-main">
              {/* Section header */}
              <div className="section-divider" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                  {activeTab === 'drive' ? '📁 My Drive' : '🗑️ Trash / Recycled'}
                </h3>
              </div>

              {activeTab === 'drive' ? (
                <FileBrowser
                  key={refreshTrigger}
                  searchQuery={searchQuery}
                  viewMode={viewMode}
                  onRefreshStorage={() => setRefreshTrigger((prev) => prev + 1)}
                />
              ) : (
                <TrashView onRefreshStorage={() => setRefreshTrigger((prev) => prev + 1)} />
              )}
            </div>

            {/* Right Sidebar */}
            <RightSidebar refreshKey={refreshTrigger} />
          </div>
        </main>
      </div>
    </div>
  );
};

// ── App Router (simple state-based) ───────────────────────────
const AppRouter = () => {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('landing'); // 'landing' | 'login' | 'register' | 'forgot-password'

  // When user is authenticated, always show dashboard
  if (loading) return <LoadingScreen />;
  if (user) return <DashboardLayout />;

  // Public routes
  if (page === 'login') return <LoginPage onNavigate={setPage} />;
  if (page === 'register') return <RegisterPage onNavigate={setPage} />;
  return <LandingPage onNavigate={setPage} />;
};

// ── Root App ──────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}
