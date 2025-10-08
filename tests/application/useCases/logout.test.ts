import { describe, expect, it } from '@jest/globals';

import { Logout } from '../../../src/application/useCases/logout';
import { UserId } from '../../../src/domain/valueObjects/userId';

describe('Logout use case', () => {
  it('returns normalized user id', () => {
    const useCase = new Logout();
    const userId = UserId.generate().toString();

    const result = useCase.execute({ userId });

    expect(result.userId).toBe(userId);
  });
});
