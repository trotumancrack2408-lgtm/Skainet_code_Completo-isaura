import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, CheckCircle, ShieldAlert } from 'lucide-react';

export default function PhaseTimerWidget({ workOrderId, API_URL, token }) {
  const [phase, setPhase] = useState('diseño');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let timer = null;
    if (isRunning && !isPaused) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, isPaused]);

  const fetchPhaseLogs = React.useCallback(async () => {
    try {
      const resp = await fetch(`${API_URL}/production-logs/timer/${workOrderId}`);
      if (resp.ok) {
        const data = await resp.json();
        setLogs(data);
      }
    } catch (_err) {
      console.error(_err);
    }
  }, [API_URL, workOrderId]);

  useEffect(() => {
    if (workOrderId) {
      fetchPhaseLogs();
    }
  }, [workOrderId, fetchPhaseLogs]);

  const sendTimerAction = async (action) => {
    try {
      const resp = await fetch(`${API_URL}/production-logs/timer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          workOrderId,
          phase,
          action,
          durationSeconds: seconds,
        })
      });

      if (resp.ok) {
        fetchPhaseLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    sendTimerAction('Iniciar');
  };

  const handlePause = () => {
    setIsPaused(true);
    sendTimerAction('Pausar');
  };

  const handleResume = () => {
    setIsPaused(false);
    sendTimerAction('Reanudar');
  };

  const handleFinish = () => {
    setIsRunning(false);
    setIsPaused(false);
    sendTimerAction('Finalizar');
    setSeconds(0);
    alert(`Fase "${phase.toUpperCase()}" finalizada exitosamente. Tiempo registrado.`);
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ backgroundColor: '#111827', borderRadius: '12px', padding: '20px', border: '1px solid #374151', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="#3b82f6" /> Cronometría de Tiempos por Fase (RF-006)
        </h4>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Seleccionar Fase *</label>
          <select
            disabled={isRunning}
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            style={{ padding: '8px 12px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
          >
            <option value="diseño">Diseño</option>
            <option value="impresión">Impresión</option>
            <option value="embutido">Embutido</option>
            <option value="fundición">Fundición</option>
            <option value="pulido">Pulido</option>
            <option value="terminado">Terminado</option>
            <option value="engaste">Engaste</option>
          </select>
        </div>

        {/* Counter Display */}
        <div style={{
          fontSize: '2rem',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color: isRunning && !isPaused ? '#34d399' : isPaused ? '#fbbf24' : '#9ca3af',
          backgroundColor: '#1f2937',
          padding: '6px 20px',
          borderRadius: '8px',
          border: '1px solid #374151'
        }}>
          {formatTime(seconds)}
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isRunning && (
            <button
              onClick={handleStart}
              style={{ padding: '8px 16px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={16} /> Iniciar Cronómetro
            </button>
          )}

          {isRunning && !isPaused && (
            <button
              onClick={handlePause}
              style={{ padding: '8px 16px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Pause size={16} /> Pausar
            </button>
          )}

          {isRunning && isPaused && (
            <button
              onClick={handleResume}
              style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={16} /> Reanudar
            </button>
          )}

          {isRunning && (
            <button
              onClick={handleFinish}
              style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Square size={16} /> Finalizar Fase
            </button>
          )}
        </div>
      </div>

      {/* History Log */}
      {logs.length > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151' }}>
          <h5 style={{ fontSize: '0.85rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Historial de Registro de Tiempos</h5>
          <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {logs.map((l) => (
              <div key={l.id} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: '#d1d5db', backgroundColor: '#1f2937', padding: '6px 12px', borderRadius: '4px' }}>
                <span>Fase: <strong>{l.phase.toUpperCase()}</strong> ({l.action})</span>
                <span>Duración: {formatTime(l.durationSeconds)}</span>
                <span style={{ color: '#6b7280' }}>{new Date(l.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
