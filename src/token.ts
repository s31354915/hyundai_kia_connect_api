export interface TokenData {
  username: string | null;
  password: string | null;
  access_token: string | null;
  refresh_token: string | null;
  device_id: string | null;
  valid_until: string | null; // ISO 8601 string
  stamp: string | null;
  pin: string | null;
  control_token?: string | null;
  control_token_expires_at?: string | null;
}

export class Token {
  username: string | null;
  password: string | null;
  access_token: string | null;
  refresh_token: string | null;
  device_id: string | null;
  valid_until: Date;
  stamp: string | null;
  pin: string | null;
  control_token?: string | null;
  control_token_expires_at?: Date | null;

  constructor(data: Partial<TokenData> = {}) {
    this.username = data.username ?? null;
    this.password = data.password ?? null;
    this.access_token = data.access_token ?? null;
    this.refresh_token = data.refresh_token ?? null;
    this.device_id = data.device_id ?? null;
    this.stamp = data.stamp ?? null;
    this.pin = data.pin ?? null;
    this.control_token = data.control_token ?? null;

    const validUntil = data.valid_until;
    if (typeof validUntil === "string") {
      this.valid_until = new Date(validUntil);
    } else {
      this.valid_until = new Date(0); // epoch = min
    }

    const ctrlExpires = data.control_token_expires_at;
    if (typeof ctrlExpires === "string") {
      this.control_token_expires_at = new Date(ctrlExpires);
    } else {
      this.control_token_expires_at = null;
    }
  }

  toDict(): TokenData {
    return {
      username: this.username,
      password: this.password,
      access_token: this.access_token,
      refresh_token: this.refresh_token,
      device_id: this.device_id,
      valid_until: this.valid_until.toISOString(),
      stamp: this.stamp,
      pin: this.pin,
      control_token: this.control_token,
      control_token_expires_at: this.control_token_expires_at?.toISOString() ?? null,
    };
  }

  static fromDict(data: Record<string, any>): Token {
    return new Token(data);
  }
}
