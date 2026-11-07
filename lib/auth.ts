import { type NextAuthOptions, getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import { headers } from 'next/headers';
import { getEasyAuthSession } from '@/lib/azure/easy-auth';

const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
const azureAdClientId = process.env.AZURE_AD_CLIENT_ID ?? '';
const azureAdClientSecret = process.env.AZURE_AD_CLIENT_SECRET ?? '';
const azureAdTenantId = process.env.AZURE_AD_TENANT_ID ?? 'common';
const adminPassword = process.env.ADMIN_PASSWORD ?? '';

// ── Rate limiter for credentials login (brute-force protection) ──
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
let rateLimitCleanupCounter = 0;

function checkLoginRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase().trim();

  // Periodic cleanup: purge stale entries every ~1000 checks to prevent memory leak
  if (++rateLimitCleanupCounter > 1000) {
    rateLimitCleanupCounter = 0;
    for (const [k, v] of loginAttempts) {
      if (now > v.resetAt) loginAttempts.delete(k);
    }
  }

  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true; // allowed
  }
  entry.count++;
  return entry.count <= MAX_LOGIN_ATTEMPTS;
}

export const authProviderAvailability = {
  google: Boolean(googleClientId && googleClientSecret),
  azureAd: Boolean(azureAdClientId && azureAdClientSecret),
  credentials: Boolean(adminPassword && adminEmails.length > 0),
};

const providers: any[] = [];

if (authProviderAvailability.google) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

if (authProviderAvailability.azureAd) {
  providers.push(
    AzureADProvider({
      clientId: azureAdClientId,
      clientSecret: azureAdClientSecret,
      tenantId: azureAdTenantId,
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
    })
  );
}

if (authProviderAvailability.credentials) {
  providers.push(
    CredentialsProvider({
      name: 'Admin Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const inputEmail = credentials.email.toLowerCase().trim();
        
        if (!checkLoginRateLimit(inputEmail)) {
          throw new Error('Too many login attempts. Please try again in 15 minutes.');
        }
        
        if (adminEmails.includes(inputEmail) && credentials.password === adminPassword) {
          return {
            id: inputEmail,
            email: inputEmail,
            name: "Admin User",
          };
        }
        
        return null;
      }
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: '/admin',
    error: '/admin?error=AccessDenied',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') {
        return true; 
      }
      const userEmail = user.email?.toLowerCase() ?? '';
      return adminEmails.includes(userEmail);
    },
    async jwt({ token }) {
      const email = token.email?.toLowerCase() ?? '';
      token.isAdmin = adminEmails.includes(email);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
};

export async function getAdminSession() {
  const easyAuthSession = await getEasyAuthSession(await headers());
  if (easyAuthSession) return easyAuthSession;
  return getServerSession(authOptions);
}

export { isAdminEmail } from '@/lib/azure/easy-auth';
