import { randomUUID } from 'crypto';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { RegisterLocalUserRequest, RegisterLocalUserResult } from '../dto';
import { Email } from '../../domain/value-objects/Email';
import { User } from '../../domain/aggregates/User';
import { PasswordHasher } from '../ports/PasswordHasher';
import { UserAlreadyExistsError } from '../../domain/errors/domain/UserAlreadyExistsError';
import { Clock, SystemClock } from '../../shared/domain/time/Clock';

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
      throw new UserAlreadyExistsError(request.email);
    }

    const hashedPassword = await this.deps.passwordHasher.hash(request.password);

    const user = User.create(
      {
        id: randomUUID(),
        name: request.name,
        email: email.toString(),
        passwordHash: hashedPassword,
        image: request.image,
      },
      { clock: this.clock }
    );

    await this.deps.userRepository.save(user);

    return {
      id: user.id.toString(),
      name: user.name.toString(),
      email: user.email.toString(),
    };
  }
}
