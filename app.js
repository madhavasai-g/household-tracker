(function () {
  var TROY_OZ = 31.1034768;
  var INDIA_DUTY = 1.075;
  var currentFilter = "all";

  var defaultDeals = [
    { id: 1, title: "BRPL 24K (999.9) Purity Gold Coin", store: "Myntra", weight: 2, markup: 8.2, code: "BLINKDEAL", coupon: 6.0, url: "https://www.myntra.com/gold-coin" },
    { id: 2, title: "Malabar 24K (999) Rose Motif Coin", store: "Myntra", weight: 1, markup: 8.5, code: "BLINKDEAL", coupon: 6.5, url: "https://www.myntra.com/gold-coin" },
    { id: 3, title: "MMTC-PAMP 24K (999.9) Lotus Coin", store: "Ajio", weight: 5, markup: 7.8, code: "DHANVARSHA", coupon: 4.5, url: "https://www.ajio.com/s/gold-and-silver-coins" },
    { id: 4, title: "Mia by Tanishq 24K (999) Coin", store: "Myntra", weight: 2, markup: 9.0, code: "GOLD10", coupon: 5.5, url: "https://www.myntra.com/gold-coin" },
    { id: 5, title: "Joyalukkas 24K (999) Lakshmi Coin", store: "Amazon", weight: 2, markup: 6.8, code: "CLIPCOUPON", coupon: 3.0, url: "https://www.amazon.in/s?k=24k+gold+coin" },
    { id: 6, title: "Kalyan Jewellers 24K (999) Coin", store: "Flipkart", weight: 5, markup: 7.4, code: "SUPERCOIN", coupon: 4.0, url: "https://www.flipkart.com/search?q=24k+gold+coin" }
  ];

  var defaultGroceries = [
    { name: "Toor Dal Unpolished (1 kg)", qty: 2, prices: { DMart: 152, JioMart: 162, BigBasket: 175, Blinkit: 198 } },
    { name: "Sona Masoori Rice (5 kg)", qty: 2, prices: { DMart: 305, JioMart: 320, BigBasket: 340, Blinkit: 380 } },
    { name: "Whole Wheat Atta (5 kg)", qty: 1, prices: { DMart: 299, JioMart: 310, BigBasket: 318, Blinkit: 325 } },
    { name: "Sunflower Cooking Oil (1 L)", qty: 3, prices: { DMart: 142, JioMart: 148, BigBasket: 150, Blinkit: 155 } },
    { name: "Toned Milk (1 L pack)", qty: 15, prices: { DMart: 62, JioMart: 64, BigBasket: 66, Blinkit: 66 } }
  ];

  var deals = JSON.parse(localStorage.getItem("gd_deals_v3")) || defaultDeals;
  var groceries = JSON.parse(localStorage.getItem("gd_groc_v3")) || defaultGroceries;

  function inr(n) {
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }

  function renderDeals() {
    var spot = parseFloat(document.getElementById("spot24Input").value) || 7800;
    var gv = parseFloat(document.getElementById("sliderGv").value) || 0;
    var cc = parseFloat(document.getElementById("sliderCc").value) || 0;

    document.getElementById("valGv").textContent = gv.toFixed(1) + "%";
    document.getElementById("valCc").textContent = cc.toFixed(1) + "%";
    document.getElementById("spot22Text").textContent = inr(spot * 0.916);

    var html = "";
    for (var i = 0; i < deals.length; i++) {
      var d = deals[i];
      var spotTotal = spot * d.weight;
      var listed = d.customPrice ? d.customPrice : Math.round(spotTotal * (1 + d.markup / 100));
      var afterCpn = listed * (1 - d.coupon / 100);
      var afterGv = afterCpn * (1 - gv / 100);
      var net = afterGv * (1 - cc / 100);
      var netGram = net / d.weight;
      var diff = netGram - spot;
      var isLoot = diff <= 0;

      if (currentFilter === "loot" && !isLoot) continue;
      if (currentFilter.indexOf("g") !== -1 && (d.weight + "g") !== currentFilter) continue;
      if (currentFilter !== "all" && currentFilter !== "loot" && currentFilter.indexOf("g") === -1 && d.store !== currentFilter) continue;

      var vClass = isLoot ? "loot" : (diff / spot <= 0.03 ? "fair" : "high");
      var vText = isLoot ? ("🔥 " + inr(Math.abs(diff)) + "/g BELOW SPOT") : ("+" + ((diff / spot) * 100).toFixed(1) + "% vs Spot");

      html += '<div class="deal-card ' + (isLoot ? "loot" : "") + '">' +
        '<div>' +
          '<div class="card-head">' +
            '<span class="tag-store">' + d.store + ' • ' + d.weight + 'g</span>' +
            '<span class="tag-verdict ' + vClass + '">' + vText + '</span>' +
          '</div>' +
          '<h3 class="deal-title">' + d.title + '</h3>' +
          '<div class="deal-price-box">' +
            '<div class="net-gram-price">' + inr(netGram) + ' <small style="font-size:12px;color:#94a3b8;">/ gram</small></div>' +
            '<div class="breakdown-row"><span>App Listed Price:</span><span>' + inr(listed) + '</span></div>' +
            '<div class="breakdown-row"><span>After Coupon (' + d.coupon + '%):</span><strong>' + inr(afterCpn) + ' (Buy GV)</strong></div>' +
            '<div class="breakdown-row final"><span>Final Net Landed:</span><span>' + inr(net) + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="card-actions">' +
          '<button type="button" class="btn-copy" data-copy="' + d.code + '">✂️ ' + d.code + '</button>' +
          '<a href="' + d.url + '" target="_blank" class="btn-visit">Open ' + d.store + ' ↗</a>' +
        '</div>' +
      '</div>';
    }
    document.getElementById("dealsContainer").innerHTML = html;
  }

  function renderGroceries() {
    localStorage.setItem("gd_groc_v3", JSON.stringify(groceries));
    var bestSum = 0;
    var quickSum = 0;
    var html = "";

    for (var i = 0; i < groceries.length; i++) {
      var g = groceries[i];
      var minP = 999999;
      var bestStore = "";
      for (var s in g.prices) {
        if (g.prices[s] < minP) {
          minP = g.prices[s];
          bestStore = s;
        }
      }
      bestSum += minP * g.qty;
      quickSum += (g.prices.Blinkit || minP) * g.qty;

      var storesHtml = "";
      for (var st in g.prices) {
        storesHtml += '<div class="store-pill ' + (st === bestStore ? "best" : "") + '">' +
          '<div>' + st + '</div>' +
          '<div>₹' + g.prices[st] + '</div>' +
        '</div>';
      }

      html += '<div class="groc-card">' +
        '<div class="groc-top">' +
          '<div><strong>' + g.name + '</strong> <span class="tag-verdict loot">Best: ' + bestStore + '</span></div>' +
          '<div class="qty-controls">' +
            '<button type="button" class="qty-btn" data-gidx="' + i + '" data-delta="-1">-</button>' +
            '<strong>' + g.qty + '</strong>' +
            '<button type="button" class="qty-btn" data-gidx="' + i + '" data-delta="1">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="store-row">' + storesHtml + '</div>' +
      '</div>';
    }

    document.getElementById("groceryContainer").innerHTML = html;
    document.getElementById("grocBestSum").textContent = inr(bestSum);
    document.getElementById("grocQuickSum").textContent = inr(quickSum);
    document.getElementById("grocSavedSum").textContent = inr(quickSum - bestSum) + "/mo";
  }

  async function syncSpotGold() {
    var statusText = document.getElementById("jsStatusText");
    statusText.textContent = "SYNCING LIVE XAU...";
    try {
      var res = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json");
      var data = await res.json();
      if (data && data.xau && data.xau.inr) {
        var rate = Math.round((data.xau.inr / TROY_OZ) * INDIA_DUTY);
        document.getElementById("spot24Input").value = rate;
        statusText.textContent = "✅ LIVE GOLD SYNCED";
        renderDeals();
      }
    } catch (e) {
      statusText.textContent = "✅ JS ACTIVE (MANUAL SPOT)";
    }
  }

  // Bind all events safely
  document.getElementById("statusDot").classList.add("online");
  document.getElementById("jsStatusText").textContent = "✅ JS ACTIVE & READY";

  document.getElementById("tabBtnGold").onclick = function () {
    document.getElementById("viewGold").classList.remove("hidden");
    document.getElementById("viewGrocery").classList.add("hidden");
    document.getElementById("tabBtnGold").classList.add("active");
    document.getElementById("tabBtnGrocery").classList.remove("active");
  };

  document.getElementById("tabBtnGrocery").onclick = function () {
    document.getElementById("viewGrocery").classList.remove("hidden");
    document.getElementById("viewGold").classList.add("hidden");
    document.getElementById("tabBtnGrocery").classList.add("active");
    document.getElementById("tabBtnGold").classList.remove("active");
  };

  document.getElementById("spot24Input").oninput = renderDeals;
  document.getElementById("sliderGv").oninput = renderDeals;
  document.getElementById("sliderCc").oninput = renderDeals;
  document.getElementById("btnSyncRate").onclick = syncSpotGold;

  document.getElementById("btnOpenModal").onclick = function () {
    document.getElementById("modalDeal").classList.remove("hidden");
  };
  document.getElementById("btnCloseModal").onclick = function () {
    document.getElementById("modalDeal").classList.add("hidden");
  };

  document.getElementById("btnSaveDeal").onclick = function () {
    var name = document.getElementById("mCoinName").value || "24K Gold Coin";
    var store = document.getElementById("mPlatform").value;
    var weight = parseFloat(document.getElementById("mWeight").value) || 2;
    var price = parseFloat(document.getElementById("mPrice").value) || 16500;
    var cpn = parseFloat(document.getElementById("mCouponPct").value) || 0;
    var code = document.getElementById("mCode").value || "DEAL";

    deals.unshift({
      id: Date.now(),
      title: name,
      store: store,
      weight: weight,
      customPrice: price,
      coupon: cpn,
      code: code,
      url: "https://www.google.com/search?q=" + encodeURIComponent(store + " " + name)
    });
    localStorage.setItem("gd_deals_v3", JSON.stringify(deals));
    document.getElementById("modalDeal").classList.add("hidden");
    renderDeals();
  };

  document.getElementById("btnAddGrocery").onclick = function () {
    var name = document.getElementById("inpGrocName").value.trim();
    if (!name) return;
    var qty = parseInt(document.getElementById("inpGrocQty").value, 10) || 1;
    var dm = parseFloat(document.getElementById("inpDMart").value) || 100;
    var jio = parseFloat(document.getElementById("inpJio").value) || 105;
    var bb = parseFloat(document.getElementById("inpBB").value) || 110;
    var bl = parseFloat(document.getElementById("inpBlinkit").value) || 120;

    groceries.push({ name: name, qty: qty, prices: { DMart: dm, JioMart: jio, BigBasket: bb, Blinkit: bl } });
    document.getElementById("inpGrocName").value = "";
    renderGroceries();
  };

  document.addEventListener("click", function (e) {
    var chip = e.target.closest("#filterContainer .chip");
    if (chip) {
      var allChips = document.querySelectorAll("#filterContainer .chip");
      for (var i = 0; i < allChips.length; i++) allChips[i].classList.remove("active");
      chip.classList.add("active");
      currentFilter = chip.getAttribute("data-filter");
      renderDeals();
      return;
    }

    var copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) {
      var code = copyBtn.getAttribute("data-copy");
      if (navigator.clipboard) navigator.clipboard.writeText(code);
      copyBtn.textContent = "✅ COPIED!";
      setTimeout(function () { copyBtn.textContent = "✂️ " + code; }, 1200);
      return;
    }

    var qBtn = e.target.closest("[data-gidx]");
    if (qBtn) {
      var idx = parseInt(qBtn.getAttribute("data-gidx"), 10);
      var delta = parseInt(qBtn.getAttribute("data-delta"), 10);
      groceries[idx].qty = Math.max(0, groceries[idx].qty + delta);
      renderGroceries();
    }
  });

  renderDeals();
  renderGroceries();
  syncSpotGold();
})();
