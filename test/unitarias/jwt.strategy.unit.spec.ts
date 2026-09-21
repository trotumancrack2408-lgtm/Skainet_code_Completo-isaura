import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../../Skainet-API/src/auth/jwt.strategy';
import { AccountStatus } from '../../Skainet-API/src/users/users.service';

describe('JwtStrategy - revocación por desactivación', () => {
  it('rechaza un JWT previamente emitido cuando la cuenta fue desactivada', async () => {
    const usersService = {
      findOne: jest.fn().mockResolvedValue({ id: '4', accountStatus: AccountStatus.INACTIVE }),
    } as any;
    const strategy = new JwtStrategy(usersService);

    await expect(strategy.validate({ sub: '4' })).rejects.toThrow(UnauthorizedException);
  });

  it('conserva el acceso cuando la cuenta continúa activa', async () => {
    const activeUser = { id: '4', accountStatus: AccountStatus.ACTIVE };
    const strategy = new JwtStrategy({ findOne: jest.fn().mockResolvedValue(activeUser) } as any);

    await expect(strategy.validate({ sub: '4' })).resolves.toEqual({ ...activeUser, sub: '4' });
  });
});
