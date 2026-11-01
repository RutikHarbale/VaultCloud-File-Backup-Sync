import React, { useState } from 'react';
import {
  Cloud, Mail, Lock, Eye, EyeOff, ArrowRight,
  ShieldCheck, AlertCircle, Sun, Moon, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ── Validation helpers ─────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (val) => {
  if (!val.trim()) return 'Email is required.';
  if (val.includes(' ')) return 'Email must not contain spaces.';
  if (!EMAIL_REGEX.test(val)) return 'Enter a valid email address.';
  if (val.length > 254) return 'Email must not exceed 254 characters.';
  return '';
};

const validatePassword = (val) => {
  if (!val) return 'Password is required.';
  if (val.length < 8) return 'Password must be at least 8 characters.';
  if (val.length > 128) return 'Password must not exceed 128 characters.';
  return '';
};

// ──────────────────────────────────────────────────────────────
const LoginPage = ({ onNavigate }) => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Field-level errors
  const [emailErr, setEmailErr] = useState('');
  const [pwErr, setPwErr] = useState('');

  const handleEmailBlur = () => setEmailErr(validateEmail(email));
  const handlePwBlur = () => setPwErr(validatePassword(password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Validate all
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailErr(eErr);
    setPwErr(pErr);
    if (eErr || pErr) return;

    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
      if (rememberMe) {
        localStorage.setItem('csv_remember_email', email.trim().toLowerCase());
      } else {
        localStorage.removeItem('csv_remember_email');
      }
      // AuthContext updates user → App.jsx re-renders to dashboard automatically
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Authentication failed. Please check your credentials.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Pre-fill remembered email
  React.useEffect(() => {
    const remembered = localStorage.getItem('csv_remember_email');
    if (remembered) { setEmail(remembered); setRememberMe(true); }
    // restore dark theme attribute on mount
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <div className="auth-page">
      {/* Theme toggle top-right */}
      <button
        onClick={toggleTheme}
        className="navbar-icon-btn"
        title="Toggle theme"
        style={{ position: 'fixed', top: 20, right: 20 }}
      >
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {/* Back to landing */}
      <button
        className="btn btn-ghost"
        onClick={() => onNavigate('landing')}
        style={{ position: 'fixed', top: 20, left: 20, gap: 6, fontSize: '0.85rem' }}
      >
        <ChevronLeft size={16} /> Home
      </button>

      <div className="auth-card">
        {/* Brand */}
        <div className="auth-logo">
          <Cloud size={30} color="#fff" />
        </div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your CloudSyncVault account</p>

        {/* Server error */}
        {serverError && (
          <div className="alert-error">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={17} className="input-icon-left" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className={`input-field has-icon-left ${emailErr ? 'has-icon-right' : ''}`}
                placeholder="user@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(''); }}
                onBlur={handleEmailBlur}
                maxLength={254}
                aria-describedby="login-email-err"
                aria-invalid={!!emailErr}
              />
            </div>
            {emailErr && <span id="login-email-err" className="form-error">{emailErr}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="login-pw">Password</label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Forgot Password?
              </button>
            </div>
            <div className="input-wrapper">
              <Lock size={17} className="input-icon-left" />
              <input
                id="login-pw"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                className="input-field has-icon-left has-icon-right"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (pwErr) setPwErr(''); }}
                onBlur={handlePwBlur}
                maxLength={128}
                aria-describedby="login-pw-err"
                aria-invalid={!!pwErr}
              />
              <span
                className="input-icon-right"
                onClick={() => setShowPw(!showPw)}
                role="button"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setShowPw(!showPw)}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </span>
            </div>
            {pwErr && <span id="login-pw-err" className="form-error">{pwErr}</span>}
          </div>

          {/* Remember Me */}
          <div style={{ marginBottom: 24 }}>
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me for 30 days
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', padding: '13px', fontSize: '1rem', borderRadius: 10 }}
          >
            {submitting ? (
              <>
                <div className="spinner" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Don&apos;t have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
          >
            Create Account
          </button>
        </p>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 28, fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <ShieldCheck size={13} color="var(--accent-emerald)" />
          AES-256-GCM Encryption · Argon2 Auth
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
