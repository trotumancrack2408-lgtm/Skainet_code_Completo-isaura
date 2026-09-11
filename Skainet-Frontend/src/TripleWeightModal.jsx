import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle, AlertTriangle, X, ShieldCheck } from 'lucide-react';

export default function TripleWeightModal({ workOrderId, phase = 'Fundición', API_URL, token, onClose, onSuccess }) {
  const [w1, setW1] = useState('');
  const [w2, setW2] = useState('');
  const [w3, setW3] = useState('');
  const [calculatedLoss, setCalculatedLoss] = useState(null);
  const [discrepancyError, setDiscrepancyError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const fetchWeights = React.useCallback(async () => {
    try {
      const resp = await fetch(`${API_URL}/production-logs/weights/${workOrderId}`);
      if (resp.ok) {
        const data = await resp.json();
        setHistory(data);
      }
    } catch (_err) {
      console.error(_err);
    }
  }, [API_URL, workOrderId]);

  useEffect(() => {
    if (workOrderId) {
      fetchWeights();
    }
  }, [workOrderId, fetchWeights]);

  const calculateMerma = (val1, val3) => {
    const v1 = Number(val1);
    const v3 = Number(val3);
    if (v1 > 0 && v3 > 0) {
      const loss = (((v1 - v3) / v1) * 100).toFixed(2);
      setCalculatedLoss(Math.max(0, Number(loss)));
    } else {
      setCalculatedLoss(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDiscrepancyError('');

    const v1 = Number(w1);
    const v2 = Number(w2);
    const v3 = Number(w3);

    if (isNaN(v1) || isNaN(v2) || isNaN(v3) || v1 <= 0 || v2 <= 0 || v3 <= 0) {
      setDiscrepancyError('Los tres pesos deben ser valores válidos mayores a cero.');
      return;
    }

    const maxDiff = Math.max(Math.abs(v1 - v2), Math.abs(v2 - v3), Math.abs(v1 - v3));
    if (maxDiff > 0.1) {
      setDiscrepancyError('Se detectó una discrepancia entre los tres pesos (diferencia > 0.1g). Requiere cuarto pesaje o validación del Administrador.');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/production-logs/weights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          workOrderId,
          phase,
          weight1: v1,
          weight2: v2,
          weight3: v3,
        })
      });

      const data = await resp.json();
      if (resp.ok) {
        alert(data.message || 'Pesaje registrado correctamente.');
        fetchWeights();
        if (onSuccess) onSuccess();
      } else {
        setDiscrepancyError(data.message || 'Error al registrar pesaje');
      }
    } catch (err) {
      console.error(err);
      setDiscrepancyError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px' }}>
      <div style={{ backgroundColor: '#1f2937', padding: '28px', borderRadius: '16px', width: '100%', maxWidth: '520px', border: '1px solid #374151', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={24} color="#60a5fa" />
            Registro de Pesaje por Triple Factor (RF-007)
          </h3>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          )}
        </div>

        <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '20px' }}>
          Captura obligatoria de tres pesos independientes para garantizar no manipulación y cálculo exacto de mermas en la fase de <strong>{phase}</strong>.
        </p>

        {discrepancyError && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} />
            {discrepancyError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Peso 1 (g) *</label>
              <input
                type="number" step="0.01" required
                value={w1}
                onChange={(e) => { setW1(e.target.value); calculateMerma(e.target.value, w3); }}
                placeholder="0.00"
                style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff', textAlign: 'center', fontWeight: 'bold' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Peso 2 (g) *</label>
              <input
                type="number" step="0.01" required
                value={w2}
                onChange={(e) => setW2(e.target.value)}
                placeholder="0.00"
                style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff', textAlign: 'center', fontWeight: 'bold' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Peso 3 (g) *</label>
              <input
                type="number" step="0.01" required
                value={w3}
                onChange={(e) => { setW3(e.target.value); calculateMerma(w1, e.target.value); }}
                placeholder="0.00"
                style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff', textAlign: 'center', fontWeight: 'bold' }}
              />
            </div>
          </div>

          {calculatedLoss !== null && (
            <div style={{ backgroundColor: '#111827', padding: '12px', borderRadius: '8px', border: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Porcentaje de Merma Estimado:</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#60a5fa' }}>{calculatedLoss}%</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            {onClose && (
              <button type="button" onClick={onClose} style={{ padding: '10px 16px', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ShieldCheck size={18} /> {loading ? 'Guardando...' : 'Confirmar y Guardar Pesaje (Inmutable)'}
            </button>
          </div>
        </form>

        {/* Existing Weights Logs */}
        {history.length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #374151' }}>
            <h5 style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Historial de Pesajes Inmutables</h5>
            <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {history.map((h) => (
                <div key={h.id} style={{ fontSize: '0.8rem', backgroundColor: '#111827', padding: '8px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>P1: {h.weight1}g | P2: {h.weight2}g | P3: {h.weight3}g</span>
                  <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>Merma: {h.lossPercentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
