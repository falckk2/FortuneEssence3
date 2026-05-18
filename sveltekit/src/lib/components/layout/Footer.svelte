<script lang="ts">
	import { locale } from '$lib/stores/locale';

	$: isSv = $locale === 'sv';
	$: year = new Date().getFullYear();

	$: footerLinks = {
		shop: {
			title: isSv ? 'Handla' : 'Shop',
			links: [
				{ label: isSv ? 'Alla produkter' : 'All Products', href: '/products' },
				{ label: isSv ? 'Eteriska oljor' : 'Essential Oils', href: '/products?category=essential-oils' },
			],
		},
		account: {
			title: isSv ? 'Mitt konto' : 'My Account',
			links: [
				{ label: isSv ? 'Logga in' : 'Sign In', href: '/auth/signin' },
				{ label: isSv ? 'Skapa konto' : 'Create Account', href: '/auth/signup' },
				{ label: isSv ? 'Mina beställningar' : 'My Orders', href: '/account/orders' },
				{ label: isSv ? 'Önskelista' : 'Wishlist', href: '/wishlist' },
				{ label: isSv ? 'Spåra order' : 'Track Order', href: '/orders/track' },
			],
		},
		support: {
			title: isSv ? 'Kundservice' : 'Customer Support',
			links: [
				{ label: isSv ? 'Kontakta oss' : 'Contact Us', href: '/contact' },
				{ label: isSv ? 'Vanliga frågor' : 'FAQ', href: '/faq' },
				{ label: isSv ? 'Frakt & Leverans' : 'Shipping & Delivery', href: '/shipping-policy' },
				{ label: isSv ? 'Returer' : 'Returns', href: '/refund' },
			],
		},
	};
</script>

<footer class="bg-cream-100 dark:bg-[#1a1f1e] mt-auto border-t border-forest-200 dark:border-[#3f4946]">
	<div class="container mx-auto px-4 py-12">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
			<!-- Brand -->
			<div class="space-y-4">
				<a href="/" class="flex items-center space-x-2">
					<img src="/images/logo.jpg" alt="Fortune Essence" class="w-10 h-10 rounded-full object-cover" />
					<span class="text-xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Fortune Essence</span>
				</a>
				<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">
					{isSv ? 'Premium eteriska oljor och aromaterapi.' : 'Premium essential oils and aromatherapy.'}
				</p>
				<div class="space-y-1 text-sm text-forest-600 dark:text-[#8A9A8A]">
					<p>support@fortuneessence.se</p>
				</div>
			</div>

			<!-- Links -->
			{#each Object.values(footerLinks) as section}
				<div>
					<h3 class="font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">{section.title}</h3>
					<ul class="space-y-2">
						{#each section.links as link}
							<li>
								<a
									href={link.href}
									class="text-sm text-forest-600 dark:text-[#8A9A8A] hover:text-sage-700 dark:hover:text-[#E8EDE8] transition-colors"
								>
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<div class="mt-12 pt-8 border-t border-forest-200 dark:border-[#3f4946] flex flex-col md:flex-row justify-between items-center gap-4">
			<p class="text-sm text-forest-500 dark:text-[#6B7B6B]">
				© {year} Fortune Essence. {isSv ? 'Alla rättigheter förbehållna.' : 'All rights reserved.'}
			</p>
			<div class="flex gap-4 text-sm text-forest-500 dark:text-[#6B7B6B]">
				<a href="/privacy" class="hover:text-sage-700 dark:hover:text-[#E8EDE8] transition-colors">
					{isSv ? 'Integritetspolicy' : 'Privacy Policy'}
				</a>
				<a href="/terms" class="hover:text-sage-700 dark:hover:text-[#E8EDE8] transition-colors">
					{isSv ? 'Användarvillkor' : 'Terms'}
				</a>
			</div>
		</div>
	</div>
</footer>
