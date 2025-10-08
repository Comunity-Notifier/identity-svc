import { OAuthStateRecord } from '../dtos';

export interface OAuthStateStore {
  save(record: OAuthStateRecord): Promise<void>;
  get(state: string): Promise<OAuthStateRecord | null>;
  consume(state: string): Promise<OAuthStateRecord | null>;
}
