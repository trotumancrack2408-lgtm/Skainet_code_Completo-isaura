import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class ClientProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  List<ClientOrder> _clientOrders = [];
  bool _loading = false;

  List<ClientOrder> get clientOrders => _clientOrders;
  List<ClientOrder> get pendingOrders =>
      _clientOrders.where((o) => o.isPending).toList();
  List<ClientOrder> get activeOrders =>
      _clientOrders.where((o) => !o.isCompleted).toList();
  bool get loading => _loading;

  Future<void> fetchClientOrders() async {
    try {
      _clientOrders = await _api.fetchClientOrders();
      notifyListeners();
    } catch (_) {}
  }

  Future<ClientOrder> createClientOrder({
    required String clientName,
    required String design,
    required double estimatedWeight,
    String? email,
    String? phone,
  }) async {
    _loading = true;
    notifyListeners();
    try {
      final order = await _api.createClientOrder(
        clientName: clientName,
        design: design,
        estimatedWeight: estimatedWeight,
        email: email,
        phone: phone,
      );
      await fetchClientOrders();
      return order;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> updateStep(String orderId, int stepIndex) async {
    _loading = true;
    notifyListeners();
    try {
      String status = 'IN_PRODUCTION';
      if (stepIndex == 0) status = 'PENDING';
      if (stepIndex == 10) status = 'COMPLETED';
      await _api.updateClientOrderStatus(orderId, status, stepIndex);
      await fetchClientOrders();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  ClientOrder? findByShortId(String shortId) {
    return _clientOrders.where((o) =>
        o.id.toLowerCase() == shortId.toLowerCase() ||
        o.shortId.toLowerCase() == shortId.toLowerCase()).firstOrNull;
  }
}
