import React, { useState } from 'react';
import {
  Cloud, Shield, RefreshCw, Smartphone, Lock,
  ChevronRight, Sun, Moon, Menu, X,
  Upload, Download, Zap, Eye, Star
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LandingPage = ({ onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Shield size={24} />,
      iconBg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
      title: 'Secure Storage',
      desc: 'Military-grade AES-256-GCM encryption protects every file at rest and in transit. Your data is encrypted before it ever leaves your device.'
    },
    {
      icon: <RefreshCw size={24} />,
      iconBg: 'linear-gradient(135deg,#06b6d4,#0891b2)',
      title: 'Real-Time Sync',
      desc: 'Keep your files automatically updated across all devices. Changes sync instantly so you always have the latest version wherever you are.'
    },
    {
      icon: <Smartphone size={24} />,
      iconBg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
      title: 'Multi-Device Access',
      desc: 'Access your files from any device — laptop, desktop, tablet, or mobile. A unified experience across all your platforms.'
    },
    {
      icon: <Lock size={24} />,
      iconBg: 'linear-gradient(135deg,#10b981,#047857)',
      title: 'Data Privacy',
      desc: 'Self-hosted infrastructure means your data stays under your control. Zero-knowledge architecture with Argon2 authentication hashing.'
    },
  ];

  const navLinks = ['Home', 'Features', 'Security', 'How It Works', 'About'];

  return (
    <div className="landing-page">
      {/* ── Navigation ── */}
      <nav className="landing-nav">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(59,130,246,0.4)'
          }}>
            <Cloud size={22} color="#fff" />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>CloudSyncVault</span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <ul className={`landing-nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {navLinks.map(link => (
            <li key={link}>
              <button className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>
                {link}
              </button>
            </li>
          ))}
        </ul>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="navbar-icon-btn"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            className="btn btn-ghost"
            onClick={() => onNavigate('login')}
            style={{ fontSize: '0.875rem' }}
          >
            Login
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onNavigate('register')}
            style={{ fontSize: '0.875rem', padding: '9px 18px' }}
          >
            Register
          </button>

          {/* Mobile Menu Btn */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="hero-section">
        <div className="hero-content">
          {/* Left: Text */}
          <div>
            <div className="hero-badge">
              <Shield size={13} />
              AES-256-GCM End-to-End Encrypted
            </div>
            <h1 className="hero-title">
              <span className="gradient-text">CloudSyncVault</span>
              <br />
              Your Files,
              <br />
              Always With You
            </h1>
            <p className="hero-subtitle">
              A secure and private file backup and synchronization platform to store, sync,
              and access your important files from anywhere, anytime.
            </p>
            <div className="hero-cta">
              <button
                className="btn btn-primary"
                onClick={() => onNavigate('register')}
                style={{ padding: '13px 28px', fontSize: '1rem', borderRadius: 12 }}
              >
                Get Started Free
                <ChevronRight size={18} />
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => onNavigate('login')}
                style={{ padding: '13px 24px', fontSize: '1rem', borderRadius: 12 }}
              >
                <Eye size={18} />
                Watch Demo
              </button>
            </div>

            {/* Trust Badges */}
            <div style={{ display: 'flex', gap: 20, marginTop: 36, flexWrap: 'wrap' }}>
              {[
                { icon: <Shield size={14} />, text: 'AES-256 Encrypted' },
                { icon: <RefreshCw size={14} />, text: 'Real-Time Sync' },
                { icon: <Star size={14} />, text: 'Self-Hosted' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--accent-emerald)' }}>{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="hero-illustration">
            <div className="hero-cloud-graphic">
              {/* Central Cloud */}
              <div className="cloud-blob" style={{
                top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 160, height: 160, background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(139,92,246,0.2))',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: '50%',
              }}>
                <Cloud size={72} color="#3b82f6" style={{ opacity: 0.9 }} />
              </div>

              {/* Laptop */}
              <div className="cloud-blob" style={{
                top: 30, left: 30, width: 90, height: 70,
                background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(6,182,212,0.15))',
                border: '1px solid rgba(16,185,129,0.3)',
              }}>
                <Zap size={30} color="#10b981" />
              </div>

              {/* Mobile */}
              <div className="cloud-blob" style={{
                bottom: 30, right: 20, width: 80, height: 80,
                background: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(59,130,246,0.15))',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '50%',
              }}>
                <Smartphone size={34} color="#8b5cf6" />
              </div>

              {/* Upload */}
              <div className="cloud-blob" style={{
                top: 20, right: 40, width: 72, height: 72,
                background: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(6,182,212,0.15))',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: '50%',
              }}>
                <Upload size={28} color="#06b6d4" />
              </div>

              {/* Lock */}
              <div className="cloud-blob" style={{
                bottom: 50, left: 20, width: 68, height: 68,
                background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(239,68,68,0.1))',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '50%',
              }}>
                <Lock size={26} color="#f59e0b" />
              </div>

              {/* Download */}
              <div className="cloud-blob" style={{
                top: '50%', right: 0, width: 64, height: 64,
                background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(6,182,212,0.12))',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: '50%',
              }}>
                <Download size={24} color="#10b981" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="features-section">
        <div className="section-header">
          <span className="section-tag">Platform Features</span>
          <h2 className="section-title">Everything You Need for Secure Cloud Storage</h2>
          <p className="section-desc">
            Enterprise-grade security meets intuitive design. CloudSyncVault gives you
            complete control over your data.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon" style={{ background: f.iconBg }}>
                <span style={{ color: '#fff' }}>{f.icon}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        padding: '80px 5%',
        textAlign: 'center',
        background: 'linear-gradient(135deg,rgba(59,130,246,0.08) 0%,rgba(139,92,246,0.06) 100%)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>
          Ready to Secure Your Files?
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
          Join CloudSyncVault today and take back control of your data with end-to-end encryption
          and seamless multi-device synchronization.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => onNavigate('register')}
          style={{ padding: '14px 36px', fontSize: '1rem', borderRadius: 12 }}
        >
          Get Started Free
          <ChevronRight size={18} />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cloud size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>CloudSyncVault</span>
        </div>
        <p>© {new Date().getFullYear()} CloudSyncVault. Secure • Sync • Access • Anywhere</p>
      </footer>
    </div>
  );
};

export default LandingPage;
