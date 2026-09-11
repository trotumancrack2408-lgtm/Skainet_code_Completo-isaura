import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/widgets.dart';

class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  final _idCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  String _selectedRole = 'Joyero';

  final List<String> _roles = [
    'Administrador',
    'Joyero',
    'Dueno',
    'Lider de Taller',
  ];

  Future<void> _addUser() async {
    if (_idCtrl.text.isEmpty || _nameCtrl.text.isEmpty || _passCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('ID, Nombre y Contraseña son obligatorios'),
          backgroundColor: AppColors.danger,
        ),
      );
      return;
    }

    final auth = context.read<AuthProvider>();
    try {
      await auth.createUser(
        id: _idCtrl.text.trim(),
        name: _nameCtrl.text.trim(),
        role: _selectedRole,
        password: _passCtrl.text,
        phone: _phoneCtrl.text.isNotEmpty ? _phoneCtrl.text.trim() : null,
      );
      _idCtrl.clear();
      _nameCtrl.clear();
      _passCtrl.clear();
      _phoneCtrl.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Usuario registrado con éxito ✅')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  void _confirmDelete(String userId, String userName) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E1E),
        title: const Text('Confirmar Eliminación', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.bold)),
        content: Text('¿Estás seguro de que deseas eliminar a $userName? Esta acción no se puede deshacer.', style: const TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger, foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(context);
              try {
                await context.read<AuthProvider>().deleteUser(userId);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Usuario eliminado con éxito')),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error al eliminar: $e'), backgroundColor: AppColors.danger),
                  );
                }
              }
            },
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return CustomScrollView(
      slivers: [
        // ── Formulario de Registro ──
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: GlassCard(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'REGISTRAR NUEVO USUARIO',
                    style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 2),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _idCtrl,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: const InputDecoration(
                            labelText: 'CÓDIGO / ID',
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedRole,
                          decoration: const InputDecoration(labelText: 'ROL', isDense: true),
                          dropdownColor: AppColors.cardBg,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          items: _roles.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                          onChanged: (v) => setState(() => _selectedRole = v!),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _nameCtrl,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    decoration: const InputDecoration(
                      labelText: 'NOMBRE COMPLETO',
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _passCtrl,
                          obscureText: true,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: const InputDecoration(
                            labelText: 'CONTRASEÑA',
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: _phoneCtrl,
                          keyboardType: TextInputType.phone,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: const InputDecoration(
                            labelText: 'TELÉFONO (OPCIONAL)',
                            isDense: true,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: GoldButton(
                      label: auth.loading ? 'REGISTRANDO...' : 'REGISTRAR USUARIO',
                      icon: Icons.person_add_alt_1,
                      onPressed: auth.loading ? null : _addUser,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        // ── Lista de Usuarios ──
        const SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(20, 16, 20, 8),
            child: Text(
              'PERSONAL REGISTRADO',
              style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 1),
            ),
          ),
        ),

        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final user = auth.allUsers[index];
                final isSelf = user.id == auth.currentUser?.id;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.cardBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.borderSubtle),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: user.isAdmin ? AppColors.gold.withOpacity(0.15) : Colors.white.withOpacity(0.05),
                          border: Border.all(color: user.isAdmin ? AppColors.gold : Colors.white10),
                        ),
                        child: Icon(
                          user.isAdmin ? Icons.shield : Icons.person,
                          color: user.isAdmin ? AppColors.gold : Colors.white60,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.name,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${user.role}  •  ID: ${user.id}',
                              style: const TextStyle(color: AppColors.textGray, fontSize: 12),
                            ),
                            if (user.phone != null && user.phone!.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                '📱 ${user.phone}',
                                style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                              ),
                            ],
                          ],
                        ),
                      ),
                      if (!isSelf)
                        IconButton(
                          onPressed: () => _confirmDelete(user.id, user.name),
                          icon: const Icon(Icons.delete_outline, color: AppColors.danger, size: 20),
                        ),
                    ],
                  ),
                );
              },
              childCount: auth.allUsers.length,
            ),
          ),
        ),
        const SliverToBoxAdapter(
          child: SizedBox(height: 80),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _idCtrl.dispose();
    _nameCtrl.dispose();
    _passCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }
}
