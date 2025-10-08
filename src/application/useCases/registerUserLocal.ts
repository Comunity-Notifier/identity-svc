import { EmailAlreadyTakenError } from '../../domain/domainErrors';
import { User } from '../../domain/aggregates/user';
import { Email } from '../../domain/valueObjects/email';
import { Name } from '../../domain/valueObjects/name';
import { AuthenticatedUser, RegisterUserLocalCommand, RegisterUserLocalResult } from '../dtos';
import { PasswordHasher } from '../ports/passwordHasher';
import { TokenService } from '../ports/tokenService';
import { UserRepository } from '../ports/userRepository';
import { buildTokenPayload } from './tokenPayload';

export interface RegisterUserLocalDeps {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  tokenService: TokenService;
}

export class RegisterUserLocal {
  constructor(private readonly deps: RegisterUserLocalDeps) {}

  async execute(command: RegisterUserLocalCommand): Promise<RegisterUserLocalResult> {
    const email = Email.create(command.email);
    const existing = await this.deps.userRepository.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyTakenError(email.toString());
    }

    const name = Name.create(command.name);
    const passwordHash = await this.deps.passwordHasher.hash(command.password);
    const user = User.createLocal({
      name,
      email,
      passwordHash,
    });

    await this.deps.userRepository.save(user);

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
