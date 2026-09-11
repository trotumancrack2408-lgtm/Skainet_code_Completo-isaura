import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/workshop_provider.dart';
import '../../providers/client_provider.dart';
import '../../widgets/widgets.dart';
import '../login_screen.dart';
import '../client_order_form.dart';
import '../tracking_screen.dart';
import 'user_management_screen.dart';

class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});
  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  final _entryCtrl = TextEditingController();
  final _exitCtrl = TextEditingController();
  final _countCtrl = TextEditingController();
  final _pinCtrl = TextEditingController();
  final _wAnillo = TextEditingController();
  final _wPlastilina = TextEditingController();
  final _wBolsa = TextEditingController();
  final _rAnillo = TextEditingController();
  final _rPlastilina = TextEditingController();
  final _rBolsa = TextEditingController();
  final _rPin = TextEditingController();
  final _rExplanation = TextEditingController();

  String? _selectedRingId;
  String? _selectedExecutorId;
  String? _selectedReturnOrderId;
  String? _expandedClientOrderId;
  int _currentIndex = 0;

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
    final cp = context.watch<ClientProvider>();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(center: Alignment.topRight, radius: 1.5, colors: [Color(0xFF1A1A1A), Colors.black]),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // ── Fixed Header ──
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      RichText(text: const TextSpan(children: [
                        TextSpan(text: 'SKYNET ', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: 3, color: Colors.white)),
                        TextSpan(text: 'WORKSHOP', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: 3, color: AppColors.gold)),
                      ])),
                      const SizedBox(height: 4),
                      Text('Sesión: ${auth.currentUser?.name ?? ''} (Admin)', style: const TextStyle(color: AppColors.textGray, fontSize: 13)),
                    ]),
                    IconButton(onPressed: _logout, icon: const Icon(Icons.logout, color: AppColors.gold)),
                  ],
                ),
              ),

              // ── Active Body ──
              Expanded(
                child: _currentIndex == 0
                    ? CustomScrollView(
                        slivers: [
                          SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverList(delegate: SliverChildListDelegate([
                  // ── Alerts ──
                  if (ws.alerts.isNotEmpty) ...[
                    GlassCard(
                      borderColor: AppColors.danger,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Row(children: [
                          Icon(Icons.notifications_active, color: AppColors.danger, size: 16),
                          SizedBox(width: 8),
                          Text('VIGILANTE DIGITAL', style: TextStyle(color: AppColors.danger, fontSize: 12, fontWeight: FontWeight.w700)),
                        ]),
                        const SizedBox(height: 12),
                        ...ws.alerts.take(5).map((a) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.black26,
                            borderRadius: BorderRadius.circular(8),
                            border: Border(left: BorderSide(color: a.isCritical ? AppColors.danger : AppColors.warning, width: 3)),
                          ),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                              Text(a.type, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: a.isCritical ? AppColors.danger : AppColors.warning)),
                              Text(a.timestamp.length > 10 ? a.timestamp.substring(11, 19) : '', style: const TextStyle(fontSize: 11, color: Colors.white38)),
                            ]),
                            const SizedBox(height: 4),
                            Text(a.message, style: const TextStyle(fontSize: 12, color: AppColors.textGray)),
                          ]),
                        )),
                      ]),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // ── Stats ──
                  const SectionHeader(title: 'ANALÍTICA SKYNET', emoji: '📊'),
                  GridView.count(
                    crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 1.8,
                    children: [
                      StatCard(label: 'MERMA TOTAL', value: '${ws.stats.totalLoss}g', valueColor: AppColors.gold),
                      StatCard(label: 'REPORTADAS', value: '${ws.stats.incidentCount}', valueColor: ws.stats.incidentCount > 0 ? AppColors.danger : Colors.white),
                      StatCard(label: 'TERMINADAS', value: '${ws.stats.totalProduced}', valueColor: Colors.white),
                      StatCard(label: 'EN MESA', value: '${ws.stats.activeWork}', valueColor: AppColors.success),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // ── New Order Button ──
                  GoldButton(
                    label: 'AGREGAR PEDIDO NUEVO',
                    icon: Icons.person_add,
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ClientOrderFormScreen())),
                  ),
                  const SizedBox(height: 20),

                  // ── Pending Client Orders ──
                  const Text('PEDIDOS EN ESPERA', style: TextStyle(fontSize: 11, color: AppColors.textMuted, letterSpacing: 1)),
                  const SizedBox(height: 10),
                  ...cp.pendingOrders.map((o) => GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => TrackingScreen(initialCode: o.shortId))),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.cardBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.goldDim),
                      ),
                      child: Row(children: [
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(o.clientName, style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w700, fontSize: 14)),
                          Text('${o.design} — ${o.estimatedWeight}g', style: const TextStyle(color: AppColors.textGray, fontSize: 12)),
                        ])),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: AppColors.goldDim, borderRadius: BorderRadius.circular(4), border: Border.all(color: AppColors.borderGlass)),
                          child: Text('P-${o.shortId}', style: const TextStyle(color: AppColors.gold, fontSize: 11)),
                        ),
                      ]),
                    ),
                  )),
                  if (cp.pendingOrders.isEmpty)
                    const Padding(padding: EdgeInsets.all(16), child: Text('No hay pedidos pendientes.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted))),
                  const SizedBox(height: 24),

                  // ── Batch Creation ──
                  const SectionHeader(title: 'CONTROL DE FUNDICIÓN'),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(border: Border.all(color: AppColors.borderGlass, width: 0.5)),
                    child: Column(children: [
                      Row(children: [
                        Expanded(child: TextField(controller: _entryCtrl, keyboardType: TextInputType.number, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: Colors.white), decoration: const InputDecoration(hintText: 'ENT. CERA (g)', border: InputBorder.none, isDense: true))),
                        Expanded(child: TextField(controller: _exitCtrl, keyboardType: TextInputType.number, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: Colors.white), decoration: const InputDecoration(hintText: 'SAL. ARBOL (g)', border: InputBorder.none, isDense: true))),
                        SizedBox(width: 60, child: TextField(controller: _countCtrl, keyboardType: TextInputType.number, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: Colors.white), decoration: const InputDecoration(hintText: 'PZAS', border: InputBorder.none, isDense: true))),
                        ElevatedButton(
                          onPressed: () async {
                            final e = double.tryParse(_entryCtrl.text); final x = double.tryParse(_exitCtrl.text); final c = int.tryParse(_countCtrl.text);
                            if (e == null || x == null || c == null) return;
                            await ws.createBatch(e, x, c);
                            _entryCtrl.clear(); _exitCtrl.clear(); _countCtrl.clear();
                            if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lote creado ✅')));
                          },
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.gold, foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12)),
                          child: const Text('+ LOTE', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                        ),
                      ]),
                    ]),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 36,
                    child: ListView(scrollDirection: Axis.horizontal, children: ws.batches.map((b) => Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(color: const Color(0xFF111111), border: Border.all(color: AppColors.borderGlass)),
                      child: RichText(text: TextSpan(style: const TextStyle(fontSize: 12, color: AppColors.textMuted), children: [
                        TextSpan(text: 'ID ${b.id.substring(b.id.length - 4)} ', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold)),
                        TextSpan(text: '| ${b.entryWeight}g → '),
                        TextSpan(text: '${b.exitWeight}g', style: const TextStyle(color: AppColors.gold)),
                        TextSpan(text: ' | ${b.ringsCount}un'),
                      ])),
                    )).toList()),
                  ),
                  const SizedBox(height: 32),

                  // ── Despacho ──
                  GlassCard(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        const Text('Despacho de Material', style: TextStyle(color: AppColors.gold, fontSize: 16, fontWeight: FontWeight.w700)),
                        if (_selectedRingId != null)
                          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                            const Text('BALANCE', style: TextStyle(color: AppColors.textGray, fontSize: 10, letterSpacing: 2)),
                            Text('${_calcDespachoTotal().toStringAsFixed(2)}g', style: const TextStyle(color: AppColors.gold, fontSize: 22, fontWeight: FontWeight.w700)),
                          ]),
                      ]),
                      const SizedBox(height: 16),
                      if (ws.pendingRings.isEmpty)
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
                          const SizedBox(height: 20),
                          DropdownButtonFormField<String>(
                            value: _selectedExecutorId,
                            decoration: const InputDecoration(labelText: 'ASIGNAR A...', isDense: true),
                            dropdownColor: AppColors.cardBg,
                            items: auth.availableJoyeros.map((u) => DropdownMenuItem(value: u.id, child: Text(u.name))).toList(),
                            onChanged: (v) => setState(() => _selectedExecutorId = v),
                          ),
                          const SizedBox(height: 16),
                          WeightInputRow(label: 'ANILLO', controller: _wAnillo, primary: true),
                          const SizedBox(height: 8),
                          WeightInputRow(label: 'PLASTILINA', controller: _wPlastilina),
                          const SizedBox(height: 8),
                          WeightInputRow(label: 'BOLSA', controller: _wBolsa),
                          const SizedBox(height: 16),
                          PinInput(label: 'CLAVE AUTORIZACIÓN:', controller: _pinCtrl),
                          const SizedBox(height: 16),
                          GoldButton(label: 'CONFIRMAR Y ACTIVAR CRONÓMETRO', icon: Icons.check_circle, onPressed: _executeDespacho),
                        ],
                      ],
                    ]),
                  ),
                  const SizedBox(height: 24),

                  // ── Cierre / Retorno ──
                  if (ws.orders.isNotEmpty) ...[
                    GlassCard(
                      borderColor: AppColors.success,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('Cierre de Seguridad (Retorno)', style: TextStyle(color: AppColors.gold, fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          value: _selectedReturnOrderId,
                          decoration: const InputDecoration(labelText: 'PIEZA ACTIVA...', isDense: true),
                          dropdownColor: AppColors.cardBg,
                          items: ws.activeOrders.map((o) => DropdownMenuItem(
                            value: o.id,
                            child: Text('${auth.getUserName(o.executorId) ?? '?'} - ${o.ringName}'),
                          )).toList(),
                          onChanged: (v) => setState(() => _selectedReturnOrderId = v),
                        ),
                        const SizedBox(height: 16),
                        WeightInputRow(label: 'ANILLO FINAL', controller: _rAnillo, primary: true),
                        const SizedBox(height: 8),
                        WeightInputRow(label: 'PLASTILINA REC.', controller: _rPlastilina),
                        const SizedBox(height: 8),
                        WeightInputRow(label: 'BOLSA / RETAL', controller: _rBolsa),
                        if (_selectedReturnOrderId != null && _calcReturnLoss() > 0.05) ...[
                          const SizedBox(height: 12),
                          const Text('⚠️ ANOMALÍA DETECTADA', style: TextStyle(color: AppColors.danger, fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          TextField(controller: _rExplanation, maxLines: 3, decoration: const InputDecoration(hintText: 'Explicación del incidente...', border: OutlineInputBorder())),
                        ],
                        const SizedBox(height: 16),
                        PinInput(label: 'CLAVE DE RECIBIDO:', controller: _rPin),
                        const SizedBox(height: 16),
                        GoldButton(label: 'FINALIZAR Y DETENER TIEMPO', icon: Icons.check_circle, color: AppColors.success, textColor: Colors.white, onPressed: _executeReturn),
                      ]),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Joyeros Panel ──
                  const SectionHeader(title: 'Panel de Control Taller'),
                  GridView.count(
                    crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.85,
                    children: auth.joyeros.map((j) {
                      final order = ws.orders.where((o) => o.executorId == j.id && o.isOpen).firstOrNull;
                      final status = order != null ? 'En Proceso' : j.status;
                      return GlassCard(
                        borderColor: status == 'Disponible' ? AppColors.gold : status == 'En Proceso' ? AppColors.warning : const Color(0xFF333333),
                        padding: const EdgeInsets.all(16),
                        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Icon(Icons.account_circle, size: 36, color: (status == 'Disponible' || status == 'En Proceso') ? AppColors.gold : Colors.grey),
                          const SizedBox(height: 8),
                          Text(j.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                          const SizedBox(height: 6),
                          StatusBadge(status: status),
                          if (order != null) ...[
                            const SizedBox(height: 8),
                            Text('${order.ringName} | ${order.totalWeight.toStringAsFixed(2)}g', style: const TextStyle(color: AppColors.gold, fontSize: 12)),
                          ],
                        ]),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 80),
                ])),
              )
            ])
                    : _currentIndex == 1
                        ? const UserManagementScreen()
                        : _currentIndex == 2
                            ? _buildReportsTab(ws, auth)
                            : _buildCustomJobsTab(cp),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Theme(
        data: Theme.of(context).copyWith(
          canvasColor: AppColors.cardBg,
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          selectedItemColor: AppColors.gold,
          unselectedItemColor: AppColors.textMuted,
          showUnselectedLabels: true,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.people_outline),
              activeIcon: Icon(Icons.people),
              label: 'Personal',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.analytics_outlined),
              activeIcon: Icon(Icons.analytics),
              label: 'Reportes',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.diamond_outlined),
              activeIcon: Icon(Icons.diamond),
              label: 'Personalizados',
            ),
          ],
        ),
      ),
    );
  }

  double _calcDespachoTotal() => (double.tryParse(_wAnillo.text) ?? 0) + (double.tryParse(_wPlastilina.text) ?? 0) + (double.tryParse(_wBolsa.text) ?? 0);

  double _calcReturnLoss() {
    if (_selectedReturnOrderId == null) return 0;
    final ws = context.read<WorkshopProvider>();
    final order = ws.orders.where((o) => o.id == _selectedReturnOrderId).firstOrNull;
    if (order == null) return 0;
    final total = (double.tryParse(_rAnillo.text) ?? 0) + (double.tryParse(_rPlastilina.text) ?? 0) + (double.tryParse(_rBolsa.text) ?? 0);
    return order.totalWeight - total;
  }

  Future<void> _executeDespacho() async {
    if (_selectedRingId == null || _selectedExecutorId == null) return;
    final ws = context.read<WorkshopProvider>();
    final auth = context.read<AuthProvider>();
    try {
      await ws.createOrder(
        ringId: _selectedRingId!,
        receiverId: auth.currentUser!.id,
        executorId: _selectedExecutorId!,
        weights: {'anillo': double.tryParse(_wAnillo.text) ?? 0, 'plastilina': double.tryParse(_wPlastilina.text) ?? 0, 'bolsa': double.tryParse(_wBolsa.text) ?? 0},
        providedPin: _pinCtrl.text,
      );
      _wAnillo.clear(); _wPlastilina.clear(); _wBolsa.clear(); _pinCtrl.clear();
      setState(() { _selectedRingId = null; _selectedExecutorId = null; });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Material entregado. Cronómetro iniciado ✅')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.danger));
    }
  }

  Future<void> _executeReturn() async {
    if (_selectedReturnOrderId == null) return;
    final ws = context.read<WorkshopProvider>();
    try {
      final result = await ws.closeOrder(
        orderId: _selectedReturnOrderId!,
        weights: {'anillo': double.tryParse(_rAnillo.text) ?? 0, 'plastilina': double.tryParse(_rPlastilina.text) ?? 0, 'bolsa': double.tryParse(_rBolsa.text) ?? 0},
        explanation: _rExplanation.text.isNotEmpty ? _rExplanation.text : null,
        providedPin: _rPin.text,
      );
      _rAnillo.clear(); _rPlastilina.clear(); _rBolsa.clear(); _rPin.clear(); _rExplanation.clear();
      setState(() => _selectedReturnOrderId = null);
      final msg = result['newGeneratedPin'] != null ? 'Cierre exitoso. Nuevo PIN: ${result['newGeneratedPin']}' : 'Cierre exitoso ✅';
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.danger));
    }
  }

  Widget _buildReportsTab(WorkshopProvider ws, AuthProvider auth) {
    final closed = ws.orders.where((o) => o.status == 'CLOSED' || !o.isOpen).toList();
    return RefreshIndicator(
      onRefresh: () => ws.fetchAll(),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const SectionHeader(title: 'CENTRO DE REPORTES', emoji: '📊'),
          const Text('Descarga y auditoría general de mermas y asistencia técnica.', style: TextStyle(color: AppColors.textGray, fontSize: 13)),
          const SizedBox(height: 20),
          
          GridView.count(
            crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 1.8,
            children: [
              StatCard(label: 'MERMA TOTAL', value: '${ws.stats.totalLoss}g', valueColor: AppColors.gold),
              StatCard(label: 'REPORTADAS', value: '${ws.stats.incidentCount}', valueColor: ws.stats.incidentCount > 0 ? AppColors.danger : Colors.white),
              StatCard(label: 'TERMINADAS', value: '${ws.stats.totalProduced}', valueColor: Colors.white),
              StatCard(label: 'EN MESA', value: '${ws.stats.activeWork}', valueColor: AppColors.success),
            ],
          ),
          const SizedBox(height: 24),
          
          const Text('CENTRO DE DESCARGAS (CSV)', style: TextStyle(fontSize: 11, color: AppColors.textMuted, letterSpacing: 1)),
          const SizedBox(height: 10),
          
          GoldButton(
            label: 'EXPORTAR REPORTES OPERATIVOS',
            icon: Icons.download_for_offline_outlined,
            onPressed: () => _exportOperations(ws, auth),
          ),
          const SizedBox(height: 10),
          GoldButton(
            label: 'EXPORTAR HISTORIAL DE TURNOS',
            icon: Icons.history_toggle_off,
            onPressed: () => _exportAttendance(auth),
          ),
          
          const SizedBox(height: 32),
          const Text('HISTORIAL RECIENTE', style: TextStyle(fontSize: 11, color: AppColors.textMuted, letterSpacing: 1)),
          const SizedBox(height: 10),
          
          if (closed.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Center(child: Text('No hay operaciones terminadas registradas.', style: TextStyle(color: AppColors.textMuted))),
            )
          else
            ...closed.map((o) {
              final name = auth.getUserName(o.executorId) ?? 'Desconocido';
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.cardBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderGlass),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(o.ringName, style: const TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('Por: $name', style: const TextStyle(color: AppColors.textGray, fontSize: 12)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('${o.loss ?? 0}g merma', style: TextStyle(color: (o.loss ?? 0) > 0.05 ? AppColors.danger : AppColors.success, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('${o.durationMinutes ?? 0} min', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                      ],
                    ),
                  ],
                ),
              );
            }),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _buildCustomJobsTab(ClientProvider cp) {
    final activeOrders = cp.activeOrders;
    return RefreshIndicator(
      onRefresh: () => cp.fetchClientOrders(),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const SectionHeader(title: 'TRABAJOS PERSONALIZADOS', emoji: '💎'),
          const Text('Monitoreo e interactividad para el avance de piezas bajo pedido.', style: TextStyle(color: AppColors.textGray, fontSize: 13)),
          const SizedBox(height: 20),
          
          if (activeOrders.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(child: Text('No hay trabajos personalizados en curso.', style: TextStyle(color: AppColors.textMuted))),
            )
          else
            ...activeOrders.map((order) {
              final isExpanded = _expandedClientOrderId == order.id;
              final currentIndex = order.currentStepIndex;
              final steps = StepProgress.steps;
              
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: AppColors.cardBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isExpanded ? AppColors.gold : AppColors.borderGlass),
                ),
                child: InkWell(
                  onTap: () => setState(() => _expandedClientOrderId = isExpanded ? null : order.id),
                  borderRadius: BorderRadius.circular(16),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(order.clientName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                                  const SizedBox(height: 4),
                                  Text('CÓD: P-${order.shortId} | ${order.design}', style: const TextStyle(color: AppColors.textGray, fontSize: 12)),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.goldDim,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${currentIndex + 1}. ${steps[currentIndex]}',
                                style: const TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        if (isExpanded) ...[
                          const Divider(color: Colors.white12, height: 24),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.black38,
                              borderRadius: BorderRadius.circular(8),
                              border: const Border(left: BorderSide(color: Colors.blueAccent, width: 3)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                RichText(
                                  text: TextSpan(
                                    style: const TextStyle(fontSize: 12, color: AppColors.textGray),
                                    children: [
                                      const TextSpan(text: 'Instrucciones: ', style: TextStyle(fontWeight: FontWeight.bold)),
                                      TextSpan(text: order.design),
                                      const TextSpan(text: ' — Peso estimado: ', style: TextStyle(fontWeight: FontWeight.bold)),
                                      TextSpan(text: '${order.estimatedWeight}g'),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          StepProgress(
                            currentStep: order.currentStepIndex,
                            interactive: true,
                            onStepTap: (index) async {
                              try {
                                await cp.updateStep(order.id, index);
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                    content: Text('Paso actualizado a: ${steps[index]} ✅'),
                                    backgroundColor: AppColors.success,
                                  ));
                                }
                              } catch (e) {
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                    content: Text('Error actualizando paso: $e'),
                                    backgroundColor: AppColors.danger,
                                  ));
                                }
                              }
                            },
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            }),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  void _exportOperations(WorkshopProvider ws, AuthProvider auth) {
    final closed = ws.orders.where((o) => o.status == 'CLOSED' || !o.isOpen).toList();
    if (closed.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("No hay operaciones cerradas para exportar.")));
      return;
    }
    String csv = "ID Orden,Joyero,Pieza,Fecha Inicio,Fecha Fin,Duracion (Min),Peso Inicial (g),Merma (g)\r\n";
    for (final o in closed) {
      final jewelerName = auth.getUserName(o.executorId) ?? 'Desconocido';
      final row = [
        o.id,
        jewelerName,
        '"${o.ringName}"',
        o.startTime,
        o.endTime ?? '',
        o.durationMinutes ?? 0,
        o.totalWeight,
        o.loss ?? 0,
      ].join(",");
      csv += "$row\r\n";
    }
    Clipboard.setData(ClipboardData(text: csv));
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
      content: Text("Reporte de operaciones copiado al portapapeles en formato CSV 📋"),
      backgroundColor: AppColors.success,
    ));
  }

  void _exportAttendance(AuthProvider auth) {
    String csv = "Joyero,Rol,Estado,Fecha y Hora Registro\r\n";
    bool hasRecords = false;
    final jewelers = auth.joyeros;
    for (final u in jewelers) {
      if (u.history != null && u.history!.isNotEmpty) {
        hasRecords = true;
        for (final h in u.history!) {
          final row = [
            u.name,
            u.role,
            h['status'] ?? '',
            h['timestamp'] ?? '',
          ].join(",");
          csv += "$row\r\n";
        }
      }
    }
    if (!hasRecords) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("No hay registros de asistencia para exportar.")));
      return;
    }
    Clipboard.setData(ClipboardData(text: csv));
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
      content: Text("Bitácora de asistencia copiada al portapapeles en formato CSV 📋"),
      backgroundColor: AppColors.success,
    ));
  }

  @override
  void dispose() {
    for (final c in [_entryCtrl, _exitCtrl, _countCtrl, _pinCtrl, _wAnillo, _wPlastilina, _wBolsa, _rAnillo, _rPlastilina, _rBolsa, _rPin, _rExplanation]) {
      c.dispose();
    }
    super.dispose();
  }
}
