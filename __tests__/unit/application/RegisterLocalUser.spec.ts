import { RegisterLocalUser } from '../../../src/application/use-cases/RegisterLocalUser';
import { UserRepository } from '../../../src/domain/repositories/UserRepository';
import { PasswordHasher } from '../../../src/application/ports/PasswordHasher';
import { User } from '../../../src/domain/aggregates/User';
import { Email } from '../../../src/domain/value-objects/Email';
import { UserAlreadyExistsError } from '../../../src/domain/errors/domain/UserAlreadyExistsError';
import { Clock } from '../../../src/shared/domain/time/Clock';

const fixedDate = new Date('2025-01-01T10:00:00.000Z');

const createDeps = () => {
  const userRepository = {
    findByEmail: jest.fn(),
    save: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;

  const passwordHasher = {
    hash: jest.fn(),
  } as unknown as jest.Mocked<PasswordHasher>;

  const clock = {
    now: jest.fn().mockReturnValue(fixedDate),
  } as unknown as jest.Mocked<Clock>;

  return { userRepository, passwordHasher, clock };
};

describe('RegisterLocalUser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws if user already exists', async () => {
    const deps = createDeps();
    const useCase = new RegisterLocalUser(deps);
    const findByEmailMock = deps.userRepository.findByEmail as jest.MockedFunction<
      UserRepository['findByEmail']
    >;
    const saveMock = deps.userRepository.save as jest.MockedFunction<UserRepository['save']>;
    const nowMock = deps.clock.now as jest.MockedFunction<Clock['now']>;

    findByEmailMock.mockResolvedValue({} as User);

    await expect(
      useCase.execute({
        id: 'ffb9d9b7-2906-4a7c-944b-0db62f764a32',
        name: 'Jane',
        email: 'jane@example.com',
        password: 'Secret123',
      })
    ).rejects.toThrow(UserAlreadyExistsError);

    expect(findByEmailMock).toHaveBeenCalledWith(new Email('jane@example.com'));
    expect(saveMock).not.toHaveBeenCalled();
    expect(nowMock).not.toHaveBeenCalled();
  });

  it('registers a new user and returns basic info', async () => {
    const deps = createDeps();
    const useCase = new RegisterLocalUser(deps);
    const findByEmailMock = deps.userRepository.findByEmail as jest.MockedFunction<
      UserRepository['findByEmail']
    >;
    const saveMock = deps.userRepository.save as jest.MockedFunction<UserRepository['save']>;
    const hashMock = deps.passwordHasher.hash as jest.MockedFunction<PasswordHasher['hash']>;
    const nowMock = deps.clock.now as jest.MockedFunction<Clock['now']>;

    findByEmailMock.mockResolvedValue(null);
    hashMock.mockResolvedValue('hashed-password');

    const result = await useCase.execute({
      id: 'ffb9d9b7-2906-4a7c-944b-0db62f764a32',
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Secret123',
      image: 'https://example.com/avatar.png',
    });

    expect(hashMock).toHaveBeenCalledWith('Secret123');
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(nowMock).toHaveBeenCalledTimes(1);

    const savedUser = saveMock.mock.calls[0][0];
    expect(savedUser).toBeInstanceOf(User);
    expect(savedUser.id.toString()).toBe('ffb9d9b7-2906-4a7c-944b-0db62f764a32');
    expect(savedUser.email.equals(new Email('jane@example.com'))).toBe(true);
    expect(savedUser.passwordHash?.toString()).toBe('hashed-password');

    expect(result).toEqual({
      id: savedUser.id.toString(),
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
  });
});
