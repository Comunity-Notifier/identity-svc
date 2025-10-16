import { RegisterAndLoginLocal } from '../../src/application/use-cases/RegisterAndLoginLocal';
import { RegisterLocalUser } from '../../src/application/use-cases/RegisterLocalUser';
import { TokenService } from '../../src/application/ports/TokenService';

const request = {
  id: 'c7276ad0-2467-4cf9-a91f-5f6391a170b9',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SuperSecret123',
};

const createDeps = () => {
  const registerLocalUser = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<RegisterLocalUser>;

  const tokenService = {
    signAccessToken: jest.fn(),
    verify: jest.fn(),
  } as unknown as jest.Mocked<TokenService>;

  return { registerLocalUser, tokenService };
};

describe('RegisterAndLoginLocal', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers the user and returns token info', async () => {
    const deps = createDeps();
    const useCase = new RegisterAndLoginLocal(deps);
    const registeredUser = {
      id: request.id,
      name: request.name,
      email: request.email,
    };

    deps.registerLocalUser.execute.mockResolvedValue(registeredUser);
    deps.tokenService.signAccessToken.mockResolvedValue('signed-token');

    const result = await useCase.execute(request);

    expect(deps.registerLocalUser.execute).toHaveBeenCalledWith(request);
    expect(deps.tokenService.signAccessToken).toHaveBeenCalledWith({
      sub: registeredUser.id,
      email: registeredUser.email,
    });
    expect(result).toEqual({
      ...registeredUser,
      accessToken: 'signed-token',
    });
  });

  it('propagates errors from the register use case and skips token creation', async () => {
    const deps = createDeps();
    const useCase = new RegisterAndLoginLocal(deps);
    const error = new Error('already-exists');

    deps.registerLocalUser.execute.mockRejectedValue(error);

    await expect(useCase.execute(request)).rejects.toThrow(error);
    expect(deps.tokenService.signAccessToken).not.toHaveBeenCalled();
  });
});
