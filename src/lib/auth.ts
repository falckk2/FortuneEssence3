import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import { config } from '@/config';
import { CustomerRepository } from '@/repositories/customers/CustomerRepository';

const customerRepository = new CustomerRepository();

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: config.database.supabaseUrl,
    secret: config.database.supabaseAnonKey,
  }),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          const result = await customerRepository.verifyPassword(
            credentials.email,
            credentials.password
          );

          if (!result.success || !result.data) {
            throw new Error(result.error || 'Authentication failed');
          }

          const user = result.data;
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = (user as {firstName?: string}).firstName;
        token.lastName = (user as {lastName?: string}).lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as {firstName?: string}).firstName = token.firstName as string;
        (session.user as {lastName?: string}).lastName = token.lastName as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to the URL the user was trying to access
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: config.auth.nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
};
