import { User } from '../../domain/aggregates/user';
import { Email } from '../../domain/valueObjects/email';
import { UserId } from '../../domain/valueObjects/userId';

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
}
