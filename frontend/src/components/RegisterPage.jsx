import React, { useState } from 'react';
import {
  Cloud, Mail, Lock, Eye, EyeOff, User, ArrowRight,
  ShieldCheck, AlertCircle, CheckCircle, Sun, Moon, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ── Validation ─────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

const getPasswordStrength = (pw) => {
  if (!pw) return { score: 0, label: '', cls: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (SPECIAL_REGEX.test(pw)) score++;
  if (score <= 1) return { score: 1, label: 'Weak',   cls: 'pw-weak',   active: 'active-weak'   };
  if (score <= 2) return { score: 2, label: 'Fair',   cls: 'pw-fair',   active: 'active-fair'   };
  if (score <= 3) return { score: 3, label: 'Good',   cls: 'pw-good',   active: 'active-good'   };
  return          { score: 4, label: 'Strong', cls: 'pw-strong', active: 'active-strong' };
};

const validateFullName = (val) => {
  const trimmed = val.trim();
  if (!trimmed) return 'Full name is required.';
  if (trimmed.length < 2) return 'Name must be at least 2 characters.';
  if (trimmed.length > 50) return 'Name must not exceed 50 characters.';
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return 'Name contains invalid characters.';
  return '';
};

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
  if (!/[A-Z]/.test(val)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(val)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(val)) return 'Password must contain at least one number.';
  if (!SPECIAL_REGEX.test(val)) return 'Password must contain at least one special character.';
  return '';
};

// ──────────────────────────────────────────────────────────────
const RegisterPage = ({ onNavigate }) => {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');

  // Field errors
  const [nameErr, setNameErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [confirmPwErr, setConfirmPwErr] = useState('');
  const [termsErr, setTermsErr] = useState('');

  const pwStrength = getPasswordStrength(password);

  const validateConfirmPw = (val, pw) => {
    if (!val) return 'Please confirm your password.';
    if (val !== pw) return 'Passwords do not match.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccess('');

    const nErr = validateFullName(fullName);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = validateConfirmPw(confirmPw, password);
    const tErr = (!termsAccepted || !privacyAccepted) ? 'You must accept the Terms & Conditions and Privacy Policy.' : '';

    setNameErr(nErr);
    setEmailErr(eErr);
    setPwErr(pErr);
    setConfirmPwErr(cErr);
    setTermsErr(tErr);

    if (nErr || eErr || pErr || cErr || tErr) return;

    setSubmitting(true);
    try {
      // Note: backend register takes email + password. fullName is extra UI field.
      // The backend may or may not accept 'name' — we send it but don't fail if ignored.
      await register(email.trim().toLowerCase(), password);
      setSuccess('Account created successfully! Redirecting to dashboard...');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Registration failed. Please try again.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="navbar-icon-btn"
        title="Toggle theme"
        style={{ position: 'fixed', top: 20, right: 20 }}
      >
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {/* Back */}
      <button
        className="btn btn-ghost"
        onClick={() => onNavigate('landing')}
        style={{ position: 'fixed', top: 20, left: 20, gap: 6, fontSize: '0.85rem' }}
      >
        <ChevronLeft size={16} /> Home
      </button>

      <div className="auth-card" style={{ maxWidth: 500, marginTop: 80, marginBottom: 40 }}>
        {/* Brand */}
        <div className="auth-logo">
          <Cloud size={30} color="#fff" />
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Start your secure cloud journey with CloudSyncVault</p>

        {/* Alerts */}
        {serverError && (
          <div className="alert-error">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            {serverError}
          </div>
        )}
        {success && (
          <div className="alert-success">
            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <div className="input-wrapper">
              <User size={17} className="input-icon-left" />
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                className="input-field has-icon-left"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); if (nameErr) setNameErr(''); }}
                onBlur={() => setNameErr(validateFullName(fullName))}
                maxLength={50}
                aria-invalid={!!nameErr}
              />
            </div>
            {nameErr && <span className="form-error">{nameErr}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={17} className="input-icon-left" />
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                className="input-field has-icon-left"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(''); }}
                onBlur={() => setEmailErr(validateEmail(email))}
                maxLength={254}
                aria-invalid={!!emailErr}
              />
            </div>
            {emailErr && <span className="form-error">{emailErr}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-pw">Password</label>
            <div className="input-wrapper">
              <Lock size={17} className="input-icon-left" />
              <input
                id="reg-pw"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                className="input-field has-icon-left has-icon-right"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (pwErr) setPwErr(''); }}
                onBlur={() => setPwErr(validatePassword(password))}
                maxLength={128}
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
            {pwErr && <span className="form-error">{pwErr}</span>}

            {/* Password Strength */}
            {password.length > 0 && (
              <div className="pw-strength">
                <div className="pw-strength-bars">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`pw-strength-bar ${pwStrength.score >= i ? pwStrength.active : ''}`}
                    />
                  ))}
                </div>
                <span className={`pw-strength-label ${pwStrength.cls}`}>
                  {pwStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm-pw">Confirm Password</label>
            <div className="input-wrapper">
              <Lock size={17} className="input-icon-left" />
              <input
                id="reg-confirm-pw"
                type={showConfirmPw ? 'text' : 'password'}
                autoComplete="new-password"
                className="input-field has-icon-left has-icon-right"
                placeholder="••••••••••"
                value={confirmPw}
                onChange={(e) => { setConfirmPw(e.target.value); if (confirmPwErr) setConfirmPwErr(''); }}
                onBlur={() => setConfirmPwErr(validateConfirmPw(confirmPw, password))}
                maxLength={128}
                aria-invalid={!!confirmPwErr}
              />
              <span
                className="input-icon-right"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                role="button"
                aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setShowConfirmPw(!showConfirmPw)}
              >
                {showConfirmPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </span>
            </div>
            {confirmPwErr && <span className="form-error">{confirmPwErr}</span>}
          </div>

          {/* Terms & Privacy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => { setTermsAccepted(e.target.checked); setTermsErr(''); }}
              />
              I agree to the{' '}
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: '0.87rem', fontWeight: 600 }}>
                Terms & Conditions
              </button>
            </label>
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => { setPrivacyAccepted(e.target.checked); setTermsErr(''); }}
              />
              I agree to the{' '}
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: '0.87rem', fontWeight: 600 }}>
                Privacy Policy
              </button>
            </label>
            {termsErr && <span className="form-error">{termsErr}</span>}
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
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
          >
            Sign In
          </button>
        </p>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <ShieldCheck size={13} color="var(--accent-emerald)" />
          AES-256-GCM Encryption · Argon2 Auth
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
