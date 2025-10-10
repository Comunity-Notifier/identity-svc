import { Id } from '../value-objects/Id';
import { Name } from '../value-objects/Name';
import { Email } from '../value-objects/Email';
import { Image } from '../value-objects/Image';
import { CreatedAt } from '../value-objects/CreatedAt';
import { UpdatedAt } from '../value-objects/UpdatedAt ';

export interface UserProps {
  id: Id;
  name: Name;
  email: Email;
  image?: Image;
  createdAt: CreatedAt;
  updatedAt: UpdatedAt;
}

export class User {
  constructor(private readonly props: UserProps) {}

  update(fields: Partial<Pick<UserProps, 'name' | 'image'>>): void {
    let changed = false;

    if (fields.name && !this.props.name.equals(fields.name)) {
      this.props.name = fields.name;
      changed = true;
    }

    if (fields.image && this.props.image?.equals(fields.image) === false) {
      this.props.image = fields.image;
      changed = true;
    }

    if (changed) {
      this.props.updatedAt = new UpdatedAt(new Date());
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
}
