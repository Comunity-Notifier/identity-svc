import { User } from '../aggregates/User';
import { Id } from '../value-objects/Id';
import { Email } from '../value-objects/Email';

export interface UserRepository {
  findById(id: Id): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(user: User): Promise<void>;
}
