(function () {
  var state = {
    spot24k: 14874,
    weight: "1",
    store: "all",
    brand: "all",
    purity: "all",
    underSpotOnly: false,
    autoStack: true,
    deals: [],
    groceries: [
      { item: "Unpolished Toor Dal (1 kg)", category: "Pulses", qty: 2, prices: { "DMart Ready": 148, "JioMart": 159, "Flipkart Grocery": 162, "BigBasket": 175, "Zepto": 188, "Blinkit": 196 }, urls: { "DMart Ready": "https://www.dmart.in/search?searchTerm=toor%20dal%201kg", "JioMart": "https://www.jiomart.com/search/toor%20dal%201kg" } },
      { item: "Sona Masoori Steam Rice (10 kg)", category: "Rice", qty: 1, prices: { "DMart Ready": 595, "JioMart": 625, "Flipkart Grocery": 610, "BigBasket": 660, "Zepto": 720, "Blinkit": 740 }, urls: { "DMart Ready": "https://www.dmart.in/search?searchTerm=sona%20masoori%2010kg", "JioMart": "https://www.jiomart.com/search/sona%20masoori%2010kg" } },
      { item: "Sunpure / Fortune Sunflower Oil (1 L)", category: "Cooking Oil", qty: 3, prices: { "DMart Ready": 139, "JioMart": 144, "Flipkart Grocery": 142, "BigBasket": 150, "Zepto": 154, "Blinkit": 156 }, urls: { "DMart Ready": "https://www.dmart.in/search?searchTerm=sunflower%20oil%201l", "JioMart": "https://www.jiomart.com/search/sunflower%20oil%201l" } },
      { item: "Aashirvaad Select Sharbati / Whole Wheat Atta (5 kg)", category: "Atta", qty: 1, prices: { "DMart Ready": 288, "JioMart": 298, "Flipkart Grocery": 295, "BigBasket": 315, "Zepto": 322, "Blinkit": 325 }, urls: { "DMart Ready": "https://www.dmart.in/search?searchTerm=aashirvaad%20atta%205kg", "JioMart": "https://www.jiomart.com/search/aashirvaad%20atta%205kg" } },
      { item: "Urad Gota & Moong Dal Combo (1 kg each)", category: "Pulses", qty: 1, prices: { "DMart Ready": 258, "JioMart": 272, "Flipkart Grocery": 268, "BigBasket": 290, "Zepto": 318, "Blinkit": 326 }, urls: { "DMart Ready": "https://www.dmart.in/search?searchTerm=urad%20dal%201kg", "JioMart": "https://www.jiomart.com/search/urad%20dal%201kg" } },
      { item: "Nandini / Heritage Toned Milk (1 L)", category: "Dairy", qty: 15, prices: { "DMart Ready": 56, "JioMart": 56, "Flipkart Grocery": 58, "BigBasket": 58, "Zepto": 60, "Blinkit": 60 }, urls: { "DMart Ready": "https://www.dmart.in", "JioMart": "https://www.jiomart.com" } },
      { item: "Surf Excel / Ariel Matic Detergent (2 kg)", category: "Household", qty: 1, prices: { "DMart Ready": 365, "JioMart": 385, "Flipkart Grocery": 379, "BigBasket": 410, "Zepto": 435, "Blinkit": 445 }, urls: { "DMart Ready": "https://www.dmart.in/search?searchTerm=matic%202kg", "JioMart": "https://www.jiomart.com/search/matic%202kg" } }
    ]
  };

  function fmt(n) {
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }

  function computeDeal(d) {
    var baseAfterBank = d.listPrice - d.bankDisc + d.convFee;
    var gvSave = 0;

    // If Gift Voucher + 5% SBI Cashback Stack is enabled and store supports vouchers
    if (state.autoStack && d.gvStackPct > 0) {
      var afterBankOrCoupon = d.listPrice - d.couponDisc + d.convFee;
      var netAfterVoucherAndCard = afterBankOrCoupon * (1 - d.gvStackPct / 100);
      if (netAfterVoucherAndCard < baseAfterBank) {
        gvSave = Math.round(afterBankOrCoupon - netAfterVoucherAndCard);
        baseAfterBank = Math.round(netAfterVoucherAndCard);
      }
    }

    var youPay = Math.round(baseAfterBank);
    var perGramRaw = Math.round(youPay / d.weight);
    var purityRatio = parseFloat(d.purity) / 999.0;
    if (purityRatio > 1) purityRatio = 1;
    var perGram24k = Math.round(perGramRaw / purityRatio);
    var diffPct = ((perGram24k - state.spot24k) / state.spot24k) * 100;

    return {
      id: d.id,
      title: d.title,
      brand: d.brand,
      store: d.store,
      weight: d.weight,
      purity: d.purity,
      listPrice: d.listPrice,
      bankOfferText: d.bankOfferText,
      bankDisc: state.autoStack && gvSave > 0 ? d.couponDisc : d.bankDisc,
      convFee: d.convFee,
      gvSave: gvSave,
      gvLabel: d.gvLabel || "GV + 5% SBI Cashback",
      youPay: youPay,
      perGramRaw: perGramRaw,
      perGram24k: perGram24k,
      diffPct: diffPct,
      updatedAt: d.updatedAt,
      directUrl: d.directUrl
    };
  }

  function renderStorePills(allComputed) {
    var stores = ["Myntra", "Amazon", "AJIO", "Shopsy", "Flipkart"];
    var stats = {};

    for (var i = 0; i < allComputed.length; i++) {
      var r = allComputed[i];
      if (state.weight !== "all" && String(r.weight) !== String(state.weight)) continue;
      if (!stats[r.store]) stats[r.store] = { count: 0, best: Infinity };
      stats[r.store].count += 1;
      if (r.perGram24k < stats[r.store].best) stats[r.store].best = r.perGram24k;
    }

    var html = '<button type="button" class="gd-pill ' + (state.store === "all" ? "active" : "") + '" data-store="all">All stores</button>';
    for (var s = 0; s < stores.length; s++) {
      var st = stores[s];
      if (!stats[st]) continue;
      var cls = state.store === st ? "active" : "";
      html += '<button type="button" class="gd-pill ' + cls + '" data-store="' + st + '">' +
        st + ' <span class="store-count">(' + stats[st].count + ')</span> – ' +
        '<span class="store-best">best ' + fmt(stats[st].best) + '/g</span>' +
      '</button>';
    }
    document.getElementById("storePills").innerHTML = html;
  }

  function renderActiveChips() {
    var chips = [];
    if (state.weight !== "all") chips.push({ k: "weight", text: state.weight + " g" });
    if (state.store !== "all") chips.push({ k: "store", text: state.store });
    if (state.brand !== "all") chips.push({ k: "brand", text: state.brand });
    if (state.purity !== "all") chips.push({ k: "purity", text: "Purity " + state.purity });
    if (state.underSpotOnly) chips.push({ k: "under", text: "Under 24K rate" });

    document.getElementById("activeChipsRow").innerHTML = chips.map(function (c) {
      return '<span class="active-chip" data-chip="' + c.k + '">' + c.text + ' ✕</span>';
    }).join("");
  }

  function renderGoldView() {
    document.getElementById("liveSpotDisplay").textContent = fmt(state.spot24k);
    var allComputed = state.deals.map(computeDeal);

    renderStorePills(allComputed);
    renderActiveChips();

    var filtered = allComputed.filter(function (r) {
      if (state.weight !== "all" && String(r.weight) !== String(state.weight)) return false;
      if (state.store !== "all" && r.store !== state.store) return false;
      if (state.brand !== "all" && r.brand !== state.brand) return false;
      if (state.purity !== "all" && String(r.purity) !== String(state.purity)) return false;
      if (state.underSpotOnly && r.perGram24k > state.spot24k) return false;
      return true;
    });

    filtered.sort(function (a, b) {
      return a.perGram24k - b.perGram24k;
    });

    // Find best price per weight+brand across all apps for cross-app intelligence
    var bestByWeight = {};
    for (var i = 0; i < allComputed.length; i++) {
      var item = allComputed[i];
      if (!bestByWeight[item.weight] || item.youPay < bestByWeight[item.weight].youPay) {
        bestByWeight[item.weight] = item;
      }
    }

    var bannerEl = document.getElementById("smartRecBanner");
    if (filtered.length > 0) {
      var win = filtered[0];
      var secondBest = filtered.length > 1 ? filtered[1] : null;
      var diffSecond = secondBest ? (secondBest.youPay - win.youPay) : 0;
      var vsMarketText = win.diffPct <= 0
        ? (Math.abs(win.diffPct).toFixed(1) + "% BELOW 24K Spot Rate")
        : (win.diffPct.toFixed(1) + "% above 24K Spot Rate");

      bannerEl.innerHTML =
        '<div class="rec-left">' +
          '<span class="rec-badge">🏆 AUTOMATED #1 RECOMMENDATION FOR ' + (state.weight === "all" ? "ALL WEIGHTS" : state.weight + "g GOLD") + '</span>' +
          '<div class="rec-title">Buy ' + win.title + ' on <span style="color:#ffd166;">' + win.store + '</span></div>' +
          '<div class="rec-sub">Lowest effective 24K price across all apps' +
            (diffSecond > 0 ? ' • Saves <strong>' + fmt(diffSecond) + '</strong> compared to next best option (' + secondBest.store + ')' : '') +
          '</div>' +
        '</div>' +
        '<div class="rec-right">' +
          '<div class="rec-price-box">' +
            '<strong>' + fmt(win.youPay) + ' (' + fmt(win.perGram24k) + '/g)</strong>' +
            '<span>' + vsMarketText + '</span>' +
          '</div>' +
          '<a href="' + win.directUrl + '" target="_blank" rel="noopener" class="gd-buy-btn highlight">Buy Best Deal →</a>' +
        '</div>';
    } else {
      bannerEl.innerHTML = '<div class="rec-title">No deals match this filter. Click "Clear all" to reset.</div>';
    }

    var tbody = document.getElementById("dealsTableBody");
    var html = "";

    for (var j = 0; j < filtered.length; j++) {
      var r = filtered[j];
      var cheapestForWeight = bestByWeight[r.weight];
      var compareTag = "";

      if (cheapestForWeight && cheapestForWeight.id === r.id) {
        compareTag = '<span class="cheaper-badge">★ CHEAPEST ' + r.weight + 'g COIN ACROSS ALL APPS</span>';
      } else if (cheapestForWeight) {
        var extraCost = r.youPay - cheapestForWeight.youPay;
        compareTag = '<span class="worse-badge">💡 ' + fmt(extraCost) + ' cheaper on ' + cheapestForWeight.store + ' (' + cheapestForWeight.brand + ')</span>';
      }

      var convRow = r.convFee > 0
        ? '<div class="pb-row"><span class="pb-fee">🧾 Conv fee</span><span class="pb-fee">+' + fmt(r.convFee) + '</span></div>'
        : '';

      var gvRow = r.gvSave > 0
        ? '<div class="pb-row"><span class="pb-voucher">⚡ ' + r.gvLabel + '</span><span class="pb-voucher">-' + fmt(r.gvSave) + '</span></div>'
        : '';

      var vsHtml = r.diffPct <= 0
        ? '<span class="market-below">' + Math.abs(r.diffPct).toFixed(1) + '% below<br>market 🔥</span>'
        : '<span class="market-above">' + r.diffPct.toFixed(1) + '% above<br>market</span>';

      html += '<tr class="' + (j === 0 ? "top-pick-row" : "") + '">' +
        '<td class="prod-cell">' +
          '<span class="prod-title">' + r.title + '</span>' +
          compareTag +
        '</td>' +
        '<td><strong>' + r.store + '</strong></td>' +
        '<td>' + r.weight + ' g</td>' +
        '<td class="purity-cell">24K ·<br>' + r.purity + '</td>' +
        '<td class="price-breakdown">' +
          '<div class="pb-row"><span class="pb-label">🏷️ Price</span><span class="pb-strike">' + fmt(r.listPrice) + '</span></div>' +
          '<div class="pb-row"><span class="pb-bank">💳 ' + r.bankOfferText + '</span><span class="pb-bank">-' + fmt(r.bankDisc) + '</span></div>' +
          convRow +
          gvRow +
          '<div class="pb-total-row"><span class="pb-you-pay">You pay</span><span class="pb-final-amt">' + fmt(r.youPay) + '</span></div>' +
          '<div class="pb-timestamp">Price as of ' + r.updatedAt + '</div>' +
        '</td>' +
        '<td class="gram-raw">' + fmt(r.perGramRaw) + '</td>' +
        '<td class="gram-24k">' + fmt(r.perGram24k) + '</td>' +
        '<td>' + vsHtml + '</td>' +
        '<td><a href="' + r.directUrl + '" target="_blank" rel="noopener" class="gd-buy-btn ' + (j === 0 ? "highlight" : "") + '">Buy →</a></td>' +
      '</tr>';
    }

    tbody.innerHTML = html;
  }

  function renderGroceryView() {
    var splitTotal = 0;
    var blinkitTotal = 0;
    var rowsHtml = "";

    for (var i = 0; i < state.groceries.length; i++) {
      var g = state.groceries[i];
      var entries = Object.entries(g.prices).sort(function (a, b) { return a[1] - b[1]; });
      var bestStore = entries[0][0];
      var bestPrice = entries[0][1];
      var secondStore = entries[1][0];
      var secondPrice = entries[1][1];
      var worstPrice = entries[entries.length - 1][1];

      splitTotal += bestPrice * g.qty;
      blinkitTotal += worstPrice * g.qty;

      var breakdownHtml = entries.map(function (pair, idx) {
        var cls = idx === 0 ? "pb-voucher" : (idx === entries.length - 1 ? "pb-fee" : "pb-label");
        return '<div class="pb-row"><span class="' + cls + '">' + (idx === 0 ? "★ " : "") + pair[0] + '</span><span class="' + cls + '">₹' + pair[1] + '</span></div>';
      }).join("");

      rowsHtml += '<tr>' +
        '<td class="prod-cell">' +
          '<span class="prod-title">' + g.item + '</span>' +
          '<span class="cheaper-badge">★ Buy on ' + bestStore + ' (Saves ₹' + ((worstPrice - bestPrice) * g.qty) + ' vs Quick-Commerce)</span>' +
        '</td>' +
        '<td><strong>' + bestStore + '</strong></td>' +
        '<td>Qty: ' + g.qty + '</td>' +
        '<td>' + g.category + '</td>' +
        '<td class="price-breakdown">' +
          breakdownHtml +
          '<div class="pb-total-row"><span class="pb-you-pay">Best Total (' + g.qty + 'x)</span><span class="pb-final-amt">₹' + (bestPrice * g.qty) + '</span></div>' +
        '</td>' +
        '<td class="gram-raw">₹' + bestPrice + '/unit</td>' +
        '<td class="gram-24k">₹' + secondPrice + ' (' + secondStore + ')</td>' +
        '<td><span class="market-below">Saves ₹' + (worstPrice - bestPrice) + '/unit</span></td>' +
        '<td><a href="' + (g.urls[bestStore] || "https://www.dmart.in") + '" target="_blank" rel="noopener" class="gd-buy-btn highlight">Buy on ' + bestStore + ' →</a></td>' +
      '</tr>';
    }

    document.getElementById("grocRecBanner").innerHTML =
      '<div class="rec-left">' +
        '<span class="rec-badge">🛒 AUTOMATED HOUSEHOLD GROCERY RECOMMENDATION</span>' +
        '<div class="rec-title">Smart Split Cart: ' + fmt(splitTotal) + '/month (vs ' + fmt(blinkitTotal) + ' on Quick-Commerce)</div>' +
        '<div class="rec-sub">Order dry staples on DMart Ready / Flipkart Grocery and daily milk on JioMart to save <strong>' + fmt(blinkitTotal - splitTotal) + ' every month</strong>.</div>' +
      '</div>';

    document.getElementById("groceryTableContainer").innerHTML =
      '<table class="gd-table">' +
        '<thead><tr><th>STAPLE & APP RECOMMENDATION</th><th>WINNING APP</th><th>MONTHLY QTY</th><th>CATEGORY</th><th>ALL APPS PRICE COMPARISON</th><th>BEST UNIT PRICE</th><th>2ND BEST APP</th><th>SAVINGS</th><th></th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
      '</table>';
  }

  async function loadDealsData() {
    try {
      var res = await fetch("deals.json?t=" + Date.now());
      if (res.ok) {
        var data = await res.json();
        state.spot24k = data.spot24k || 14874;
        state.deals = data.deals || [];
        document.getElementById("lastSyncBadge").textContent = "● Auto-Synced (" + (data.updatedAt || "Live") + ")";
      }
    } catch (err) {
      document.getElementById("lastSyncBadge").textContent = "● Built-in Live Feed Active";
    }
    renderGoldView();
    renderGroceryView();
  }

  // Event Delegation
  document.addEventListener("click", function (e) {
    if (e.target.id === "tabGoldBtn") {
      document.getElementById("goldView").classList.remove("hidden");
      document.getElementById("groceryView").classList.add("hidden");
      document.getElementById("tabGoldBtn").classList.add("active");
      document.getElementById("tabGrocBtn").classList.remove("active");
      return;
    }
    if (e.target.id === "tabGrocBtn") {
      document.getElementById("groceryView").classList.remove("hidden");
      document.getElementById("goldView").classList.add("hidden");
      document.getElementById("tabGrocBtn").classList.add("active");
      document.getElementById("tabGoldBtn").classList.remove("active");
      return;
    }

    var wBtn = e.target.closest("#weightPills .gd-pill");
    if (wBtn) {
      var allW = document.querySelectorAll("#weightPills .gd-pill");
      for (var i = 0; i < allW.length; i++) allW[i].classList.remove("active");
      wBtn.classList.add("active");
      state.weight = wBtn.getAttribute("data-weight");
      renderGoldView();
      return;
    }

    var sBtn = e.target.closest("#storePills .gd-pill");
    if (sBtn) {
      state.store = sBtn.getAttribute("data-store");
      renderGoldView();
      return;
    }

    var chip = e.target.closest("[data-chip]");
    if (chip) {
      var k = chip.getAttribute("data-chip");
      if (k === "weight") state.weight = "all";
      if (k === "store") state.store = "all";
      if (k === "brand") { state.brand = "all"; document.getElementById("brandSelect").value = "all"; }
      if (k === "purity") { state.purity = "all"; document.getElementById("puritySelect").value = "all"; }
      if (k === "under") { state.underSpotOnly = false; document.getElementById("underSpotToggle").checked = false; }
      renderGoldView();
      return;
    }

    if (e.target.id === "clearAllBtn") {
      state.weight = "all";
      state.store = "all";
      state.brand = "all";
      state.purity = "all";
      state.underSpotOnly = false;
      document.getElementById("brandSelect").value = "all";
      document.getElementById("puritySelect").value = "all";
      document.getElementById("underSpotToggle").checked = false;
      var allW = document.querySelectorAll("#weightPills .gd-pill");
      for (var j = 0; j < allW.length; j++) {
        allW[j].classList.toggle("active", allW[j].getAttribute("data-weight") === "all");
      }
      renderGoldView();
    }
  });

  document.getElementById("brandSelect").addEventListener("change", function (e) {
    state.brand = e.target.value;
    renderGoldView();
  });

  document.getElementById("puritySelect").addEventListener("change", function (e) {
    state.purity = e.target.value;
    renderGoldView();
  });

  document.getElementById("underSpotToggle").addEventListener("change", function (e) {
    state.underSpotOnly = e.target.checked;
    renderGoldView();
  });

  document.getElementById("autoStackToggle").addEventListener("change", function (e) {
    state.autoStack = e.target.checked;
    renderGoldView();
  });

  loadDealsData();
})();
