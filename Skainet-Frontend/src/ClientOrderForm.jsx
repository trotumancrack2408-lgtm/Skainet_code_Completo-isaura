import React, { useState } from 'react';
import { User, Image, Scale, CheckCircle, Mail, Phone } from 'lucide-react';
import './App.css';

const API_URL = `http://${window.location.hostname}:3000`;

function ClientOrderForm() {
  const [newOrder, setNewOrder] = useState({ clientName: '', email: '', phone: '', design: '', estimatedWeight: '' });
  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const createClientOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCreatedOrder(null);
    try {
      const resp = await fetch(`${API_URL}/client-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: newOrder.clientName,
          email: newOrder.email,
          phone: newOrder.phone,
          design: newOrder.design,
          estimatedWeight: parseFloat(newOrder.estimatedWeight)
        })
      });
      const data = await resp.json();
      setNewOrder({ clientName: '', email: '', phone: '', design: '', estimatedWeight: '' });
      setCreatedOrder(data);
    } catch (err) {
      alert("Error al registrar pedido");
    } finally {
      setLoading(false);
    }
  };

  const trackingLink = createdOrder ? `${window.location.origin}/track/${createdOrder.id.slice(-6)}` : '';

  return (
    <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="glass-panel minimalist-form animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '40px' }}>
        <header className="form-header" style={{ marginBottom: '30px' }}>
          <h2 className="gold-text" style={{ fontSize: '1.5rem', textAlign: 'center' }}>NUEVO PEDIDO</h2>
          <p style={{ textAlign: 'center', color: '#666', marginTop: '10px' }}>Registro independiente de clientes</p>
        </header>

        {createdOrder && (
          <div className="animate-fade-in" style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid var(--success)', padding: '20px', borderRadius: '8px', marginBottom: '25px', textAlign: 'center', color: 'var(--success)' }}>
            <CheckCircle size={30} style={{ margin: '0 auto 10px' }} />
            <h3 style={{ marginBottom: '10px', color: 'white' }}>¡Pedido Registrado!</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginBottom: '15px' }}>
              El código asignado es: <b style={{ color: 'var(--gold)' }}>P-{createdOrder.id.slice(-6)}</b>
            </p>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '4px', wordBreak: 'break-all', userSelect: 'all', cursor: 'pointer', marginBottom: '20px' }}>
              <a href={trackingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#4facfe', textDecoration: 'none' }}>
                {trackingLink}
              </a>
            </div>

            {createdOrder.phone && (
              <button 
                onClick={() => {
                  const msg = encodeURIComponent(`¡Hola ${createdOrder.clientName}! 💎 Tu pedido en Skynet RV ha sido registrado. Puedes seguir el progreso de tu joya en tiempo real aquí: ${trackingLink}`);
                  const phone = createdOrder.phone.replace(/\D/g, '');
                  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                }}
                className="action-btn-gold" 
                style={{ background: '#25D366', color: 'white', borderRadius: '8px' }}
              >
                <Phone size={18} /> ENVIAR POR WHATSAPP
              </button>
            )}
          </div>
        )}

        <form onSubmit={createClientOrder}>
           <div className="weights-grid-minimal" style={{ gridTemplateColumns: '1fr', gap: '20px', marginBottom: '30px' }}>
              <div className="weight-box">
                <input 
                  type="text" 
                  value={newOrder.clientName} 
                  onChange={e => setNewOrder({...newOrder, clientName: e.target.value})} 
                  placeholder="Nombre y Apellido" 
                  required 
                />
                <label><User size={12} style={{ display: 'inline', marginRight: '5px' }}/> NOMBRE CLIENTE</label>
              </div>

              <div className="weight-box">
                <input 
                  type="email" 
                  value={newOrder.email} 
                  onChange={e => setNewOrder({...newOrder, email: e.target.value})} 
                  placeholder="Email de contacto" 
                />
                <label><Mail size={12} style={{ display: 'inline', marginRight: '5px' }}/> CORREO ELECTRÓNICO</label>
              </div>

              <div className="weight-box">
                <input 
                  type="tel" 
                  value={newOrder.phone} 
                  onChange={e => setNewOrder({...newOrder, phone: e.target.value})} 
                  placeholder="+57 300..." 
                />
                <label><Phone size={12} style={{ display: 'inline', marginRight: '5px' }}/> CELULAR / WHATSAPP</label>
              </div>

              <div className="weight-box">
                <input 
                  type="text" 
                  value={newOrder.design} 
                  onChange={e => setNewOrder({...newOrder, design: e.target.value})} 
                  placeholder="Ej. Argolla Matrimonio 18k" 
                  required 
                />
                <label><Image size={12} style={{ display: 'inline', marginRight: '5px' }}/> DISEÑO / PIEZA</label>
              </div>

              <div className="weight-box">
                <input 
                  type="number" step="0.1" 
                  value={newOrder.estimatedWeight} 
                  onChange={e => setNewOrder({...newOrder, estimatedWeight: e.target.value})} 
                  placeholder="0.0 g" 
                  required 
                />
                <label><Scale size={12} style={{ display: 'inline', marginRight: '5px' }}/> PESO EST. (g)</label>
              </div>
           </div>
           
           <button type="submit" className="action-btn-gold" disabled={loading} style={{ width: '100%', padding: '15px', fontSize: '1rem' }}>
              <CheckCircle size={20} /> {loading ? 'REGISTRANDO...' : 'CONFIRMAR Y REGISTRAR'}
           </button>
        </form>
      </div>
    </div>
  );
}

export default ClientOrderForm;
