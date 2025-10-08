import { AuthenticatedUser, GetMeQuery, GetMeResult } from '../dtos';
import { UserRepository } from '../ports/userRepository';
import { UserId } from '../../domain/valueObjects/userId';
import { UserNotFoundError } from '../../domain/domainErrors';

export interface GetMeDeps {
  userRepository: UserRepository;
}

export class GetMe {
  constructor(private readonly deps: GetMeDeps) {}

  async execute(query: GetMeQuery): Promise<GetMeResult> {
    const userId = UserId.create(query.userId);
    const user = await this.deps.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(userId.toString());
    }

    const result: AuthenticatedUser = {
      id: user.id.toString(),
      email: user.email.toString(),
      name: user.name.toString(),
    };

    return { user: result };
  }
}
