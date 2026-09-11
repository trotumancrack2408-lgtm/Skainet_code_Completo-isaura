import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';


class AppColors {
  static const bgDark = Color(0xFF0A0A0A);
  static const cardBg = Color(0xFF1A1A1A);
  static const gold = Color(0xFFD4AF37);
  static const goldHover = Color(0xFFF1C40F);
  static const goldDim = Color(0x26D4AF37);
  static const success = Color(0xFF27AE60);
  static const warning = Color(0xFFE67E22);
  static const danger = Color(0xFFC0392B);
  static const info = Color(0xFF4FACFE);
  static const textWhite = Color(0xFFFFFFFF);
  static const textGray = Color(0xFFA0A0A0);
  static const textMuted = Color(0xFF666666);
  static const borderGlass = Color(0x4DD4AF37);
  static const borderSubtle = Color(0x0DFFFFFF);
}

ThemeData buildAppTheme() {
  return ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.bgDark,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.gold,
      secondary: AppColors.goldHover,
      surface: AppColors.cardBg,
      error: AppColors.danger,
    ),
    textTheme: GoogleFonts.outfitTextTheme(
      ThemeData.dark().textTheme,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      titleTextStyle: GoogleFonts.outfit(
        fontSize: 20,
        fontWeight: FontWeight.w800,
        letterSpacing: 3,
        color: AppColors.textWhite,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.black38,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.borderSubtle),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.gold),
      ),
      labelStyle: GoogleFonts.outfit(
        fontSize: 12,
        color: AppColors.textMuted,
        letterSpacing: 1,
      ),
      hintStyle: GoogleFonts.outfit(color: Colors.white38),
    ),
  );
}
