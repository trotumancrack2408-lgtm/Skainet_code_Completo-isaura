import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Package, Clock, CheckCircle } from 'lucide-react';
import './App.css';

const API_URL = `http://${window.location.hostname}:3000`;

function ClientTracking() {
  const { orderId } = useParams();
  const [orderQuery, setOrderQuery] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      setOrderQuery(orderId);
      performSearch(orderId);
    }
  }, [orderId]);

  const performSearch = async (query) => {
    if (!query) return;
    setLoading(true);
    setError('');
    setOrderData(null);
    try {
      const resp = await fetch(`${API_URL}/client-orders`);
      const data = await resp.json();
      const found = data.find(o => 
        o.id.toLowerCase() === query.toLowerCase() || 
        o.id.slice(-6).toLowerCase() === query.toLowerCase()
      );
      
      if (found) {
        setOrderData(found);
      } else {
        setError('No se ha encontrado ninguna orden con este código.');
      }
    } catch (err) {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(orderQuery);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'var(--success)';
      case 'IN_PRODUCTION': return 'var(--warning)';
      default: return 'var(--gold)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLETED': return 'Listo para Entregar';
      case 'IN_PRODUCTION': return 'En Producción / Taller';
      default: return 'En Espera de Taller';
    }
  };

  const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';

  const handleUpdateStep = async (stepIndex) => {
    if (!isAdmin || !orderData) return;
    setLoading(true);
    let status = 'IN_PRODUCTION';
    const totalSteps = 11;
    if (stepIndex === 0) status = 'PENDING';
    if (stepIndex === totalSteps - 1) status = 'COMPLETED';

    try {
      await fetch(`${API_URL}/client-orders/${orderData.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, stepIndex })
      });
      performSearch(orderData.id);
    } catch (err) {
      alert("Error al actualizar estado");
      setLoading(false);
    }
  };

  return (
    <div className="login-screen glass-panel animate-fade-in" style={{ maxWidth: '500px', margin: '40px auto', padding: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 className="premium-title" style={{ fontSize: '1.5rem' }}>SKYNET <span className="gold-text">TRACKING</span></h1>
        <p style={{ color: 'var(--text-gray)', marginTop: '10px' }}>{isAdmin ? 'Mofidicando progreso de pieza (MODO ADMIN)' : 'Sigue el progreso de tu exclusiva pieza de joyería'}</p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
        <div className="weight-box" style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '10px' }}>
          <input 
            type="text" 
            placeholder="Introduce tu Código de Orden" 
            value={orderQuery}
            onChange={e => setOrderQuery(e.target.value)}
            style={{ 
              width: '100%', 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              textAlign: 'center',
              fontSize: '1rem',
              letterSpacing: '2px'
            }}
          />
        </div>
        <button type="submit" className="action-btn-gold" disabled={loading} style={{ width: '100%', padding: '15px' }}>
          {loading ? 'Cargando...' : <><Search size={18} style={{ marginRight: '8px' }}/> {isAdmin ? 'CARGAR ORDEN' : 'RASTREAR PIEZA'}</>}
        </button>
      </form>

      {error && (
        <p style={{ color: 'var(--danger)', textAlign: 'center', marginBottom: '20px' }}>{error}</p>
      )}

      {orderData && (
        <div className="animate-fade-in glass-panel" style={{ padding: '20px', border: `1px solid ${getStatusColor(orderData.status)}` }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Package size={40} color={getStatusColor(orderData.status)} style={{ marginBottom: '10px' }} />
            <h3 style={{ color: 'white', fontSize: '1.2rem' }}>{orderData.design}</h3>
            <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>A nombre de: <b>{orderData.clientName}</b></p>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '15px 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-gray)', display: 'block', marginBottom: '5px' }}>ESTADO ACTUAL</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {orderData.status === 'COMPLETED' ? <CheckCircle size={16} color="var(--success)"/> : <Clock size={16} color={getStatusColor(orderData.status)}/>}
                <b style={{ color: getStatusColor(orderData.status), letterSpacing: '1px' }}>
                  {getStatusText(orderData.status)}
                </b>
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
               <span style={{ fontSize: '0.7rem', color: 'var(--text-gray)', display: 'block', marginBottom: '5px' }}>PESO EST.</span>
               <b style={{ color: 'white' }}>{orderData.estimatedWeight}g</b>
            </div>
          </div>

          <div style={{ marginTop: '30px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--gold)', marginBottom: '20px', letterSpacing: '1px', textAlign: 'center' }}>{isAdmin ? 'ACTUALIZAR PROCESO DE FABRICACIÓN (TAP)' : 'PROCESO DE FABRICACIÓN'}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative', marginLeft: '10px' }}>
              {/* Línea conectora */}
              <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '5px', width: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
              
              {[
                "Diseño",
                "Impresión",
                "Casting Inicial",
                "Limpieza",
                "Pre-engaste",
                "Vulcanizado",
                "Inyección",
                "Empalme",
                "Árboles",
                "Casting Principal",
                "Pulido y Acabados"
              ].map((step, index) => {
                 let stepState = 'pending';
                 if (orderData.status === 'COMPLETED') {
                   stepState = 'completed';
                 } else {
                   const currentIndex = orderData.currentStepIndex || 0;
                   if (index < currentIndex) stepState = 'completed';
                   else if (index === currentIndex) stepState = 'active';
                   else stepState = 'pending';
                 }

                 return (
                   <div 
                     key={index} 
                     onClick={() => isAdmin ? handleUpdateStep(index) : null}
                     style={{ 
                       display: 'flex', 
                       alignItems: 'center', 
                       gap: '15px', 
                       opacity: stepState === 'pending' ? 0.4 : 1, 
                       zIndex: 1,
                       cursor: isAdmin ? 'pointer' : 'default',
                       padding: isAdmin ? '4px 0' : '0',
                       transition: 'all 0.2s',
                       transform: isAdmin && stepState !== 'active' ? 'scale(1.02) translateX(3px)' : 'none'
                     }}
                   >
                     <div style={{ 

                       width: '12px', height: '12px', borderRadius: '50%', 
                       background: stepState === 'completed' ? 'var(--success)' : stepState === 'active' ? 'var(--gold)' : '#333',
                       boxShadow: stepState === 'active' ? '0 0 10px var(--gold)' : 'none',
                       border: stepState === 'pending' ? '1px solid #555' : 'none'
                     }}></div>
                     <span style={{ 
                       fontSize: '0.85rem', 
                       color: stepState === 'completed' ? 'var(--success)' : stepState === 'active' ? 'white' : '#888',
                       fontWeight: stepState !== 'pending' ? 'bold' : 'normal'
                     }}>
                       {step}
                     </span>
                   </div>
                 )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientTracking;
