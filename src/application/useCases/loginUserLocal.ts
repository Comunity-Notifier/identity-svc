import { InvalidCredentialsError } from '../../domain/domainErrors';
import { Email } from '../../domain/valueObjects/email';
import { AuthenticatedUser, LoginUserLocalCommand, LoginUserLocalResult } from '../dtos';
import { PasswordHasher } from '../ports/passwordHasher';
import { TokenService } from '../ports/tokenService';
import { UserRepository } from '../ports/userRepository';
import { buildTokenPayload } from './tokenPayload';

export interface LoginUserLocalDeps {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  tokenService: TokenService;
}

export class LoginUserLocal {
  constructor(private readonly deps: LoginUserLocalDeps) {}

  async execute(command: LoginUserLocalCommand): Promise<LoginUserLocalResult> {
    const email = Email.create(command.email);
    const user = await this.deps.userRepository.findByEmail(email);
    const passwordHash = user?.passwordHash;

    if (!user || !passwordHash) {
      throw new InvalidCredentialsError();
    }

    const isValid = await this.deps.passwordHasher.verify(command.password, passwordHash);

    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const payload = buildTokenPayload(user);
    const accessToken = await this.deps.tokenService.signAccessToken(payload);

    const authenticatedUser: AuthenticatedUser = {
      id: user.id.toString(),
      email: user.email.toString(),
      name: user.name.toString(),
    };

    return { user: authenticatedUser, accessToken };
  }
}
