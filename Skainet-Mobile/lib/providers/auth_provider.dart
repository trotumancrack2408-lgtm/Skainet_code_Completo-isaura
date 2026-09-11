import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import '../models/models.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );
  User? _currentUser;
  List<User> _allUsers = [];
  bool _loading = false;
  bool _initialized = false;

  User? get currentUser => _currentUser;
  List<User> get allUsers => _allUsers;
  bool get loading => _loading;
  bool get initialized => _initialized;
  bool get isLoggedIn => _currentUser != null;
  bool get isAdmin => _currentUser?.isAdmin ?? false;

  List<User> get workers => _allUsers.where((u) => !u.isAdmin).toList();
  List<User> get admins => _allUsers.where((u) => u.isAdmin).toList();
  List<User> get joyeros => _allUsers.where((u) => u.isJoyero).toList();
  List<User> get availableJoyeros =>
      joyeros.where((u) => u.status == 'Disponible').toList();

  String? _connectionError;
  String? get connectionError => _connectionError;

  bool isTokenExpired(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return true;
      final payload = parts[1];
      final normalized = base64Url.normalize(payload);
      final decoded = utf8.decode(base64Url.decode(normalized));
      final data = jsonDecode(decoded);
      if (data['exp'] == null) return false;
      final expiryTime = DateTime.fromMillisecondsSinceEpoch(data['exp'] * 1000);
      return DateTime.now().isAfter(expiryTime);
    } catch (_) {
      return true;
    }
  }

  Future<void> tryAutoLogin() async {
    try {
      final cachedUrl = await _storage.read(key: 'api_url');
      if (cachedUrl != null && cachedUrl.isNotEmpty) {
        setApiBaseUrl(cachedUrl);
      }
    } catch (e) {
      debugPrint('Failed to read cached API URL: $e');
    }

    try {
      final token = await _storage.read(key: 'jwt_token');
      if (token != null) {
        if (isTokenExpired(token)) {
          debugPrint('Auto-login: Token has expired.');
          await _storage.delete(key: 'jwt_token');
        } else {
          final parts = token.split('.');
          if (parts.length == 3) {
            final payload = parts[1];
            final normalized = base64Url.normalize(payload);
            final decoded = utf8.decode(base64Url.decode(normalized));
            final data = jsonDecode(decoded);
            final userId = data['sub']?.toString();
            if (userId != null) {
              _allUsers = await _api.fetchUsers();
              final user = _allUsers.where((u) => u.id == userId).firstOrNull;
              if (user != null) {
                _currentUser = user;
              }
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Auto-login failed: $e');
      try { await _storage.delete(key: 'jwt_token'); } catch (_) {}
    }

    _initialized = true;
    notifyListeners();
  }

  Future<void> saveApiUrl(String url) async {
    await _storage.write(key: 'api_url', value: url);
    setApiBaseUrl(url);
    notifyListeners();
  }

  Future<void> fetchUsers() async {
    _connectionError = null;
    notifyListeners();
    try {
      _allUsers = await _api.fetchUsers();
      if (_currentUser != null) {
        final updated = _allUsers.where((u) => u.id == _currentUser!.id).firstOrNull;
        if (updated != null) _currentUser = updated;
      }
      notifyListeners();
    } catch (e) {
      _connectionError = 'URL: $apiBaseUrl\n$e';
      debugPrint('ERROR FETCHING USERS: $_connectionError');
      notifyListeners();
    }
  }

  Future<bool> login(String id, String password) async {
    _loading = true;
    notifyListeners();
    try {
      final user = await _api.login(id, password);
      if (user != null) {
        _currentUser = user;
        _loading = false;
        notifyListeners();
        return true;
      }
    } catch (_) {}
    _loading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    _currentUser = null;
    await _storage.delete(key: 'jwt_token');
    notifyListeners();
  }

  Future<void> updateStatus(String status) async {
    if (_currentUser == null) return;
    _loading = true;
    notifyListeners();
    try {
      final user = await _api.updateStatus(_currentUser!.id, status);
      if (user != null) _currentUser = user;
      await fetchUsers();
    } catch (_) {}
    _loading = false;
    notifyListeners();
  }

  Future<void> createUser({
    required String id,
    required String name,
    required String role,
    required String password,
    String? phone,
  }) async {
    _loading = true;
    _connectionError = null;
    notifyListeners();
    try {
      await _api.createUser(id: id, name: name, role: role, password: password, phone: phone);
      await fetchUsers(); // Refresh the list
    } catch (e) {
      _connectionError = e.toString();
      debugPrint('CREATE USER ERROR: $e');
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> deleteUser(String id) async {
    _loading = true;
    _connectionError = null;
    notifyListeners();
    try {
      await _api.deleteUser(id);
      await fetchUsers(); // Refresh the list
    } catch (e) {
      _connectionError = e.toString();
      debugPrint('DELETE USER ERROR: $e');
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  String? getUserName(String id) {
    return _allUsers.where((u) => u.id == id).firstOrNull?.name;
  }
}
