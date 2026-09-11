import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'config/app_router.dart';
import 'providers/auth_provider.dart';
import 'providers/workshop_provider.dart';
import 'providers/client_provider.dart';

void main() {
  runApp(const SkainetApp());
}

class SkainetApp extends StatefulWidget {
  const SkainetApp({super.key});

  @override
  State<SkainetApp> createState() => _SkainetAppState();
}

class _SkainetAppState extends State<SkainetApp> {
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..tryAutoLogin()),
        ChangeNotifierProvider(create: (_) => WorkshopProvider()),
        ChangeNotifierProvider(create: (_) => ClientProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          // Mostrar pantalla de carga mientras se verifica el almacenamiento seguro (auto-login)
          if (!auth.initialized) {
            return MaterialApp(
              debugShowCheckedModeBanner: false,
              theme: buildAppTheme(),
              home: const Scaffold(
                backgroundColor: Color(0xFF111111),
                body: Center(
                  child: CircularProgressIndicator(
                    color: Color(0xFF00FFCC),
                  ),
                ),
              ),
            );
          }

          // Crear enrutador configurado con el authProvider actual
          final router = buildRouter(auth);

          return MaterialApp.router(
            title: 'Skainet Workshop',
            debugShowCheckedModeBanner: false,
            theme: buildAppTheme(),
            routerConfig: router,
          );
        },
      ),
    );
  }
}
