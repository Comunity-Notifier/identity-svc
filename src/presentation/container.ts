import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { PrismaUserRepository } from '../infrastructure/persistence/prisma/PrismaUserRepository';
import { JwtTokenService, TokenConfig } from '../infrastructure/services/JwtTokenService';
import {
  Argon2PasswordHasher,
  Argon2PasswordHasherOptions,
} from '../infrastructure/services/Argon2PasswordHasher';
import { SystemClock } from '../shared/domain/time/Clock';
import { RegisterLocalUser } from '../application/use-cases/RegisterLocalUser';
import { LoginLocal } from '../application/use-cases/LoginLocal';
import { RegisterAndLoginLocal } from '../application/use-cases/RegisterAndLoginLocal';
import { PrismaClient } from '@prisma/client';
import { tokenConfig } from './config';

export const createAppContainer = () => {
  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
  });

  const prismaClient = new PrismaClient();

  container.register({
    prismaClient: asValue(prismaClient),
    userRepository: asClass(PrismaUserRepository).scoped(),
    tokenService: asClass(JwtTokenService).scoped(),
    passwordHasher: asClass(Argon2PasswordHasher).scoped(),
    clock: asClass(SystemClock).singleton(),
    registerLocalUser: asClass(RegisterLocalUser).scoped(),
    loginLocal: asClass(LoginLocal).scoped(),
    registerAndLoginLocal: asClass(RegisterAndLoginLocal).scoped(),
    tokenConfig: asValue<TokenConfig>(tokenConfig),
    optionsArgon2: asValue<{ optionsArgon2: Argon2PasswordHasherOptions }>({ optionsArgon2: {} }),
  });

  return container;
};
