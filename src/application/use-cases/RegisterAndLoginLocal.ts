import { RegisterLocalUser } from './RegisterLocalUser';
import { RegisterAndLoginLocalResult, RegisterLocalUserRequest } from '../dto';
import { TokenService } from '../ports/TokenService';

export interface RegisterAndLoginLocalDeps {
  registerLocalUser: RegisterLocalUser;
  tokenService: TokenService;
}

export class RegisterAndLoginLocal {
  constructor(private readonly deps: RegisterAndLoginLocalDeps) {}

  async execute(request: RegisterLocalUserRequest): Promise<RegisterAndLoginLocalResult> {
    const user = await this.deps.registerLocalUser.execute(request);

    const accessToken = await this.deps.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
    });

    return {
      ...user,
      accessToken,
    };
  }
}
