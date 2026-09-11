import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/login_screen.dart';
import '../screens/admin/admin_dashboard.dart';
import '../screens/joyero/joyero_dashboard.dart';
import '../screens/client_order_form.dart';
import '../screens/tracking_screen.dart';

GoRouter buildRouter(AuthProvider authProvider) {
  return GoRouter(
    initialLocation: '/login',
    refreshListenable: authProvider,
    redirect: (context, state) {
      final isLoggedIn = authProvider.isLoggedIn;
      final isGoingToLogin = state.matchedLocation == '/login';

      if (!isLoggedIn) {
        // Permitir acceso a formulario de cliente y tracking sin estar logueado
        if (state.matchedLocation == '/client-order-form' || 
            state.matchedLocation.startsWith('/tracking')) {
          return null;
        }
        return '/login';
      }

      // Si ya está logueado e intenta ir a login, redirigir según su rol
      if (isGoingToLogin) {
        return authProvider.isAdmin ? '/admin' : '/joyero';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminDashboard(),
      ),
      GoRoute(
        path: '/joyero',
        builder: (context, state) => const JoyeroDashboard(),
      ),
      GoRoute(
        path: '/client-order-form',
        builder: (context, state) => const ClientOrderFormScreen(),
      ),
      GoRoute(
        path: '/tracking',
        builder: (context, state) {
          final code = state.uri.queryParameters['code'];
          return TrackingScreen(initialCode: code);
        },
      ),
    ],
  );
}
