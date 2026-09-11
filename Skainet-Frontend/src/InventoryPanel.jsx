import React, { useState, useEffect } from 'react';
import { Package, Plus, ArrowUpRight, ArrowDownLeft, History, Search, Filter, ShieldAlert, X, AlertTriangle } from 'lucide-react';

export default function InventoryPanel({ API_URL, token, currentUser, activeOrders = [] }) {
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'kardex'
  const [materials, setMaterials] = useState([]);
  const [kardexMovements, setKardexMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [searchName, setSearchName] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Activo');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Form fields
  const [matName, setMatName] = useState('');
  const [matCategory, setMatCategory] = useState('Metal precioso');
  const [matUnit, setMatUnit] = useState('gramos');
  const [matStockInicial, setMatStockInicial] = useState('0');
  const [matMinStock, setMatMinStock] = useState('0');

  // Movement fields
  const [movQty, setMovQty] = useState('');
  const [movProvider, setMovProvider] = useState('');
  const [movWorkOrderId, setMovWorkOrderId] = useState('');
  const [movObs, setMovObs] = useState('');

  const isAdmin = currentUser?.role === 'Super Administrador' || currentUser?.role === 'Dueno' || currentUser?.role === 'Administrador';

  useEffect(() => {
    fetchMaterials();
    if (activeTab === 'kardex') {
      fetchKardex();
    }
  }, [activeTab, categoryFilter, statusFilter]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/inventory/materials?status=${statusFilter}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        setMaterials(data);
      }
    } catch (err) {
      console.error('Error cargando materiales:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKardex = async () => {
    try {
      const resp = await fetch(`${API_URL}/inventory/kardex`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (resp.ok) {
        const data = await resp.json();
        setKardexMovements(data);
      }
    } catch (err) {
      console.error('Error cargando Kardex:', err);
    }
  };

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!matName) return alert('El nombre del material es obligatorio');

    try {
      const resp = await fetch(`${API_URL}/inventory/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: matName,
          category: matCategory,
          unit: matUnit,
          stockInicial: Number(matStockInicial),
          minStock: Number(matMinStock)
        })
      });

      const data = await resp.json();
      if (resp.ok) {
        alert('Material registrado correctamente.');
        setIsCreateModalOpen(false);
        setMatName('');
        fetchMaterials();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleRegisterEntry = async (e) => {
    e.preventDefault();
    if (!selectedMaterial || !movQty) return alert('Ingrese la cantidad a ingresar');

    try {
      const resp = await fetch(`${API_URL}/inventory/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          materialId: selectedMaterial.id,
          quantity: Number(movQty),
          originProvider: movProvider,
          observations: movObs
        })
      });

      const data = await resp.json();
      if (resp.ok) {
        alert('Entrada registrada correctamente.');
        setIsEntryModalOpen(false);
        setMovQty('');
        setMovProvider('');
        setMovObs('');
        fetchMaterials();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleRegisterSalida = async (e) => {
    e.preventDefault();
    if (!selectedMaterial || !movQty || !movWorkOrderId) {
      return alert('Debe asociar la salida a una orden de producción y especificar la cantidad (RN-021).');
    }

    try {
      const resp = await fetch(`${API_URL}/inventory/exit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          materialId: selectedMaterial.id,
          quantity: Number(movQty),
          workOrderId: movWorkOrderId,
          observations: movObs
        })
      });

      const data = await resp.json();
      if (resp.ok) {
        alert('Salida registrada correctamente.');
        setIsExitModalOpen(false);
        setMovQty('');
        setMovWorkOrderId('');
        setMovObs('');
        fetchMaterials();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleDeactivateMaterial = async (mat) => {
    if (!isAdmin) {
      alert('No tiene permisos para desactivar materiales. (RN-019)');
      return;
    }

    if (!window.confirm(`¿Desea desactivar el material "${mat.name}"? (Baja Lógica RN-018)`)) return;

    try {
      const resp = await fetch(`${API_URL}/inventory/materials/${mat.id}`, {
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });

      if (resp.ok) {
        alert('Material desactivado correctamente.');
        fetchMaterials();
      } else {
        const data = await resp.json();
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const filteredMaterials = materials.filter(m =>
    !searchName || m.name.toLowerCase().includes(searchName.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={32} color="#10b981" />
            Gestión de Inventario (RF-004)
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '4px' }}>
            Control estricto de catálogo de materiales, entradas, salidas vinculadas a OT y Kardex.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{ padding: '10px 18px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={18} /> Nuevo Material
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #374151', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'catalog' ? '3px solid #10b981' : 'none',
            color: activeTab === 'catalog' ? '#10b981' : '#9ca3af',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Package size={18} /> Catálogo de Materiales
        </button>

        <button
          onClick={() => setActiveTab('kardex')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'kardex' ? '3px solid #10b981' : 'none',
            color: activeTab === 'kardex' ? '#10b981' : '#9ca3af',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <History size={18} /> Kardex de Movimientos (RF-004.7)
        </button>
      </div>

      {activeTab === 'catalog' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Buscar material por nombre..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 40px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '10px 16px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
            >
              <option value="">Todas las Categorías</option>
              <option value="Metal precioso">Metal Precioso</option>
              <option value="Gema">Gema / Piedra</option>
              <option value="Insumo">Insumo / Suministro</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '10px 16px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
            >
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </select>
          </div>

          {/* Grid of Materials */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filteredMaterials.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', backgroundColor: '#1f2937', borderRadius: '12px', color: '#9ca3af' }}>
                No se encontraron materiales en el catálogo con los filtros aplicados.
              </div>
            ) : (
              filteredMaterials.map((mat) => {
                const isLowStock = mat.stock <= mat.minStock;
                return (
                  <div key={mat.id} style={{
                    backgroundColor: '#1f2937',
                    borderRadius: '12px',
                    padding: '20px',
                    border: isLowStock ? '1px solid #f59e0b' : '1px solid #374151',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{mat.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>{mat.category}</span>
                      </div>
                      {isLowStock && (
                        <span title="Alerta de Stock Mínimo" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          <AlertTriangle size={16} /> Bajo Stock
                        </span>
                      )}
                    </div>

                    <div style={{ margin: '16px 0', padding: '12px', backgroundColor: '#111827', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Stock Disponible:</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: isLowStock ? '#fbbf24' : '#34d399' }}>
                        {mat.stock} <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{mat.unit}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      {isAdmin && mat.status === 'Activo' && (
                        <button
                          onClick={() => { setSelectedMaterial(mat); setIsEntryModalOpen(true); }}
                          style={{ flex: 1, padding: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid #10b981', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                        >
                          <ArrowDownLeft size={16} /> Entrada
                        </button>
                      )}

                      {mat.status === 'Activo' && (
                        <button
                          onClick={() => { setSelectedMaterial(mat); setIsExitModalOpen(true); }}
                          style={{ flex: 1, padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                        >
                          <ArrowUpRight size={16} /> Salida (OT)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {activeTab === 'kardex' && (
        <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', overflow: 'hidden', border: '1px solid #374151' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#111827', color: '#9ca3af', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 16px' }}>Fecha</th>
                <th style={{ padding: '14px 16px' }}>Material</th>
                <th style={{ padding: '14px 16px' }}>Tipo Movimiento</th>
                <th style={{ padding: '14px 16px' }}>Cantidad</th>
                <th style={{ padding: '14px 16px' }}>Orden de Trabajo / Origen</th>
                <th style={{ padding: '14px 16px' }}>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {kardexMovements.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                    No hay movimientos registrados en el Kardex.
                  </td>
                </tr>
              ) : (
                kardexMovements.map((km) => (
                  <tr key={km.id} style={{ borderBottom: '1px solid #374151' }}>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#9ca3af' }}>
                      {new Date(km.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>{km.material?.name || '-'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        backgroundColor: km.type === 'ENTRADA' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: km.type === 'ENTRADA' ? '#4ade80' : '#f87171'
                      }}>
                        {km.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>
                      {km.type === 'ENTRADA' ? '+' : '-'}{km.quantity} {km.material?.unit}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#9ca3af' }}>
                      {km.workOrderId ? `OT: ${km.workOrderId}` : km.originProvider || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#9ca3af' }}>{km.responsibleId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Crear Material */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1f2937', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '480px', border: '1px solid #374151' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '16px' }}>Registrar Nuevo Material (RF-004.1)</h3>
            <form onSubmit={handleCreateMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Nombre del Material *</label>
                <input type="text" required value={matName} onChange={(e) => setMatName(e.target.value)} placeholder="Ej. Oro 18k Amarilla" style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Categoría *</label>
                <select value={matCategory} onChange={(e) => setMatCategory(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}>
                  <option value="Metal precioso">Metal Precioso</option>
                  <option value="Gema">Gema / Piedra</option>
                  <option value="Insumo">Insumo / Suministro</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Unidad de Medida *</label>
                <select value={matUnit} onChange={(e) => setMatUnit(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}>
                  <option value="gramos">Gramos (g)</option>
                  <option value="quilates">Quilates (ct)</option>
                  <option value="unidades">Unidades (u)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Stock Inicial</label>
                  <input type="number" step="0.01" value={matStockInicial} onChange={(e) => setMatStockInicial(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Stock Mínimo (Alerta)</label>
                  <input type="number" step="0.01" value={matMinStock} onChange={(e) => setMatMinStock(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ padding: '10px 16px', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '6px' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Entrada */}
      {isEntryModalOpen && selectedMaterial && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1f2937', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '440px', border: '1px solid #374151' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>Registrar Entrada de Material</h3>
            <p style={{ color: '#10b981', fontWeight: '600', marginBottom: '16px' }}>{selectedMaterial.name}</p>
            <form onSubmit={handleRegisterEntry} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Cantidad a Ingresar ({selectedMaterial.unit}) *</label>
                <input type="number" step="0.01" required value={movQty} onChange={(e) => setMovQty(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Origen / Proveedor</label>
                <input type="text" value={movProvider} onChange={(e) => setMovProvider(e.target.value)} placeholder="Ej. Compra Aporte Almacén" style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsEntryModalOpen(false)} style={{ padding: '10px 16px', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '6px' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600' }}>Confirmar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Salida (Obligatorio a OT RN-021) */}
      {isExitModalOpen && selectedMaterial && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1f2937', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '440px', border: '1px solid #374151' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '4px' }}>Registrar Salida de Material (RF-004.6)</h3>
            <p style={{ color: '#ef4444', fontWeight: '600', marginBottom: '16px' }}>{selectedMaterial.name} (Disponible: {selectedMaterial.stock} {selectedMaterial.unit})</p>
            
            <form onSubmit={handleRegisterSalida} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Cantidad a Descontar ({selectedMaterial.unit}) *</label>
                <input type="number" step="0.01" required value={movQty} onChange={(e) => setMovQty(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Orden de Trabajo Asociada * (RN-021)</label>
                <select required value={movWorkOrderId} onChange={(e) => setMovWorkOrderId(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}>
                  <option value="">Seleccione una OT activa...</option>
                  {activeOrders.map(o => (
                    <option key={o.id} value={o.id}>OT #{o.id.slice(-6)} - {o.ringName || 'Anillo'}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsExitModalOpen(false)} style={{ padding: '10px 16px', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '6px' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600' }}>Confirmar Salida</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
