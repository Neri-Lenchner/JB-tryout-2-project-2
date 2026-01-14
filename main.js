import { manager } from './manager.js';
import { Currency } from "./currency.model.js";
/**
 * DOM references and event listeners setup
 */
const pagesMonitor = document.getElementById('pages-monitor');
/**
 * Main scrollable container reference (used for initial scroll position)
 */
const container = document.getElementById('scroll-container');
/**
 * Navigation and action buttons
 */
const searchButton = document.querySelector('#search-button');
const aboutButton = document.querySelector('#about-button');
const homeButton = document.querySelector('#home-button');
const liveReportsButton = document.querySelector('#live-reports-button');
/**
 * Main search input field
 */
const mainInput = document.querySelector('#main-input');
/**
 * CryptoCompare API key (used for live price fetching in charts)
 */
const myApiKey = '785e25aa48363b73d265706d01aaf5b730d0f78a58578a8ab52f211ae73e2293';
/**
 * Enter key in main input triggers search
 */
mainInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        search();
    }
});
/**
 * Initial scroll position adjustment after DOM is ready
 */
setTimeout(() => {
    container.scrollTop = 590;
}, 0);
/* ───────────────────────────────────────────────
   Navigation Button Handlers
─────────────────────────────────────────────── */
/**
 * Home button handler:
 * - Stops any running live crypto chart if the chart container exists
 * - Clears the current content in the pages monitor
 * - Renders the main currency list page (page 2)
 * - If the currency list has more than 100 items (large dataset),
 *   shows a loading animation for 600 ms while rendering to improve perceived performance
 * - For smaller lists (≤ 100 items), renders instantly without loader
 */
homeButton.onclick = () => {
    if (document.querySelector('#chartContainer')) {
        stopCryptoChart();
    }
    clearPagesFromMonitor();
    if (manager.currencyList.length > 100) {
        manager.show();
        setTimeout(() => {
            renderPage2();
            manager.hide();
        }, 600);
    }
    else {
        renderPage2();
    }
};
/**
 * Live Reports button: stops any running chart, clears monitor,
 * builds chart container, and starts live price chart for up to 5 selected currencies
 */
liveReportsButton.onclick = () => {
    if (selectedCurrencies.length === 0) {
        alert('Please select at list one currency');
        return;
    }
    stopCryptoChart();
    clearPagesFromMonitor();
    const symbols = selectedCurrencies.map(c => c.symbol.toUpperCase());
    const fiveSymbols = [
        symbols[0] || "",
        symbols[1] || "",
        symbols[2] || "",
        symbols[3] || "",
        symbols[4] || ""
    ];
    const chartDiv = document.createElement('div');
    chartDiv.id = "chartContainer";
    chartDiv.className = "chart-container";
    pagesMonitor?.appendChild(chartDiv);
    startCryptoChart(fiveSymbols[0], fiveSymbols[1], fiveSymbols[2], fiveSymbols[3], fiveSymbols[4], myApiKey);
};
/**
 * Search button: stops chart if active, triggers search for a single currency symbol
 */
searchButton.onclick = () => {
    if (document.querySelector('#chartContainer')) {
        stopCryptoChart();
    }
    search();
};
/**
 * About button: stops chart if active, clears monitor, renders personal about page (page 3)
 */
aboutButton.onclick = () => {
    if (document.querySelector('#chartContainer')) {
        stopCryptoChart();
    }
    clearPagesFromMonitor();
    renderPage3();
};
/* ───────────────────────────────────────────────
   Global state for selected currencies & limit handling
─────────────────────────────────────────────── */
/**
 * Array of currently selected currencies for live reporting (max 5)
 */
const selectedCurrencies = [];
/**
 * Temporary reference to a 6th currency the user is trying to select
 * (triggers limit popup / selection manager)
 */
let pendingSixth = null;
/* ───────────────────────────────────────────────
   Page rendering functions
─────────────────────────────────────────────── */
/**
 * Renders the main currency list page (top 99 coins from manager)
 * Clears monitor and displays cards for selection
 */
function renderPage2() {
    const listContainer = document.createElement('div');
    listContainer.className = 'pages-monitor';
    pagesMonitor?.appendChild(listContainer);
    const currencyList = manager.currencyList;
    renderCurrencyList(currencyList, listContainer);
}
/**
 * Renders the "About Me" static page with text and image
 * Clears monitor first, then builds layout
 */
function renderPage3() {
    clearPagesFromMonitor();
    const container = document.createElement('div');
    container.classList.add('page-3-container');
    const title = document.createElement('h1');
    title.className = 'about-headline';
    title.textContent = 'About-Me';
    const text = document.createElement('p');
    text.className = 'about';
    text.textContent = 'I am a young web developer who intends to integrate all the rich life experience he has accumulated, over the thousand years that have passed him, into the amazing humble art of web development. Born in 1977 and been making music most of my life, I see web development as a direct continuation of my previous occupation and I find this new occupation mind-blowing';
    const textWrapper = document.createElement('div');
    textWrapper.className = 'about-wrapper';
    textWrapper.appendChild(text);
    const img = document.createElement('img');
    img.className = 'my-own-image';
    img.src = 'me.jpg';
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'img-wrapper';
    const midSectionAbout = document.createElement('div');
    midSectionAbout.className = 'mid-section-about';
    const page3Container = document.createElement('div');
    page3Container.className = 'page-3-container';
    imgWrapper.appendChild(img);
    midSectionAbout.append(textWrapper, imgWrapper);
    page3Container.append(title, midSectionAbout);
    pagesMonitor?.appendChild(page3Container);
}
let chart; // that fucker comes from canvas js //
let updateIntervalId = null;
const maxPoints = 20;
/* ───────────────────────────────────────────────
   Chart axis formatters
─────────────────────────────────────────────── */
/**
 * Formats Y-axis values with K/M/B suffixes and $ prefix
 * @param e - CanvasJS event object containing the value
 * @returns Formatted string like "$1.23M"
 */
function addSymbols(e) {
    const suffixes = ["", "K", "M", "B"];
    let order = Math.max(Math.floor(Math.log(Math.abs(e.value)) / Math.log(1000)), 0);
    if (order > suffixes.length - 1)
        order = suffixes.length - 1;
    const formattedValue = CanvasJS.formatNumber(e.value / Math.pow(1000, order));
    return "$" + formattedValue + suffixes[order];
}
/**
 * Formats X-axis time labels as HH:mm:ss
 * @param e - CanvasJS event object containing the Date
 * @returns String like "14:35:22"
 */
function formatTimeLabel(e) {
    const h = String(e.value.getHours()).padStart(2, "0");
    const m = String(e.value.getMinutes()).padStart(2, "0");
    const s = String(e.value.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
}
/**
 * Starts live updating line chart for up to 5 cryptocurrencies using CanvasJS
 * Fetches prices every 2 seconds via CryptoCompare, keeps only last 20 points
 * @param currency1..currency5 - Symbol strings (e.g. "BTC", "ETH")
 * @param apiKey - Optional CryptoCompare API key
 */
function startCryptoChart(currency1, currency2, currency3, currency4, currency5, apiKey) {
    const coins = [currency1, currency2, currency3, currency4, currency5];
    const colors = ["cyan", "lime", "blue", "gold", "red"];
    const dataSeries = coins.map((coin, i) => ({
        type: "spline",
        showInLegend: true,
        name: coin,
        color: colors[i],
        lineThickness: 3,
        markerSize: 8,
        dataPoints: []
    }));
    chart = new CanvasJS.Chart("chartContainer", {
        animationEnabled: false,
        theme: "dark1",
        backgroundColor: "black",
        title: {
            text: "Live Crypto Prices (USD)",
            fontColor: "mediumspringgreen"
        },
        axisX: {
            valueFormatString: "HH:mm:ss",
            labelFormatter: formatTimeLabel,
            labelFontColor: "mediumspringgreen"
        },
        axisY: {
            includeZero: false,
            labelFormatter: addSymbols,
            labelFontColor: "mediumspringgreen"
        },
        toolTip: { shared: true },
        legend: { fontColor: "mediumspringgreen", fontSize: 13 },
        data: dataSeries
    });
    chart.render();
    updateIntervalId = setInterval(async () => {
        try {
            const data = await manager.getFiveCurrencies(coins, apiKey);
            if (!data)
                return;
            const now = new Date();
            coins.forEach((coin, i) => {
                if (coin && data[coin]?.USD !== undefined) {
                    dataSeries[i].dataPoints.push({ x: now, y: data[coin].USD });
                    if (dataSeries[i].dataPoints.length > maxPoints) {
                        dataSeries[i].dataPoints.shift();
                    }
                }
            });
            chart.render();
        }
        catch (err) {
            console.error("Error fetching crypto prices:", err);
        }
    }, 2000);
}
/**
 * Stops the live chart update interval if running
 */
function stopCryptoChart() {
    if (updateIntervalId !== null) {
        clearInterval(updateIntervalId);
        updateIntervalId = null;
    }
}
/* ───────────────────────────────────────────────
   Collapser (More Info) content generator
─────────────────────────────────────────────── */
/**
 * Generates HTML string for the collapsible price info section
 * Displays image + current prices in USD, EUR, ILS
 * @param currency - Currency object or null
 * @returns HTML string for innerHTML
 */
function createCollapserContainer(currency) {
    const imgSrc = (currency?.image).large || '₵ryptonit€';
    return `
    <div class="collapser">
      <img class="images" src="${imgSrc}">
      <div>Currency Price USD: <span class="collapser-span">${currency?.priceUSD || 'priceUSD'}</span> $</div>
      <div>Currency Price EUR: <span class="collapser-span">${currency?.priceEUR || 'priceEUR'}</span> €</div>
      <div>Currency Price ILS: <span class="collapser-span">${currency?.priceILS || 'priceILS'}</span> ₪</div>
    </div>
  `;
}
/* ───────────────────────────────────────────────
   Main currency card rendering
─────────────────────────────────────────────── */
/**
 * Renders a list of currency cards inside the given monitor element
 * Each card has symbol, name, More Info button, and toggle selection button
 * Handles More Info caching (localStorage ~2 min) and toggle logic with 5-currency limit
 * @param arr - Array of Currency objects to render
 * @param monitor - Container element to append cards to
 */
function renderCurrencyList(arr, monitor) {
    arr.forEach(currency => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
        <div class="card-left">
          <div class="currency-shorted-name">
            ${currency.symbol}
          </div>
          <div class="currency-name">
            ${currency.name}
          </div>
          <button class="more-info-btn">
            More Info
          </button>
        </div>
        <div class="card-right">
          <button class="toggle-btn" data-currency-id="${currency.id}"></button>
        </div>
      `;
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';
        cardContainer.appendChild(card);
        monitor?.appendChild(cardContainer);
        const toggle = cardContainer.querySelector('.toggle-btn');
        const moreInfoBtn = cardContainer.querySelector('.more-info-btn');
        toggle?.classList.toggle('on', currency.isOn);
        ///--More-Info_button-fuckin-functionality-blat--//-mui-importanto-////
        moreInfoBtn?.addEventListener('click', async () => {
            let collapserContainer = cardContainer.querySelector('.collapser-container');
            if (!collapserContainer) {
                collapserContainer = document.createElement('div');
                collapserContainer.className = 'collapser-container';
                cardContainer.appendChild(collapserContainer);
            }
            else {
                collapserContainer.style.display = collapserContainer.style.display === 'none' ? 'block' : 'none';
                return;
            }
            const twoMinutes = 120000;
            let currencyData = null;
            const stored = localStorage.getItem(`one-currency[${currency.id}]`);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Date.now() - (parsed.timeStamp || 0) < twoMinutes) {
                    currencyData = parsed;
                }
            }
            if (!currencyData) {
                currencyData = await manager.getOneCurrency(currency.id);
                if (currencyData) {
                    currencyData.timeStamp = Date.now();
                    manager.saveDataLocally(currencyData);
                }
            }
            collapserContainer.innerHTML = createCollapserContainer(currencyData);
        });
        toggle?.addEventListener('click', () => {
            if (!currency.isOn && selectedCurrencies.length === 5) {
                pendingSixth = currency;
                renderSelectedCards();
                return;
            }
            currency.isOn = !currency.isOn;
            if (currency.isOn) {
                if (!selectedCurrencies.includes(currency))
                    selectedCurrencies.push(currency);
            }
            else {
                const index = selectedCurrencies.indexOf(currency);
                if (index !== -1)
                    selectedCurrencies.splice(index, 1);
                pendingSixth = null;
            }
            const singleCurrencyToggleButtons = document.querySelectorAll(`.toggle-btn[data-currency-id="${currency.id}"]`);
            singleCurrencyToggleButtons.forEach(btn => {
                btn.classList.toggle('on', currency.isOn);
            });
            renderSelectedCards();
        });
    });
}
/**
 * Shows a popup when user tries to select a 6th currency
 * Currently renders the 5 selected ones + Cancel button
 * (Note: this is the part you want to enhance with Approve + toggles)
 */
function renderSelectedCards() {
    const existingFixed = document.querySelector('.fixed-container');
    if (existingFixed)
        existingFixed.remove();
    if (selectedCurrencies.length === 5 && pendingSixth) {
        const fixedContainer = document.createElement('div');
        fixedContainer.className = 'fixed-container';
        const headline = document.createElement('div');
        headline.className = 'headline';
        headline.innerHTML = '<div>You can only use 5 currencies</div>';
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button-cancel';
        closeButton.innerHTML = 'Cancel';
        closeButton.addEventListener('click', () => {
            pendingSixth = null;
            fixedContainer.remove();
        });
        fixedContainer.appendChild(headline);
        fixedContainer.appendChild(closeButton);
        document.body.appendChild(fixedContainer);
        renderCurrencyList(selectedCurrencies, fixedContainer);
    }
}
/* ───────────────────────────────────────────────
   Single currency search (quick lookup by symbol)
─────────────────────────────────────────────── */
/**
 * Searches for a currency by symbol (case-insensitive),
 * shows floating modal with result or error message
 * Clears previous search modal if exists
 */
async function search() {
    document.querySelector('.one-currency-monitor')?.remove();
    const inputSymbol = mainInput?.value.trim().toUpperCase();
    if (!inputSymbol)
        return;
    const currency = manager.currencyList.find(cur => cur.symbol.toUpperCase() === inputSymbol);
    if (!currency) {
        const oneCurrencyMonitor = document.createElement('div');
        oneCurrencyMonitor.className = 'one-currency-monitor';
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.innerHTML = 'X';
        closeButton.addEventListener('click', () => oneCurrencyMonitor.remove());
        oneCurrencyMonitor.appendChild(closeButton);
        const message = document.createElement('div');
        message.className = 'message-container';
        message.innerText = 'That currency does not exist in the currencies you have selected';
        oneCurrencyMonitor.appendChild(message);
        document.body.appendChild(oneCurrencyMonitor);
        return;
    }
    const oneCurrencyMonitor = document.createElement('div');
    oneCurrencyMonitor.className = 'one-currency-monitor';
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = 'X';
    closeButton.addEventListener('click', () => oneCurrencyMonitor.remove());
    oneCurrencyMonitor.appendChild(closeButton);
    renderCurrencyList([currency], oneCurrencyMonitor);
    document.body.appendChild(oneCurrencyMonitor);
    mainInput.value = '';
}
/* ───────────────────────────────────────────────
   Utility
─────────────────────────────────────────────── */
/**
 * Clears all content from the main pages-monitor area
 */
function clearPagesFromMonitor() {
    pagesMonitor.innerHTML = '';
}
/**
 * On window load:
 * 1. Fetches full currency list from CoinGecko via manager
 * 2. Renders the main list page (renderPage2)
 */
window.addEventListener('load', async () => {
    await manager.getCurrencyList();
    renderPage2();
});
//# sourceMappingURL=main.js.map