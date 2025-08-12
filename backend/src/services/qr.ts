import { importPKCS8, importSPKI, SignJWT, jwtVerify } from 'jose';
import { getSigningKeys } from '../config.js';

const ALG = 'ES256';

export async function generateQrJws(payload: Record<string, unknown>, expiresInSeconds: number): Promise<string> {
  const { privateKeyPEM } = await getSigningKeys();
  const privateKey = await importPKCS8(privateKeyPEM, ALG);
  const jws = await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG, typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(privateKey);
  return jws;
}

export async function verifyQrJws(jws: string) {
  const { publicKeyPEM } = await getSigningKeys();
  const publicKey = await importSPKI(publicKeyPEM, ALG);
  const { payload } = await jwtVerify(jws, publicKey);
  return payload;
}