import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../../../Skainet-API/src/users/users.controller';
import { UsersService } from '../../../../Skainet-API/src/users/users.service';
import { AuthService } from '../../../../Skainet-API/src/auth/auth.service';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: { findAll: jest.fn() } },
        { provide: AuthService, useValue: { login: jest.fn() } },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
