const RSABigInteger = {
  // Minimal BigInt-based RSA operations for PKCS1 v1.5
  // Workers support BigInt natively
};

export function toIntEnum<T extends Record<string | number, any>>(
  enumObj: T, value: string | number | null | undefined
): T[keyof T] | null {
  if (value == null) return null;
  const numericValues = Object.values(enumObj).filter(v => typeof v === "number") as number[];
  try {
    const intVal = typeof value === "string" ? parseInt(value, 10) : value;
    if (numericValues.includes(intVal)) return intVal as T[keyof T];
    return null;
  } catch {
    return null;
  }
}

export function getChildValue(data: any, key: string): any {
  let value = data;
  for (const x of key.split(".")) {
    try {
      value = value[x];
    } catch {
      try {
        value = value[parseInt(x, 10)];
      } catch {
        return null;
      }
    }
    if (value == null) return null;
  }
  return value;
}

export function getFloat(value: any): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function getHexTempIntoIndex(value: string | null): number | null {
  if (value != null) {
    const stripped = value.replace("H", "");
    return parseInt(stripped, 16);
  }
  return null;
}

export function getIndexIntoHexTemp(value: number | null): string | null {
  if (value != null) {
    const hex = value.toString(16);
    return hex.toUpperCase().padStart(3, "0") + "H";
  }
  return null;
}

export function parseDatetime(value: string | null, timezone: string | null): Date {
  if (!value) return new Date("2000-01-01T00:00:00Z");

  // Try parsing the new format: "Tue, 24 Jun 2025 16:18:10 GMT"
  const gmtMatch = value.match(/^[A-Z][a-z]{2},\s+\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+GMT$/);
  if (gmtMatch) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }

  // Old format: YYYYMMDDHHmmss or with T, -, :, Z separators
  const cleaned = value.replace(/[-T:Z]/g, "");
  const m = cleaned.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (m) {
    const d = new Date(
      Date.UTC(
        parseInt(m[1], 10),
        parseInt(m[2], 10) - 1,
        parseInt(m[3], 10),
        parseInt(m[4], 10),
        parseInt(m[5], 10),
        parseInt(m[6], 10),
      )
    );
    return d;
  }

  throw new Error(`Unable to parse datetime value: ${value}`);
}

export function getSafeLocalDatetime(date: Date | null): Date | null {
  return date;
}

export function detectTimezoneForDate(
  date: Date,
  refDate: Date,
  timezones: string[],
): string | null {
  for (const tz of timezones) {
    try {
      // Compute delta by creating dates in the given timezone
      const tzDate = new Date(date.toLocaleString("en-US", { timeZone: tz }));
      const refTzDate = new Date(refDate.toLocaleString("en-US", { timeZone: tz }));
      const delta = Math.abs(refTzDate.getTime() - tzDate.getTime()) / 1000;
      if (delta < 20 * 60) return tz;
    } catch {
      continue;
    }
  }
  return null;
}

export function parseDateBr(dateString: string | null, tz: string): Date | null {
  if (!dateString) return null;

  if (dateString.length >= 14) {
    const m = dateString.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
    if (m) {
      return new Date(
        Date.UTC(
          parseInt(m[1], 10),
          parseInt(m[2], 10) - 1,
          parseInt(m[3], 10),
          parseInt(m[4], 10),
          parseInt(m[5], 10),
          parseInt(m[6], 10),
        )
      );
    }
  }

  if (dateString.length >= 8) {
    const m = dateString.match(/^(\d{4})(\d{2})(\d{2})/);
    if (m) {
      return new Date(
        Date.UTC(
          parseInt(m[1], 10),
          parseInt(m[2], 10) - 1,
          parseInt(m[3], 10),
        )
      );
    }
  }

  return null;
}

// RSA PKCS1 v1.5 encryption using Web Crypto API
// Used by EU login to encrypt passwords with server-provided RSA public key
export async function rsaEncryptPkcs1v15(
  jwkN: string, // base64url-encoded modulus
  jwkE: string, // base64url-encoded exponent
  plaintext: Uint8Array,
): Promise<string> {
  // Decode base64url to BigInt
  function base64UrlToBigInt(b64url: string): bigint {
    let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) b64 += "=";
    const binary = atob(b64);
    let hex = "";
    for (let i = 0; i < binary.length; i++) {
      hex += binary.charCodeAt(i).toString(16).padStart(2, "0");
    }
    return hex.length > 0 ? BigInt("0x" + hex) : 0n;
  }

  const n = base64UrlToBigInt(jwkN);
  const e = base64UrlToBigInt(jwkE);

  // Import RSA public key via Web Crypto API
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "RSA", n: jwkN, e: jwkE, alg: "RSA-OAEP" }, // we'll use raw RSA below
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );

  // PKCS1 v1.5 padding
  const keyLen = Math.ceil(n.toString(16).length / 2);
  const msgLen = plaintext.length;
  if (msgLen > keyLen - 11) {
    throw new Error("Message too long for RSA key");
  }

  const padded = new Uint8Array(keyLen);
  padded[0] = 0x00;
  padded[1] = 0x02;
  // Non-zero random bytes
  for (let i = 2; i < keyLen - msgLen - 1; i++) {
    let rand = 0;
    while (rand === 0) {
      const buf = new Uint8Array(1);
      crypto.getRandomValues(buf);
      rand = buf[0];
    }
    padded[i] = rand;
  }
  padded[keyLen - msgLen - 1] = 0x00;
  padded.set(plaintext, keyLen - msgLen);

  // Manual RSA math: m^e mod n using BigInt
  const m = bufferToBigInt(padded);
  const c = bigIntModPow(m, e, n);
  return bigIntToHex(c);
}

function bufferToBigInt(buf: Uint8Array): bigint {
  let hex = "";
  for (const b of buf) hex += b.toString(16).padStart(2, "0");
  return hex.length > 0 ? BigInt("0x" + hex) : 0n;
}

function bigIntToHex(n: bigint): string {
  return n.toString(16);
}

function bigIntModPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % mod;
    }
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
}
