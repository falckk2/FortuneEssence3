import os
import json
from langchain_core.tools import tool
from supabase import create_client, Client

_supabase: Client | None = None


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _supabase


@tool
def search_products(
    category: str = "essential-oils",
    keywords: str = "",
) -> str:
    """
    Search the FortuneEssence product catalog for matching oils and related products.

    Args:
        category: Product category — one of: essential-oils, carrier-oils, diffusers,
                  accessories, gift-sets, bundles. Default is essential-oils.
        keywords: Comma-separated keywords to filter by (e.g. 'lavender,calming,sleep').
                  Leave empty to return all active products in the category.

    Returns:
        JSON string of matching products with name, description, price, sku, and stock.
    """
    sb = get_supabase()

    query = (
        sb.table("products")
        .select("name_en, name_sv, description_en, description_sv, price, sku, stock, category")
        .eq("is_active", True)
        .eq("category", category)
        .gt("stock", 0)
    )

    result = query.execute()
    products = result.data or []

    # Client-side keyword filter when keywords provided
    if keywords:
        kw_list = [k.strip().lower() for k in keywords.split(",") if k.strip()]
        filtered = []
        for p in products:
            combined = " ".join([
                (p.get("name_en") or ""),
                (p.get("description_en") or ""),
                (p.get("name_sv") or ""),
                (p.get("description_sv") or ""),
            ]).lower()
            if any(kw in combined for kw in kw_list):
                filtered.append(p)
        products = filtered if filtered else products  # fall back to all if no match

    # Normalise output
    output = [
        {
            "name": p.get("name_en") or p.get("name_sv"),
            "name_sv": p.get("name_sv"),
            "description": p.get("description_en") or p.get("description_sv"),
            "price_sek": p.get("price"),
            "sku": p.get("sku"),
            "stock": p.get("stock"),
            "category": p.get("category"),
        }
        for p in products
    ]

    return json.dumps(output, ensure_ascii=False)
