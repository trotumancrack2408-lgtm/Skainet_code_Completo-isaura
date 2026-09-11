import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert } from 'lucide-react';

export default function PasswordChangeModal({ userId, API_URL, onPasswordChanged }) {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!oldPass || !newPass || !confirmPass) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (newPass !== confirmPass) {
      setError('La nueva contraseña y la me confirmación no coinciden.');
      return;
    }

    if (newPass.length < 4) {
      setError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/users/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, oldPass, newPass }),
      });

      const data = await resp.json();
      if (resp.ok) {
        alert('¡Contraseña actualizada con éxito! Ya puedes acceder a la plataforma.');
        if (onPasswordChanged) onPasswordChanged();
      } else {
        setError(data.message || 'Error al cambiar la contraseña');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '460px',
        border: '1px solid #374151',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px', height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <KeyRound size={32} color="#3b82f6" />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Cambio Obligatorio de Contraseña</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '6px' }}>
            Por razones de seguridad (RN-013), debes personalizar tu contraseña temporal antes de continuar.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldAlert size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Contraseña Temporal Actual</label>
            <input
              type="password"
              required
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Nueva Contraseña</label>
            <input
              type="password"
              required
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Confirmar Nueva Contraseña</label>
            <input
              type="password"
              required
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '8px',
              fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
            }}
          >
            {loading ? 'Actualizando...' : 'Establecer Nueva Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
