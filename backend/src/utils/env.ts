import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default("3000"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  DATABASE_TYPE: z.enum(["memory", "firebase", "supabase"]).optional(),
  DB_TYPE: z.enum(["memory", "firebase", "supabase"]).optional(),
  LOG_LEVEL: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]).optional(),
  CORS_ORIGIN: z.string().optional(),
  
  // Twilio (optional)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // Firebase Admin SDK (optional)
  FIREBASE_TYPE: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_CLIENT_ID: z.string().optional(),
  FIREBASE_AUTH_URI: z.string().optional(),
  FIREBASE_TOKEN_URI: z.string().optional(),
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL: z.string().optional(),
  FIREBASE_CLIENT_X509_CERT_URL: z.string().optional(),
  FIREBASE_UNIVERSE_DOMAIN: z.string().optional(),
  
  // Firebase Client SDK (optional, for frontend)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  
  // Supabase (optional)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function getEnv(): Env {
  if (!validatedEnv) {
    try {
      validatedEnv = envSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ Environment variable validation failed:");
        error.errors.forEach((err) => {
          console.error(`  - ${err.path.join(".")}: ${err.message}`);
        });
        process.exit(1);
      }
      throw error;
    }
  }
  
  return validatedEnv;
}

// Validate on import
getEnv();

