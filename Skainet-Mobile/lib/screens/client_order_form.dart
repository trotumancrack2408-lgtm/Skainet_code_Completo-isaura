import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/theme.dart';
import '../providers/client_provider.dart';
import '../widgets/widgets.dart';

class ClientOrderFormScreen extends StatefulWidget {
  const ClientOrderFormScreen({super.key});
  @override
  State<ClientOrderFormScreen> createState() => _ClientOrderFormScreenState();
}

class _ClientOrderFormScreenState extends State<ClientOrderFormScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _designCtrl = TextEditingController();
  final _weightCtrl = TextEditingController();
  String? _createdCode;
  String? _createdPhone;
  String? _createdName;

  Future<void> _submit() async {
    if (_nameCtrl.text.isEmpty || _designCtrl.text.isEmpty || _weightCtrl.text.isEmpty) return;
    final cp = context.read<ClientProvider>();
    final order = await cp.createClientOrder(
      clientName: _nameCtrl.text,
      design: _designCtrl.text,
      estimatedWeight: double.tryParse(_weightCtrl.text) ?? 0,
      email: _emailCtrl.text.isNotEmpty ? _emailCtrl.text : null,
      phone: _phoneCtrl.text.isNotEmpty ? _phoneCtrl.text : null,
    );
    setState(() {
      _createdCode = order.shortId;
      _createdPhone = _phoneCtrl.text;
      _createdName = _nameCtrl.text;
    });
    _nameCtrl.clear(); _emailCtrl.clear(); _phoneCtrl.clear(); _designCtrl.clear(); _weightCtrl.clear();
  }

  Future<void> _sendWhatsApp() async {
    if (_createdPhone == null || _createdCode == null) return;
    final phone = _createdPhone!.replaceAll(RegExp(r'\D'), '');
    final msg = Uri.encodeComponent('¡Hola $_createdName! 💎 Tu pedido ha sido registrado. Código: P-$_createdCode');
    final url = Uri.parse('https://wa.me/$phone?text=$msg');
    if (await canLaunchUrl(url)) await launchUrl(url, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final cp = context.watch<ClientProvider>();
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
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Row(children: [
                    IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.arrow_back, color: AppColors.gold)),
                    const Expanded(child: Text('NUEVO PEDIDO', textAlign: TextAlign.center, style: TextStyle(color: AppColors.gold, fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: 2))),
                    const SizedBox(width: 48),
                  ]),
                  const SizedBox(height: 6),
                  const Text('Registro independiente de clientes', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                  const SizedBox(height: 24),

                  if (_createdCode != null) ...[
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: AppColors.success.withOpacity(0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.success)),
                      child: Column(children: [
                        const Icon(Icons.check_circle, color: AppColors.success, size: 36),
                        const SizedBox(height: 8),
                        const Text('¡Pedido Registrado!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 8),
                        RichText(text: TextSpan(children: [
                          const TextSpan(text: 'Código: ', style: TextStyle(color: AppColors.textGray)),
                          TextSpan(text: 'P-$_createdCode', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold)),
                        ])),
                        if (_createdPhone != null && _createdPhone!.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          GoldButton(label: 'ENVIAR POR WHATSAPP', icon: Icons.phone, color: const Color(0xFF25D366), textColor: Colors.white, onPressed: _sendWhatsApp),
                        ],
                      ]),
                    ),
                    const SizedBox(height: 24),
                  ],

                  _field(_nameCtrl, 'Nombre y Apellido', '👤 NOMBRE CLIENTE', TextInputType.name),
                  _field(_emailCtrl, 'Email de contacto', '✉ CORREO ELECTRÓNICO', TextInputType.emailAddress),
                  _field(_phoneCtrl, '+57 300...', '📱 CELULAR / WHATSAPP', TextInputType.phone),
                  _field(_designCtrl, 'Ej. Argolla Matrimonio 18k', '🖼 DISEÑO / PIEZA', TextInputType.text),
                  _field(_weightCtrl, '0.0 g', '⚖ PESO EST. (g)', TextInputType.number),
                  const SizedBox(height: 8),
                  GoldButton(label: cp.loading ? 'REGISTRANDO...' : 'CONFIRMAR Y REGISTRAR', icon: Icons.check_circle, onPressed: cp.loading ? null : _submit),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String hint, String label, TextInputType type) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        TextField(
          controller: ctrl,
          keyboardType: type,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          decoration: InputDecoration(hintText: hint, border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(vertical: 12)),
        ),
        Container(height: 2, color: AppColors.borderSubtle),
        const SizedBox(height: 4),
        Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 11, color: AppColors.textMuted, letterSpacing: 1)),
      ]),
    );
  }

  @override
  void dispose() {
    for (final c in [_nameCtrl, _emailCtrl, _phoneCtrl, _designCtrl, _weightCtrl]) { c.dispose(); }
    super.dispose();
  }
}
