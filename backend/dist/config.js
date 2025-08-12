import { createPrivateKey, createPublicKey } from 'crypto';
import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose';
export const config = {
    port: parseInt(process.env.PORT ?? '8080', 10),
    databaseUrl: process.env.DATABASE_URL ?? 'postgres://app:app@localhost:5432/remittance',
    redisUrl: process.env.REDIS_URL,
};
let cachedKeys = null;
export async function getSigningKeys() {
    if (cachedKeys)
        return cachedKeys;
    const priv = process.env.JWT_PRIVATE_KEY_PEM;
    const pub = process.env.JWT_PUBLIC_KEY_PEM;
    if (priv && pub) {
        // Validate keys
        createPrivateKey(priv);
        createPublicKey(pub);
        cachedKeys = { privateKeyPEM: priv, publicKeyPEM: pub };
        return cachedKeys;
    }
    const { privateKey, publicKey } = await generateKeyPair('ES256');
    const privateKeyPEM = await exportPKCS8(privateKey);
    const publicKeyPEM = await exportSPKI(publicKey);
    cachedKeys = { privateKeyPEM, publicKeyPEM };
    return cachedKeys;
}
