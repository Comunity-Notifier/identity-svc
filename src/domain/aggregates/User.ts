import { Id } from '../value-objects/Id';
import { Name } from '../value-objects/Name';
import { Email } from '../value-objects/Email';
import { Image } from '../value-objects/Image';
import { CreatedAt } from '../value-objects/CreatedAt';
import { UpdatedAt } from '../value-objects/UpdatedAt';
import { Clock, SystemClock } from '../../shared/domain/time/Clock';
import { PasswordHash } from '../value-objects/PasswordHash';

interface UserProps {
  id: Id;
  name: Name;
  email: Email;
  image?: Image;
  passwordHash: PasswordHash;
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

interface UserAccountPrimitive {
  id: string;
  userId: string;
  provider: AuthProvider;
  accountId: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserPrimitives {
  id: string;
  name: string;
  email: string;
  image?: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
  passwordHash: string;
}

interface UserCreateProps {
  id: Id;
  name: Name;
  email: Email;
  passwordHash: PasswordHash;
  image?: Image;
}

export class User {
  constructor(
    private readonly props: UserProps,
    private readonly clock: Clock = new SystemClock()
  ) {
    this.ensureAccountsBelongToUser();
  }

  static create(props: UserCreateProps, opts: { clock?: Clock } = {}): User {
    const clock = opts.clock ?? new SystemClock();
    const now = clock.now();

    return new User(
      {
        id: props.id,
        name: props.name,
        email: props.email,
        image: props.image,
        passwordHash: props.passwordHash,
        createdAt: new CreatedAt(now),
        updatedAt: new UpdatedAt(now),
      },
      clock
    );
  }

  update(fields: Partial<Pick<UserProps, 'name' | 'image' | 'passwordHash'>>): void {
    let changed = false;

    if (fields.name && !this.props.name.equals(fields.name)) {
      this.props.name = fields.name;
      changed = true;
    }

    if (fields.image && !this.props.image?.equals(fields.image)) {
      this.props.image = fields.image;
      changed = true;
    }

    if (fields.passwordHash && !this.props.passwordHash.equals(fields.passwordHash)) {
      this.props.passwordHash = fields.passwordHash;
      changed = true;
    }

    if (changed) {
      this.props.updatedAt = new UpdatedAt(this.clock.now());
    }
  }

  get id(): Id {
    return this.props.id;
  }

  get name(): Name {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): PasswordHash {
    return this.props.passwordHash;
  }

  get image(): Image | undefined {
    return this.props.image;
  }

  get accounts(): Account[] {
    return [...this.props.accounts];
  }

  get createdAt(): CreatedAt {
    return this.props.createdAt;
  }

  get updatedAt(): UpdatedAt {
    return this.props.updatedAt;
  }

  toPrimitives(): UserPrimitives {
    return {
      id: this.props.id.toString(),
      name: this.props.name.toString(),
      email: this.props.email.toString(),
      image: this.props.image?.toString(),
      passwordHash: this.props.password?.toString(),
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      passwordHash: this.props.passwordHash.toString(),
    };
  }

  static fromPrimitives(props: UserPrimitives, clock: Clock = new SystemClock()): User {
    return new User(
      {
        id: new Id(props.id),
        name: new Name(props.name),
        email: new Email(props.email),
        image: props.image ? new Image(props.image) : undefined,
        password: props.passwordHash ? new Password(props.passwordHash, true) : undefined,
        accounts: props.accounts.map(
          (account) =>
            new Account({
              id: new Id(account.id),
              userId: new Id(account.userId),
              provider: new AuthProviderType(account.provider),
              accountId: new AccountExternalId(account.accountId),
              email: account.email ? new Email(account.email) : undefined,
              createdAt: new CreatedAt(new Date(account.createdAt)),
              updatedAt: new UpdatedAt(new Date(account.updatedAt)),
            })
        ),
        createdAt: new CreatedAt(new Date(props.createdAt)),
        updatedAt: new UpdatedAt(new Date(props.updatedAt)),
      },
      clock
    );
  }

  private ensureAccountsBelongToUser(): void {
    for (const account of this.props.accounts) {
      if (!account.userId.equals(this.props.id)) {
        throw new Error('UserAccountOwnerMismatch');
      }
    }
  }
}
