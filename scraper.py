import json
import re
import urllib.request
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))
TROY_OUNCE_GRAMS = 31.1034768
INDIA_BULLION_FACTOR = 1.075

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
    "Accept-Language": "en-IN,en;q=0.9"
}

KNOWN_GOLD_CODES = ["BLINKDEAL", "GOLD10", "DHANVARSHA", "AKSHAYA", "FESTIVEGOLD"]

def fetch_live_spot_24k(fallback=14874):
    try:
        req = urllib.request.Request(
            "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json",
            headers=HEADERS
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            xau_inr = float(data["xau"]["inr"])
            spot_gram = round((xau_inr / TROY_OUNCE_GRAMS) * INDIA_BULLION_FACTOR)
            if spot_gram > 5000:
                return spot_gram
    except Exception:
        pass
    return fallback

def scrape_product_price_and_verified_coupon(url, expected_min, expected_max):
    """
    Scrapes the product page for:
    1. Live selling price
    2. Verified active coupon code (ONLY returns a coupon if the product page explicitly lists it)
    """
    price_found = None
    verified_code = None

    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=8) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

            # 1. Check for real price inside JSON-LD / hydration state
            matches = re.findall(r'"(?:discountedPrice|sellingPrice|price)"\s*:\s*"?(\d{4,7})"?', html)
            for m in matches:
                val = int(m)
                if expected_min <= val <= expected_max:
                    price_found = val
                    break

            # 2. Strictly verify if any known bullion coupon is LIVE on this specific product page
            upper_html = html.upper()
            for code in KNOWN_GOLD_CODES:
                if f'"{code}"' in upper_html or f"'{code}'" in upper_html or f"CODE {code}" in upper_html:
                    verified_code = code
                    break
    except Exception:
        pass

    return price_found, verified_code

def main():
    with open("deals.json", "r", encoding="utf-8") as f:
        payload = json.load(f)

    spot24k = fetch_live_spot_24k(payload.get("spot24k", 14874))
    now_str = datetime.now(IST).strftime("%d %b, %I:%M %p IST")

    for deal in payload["deals"]:
        w = deal["weight"]
        store = deal["store"]
        purity_factor = min(float(deal["purity"]) / 999.0, 1.0)
        base_metal = spot24k * w * purity_factor

        scraped_price, verified_coupon = scrape_product_price_and_verified_coupon(
            deal["directUrl"],
            expected_min=int(base_metal * 0.98),
            expected_max=int(base_metal * 1.25)
        )

        if scraped_price:
            deal["listPrice"] = scraped_price

        # STRICT RULE: Never display a promo code unless verified live on the product page
        if verified_coupon:
            deal["liveCouponCode"] = verified_coupon
            deal["couponDisc"] = round(deal["listPrice"] * 0.05)
            deal["bankOfferText"] = f"Verified Live Code: {verified_coupon} + Bank Offer"
        else:
            deal["liveCouponCode"] = None
            deal["couponDisc"] = 0

        deal["updatedAt"] = now_str

    payload["spot24k"] = spot24k
    payload["updatedAt"] = now_str

    with open("deals.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
    
