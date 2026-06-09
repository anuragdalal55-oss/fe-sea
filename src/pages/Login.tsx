import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter credentials');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      toast.success('Welcome back');
      navigate('/mbl');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top left, rgba(80, 170, 255, 0.45), transparent 32%), linear-gradient(135deg, #1834d2 0%, #1229a5 45%, #09104c 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420, padding: '0 18px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'rgba(255,255,255,0.18)',
              marginBottom: 14,
              fontSize: 30,
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 18px 50px rgba(0,0,0,0.18)',
            }}
          >
            S
          </div>
          <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 800, letterSpacing: -0.6 }}>EDISS SEA</h1>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, marginTop: 4 }}>
            Shared login, separate sea database, one-page MBL and HBL workflow
          </p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>Sign In</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username <span className="required">*</span></label>
              <input
                className="form-control"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  style={{ paddingRight: 72 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    padding: 0,
                    lineHeight: 1,
                    fontWeight: 700,
                  }}
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }}></span> Signing in...</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.64)', fontSize: 12, marginTop: 16 }}>
          Sea operations console for separate MBL and HBL processing
        </p>
      </div>
    </div>
  );
};

export default Login;
