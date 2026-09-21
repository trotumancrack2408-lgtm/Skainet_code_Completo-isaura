import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { UserCircle, Power, Clock, CheckCircle, PauseCircle, Lock, Bell, TrendingUp, TrendingDown, FileSpreadsheet, Activity, Wrench, ShieldAlert, Award, Filter, Download } from 'lucide-react';
import UserManagementPanel from './UserManagementPanel';
import PasswordChangeModal from './PasswordChangeModal';
import InventoryPanel from './InventoryPanel';
import PhaseTimerWidget from './PhaseTimerWidget';
import TripleWeightModal from './TripleWeightModal';
import GlobalSearchHeader from './GlobalSearchHeader';

const API_URL = `http://${window.location.hostname}:3000`;

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('skainet_session') || 'null'); }
    catch { localStorage.removeItem('skainet_session'); return null; }
  });
  // El intervalo de actualización no debe conservar el usuario de una sesión anterior.
  const currentUserRef = useRef(currentUser);
  const [allUsers, setAllUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [clientOrders, setClientOrders] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [newBatch, setNewBatch] = useState({ entryWeight: '', exitWeight: '', itemsCount: '', productTypeId: '' });
  const [newOrder, setNewOrder] = useState({ clientName: '', design: '', estimatedWeight: '' });
  const [despacho, setDespacho] = useState({ productionItemId: '', receiverId: '', executorId: '', providedPin: '', weights: { anillo: '', plastilina: '', bolsa: '' } });
  const [devolucion, setDevolucion] = useState({ orderId: '', providedPin: '', weights: { anillo: '', plastilina: '', bolsa: '' }, explanation: '' });
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ totalLoss: 0, ranking: [], incidentCount: 0, totalProduced: 0, activeWork: 0 });
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [vaultSearch, setVaultSearch] = useState('');
  const [expandedVaultBatch, setExpandedVaultBatch] = useState(null);
  const [expandedDispatchBatch, setExpandedDispatchBatch] = useState(null);
  
  // Estados para recuperación de contraseña
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryQuestions, setRecoveryQuestions] = useState([]);
  const [recoveryAnswers, setRecoveryAnswers] = useState(['', '', '']);
  const [recoveredPassword, setRecoveredPassword] = useState('');
  
  // Administrative reports and view control states
  const [adminTab, setAdminTab] = useState('control');
  const [filterJeweler, setFilterJeweler] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Cargar usuarios al inicio
  useEffect(() => {
    currentUserRef.current = currentUser;
    if (currentUser) localStorage.setItem('skainet_session', JSON.stringify(currentUser));
    else localStorage.removeItem('skainet_session');
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
    fetchBatches();
    fetchClientOrders();
    fetchAlerts();
    fetchStats();
    fetchMachines();
    fetchPendingItems();
    fetchProductTypes();
    fetchActiveOrders();
    const interval = setInterval(() => {
      fetchUsers();
      fetchBatches();
      fetchClientOrders();
      fetchAlerts();
      fetchStats();
      fetchMachines();
      fetchPendingItems();
      fetchActiveOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchClientOrders = async () => {
    try {
      const resp = await fetch(`${API_URL}/client-orders`);
      const data = await resp.json();
      setClientOrders(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error(err);
      setClientOrders([]);
    }
  };

  const fetchAlerts = async () => {
    try {
      const resp = await fetch(`${API_URL}/alerts`);
      const data = await resp.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error(err);
      setAlerts([]);
    }
  };

  const fetchStats = async () => {
    try {
      const resp = await fetch(`${API_URL}/stats`);
      const data = await resp.json();
      setStats(data);
    } catch (err) { console.error(err); }
  };

  const fetchMachines = async () => {
    try {
      const resp = await fetch(`${API_URL}/machines`);
      const data = await resp.json();
      setMachines(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const reportMachineIssue = async (id) => {
    const issue = prompt("Describa el fallo técnico de la máquina:");
    if (!issue) return;
    try {
      await fetch(`${API_URL}/machines/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue })
      });
      fetchMachines();
      fetchAlerts();
      alert("Falla técnica reportada al Vigilante Digital.");
    } catch (err) { console.error(err); }
  };

  const fixMachine = async (id) => {
    try {
      await fetch(`${API_URL}/machines/${id}/fix`, { method: 'PATCH' });
      fetchMachines();
      alert("Mantenimiento registrado. Maquinaria operativa.");
    } catch (err) { console.error(err); }
  };

  const fetchPendingItems = async () => {
    try {
      const resp = await fetch(`${API_URL}/batches/pending-items`);
      const data = await resp.json();
      setPendingItems(data);
    } catch (err) { console.error(err); }
  };

  const fetchProductTypes = async () => {
    try {
      const resp = await fetch(`${API_URL}/batches/product-types`);
      const data = await resp.json();
      setProductTypes(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const fetchActiveOrders = async () => {
    try {
      const resp = await fetch(`${API_URL}/orders`);
      const data = await resp.json();
      setActiveOrders(data);
    } catch (err) { console.error(err); }
  };

  const fetchBatches = async () => {
    try {
      const resp = await fetch(`${API_URL}/batches`);
      const data = await resp.json();
      setBatches(data);
    } catch (err) {
      console.error("Error fetching batches", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const resp = await fetch(`${API_URL}/users`);
      const data = await resp.json();
      setAllUsers(data);
      // Actualizar el estado del usuario logueado si existe sin perder el access_token
      const activeUser = currentUserRef.current;
      if (activeUser) {
        const updated = data.find(u => u.id === activeUser.id);
        if (!updated || updated.accountStatus === 'Inactivo' || updated.accountStatus === 'INACTIVE') {
          // La cuenta fue desactivada por un administrador: retirar la sesión local
          // sin esperar a que el usuario haga otra acción.
          localStorage.removeItem('skainet_session');
          currentUserRef.current = null;
          setCurrentUser(null);
          setSelectedUser(null);
          setPassword('');
          return;
        }
        if (updated) {
          setCurrentUser(prev => ({ ...prev, ...updated, access_token: prev?.access_token }));
        }
      }
    } catch (err) {
      console.error("Error fetching users", err);
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!selectedUser || !password) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, password })
      });
      if (resp.ok) {
        const user = await resp.json();
        setCurrentUser(user);
        setSelectedUser(null);
        setPassword('');
      } else {
        alert("Contraseña incorrecta");
      }
    } catch (err) {
      alert("Error en la conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('skainet_session');
    currentUserRef.current = null;
    setCurrentUser(null);
    setSelectedUser(null);
    setPassword('');
    setAdminTab('control');
    setDespacho({ productionItemId: '', receiverId: '', executorId: '', providedPin: '', weights: { anillo: '', plastilina: '', bolsa: '' } });
    setDevolucion({ orderId: '', providedPin: '', weights: { anillo: '', plastilina: '', bolsa: '' }, explanation: '' });
  };

  const startRecovery = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/users/${selectedUser.id}/recovery-questions`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.securityQuestions && data.securityQuestions.length >= 3) {
          setRecoveryQuestions(data.securityQuestions);
          setRecoveryAnswers(['', '', '']);
          setIsRecovering(true);
        } else {
          alert("⚠️ Este usuario no tiene preguntas de seguridad configuradas. Por favor, solicita al Administrador que restablezca tu contraseña.");
        }
      } else {
        alert("Error al cargar los datos del perfil");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/users/${selectedUser.id}/recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: recoveryAnswers })
      });
      if (resp.ok) {
        const data = await resp.json();
        setRecoveredPassword(data.tempPassword);
      } else {
        const errData = await resp.json();
        alert(`❌ ${errData.message || 'Respuestas incorrectas'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/users/${currentUser.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(currentUser.access_token ? { 'Authorization': `Bearer ${currentUser.access_token}` } : {})
        },
        body: JSON.stringify({ status })
      });
      const data = await resp.json();
      if (resp.ok) {
        setCurrentUser(prev => ({ 
          ...prev, 
          ...data, 
          status: data.status || status, 
          access_token: prev?.access_token 
        }));
        fetchUsers();
      } else {
        alert(`Error al actualizar estado: ${data.message || 'Sin autorización'}`);
      }
    } catch (err) {
      alert("Error al actualizar estado");
    } finally {
      setLoading(false);
    }
  };

  const executeDespacho = async (e) => {
    e.preventDefault();
    let currentDespacho = { ...despacho };
    if (currentUser.role !== 'Administrador') {
      currentDespacho.executorId = currentUser.id;
      currentDespacho.receiverId = currentUser.id;
    }

    if (!currentDespacho.productionItemId || !currentDespacho.executorId) return alert("Selecciona una pieza y joyero");
    setLoading(true);
    
    // Convertir pesos a números antes de enviar
    const formattedDespacho = {
      ...currentDespacho,
      weights: {
        anillo: Number(currentDespacho.weights.anillo),
        plastilina: Number(currentDespacho.weights.plastilina),
        bolsa: Number(currentDespacho.weights.bolsa)
      }
    };

    try {
      const resp = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedDespacho)
      });
      if (!resp.ok) {
         const errData = await resp.json();
         throw new Error(errData.message || "Clave secreta incorrecta o error en el despacho");
      }
      await resp.json();
      setDespacho({ productionItemId: '', receiverId: '', executorId: '', providedPin: '', weights: { anillo: '', plastilina: '', bolsa: '' } });
      fetchUsers();
      fetchPendingItems();
      fetchActiveOrders();
      alert("Material entregado. El cronómetro ha iniciado.");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDespachoTotal = () => {
    return (parseFloat(despacho.weights.anillo) || 0) + 
           (parseFloat(despacho.weights.plastilina) || 0) + 
           (parseFloat(despacho.weights.bolsa) || 0);
  };

  const createClientOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      await resp.json();
      setNewOrder({ clientName: '', email: '', phone: '', design: '', estimatedWeight: '' });
      fetchClientOrders();
      alert("Pedido registrado con éxito.");
    } catch (err) {
      alert("Error al registrar pedido");
    } finally {
      setLoading(false);
    }
  };

  const createBatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryWeight: parseFloat(newBatch.entryWeight),
          exitWeight: parseFloat(newBatch.exitWeight),
          itemsCount: parseInt(newBatch.itemsCount),
          productTypeId: newBatch.productTypeId
        })
      });
      await resp.json();
      setNewBatch({ entryWeight: '', exitWeight: '', itemsCount: '', productTypeId: '' });
      fetchBatches();
      alert("Lote creado y piezas generadas correctamente.");
    } catch (err) {
      alert("Error al crear lote");
    } finally {
      setLoading(false);
    }
  };

  const executeDevolucion = async (e) => {
    e.preventDefault();
    if (!devolucion.orderId) return alert("Seleccione una orden");
    
    // Validar si es anomalía y requiere explicación
    const order = activeOrders.find(o => o.id === devolucion.orderId);
    const finalTotal = Number(devolucion.weights.anillo) + Number(devolucion.weights.plastilina) + Number(devolucion.weights.bolsa);
    const loss = order.totalWeight - finalTotal;
    
    if (loss > 0.05 && !devolucion.explanation) {
      return alert("Debe ingresar una explicación para la anomalía de peso detectada.");
    }

    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/orders/${devolucion.orderId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          weights: {
            anillo: Number(devolucion.weights.anillo),
            plastilina: Number(devolucion.weights.plastilina),
            bolsa: Number(devolucion.weights.bolsa)
          },
          explanation: devolucion.explanation,
          providedPin: devolucion.providedPin
        })
      });
      if (!resp.ok) {
         const errData = await resp.json();
         throw new Error(errData.message || "Error al cerrar orden o clave incorrecta");
      }
      const resultData = await resp.json();
      setDevolucion({ orderId: '', providedPin: '', weights: { anillo: '', plastilina: '', bolsa: '' }, explanation: '' });
      fetchUsers();
      fetchActiveOrders();
      fetchBatches(); // Refrescar anillos PENDING
      
      if (resultData.newGeneratedPin && canAuthorizeCustody) {
         alert(`✅ Cierre Blindado Exitoso.\n\nLa pieza ha sido pesada y devuelta a custodia.\nEl NUEVO PIN SECRETO para el siguiente joyero (o paso) es: ${resultData.newGeneratedPin}\n\nEntrégale físicamente la pieza y dile este código para que la asuma en su mesa.`);
      } else if (resultData.newGeneratedPin) {
         alert("✅ Cierre exitoso. La pieza fue devuelta a custodia; el Joyero Líder entregará la próxima clave de autorización.");
      } else {
         alert("✅ Cierre Blindado Exitoso.");
      }
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (!currentUser) {
    const isLeaderJeweler = (user) =>
      user.role === 'Lider de Taller' || user.position === 'Joyero Líder' || user.position === 'Joyero Lider';
    const isWorkshopUser = (user) => user.role === 'Joyero' || isLeaderJeweler(user);
    const isCentralAdmin = (user) => user.role === 'Administrador' || user.role === 'Super Administrador' || user.role === 'Dueno';
    return (
      <div className="login-screen glass-panel animate-fade-in" style={{ maxWidth: '400px', margin: '80px auto' }}>
        <h2 className="gold-text" style={{ textAlign: 'center', marginBottom: '30px' }}>IDENTIFICACIÓN SKYNET</h2>
        
        {!selectedUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p style={{ color: '#888', textAlign: 'center', fontSize: '0.9rem', marginBottom: '10px' }}>Seleccione su perfil de acceso</p>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--gold)', fontSize: '0.7rem', letterSpacing: '1px', marginBottom: '10px' }}>EQUIPO DE TALLER</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...allUsers].filter(user => user.accountStatus === 'Activo' && isWorkshopUser(user)).sort((a, b) => {
                  const leaderOrder = Number(isLeaderJeweler(b)) - Number(isLeaderJeweler(a));
                  return leaderOrder || a.name.localeCompare(b.name, 'es');
                }).map(user => {
                  const leader = isLeaderJeweler(user);
                  return (
                  <button key={user.id} className="premium-btn" onClick={() => setSelectedUser(user)} style={leader ? {
                    background: 'linear-gradient(135deg, #0f766e, #155e75)',
                    borderColor: '#2dd4bf', color: '#ecfeff',
                    boxShadow: '0 0 18px rgba(45, 212, 191, 0.22)'
                  } : undefined}>
                    <UserCircle size={18} /> {leader ? `★ JOYERO LÍDER · ${user.name}` : user.name}
                    {user.position && !leader && <small style={{ marginLeft: '8px', opacity: 0.72, fontSize: '0.62rem' }}>· {user.position.toUpperCase()}</small>}
                  </button>
                )})}
              </div>
            </div>

            <div style={{ borderTop: '0.5px solid #333', margin: '10px 0' }}></div>
            
            <h4 style={{ color: '#666', fontSize: '0.7rem', letterSpacing: '1px', marginBottom: '10px' }}>ADMINISTRACIÓN CENTRAL</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allUsers.filter(user => user.accountStatus === 'Activo' && isCentralAdmin(user)).map(user => (
                <button 
                  key={user.id} 
                  className="premium-btn" 
                  style={{ 
                    background: user.name === 'Viralsquad' ? '#1a1a1a' : '#222', 
                    color: 'white', 
                    borderColor: user.name === 'Viralsquad' ? 'var(--gold)' : '#333' 
                  }} 
                  onClick={() => setSelectedUser(user)}
                >
                  {user.role === 'Super Administrador' || user.role === 'Dueno' ? `PANEL SUPERIOR (${user.name})` : `ADMINISTRADORA (${user.name})`}
                </button>
              ))}
            </div>
          </div>
        ) : isRecovering ? (
          <div className="animate-fade-in">
             <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <UserCircle size={60} className="gold-text" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ color: 'white' }}>{selectedUser.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--gold)', letterSpacing: '1px' }}>RECUPERACIÓN DE CLAVE</p>
             </div>
             
             {recoveredPassword ? (
               <div style={{ textAlign: 'center', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid var(--success)', padding: '20px', borderRadius: '8px', marginBottom: '10px' }}>
                 <p style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px' }}>✅ VERIFICACIÓN EXITOSA</p>
                 <p style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: '15px' }}>Tu nueva contraseña temporal es:</p>
                 <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '4px', fontSize: '1.5rem', fontWeight: 'bold', color: 'white', letterSpacing: '2px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
                   {recoveredPassword}
                 </div>
                 <button 
                   onClick={() => {
                     setPassword(recoveredPassword);
                     setIsRecovering(false);
                     setRecoveredPassword('');
                     setRecoveryAnswers(['', '', '']);
                   }}
                   className="action-btn-gold" 
                   style={{ width: '100%', padding: '15px', background: 'var(--success)', color: 'white' }}
                 >
                   INICIAR SESIÓN CON ESTA CLAVE
                 </button>
               </div>
             ) : (
               <form onSubmit={handleRecoveryVerify} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                 {recoveryQuestions.map((q, idx) => (
                   <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                     <label style={{ fontSize: '0.75rem', color: 'var(--gold)', textAlign: 'left', fontWeight: 'bold' }}>
                       PREGUNTA {idx + 1}: {q.question}
                     </label>
                     <input 
                       type="text" 
                       placeholder="Tu respuesta..." 
                       value={recoveryAnswers[idx]}
                       onChange={e => {
                         const copy = [...recoveryAnswers];
                         copy[idx] = e.target.value;
                         setRecoveryAnswers(copy);
                       }}
                       required
                       style={{ 
                         width: '100%', 
                         background: 'rgba(0,0,0,0.5)', 
                         border: '1px solid #333', 
                         color: 'white', 
                         padding: '10px 15px',
                         borderRadius: '6px',
                         fontSize: '0.9rem',
                         outline: 'none'
                       }}
                     />
                   </div>
                 ))}
                 
                 <button type="submit" className="action-btn-gold" disabled={loading} style={{ width: '100%', padding: '15px', marginTop: '10px' }}>
                   {loading ? 'Validando...' : 'VERIFICAR RESPUESTAS'}
                 </button>
                 
                 <button 
                   type="button" 
                   onClick={() => { 
                     setIsRecovering(false); 
                     setRecoveryAnswers(['', '', '']);
                   }} 
                   style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.8rem', cursor: 'pointer', marginTop: '10px' }}
                 >
                   Volver a pantalla de contraseña
                 </button>
               </form>
             )}
          </div>
        ) : (
          <div className="animate-fade-in">
             <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <UserCircle size={60} className="gold-text" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ color: 'white' }}>{selectedUser.name}</h3>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>{selectedUser.role}</p>
             </div>
             
             <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="weight-box" style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '10px' }}>
                  <input 
                    type="password" 
                    placeholder="Contraseña" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoFocus
                    required
                    style={{ 
                      width: '100%', 
                      background: 'none', 
                      border: 'none', 
                      color: 'white', 
                      textAlign: 'center',
                      fontSize: '1.2rem',
                      letterSpacing: '4px'
                    }}
                  />
                </div>
                
                <button type="submit" className="action-btn-gold" disabled={loading} style={{ width: '100%', padding: '15px' }}>
                  {loading ? 'Validando...' : 'INCIAR SESIÓN'}
                </button>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                  <button type="button" onClick={() => { setSelectedUser(null); setPassword(''); }} style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.8rem', cursor: 'pointer' }}>
                    Volver a perfiles
                  </button>
                  <button type="button" onClick={startRecovery} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer' }}>
                    Olvidé mi contraseña
                  </button>
                </div>
             </form>
          </div>
        )}
      </div>
    );
  }

  // Reporting calculations, dynamic filters, and CSV export functions
  const filteredClosedOrders = activeOrders.filter(o => o.status === 'CLOSED').filter(o => {
    if (filterJeweler !== 'all' && o.executorId !== filterJeweler) return false;
    if (filterDate !== 'all') {
      const orderTime = new Date(o.startTime).getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      if (filterDate === 'today' && (Date.now() - orderTime) > oneDay) return false;
      if (filterDate === 'week' && (Date.now() - orderTime) > 7 * oneDay) return false;
    }
    return true;
  });

  const totalLossVal = Number(filteredClosedOrders.reduce((sum, o) => sum + (o.loss || 0), 0).toFixed(3));
  const totalProducedVal = filteredClosedOrders.length;
  const avgTimeVal = totalProducedVal > 0 
    ? Math.round(filteredClosedOrders.reduce((sum, o) => sum + (o.durationMinutes || 0), 0) / totalProducedVal) 
    : 0;

  const totalInitWeight = filteredClosedOrders.reduce((sum, o) => sum + (o.totalWeight || 0), 0);
  const totalFinalWeightVal = filteredClosedOrders.reduce((sum, o) => sum + (o.finalTotalWeight || 0), 0);
  const efficiencyVal = totalInitWeight > 0 
    ? Number(((totalFinalWeightVal / totalInitWeight) * 100).toFixed(1)) 
    : 100.0;
  
  const anomalyCount = filteredClosedOrders.filter(o => o.isAnomaly).length;

  const exportOperations = () => {
    const closed = activeOrders.filter(o => o.status === 'CLOSED');
    if (closed.length === 0) {
      alert("No hay operaciones cerradas para exportar.");
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID Orden,Joyero,Pieza,Fecha Inicio,Fecha Fin,Duracion (Min),Peso Inicial (g),Peso Final (g),Merma (g),Anomalia,Explicacion\r\n";
    closed.forEach(o => {
      const jeweler = allUsers.find(u => u.id === o.executorId)?.name || 'Desconocido';
      const row = [
        o.id,
        jeweler,
        `"${o.productionItemName}"`,
        new Date(o.startTime).toLocaleString(),
        new Date(o.endTime).toLocaleString(),
        o.durationMinutes || 0,
        o.totalWeight,
        o.finalTotalWeight || 0,
        o.loss || 0,
        o.isAnomaly ? 'SI' : 'NO',
        `"${o.explanation || ''}"`
      ].join(",");
      csvContent += row + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bitacora_operaciones_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAttendance = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Joyero,Rol,Estado,Fecha y Hora Registro\r\n";
    const jewelers = allUsers.filter(u => u.role === 'Joyero');
    let hasRecords = false;
    jewelers.forEach(u => {
      if (u.history && u.history.length > 0) {
        hasRecords = true;
        u.history.forEach(h => {
          const row = [
            u.name,
            u.role,
            h.status,
            new Date(h.timestamp).toLocaleString()
          ].join(",");
          csvContent += row + "\r\n";
        });
      }
    });
    if (!hasRecords) {
      alert("No hay registros de asistencia para exportar hoy.");
      return;
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bitacora_asistencia_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    window.print();
  };

  const canManageBatches = currentUser.role === 'Administrador' || currentUser.role === 'Super Administrador' || currentUser.role === 'Dueno';
  const isJewelerLeader = currentUser.role === 'Lider de Taller' || currentUser.position === 'Joyero Líder';
  const canAuthorizeCustody = canManageBatches || isJewelerLeader;
  const canDispatch = true; // Todos pueden despachar material siguiendo tu lógica
  const custodyBatches = batches
    .map(batch => {
      const items = batch.items || [];
      const available = items.filter(item => item.status === 'PENDING');
      const term = vaultSearch.trim().toLowerCase();
      const matches = !term || batch.id.toLowerCase().includes(term) || items.some(item =>
        item.name.toLowerCase().includes(term) || item.productType?.name?.toLowerCase().includes(term));
      return { ...batch, items, available, matches };
    })
    .filter(batch => batch.available.length > 0 && batch.matches)
    .sort((a, b) => b.available.length - a.available.length || new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="app-container">
      {currentUser?.mustChangePassword && (
        <PasswordChangeModal
          userId={currentUser.id}
          API_URL={API_URL}
          onPasswordChanged={() => {
            setCurrentUser(prev => ({ ...prev, mustChangePassword: false }));
            fetchUsers();
          }}
        />
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="premium-title">SKYNET <span className="gold-text">WORKSHOP</span></h1>
          <p style={{ color: 'var(--text-gray)' }}>Sesión: {currentUser.name} ({currentUser.role})</p>
        </div>

        <GlobalSearchHeader API_URL={API_URL} token={currentUser?.access_token} currentUser={currentUser} />

        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontWeight: 'bold' }}>
          Cerrar Sesión
        </button>
      </header>

      {canManageBatches && (
        <div className="admin-tabs animate-fade-in">
          <button 
            className={`tab-button ${adminTab === 'control' ? 'tab-active' : ''}`} 
            onClick={() => setAdminTab('control')}
          >
            🎛️ Control Operativo
          </button>
          <button 
            className={`tab-button ${adminTab === 'inventory' ? 'tab-active' : ''}`} 
            onClick={() => setAdminTab('inventory')}
          >
            📦 Inventario (RF-004)
          </button>
          <button 
            className={`tab-button ${adminTab === 'reports' ? 'tab-active' : ''}`} 
            onClick={() => setAdminTab('reports')}
          >
            📊 Reportes Avanzados
          </button>
          <button 
            className={`tab-button ${adminTab === 'hardware' ? 'tab-active' : ''}`} 
            onClick={() => setAdminTab('hardware')}
          >
            🏭 Monitoreo de Planta
          </button>
          <button 
            className={`tab-button ${adminTab === 'users' ? 'tab-active' : ''}`} 
            onClick={() => setAdminTab('users')}
          >
            👤 Personal (RF-001)
          </button>
        </div>
      )}

      {currentUser?.role === 'Joyero' && (
        <div className="admin-tabs animate-fade-in" style={{ marginBottom: '20px' }}>
          <button 
            className={`tab-button ${adminTab === 'control' ? 'tab-active' : ''}`} 
            onClick={() => setAdminTab('control')}
          >
            🔨 Mi Mesa de Trabajo
          </button>
          <button 
            className={`tab-button ${adminTab === 'inventory' ? 'tab-active' : ''}`} 
            onClick={() => setAdminTab('inventory')}
          >
            📦 Catálogo de Materiales & Kardex
          </button>
        </div>
      )}

      <main className="main-grid" style={adminTab !== 'control' ? { display: 'block', gridTemplateColumns: 'none' } : {}}>
        {/* Lado Izquierdo: Control de Servicio, Info y ALERTAS */}
        {adminTab === 'control' && (
          <div className="glass-panel">
          {canManageBatches && alerts.length > 0 && (
            <div className="animate-fade-in" style={{ marginBottom: '30px', padding: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '12px' }}>
              <h3 style={{ color: 'var(--danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <Bell size={16} /> VIGILANTE DIGITAL: ALERTAS CRÍTICAS
              </h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {alerts.map(alt => (
                  <div key={alt.id} style={{ fontSize: '0.75rem', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: alt.severity === 'CRITICAL' ? '3px solid var(--danger)' : '3px solid var(--warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <b style={{ color: alt.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)' }}>{alt.type}</b>
                      <span style={{ opacity: 0.5 }}>{new Date(alt.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p>{alt.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {canManageBatches ? (
            <div>
              <h3 className="gold-text">Configuración Workshop</h3>
              <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '10px', marginBottom: '30px' }}>
                Panel de control para la gestión de mermas y tiempos.
              </p>

              <div style={{ marginBottom: '40px' }}>
                <button 
                  onClick={() => window.open('/new-order', '_blank')} 
                  className="action-btn-gold" 
                  style={{ width: '100%', padding: '15px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  <UserCircle size={20} /> AGREGAR PEDIDO NUEVO
                </button>
              </div>

              <div style={{ marginTop: '20px' }}>
                <h4 style={{ fontSize: '0.7rem', color: '#444', marginBottom: '15px', letterSpacing: '1px' }}>PEDIDOS EN ESPERA</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                  {clientOrders.filter(o => o.status === 'PENDING').map(o => (
                    <div 
                       key={o.id} 
                       className="glass-panel hover-glow" 
                       onClick={() => window.open(`/track/${o.id.slice(-6)}?admin=true`, '_blank')}
                       style={{ padding: '12px', border: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                       title="Abrir Visión de Cliente"
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--gold)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.clientName}
                        </h5>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                           {o.design} <span style={{ opacity: 0.5 }}>—</span> {o.estimatedWeight}g
                        </p>
                      </div>
                      <div style={{ paddingLeft: '10px' }}>
                        <span style={{ background: 'rgba(212,175,55,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.2)', whiteSpace: 'nowrap' }}>
                          P-{o.id.slice(-6)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {clientOrders.filter(o => o.status === 'PENDING').length === 0 && (
                     <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#666', padding: '10px' }}>No hay pedidos pendientes.</p>
                  )}
                </div>
              </div>

              {/* ADMIN CAN UPDATE CLIENT ORDERS TOO */}
              <JoyeroOrderControl clientOrders={clientOrders} fetchClientOrders={fetchClientOrders} API_URL={API_URL} loading={loading} setLoading={setLoading} canCreateOrders={canManageBatches || isJewelerLeader} />
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h3 className="gold-text">Tu Estado Actual</h3>
              <div style={{ margin: '30px 0' }}>
                <span className={`status-badge status-${currentUser.status === 'Fuera de Turno' ? 'offline' : currentUser.status === 'Disponible' ? 'available' : 'working'}`}>
                  {currentUser.status}
                </span>
              </div>
              
              {currentUser.status === 'Fuera de Turno' ? (
                <button className="premium-btn" onClick={() => updateStatus('Disponible')} disabled={loading} style={{ width: '100%' }}>
                  <Power size={20} /> ENTRAR EN SERVICIO
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="premium-btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={() => updateStatus('Fuera de Turno')} disabled={loading}>
                     SALIR DE TURNO
                  </button>
                  <button className="premium-btn" style={{ background: 'var(--warning)', color: 'white' }} onClick={() => updateStatus('En Pausa')} disabled={loading}>
                     EN PAUSA
                  </button>
                </div>
              )}

              <JoyeroOrderControl clientOrders={clientOrders} fetchClientOrders={fetchClientOrders} API_URL={API_URL} loading={loading} setLoading={setLoading} canCreateOrders={canManageBatches || isJewelerLeader} />
            </div>
          )}
        </div>
        )}

        {/* Lado Derecho: Registro de Lotes (SOLO ADMIN) y Despacho (TODOS) */}
        {adminTab === 'control' && (
          <div className="glass-panel">
          {canManageBatches && (
            <>
              <div className="animate-fade-in" style={{ marginBottom: '40px' }}>
                <h2 className="gold-text" style={{ fontSize: '1rem', letterSpacing: '2px', marginBottom: '20px' }}>📊 ANALÍTICA SKYNET (Toma de Decisiones)</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
                  <div className="glass-panel" style={{ padding: '15px', textAlign: 'center', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                    <p style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '5px' }}>MERMA TOTAL</p>
                    <h3 className="gold-text">{stats.totalLoss}g</h3>
                  </div>
                  <div className="glass-panel" style={{ padding: '15px', textAlign: 'center', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                    <p style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '5px' }}>REPORTADAS</p>
                    <h3 style={{ color: stats.incidentCount > 0 ? 'var(--danger)' : 'white' }}>{stats.incidentCount}</h3>
                  </div>
                  <div className="glass-panel" style={{ padding: '15px', textAlign: 'center', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                    <p style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '5px' }}>TERMINADAS</p>
                    <h3>{stats.totalProduced} piezas</h3>
                  </div>
                  <div className="glass-panel" style={{ padding: '15px', textAlign: 'center', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                    <p style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '5px' }}>EN MESA</p>
                    <h3 style={{ color: 'var(--success)' }}>{stats.activeWork}</h3>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '20px' }}>TOP PRODUCTIVIDAD (Promedio min/pieza)</h4>
                    {stats.ranking?.map((entry, idx) => (
                      <div key={idx} style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                          <span>{entry.name}</span>
                          <span className="gold-text">{entry.avgMinutes} min</span>
                        </div>
                        <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'var(--gold)', width: `${Math.min(100, (300 / (entry.avgMinutes || 1)) * 10)}%` }}></div>
                        </div>
                        <p style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '3px' }}>{entry.completedCount} piezas completadas</p>
                      </div>
                    ))}
                  </div>

                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '20px' }}>RENTABILIDAD TRABAJO</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ padding: '10px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.65rem', marginBottom: '5px' }}>Eficiencia Taller</p>
                        <b style={{ fontSize: '1.2rem', color: 'var(--success)' }}>98.2%</b>
                      </div>
                      <div style={{ padding: '10px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.65rem', marginBottom: '5px' }}>Consumo de Tiempo Est.</p>
                        <b>{Math.floor(stats.totalProduced * 45)} min tot.</b>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '0.5px solid rgba(212, 175, 55, 0.2)', margin: '40px 0' }}></div>
              </div>

              {/* 
              <div className="animate-fade-in" style={{ marginBottom: '60px' }}>
                <h2 className="gold-text" style={{ fontSize: '1rem', letterSpacing: '2px', marginBottom: '20px' }}>🏭 ESTADO DE LA PLANTA (Hardware)</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {machines.map(m => (
                    <div key={m.id} className="glass-panel" style={{ padding: '20px', border: m.status === 'DOWN' ? '1px solid var(--danger)' : '1px solid rgba(212, 175, 55, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                       <span style={{ fontWeight: 'bold' }}>{m.name}</span>
                       <span className={`status-badge status-${m.status === 'OPERATIONAL' ? 'available' : m.status === 'MAINTENANCE' ? 'paused' : 'offline'}`}>
                         {m.status}
                       </span>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '5px' }}>
                        <span>Vida Útil Lente/Filtro</span>
                        <span>{m.cycles} / {m.maintenanceThreshold} ciclos</span>
                      </div>
                      <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--gold)', width: `${(m.cycles / m.maintenanceThreshold) * 100}%` }}></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      {m.status === 'OPERATIONAL' ? (
                        <button onClick={() => reportMachineIssue(m.id)} style={{ padding: '5px 10px', fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '4px', cursor: 'pointer' }}>
                          REPORTAR FALLO
                        </button>
                      ) : (
                        <button onClick={() => fixMachine(m.id)} style={{ padding: '5px 10px', fontSize: '0.7rem', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--success)', border: '1px solid var(--success)', borderRadius: '4px', cursor: 'pointer' }}>
                          MANTENIMIENTO OK
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '0.5px solid rgba(212, 175, 55, 0.2)', margin: '40px 0' }}></div>
            </div>
            */}
            <div className="animate-fade-in" style={{ marginBottom: '60px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="gold-text" style={{ fontSize: '1rem', letterSpacing: '2px' }}>CONTROL DE FUNDICIÓN</h2>
              </div>
              
              <form onSubmit={createBatch} className="quick-batch-bar" style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(120px, 1fr) minmax(130px, 1fr) 80px auto', gap: '5px' }}>
                <select value={newBatch.productTypeId} onChange={e => setNewBatch({...newBatch, productTypeId: e.target.value})} required style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #333', color: 'white', padding: '15px', borderRadius: '4px' }}>
                  <option value="">PRODUCTO</option>
                  {productTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
                <input 
                  type="number" step="0.01" 
                  value={newBatch.entryWeight} 
                  onChange={e => setNewBatch({...newBatch, entryWeight: e.target.value})} 
                  placeholder="ENT. CERA (g)" 
                  required 
                  style={{ 
                    background: 'rgba(0,0,0,0.5)', border: '1px solid #333', color: 'white', padding: '15px', borderRadius: '4px', textAlign: 'center' 
                  }}
                />
                <input 
                  type="number" step="0.01" 
                  value={newBatch.exitWeight} 
                  onChange={e => setNewBatch({...newBatch, exitWeight: e.target.value})} 
                  placeholder="SAL. ARBOL (g)" 
                  required 
                  style={{ 
                    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212, 175, 55, 0.5)', color: 'white', padding: '15px', borderRadius: '4px', textAlign: 'center' 
                  }}
                />
                <input 
                  type="number" 
                  value={newBatch.itemsCount} 
                  onChange={e => setNewBatch({...newBatch, itemsCount: e.target.value})} 
                  placeholder="PIEZAS" 
                  required 
                  style={{ 
                    background: 'rgba(0,0,0,0.5)', border: '1px solid #333', color: 'white', padding: '15px', borderRadius: '4px', textAlign: 'center' 
                  }}
                />
                <button type="submit" className="batch-action-btn" disabled={loading} style={{ 
                  background: 'var(--gold)', color: 'black', border: 'none', padding: '0 20px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' 
                }}>
                  + LOTE
                </button>
              </form>

              <div style={{ marginTop: '20px' }}>
                 <div className="batches-scroll">
                  {batches.map(batch => (
                    <div key={batch.id} className="batch-pill" style={{ border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                      <b>ID {batch.id.slice(-4)}</b> | Ent: <span style={{color: '#888'}}>{batch.entryWeight}g</span> | Sal: <span className="gold-text">{batch.exitWeight}g</span> | {batch.itemsCount} piezas
                    </div>
                  ))}
                </div>
              </div>

              </div>
            </>
          )}

          {canAuthorizeCustody && pendingItems.length > 0 && (
             <div className="animate-fade-in" style={{ marginBottom: '60px' }}>
                <div className="glass-panel" style={{ borderLeft: '4px solid var(--gold)', background: 'linear-gradient(145deg, rgba(20,20,20,0.9), rgba(0,0,0,0.8))' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                     <Lock size={24} color="var(--gold)" />
                     <h2 className="gold-text" style={{ margin: 0 }}>BÓVEDA DE CUSTODIA (PLATINO)</h2>
                   </div>
                   <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '30px' }}>
                     Estas piezas físicas están bajo tu responsabilidad. Revela el PIN únicamente al joyero autorizado en mesa.
                   </p>
                   
                   <input value={vaultSearch} onChange={e => setVaultSearch(e.target.value)} placeholder="Buscar por lote, pieza o producto..." style={{ width: '100%', boxSizing: 'border-box', marginBottom: '16px', padding: '12px 14px', background: '#0f0f0f', border: '1px solid #514315', borderRadius: '8px', color: 'white' }} />
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     {custodyBatches.map(batch => {
                       const isOpen = expandedVaultBatch === batch.id;
                       const assigned = batch.items.filter(item => item.status === 'ASSIGNED').length;
                       return <div key={batch.id} style={{ border: '1px solid rgba(212,175,55,0.28)', borderRadius: '10px', overflow: 'hidden' }}>
                         <button type="button" onClick={() => setExpandedVaultBatch(isOpen ? null : batch.id)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left' }}>
                           <span><b className="gold-text">{isOpen ? '▾' : '▸'} Lote {batch.id}</b><small style={{ display: 'block', color: '#9ca3af', marginTop: '4px' }}>{batch.itemsCount} piezas · {batch.productType?.name || batch.items[0]?.productType?.name || 'Producto'}</small></span>
                           <span style={{ fontSize: '0.75rem', color: '#86efac' }}>{batch.available.length} disponibles {assigned ? `· ${assigned} asignadas` : ''}</span>
                         </button>
                         {isOpen && <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px', background: 'rgba(0,0,0,0.2)' }}>
                           {batch.available.map(item => <div key={item.id} style={{ padding: '14px', textAlign: 'center', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px' }}>
                             <b>{item.name}</b><small style={{ display: 'block', color: '#86efac', margin: '6px' }}>Disponible</small>
                             <button className="action-btn-gold" style={{ padding: '9px', fontSize: '0.68rem' }} onClick={() => alert(`PIEZA: ${item.name}\nLOTE: ${batch.id}\nPIN SECRETO: ${item.securePin}`)}><Lock size={13} /> REVELAR PIN</button>
                           </div>)}
                         </div>}
                       </div>;
                     })}
                     {!custodyBatches.length && <p style={{ color: '#9ca3af', textAlign: 'center' }}>No hay lotes con piezas disponibles para este filtro.</p>}
                   </div>
                </div>
             </div>
          )}

          {canDispatch && (
            <div className="animate-fade-in" style={{ marginBottom: '60px' }}>
              <div className="glass-panel minimalist-form">
                <header className="form-header">
                  <h2 className="gold-text">Despacho de Material</h2>
                  {pendingItems.length > 0 && (
                    <div className="total-badge">
                      <span className="label">BALANCE DE ENTREGA</span>
                      <span className="value">{calculateDespachoTotal().toFixed(2)}<small>g</small></span>
                    </div>
                  )}
                </header>

                {currentUser?.role === 'Joyero' && activeOrders.some(o => o.executorId === currentUser.id && o.status === 'OPEN') ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    <p style={{ color: 'var(--warning)', fontSize: '1.2rem', marginBottom: '10px' }}>⚠️ LÍMITE DE MESA ALCANZADO</p>
                    <p>Ya tienes una pieza física bajo tu responsabilidad. Debes retornar el material antes de poder aceptar una nueva.</p>
                  </div>
                ) : pendingItems.length > 0 ? (
                  <form onSubmit={executeDespacho}>
                    {/* Visual Grid of Batch Rings */}
                    {batches.filter(b => b.items.some(r => r.status !== 'COMPLETED')).map(batch => (
                      <div key={batch.id} style={{ marginBottom: '25px', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: '3px solid var(--gold)' }}>
                        <h4 onClick={() => setExpandedDispatchBatch(expandedDispatchBatch === batch.id ? null : batch.id)} style={{ color: 'white', fontSize: '0.85rem', marginBottom: '0', letterSpacing: '1px', cursor: 'pointer', padding: '4px 0' }}>
                          {expandedDispatchBatch === batch.id ? '▾' : '▸'} LOTE DE FUNDICIÓN: <span className="gold-text">#{batch.id.slice(-4)}</span>
                          <span style={{ float: 'right', fontSize: '0.7rem', color: '#888', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '12px' }}>
                            {batch.items.filter(r => r.status === 'PENDING').length} DISPONIBLES
                          </span>
                        </h4>
                        {expandedDispatchBatch === batch.id && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginTop: '15px' }}>
                           {batch.items.filter(r => r.status !== 'COMPLETED').map(ring => {
                              let responsible = null;
                              if (ring.status === 'ASSIGNED') {
                                 const order = activeOrders.find(o => o.productionItemId === ring.id);
                                 if (order) {
                                    const u = allUsers.find(u => u.id === order.executorId);
                                    responsible = u ? u.name : 'En Mesa';
                                 }
                              }
                              const isSelected = despacho.productionItemId === ring.id;
                              
                              return (
                                 <div 
                                   key={ring.id} 
                                   onClick={() => {
                                     if (ring.status === 'PENDING') {
                                       setDespacho({...despacho, productionItemId: ring.id});
                                       setTimeout(() => document.getElementById('w-anillo')?.focus(), 100);
                                     }
                                   }}
                                   style={{ 
                                     background: responsible ? 'rgba(0,0,0,0.6)' : isSelected ? 'var(--gold)' : 'rgba(212, 175, 55, 0.05)',
                                     border: isSelected ? '1px solid var(--gold)' : responsible ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(212,175,55,0.3)',
                                     padding: '12px 10px',
                                     borderRadius: '6px',
                                     cursor: ring.status === 'PENDING' ? 'pointer' : 'default',
                                     textAlign: 'center',
                                     color: isSelected ? 'black' : 'white',
                                     transition: 'all 0.2s',
                                     boxShadow: isSelected ? '0 0 15px rgba(212, 175, 55, 0.3)' : 'none',
                                     opacity: responsible ? 0.5 : 1
                                   }}
                                   className={ring.status === 'PENDING' && !isSelected ? "hover-scale-subtle" : ""}
                                 >
                                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px', color: isSelected ? 'black' : 'var(--gold)' }}>
                                      {ring.name}
                                    </div>
                                    {canAuthorizeCustody && (
                                      <div style={{ fontSize: '0.65rem', letterSpacing: '2px', opacity: 0.8, color: isSelected ? '#a83232' : '#f39c12', marginBottom: '5px' }}>
                                        🔑 PIN: {ring.securePin}
                                      </div>
                                    )}
                                    {responsible ? (
                                      <div style={{ fontSize: '0.7rem', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: 0.8 }}>
                                        <UserCircle size={12} /> {responsible}
                                      </div>
                                    ) : (
                                      <div style={{ 
                                        fontSize: '0.65rem', 
                                        fontWeight: 'bold', 
                                        background: isSelected ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.4)', 
                                        padding: '4px', 
                                        borderRadius: '4px' 
                                      }}>
                                        {isSelected ? '★ SELECCIONADO' : '👆 TOMAR PIEZA'}
                                      </div>
                                    )}
                                 </div>
                              )
                           })}
                        </div>}
                      </div>
                    ))}

                    {/* Formulario que se despliega si se selecciona */}
                    {despacho.productionItemId ? (
                       <div className="animate-fade-in" style={{ marginTop: '10px' }}>
                         {/* Cabecera elegante del pesaje */}
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                           <div style={{ textAlign: 'left' }}>
                             <span style={{ fontSize: '0.65rem', color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase' }}>PESAJE INICIAL</span>
                             <h3 style={{ margin: '5px 0 0 0', color: 'white', fontSize: '1.3rem', fontWeight: 300 }}>
                               {pendingItems.find(r => r.id === despacho.productionItemId)?.name || 'Pieza'}
                             </h3>
                           </div>
                           
                           {canAuthorizeCustody && (
                              <div style={{ width: '200px' }}>
                                <select 
                                  value={despacho.executorId} 
                                  onChange={e => setDespacho({...despacho, executorId: e.target.value, receiverId: currentUser.id})} 
                                  required
                                  className="minimal-select"
                                  style={{ padding: '8px', fontSize: '0.75rem' }}
                                >
                                  <option value="">ASIGNAR A...</option>
                                  {allUsers.filter(u => u.role === 'Joyero' && u.status === 'Disponible').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                              </div>
                           )}
                         </div>

                         {/* Pesos */}
                          <div className="flex-col gap-15 mb-30" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                              <div className="weight-row">
                                <label>ANILLO</label>
                                <input 
                                  type="number" step="0.01" id="w-anillo"
                                  placeholder="0.00"
                                  value={despacho.weights.anillo || ''} 
                                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), document.getElementById('w-plastilina').focus())}
                                  onChange={e => setDespacho({...despacho, weights: {...despacho.weights, anillo: e.target.value}})} 
                                />
                                <span className="unit">g</span>
                              </div>

                              <div className="weight-row subtle">
                                <label>PLASTILINA</label>
                                <input 
                                  type="number" step="0.01" id="w-plastilina"
                                  placeholder="0.00"
                                  value={despacho.weights.plastilina || ''} 
                                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), document.getElementById('w-bolsa').focus())}
                                  onChange={e => setDespacho({...despacho, weights: {...despacho.weights, plastilina: e.target.value}})} 
                                />
                                <span className="unit">g</span>
                              </div>

                              <div className="weight-row subtle">
                                <label>BOLSA</label>
                                <input 
                                  type="number" step="0.01" id="w-bolsa"
                                  placeholder="0.00"
                                  value={despacho.weights.bolsa || ''} 
                                  onChange={e => setDespacho({...despacho, weights: {...despacho.weights, bolsa: e.target.value}})} 
                                />
                                <span className="unit">g</span>
                              </div>
                          </div>

                          <div className="auth-box mb-20" style={{ marginBottom: '20px' }}>
                            <label>CLAVE AUTORIZACIÓN:</label>
                            <input 
                              type="number" 
                              placeholder="****"
                              value={despacho.providedPin} 
                              onChange={e => setDespacho({...despacho, providedPin: e.target.value})}
                              className="input-pin"
                              required
                            />
                          </div>

                         <button type="submit" className="action-btn-gold" disabled={loading}>
                           <CheckCircle size={18} /> CONFIRMAR Y ACTIVAR CRONÓMETRO
                         </button>
                       </div>
                    ) : null}
                  </form>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>No hay piezas de fundición disponibles para despacho.</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>Esperando a que el Administrador registre un nuevo lote...</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {canDispatch && activeOrders.length > 0 && (
            <div className="animate-fade-in" style={{ marginBottom: '60px' }}>
              <div className="glass-panel minimalist-form" style={{ 
                borderLeft: '4px solid',
                borderColor: (() => {
                  if (!devolucion.orderId) return 'var(--gold)';
                  const o = activeOrders.find(ord => ord.id === devolucion.orderId);
                  const total = Number(devolucion.weights.anillo) + Number(devolucion.weights.plastilina) + Number(devolucion.weights.bolsa);
                  return (o.totalWeight - total) > 0.05 ? 'var(--danger)' : 'var(--success)';
                })()
              }}>
                <header className="form-header">
                  <h2 className="gold-text">Cierre de Seguridad (Retorno)</h2>
                  {devolucion.orderId && (
                    <div className="total-badge">
                      <span className="label">BALANCE DE RETORNO</span>
                      <span className="value">
                        {(() => {
                          const o = activeOrders.find(ord => ord.id === devolucion.orderId);
                          const total = Number(devolucion.weights.anillo) + Number(devolucion.weights.plastilina) + Number(devolucion.weights.bolsa);
                           return (o.totalWeight - total).toFixed(3);
                        })()}<small>g</small>
                      </span>
                    </div>
                  )}
                </header>

                <form onSubmit={executeDevolucion}>
                   <div className="selection-row" style={{ gridTemplateColumns: '1fr' }}>
                        <select 
                          value={devolucion.orderId} 
                          onChange={e => setDevolucion({...devolucion, orderId: e.target.value})} 
                          required
                          className="minimal-select"
                          style={{ width: '100%' }}
                        >
                          <option value="">PIEZA ACTIVA...</option>
                          {batches.map(batch => {
                            const batchOrders = activeOrders.filter(order => batch.items?.some(item => item.id === order.productionItemId));
                            if (!batchOrders.length) return null;
                            return <optgroup key={batch.id} label={`LOTE ${batch.id} · ${batchOrders.length} PIEZA${batchOrders.length > 1 ? 'S' : ''} ACTIVA${batchOrders.length > 1 ? 'S' : ''}`}>
                              {batchOrders.map(order => <option key={order.id} value={order.id}>{order.productionItemName} — {allUsers.find(u => u.id === order.executorId)?.name || 'Joyero'}</option>)}
                            </optgroup>;
                          })}
                          {activeOrders.filter(order => !batches.some(batch => batch.items?.some(item => item.id === order.productionItemId))).map(order => <option key={order.id} value={order.id}>{order.productionItemName} — {allUsers.find(u => u.id === order.executorId)?.name || 'Joyero'}</option>)}
                        </select>
                   </div>

                   <div className="flex-col gap-15 mb-30" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                       <div className="weight-row">
                         <label>ANILLO FINAL</label>
                         <input 
                           type="number" step="0.001" placeholder="0.000"
                           value={devolucion.weights.anillo || ''} 
                           onChange={e => setDevolucion({...devolucion, weights: {...devolucion.weights, anillo: e.target.value}})} 
                           onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), document.getElementById('r-plastilina').focus())}
                           required
                         />
                         <span className="unit">g</span>
                       </div>
                       <div className="weight-row subtle">
                         <label>PLASTILINA REC.</label>
                         <input 
                           type="number" step="0.001" placeholder="0.000" id="r-plastilina"
                           value={devolucion.weights.plastilina || ''} 
                           onChange={e => setDevolucion({...devolucion, weights: {...devolucion.weights, plastilina: e.target.value}})} 
                           onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), document.getElementById('r-bolsa').focus())}
                           required
                         />
                         <span className="unit">g</span>
                       </div>
                       <div className="weight-row subtle">
                         <label>BOLSA / RETAL</label>
                         <input 
                           type="number" step="0.001" placeholder="0.000" id="r-bolsa"
                           value={devolucion.weights.bolsa || ''} 
                           onChange={e => setDevolucion({...devolucion, weights: {...devolucion.weights, bolsa: e.target.value}})} 
                           required
                         />
                         <span className="unit">g</span>
                       </div>
                    </div>

                   {(() => {
                     if (!devolucion.orderId) return null;
                     const o = activeOrders.find(ord => ord.id === devolucion.orderId);
                     const total = Number(devolucion.weights.anillo) + Number(devolucion.weights.plastilina) + Number(devolucion.weights.bolsa);
                     if ((o.totalWeight - total) > 0.05) {
                       return (
                         <div className="animate-fade-in" style={{ marginTop: '20px' }}>
                           <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '10px' }}>
                             ⚠️ ANOMALÍA DETECTADA: La merma supera los límites técnicos. Ingrese una explicación.
                           </p>
                           <textarea 
                             className="minimal-select"
                             style={{ width: '100%', minHeight: '80px', border: '1px solid var(--danger)', padding: '10px' }}
                             placeholder="Explicación o firma del incidente..."
                             value={devolucion.explanation}
                             onChange={e => setDevolucion({...devolucion, explanation: e.target.value})}
                             required
                           />
                         </div>
                       );
                     }
                     return null;
                   })()}

                   {devolucion.orderId && (
                      <div className="auth-box mb-20 animate-fade-in" style={{ marginTop: '20px', marginBottom: '20px' }}>
                        <label>CLAVE DE RECIBIDO:</label>
                        <input 
                          type="number" 
                          placeholder="****"
                          value={devolucion.providedPin} 
                          onChange={e => setDevolucion({...devolucion, providedPin: e.target.value})}
                          className="input-pin"
                          required
                        />
                      </div>
                   )}

                   <button type="submit" className="action-btn-gold" disabled={loading || !devolucion.orderId} style={{ 
                     background: (() => {
                       if (!devolucion.orderId) return undefined;
                       const o = activeOrders.find(ord => ord.id === devolucion.orderId);
                       const total = Number(devolucion.weights.anillo) + Number(devolucion.weights.plastilina) + Number(devolucion.weights.bolsa);
                       return (o.totalWeight - total) > 0.05 ? 'var(--danger)' : 'var(--success)';
                     })(),
                     color: devolucion.orderId ? 'white' : undefined,
                     marginTop: '20px'
                   }}>
                     <CheckCircle size={18} /> FINALIZAR ENTREGA Y DETENER TIEMPO
                   </button>
                </form>
              </div>
            </div>
          )}

          <h2 className="gold-text" style={{ marginBottom: '20px' }}>Panel de Control Taller</h2>
          <div className="joyeros-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {allUsers.filter(u => u.role === 'Joyero').map(joyero => {
              const activeOrder = activeOrders.find(o => o.executorId === joyero.id && o.status === 'OPEN');
              const status = activeOrder ? 'En Proceso' : joyero.status;
              
              return (
                <div key={joyero.id} className="glass-panel" style={{ padding: '20px', textAlign: 'center', border: status === 'Disponible' ? '1px solid var(--gold)' : status === 'En Proceso' ? '1px solid var(--warning)' : '1px solid #333' }}>
                  <UserCircle size={40} className={status === 'Disponible' || status === 'En Proceso' ? 'gold-text' : ''} style={{ marginBottom: '10px' }} />
                  <h4 style={{ marginBottom: '10px' }}>{joyero.name}</h4>
                  <span className={`status-badge status-${status === 'Fuera de Turno' ? 'offline' : status === 'Disponible' ? 'available' : status === 'En Proceso' ? 'working' : 'paused'}`}>
                    {status}
                  </span>
                  {activeOrder && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>
                        <b>{activeOrder.productionItemName}</b> | {(Number(activeOrder.totalWeight) || 0).toFixed(2)}g
                      </p>
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1rem', marginTop: '5px' }}>
                         <Timer startTime={activeOrder.startTime} />
                      </div>
                    </div>
                  )}
                  {joyero.lastLogin && joyero.status !== 'Fuera de Turno' && !activeOrder && (
                    <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '10px' }}>
                      En servicio desde: {new Date(joyero.lastLogin).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {canManageBatches && (
            <div className="animate-fade-in" style={{ marginTop: '80px', borderTop: '2px solid var(--gold)', paddingTop: '40px' }}>
              <h2 className="gold-text" style={{ fontSize: '1.2rem', letterSpacing: '3px', marginBottom: '30px' }}>📋 CENTRO DE REPORTES GENERALES (SUPER ADMIN)</h2>
              
              <div className="glass-panel" style={{ padding: '30px', marginBottom: '40px' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '20px', opacity: 0.7 }}>BITÁCORA INTERACTIVA DE OPERACIONES</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold)' }}>
                        <th style={{ padding: '15px', textAlign: 'left' }}>ID ORDEN</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>JOYERO</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>PIEZA</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>INICIO</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>FIN / DURACIÓN</th>
                        <th style={{ padding: '15px', textAlign: 'right' }}>MERMA (g)</th>
                        <th style={{ padding: '15px', textAlign: 'center' }}>ESTADO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrders.sort((a,b) => new Date(b.startTime) - new Date(a.startTime)).map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #222' }}>
                          <td style={{ padding: '15px', opacity: 0.5 }}>{o.id.slice(-6)}</td>
                          <td style={{ padding: '15px' }}>{allUsers.find(u => u.id === o.executorId)?.name}</td>
                          <td style={{ padding: '15px' }}>{o.productionItemName}</td>
                          <td style={{ padding: '15px' }}>{new Date(o.startTime).toLocaleTimeString()}</td>
                          <td style={{ padding: '15px' }}>
                            {o.endTime ? `${new Date(o.endTime).toLocaleTimeString()} (${o.durationMinutes} min)` : <span style={{ color: 'var(--warning)' }}>En proceso...</span>}
                          </td>
                          <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: o.loss > 0.05 ? 'var(--danger)' : 'var(--success)' }}>
                            {o.loss !== undefined ? `${o.loss}g` : '-'}
                          </td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>
                            <span className={`status-badge status-${o.status === 'OPEN' ? 'working' : 'available'}`} style={{ fontSize: '0.6rem' }}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '20px', opacity: 0.7 }}>BITÁCORA DE ASISTENCIA Y TURNOS</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {allUsers.filter(u => u.role === 'Joyero').map(u => (
                    <div key={u.id} className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)', padding: '15px' }}>
                      <h4 style={{ color: 'var(--gold)', marginBottom: '10px', fontSize: '0.8rem' }}>{u.name}</h4>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {u.history?.slice().reverse().map((h, i) => (
                          <div key={i} style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', opacity: 0.6 }}>
                            <span>{h.status}</span>
                            <span>{new Date(h.timestamp).toLocaleString()}</span>
                          </div>
                        ))}
                        {(!u.history || u.history.length === 0) && <p style={{ fontSize: '0.7rem', opacity: 0.3 }}>Sin registros hoy</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Dynamic Reports Tab */}
        {canManageBatches && adminTab === 'reports' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '100%' }}>
            {/* Header / Filtros */}
            <div className="glass-panel report-header-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h2 className="gold-text" style={{ fontSize: '1.2rem', letterSpacing: '2px', margin: 0 }}>📊 CENTRO DE REPORTES & ANALÍTICAS</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginTop: '5px' }}>Auditoría general de mermas, eficiencia operativa y asistencia técnica en el taller.</p>
              </div>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Filter size={16} color="var(--gold)" />
                  <span style={{ fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-gray)' }}>Joyero:</span>
                  <select 
                    value={filterJeweler} 
                    onChange={e => setFilterJeweler(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">TODOS LOS JOYEROS</option>
                    {allUsers.filter(u => u.role === 'Joyero').map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-gray)' }}>Fecha:</span>
                  <select 
                    value={filterDate} 
                    onChange={e => setFilterDate(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">HISTÓRICO COMPLETO</option>
                    <option value="today">HOY (ÚLTIMAS 24H)</option>
                    <option value="week">ESTA SEMANA (7D)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Metricas Dashboard (KPIs) */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Merma Acumulada</span>
                  <TrendingDown size={20} color={totalLossVal > 0.1 ? 'var(--danger)' : 'var(--gold)'} />
                </div>
                <div className="metric-value" style={{ color: totalLossVal > 0.1 ? 'var(--danger)' : 'white' }}>{totalLossVal}g</div>
                <div className={`metric-trend ${totalLossVal > 0.1 ? 'trend-down' : 'trend-stable'}`}>
                  {totalLossVal > 0.1 ? '⚠️ Pérdida sobre límite recomendado' : '✓ Pérdida controlada en taller'}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Piezas Producidas</span>
                  <Award size={20} color="var(--success)" />
                </div>
                <div className="metric-value">{totalProducedVal} un</div>
                <div className="metric-trend trend-up">
                  ✓ {totalProducedVal > 0 ? `${totalProducedVal} piezas finalizadas con éxito` : 'Sin piezas registradas'}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Eficiencia Operativa</span>
                  <TrendingUp size={20} color="var(--success)" />
                </div>
                <div className="metric-value" style={{ color: efficiencyVal >= 98 ? 'var(--success)' : 'white' }}>{efficiencyVal}%</div>
                <div className={`metric-trend ${efficiencyVal >= 98 ? 'trend-up' : 'trend-stable'}`}>
                  {efficiencyVal >= 98 ? '⚡ Rendimiento químico y de pulido óptimo' : '✓ Rendimiento estable de metal'}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Mermas Anómalas</span>
                  <ShieldAlert size={20} color={anomalyCount > 0 ? 'var(--danger)' : 'var(--success)'} />
                </div>
                <div className="metric-value" style={{ color: anomalyCount > 0 ? 'var(--danger)' : 'white' }}>{anomalyCount}</div>
                <div className={`metric-trend ${anomalyCount > 0 ? 'trend-down' : 'trend-up'}`}>
                  {anomalyCount > 0 ? '🚨 Desviaciones fuera de tolerancia' : '✓ Sin anomalías registradas'}
                </div>
              </div>
            </div>

            {/* Graficos Grid */}
            <div className="charts-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              
              {/* Grafico 1: Tendencia de Mermas (SVG Line Chart) */}
              <div className="chart-container">
                <div className="chart-header">
                  <span className="chart-title">📈 TENDENCIA DE MERMA POR TRABAJO</span>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-color" style={{ background: 'var(--gold)' }}></div>
                      <span>Merma (g)</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ background: 'var(--danger)' }}></div>
                      <span>Tolerancia (0.05g)</span>
                    </div>
                  </div>
                </div>

                <div style={{ position: 'relative', height: '220px', width: '100%' }}>
                  {filteredClosedOrders.length > 0 ? (
                    (() => {
                      const width = 800;
                      const height = 200;
                      const paddingLeft = 50;
                      const paddingRight = 30;
                      const paddingTop = 20;
                      const paddingBottom = 30;
                      
                      const chartWidth = width - paddingLeft - paddingRight;
                      const chartHeight = height - paddingTop - paddingBottom;
                      
                      const maxLoss = Math.max(0.15, ...filteredClosedOrders.map(o => o.loss || 0));
                      
                      const points = filteredClosedOrders.map((o, idx) => {
                        const x = paddingLeft + (idx * (chartWidth / Math.max(1, filteredClosedOrders.length - 1)));
                        const y = height - paddingBottom - ((o.loss || 0) / maxLoss * chartHeight);
                        return { x, y, order: o };
                      });
                      
                      const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                      const areaPath = points.length > 0
                        ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
                        : '';
                        
                      const toleranceY = height - paddingBottom - (0.05 / maxLoss * chartHeight);
                      
                      return (
                        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="svg-chart-svg">
                          <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.2"/>
                              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0"/>
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                            const y = paddingTop + (ratio * chartHeight);
                            const val = (maxLoss * (1 - ratio)).toFixed(2);
                            return (
                              <g key={idx}>
                                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className="chart-grid-line" />
                                <text x={paddingLeft - 10} y={y + 3} textAnchor="end" className="chart-axis-text">{val}g</text>
                              </g>
                            );
                          })}

                          {/* X Axis Labels */}
                          {points.map((p, idx) => (
                            <text key={idx} x={p.x} y={height - 10} textAnchor="middle" className="chart-axis-text">
                              {p.order.id.slice(-4)}
                            </text>
                          ))}

                          {/* Tolerance Limit Line */}
                          <line x1={paddingLeft} y1={toleranceY} x2={width - paddingRight} y2={toleranceY} stroke="var(--danger)" strokeWidth="1" strokeDasharray="4 4" />
                          <text x={width - paddingRight - 10} y={toleranceY - 5} fill="var(--danger)" fontSize="8px" textAnchor="end" fontWeight="bold">TOLERANCIA (0.05g)</text>

                          {/* Area Path */}
                          {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}
                          
                          {/* Line Path */}
                          {linePath && <path d={linePath} className="chart-line" />}

                          {/* Data Dots */}
                          {points.map((p, idx) => (
                            <circle 
                              key={idx}
                              cx={p.x}
                              cy={p.y}
                              r="5"
                              className="chart-dot"
                              style={{ stroke: p.order.loss > 0.05 ? 'var(--danger)' : 'var(--gold)' }}
                              onMouseEnter={(e) => {
                                setHoveredPoint({
                                  x: p.x,
                                  y: p.y,
                                  title: `Orden #${p.order.id.slice(-6)}`,
                                  content: `Pieza: ${p.order.productionItemName}\nJoyero: ${allUsers.find(u => u.id === p.order.executorId)?.name || 'Desconocido'}\nMerma: ${p.order.loss}g\nTiempo: ${p.order.durationMinutes} min`
                                });
                              }}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          ))}
                        </svg>
                      );
                    })()
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#666', fontSize: '0.9rem' }}>
                      Sin datos históricos de mermas para los filtros seleccionados.
                    </div>
                  )}
                </div>
              </div>

              {/* Grafico 2: Productividad por Joyero (SVG Bar Chart) */}
              <div className="chart-container">
                <div className="chart-header">
                  <span className="chart-title">🏆 EFICIENCIA Y RENDIMIENTO POR JOYERO</span>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-color" style={{ background: 'var(--gold)' }}></div>
                      <span>Piezas</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ background: 'var(--warning)' }}></div>
                      <span>Tiempo Prom. (min)</span>
                    </div>
                  </div>
                </div>

                <div style={{ position: 'relative', height: '220px', width: '100%' }}>
                  {(() => {
                    const joyeros = allUsers.filter(u => u.role === 'Joyero');
                    const jData = joyeros.map(j => {
                      const jOrders = filteredClosedOrders.filter(o => o.executorId === j.id);
                      const avgMinutes = jOrders.length > 0 
                        ? Math.round(jOrders.reduce((sum, o) => sum + (o.durationMinutes || 0), 0) / jOrders.length) 
                        : 0;
                      return {
                        name: j.name,
                        completedCount: jOrders.length,
                        avgMinutes
                      };
                    });

                    const width = 800;
                    const height = 200;
                    const paddingLeft = 50;
                    const paddingRight = 30;
                    const paddingTop = 20;
                    const paddingBottom = 30;
                    
                    const chartWidth = width - paddingLeft - paddingRight;
                    const chartHeight = height - paddingTop - paddingBottom;
                    
                    const maxCount = Math.max(5, ...jData.map(d => d.completedCount));
                    const maxTime = Math.max(120, ...jData.map(d => d.avgMinutes));

                    return (
                      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="svg-chart-svg">
                        {/* Grid Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                          const y = paddingTop + (ratio * chartHeight);
                          const valCount = Math.round(maxCount * (1 - ratio));
                          return (
                            <g key={idx}>
                              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className="chart-grid-line" />
                              <text x={paddingLeft - 10} y={y + 3} textAnchor="end" className="chart-axis-text">{valCount}</text>
                            </g>
                          );
                        })}

                        {/* Bars rendering */}
                        {jData.map((d, idx) => {
                          const slotWidth = chartWidth / jData.length;
                          const centerX = paddingLeft + (idx * slotWidth) + (slotWidth / 2);
                          
                          const barWidth = 24;
                          const bar1X = centerX - barWidth - 3;
                          const bar2X = centerX + 3;
                          
                          const bar1Height = (d.completedCount / maxCount) * chartHeight;
                          const bar1Y = height - paddingBottom - bar1Height;
                          
                          const bar2Height = (d.avgMinutes / maxTime) * chartHeight;
                          const bar2Y = height - paddingBottom - bar2Height;

                          return (
                            <g key={idx}>
                              {/* Piezas bar */}
                              <rect 
                                x={bar1X}
                                y={bar1Y}
                                width={barWidth}
                                height={Math.max(1, bar1Height)}
                                className="chart-bar"
                                onMouseEnter={(e) => {
                                  setHoveredPoint({
                                    x: bar1X + barWidth/2,
                                    y: bar1Y,
                                    title: d.name,
                                    content: `Piezas completadas: ${d.completedCount}`
                                  });
                                }}
                                onMouseLeave={() => setHoveredPoint(null)}
                              />
                              {/* Tiempo bar */}
                              <rect 
                                x={bar2X}
                                y={bar2Y}
                                width={barWidth}
                                height={Math.max(1, bar2Height)}
                                className="chart-bar-alt"
                                onMouseEnter={(e) => {
                                  setHoveredPoint({
                                    x: bar2X + barWidth/2,
                                    y: bar2Y,
                                    title: d.name,
                                    content: `Tiempo promedio: ${d.avgMinutes} min/pieza`
                                  });
                                }}
                                onMouseLeave={() => setHoveredPoint(null)}
                              />

                              {/* X Axis label */}
                              <text x={centerX} y={height - 10} textAnchor="middle" className="chart-axis-text" fontWeight="bold">
                                {d.name}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
              </div>

            </div>

            {/* Grafico 3: Lotes de fundición y balance de pesos */}
            <div className="chart-container">
              <div className="chart-header">
                <span className="chart-title">🌋 RENDIMIENTO DE PROCESO DE FUNDICIÓN POR LOTE</span>
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#222' }}></div>
                    <span>Peso Entrada (Cera)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: 'var(--gold)' }}></div>
                    <span>Peso Salida (Metal)</span>
                  </div>
                </div>
              </div>

              <div style={{ position: 'relative', height: '220px', width: '100%' }}>
                {batches.length > 0 ? (
                  (() => {
                    const width = 800;
                    const height = 200;
                    const paddingLeft = 50;
                    const paddingRight = 30;
                    const paddingTop = 20;
                    const paddingBottom = 30;
                    
                    const chartWidth = width - paddingLeft - paddingRight;
                    const chartHeight = height - paddingTop - paddingBottom;
                    
                    const maxWeight = Math.max(300, ...batches.map(b => Math.max(b.entryWeight, b.exitWeight)));

                    return (
                      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="svg-chart-svg">
                        {/* Grid Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                          const y = paddingTop + (ratio * chartHeight);
                          const valWeight = Math.round(maxWeight * (1 - ratio));
                          return (
                            <g key={idx}>
                              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className="chart-grid-line" />
                              <text x={paddingLeft - 10} y={y + 3} textAnchor="end" className="chart-axis-text">{valWeight}g</text>
                            </g>
                          );
                        })}

                        {/* Rendering bars */}
                        {batches.map((b, idx) => {
                          const slotWidth = chartWidth / batches.length;
                          const centerX = paddingLeft + (idx * slotWidth) + (slotWidth / 2);
                          
                          const barWidth = 35;
                          const bar1X = centerX - barWidth - 4;
                          const bar2X = centerX + 4;
                          
                          const bar1Height = (b.entryWeight / maxWeight) * chartHeight;
                          const bar1Y = height - paddingBottom - bar1Height;
                          
                          const bar2Height = (b.exitWeight / maxWeight) * chartHeight;
                          const bar2Y = height - paddingBottom - bar2Height;

                          const yieldLoss = Number((b.entryWeight - b.exitWeight).toFixed(2));
                          const yieldPercent = ((b.exitWeight / b.entryWeight) * 100).toFixed(1);

                          return (
                            <g key={idx}>
                              {/* Entrada Cera bar */}
                              <rect 
                                x={bar1X}
                                y={bar1Y}
                                width={barWidth}
                                height={Math.max(1, bar1Height)}
                                fill="#222"
                                stroke="rgba(255,255,255,0.05)"
                                rx="4"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={(e) => {
                                  setHoveredPoint({
                                    x: bar1X + barWidth/2,
                                    y: bar1Y,
                                    title: `Lote #${b.id.slice(-4)}`,
                                    content: `Entrada (Cera): ${b.entryWeight}g`
                                  });
                                }}
                                onMouseLeave={() => setHoveredPoint(null)}
                              />
                              {/* Salida Arbol bar */}
                              <rect 
                                x={bar2X}
                                y={bar2Y}
                                width={barWidth}
                                height={Math.max(1, bar2Height)}
                                className="chart-bar"
                                rx="4"
                                onMouseEnter={(e) => {
                                  setHoveredPoint({
                                    x: bar2X + barWidth/2,
                                    y: bar2Y,
                                    title: `Lote #${b.id.slice(-4)}`,
                                    content: `Salida Árbol (Metal): ${b.exitWeight}g\nPérdida: ${yieldLoss}g (${yieldPercent}% rendimiento)`
                                  });
                                }}
                                onMouseLeave={() => setHoveredPoint(null)}
                              />

                              {/* X Axis label */}
                              <text x={centerX} y={height - 10} textAnchor="middle" className="chart-axis-text" fontWeight="bold">
                                LOTE {b.id.slice(-4)}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#666', fontSize: '0.9rem' }}>
                    Registra un lote de fundición en Control Operativo para activar este gráfico.
                  </div>
                )}
              </div>
            </div>

            {/* Custom Tooltip element inside JSX */}
            {hoveredPoint && (
              <div 
                className="chart-tooltip animate-fade-in" 
                style={{ 
                  display: 'block', 
                  left: `${hoveredPoint.x + 30}px`,
                  top: `${hoveredPoint.y + 110}px`,
                  position: 'absolute'
                }}
              >
                <b>{hoveredPoint.title}</b>
                <p style={{ margin: '5px 0 0 0', whiteSpace: 'pre-line', fontSize: '0.7rem', lineHeight: '1.4', opacity: 0.9 }}>{hoveredPoint.content}</p>
              </div>
            )}

            {/* Auditoria de Anomalias Criticas */}
            <div className="glass-panel" style={{ padding: '30px' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '20px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '2px' }}>
                <ShieldAlert size={20} /> AUDITORÍA DE ANOMALÍAS Y PÉRDIDAS CRÍTICAS
              </h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="audit-table-mobile" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(192, 57, 43, 0.1)', color: 'var(--danger)' }}>
                      <th style={{ padding: '15px', textAlign: 'left' }}>ID ORDEN</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>JOYERO</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>PIEZA</th>
                      <th style={{ padding: '15px', textAlign: 'center' }}>PESO INICIAL</th>
                      <th style={{ padding: '15px', textAlign: 'center' }}>PESO FINAL</th>
                      <th style={{ padding: '15px', textAlign: 'right' }}>MERMA REGISTRADA</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>EXPLICACIÓN TÉCNICA DEL JOYERO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClosedOrders.filter(o => o.isAnomaly).map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #333' }}>
                        <td data-label="Orden" style={{ padding: '15px', opacity: 0.6 }}>{o.id.slice(-6)}</td>
                        <td data-label="Joyero" style={{ padding: '15px', fontWeight: 'bold' }}>{allUsers.find(u => u.id === o.executorId)?.name}</td>
                        <td data-label="Pieza" style={{ padding: '15px' }}>{o.productionItemName}</td>
                        <td data-label="Peso Ini." style={{ padding: '15px', textAlign: 'center' }}>{o.totalWeight}g</td>
                        <td data-label="Peso Fin." style={{ padding: '15px', textAlign: 'center' }}>{o.finalTotalWeight}g</td>
                        <td data-label="Merma" style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: 'var(--danger)' }}>
                          +{o.loss}g ({((o.loss / o.totalWeight)*100).toFixed(1)}%)
                        </td>
                        <td data-label="Explica." style={{ padding: '15px', color: '#ffc1c1', fontStyle: 'italic' }}>
                          "{o.explanation}"
                        </td>
                      </tr>
                    ))}
                    {filteredClosedOrders.filter(o => o.isAnomaly).length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                          Excelente: Ningún incidente de tolerancia de peso reportado en este rango.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Centro de Descargas y Exportacion CSV */}
            <div className="glass-panel" style={{ padding: '30px', borderLeft: '4px solid var(--gold)' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '10px', letterSpacing: '2px' }}>📁 CENTRO DE DESCARGAS E INFORMES</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginBottom: '20px' }}>
                Genera copias locales de seguridad y auditoría en formato de texto plano compatible con Excel y software de administración.
              </p>
              
              <div className="export-group">
                <button onClick={exportOperations} className="export-btn">
                  <FileSpreadsheet size={16} /> Exportar Historial Operativo (CSV)
                </button>
                <button onClick={exportAttendance} className="export-btn">
                  <Download size={16} /> Exportar Historial de Turnos (CSV)
                </button>
                <button onClick={exportToPDF} className="export-btn" style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>
                  <Activity size={16} /> Exportar Reporte Completo (PDF)
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Dynamic Hardware Tab */}
        {canManageBatches && adminTab === 'hardware' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '100%' }}>
            <div className="glass-panel">
              <h2 className="gold-text" style={{ fontSize: '1.2rem', letterSpacing: '2px', margin: 0, marginBottom: '10px' }}>🏭 ESTADO DE LA PLANTA (HARDWARE ACTIVO)</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Monitoreo preventivo del ciclo de vida y estado térmico de los hornos, inyectoras y soldadoras láser.</p>
            </div>

            <div className="machines-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {machines.map(m => (
                <div key={m.id} className="glass-panel" style={{ padding: '25px', border: m.status === 'DOWN' ? '1px solid var(--danger)' : '1px solid rgba(212, 175, 55, 0.1)', transition: 'all 0.3s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'white' }}>{m.name}</span>
                    <span className={`status-badge status-${m.status === 'OPERATIONAL' ? 'available' : m.status === 'MAINTENANCE' ? 'paused' : 'offline'}`} style={{ fontSize: '0.65rem' }}>
                      {m.status}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-gray)' }}>
                      <span>Vida Útil Filtro / Lente</span>
                      <span>{m.cycles} / {m.maintenanceThreshold} ciclos</span>
                    </div>
                    <div style={{ height: '6px', background: '#111', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ 
                        height: '100%', 
                        background: (m.cycles / m.maintenanceThreshold) > 0.8 ? 'var(--danger)' : (m.cycles / m.maintenanceThreshold) > 0.6 ? 'var(--warning)' : 'var(--gold)', 
                        width: `${Math.min(100, (m.cycles / m.maintenanceThreshold) * 100)}%`,
                        transition: 'width 0.5s ease-out'
                      }}></div>
                    </div>
                    {(m.cycles / m.maintenanceThreshold) > 0.8 && (
                      <p style={{ color: 'var(--danger)', fontSize: '0.65rem', marginTop: '6px', fontWeight: 'bold' }}>⚠️ MANTENIMIENTO PREVENTIVO RECOMENDADO</p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {m.status === 'OPERATIONAL' ? (
                      <button 
                        onClick={() => reportMachineIssue(m.id)} 
                        className="premium-btn"
                        style={{ padding: '8px 15px', fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '6px', width: '100%' }}
                      >
                        <ShieldAlert size={12} /> REPORTAR FALLO
                      </button>
                    ) : (
                      <button 
                        onClick={() => fixMachine(m.id)} 
                        className="premium-btn"
                        style={{ padding: '8px 15px', fontSize: '0.7rem', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--success)', border: '1px solid var(--success)', borderRadius: '6px', width: '100%' }}
                      >
                        <Wrench size={12} /> REALIZAR MANTENIMIENTO
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Inventory Tab */}
        {adminTab === 'inventory' && (
          <InventoryPanel
            API_URL={API_URL}
            token={currentUser?.access_token}
            currentUser={currentUser}
            activeOrders={activeOrders}
          />
        )}

        {/* Dynamic Personal Tab */}
        {canManageBatches && adminTab === 'users' && (
          <UserManagementPanel 
            allUsers={allUsers}
            fetchUsers={fetchUsers}
            API_URL={API_URL}
            token={currentUser?.access_token}
            currentUser={currentUser}
          />
        )}
      </main>
    </div>
  );
}

const Timer = ({ startTime }) => {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(startTime).getTime();
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span>{elapsed}</span>;
}

const JoyeroOrderControl = ({ clientOrders, fetchClientOrders, API_URL, token, loading, setLoading, canCreateOrders }) => {
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [weightModalOrderId, setWeightModalOrderId] = useState(null);

  const steps = [
    "Diseño", "Impresión", "Casting Inicial", "Limpieza", "Pre-engaste", 
    "Vulcanizado", "Inyección", "Empalme", "Árboles", "Casting Principal", "Pulido y Acabados"
  ];
  
  const stepDescriptions = [
    "Modelar archivo 3D CAD bajo medidas y estilo especificado. Enviar render si es necesario.",
    "Imprimir pieza en máquina 3D usando resina calcinable. Asegurar soportes correctos.",
    "Someter la impresión a un primer vaciado en metal temporal para checar mermas y dimensiones.",
    "Decapado y limpieza de residuos del primer casting, detallar superficies gruesas.",
    "Ahorcado inicial y preparación de las cajas o rieles para comprobar medidas de las gemas/diamantes.",
    "Incrustar la pieza de metal en caucho, hornear y cortar quirúrgicamente el molde madre.",
    "Inyectar cera líquida dentro del molde de caucho, esperar solidificación y extraer con cuidado.",
    "Unir y soldar delicadamente las partes o secciones de cera si aplican juntas.",
    "Puntos de soldadura de cera sobre el tronco o árbol principal para el cilindro de revestimiento.",
    "Hornear cilindro y realizar el vaciado final en ORO o PLATA. Enfriamiento y desprendimiento.",
    "Uso de lijas, mantas, borlas, pasta de pulir y rouge. Limpieza ultrasónica y control de calidad final."
  ];

  const updateStep = async (orderId, stepIndex) => {
    setLoading(true);
    let status = 'IN_PRODUCTION';
    if (stepIndex === 0) status = 'PENDING';
    if (stepIndex === steps.length - 1) status = 'COMPLETED';

    try {
      await fetch(`${API_URL}/client-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, stepIndex })
      });
      fetchClientOrders();
    } catch (err) {
      alert("Error actualizando proceso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '40px', borderTop: '0.5px solid rgba(212, 175, 55, 0.2)', paddingTop: '30px', textAlign: 'left' }}>
      <h3 className="gold-text" style={{ fontSize: '1rem', letterSpacing: '1px', margin: '0 0 12px', textAlign: 'center' }}>PANEL DE FABRICACIÓN (RF-006 / RF-007)</h3>
      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginBottom: '25px' }}>Toca un pedido para medir tiempo por fase y registrar pesajes con triple factor.</p>
      {canCreateOrders && <button type="button" onClick={() => window.open('/new-order', '_blank')} className="action-btn-gold" style={{ width: '100%', padding: '12px', fontSize: '0.76rem', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>＋ REGISTRAR NUEVO PEDIDO</button>}
      
      {weightModalOrderId && (
        <TripleWeightModal
          workOrderId={weightModalOrderId}
          API_URL={API_URL}
          token={token}
          onClose={() => setWeightModalOrderId(null)}
          onSuccess={() => setWeightModalOrderId(null)}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {clientOrders.filter(o => o.status !== 'COMPLETED').map(order => {
           const currentIndex = order.currentStepIndex || 0;
           const isExpanded = expandedOrderId === order.id;

           return (
             <div 
               key={order.id} 
               className="glass-panel animate-fade-in" 
               style={{ 
                 padding: '15px', 
                 border: isExpanded ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.05)', 
                 cursor: isExpanded ? 'default' : 'pointer',
                 transition: 'all 0.2s'
               }} 
               onClick={() => !isExpanded && setExpandedOrderId(order.id)}
             >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <h4 style={{ color: isExpanded ? 'var(--gold)' : 'white', margin: '0 0 4px 0', fontSize: '0.9rem' }}>{order.clientName}</h4>
                     <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>CÓD: P-{order.id.slice(-6)} | {order.design}</p>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.65rem', background: 'rgba(212, 175, 55, 0.2)', color: 'var(--gold)', padding: '4px 8px', borderRadius: '12px' }}>
                        {currentIndex + 1}. {steps[currentIndex]}
                      </span>
                   </div>
                </div>
                
                {isExpanded && (
                  <div className="animate-fade-in" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                     <div style={{ marginBottom: '15px', background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #4facfe' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-gray)', margin: '0 0 6px 0' }}>
                          <b>Instrucciones de la Pieza:</b> {order.design} — <b>Peso Estimado:</b> {order.estimatedWeight}g
                        </p>
                        <p style={{ fontSize: '0.8rem', color: '#4facfe', margin: 0, lineHeight: '1.4' }}>
                          <b>Acción Requerida para el paso actual:</b><br/>
                          {stepDescriptions[currentIndex]}
                        </p>
                     </div>

                     {/* Phase Timer Component RF-006 */}
                     <div style={{ marginBottom: '16px' }}>
                       <PhaseTimerWidget workOrderId={order.id} API_URL={API_URL} token={token} />
                     </div>

                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                       {steps.map((st, i) => {
                          const isCurrent = currentIndex === i;
                          const isPassed = currentIndex > i;
                          return (
                            <button 
                               key={i}
                               onClick={(e) => { e.stopPropagation(); updateStep(order.id, i); }}
                               disabled={loading}
                               style={{
                                 padding: '6px 10px',
                                 fontSize: '0.65rem',
                                 borderRadius: '20px',
                                 cursor: 'pointer',
                                 border: isCurrent ? '1px solid var(--gold)' : isPassed ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid #333',
                                 background: isCurrent ? 'var(--gold)' : isPassed ? 'rgba(52, 211, 153, 0.1)' : 'rgba(0,0,0,0.4)',
                                 color: isCurrent ? '#000' : isPassed ? 'var(--success)' : '#666',
                                 fontWeight: isCurrent ? 'bold' : 'normal',
                                 transition: 'all 0.2s',
                                 boxShadow: isCurrent ? '0 0 8px rgba(212, 175, 55, 0.3)' : 'none'
                               }}
                            >
                              {i+1}. {st}
                            </button>
                          )
                       })}
                     </div>

                     <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                       <button
                         onClick={(e) => { e.stopPropagation(); setWeightModalOrderId(order.id); }}
                         style={{ background: 'rgba(96, 165, 250, 0.15)', border: '1px solid #60a5fa', color: '#60a5fa', fontSize: '0.75rem', cursor: 'pointer', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold' }}
                       >
                         ⚖️ Pesaje Triple Factor (RF-007)
                       </button>

                       <div style={{ display: 'flex', gap: '8px' }}>
                         <button 
                           onClick={(e) => { e.stopPropagation(); window.open(`/track/${order.id.slice(-6)}?admin=true`, '_blank'); }}
                           style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', color: 'var(--gold)', fontSize: '0.7rem', cursor: 'pointer', padding: '6px 12px', borderRadius: '4px' }}
                         >
                           👁️ Ver como cliente
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); setExpandedOrderId(null); }} 
                           style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.7rem', cursor: 'pointer', padding: '5px' }}
                         >
                           Cerrar Panel ▲
                         </button>
                       </div>
                     </div>
                  </div>
                )}
             </div>
           )
        })}
        {clientOrders.filter(o => o.status !== 'COMPLETED').length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', padding: '20px' }}>No hay pedidos activos en este momento.</p>
        )}
      </div>
    </div>
  );
};

export default App;
