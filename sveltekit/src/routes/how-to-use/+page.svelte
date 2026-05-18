<script lang="ts">
	import { locale } from '$lib/stores/locale';
</script>

<svelte:head><title>{$locale === 'sv' ? 'Hur man använder' : 'How to use'} – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] py-16">
	<div class="container mx-auto px-4 max-w-4xl">
		<div class="text-center mb-16">
			<h1 class="text-4xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8] mb-4">
				{$locale === 'sv' ? 'Guide: Eteriska Oljor' : 'Essential Oil Guide'}
			</h1>
			<p class="text-xl text-forest-600 dark:text-[#B8C5B8]">
				{$locale === 'sv' ? 'Lär dig hur du använder eteriska oljor på rätt sätt' : 'Learn how to use essential oils correctly'}
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			{#each [
				{ emoji: '💨', title: $locale === 'sv' ? 'Diffuser' : 'Diffuser', desc: $locale === 'sv' ? 'Tillsätt 5–10 droppar i din diffuser med vatten. Sprider doften i rummet och skapar en avslappnande atmosfär.' : 'Add 5–10 drops to your diffuser with water. Spreads the scent throughout the room.' },
				{ emoji: '💆', title: $locale === 'sv' ? 'Massage' : 'Massage', desc: $locale === 'sv' ? 'Blanda 2–3 droppar eterisk olja med 15 ml bärarolja (t.ex. kokosolja) och massera in i huden.' : 'Mix 2–3 drops of essential oil with 15 ml carrier oil (e.g. coconut oil) and massage into skin.' },
				{ emoji: '🛁', title: $locale === 'sv' ? 'Bad' : 'Bath', desc: $locale === 'sv' ? 'Tillsätt 5–10 droppar blandat med lite honung eller mjölk i ditt badvatten för en lyxig upplevelse.' : 'Add 5–10 drops mixed with a little honey or milk to your bath water for a luxurious experience.' },
				{ emoji: '🌬️', title: $locale === 'sv' ? 'Inhalation' : 'Inhalation', desc: $locale === 'sv' ? 'Tillsätt 2–3 droppar i en skål med varmt vatten, luta dig och andas in ångan i 5–10 minuter.' : 'Add 2–3 drops to a bowl of hot water, lean over and inhale the steam for 5–10 minutes.' },
			] as method}
				<div class="bg-white dark:bg-[#2a3330] rounded-2xl p-6 shadow-soft">
					<div class="text-4xl mb-4">{method.emoji}</div>
					<h3 class="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-3">{method.title}</h3>
					<p class="text-forest-600 dark:text-[#B8C5B8]">{method.desc}</p>
				</div>
			{/each}
		</div>

		<div class="mt-12 bg-terracotta-50 dark:bg-terracotta-900/20 border border-terracotta-200 dark:border-terracotta-800 rounded-2xl p-6">
			<h3 class="font-semibold text-terracotta-800 dark:text-terracotta-300 mb-2">⚠️ {$locale === 'sv' ? 'Säkerhetsinformation' : 'Safety information'}</h3>
			<ul class="space-y-1 text-sm text-terracotta-700 dark:text-terracotta-400">
				<li>• {$locale === 'sv' ? 'Späd alltid ut innan hudkontakt' : 'Always dilute before skin contact'}</li>
				<li>• {$locale === 'sv' ? 'Undvik ögon och slemhinnor' : 'Avoid eyes and mucous membranes'}</li>
				<li>• {$locale === 'sv' ? 'Förvara utom räckhåll för barn' : 'Keep out of reach of children'}</li>
				<li>• {$locale === 'sv' ? 'Konsultera läkare vid graviditet' : 'Consult doctor during pregnancy'}</li>
			</ul>
		</div>
	</div>
</div>
