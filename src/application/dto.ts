export interface LoginLocalResult {
  id: string;
  email: string;
  name: string;
  accessToken: string;
}

export interface LoginLocalRequest {
  email: string;
  password: string;
}

export interface RegisterLocalUserRequest {
  name: string;
  email: string;
  password: string;
  image?: string;
}

export interface RegisterLocalUserResult {
  id: string;
  name: string;
  email: string;
}
