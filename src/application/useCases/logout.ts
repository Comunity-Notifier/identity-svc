import { LogoutCommand, LogoutResult } from '../dtos';
import { UserId } from '../../domain/valueObjects/userId';

export class Logout {
  execute(command: LogoutCommand): LogoutResult {
    const userId = UserId.create(command.userId);
    return { userId: userId.toString() };
  }
}
