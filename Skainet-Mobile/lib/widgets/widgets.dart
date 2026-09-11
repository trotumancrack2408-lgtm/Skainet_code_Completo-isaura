import 'package:flutter/material.dart';
import '../config/theme.dart';

// ═══════════════════════════════════════════
// Glass Card — Glassmorphism container
// ═══════════════════════════════════════════
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final Color? borderColor;

  const GlassCard({super.key, required this.child, this.padding, this.borderColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardBg.withOpacity(0.8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor ?? AppColors.borderGlass, width: 0.5),
        boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 20, offset: Offset(0, 8))],
      ),
      child: child,
    );
  }
}

// ═══════════════════════════════════════════
// Gold Button — Premium action button
// ═══════════════════════════════════════════
class GoldButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final Color? color;
  final Color? textColor;

  const GoldButton({super.key, required this.label, this.onPressed, this.icon, this.color, this.textColor});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color ?? AppColors.gold,
          foregroundColor: textColor ?? Colors.black,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          textStyle: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 2, fontSize: 14),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 10)],
            Text(label),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════
// Status Badge
// ═══════════════════════════════════════════
class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge({super.key, required this.status});

  Color get _color {
    switch (status) {
      case 'Disponible': return AppColors.success;
      case 'En Proceso': return AppColors.warning;
      case 'En Pausa': return AppColors.danger;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(color: _color, borderRadius: BorderRadius.circular(20)),
      child: Text(status, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
    );
  }
}

// ═══════════════════════════════════════════
// Stat Card — KPI card
// ═══════════════════════════════════════════
class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const StatCard({super.key, required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.goldDim),
      ),
      child: Column(
        children: [
          Text(label, style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.5))),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: valueColor ?? Colors.white)),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════
// Weight Input Row
// ═══════════════════════════════════════════
class WeightInputRow extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final bool primary;
  final FocusNode? focusNode;
  final FocusNode? nextFocus;

  const WeightInputRow({
    super.key,
    required this.label,
    required this.controller,
    this.primary = false,
    this.focusNode,
    this.nextFocus,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: primary ? Colors.black38 : Colors.black26,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: primary ? AppColors.borderGlass : AppColors.borderSubtle),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: TextStyle(
              fontSize: primary ? 14 : 13,
              color: primary ? AppColors.gold : AppColors.textGray,
              letterSpacing: 1,
            )),
          ),
          SizedBox(
            width: 100,
            child: TextField(
              controller: controller,
              focusNode: focusNode,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              textAlign: TextAlign.right,
              style: TextStyle(fontSize: primary ? 22 : 18, color: Colors.white, fontWeight: FontWeight.w600),
              decoration: const InputDecoration(
                border: InputBorder.none,
                hintText: '0.00',
                hintStyle: TextStyle(color: Colors.white24),
                contentPadding: EdgeInsets.zero,
                isDense: true,
              ),
              onSubmitted: (_) => nextFocus?.requestFocus(),
            ),
          ),
          const SizedBox(width: 8),
          Text('g', style: TextStyle(color: AppColors.textMuted, fontSize: primary ? 16 : 14)),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════
// Step Progress — Fabrication timeline
// ═══════════════════════════════════════════
class StepProgress extends StatelessWidget {
  final int currentStep;
  final bool interactive;
  final Function(int)? onStepTap;

  const StepProgress({super.key, required this.currentStep, this.interactive = false, this.onStepTap});

  static const steps = [
    'Diseño', 'Impresión', 'Casting Inicial', 'Limpieza', 'Pre-engaste',
    'Vulcanizado', 'Inyección', 'Empalme', 'Árboles', 'Casting Principal', 'Pulido y Acabados',
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(8)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            interactive ? 'ACTUALIZAR PROCESO' : 'PROCESO DE FABRICACIÓN',
            style: const TextStyle(fontSize: 12, color: AppColors.gold, letterSpacing: 1, fontWeight: FontWeight.w700),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ...List.generate(steps.length, (i) {
            final isCompleted = i < currentStep;
            final isActive = i == currentStep;
            return GestureDetector(
              onTap: interactive ? () => onStepTap?.call(i) : null,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Container(
                      width: 12, height: 12,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isCompleted ? AppColors.success : isActive ? AppColors.gold : const Color(0xFF333333),
                        border: (!isCompleted && !isActive) ? Border.all(color: const Color(0xFF555555)) : null,
                        boxShadow: isActive ? [BoxShadow(color: AppColors.gold.withOpacity(0.5), blurRadius: 8)] : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      steps[i],
                      style: TextStyle(
                        fontSize: 14,
                        color: isCompleted ? AppColors.success : isActive ? Colors.white : Colors.white38,
                        fontWeight: (isCompleted || isActive) ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════
// Section Header
// ═══════════════════════════════════════════
class SectionHeader extends StatelessWidget {
  final String title;
  final String? emoji;
  const SectionHeader({super.key, required this.title, this.emoji});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(
        '${emoji != null ? '$emoji ' : ''}$title',
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.gold, letterSpacing: 2),
      ),
    );
  }
}

// ═══════════════════════════════════════════
// Pin Input
// ═══════════════════════════════════════════
class PinInput extends StatelessWidget {
  final String label;
  final TextEditingController controller;

  const PinInput({super.key, required this.label, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.goldDim,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.borderGlass),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: AppColors.gold, letterSpacing: 1)),
          const SizedBox(width: 12),
          SizedBox(
            width: 80,
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              obscureText: true,
              style: const TextStyle(fontSize: 20, letterSpacing: 4, color: Colors.white),
              decoration: const InputDecoration(
                border: InputBorder.none,
                hintText: '****',
                hintStyle: TextStyle(color: Colors.white24),
                contentPadding: EdgeInsets.zero,
                isDense: true,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
