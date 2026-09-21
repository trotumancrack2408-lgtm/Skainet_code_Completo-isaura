import { UsersService, UserRole, AccountStatus } from '../../Skainet-API/src/users/users.service';

describe('Reactivación de usuarios', () => {
  it('restaura una cuenta inactiva a Activo y registra la transición', async () => {
    const inactiveUser = {
      id: '2001', name: 'Admin Reactivable', role: UserRole.ADMIN,
      accountStatus: AccountStatus.INACTIVE, history: '[]', securityQuestions: '[]',
    };
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(inactiveUser),
        update: jest.fn().mockResolvedValue({ ...inactiveUser, accountStatus: AccountStatus.ACTIVE }),
      },
    } as any;
    const audit = { log: jest.fn() } as any;
    const service = new UsersService(prisma, audit);

    const result = await service.activateUser('1000000000', UserRole.SUPER_ADMIN, '2001');

    expect(result.accountStatus).toBe(AccountStatus.ACTIVE);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '2001' }, data: { accountStatus: AccountStatus.ACTIVE },
    });
    expect(audit.log).toHaveBeenCalledWith(
      '1000000000', 'REACTIVAR_USUARIO_Administrador', 'Usuarios', expect.any(Object), UserRole.SUPER_ADMIN,
    );
  });
});
