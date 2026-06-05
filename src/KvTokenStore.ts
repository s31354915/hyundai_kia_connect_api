import { Token } from "./token.js";

export class KvTokenStore {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  private key(username: string, region: string): string {
    return `token:${region}:${username}`;
  }

  async get(username: string, region: string): Promise<Token | null> {
    const raw = await this.kv.get(this.key(username, region));
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      return Token.fromDict(data);
    } catch {
      return null;
    }
  }

  async put(username: string, region: string, token: Token): Promise<void> {
    await this.kv.put(this.key(username, region), JSON.stringify(token.toDict()));
  }

  async delete(username: string, region: string): Promise<void> {
    await this.kv.delete(this.key(username, region));
  }

  async getOtpState(username: string, region: string): Promise<Record<string, any> | null> {
    const raw = await this.kv.get(`otp:${region}:${username}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async putOtpState(username: string, region: string, state: Record<string, any>): Promise<void> {
    await this.kv.put(`otp:${region}:${username}`, JSON.stringify(state), { expirationTtl: 600 });
  }

  async deleteOtpState(username: string, region: string): Promise<void> {
    await this.kv.delete(`otp:${region}:${username}`);
  }
}
