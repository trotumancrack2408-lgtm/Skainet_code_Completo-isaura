import 'dart:async';
import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class WorkshopProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  Timer? _pollTimer;

  List<Batch> _batches = [];
  List<Ring> _pendingRings = [];
  List<WorkOrder> _orders = [];
  List<Alert> _alerts = [];
  WorkshopStats _stats = WorkshopStats();

  List<Batch> get batches => _batches;
  List<Ring> get pendingRings => _pendingRings;
  List<WorkOrder> get orders => _orders;
  List<WorkOrder> get activeOrders => _orders.where((o) => o.isOpen).toList();
  List<Alert> get alerts => _alerts;
  WorkshopStats get stats => _stats;

  void startPolling() {
    fetchAll();
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => fetchAll());
  }

  void stopPolling() {
    _pollTimer?.cancel();
  }

  Future<void> fetchAll() async {
    try {
      final results = await Future.wait([
        _api.fetchBatches(),
        _api.fetchPendingRings(),
        _api.fetchOrders(),
        _api.fetchAlerts(),
        _api.fetchStats(),
      ]);
      _batches = results[0] as List<Batch>;
      _pendingRings = results[1] as List<Ring>;
      _orders = results[2] as List<WorkOrder>;
      _alerts = results[3] as List<Alert>;
      _stats = results[4] as WorkshopStats;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> createBatch(double entry, double exit, int count) async {
    await _api.createBatch(entry, exit, count);
    await fetchAll();
  }

  Future<Map<String, dynamic>> createOrder({
    required String ringId,
    required String receiverId,
    required String executorId,
    required Map<String, double> weights,
    String? providedPin,
  }) async {
    final result = await _api.createOrder(
      ringId: ringId,
      receiverId: receiverId,
      executorId: executorId,
      weights: weights,
      providedPin: providedPin,
    );
    await fetchAll();
    return result;
  }

  Future<Map<String, dynamic>> closeOrder({
    required String orderId,
    required Map<String, double> weights,
    String? explanation,
    String? providedPin,
  }) async {
    final result = await _api.closeOrder(
      orderId: orderId,
      weights: weights,
      explanation: explanation,
      providedPin: providedPin,
    );
    await fetchAll();
    return result;
  }

  bool hasActiveOrder(String executorId) {
    return orders.any((o) => o.executorId == executorId && o.isOpen);
  }

  @override
  void dispose() {
    stopPolling();
    super.dispose();
  }
}
