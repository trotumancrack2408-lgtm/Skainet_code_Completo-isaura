class User {
  final String id;
  final String name;
  final String role;
  final String status;
  final String? lastLogin;
  final List<Map<String, dynamic>>? history;
  final String? phone;

  User({
    required this.id,
    required this.name,
    required this.role,
    required this.status,
    this.lastLogin,
    this.history,
    this.phone,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    List<Map<String, dynamic>>? parsedHistory;
    try {
      if (json['history'] != null) {
        if (json['history'] is List) {
          parsedHistory = (json['history'] as List)
              .map((item) => Map<String, dynamic>.from(item as Map))
              .toList();
        }
      }
    } catch (_) {}

    return User(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? '',
      status: json['status'] ?? 'Fuera de Turno',
      lastLogin: json['lastLogin']?.toString(),
      history: parsedHistory,
      phone: json['phone']?.toString(),
    );
  }

  bool get isAdmin => role == 'Administrador';
  bool get isJoyero => role == 'Joyero';
  bool get isTaller => role.contains('Taller');
}

class Batch {
  final String id;
  final double entryWeight;
  final double exitWeight;
  final int ringsCount;
  final List<Ring> rings;

  Batch({
    required this.id,
    required this.entryWeight,
    required this.exitWeight,
    required this.ringsCount,
    required this.rings,
  });

  factory Batch.fromJson(Map<String, dynamic> json) {
    return Batch(
      id: json['id'] ?? '',
      entryWeight: (json['entryWeight'] ?? 0).toDouble(),
      exitWeight: (json['exitWeight'] ?? 0).toDouble(),
      ringsCount: json['ringsCount'] ?? 0,
      rings: (json['rings'] as List?)
              ?.map((r) => Ring.fromJson(r))
              .toList() ??
          [],
    );
  }
}

class Ring {
  final String id;
  final String name;
  final String status;
  final String batchId;
  final String? securePin;

  Ring({
    required this.id,
    required this.name,
    required this.status,
    required this.batchId,
    this.securePin,
  });

  factory Ring.fromJson(Map<String, dynamic> json) {
    return Ring(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      status: json['status'] ?? 'PENDING',
      batchId: json['batchId'] ?? '',
      securePin: json['securePin'],
    );
  }

  bool get isPending => status == 'PENDING';
  bool get isAssigned => status == 'ASSIGNED';
}

class WorkOrder {
  final String id;
  final String ringId;
  final String ringName;
  final String executorId;
  final String status;
  final double totalWeight;
  final String startTime;
  final String? endTime;
  final double? loss;
  final int? durationMinutes;

  WorkOrder({
    required this.id,
    required this.ringId,
    required this.ringName,
    required this.executorId,
    required this.status,
    required this.totalWeight,
    required this.startTime,
    this.endTime,
    this.loss,
    this.durationMinutes,
  });

  factory WorkOrder.fromJson(Map<String, dynamic> json) {
    return WorkOrder(
      id: json['id'] ?? '',
      ringId: json['ringId'] ?? '',
      ringName: json['ringName'] ?? '',
      executorId: json['executorId'] ?? '',
      status: json['status'] ?? 'OPEN',
      totalWeight: (json['totalWeight'] ?? 0).toDouble(),
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'],
      loss: json['loss']?.toDouble(),
      durationMinutes: json['durationMinutes'],
    );
  }

  bool get isOpen => status == 'OPEN';
}

class ClientOrder {
  final String id;
  final String clientName;
  final String design;
  final double estimatedWeight;
  final String status;
  final int currentStepIndex;
  final String? email;
  final String? phone;

  ClientOrder({
    required this.id,
    required this.clientName,
    required this.design,
    required this.estimatedWeight,
    required this.status,
    required this.currentStepIndex,
    this.email,
    this.phone,
  });

  factory ClientOrder.fromJson(Map<String, dynamic> json) {
    final rawStep = json['stepIndex'] ?? json['currentStepIndex'] ?? 0;
    final int step = rawStep is int ? rawStep : (int.tryParse(rawStep.toString()) ?? 0);
    return ClientOrder(
      id: json['id'] ?? json['shortId'] ?? '',
      clientName: json['clientName'] ?? '',
      design: json['design'] ?? '',
      estimatedWeight: (json['estimatedWeight'] ?? 0).toDouble(),
      status: json['status'] ?? 'PENDING',
      currentStepIndex: step,
      email: json['email'],
      phone: json['phone'],
    );
  }

  bool get isPending => status == 'PENDING';
  bool get isCompleted => status == 'COMPLETED';
  String get shortId => id.length >= 6 ? id.substring(id.length - 6) : id;
}

class Alert {
  final String id;
  final String type;
  final String message;
  final String severity;
  final String timestamp;

  Alert({
    required this.id,
    required this.type,
    required this.message,
    required this.severity,
    required this.timestamp,
  });

  factory Alert.fromJson(Map<String, dynamic> json) {
    return Alert(
      id: json['id'] ?? '',
      type: json['type'] ?? '',
      message: json['message'] ?? '',
      severity: json['severity'] ?? 'WARNING',
      timestamp: json['timestamp'] ?? '',
    );
  }

  bool get isCritical => severity == 'CRITICAL';
}

class WorkshopStats {
  final double totalLoss;
  final int incidentCount;
  final int totalProduced;
  final int activeWork;
  final List<RankingEntry> ranking;

  WorkshopStats({
    this.totalLoss = 0,
    this.incidentCount = 0,
    this.totalProduced = 0,
    this.activeWork = 0,
    this.ranking = const [],
  });

  factory WorkshopStats.fromJson(Map<String, dynamic> json) {
    return WorkshopStats(
      totalLoss: (json['totalLoss'] ?? 0).toDouble(),
      incidentCount: json['incidentCount'] ?? 0,
      totalProduced: json['totalProduced'] ?? 0,
      activeWork: json['activeWork'] ?? 0,
      ranking: (json['ranking'] as List?)
              ?.map((r) => RankingEntry.fromJson(r))
              .toList() ??
          [],
    );
  }
}

class RankingEntry {
  final String name;
  final double avgMinutes;
  final int completedCount;

  RankingEntry({
    required this.name,
    required this.avgMinutes,
    required this.completedCount,
  });

  factory RankingEntry.fromJson(Map<String, dynamic> json) {
    return RankingEntry(
      name: json['name'] ?? '',
      avgMinutes: (json['avgMinutes'] ?? 0).toDouble(),
      completedCount: json['completedCount'] ?? 0,
    );
  }
}
