import { UserRepository } from '../../domain/repositories/UserRepository';
import { RegisterLocalUserRequest, RegisterLocalUserResult } from '../dto';
import { Email } from '../../domain/value-objects/Email';
import { User } from '../../domain/aggregates/User';
import { PasswordHasher } from '../ports/PasswordHasher';
import { UserAlreadyExistsError } from '../../domain/errors/domain/UserAlreadyExistsError';
import { Clock, SystemClock } from '../../shared/domain/time/Clock';
import { Name } from '../../domain/value-objects/Name';
import { Image } from '../../domain/value-objects/Image';
import { PasswordPlain } from '../../domain/value-objects/PasswordPlain';
import { PasswordHash } from '../../domain/value-objects/PasswordHash';
import { Id } from '../../domain/value-objects/Id';

export interface RegisterLocalUserDeps {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  clock?: Clock;
}

export class RegisterLocalUser {
  private readonly clock: Clock;

  constructor(private readonly deps: RegisterLocalUserDeps) {
    this.clock = deps.clock ?? new SystemClock();
  }

  async execute(request: RegisterLocalUserRequest): Promise<RegisterLocalUserResult> {
    const email = new Email(request.email);

    const existing = await this.deps.userRepository.findByEmail(email);
    if (existing) {
      throw new UserAlreadyExistsError(email.toString());
    }

    const id = new Id(request.id);
    const name = new Name(request.name);
    const image = request.image ? new Image(request.image) : undefined;
    const plainPassword = new PasswordPlain(request.password);
    const hashedPassword = await this.deps.passwordHasher.hash(plainPassword.toString());
    const passwordHash = new PasswordHash(hashedPassword);

    const user = User.create({
      id,
      name,
      email,
      passwordHash,
      image,
      clock: this.clock,
    });

    await this.deps.userRepository.save(user);

    return {
      id: user.id.toString(),
      name: user.name.toString(),
      email: user.email.toString(),
    };
  }
}
