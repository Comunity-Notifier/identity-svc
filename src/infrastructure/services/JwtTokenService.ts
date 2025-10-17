import jwt from 'jsonwebtoken';
import { SignedTokenResult, TokenPayload, TokenService } from 'src/application/ports/TokenService';
import { Clock, SystemClock } from 'src/shared/domain/time/Clock';

export interface TokenConfig {
  secret?: string;
  expiresIn?: string;
}

export class JwtTokenService implements TokenService {
  private readonly config?: TokenConfig;
  private readonly clock: Clock;

  constructor({ tokenConfig, clock }: { tokenConfig?: TokenConfig; clock?: Clock }) {
    if (!tokenConfig?.secret) {
      console.warn('⚠️  The JWT secret is undefined. A default insecure value is being used.');
    }
    this.clock = clock ?? new SystemClock();
    this.config = tokenConfig;
  }

  signAccessToken(payload: TokenPayload): SignedTokenResult {
    const expiresIn = this.parseExpiresIn(this.config?.expiresIn ?? '1d');
    const token = jwt.sign(payload, this.config?.secret ?? 'token_dev', {
      expiresIn,
    });

    const expiresAt = new Date(this.clock.now().getTime() + expiresIn * 1000);

    return { token, expiresAt };
  }

  verify(token: string): TokenPayload {
    return jwt.verify(token, this.config?.secret ?? 'token_dev') as TokenPayload;
  }

  private parseExpiresIn(value: string | number): number {
    if (typeof value === 'number') return value;
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) throw new Error('Formato inválido en expiresIn');
    const num = Number(match[1]);
    const map = { s: 1, m: 60, h: 3600, d: 86400 };
    const unit = match[2] as keyof typeof map;
    return num * map[unit];
  }
}
