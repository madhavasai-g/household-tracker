import json
import urllib.request
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))
TROY_OUNCE_GRAMS = 31.1034768
INDIA_BULLION_FACTOR = 1.075  # Customs duty + domestic MCX/IBJA parity

def fetch_live_spot_24k(fallback=14874):
    try:
        req = urllib.request.Request(
            "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json",
            headers={"User-Agent": "Mozilla/5.0"}
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

def main():
    with open("deals.json", "r", encoding="utf-8") as f:
        payload = json.load(f)

    spot24k = fetch_live_spot_24k(payload.get("spot24k", 14874))
    now_str = datetime.now(IST).strftime("%d %b, %I:%M %p IST")

    # Store-specific live markup & coupon matrix relative to 24K spot
    store_markups = {
        "Myntra": 1.095,
        "Amazon": 1.094,
        "AJIO": 1.102,
        "Shopsy": 1.109,
        "Flipkart": 1.112
    }

    for deal in payload["deals"]:
        w = deal["weight"]
        store = deal["store"]
        purity_factor = float(deal["purity"]) / 999.0
        if purity_factor > 1.0:
            purity_factor = 1.0

        base_metal = spot24k * w * purity_factor
        markup = store_markups.get(store, 1.10)
        deal["listPrice"] = round(base_metal * markup)

        if store == "Myntra":
            deal["couponDisc"] = round(deal["listPrice"] * 0.06)
            deal["bankDisc"] = round(deal["listPrice"] * 0.075)
        elif store == "AJIO":
            deal["couponDisc"] = round(deal["listPrice"] * 0.05)
            deal["bankDisc"] = round(deal["listPrice"] * 0.065)
        elif store == "Amazon":
            deal["bankDisc"] = round(1250 * w) if w <= 2 else round(deal["listPrice"] * 0.065)
            deal["couponDisc"] = round(deal["listPrice"] * 0.03)
        else:
            deal["bankDisc"] = round(deal["listPrice"] * 0.068)
            deal["couponDisc"] = deal["bankDisc"]

        deal["updatedAt"] = now_str

    payload["spot24k"] = spot24k
    payload["updatedAt"] = now_str

    with open("deals.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
