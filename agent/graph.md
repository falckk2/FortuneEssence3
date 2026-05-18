graph TD;
	__start__([__start__])
	detect_language(detect_language)
	gather_needs(gather_needs)
	retrieve_knowledge(retrieve_knowledge)
	search_products(search_products)
	recommend(recommend)
	__end__([__end__])
	__start__ --> detect_language;
	detect_language --> gather_needs;
	gather_needs -. gather .-> __end__;
	gather_needs -. retrieve .-> retrieve_knowledge;
	retrieve_knowledge --> search_products;
	search_products --> recommend;
	recommend --> __end__;