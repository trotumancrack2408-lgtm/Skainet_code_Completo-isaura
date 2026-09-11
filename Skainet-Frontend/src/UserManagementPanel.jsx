import React, { useState } from 'react';
import { UserCircle, Plus, Edit3, Lock, ShieldAlert, CheckCircle, X, KeyRound, Search, Filter } from 'lucide-react';

export default function UserManagementPanel({ allUsers = [], fetchUsers, API_URL, token, currentUser }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [documentType, setDocumentType] = useState('CC');
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, Activo, Inactivo

  const isSuperAdmin = currentUser?.role === 'Super Administrador' || currentUser?.role === 'Dueno';
  const targetRole = isSuperAdmin ? 'Administrador' : 'Joyero';

  // Filter users according to role hierarchy (RF-001)
  const managedUsers = allUsers.filter(u => {
    const roleMatches = isSuperAdmin ? u.role === 'Administrador' : u.role === 'Joyero';
    const statusMatches = statusFilter === 'ALL' || u.accountStatus === statusFilter;
    const queryMatches = !searchQuery || 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return roleMatches && statusMatches && queryMatches;
  });

  const openCreateForm = () => {
    setEditingUser(null);
    setDocumentType('CC');
    setUserId('');
    setName('');
    setEmail('');
    setPhone('');
    setPassword(Math.random().toString(36).slice(-8)); // Generar clave temporal sugerida
    setIsFormOpen(true);
  };

  const openEditForm = (user) => {
    setEditingUser(user);
    setDocumentType(user.documentType || 'CC');
    setUserId(user.id);
    setName(user.name);
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setPassword('');
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId || !name) {
      alert("El número de identificación y el nombre completo son obligatorios.");
      return;
    }

    const payload = {
      id: userId,
      documentType,
      name,
      email,
      phone,
      role: targetRole,
      password: editingUser ? undefined : (password || undefined),
    };

    setLoading(true);
    try {
      const url = editingUser ? `${API_URL}/users/${editingUser.id}` : `${API_URL}/users`;
      const method = editingUser ? 'PATCH' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        const result = await resp.json();
        if (!editingUser && result.tempPassword) {
          alert(`Usuario registrado exitosamente.\n\nContraseña temporal asignada: ${result.tempPassword}\n(Se solicitará cambio obligatorio en el primer inicio de sesión).`);
        } else {
          alert(editingUser ? "Usuario actualizado exitosamente" : "Usuario registrado exitosamente");
        }
        setIsFormOpen(false);
        fetchUsers();
      } else {
        const errorData = await resp.json();
        alert(`Error: ${errorData.message || 'No se pudo guardar el usuario'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // Baja lógica (RN-010, RF-001.4, RF-001.8)
  const handleDeactivate = async (userToDeactivate) => {
    if (userToDeactivate.id === currentUser?.id || userToDeactivate.id === currentUser?.sub) {
      alert("No es posible desactivar su propia cuenta. (RN-011)");
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas desactivar la cuenta de "${userToDeactivate.name}" (${userToDeactivate.id})?\n\nEsta acción es una baja lógica (RN-010) y el usuario no podrá iniciar sesión.`)) {
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/users/${userToDeactivate.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (resp.ok) {
        alert("Usuario desactivado exitosamente.");
        fetchUsers();
      } else {
        const errorData = await resp.json();
        alert(`Error: ${errorData.message || 'No se pudo desactivar el usuario'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    }
  };

  // Restablecer contraseña manual por Admin (RF-003)
  const handleResetPassword = async (userToReset) => {
    if (!window.confirm(`¿Deseas generar una nueva contraseña temporal para "${userToReset.name}"?`)) {
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/users/${userToReset.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (resp.ok) {
        const data = await resp.json();
        alert(`Contraseña restablecida correctamente.\n\nNueva clave temporal: ${data.tempPassword}\n(El usuario deberá cambiarla obligatoriamente en su próximo login).`);
      } else {
        const errData = await resp.json();
        alert(`Error: ${errData.message || 'No se pudo restablecer la contraseña'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCircle size={32} color="#3b82f6" /> 
            Gestión de {targetRole}es
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '4px' }}>
            {isSuperAdmin ? 'Administración jerárquica de cuentas de Administrador (RF-001.1 - RF-001.4)' : 'Gestión operativa de Joyeros del taller (RF-001.5 - RF-001.8)'}
          </p>
        </div>

        <button
          onClick={openCreateForm}
          style={{
            backgroundColor: '#2563eb',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}
        >
          <Plus size={18} /> Crear Nuevo {targetRole}
        </button>
      </div>

      {/* Bar: Filtros y Búsqueda */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, documento o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="#9ca3af" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
          >
            <option value="ALL">Todos los Estados</option>
            <option value="Activo">Solo Activos</option>
            <option value="Inactivo">Solo Inactivos</option>
          </select>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '520px',
            border: '1px solid #374151',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                {editingUser ? `Editar ${targetRole}` : `Registrar Nuevo ${targetRole}`}
              </h3>
              <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '110px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Tipo Doc *</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="PASAPORTE">PAS</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                    N° Identificación * {editingUser && '(Inmutable RN-004)'}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Ej. 1020304050"
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: editingUser ? '#374151' : '#111827',
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: editingUser ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Ramiro Pérez"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Correo Electrónico (Opcional/Informativo RN-006)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@skainet.com"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Teléfono de Contacto</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+573000000000"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              {!editingUser && (
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                    Contraseña Temporal Inicial (RN-012)
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#60a5fa', fontWeight: 'bold' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                    * Se exigirá cambio obligatorio de contraseña en el primer inicio de sesión (RN-013).
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{ padding: '10px 16px', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {loading ? 'Guardando...' : editingUser ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List Table */}
      <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', overflow: 'hidden', border: '1px solid #374151' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#111827', color: '#9ca3af', fontSize: '0.85rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 16px' }}>Identificación</th>
              <th style={{ padding: '14px 16px' }}>Nombre</th>
              <th style={{ padding: '14px 16px' }}>Correo</th>
              <th style={{ padding: '14px 16px' }}>Teléfono</th>
              <th style={{ padding: '14px 16px' }}>Estado Cuenta</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {managedUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                  No se encontraron {targetRole}es registrados con los criterios ingresados.
                </td>
              </tr>
            ) : (
              managedUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #374151' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                    <span style={{ color: '#9ca3af', fontSize: '0.8rem', marginRight: '6px' }}>{u.documentType || 'CC'}</span>
                    {u.id}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '500' }}>{u.name}</td>
                  <td style={{ padding: '14px 16px', color: '#9ca3af' }}>{u.email || '-'}</td>
                  <td style={{ padding: '14px 16px', color: '#9ca3af' }}>{u.phone || '-'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      backgroundColor: u.accountStatus === 'Inactivo' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                      color: u.accountStatus === 'Inactivo' ? '#f87171' : '#4ade80',
                      border: u.accountStatus === 'Inactivo' ? '1px solid #ef4444' : '1px solid #22c55e'
                    }}>
                      {u.accountStatus || 'Activo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        title="Editar Datos"
                        onClick={() => openEditForm(u)}
                        style={{ padding: '6px 10px', backgroundColor: '#374151', color: '#60a5fa', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        title="Restablecer Contraseña (RN-012)"
                        onClick={() => handleResetPassword(u)}
                        style={{ padding: '6px 10px', backgroundColor: '#374151', color: '#f59e0b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <KeyRound size={16} />
                      </button>

                      {u.accountStatus !== 'Inactivo' && (
                        <button
                          title="Desactivar Cuenta (Baja Lógica RN-010)"
                          onClick={() => handleDeactivate(u)}
                          style={{ padding: '6px 10px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <Lock size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
