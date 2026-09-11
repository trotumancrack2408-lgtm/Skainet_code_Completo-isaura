import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../models/models.dart';
import '../providers/client_provider.dart';
import '../widgets/widgets.dart';

class TrackingScreen extends StatefulWidget {
  final String? initialCode;
  const TrackingScreen({super.key, this.initialCode});
  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  final _queryCtrl = TextEditingController();
  ClientOrder? _found;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.initialCode != null) {
      _queryCtrl.text = widget.initialCode!;
      _search();
    }
  }

  Future<void> _search() async {
    if (_queryCtrl.text.isEmpty) return;
    setState(() { _loading = true; _error = null; _found = null; });
    final cp = context.read<ClientProvider>();
    await cp.fetchClientOrders();
    final found = cp.findByShortId(_queryCtrl.text);
    setState(() {
      _loading = false;
      _found = found;
      if (found == null) _error = 'No se ha encontrado ninguna orden con este código.';
    });
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'COMPLETED': return AppColors.success;
      case 'IN_PRODUCTION': return AppColors.warning;
      default: return AppColors.gold;
    }
  }

  String _statusText(String status) {
    switch (status) {
      case 'COMPLETED': return 'Listo para Entregar';
      case 'IN_PRODUCTION': return 'En Producción / Taller';
      default: return 'En Espera de Taller';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(center: Alignment.topRight, radius: 1.5, colors: [Color(0xFF1A1A1A), Colors.black]),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: GlassCard(
                padding: const EdgeInsets.all(28),
                child: Column(children: [
                  Row(children: [
                    IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.arrow_back, color: AppColors.gold)),
                    Expanded(child: RichText(textAlign: TextAlign.center, text: const TextSpan(children: [
                      TextSpan(text: 'SKYNET ', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: 2, color: Colors.white)),
                      TextSpan(text: 'TRACKING', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: 2, color: AppColors.gold)),
                    ]))),
                    const SizedBox(width: 48),
                  ]),
                  const SizedBox(height: 6),
                  const Text('Sigue el progreso de tu pieza de joyería', style: TextStyle(color: AppColors.textGray, fontSize: 13)),
                  const SizedBox(height: 24),

                  // Search
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(color: Colors.black45, borderRadius: BorderRadius.circular(8)),
                    child: TextField(
                      controller: _queryCtrl,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 16, letterSpacing: 2),
                      decoration: const InputDecoration(border: InputBorder.none, hintText: 'Introduce tu Código de Orden'),
                      onSubmitted: (_) => _search(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  GoldButton(label: _loading ? 'Cargando...' : 'RASTREAR PIEZA', icon: Icons.search, onPressed: _loading ? null : _search),

                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    Text(_error!, style: const TextStyle(color: AppColors.danger)),
                  ],

                  if (_found != null) ...[
                    const SizedBox(height: 24),
                    GlassCard(
                      borderColor: _statusColor(_found!.status),
                      child: Column(children: [
                        Icon(Icons.inventory_2, size: 40, color: _statusColor(_found!.status)),
                        const SizedBox(height: 8),
                        Text(_found!.design, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        RichText(text: TextSpan(children: [
                          const TextSpan(text: 'A nombre de: ', style: TextStyle(color: AppColors.textGray)),
                          TextSpan(text: _found!.clientName, style: const TextStyle(fontWeight: FontWeight.bold)),
                        ])),
                        const Divider(color: Colors.white12, height: 28),
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            const Text('ESTADO ACTUAL', style: TextStyle(fontSize: 11, color: AppColors.textGray)),
                            const SizedBox(height: 4),
                            Row(children: [
                              Icon(_found!.isCompleted ? Icons.check_circle : Icons.access_time, size: 16, color: _statusColor(_found!.status)),
                              const SizedBox(width: 6),
                              Text(_statusText(_found!.status), style: TextStyle(color: _statusColor(_found!.status), fontWeight: FontWeight.w700, letterSpacing: 1, fontSize: 13)),
                            ]),
                          ]),
                          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                            const Text('PESO EST.', style: TextStyle(fontSize: 11, color: AppColors.textGray)),
                            const SizedBox(height: 4),
                            Text('${_found!.estimatedWeight}g', style: const TextStyle(fontWeight: FontWeight.bold)),
                          ]),
                        ]),
                        const SizedBox(height: 20),
                        StepProgress(currentStep: _found!.isCompleted ? 11 : _found!.currentStepIndex),
                      ]),
                    ),
                  ],
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() { _queryCtrl.dispose(); super.dispose(); }
}
