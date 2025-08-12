import { SignJWT, jwtVerify, importSPKI, importPKCS8 } from 'jose';
import { getSigningKeys } from '../config.js';
const ALG = 'ES256';
export async function generateAccessToken(subject, claims = {}) {
    const { privateKeyPEM } = await getSigningKeys();
    const privateKey = await importPKCS8(privateKeyPEM, ALG);
    const jwt = await new SignJWT({ ...claims })
        .setProtectedHeader({ alg: ALG })
        .setSubject(subject)
        .setIssuedAt()
        .setExpirationTime('15m')
        .setIssuer('remittance-api')
        .setAudience('remittance-mobile')
        .sign(privateKey);
    return jwt;
}
export async function verifyAccessToken(token) {
    const { publicKeyPEM } = await getSigningKeys();
    const publicKey = await importSPKI(publicKeyPEM, ALG);
    const { payload } = await jwtVerify(token, publicKey, {
        issuer: 'remittance-api',
        audience: 'remittance-mobile',
    });
    return payload;
}
