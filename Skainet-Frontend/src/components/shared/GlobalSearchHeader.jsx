import React, { useState } from 'react';
import { Search, User, Package, FileText, X } from 'lucide-react';

export default function GlobalSearchHeader({ API_URL, token, currentUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const isJoyero = currentUser?.role === 'Joyero';
  const isLeader = currentUser?.position === 'Joyero Líder' || currentUser?.role === 'Lider de Taller';

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setIsOpen(true);
    try {
      const resp = await fetch(`${API_URL}/search?q=${encodeURIComponent(searchTerm)}&module=${moduleFilter}`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });

      if (resp.ok) {
        const data = await resp.json();
        setResults(data);
      }
    } catch (err) {
      console.error('Error en búsqueda avanzada:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '6px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder={isLeader ? "Buscar material u órdenes del taller..." : isJoyero ? "Buscar inventario u órdenes asignadas..." : "Búsqueda avanzada (Usuarios, Inventario, OT)..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 38px',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.85rem'
            }}
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          style={{ padding: '8px 10px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
        >
          <option value="all">Todo</option>
          {!isJoyero && <option value="usuarios">Usuarios</option>}
          <option value="inventario">Inventario</option>
          <option value="ordenes">Órdenes</option>
        </select>

        <button
          type="submit"
          style={{ padding: '8px 14px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Buscar
        </button>
      </form>

      {/* Results Dropdown / Modal */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '46px',
          left: 0,
          right: 0,
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '12px',
          padding: '16px',
          zIndex: 1500,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
          maxHeight: '400px',
          overflowY: 'auto',
          color: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #374151' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#9ca3af' }}>Resultados para "{searchTerm}"</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>

          {loading ? (
            <p style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>Buscando coincidencias...</p>
          ) : !results || (results.users?.length === 0 && results.materials?.length === 0 && results.orders?.length === 0) ? (
            <p style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>No se encontraron resultados para la búsqueda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Users Results */}
              {results.users?.length > 0 && (
                <div>
                  <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#60a5fa', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={14} /> Usuarios ({results.users.length})
                  </h5>
                  {results.users.map(u => (
                    <div key={u.id} style={{ padding: '8px 10px', backgroundColor: '#111827', borderRadius: '6px', marginBottom: '4px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>{u.name}</strong> ({u.id})</span>
                      <span style={{ color: '#9ca3af' }}>{u.role}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Materials Results */}
              {results.materials?.length > 0 && (
                <div>
                  <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#34d399', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Package size={14} /> Inventario / Materiales ({results.materials.length})
                  </h5>
                  {results.materials.map(m => (
                    <div key={m.id} style={{ padding: '8px 10px', backgroundColor: '#111827', borderRadius: '6px', marginBottom: '4px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>{m.name}</strong> ({m.category})</span>
                      <span style={{ color: '#34d399', fontWeight: 'bold' }}>{m.stock} {m.unit}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Orders Results */}
              {results.orders?.length > 0 && (
                <div>
                  <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#fbbf24', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={14} /> Órdenes de Trabajo ({results.orders.length})
                  </h5>
                  {results.orders.map(o => (
                    <div key={o.id} style={{ padding: '8px 10px', backgroundColor: '#111827', borderRadius: '6px', marginBottom: '4px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>OT #{o.id.slice(-6)} - <strong>{o.productionItemName || o.ringName || 'Pieza'}</strong></span>
                      <span style={{ color: '#fbbf24' }}>{o.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
