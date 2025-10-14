import { LoginLocal } from '../../src/application/use-cases/LoginLocal';
import { InvalidCredentialsError } from '../../src/domain/errors/domain/InvalidCredentialsError';
import { Email } from '../../src/domain/value-objects/Email';
import { UserRepository } from '../../src/domain/repositories/UserRepository';
import { PasswordHasher } from '../../src/application/ports/PasswordHasher';
import { TokenService } from '../../src/application/ports/TokenService';
import { User } from '../../src/domain/aggregates/User';
import { Name } from '../../src/domain/value-objects/Name';
import { Id } from '../../src/domain/value-objects/Id';
import { CreatedAt } from '../../src/domain/value-objects/CreatedAt';
import { UpdatedAt } from '../../src/domain/value-objects/UpdatedAt';
import { Password } from '../../src/domain/value-objects/Password';

describe('LoginUserLocal', () => {
  const mockUserRepository = {
    findByEmail: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;

  const mockPasswordHasher = {
    compare: jest.fn(),
  } as unknown as jest.Mocked<PasswordHasher>;

  const mockTokenService = {
    signAccessToken: jest.fn(),
  } as unknown as jest.Mocked<TokenService>;

  const deps = {
    userRepository: mockUserRepository,
    passwordHasher: mockPasswordHasher,
    tokenService: mockTokenService,
  };

  let useCase: LoginLocal;

  beforeEach(() => {
    useCase = new LoginLocal(deps);
    jest.clearAllMocks();
  });

  it('should throw InvalidCredentialsError if user not found', async () => {
    const email = 'test@example.com';
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email, password: 'password123' })).rejects.toThrow(
      InvalidCredentialsError
    );

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(new Email(email));
  });

  it('should throw InvalidCredentialsError if password is invalid', async () => {
    const fakeUser = new User({
      id: new Id('123e4567-e89b-12d3-a456-426614174000'),
      name: new Name('UserName'),
      email: new Email('test@example.com'),
      createdAt: new CreatedAt(new Date()),
      updatedAt: new UpdatedAt(new Date()),
      passwordHash: new Password('hashPassword'),
    });

    mockUserRepository.findByEmail.mockResolvedValue(fakeUser);
    mockPasswordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'test@example.com', password: 'wrongPassword' })
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('should return LoginResult if credentials are valid', async () => {
    const fakeUser = new User({
      id: new Id('123e4567-e89b-12d3-a456-426614174000'),
      name: new Name('UserName'),
      email: new Email('test@example.com'),
      createdAt: new CreatedAt(new Date()),
      updatedAt: new UpdatedAt(new Date()),
      passwordHash: new Password('hashPassword'),
    });

    const token = 'token1234';

    mockUserRepository.findByEmail.mockResolvedValue(fakeUser);
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockTokenService.signAccessToken.mockResolvedValue(token);

    const result = await useCase.execute({
      email: fakeUser.email.toString(),
      password: fakeUser.passwordHash.toString(),
    });

    expect(result).toEqual({
      id: fakeUser.id.toString(),
      email: fakeUser.email.toString(),
      name: fakeUser.name.toString(),
      accessToken: token,
    });

    expect(mockTokenService.signAccessToken).toHaveBeenCalledWith({
      email: fakeUser.email.toString(),
      sub: fakeUser.id.toString(),
    });
  });
});
