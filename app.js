(function () {
  var state = {
    spot24k: 14874,
    weight: "all",
    store: "all",
    brand: "all",
    purity: "all",
    underSpotOnly: false,
    deals: []
  };

  function fmt(n) {
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }

  function computeDeal(d) {
    var youPay = Math.round(d.listPrice - d.bankDisc + d.convFee);
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
      bankDisc: d.bankDisc,
      convFee: d.convFee,
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
      if (state.weight !== "all" && Number(r.weight) !== Number(state.weight)) continue;
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
    var inputEl = document.getElementById("spotRateInput");
    if (inputEl && document.activeElement !== inputEl) {
      inputEl.value = state.spot24k;
    }

    var allComputed = state.deals.map(computeDeal);

    renderStorePills(allComputed);
    renderActiveChips();

    var filtered = allComputed.filter(function (r) {
      if (state.weight !== "all" && Number(r.weight) !== Number(state.weight)) return false;
      if (state.store !== "all" && r.store !== state.store) return false;
      if (state.brand !== "all" && r.brand !== state.brand) return false;
      if (state.purity !== "all" && String(r.purity) !== String(state.purity)) return false;
      if (state.underSpotOnly && r.perGram24k > state.spot24k) return false;
      return true;
    });

    filtered.sort(function (a, b) {
      return a.perGram24k - b.perGram24k;
    });

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
      var vsMarketText = win.diffPct <= 0
        ? (Math.abs(win.diffPct).toFixed(1) + "% BELOW 24K Spot Rate")
        : (win.diffPct.toFixed(1) + "% above 24K Spot Rate");

      bannerEl.innerHTML =
        '<div class="rec-left">' +
          '<span class="rec-badge">🏆 TOP DEAL RECOMMENDATION</span>' +
          '<div class="rec-title">Buy ' + win.title + ' on <span style="color:#ffd166;">' + win.store + '</span></div>' +
          '<div class="rec-sub">Lowest effective 24K price right now</div>' +
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
        compareTag = '<span class="worse-badge">💡 ' + fmt(extraCost) + ' cheaper on ' + cheapestForWeight.store + '</span>';
      }

      var bankRow = r.bankDisc > 0
        ? '<div class="pb-row"><span class="pb-bank">💳 ' + r.bankOfferText + '</span><span class="pb-bank">-' + fmt(r.bankDisc) + '</span></div>'
        : '';

      var convRow = r.convFee > 0
        ? '<div class="pb-row"><span class="pb-fee">🧾 Conv fee</span><span class="pb-fee">+' + fmt(r.convFee) + '</span></div>'
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
          bankRow +
          convRow +
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

  async function loadDealsData() {
    try {
      var res = await fetch("deals.json?t=" + Date.now());
      if (res.ok) {
        var data = await res.json();
        state.spot24k = data.spot24k || 14874;
        state.deals = data.deals || [];
        document.getElementById("lastSyncText").textContent = "Updated " + (data.updatedAt || "just now");
      }
    } catch (err) {
      document.getElementById("lastSyncText").textContent = "Updated locally";
    }
    renderGoldView();
  }

  document.getElementById("spotRateInput").addEventListener("input", function (e) {
    var val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 1000) {
      state.spot24k = val;
      renderGoldView();
    }
  });

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

  loadDealsData();
})();
