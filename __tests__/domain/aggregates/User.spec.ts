import { User } from '../../../src/domain/aggregates/User';
import { Id } from '../../../src/domain/value-objects/Id';
import { Name } from '../../../src/domain/value-objects/Name';
import { Email } from '../../../src/domain/value-objects/Email';
import { Image } from '../../../src/domain/value-objects/Image';
import { CreatedAt } from '../../../src/domain/value-objects/CreatedAt';
import { UpdatedAt } from '../../../src/domain/value-objects/UpdatedAt';
import { Clock, SystemClock } from '../../../src/shared/domain/time/Clock';
import { PasswordHash } from '../../../src/domain/value-objects/PasswordHash';

describe('User Entity', () => {
  const now = new Date('2025-10-10T10:00:00Z');

  afterEach(() => {
    jest.restoreAllMocks();
  });

  class FixedClock implements Clock {
    private current: Date;

    constructor(initial: Date) {
      this.current = new Date(initial);
    }

    now(): Date {
      return new Date(this.current);
    }

    tick(milliseconds: number): void {
      this.current = new Date(this.current.getTime() + milliseconds);
    }
  }

  const createProps = () => ({
    id: new Id('123e4567-e89b-12d3-a456-426614174000'),
    name: new Name('Henry'),
    email: new Email('henry@example.com'),
    image: new Image('https://example.com/avatar.png'),
    passwordHash: new PasswordHash('12345678'),
    createdAt: new CreatedAt(now),
    updatedAt: new UpdatedAt(now),
  });

  it('should create a user from value objects using system clock', () => {
    const creationDate = new Date('2024-01-01T00:00:00Z');
    const clockSpy = jest.spyOn(SystemClock.prototype, 'now').mockReturnValue(creationDate);

    const user = User.create({
      id: new Id('a3c3b55d-6ecd-4a31-8eac-3f8cb36b75c0'),
      name: new Name('Alice'),
      email: new Email('alice@example.com'),
      passwordHash: new PasswordHash('hashed-password'),
      image: new Image('https://example.com/avatar.png'),
    });

    expect(clockSpy).toHaveBeenCalledTimes(1);
    expect(user.id.toString()).toBe('a3c3b55d-6ecd-4a31-8eac-3f8cb36b75c0');
    expect(user.name.toString()).toBe('Alice');
    expect(user.email.toString()).toBe('alice@example.com');
    expect(user.passwordHash.toString()).toBe('hashed-password');
    expect(user.image?.toString()).toBe('https://example.com/avatar.png');
    expect(user.createdAt.toISOString()).toBe(creationDate.toISOString());
    expect(user.updatedAt.toISOString()).toBe(creationDate.toISOString());
  });

  it('should allow providing a custom clock when creating the user', () => {
    const clock = new FixedClock(now);

    const user = User.create(
      {
        id: new Id('b7ab5db3-5e1a-4740-833a-0f5f9c70efbc'),
        name: new Name('Henry'),
        email: new Email('henry@example.com'),
        passwordHash: new PasswordHash('hashed-password'),
      },
      { clock }
    );

    expect(user.createdAt.toISOString()).toBe(now.toISOString());
    expect(user.updatedAt.toISOString()).toBe(now.toISOString());

    const newName = new Name('Henri');
    clock.tick(2000);
    user.update({ name: newName });

    expect(user.name.equals(newName)).toBe(true);
    expect(user.updatedAt.toISOString()).toBe(clock.now().toISOString());
  });

  it('should expose all props via getters', () => {
    const props = createProps();
    const user = new User(props);
    expect(user.id.equals(props.id)).toBe(true);
    expect(user.name.equals(props.name)).toBe(true);
    expect(user.email.equals(props.email)).toBe(true);
    expect(user.image?.equals(props.image)).toBe(true);
    expect(user.createdAt.equals(props.createdAt)).toBe(true);
    expect(user.updatedAt.equals(props.updatedAt)).toBe(true);
    expect(user.passwordHash.equals(props.passwordHash)).toBe(true);
  });

  it('should return primitives', () => {
    const user = new User(createProps());

    expect(user.toPrimitives()).toEqual({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Henry',
      email: 'henry@example.com',
      image: 'https://example.com/avatar.png',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      passwordHash: '12345678',
    });
  });

  it('should update name and updatedAt if name changes', () => {
    const clock = new FixedClock(now);
    const user = new User(createProps(), clock);
    const newName = new Name('Henri');

    clock.tick(1000);
    user.update({ name: newName });

    expect(user.name.equals(newName)).toBe(true);
    expect(user.updatedAt.toISOString()).toBe(clock.now().toISOString());
  });

  it('should update image and updatedAt if image changes', () => {
    const clock = new FixedClock(now);
    const user = new User(createProps(), clock);
    const newImage = new Image('https://example.com/new-avatar.png');

    clock.tick(2000);
    user.update({ image: newImage });

    expect(user.image?.equals(newImage)).toBe(true);
    expect(user.updatedAt.toISOString()).toBe(clock.now().toISOString());
  });

  it('should update both name and image if both change', () => {
    const clock = new FixedClock(now);
    const user = new User(createProps(), clock);
    const newName = new Name('Henri');
    const newImage = new Image('https://example.com/new-avatar.png');

    clock.tick(3000);
    user.update({ name: newName, image: newImage });

    expect(user.name.equals(newName)).toBe(true);
    expect(user.image?.equals(newImage)).toBe(true);
    expect(user.updatedAt.toISOString()).toBe(clock.now().toISOString());
  });

  it('should not update updatedAt if neither name nor image change', () => {
    const clock = new FixedClock(now);
    const props = createProps();
    const user = new User(props, clock);

    clock.tick(4000);
    user.update({ name: new Name('Henry'), image: new Image('https://example.com/avatar.png') });

    expect(user.updatedAt.equals(props.updatedAt)).toBe(true);
  });

  it('should allow image to be undefined', () => {
    const clock = new FixedClock(now);
    const user = new User({ ...createProps(), image: undefined }, clock);
    expect(user.image).toBeUndefined();

    const newImage = new Image('https://example.com/new.png');
    clock.tick(5000);
    user.update({ image: newImage });

    expect(user.image?.equals(newImage)).toBe(true);
    expect(user.updatedAt.toISOString()).toBe(clock.now().toISOString());
  });
});
