export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class EmailAlreadyTakenError extends DomainError {
  readonly email: string;

  constructor(email: string) {
    super(`Email ${email} is already taken`);
    this.email = email;
  }
}

export class AccountAlreadyLinkedError extends DomainError {
  readonly provider: string;
  readonly providerUserId: string;

  constructor(provider: string, providerUserId: string) {
    super(`Account (provider=${provider}, providerUserId=${providerUserId}) is already linked`);
    this.provider = provider;
    this.providerUserId = providerUserId;
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid credentials');
  }
}

export class ProviderNotConfiguredError extends DomainError {
  readonly provider: string;

  constructor(provider: string) {
    super(`Provider ${provider} is not configured`);
    this.provider = provider;
  }
}

export class OAuthStateExpiredError extends DomainError {
  constructor() {
    super('OAuth state is expired or invalid');
  }
}

export class OAuthProfileEmailRequiredError extends DomainError {
  constructor(provider: string) {
    super(`OAuth profile from provider ${provider} is missing email`);
  }
}

export class AccountNotLinkedError extends DomainError {
  readonly provider: string;

  constructor(provider: string) {
    super(`Account for provider ${provider} is not linked`);
    this.provider = provider;
  }
}

export class UserNotFoundError extends DomainError {
  readonly userId: string;

  constructor(userId: string) {
    super(`User ${userId} was not found`);
    this.userId = userId;
  }
}
