import { User } from '../../../src/domain/entities/User';
import { Id } from '../../../src/domain/value-objects/Id';
import { Name } from '../../../src/domain/value-objects/Name';
import { Email } from '../../../src/domain/value-objects/Email';
import { Image } from '../../../src/domain/value-objects/Image';
import { CreatedAt } from '../../../src/domain/value-objects/CreatedAt';
import { UpdatedAt } from '../../../src/domain/value-objects/UpdatedAt';

describe('User Entity', () => {
  const now = new Date('2025-10-10T10:00:00Z');
  const props = {
    id: new Id('123e4567-e89b-12d3-a456-426614174000'),
    name: new Name('Henry'),
    email: new Email('henry@example.com'),
    image: new Image('https://example.com/avatar.png'),
    createdAt: new CreatedAt(now),
    updatedAt: new UpdatedAt(now),
  };

  it('should expose all props via getters', () => {
    const user = new User(props);
    expect(user.id.equals(props.id)).toBe(true);
    expect(user.name.equals(props.name)).toBe(true);
    expect(user.email.equals(props.email)).toBe(true);
    expect(user.image?.equals(props.image)).toBe(true);
    expect(user.createdAt.equals(props.createdAt)).toBe(true);
    expect(user.updatedAt.equals(props.updatedAt)).toBe(true);
  });

  it('should update name and updatedAt if name changes', () => {
    const user = new User({ ...props });
    const newName = new Name('Henri');

    user.update({ name: newName });

    expect(user.name.equals(newName)).toBe(true);
    expect(user.updatedAt.toDate().getTime()).toBeGreaterThan(now.getTime());
  });

  it('should update image and updatedAt if image changes', () => {
    const user = new User({ ...props });
    const newImage = new Image('https://example.com/new-avatar.png');

    user.update({ image: newImage });

    expect(user.image?.equals(newImage)).toBe(true);
    expect(user.updatedAt.toDate().getTime()).toBeGreaterThan(now.getTime());
  });

  it('should update both name and image if both change', () => {
    const user = new User({ ...props });
    const newName = new Name('Henri');
    const newImage = new Image('https://example.com/new-avatar.png');

    user.update({ name: newName, image: newImage });

    expect(user.name.equals(newName)).toBe(true);
    expect(user.image?.equals(newImage)).toBe(true);
    expect(user.updatedAt.toDate().getTime()).toBeGreaterThan(now.getTime());
  });

  it('should not update updatedAt if neither name nor image change', () => {
    const user = new User({ ...props });
    user.update({ name: new Name('Henry'), image: new Image('https://example.com/avatar.png') });

    expect(user.updatedAt.equals(props.updatedAt)).toBe(true);
  });

  it('should allow image to be undefined', () => {
    const user = new User({ ...props, image: undefined });
    expect(user.image).toBeUndefined();

    const newImage = new Image('https://example.com/new.png');
    user.update({ image: newImage });

    expect(user.image?.equals(newImage)).toBe(true);
    expect(user.updatedAt.toDate().getTime()).toBeGreaterThan(now.getTime());
  });
});
