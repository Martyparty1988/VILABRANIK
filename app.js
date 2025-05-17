// ==== Nastavení základních dat a konstant ====

// Výchozí kurz Kč/€
const DEFAULT_KURZ = 25.0;

// Výchozí položky (editovatelné v nastavení)
const DEFAULT_ITEMS = [
  // Služby
  { kategorie: "Služby", nazev: "Plyn do grilu", cena: 20, mena: "€", fixni: true },
  { kategorie: "Služby", nazev: "Wellness", cena: 0, mena: "Kč", manualni: true, fixni: true },

  // Nápoje – Alkohol
  { kategorie: "Nápoje – Alkohol", nazev: "Prosecco", cena: 390, mena: "Kč", fixni: true },
  { kategorie: "Nápoje – Alkohol", nazev: "Jack Daniels & Cola 0,33 l", cena: 100, mena: "Kč", fixni: true },
  { kategorie: "Nápoje – Alkohol", nazev: "Befeater Gin & Tonic 0,25 l", cena: 75, mena: "Kč", fixni: true },
  { kategorie: "Nápoje – Alkohol", nazev: "Budvar 10° 0,5 l", cena: 50, mena: "Kč", fixni: true },

  // Nápoje – Nealko
  { kategorie: "Nápoje – Nealko", nazev: "Red Bull 0,25 l", cena: 60, mena: "Kč", fixni: true },
  { kategorie: "Nápoje – Nealko", nazev: "Coca-Cola, Sprite, Fanta 0,33 l", cena: 30, mena: "Kč", fixni: true },
  { kategorie: "Nápoje – Nealko", nazev: "Korunní Citrus Mix 0,33 l", cena: 35, mena: "Kč", fixni: true },
  { kategorie: "Nápoje – Nealko", nazev: "Korunní Vitamin D3 0,33 l", cena: 35, mena: "Kč", fixni: true },

  // Ostatní
  { kategorie: "Ostatní", nazev: "Káva kapsle", cena: 30, mena: "Kč", fixni: true, poznamka: "Prvních 25 kapslí zdarma" },

  // Snídaně
  { kategorie: "Snídaně", nazev: "Snídaně", cena: 200, mena: "Kč", fixni: true },
  { kategorie: "Snídaně", nazev: "Fresh džus 330ml", cena: 115, mena: "Kč", fixni: true },

  // Poplatky
  { kategorie: "Poplatky", nazev: "City tax", cena: 2, mena: "€", typ: "citytax", fixni: true },
  { kategorie: "Poplatky", nazev: "Osoba navíc", cena: 1000, mena: "Kč", fixni: true },

  // Sekce Dárky – dynamická (prázdná, přidáš sám)
];

// Kategorie – pořadí v nabídce
const CATEGORIES = [
  "Služby",
  "Nápoje – Alkohol",
  "Nápoje – Nealko",
  "Ostatní",
  "Snídaně",
  "Poplatky",
  "Dárky"
];

// ==== Lokální úložiště (pro trvalost dat) ====

const LS_KEYS = {
  KURZ: "bary-kurz",
  ITEMS: "bary-items",
  HIST: "bary-historie",
  SETTINGS: "bary-settings"
};

// ==== Helpery pro práci s localStorage ====
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function loadData(key, fallback) {
  let val = localStorage.getItem(key);
  return val ? JSON.parse(val) : fallback;
}

// ==== Základní stav aplikace ====
let stav = {
  kurz: loadData(LS_KEYS.KURZ, DEFAULT_KURZ),
  items: loadData(LS_KEYS.ITEMS, DEFAULT_ITEMS),
  historie: loadData(LS_KEYS.HIST, []),
  settings: loadData(LS_KEYS.SETTINGS, { mena: "Kč" }),
  tab: "invoice"
};

// ==== Hlavní render funkce ====
function renderApp() {
  const main = document.getElementById("app");
  switch (stav.tab) {
    case "invoice":
      renderInvoice(main);
      break;
    case "history":
      renderHistory(main);
      break;
    case "stats":
      renderStats(main);
      break;
  }
}
function switchTab(tab) {
  stav.tab = tab;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  renderApp();
}
document.querySelectorAll(".tab-btn").forEach(b =>
  b.addEventListener("click", e => switchTab(b.dataset.tab))
);

// ==== Inicializace menu a nastavení ====
document.getElementById("settingsBtn").addEventListener("click", showSettings);

// Po načtení
window.onload = () => {
  renderApp();
  registerSW();
};

// ==== Service worker pro PWA offline režim ====
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
}
// ==== Renderování účtenky ====
function renderInvoice(main) {
  main.innerHTML = "";

  // Personalizace
  let invoiceDetails = document.createElement("div");
  invoiceDetails.className = "invoice-details";
  invoiceDetails.innerHTML = `
    <label>Jméno hosta: <input id="hostName" value="${stav.settings.hostName || ""}" placeholder="Nepovinné"></label>
    <label>Číslo rezervace: <input id="reservationNum" value="${stav.settings.resNum || ""}" placeholder="Nepovinné"></label>
    <label>Poznámka k účtence: <input id="invoiceNote" value="${stav.settings.invoiceNote || ""}" placeholder="Např. Přejeme krásný pobyt!"></label>
    <div class="date">Datum: <span id="todayDate">${(new Date()).toLocaleDateString("cs-CZ")}</span></div>
  `;
  main.appendChild(invoiceDetails);

  // Měna
  let currencyRow = document.createElement("div");
  currencyRow.className = "currency-row";
  currencyRow.innerHTML = `
    <label>Měna: 
      <select id="currencySelect">
        <option value="Kč" ${stav.settings.mena === "Kč" ? "selected" : ""}>Kč</option>
        <option value="€" ${stav.settings.mena === "€" ? "selected" : ""}>€</option>
      </select>
      <span id="currentRate">(1&nbsp;€ = ${stav.kurz} Kč)</span>
    </label>
  `;
  main.appendChild(currencyRow);
  document.getElementById("currencySelect").onchange = (e) => {
    stav.settings.mena = e.target.value;
    saveData(LS_KEYS.SETTINGS, stav.settings);
    renderApp();
  };

  // Seskupení položek podle kategorií
  CATEGORIES.forEach(cat => {
    let catItems = stav.items.filter(i => i.kategorie === cat && !i.skryto);
    if (catItems.length === 0 && cat !== "Dárky") return;
    let section = document.createElement("section");
    section.className = "category";
    if (cat === "Dárky") section.classList.add("gifts");

    let title = document.createElement("h3");
    title.innerHTML = cat + (cat === "Dárky" ? ' <span title="Dárky se do ceny nepočítají">🎁</span>' : "");
    section.appendChild(title);

    // Položky
    catItems.forEach((item, idx) => {
      let id = `item-${cat}-${idx}`;
      let row = document.createElement("div");
      row.className = "item-row" + (cat === "Dárky" ? " gift-row" : "");
      // Speciální vstupy: City tax, Wellness (manuální částka), Osoba navíc
      let controls = "";
      if (item.typ === "citytax") {
        controls = `
          <label>Osob: <input type="number" id="${id}-osoby" min="0" value="${item.osoby || ""}" style="width:4em"></label>
          <label>Dní: <input type="number" id="${id}-dny" min="0" value="${item.dny || ""}" style="width:4em"></label>
        `;
      } else if (item.manualni) {
        controls = `<input type="number" id="${id}-manual" min="0" step="1" placeholder="částka" value="${item.castka || ""}" style="width:8em">`;
      } else if (cat === "Dárky") {
        controls = `
          <input type="text" id="${id}-note" placeholder="Poznámka (např. welcome drink)" value="${item.poznamka || ""}" style="width:13em">
          <input type="checkbox" id="${id}-select" ${item.vybrano ? "checked" : ""}>
        `;
      } else {
        controls = `
          <input type="number" id="${id}-count" min="0" step="1" placeholder="0" value="${item.pocet || ""}" style="width:4em">
        `;
      }
      // Cena a měna
      let cenaStr = (stav.settings.mena === "€" && item.mena === "Kč") ?
        (Math.round(item.cena / stav.kurz * 100) / 100 + " €") :
        (stav.settings.mena === "Kč" && item.mena === "€") ?
        (Math.round(item.cena * stav.kurz) + " Kč") :
        (item.cena + " " + item.mena);

      row.innerHTML = `
        <span class="item-label">${item.nazev}${item.poznamka ? ` <small class="note">(${item.poznamka})</small>` : ""}</span>
        ${controls}
        <span class="item-price">${cat === "Dárky" ? "—" : cenaStr}</span>
      `;
      section.appendChild(row);

      // Event listenery na změny v řádku
      if (item.typ === "citytax") {
        document.getElementById(`${id}-osoby`).oninput = e => {
          item.osoby = parseInt(e.target.value) || 0;
          saveData(LS_KEYS.ITEMS, stav.items);
        };
        document.getElementById(`${id}-dny`).oninput = e => {
          item.dny = parseInt(e.target.value) || 0;
          saveData(LS_KEYS.ITEMS, stav.items);
        };
      } else if (item.manualni) {
        document.getElementById(`${id}-manual`).oninput = e => {
          item.castka = parseFloat(e.target.value) || 0;
          saveData(LS_KEYS.ITEMS, stav.items);
        };
      } else if (cat === "Dárky") {
        document.getElementById(`${id}-note`).oninput = e => {
          item.poznamka = e.target.value;
          saveData(LS_KEYS.ITEMS, stav.items);
        };
        document.getElementById(`${id}-select`).onchange = e => {
          item.vybrano = e.target.checked;
          saveData(LS_KEYS.ITEMS, stav.items);
        };
      } else {
        document.getElementById(`${id}-count`).oninput = e => {
          item.pocet = parseInt(e.target.value) || 0;
          saveData(LS_KEYS.ITEMS, stav.items);
        };
      }
    });

    // Dárky: tlačítko na přidání
    if (cat === "Dárky") {
      let addGift = document.createElement("button");
      addGift.className = "add-gift-btn";
      addGift.innerHTML = "Přidat dárek 🎁";
      addGift.onclick = () => {
        stav.items.push({ kategorie: "Dárky", nazev: "Nový dárek", vybrano: false, poznamka: "" });
        saveData(LS_KEYS.ITEMS, stav.items);
        renderApp();
      };
      section.appendChild(addGift);
    }
    main.appendChild(section);
  });

  // Celkový součet
  let sum = vypocitejCelkem();
  let summary = document.createElement("div");
  summary.className = "invoice-summary";
  summary.innerHTML = `
    <b>Celkem k platbě: <span id="totalSum">${sum.celkova} ${stav.settings.mena}</span></b>
    ${sum.sleva > 0 ? `<div class="discount-info">Sleva/akce: -${sum.sleva} ${stav.settings.mena}</div>` : ""}
    <button id="saveInvoiceBtn">Uložit účtenku</button>
    <button id="exportPdfBtn">Export PDF</button>
    <button id="exportCsvBtn">Export CSV</button>
    <button id="resetBtn" style="float:right">Resetovat</button>
  `;
  main.appendChild(summary);

  // Listenery
  document.getElementById("saveInvoiceBtn").onclick = ulozUctenku;
  document.getElementById("exportPdfBtn").onclick = exportPdf;
  document.getElementById("exportCsvBtn").onclick = exportCsv;
  document.getElementById("resetBtn").onclick = resetForm;

  // Event listenery pro poznámky/personalizaci
  document.getElementById("hostName").oninput = e => {
    stav.settings.hostName = e.target.value;
    saveData(LS_KEYS.SETTINGS, stav.settings);
  };
  document.getElementById("reservationNum").oninput = e => {
    stav.settings.resNum = e.target.value;
    saveData(LS_KEYS.SETTINGS, stav.settings);
  };
  document.getElementById("invoiceNote").oninput = e => {
    stav.settings.invoiceNote = e.target.value;
    saveData(LS_KEYS.SETTINGS, stav.settings);
  };
}
// ==== Výpočet celkové ceny ====
function vypocitejCelkem() {
  let sum = 0, sleva = 0;
  stav.items.forEach(item => {
    // Dárky nepočítáme do ceny
    if (item.kategorie === "Dárky" && item.vybrano) return;
    let kusu = item.pocet || 0;
    // City tax – zvlášť
    if (item.typ === "citytax") {
      let osoby = item.osoby || 0;
      let dny = item.dny || 0;
      if (osoby > 0 && dny > 0) {
        let cityTaxCelk = osoby * dny * item.cena;
        sum += stav.settings.mena === "€" ? cityTaxCelk : cityTaxCelk * stav.kurz;
      }
    } 
    // Manuální položka (wellness, snídaně...)
    else if (item.manualni && item.castka) {
      sum += stav.settings.mena === item.mena
        ? item.castka
        : (item.mena === "Kč" ? item.castka / stav.kurz : item.castka * stav.kurz);
    } 
    // Ostatní položky
    else if (kusu > 0) {
      let cena = item.cena;
      // Měna
      if (stav.settings.mena === item.mena) {
        sum += cena * kusu;
      } else if (stav.settings.mena === "€" && item.mena === "Kč") {
        sum += (cena / stav.kurz) * kusu;
      } else if (stav.settings.mena === "Kč" && item.mena === "€") {
        sum += (cena * stav.kurz) * kusu;
      }
      // Slevy/akce: pokud má atribut sleva (pro budoucí rozšíření)
      if (item.sleva && item.sleva > 0) {
        sleva += item.sleva * kusu;
      }
    }
  });
  sum = Math.round(sum * 100) / 100;
  sleva = Math.round(sleva * 100) / 100;
  return { celkova: sum - sleva, sleva };
}

// ==== Uložení účtenky do historie ====
function ulozUctenku() {
  let polozkyNaUctence = stav.items
    .filter(item => {
      if (item.kategorie === "Dárky") return item.vybrano;
      if (item.typ === "citytax") return item.osoby && item.dny;
      if (item.manualni) return item.castka && item.castka > 0;
      return item.pocet && item.pocet > 0;
    })
    .map(item => {
      let vystup = { ...item };
      // Skryj interní atributy, ulož pouze relevantní info
      delete vystup.fixni;
      return vystup;
    });

  let faktura = {
    id: Date.now(),
    datum: (new Date()).toLocaleString("cs-CZ"),
    hostName: stav.settings.hostName || "",
    resNum: stav.settings.resNum || "",
    invoiceNote: stav.settings.invoiceNote || "",
    mena: stav.settings.mena,
    kurz: stav.kurz,
    celkem: vypocitejCelkem().celkova,
    sleva: vypocitejCelkem().sleva,
    polozky: polozkyNaUctence
  };

  stav.historie.unshift(faktura);
  saveData(LS_KEYS.HIST, stav.historie);

  // Po uložení vynulovat pole (reset)
  resetForm(true);
  alert("Účtenka uložena do historie!");
  switchTab("history");
}

// ==== Export účtenky do PDF (jednoduchý export jako HTML do nového okna, pro tisk/uložení do PDF) ====
function exportPdf() {
  let sum = vypocitejCelkem();
  let obsah = `
    <h2>Bary – Vila Praha Braník</h2>
    <h3>Accommodation and Conference Services Prague Agency, s.r.o.</h3>
    <p><b>Datum:</b> ${(new Date()).toLocaleString("cs-CZ")}</p>
    ${stav.settings.hostName ? `<p><b>Host:</b> ${stav.settings.hostName}</p>` : ""}
    ${stav.settings.resNum ? `<p><b>Rezervace:</b> ${stav.settings.resNum}</p>` : ""}
    <table border="1" cellpadding="4" cellspacing="0" style="margin:1em 0;width:100%;font-size:1.1em;">
      <tr><th>Položka</th><th>Počet/částka</th><th>Poznámka</th><th>Cena</th></tr>
  `;
  stav.items.forEach(item => {
    if (item.kategorie === "Dárky" && !item.vybrano) return;
    if (item.kategorie === "Dárky") {
      obsah += `<tr style="background:#e5ffe5;"><td>🎁 ${item.nazev}</td><td>—</td><td>${item.poznamka || ""}</td><td>—</td></tr>`;
      return;
    }
    let popis = "";
    let pocet = "";
    let cena = "";
    if (item.typ === "citytax" && item.osoby && item.dny) {
      popis = "City tax";
      pocet = item.osoby + " os. × " + item.dny + " dní";
      cena = stav.settings.mena === "€"
        ? (item.osoby * item.dny * item.cena) + " €"
        : Math.round(item.osoby * item.dny * item.cena * stav.kurz) + " Kč";
    } else if (item.manualni && item.castka && item.castka > 0) {
      popis = item.nazev;
      pocet = "—";
      cena = stav.settings.mena === item.mena
        ? item.castka + " " + item.mena
        : (item.mena === "Kč"
          ? Math.round(item.castka / stav.kurz * 100) / 100 + " €"
          : Math.round(item.castka * stav.kurz) + " Kč");
    } else if (item.pocet && item.pocet > 0) {
      popis = item.nazev;
      pocet = item.pocet + "×";
      let val = stav.settings.mena === item.mena
        ? item.cena + " " + item.mena
        : (item.mena === "Kč"
          ? Math.round(item.cena / stav.kurz * 100) / 100 + " €"
          : Math.round(item.cena * stav.kurz) + " Kč");
      cena = val + (item.sleva ? `<br>(sleva: -${item.sleva} ${stav.settings.mena})` : "");
    }
    if (popis) {
      obsah += `<tr><td>${popis}</td><td>${pocet}</td><td>${item.poznamka || ""}</td><td>${cena}</td></tr>`;
    }
  });
  obsah += `
      <tr><th colspan="3" style="text-align:right">Celkem:</th><th>${sum.celkova} ${stav.settings.mena}</th></tr>
    </table>
    ${stav.settings.invoiceNote ? `<p><i>Poznámka: ${stav.settings.invoiceNote}</i></p>` : ""}
  `;
  let win = window.open("", "_blank");
  win.document.write(`<html><head><title>Účtenka</title></head><body>${obsah}</body></html>`);
  win.print();
}

// ==== Export účtenky do CSV ====
function exportCsv() {
  let sum = vypocitejCelkem();
  let rows = [
    ["Položka", "Počet/částka", "Poznámka", "Cena"],
  ];
  stav.items.forEach(item => {
    if (item.kategorie === "Dárky" && !item.vybrano) return;
    if (item.kategorie === "Dárky") {
      rows.push([`🎁 ${item.nazev}`, "", item.poznamka || "", ""]);
      return;
    }
    let popis = "";
    let pocet = "";
    let cena = "";
    if (item.typ === "citytax" && item.osoby && item.dny) {
      popis = "City tax";
      pocet = item.osoby + " os. × " + item.dny + " dní";
      cena = stav.settings.mena === "€"
        ? (item.osoby * item.dny * item.cena) + " €"
        : Math.round(item.osoby * item.dny * item.cena * stav.kurz) + " Kč";
    } else if (item.manualni && item.castka && item.castka > 0) {
      popis = item.nazev;
      pocet = "—";
      cena = stav.settings.mena === item.mena
        ? item.castka + " " + item.mena
        : (item.mena === "Kč"
          ? Math.round(item.castka / stav.kurz * 100) / 100 + " €"
          : Math.round(item.castka * stav.kurz) + " Kč");
    } else if (item.pocet && item.pocet > 0) {
      popis = item.nazev;
      pocet = item.pocet + "×";
      let val = stav.settings.mena === item.mena
        ? item.cena + " " + item.mena
        : (item.mena === "Kč"
          ? Math.round(item.cena / stav.kurz * 100) / 100 + " €"
          : Math.round(item.cena * stav.kurz) + " Kč");
      cena = val + (item.sleva ? `(sleva: -${item.sleva} ${stav.settings.mena})` : "");
    }
    if (popis) {
      rows.push([popis, pocet, item.poznamka || "", cena]);
    }
  });
  rows.push(["Celkem", "", "", sum.celkova + " " + stav.settings.mena]);
  let csvContent = rows.map(r => r.map(cell => `"${cell}"`).join(";")).join("\n");
  let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "uctenka.csv";
  a.click();
}

// ==== Reset formuláře ====
function resetForm(skipRender) {
  stav.items.forEach(item => {
    delete item.pocet;
    delete item.osoby;
    delete item.dny;
    delete item.castka;
    delete item.vybrano;
    // dárkům nechám poznámky
  });
  if (!skipRender) renderApp();
}
// ==== Historie účtenek ====
function renderHistory(main) {
  main.innerHTML = "<h2>Historie účtenek</h2>";
  if (!stav.historie.length) {
    main.innerHTML += "<p>Nemáš uloženou žádnou účtenku.</p>";
    return;
  }
  let table = document.createElement("table");
  table.className = "history-table";
  table.innerHTML = `
    <tr>
      <th>Datum</th>
      <th>Host</th>
      <th>Rezervace</th>
      <th>Celkem</th>
      <th>Měna</th>
      <th>Akce</th>
    </tr>
  `;
  stav.historie.forEach((uctenka, idx) => {
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${uctenka.datum}</td>
      <td>${uctenka.hostName || ""}</td>
      <td>${uctenka.resNum || ""}</td>
      <td>${uctenka.celkem}</td>
      <td>${uctenka.mena}</td>
      <td>
        <button class="history-detail" data-id="${uctenka.id}">Detail</button>
        <button class="history-del" data-idx="${idx}">🗑️</button>
      </td>
    `;
    table.appendChild(tr);
  });
  main.appendChild(table);

  // Detail + smazání
  main.querySelectorAll(".history-detail").forEach(btn => {
    btn.onclick = e => {
      let id = btn.dataset.id;
      let uctenka = stav.historie.find(u => u.id == id);
      showInvoiceDetail(uctenka);
    };
  });
  main.querySelectorAll(".history-del").forEach(btn => {
    btn.onclick = e => {
      let idx = parseInt(btn.dataset.idx);
      if (confirm("Opravdu smazat tuto účtenku?")) {
        stav.historie.splice(idx, 1);
        saveData(LS_KEYS.HIST, stav.historie);
        renderApp();
      }
    };
  });
}

// ==== Detail účtenky (modal) ====
function showInvoiceDetail(uctenka) {
  let modal = document.getElementById("settingsModal");
  let rows = uctenka.polozky.map(item => {
    if (item.kategorie === "Dárky")
      return `<tr style="background:#e5ffe5"><td>🎁 ${item.nazev}</td><td></td><td>${item.poznamka || ""}</td><td></td></tr>`;
    let pocet = item.pocet ? item.pocet + "×" : "";
    let castka = item.castka ? item.castka : "";
    let cena = "";
    if (item.typ === "citytax" && item.osoby && item.dny) {
      cena = uctenka.mena === "€"
        ? (item.osoby * item.dny * item.cena) + " €"
        : Math.round(item.osoby * item.dny * item.cena * uctenka.kurz) + " Kč";
    } else if (item.manualni && castka) {
      cena = uctenka.mena === item.mena
        ? castka + " " + item.mena
        : (item.mena === "Kč"
          ? Math.round(castka / uctenka.kurz * 100) / 100 + " €"
          : Math.round(castka * uctenka.kurz) + " Kč");
    } else if (pocet) {
      cena = uctenka.mena === item.mena
        ? item.cena + " " + item.mena
        : (item.mena === "Kč"
          ? Math.round(item.cena / uctenka.kurz * 100) / 100 + " €"
          : Math.round(item.cena * uctenka.kurz) + " Kč");
    }
    return `<tr><td>${item.nazev}</td><td>${pocet || castka}</td><td>${item.poznamka || ""}</td><td>${cena}</td></tr>`;
  }).join("");
  modal.innerHTML = `
    <div class="modal-content">
      <button class="close-modal" onclick="closeModal()">✖️</button>
      <h2>Účtenka</h2>
      <b>Datum:</b> ${uctenka.datum}<br>
      ${uctenka.hostName ? `<b>Host:</b> ${uctenka.hostName}<br>` : ""}
      ${uctenka.resNum ? `<b>Rezervace:</b> ${uctenka.resNum}<br>` : ""}
      <table class="history-detail-table" border="1">
        <tr><th>Položka</th><th>Počet/částka</th><th>Poznámka</th><th>Cena</th></tr>
        ${rows}
        <tr><th colspan="3" style="text-align:right">Celkem:</th><th>${uctenka.celkem} ${uctenka.mena}</th></tr>
      </table>
      ${uctenka.invoiceNote ? `<p>Poznámka: <i>${uctenka.invoiceNote}</i></p>` : ""}
    </div>
  `;
  modal.className = "modal active";
}
function closeModal() {
  document.getElementById("settingsModal").className = "modal";
  document.getElementById("settingsModal").innerHTML = "";
}
window.closeModal = closeModal;

// ==== Statistiky ====
function renderStats(main) {
  main.innerHTML = "<h2>Statistiky</h2>";
  if (!stav.historie.length) {
    main.innerHTML += "<p>Nemáš data pro statistiky.</p>";
    return;
  }
  // Počet účtenek, tržby, nejčastější položky
  let sumKc = 0, sumEur = 0, polozkyStat = {};
  stav.historie.forEach(u => {
    if (u.mena === "Kč") sumKc += u.celkem;
    else sumEur += u.celkem;
    u.polozky.forEach(item => {
      if (item.kategorie === "Dárky") return;
      let key = item.nazev;
      polozkyStat[key] = (polozkyStat[key] || 0) + (item.pocet || 1);
    });
  });
  let nej = Object.entries(polozkyStat).sort((a,b)=>b[1]-a[1]).slice(0, 5);
  main.innerHTML += `
    <div>
      <b>Celkový počet účtenek:</b> ${stav.historie.length}<br>
      <b>Tržby (Kč):</b> ${sumKc}<br>
      <b>Tržby (€):</b> ${sumEur}<br>
      <b>TOP položky:</b><br>
      <ol>
        ${nej.map(e=>`<li>${e[0]} (${e[1]}×)</li>`).join("")}
      </ol>
    </div>
  `;
  main.innerHTML += `<button onclick="exportHistorie()">Exportovat historii (CSV)</button>`;
}
window.exportHistorie = function exportHistorie() {
  let rows = [["Datum","Host","Rezervace","Celkem","Měna","Položky"]];
  stav.historie.forEach(u=>{
    let polozky = u.polozky.map(p=>p.nazev+(p.pocet?` (${p.pocet}×)`:"")).join(", ");
    rows.push([u.datum,u.hostName,u.resNum,u.celkem,u.mena,polozky]);
  });
  let csv = rows.map(r=>r.map(cell=>`"${cell}"`).join(";")).join("\n");
  let blob = new Blob([csv], { type: "text/csv" });
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "historie-uctenek.csv";
  a.click();
};

// ==== Nastavení (modal okno) ====
function showSettings() {
  let modal = document.getElementById("settingsModal");
  let kurz = stav.kurz;
  let cats = [...CATEGORIES];
  // Správa položek
  let polozky = stav.items.map((item, idx) => `
    <tr>
      <td>${item.kategorie}</td>
      <td><input value="${item.nazev}" onchange="editNazev(${idx}, this.value)" ${item.fixni ? "readonly" : ""}></td>
      <td>
        ${item.manualni ? "Ručně" : item.cena + " " + item.mena}
      </td>
      <td>
        ${item.kategorie !== "Dárky" && !item.fixni ? `<button onclick="delPolozka(${idx})">🗑️</button>` : ""}
        ${item.kategorie !== "Dárky" && !item.fixni ? `<button onclick="skrytPolozka(${idx})">Skrýt</button>` : ""}
      </td>
    </tr>
  `).join("");

  modal.innerHTML = `
    <div class="modal-content">
      <button class="close-modal" onclick="closeModal()">✖️</button>
      <h2>Nastavení</h2>
      <label>Ruční úprava kurzu Kč/€: <input type="number" step="0.01" id="kurzInput" value="${kurz}" style="width:7em"> (aktuální: ${stav.kurz})</label>
      <button id="saveKurzBtn">Uložit kurz</button>
      <h3>Správa položek</h3>
      <table class="settings-table"><tr><th>Kategorie</th><th>Název</th><th>Cena</th><th>Akce</th></tr>${polozky}</table>
      <button id="addItemBtn">Přidat vlastní položku</button>
      <h3>Ostatní</h3>
      <button id="resetAppBtn" style="background:#ffbaba">Obnovit tovární nastavení</button>
    </div>
  `;
  modal.className = "modal active";

  // Listenery
  document.getElementById("kurzInput").oninput = e => kurz = parseFloat(e.target.value) || stav.kurz;
  document.getElementById("saveKurzBtn").onclick = () => {
    stav.kurz = kurz;
    saveData(LS_KEYS.KURZ, kurz);
    closeModal();
    renderApp();
  };
  document.getElementById("addItemBtn").onclick = () => {
    let kategorie = prompt("Do jaké kategorie patří položka?\n" + cats.join(", "), cats[0]);
    let nazev = prompt("Název položky:");
    let cena = parseFloat(prompt("Cena:")) || 0;
    let mena = prompt("Měna (Kč/€):", "Kč");
    if (!nazev || !kategorie) return;
    stav.items.push({ kategorie, nazev, cena, mena });
    saveData(LS_KEYS.ITEMS, stav.items);
    closeModal();
    renderApp();
  };
  document.getElementById("resetAppBtn").onclick = () => {
    if (confirm("Obnovit tovární nastavení? Všechny vlastní položky i historie budou smazány!")) {
      localStorage.clear();
      window.location.reload();
    }
  };
}
window.editNazev = function(idx, val) {
  stav.items[idx].nazev = val;
  saveData(LS_KEYS.ITEMS, stav.items);
};
window.delPolozka = function(idx) {
  if (confirm("Opravdu smazat položku?")) {
    stav.items.splice(idx,1);
    saveData(LS_KEYS.ITEMS, stav.items);
    closeModal();
    renderApp();
  }
};
window.skrytPolozka = function(idx) {
  stav.items[idx].skryto = true;
  saveData(LS_KEYS.ITEMS, stav.items);
  closeModal();
  renderApp();
};

// ==== Vylepšení UX – klik mimo modal zavře okno ====
window.onclick = function(e) {
  let modal = document.getElementById("settingsModal");
  if (modal.className.includes("active") && e.target === modal) closeModal();
};
