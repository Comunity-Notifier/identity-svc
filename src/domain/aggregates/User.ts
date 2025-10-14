import { Id } from '../value-objects/Id';
import { Name } from '../value-objects/Name';
import { Email } from '../value-objects/Email';
import { Image } from '../value-objects/Image';
import { CreatedAt } from '../value-objects/CreatedAt';
import { UpdatedAt } from '../value-objects/UpdatedAt';
import { Clock, SystemClock } from '../../shared/domain/time/Clock';

interface UserProps {
  id: Id;
  name: Name;
  email: Email;
  image?: Image;
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

interface UserPrimitives {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export class User {
  constructor(
    private readonly props: UserProps,
    private readonly clock: Clock = new SystemClock()
  ) {}

  update(fields: Partial<Pick<UserProps, 'name' | 'image'>>): void {
    let changed = false;

    if (fields.name && !this.props.name.equals(fields.name)) {
      this.props.name = fields.name;
      changed = true;
    }

    if (fields.image && !this.props.image?.equals(fields.image)) {
      this.props.image = fields.image;
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

  get image(): Image | undefined {
    return this.props.image;
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
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
