import type { DefaultSession } from '@auth/core/types';

declare module '@auth/core/types' {
  interface Session {
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      isAdmin?: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    isAdmin?: boolean;
  }
}
