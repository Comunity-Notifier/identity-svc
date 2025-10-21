import jwt from 'jsonwebtoken';
import { TokenPayload } from 'src/application/ports/TokenService';
import { JwtTokenService } from 'src/infrastructure/services/JwtTokenService';
import { SystemClock } from 'src/shared/domain/time/Clock';

describe('JwtTokenService ', () => {
  const secret = 'test_secret';
  const tokenConfig = { secret, expiresIn: '1h' };
  const clock = new SystemClock();

  let service: JwtTokenService;

  beforeEach(() => {
    service = new JwtTokenService({ tokenConfig, clock });
  });

  it('should generate a valid token and expiration date', () => {
    const payload: TokenPayload = { sub: 'user123', email: 'test@example.com' };

    const result = service.signAccessToken(payload);

    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('expiresAt');
    expect(result.expiresAt).toBeInstanceOf(Date);

    const decoded = jwt.verify(result.token, secret) as TokenPayload;
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
  });

  it('should verify a valid token', () => {
    const payload: TokenPayload = { sub: 'user123', email: 'email@gmail.com' };
    const { token } = service.signAccessToken(payload);

    const verified = service.verify(token);
    expect(verified.sub).toBe(payload.sub);
  });

  it('should throw an error for an invalid token', () => {
    expect(() => service.verify('invalid.token')).toThrow();
  });

  it('should respect the configured expiresIn', () => {
    const start = clock.now().getTime();
    const result = service.signAccessToken({ sub: 'user123', email: 'email@gmail.com' });
    const diff = result.expiresAt.getTime() - start;

    // 1h = 3600000ms ± tolerancia
    expect(diff).toBeGreaterThanOrEqual(3599_000);
    expect(diff).toBeLessThanOrEqual(3601_000);
  });
});
