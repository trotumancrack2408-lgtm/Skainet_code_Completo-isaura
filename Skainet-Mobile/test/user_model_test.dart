import 'package:flutter_test/flutter_test.dart';
import 'package:skainet_mobile/models/models.dart';

void main() {
  group('User Model Tests', () {
    test('Should parse User from JSON successfully', () {
      final json = {
        'id': '1',
        'name': 'Ramiro',
        'role': 'Joyero',
        'status': 'Disponible',
        'phone': '+573000000001',
      };

      final user = User.fromJson(json);

      expect(user.id, '1');
      expect(user.name, 'Ramiro');
      expect(user.role, 'Joyero');
      expect(user.status, 'Disponible');
      expect(user.phone, '+573000000001');
      expect(user.isJoyero, true);
      expect(user.isAdmin, false);
    });

    test('Should handle missing fields gracefully with defaults', () {
      final json = {
        'id': '2',
        'name': 'Deysi',
      };

      final user = User.fromJson(json);

      expect(user.id, '2');
      expect(user.name, 'Deysi');
      expect(user.role, '');
      expect(user.status, 'Fuera de Turno');
    });
  });
}
