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
