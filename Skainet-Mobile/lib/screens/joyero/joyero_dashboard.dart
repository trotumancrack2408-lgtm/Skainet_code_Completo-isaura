import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/workshop_provider.dart';
import '../../providers/client_provider.dart';
import '../../widgets/widgets.dart';
import '../login_screen.dart';

class JoyeroDashboard extends StatefulWidget {
  const JoyeroDashboard({super.key});
  @override
  State<JoyeroDashboard> createState() => _JoyeroDashboardState();
}

class _JoyeroDashboardState extends State<JoyeroDashboard> {
  final _wAnillo = TextEditingController();
  final _wPlastilina = TextEditingController();
  final _wBolsa = TextEditingController();
  final _pinCtrl = TextEditingController();
  final _rAnillo = TextEditingController();
  final _rPlastilina = TextEditingController();
  final _rBolsa = TextEditingController();
  final _rPin = TextEditingController();
  final _rExplanation = TextEditingController();

  String? _selectedRingId;
  String? _selectedReturnOrderId;

  @override
  void initState() {
    super.initState();
    context.read<ClientProvider>().fetchClientOrders();
  }

  void _logout() {
    context.read<WorkshopProvider>().stopPolling();
    context.read<AuthProvider>().logout();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final ws = context.watch<WorkshopProvider>();
    final user = auth.currentUser!;
    final hasActiveOrder = ws.hasActiveOrder(user.id);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(center: Alignment.topRight, radius: 1.5, colors: [Color(0xFF1A1A1A), Colors.black]),
        ),
        child: SafeArea(
          child: ListView(padding: const EdgeInsets.all(20), children: [
            // ── Header ──
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                RichText(text: const TextSpan(children: [
                  TextSpan(text: 'SKYNET ', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: 3, color: Colors.white)),
                  TextSpan(text: 'WORKSHOP', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: 3, color: AppColors.gold)),
                ])),
                const SizedBox(height: 4),
                Text('Sesión: ${user.name} (${user.role})', style: const TextStyle(color: AppColors.textGray, fontSize: 13)),
              ]),
              IconButton(onPressed: _logout, icon: const Icon(Icons.logout, color: AppColors.gold)),
            ]),
            const SizedBox(height: 24),

            // ── Status ──
            GlassCard(
              child: Column(children: [
                const Text('Tu Estado Actual', style: TextStyle(color: AppColors.gold, fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                StatusBadge(status: user.status),
                const SizedBox(height: 20),
                if (user.status == 'Fuera de Turno')
                  GoldButton(label: 'ENTRAR EN SERVICIO', icon: Icons.power_settings_new, onPressed: () => auth.updateStatus('Disponible'))
                else ...[
                  GoldButton(label: 'SALIR DE TURNO', color: AppColors.danger, textColor: Colors.white, onPressed: () => auth.updateStatus('Fuera de Turno')),
                  const SizedBox(height: 8),
                  GoldButton(label: 'EN PAUSA', color: AppColors.warning, textColor: Colors.white, onPressed: () => auth.updateStatus('En Pausa')),
                ],
              ]),
            ),
            const SizedBox(height: 24),

            // ── Despacho ──
            GlassCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Despacho de Material', style: TextStyle(color: AppColors.gold, fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                if (hasActiveOrder)
                  Container(
                    padding: const EdgeInsets.all(24),
                    child: Column(children: [
                      const Text('⚠️ LÍMITE DE MESA ALCANZADO', style: TextStyle(color: AppColors.warning, fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      const Text('Ya tienes una pieza bajo tu responsabilidad. Retorna el material primero.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted)),
                    ]),
                  )
                else if (ws.pendingRings.isEmpty)
                  const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('No hay piezas disponibles.', style: TextStyle(color: AppColors.textMuted))))
                else ...[
                  Wrap(spacing: 8, runSpacing: 8, children: ws.pendingRings.map((r) {
                    final sel = _selectedRingId == r.id;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedRingId = r.id),
                      child: Container(
                        width: 100, padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: sel ? AppColors.gold : AppColors.goldDim,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: sel ? AppColors.gold : AppColors.borderGlass),
                        ),
                        child: Column(children: [
                          Text(r.name, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: sel ? Colors.black : AppColors.gold)),
                          const SizedBox(height: 4),
                          Text(sel ? '★ SEL.' : '👆 TOMAR', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: sel ? Colors.black54 : Colors.white54)),
                        ]),
                      ),
                    );
                  }).toList()),
                  if (_selectedRingId != null) ...[
                    const SizedBox(height: 16),
                    WeightInputRow(label: 'ANILLO', controller: _wAnillo, primary: true),
                    const SizedBox(height: 8),
                    WeightInputRow(label: 'PLASTILINA', controller: _wPlastilina),
                    const SizedBox(height: 8),
                    WeightInputRow(label: 'BOLSA', controller: _wBolsa),
                    const SizedBox(height: 12),
                    PinInput(label: 'CLAVE AUTORIZACIÓN:', controller: _pinCtrl),
                    const SizedBox(height: 12),
                    GoldButton(label: 'CONFIRMAR Y ACTIVAR CRONÓMETRO', icon: Icons.check_circle, onPressed: () async {
                      try {
                        await ws.createOrder(
                          ringId: _selectedRingId!,
                          receiverId: user.id,
                          executorId: user.id,
                          weights: {'anillo': double.tryParse(_wAnillo.text) ?? 0, 'plastilina': double.tryParse(_wPlastilina.text) ?? 0, 'bolsa': double.tryParse(_wBolsa.text) ?? 0},
                          providedPin: _pinCtrl.text,
                        );
                        _wAnillo.clear(); _wPlastilina.clear(); _wBolsa.clear(); _pinCtrl.clear();
                        setState(() => _selectedRingId = null);
                        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cronómetro iniciado ✅')));
                      } catch (e) {
                        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.danger));
                      }
                    }),
                  ],
                ],
              ]),
            ),
            const SizedBox(height: 24),

            // ── Return ──
            if (ws.activeOrders.isNotEmpty) ...[
              GlassCard(
                borderColor: AppColors.success,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Cierre de Seguridad (Retorno)', style: TextStyle(color: AppColors.gold, fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _selectedReturnOrderId,
                    decoration: const InputDecoration(labelText: 'PIEZA ACTIVA...', isDense: true),
                    dropdownColor: AppColors.cardBg,
                    items: ws.activeOrders.map((o) => DropdownMenuItem(value: o.id, child: Text('${auth.getUserName(o.executorId) ?? '?'} - ${o.ringName}'))).toList(),
                    onChanged: (v) => setState(() => _selectedReturnOrderId = v),
                  ),
                  const SizedBox(height: 16),
                  WeightInputRow(label: 'ANILLO FINAL', controller: _rAnillo, primary: true),
                  const SizedBox(height: 8),
                  WeightInputRow(label: 'PLASTILINA REC.', controller: _rPlastilina),
                  const SizedBox(height: 8),
                  WeightInputRow(label: 'BOLSA / RETAL', controller: _rBolsa),
                  const SizedBox(height: 12),
                  PinInput(label: 'CLAVE DE RECIBIDO:', controller: _rPin),
                  const SizedBox(height: 12),
                  GoldButton(label: 'FINALIZAR Y DETENER TIEMPO', icon: Icons.check_circle, color: AppColors.success, textColor: Colors.white, onPressed: () async {
                    if (_selectedReturnOrderId == null) return;
                    try {
                      final result = await ws.closeOrder(
                        orderId: _selectedReturnOrderId!,
                        weights: {'anillo': double.tryParse(_rAnillo.text) ?? 0, 'plastilina': double.tryParse(_rPlastilina.text) ?? 0, 'bolsa': double.tryParse(_rBolsa.text) ?? 0},
                        explanation: _rExplanation.text.isNotEmpty ? _rExplanation.text : null,
                        providedPin: _rPin.text,
                      );
                      _rAnillo.clear(); _rPlastilina.clear(); _rBolsa.clear(); _rPin.clear(); _rExplanation.clear();
                      setState(() => _selectedReturnOrderId = null);
                      final msg = result['newGeneratedPin'] != null ? 'Nuevo PIN: ${result['newGeneratedPin']}' : 'Cierre exitoso ✅';
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
                    } catch (e) {
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.danger));
                    }
                  }),
                ]),
              ),
            ],
            const SizedBox(height: 80),
          ]),
        ),
      ),
    );
  }

  @override
  void dispose() {
    for (final c in [_wAnillo, _wPlastilina, _wBolsa, _pinCtrl, _rAnillo, _rPlastilina, _rBolsa, _rPin, _rExplanation]) { c.dispose(); }
    super.dispose();
  }
}
