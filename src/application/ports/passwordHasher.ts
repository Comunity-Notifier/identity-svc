import { PasswordHash } from '../../domain/valueObjects/passwordHash';

export interface PasswordHasher {
  hash(this: void, plain: string): Promise<PasswordHash>;
  verify(this: void, plain: string, hash: PasswordHash): Promise<boolean>;
}
