import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';
import '../models/models.dart';

class ApiService {
  final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiService()
      : _dio = Dio(
          BaseOptions(
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 15),
          ),
        ) {
    // Interceptor para construir URL completa y agregar token JWT
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Construir la URL completa usando apiBaseUrl actual
          final path = options.path;
          if (!path.startsWith('http')) {
            options.path = '$apiBaseUrl$path';
          }
          
          // Intentar leer token - NUNCA debe crashear la petición
          try {
            final token = await _storage.read(key: 'jwt_token');
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          } catch (_) {
            // Si falla el storage, continuar sin token
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          // Manejo uniforme de errores
          String errorMessage = 'Ocurrió un error inesperado';
          if (e.response != null && e.response?.data != null) {
            final data = e.response?.data;
            if (data is Map && data.containsKey('message')) {
              errorMessage = data['message'].toString();
            }
          }
          return handler.next(
            DioException(
              requestOptions: e.requestOptions,
              response: e.response,
              type: e.type,
              error: errorMessage,
              message: errorMessage,
            ),
          );
        },
      ),
    );
  }

  // Helper para manejar excepciones de forma limpia
  Exception _handleError(dynamic err) {
    if (err is DioException) {
      final detail = 'DioException [${err.type}]: ${err.message}\nError: ${err.error}\nStatus: ${err.response?.statusCode}\nPath: ${err.requestOptions.path}';
      return Exception(detail);
    }
    return Exception(err.toString());
  }

  // ── Users ──
  Future<List<User>> fetchUsers() async {
    try {
      final resp = await _dio.get('/users');
      final data = resp.data as List;
      return data.map((j) => User.fromJson(j)).toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<User?> login(String id, String password) async {
    try {
      final resp = await _dio.post(
        '/users/login',
        data: {'id': id, 'password': password},
      );
      if (resp.statusCode == 200 || resp.statusCode == 201) {
        final data = resp.data;
        // Guardar token JWT si existe en la respuesta
        if (data != null && data['access_token'] != null) {
          await _storage.write(key: 'jwt_token', value: data['access_token'].toString());
        }
        return User.fromJson(data);
      }
      return null;
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<User?> updateStatus(String id, String status) async {
    try {
      final resp = await _dio.patch(
        '/users/$id/status',
        data: {'status': status},
      );
      if (resp.statusCode == 200) return User.fromJson(resp.data);
      return null;
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<User> createUser({
    required String id,
    required String name,
    required String role,
    required String password,
    String? phone,
  }) async {
    try {
      final resp = await _dio.post(
        '/users',
        data: {
          'id': id,
          'name': name,
          'role': role,
          'password': password,
          'phone': phone,
        },
      );
      return User.fromJson(resp.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> deleteUser(String id) async {
    try {
      await _dio.delete('/users/$id');
    } catch (e) {
      throw _handleError(e);
    }
  }

  // ── Batches ──
  Future<List<Batch>> fetchBatches() async {
    try {
      final resp = await _dio.get('/batches');
      final data = resp.data as List;
      return data.map((j) => Batch.fromJson(j)).toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> createBatch(double entryWeight, double exitWeight, int ringsCount) async {
    try {
      await _dio.post(
        '/batches',
        data: {
          'entryWeight': entryWeight,
          'exitWeight': exitWeight,
          'ringsCount': ringsCount,
        },
      );
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<Ring>> fetchPendingRings() async {
    try {
      final resp = await _dio.get('/batches/pending-rings');
      final data = resp.data as List;
      return data.map((j) => Ring.fromJson(j)).toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  // ── Orders ──
  Future<List<WorkOrder>> fetchOrders() async {
    try {
      final resp = await _dio.get('/orders');
      final data = resp.data as List;
      return data.map((j) => WorkOrder.fromJson(j)).toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> createOrder({
    required String ringId,
    required String receiverId,
    required String executorId,
    required Map<String, double> weights,
    String? providedPin,
  }) async {
    try {
      final resp = await _dio.post(
        '/orders',
        data: {
          'ringId': ringId,
          'receiverId': receiverId,
          'executorId': executorId,
          'weights': weights,
          'providedPin': providedPin,
        },
      );
      return resp.data;
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> closeOrder({
    required String orderId,
    required Map<String, double> weights,
    String? explanation,
    String? providedPin,
  }) async {
    try {
      final resp = await _dio.post(
        '/orders/$orderId/close',
        data: {
          'weights': weights,
          'explanation': explanation,
          'providedPin': providedPin,
        },
      );
      return resp.data;
    } catch (e) {
      throw _handleError(e);
    }
  }

  // ── Client Orders ──
  Future<List<ClientOrder>> fetchClientOrders() async {
    try {
      final resp = await _dio.get('/client-orders');
      final data = resp.data as List;
      return data.map((j) => ClientOrder.fromJson(j)).toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<ClientOrder> createClientOrder({
    required String clientName,
    required String design,
    required double estimatedWeight,
    String? email,
    String? phone,
  }) async {
    try {
      final resp = await _dio.post(
        '/client-orders',
        data: {
          'clientName': clientName,
          'design': design,
          'estimatedWeight': estimatedWeight,
          'email': email,
          'phone': phone,
        },
      );
      return ClientOrder.fromJson(resp.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> updateClientOrderStatus(String id, String status, int stepIndex) async {
    try {
      await _dio.patch(
        '/client-orders/$id/status',
        data: {'status': status, 'stepIndex': stepIndex},
      );
    } catch (e) {
      throw _handleError(e);
    }
  }

  // ── Alerts & Stats ──
  Future<List<Alert>> fetchAlerts() async {
    try {
      final resp = await _dio.get('/alerts');
      final data = resp.data as List;
      return data.map((j) => Alert.fromJson(j)).toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<WorkshopStats> fetchStats() async {
    try {
      final resp = await _dio.get('/stats');
      return WorkshopStats.fromJson(resp.data);
    } catch (e) {
      throw _handleError(e);
    }
  }
}
