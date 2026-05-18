import { SvelteKitAuth } from '@auth/sveltekit';
import Credentials from '@auth/sveltekit/providers/credentials';
import { CustomerRepository } from '$lib/repositories/customers/CustomerRepository';
import { getSupabaseServer } from '$lib/supabase-server';

const customerRepository = new CustomerRepository();

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [
		Credentials({
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					throw new Error('Email and password are required');
				}

				const result = await customerRepository.verifyPassword(
					credentials.email as string,
					credentials.password as string
				);

				if (!result.success || !result.data) {
					throw new Error(result.error || 'Authentication failed');
				}

				const user = result.data;

				let isAdmin = false;
				try {
					const supabaseServer = getSupabaseServer();
					const { data: adminData } = await supabaseServer
						.from('customers')
						.select('is_admin')
						.eq('id', user.id)
						.single();
					isAdmin = adminData?.is_admin ?? false;
				} catch {
					// Non-fatal: default to false
				}

				return {
					id: user.id,
					email: user.email,
					name: `${user.firstName} ${user.lastName}`,
					firstName: user.firstName,
					lastName: user.lastName,
					isAdmin,
				};
			},
		}),
	],
	session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.firstName = (user as { firstName?: string }).firstName;
				token.lastName = (user as { lastName?: string }).lastName;
				token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
			}
			return token;
		},
		async session({ session, token }) {
			if (token) {
				session.user.id = token.id as string;
				(session.user as { firstName?: string }).firstName = token.firstName as string;
				(session.user as { lastName?: string }).lastName = token.lastName as string;
				(session.user as { isAdmin?: boolean }).isAdmin = token.isAdmin as boolean;
			}
			return session;
		},
	},
	pages: {
		signIn: '/auth/signin',
		error: '/auth/error',
	},
	secret: process.env.AUTH_SECRET,
	trustHost: true,
});
