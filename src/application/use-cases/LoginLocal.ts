import { InvalidCredentialsError } from '../../domain/errors/domain/InvalidCredentialsError';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { Email } from '../../domain/value-objects/Email';
import { LoginLocalRequest, LoginLocalResult } from '../dto';
import { PasswordHasher } from '../ports/PasswordHasher';
import { TokenService } from '../ports/TokenService';

export interface LoginLocalDeps {
  userRepository: UserRepository;
  tokenService: TokenService;
  passwordHasher: PasswordHasher;
}

export class LoginLocal {
  constructor(private readonly deps: LoginLocalDeps) {}

  async execute(request: LoginLocalRequest): Promise<LoginLocalResult> {
    const email = new Email(request.email);
    const user = await this.deps.userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordHash = user.passwordHash;
    if (!passwordHash) {
      throw new InvalidCredentialsError();
    }

    const isValid = await this.deps.passwordHasher.compare(
      request.password,
      passwordHash.toString()
    );

    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const accessToken = this.deps.tokenService.signAccessToken({
      email: user.email.toString(),
      sub: user.id.toString(),
    });

    return {
      id: user.id.toString(),
      email: user.email.toString(),
      name: user.name.toString(),
      accessToken: accessToken,
    };
  }
}
