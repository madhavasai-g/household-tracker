let goldWeight = 2;
let goldChartInstance = null;

function formatINR(num) {
    return "₹" + Math.round(num).toLocaleString("en-IN");
}

function switchTab(tab) {
    document.getElementById("goldView").classList.toggle("hidden", tab !== "gold");
    document.getElementById("groceryView").classList.toggle("hidden", tab !== "grocery");
    document.getElementById("btnGold").classList.toggle("active", tab === "gold");
    document.getElementById("btnGrocery").classList.toggle("active", tab === "grocery");
}

function setPreset(type, btn) {
    document.querySelectorAll("#goldPresets .pill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const presets = {
        myntra: { markup: 8.5, coupon: 6.0, voucher: 5.0, card: 5.0 },
        ajio:   { markup: 8.0, coupon: 4.0, voucher: 6.0, card: 5.0 },
        amazon: { markup: 7.0, coupon: 3.0, voucher: 2.0, card: 5.0 },
        direct: { markup: 8.0, coupon: 3.0, voucher: 0.0, card: 0.0 }
    };
    const p = presets[type];
    document.getElementById("rngMarkup").value = p.markup;
    document.getElementById("rngCoupon").value = p.coupon;
    document.getElementById("rngVoucher").value = p.voucher;
    document.getElementById("rngCard").value = p.card;
    calculateGold();
}

function setWeight(w, btn) {
    document.querySelectorAll("#goldWeights .pill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    goldWeight = w;
    calculateGold();
}

function calculateGold() {
    const spotGram = parseFloat(document.getElementById("rngSpot").value);
    const markup = parseFloat(document.getElementById("rngMarkup").value);
    const coupon = parseFloat(document.getElementById("rngCoupon").value);
    const voucher = parseFloat(document.getElementById("rngVoucher").value);
    const card = parseFloat(document.getElementById("rngCard").value);

    document.getElementById("txtSpot").innerText = formatINR(spotGram);
    document.getElementById("txtMarkup").innerText = markup.toFixed(1) + "%";
    document.getElementById("txtCoupon").innerText = coupon.toFixed(1) + "%";
    document.getElementById("txtVoucher").innerText = voucher.toFixed(1) + "%";
    document.getElementById("txtCard").innerText = card.toFixed(1) + "%";

    const spotTotal = spotGram * goldWeight;
    const showroom = spotTotal * 1.03 * 1.03;
    const listed = spotTotal * (1 + markup / 100);
    const afterCoupon = listed * (1 - coupon / 100);
    const paidVoucher = afterCoupon * (1 - voucher / 100);
    const cb = paidVoucher * (card / 100);
    const finalNet = paidVoucher - cb;
    const finalGram = finalNet / goldWeight;
    const savings = spotTotal - finalNet;

    document.getElementById("goldSpotVal").innerText = formatINR(spotTotal);
    document.getElementById("goldSpotGram").innerText = formatINR(spotGram) + "/g";
    document.getElementById("goldVoucherVal").innerText = formatINR(afterCoupon);
    document.getElementById("goldNetVal").innerText = formatINR(finalNet);
    document.getElementById("goldNetGram").innerText = formatINR(finalGram) + "/g";
    document.getElementById("goldSavingsVal").innerText = "Saves " + formatINR(Math.abs(savings));

    const rows = [
        { name: "Offline Showroom (Spot + Making + GST)", total: showroom, note: "Showroom Baseline" },
        { name: "Stage 1: Listed App Price", total: listed, note: "+" + markup + "% over Spot" },
        { name: "Stage 2: After App Coupon (GV to buy)", total: afterCoupon, note: "-" + formatINR(listed - afterCoupon) },
        { name: "Stage 3: Paid on Voucher Portal", total: paidVoucher, note: "-" + formatINR(afterCoupon - paidVoucher) },
        { name: "Stage 4: Final Net Cost (After Card CB)", total: finalNet, note: "-" + formatINR(cb) + " CB", highlight: true },
        { name: "Pure 24K (999) Spot Benchmark", total: spotTotal, note: "Raw Metal Value" }
    ];

    document.getElementById("receiptTableBody").innerHTML = rows.map(r => `
        <tr class="${r.highlight ? 'highlight-row' : ''}">
            <td>${r.name}</td>
            <td class="right">${formatINR(r.total)}</td>
            <td class="right">${formatINR(r.total / goldWeight)}/g</td>
            <td class="right">${r.note}</td>
        </tr>
    `).join("");

    const chartData = rows.map(r => Math.round(r.total));

    if (!goldChartInstance) {
        const ctx = document.getElementById("goldChart").getContext("2d");
        goldChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Showroom", "1. Listed App", "2. After Coupon", "3. After Voucher", "4. Final Net Cost", "24K Spot Value"],
                datasets: [{
                    data: chartData,
                    backgroundColor: ["#94a3b8", "#f59e0b", "#3b82f6", "#6366f1", "#16a34a", "#eab308"],
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { callback: v => "₹" + v.toLocaleString("en-IN") } } }
            }
        });
    } else {
        goldChartInstance.data.datasets[0].data = chartData;
        goldChartInstance.update();
    }
}

// Grocery Data & Logic
const defaultGroceries = [
    { name: "Toor Dal Unpolished (1 kg)", qty: 2, prices: { DMart: 152, JioMart: 162, BigBasket: 175, Zepto: 186, Blinkit: 198 } },
    { name: "Sona Masoori Rice (5 kg)", qty: 2, prices: { DMart: 305, JioMart: 320, BigBasket: 340, Zepto: 365, Blinkit: 380 } },
    { name: "Whole Wheat Atta (5 kg)", qty: 1, prices: { DMart: 299, JioMart: 310, BigBasket: 318, Zepto: 320, Blinkit: 325 } },
    { name: "Sunflower Cooking Oil (1 L)", qty: 3, prices: { DMart: 142, JioMart: 148, BigBasket: 150, Zepto: 152, Blinkit: 155 } },
    { name: "Toned Milk (1 L pack)", qty: 15, prices: { DMart: 62, JioMart: 64, BigBasket: 66, Zepto: 66, Blinkit: 66 } }
];

let groceries = JSON.parse(localStorage.getItem("madhav_groceries_multi")) || defaultGroceries;

function renderGroceries() {
    localStorage.setItem("madhav_groceries_multi", JSON.stringify(groceries));
    const container = document.getElementById("groceryContainer");
    let splitTotal = 0;
    let quickTotal = 0;

    container.innerHTML = groceries.map((item, idx) => {
        let minP = Infinity;
        let bestStore = "";
        for (const [store, p] of Object.entries(item.prices)) {
            if (p < minP) { minP = p; bestStore = store; }
        }
        splitTotal += minP * item.qty;
        quickTotal += item.prices.Blinkit * item.qty;

        const storeHTML = Object.entries(item.prices).map(([store, p]) => `
            <div class="store-box ${store === bestStore ? 'best' : ''}">
                <div>${store}</div>
                <input class="store-input" type="number" value="${p}" onchange="updatePrice(${idx}, '${store}', this.value)">
            </div>
        `).join("");

        return `
            <div class="grocery-card">
                <div class="grocery-top">
                    <div>
                        <strong>${item.name}</strong>
                        <span class="badge loot" style="margin-left: 6px;">Best: ${bestStore}</span>
                    </div>
                    <div>
                        <button class="qty-btn" onclick="changeQty(${idx}, -1)">-</button>
                        <span style="margin: 0 8px; font-weight: bold;">${item.qty}</span>
                        <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
                    </div>
                </div>
                <div class="store-grid">${storeHTML}</div>
            </div>
        `;
    }).join("");

    document.getElementById("grocSplitTotal").innerText = formatINR(splitTotal);
    document.getElementById("grocQuickTotal").innerText = formatINR(quickTotal);
    document.getElementById("grocSavingsTotal").innerText = formatINR(quickTotal - splitTotal) + "/mo";
}

function changeQty(idx, delta) {
    groceries[idx].qty = Math.max(0, groceries[idx].qty + delta);
    renderGroceries();
}

function updatePrice(idx, store, val) {
    groceries[idx].prices[store] = parseFloat(val) || 0;
    renderGroceries();
}

// Initialize on load
calculateGold();
renderGroceries();
