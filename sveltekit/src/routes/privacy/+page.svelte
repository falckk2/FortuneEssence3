<script lang="ts">
	import { locale } from '$lib/stores/locale';
</script>

<svelte:head><title>{$locale === 'sv' ? 'Integritetspolicy' : 'Privacy Policy'} – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] py-16">
	<div class="container mx-auto px-4 max-w-3xl">
		<h1 class="text-4xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8] mb-8">
			{$locale === 'sv' ? 'Integritetspolicy' : 'Privacy Policy'}
		</h1>
		<div class="prose prose-forest dark:prose-invert max-w-none space-y-6 text-forest-700 dark:text-[#B8C5B8]">
			<p>{$locale === 'sv' ? 'Vi värnar om din personliga integritet och strävar efter att alltid skydda dina personuppgifter.' : 'We value your personal privacy and strive to always protect your personal data.'}</p>
			<h2 class="text-2xl font-semibold text-forest-800 dark:text-[#E8EDE8] mt-8">{$locale === 'sv' ? 'Vilka uppgifter samlar vi in?' : 'What data do we collect?'}</h2>
			<p>{$locale === 'sv' ? 'Vi samlar in namn, e-postadress, leveransadress och betalningsinformation för att behandla dina beställningar.' : 'We collect name, email address, delivery address and payment information to process your orders.'}</p>
			<h2 class="text-2xl font-semibold text-forest-800 dark:text-[#E8EDE8] mt-8">{$locale === 'sv' ? 'Hur använder vi dina uppgifter?' : 'How do we use your data?'}</h2>
			<p>{$locale === 'sv' ? 'Dina uppgifter används för att behandla beställningar, skicka orderbekräftelser och leveransnotiser. Vi delar aldrig dina uppgifter med tredje part utan ditt samtycke.' : 'Your data is used to process orders, send order confirmations and delivery notifications. We never share your data with third parties without your consent.'}</p>
			<h2 class="text-2xl font-semibold text-forest-800 dark:text-[#E8EDE8] mt-8">{$locale === 'sv' ? 'Dina rättigheter' : 'Your rights'}</h2>
			<p>{$locale === 'sv' ? 'Du har rätt att begära tillgång till, rättelse eller radering av dina personuppgifter. Kontakta oss på info@fortuneessence.se.' : 'You have the right to request access to, correction or deletion of your personal data. Contact us at info@fortuneessence.se.'}</p>
		</div>
	</div>
</div>
