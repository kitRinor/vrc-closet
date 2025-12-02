import * as bcrypt from 'bcrypt';
import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid'; // For random token ID

// 💡 JWT Secretを環境変数から取得
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_jwt_key_for_testing_only';
const JWT_EXPIRATION_TIME = '30d'; // Token valid for 30 days
const SALT_ROUNDS = 10; 

const encodedSecret = new TextEncoder().encode(JWT_SECRET);


// passward utils

/** Hashes the plain text password. */
export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/** Compares the input password against the stored hash. */
export const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

// JWT utils

/** Generates a custom signed JWT for a given user ID. */
export const signToken = async (userId: string) => {
  return new jose.SignJWT({ sub: userId }) 
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setJti(uuidv4()) // Unique JWT ID for tracking/revocation (good practice)
    .setExpirationTime(JWT_EXPIRATION_TIME)
    .sign(encodedSecret);
};

/** Verifies the token and returns the payload. */
export const verifyToken = async (token: string) => {
  const { payload } = await jose.jwtVerify(token, encodedSecret);
  return payload;
};