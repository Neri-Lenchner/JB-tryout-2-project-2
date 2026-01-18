declare var CanvasJS: any;

import { manager } from './manager.js';
import {Currency} from "./currency.model.js";

/**
 * DOM references and event listeners setup
 */
const pagesMonitor: HTMLElement | null = document.getElementById('pages-monitor');

/**
 * Main scrollable container reference (used for initial scroll position)
 */
const container = document.getElementById('scroll-container') as HTMLElement;

/**
 * Navigation and action buttons
 */
const searchButton = document.querySelector('#search-button') as HTMLButtonElement;
const aboutButton = document.querySelector('#about-button') as HTMLButtonElement;
const homeButton = document.querySelector('#home-button') as HTMLButtonElement;
const liveReportsButton = document.querySelector('#live-reports-button') as HTMLButtonElement;

/**
 * Main search input field
 */
const mainInput: HTMLInputElement | null = document.querySelector('#main-input') as HTMLInputElement;

/**
 * CryptoCompare API key (used for live price fetching in charts)
 */
const myApiKey: string ='785e25aa48363b73d265706d01aaf5b730d0f78a58578a8ab52f211ae73e2293';

/**
 * Enter key in main input triggers search
 */
mainInput.addEventListener('keydown', (event: KeyboardEvent): void => {
  if(event.key === 'Enter') {
    search();
  }
})

/**
 * Initial scroll position adjustment after DOM is ready
 */
setTimeout((): void => {
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
homeButton.onclick = (): void => {
  if (document.querySelector('#chartContainer')) {
    stopCryptoChart();
  }
  clearPagesFromMonitor();
  if (manager.currencyList.length > 100) {
    manager.show();
    setTimeout((): void => {
      renderPage2();
      manager.hide();
    }, 600);
  } else {
    renderPage2();
  }
};

/**
 * Live Reports button: stops any running chart, clears monitor,
 * builds chart container, and starts live price chart for up to 5 selected currencies
 */
liveReportsButton.onclick = (): void => {
  if (selectedCurrencies.length === 0) {
    alert('Please select at list one currency');
    return;
  }
  setTimeout(manager.hide, 2000);
  manager.show();
  stopCryptoChart();
  clearPagesFromMonitor();

  const symbols: string[] = selectedCurrencies.map(c => c.symbol.toUpperCase());

  const fiveSymbols: [string, string, string, string, string] = [
    symbols[0] || "",
    symbols[1] || "",
    symbols[2] || "",
    symbols[3] || "",
    symbols[4] || ""
  ];

  const chartDiv: HTMLDivElement = document.createElement('div');
  chartDiv.id = "chartContainer";
  chartDiv.className = "chart-container";

  pagesMonitor?.appendChild(chartDiv);

  startCryptoChart(fiveSymbols[0], fiveSymbols[1], fiveSymbols[2], fiveSymbols[3], fiveSymbols[4], myApiKey );
};

/**
 * Search button: stops chart if active, triggers search for a single currency symbol
 */
searchButton.onclick = (): void => {
  if (document.querySelector('#chartContainer')) {
    stopCryptoChart();
  }
  search();
};

/**
 * About button: stops chart if active, clears monitor, renders personal about page (page 3)
 */
aboutButton.onclick = (): void => {
  if (document.querySelector('#chartContainer')) {
    stopCryptoChart();
  }
  clearPagesFromMonitor();
  renderPage3();
}

/* ───────────────────────────────────────────────
   Global state for selected currencies & limit handling
─────────────────────────────────────────────── */

/**
 * Array of currently selected currencies for live reporting (max 5)
 */
const selectedCurrencies: Currency[] = [];

/**
 * Temporary reference to a 6th currency the user is trying to select
 * (triggers limit popup / selection manager)
 */
let pendingSixth: Currency | null = null;

/* ───────────────────────────────────────────────
   Page rendering functions
─────────────────────────────────────────────── */

/**
 * Renders the main currency list page (top 99 coins from manager)
 * Clears monitor and displays cards for selection
 */
function renderPage2(): void{
  const listContainer:HTMLDivElement = document.createElement('div');
  listContainer.className = 'pages-monitor';
  pagesMonitor?.appendChild(listContainer);
  const currencyList: Currency[] = manager.currencyList;
  renderCurrencyList(currencyList, listContainer);
}

/**
 * Renders the "About Me" static page with text and image
 * Clears monitor first, then builds layout
 */
function renderPage3(): void {
  clearPagesFromMonitor();

  const container: HTMLDivElement = document.createElement('div');
  container.classList.add('page-3-container');

  const title: HTMLHeadingElement = document.createElement('h1');
  title.className = 'about-headline';
  title.textContent = 'About-Me';

  const text: HTMLParagraphElement = document.createElement('p');
  text.className = 'about';
  text.innerHTML = `I am a young Fullstack developer who intends to integrate all the rich life experience he has accumulated, over the thousand years that have passed him, into the amazing humble art of web development.<br>
Born in 1977 and having spent most of my life creating music, I see web development as a natural continuation of my artistic journey.<br>
 Both fields require creativity, structure, rhythm, and emotional expression just in different forms.<br>
With a strong background in composition and sound design, I approach code the same way I approach music: building harmony between logic and creativity, crafting experiences that are both functional and expressive.<br>
 This new path continues to inspire me, and I find the world of web development truly mind-blowing.`;

  const textWrapper: HTMLDivElement = document.createElement('div');
  textWrapper.className = 'about-wrapper';
  textWrapper.appendChild(text);
  const img: HTMLImageElement = document.createElement('img');
  img.className = 'my-own-image';
  img.src = 'me.jpg';

  const imgWrapper: HTMLDivElement = document.createElement('div');
  imgWrapper.className = 'img-wrapper';
  const midSectionAbout: HTMLDivElement = document.createElement('div');
  midSectionAbout.className = 'mid-section-about';
  const page3Container: HTMLDivElement = document.createElement('div');
  page3Container.className = 'page-3-container';
  imgWrapper.appendChild(img);
  midSectionAbout.append(textWrapper, imgWrapper);

  page3Container.append(title, midSectionAbout);

  pagesMonitor?.appendChild(page3Container);
}

let chart: any; // that fucker comes from canvas js //
let updateIntervalId: number | null = null;
const maxPoints: number = 20;

/* ───────────────────────────────────────────────
   Chart axis formatters
─────────────────────────────────────────────── */

/**
 * Formats Y-axis values with K/M/B suffixes and $ prefix
 * @param e - CanvasJS event object containing the value
 * @returns Formatted string like "$1.23M"
 */
function addSymbols(e: { value: number }): string {
  const suffixes: string[] = ["", "K", "M", "B"];
  let order: number = Math.max(Math.floor(Math.log(Math.abs(e.value)) / Math.log(1000)), 0);
  if (order > suffixes.length - 1) order = suffixes.length - 1;
  const formattedValue: number = CanvasJS.formatNumber(e.value / Math.pow(1000, order));
  return "$" + formattedValue + suffixes[order];
}

/**
 * Formats X-axis time labels as HH:mm:ss
 * @param e - CanvasJS event object containing the Date
 * @returns String like "14:35:22"
 */
function formatTimeLabel(e: { value: Date }): string {
  const h: string = String(e.value.getHours()).padStart(2, "0");
  const m: string = String(e.value.getMinutes()).padStart(2, "0");
  const s: string = String(e.value.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * Starts live updating line chart for up to 5 cryptocurrencies using CanvasJS
 * Fetches prices every 2 seconds via CryptoCompare, keeps only last 20 points
 * @param currency1.currency5 - Symbol strings (e.g. "BTC", "ETH")
 * @param apiKey - Optional CryptoCompare API key
 */
// I needed help (maybe a lot of it) on that one, with understanding how the CanvasJS.Chart works, and also needed help in-
// the calculations needed here, so I used grok and gpt for that.
// eventually I used only canvasJS without jQuery because it made it more understandable for me-
// and I could manipulate the graph more easily :
function startCryptoChart(
    currency1: string,
    currency2: string,
    currency3: string,
    currency4: string,
    currency5: string,
    apiKey?: string
): void {
  const coins: string[] = [currency1, currency2, currency3, currency4, currency5];
  const colors: string[] = ["cyan", "lime", "blue", "gold", "red"];

  const dataSeries: any[] = coins.map((coin: string, i: number) => ({
    type: "spline" as const,
    showInLegend: true,
    name: coin,
    color: colors[i],
    lineThickness: 3,
    markerSize: 8,
    dataPoints: [] as { x: Date; y: number }[]
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

  updateIntervalId = setInterval(async (): Promise<void> => {
    try {


      const data = await manager.getFiveCurrencies(coins, apiKey);
      if (!data) return;
      const now = new Date();

      coins.forEach((coin: string, i: number): void => {
        if (coin && data[coin]?.USD !== undefined) {
          dataSeries[i].dataPoints.push({ x: now, y: data[coin].USD });

          if (dataSeries[i].dataPoints.length > maxPoints) {
            dataSeries[i].dataPoints.shift();
          }
        }
      });
      chart.render();
    } catch (err) {
      console.error("Error fetching crypto prices:", err);
    }
  }, 2000);
}

/**
 * Stops the live chart update interval if running
 */
function stopCryptoChart(): void {
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
function createCollapserContainer(currency: Currency | null): string {
  const imgSrc: string = (currency?.image as any).large || '₵ryptonit€';

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
function renderCurrencyList(arr: Currency[], monitor: HTMLElement | null): void {

  arr.forEach(currency => {
    const card:HTMLElement = document.createElement('div');
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
    const cardContainer: HTMLElement = document.createElement('div');
    cardContainer.className = 'card-container';
    cardContainer.appendChild(card);
    monitor?.appendChild(cardContainer);

    const toggle: HTMLButtonElement | null = cardContainer.querySelector('.toggle-btn');
    const moreInfoBtn: HTMLButtonElement | null = cardContainer.querySelector('.more-info-btn');

    toggle?.classList.toggle('on', currency.isOn);

    ///--More-Info_button-fuckin-functionality-blat--//-mui-importanto-////

    moreInfoBtn?.addEventListener('click', async (): Promise<void> => {

      let collapserContainer: HTMLDivElement | null = cardContainer.querySelector('.collapser-container');

      if (!collapserContainer) {
        collapserContainer = document.createElement('div');
        collapserContainer.className = 'collapser-container';
        cardContainer.appendChild(collapserContainer);
      } else {
        collapserContainer.style.display = collapserContainer.style.display === 'none' ? 'block' : 'none';
        return;
      }

      const twoMinutes = 120000;
      let currencyData: Currency | null = null;

      const stored: string | null = localStorage.getItem(`one-currency[${currency.id}]`);
      if (stored) {
        const parsed: Currency = JSON.parse(stored);
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

    // I have left a second version of this function commented out:

    //OPTION_1: pending sixth is toggled on if user toggled off one of the currencies in the fixed window ///////////

    toggle?.addEventListener('click', () => {

      // If trying to add a 6th
      if (!currency.isOn && selectedCurrencies.length === 5) {
        pendingSixth = currency;
        renderSelectedCards();   // opens fixed window
        return;
      }

      currency.isOn = !currency.isOn;

      if (currency.isOn) {
        selectedCurrencies.push(currency);
      } else {
        const index = selectedCurrencies.indexOf(currency);
        if (index !== -1) selectedCurrencies.splice(index, 1);

        // If user removed one WHILE a 6th is pending
        if (pendingSixth) {
          pendingSixth.isOn = true;
          selectedCurrencies.push(pendingSixth);

          document
              .querySelectorAll(`.toggle-btn[data-currency-id="${pendingSixth.id}"]`)
              .forEach(btn => btn.classList.add('on'));

          pendingSixth = null;   // clear pending
        }
      }

      document
          .querySelectorAll(`.toggle-btn[data-currency-id="${currency.id}"]`)
          .forEach(btn => btn.classList.toggle('on', currency.isOn));

      renderSelectedCards();
    });

    ///////OPTION_2: pending sixth do not toggled on even if user toggled off one of the toggles in the fixed window////
    /*
    toggle?.addEventListener('click', (): void => {

      if (!currency.isOn && selectedCurrencies.length === 5) {
        pendingSixth = currency;
        renderSelectedCards();
        return;
      }

      currency.isOn = !currency.isOn;

      if (currency.isOn) {
        if (!selectedCurrencies.includes(currency)) selectedCurrencies.push(currency);
      } else {
        const index: number = selectedCurrencies.indexOf(currency);
        if (index !== -1) selectedCurrencies.splice(index, 1);
        pendingSixth = null;
      }
      const singleCurrencyToggleButtons: NodeListOf<HTMLButtonElement> = document.querySelectorAll(`.toggle-btn[data-currency-id="${currency.id}"]`);

      singleCurrencyToggleButtons.forEach(btn => {
        btn.classList.toggle('on', currency.isOn);
      });
      renderSelectedCards();
    });
    */
  });
}

// I have had some issues with the one above, but eventually decided that this is the best way to display that window, and
// it's functionality.

/**
 * Shows a popup when user tries to select a 6th currency
 * renders the 5 selected ones + Cancel button
 */
function renderSelectedCards(): void {
  const existingFixed: HTMLDivElement | null = document.querySelector('.fixed-container');
  if (existingFixed) existingFixed.remove();

  if (selectedCurrencies.length === 5 && pendingSixth) {

    const fixedContainer: HTMLDivElement = document.createElement('div');
    fixedContainer.className = 'fixed-container';

    const headline: HTMLDivElement = document.createElement('div');
    headline.className = 'headline';
    headline.innerHTML = '<div>You can only use 5 currencies</div>';

    const closeButton:HTMLButtonElement = document.createElement('button');
    closeButton.className = 'close-button-cancel';
    closeButton.innerHTML = 'Cancel';
    closeButton.addEventListener('click', (): void => {
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
async function search(): Promise<void> {
  document.querySelector('.one-currency-monitor')?.remove();

  const inputSymbol: string | undefined = mainInput?.value.trim().toUpperCase();
  if (!inputSymbol) return;

  const currency: Currency | undefined = manager.currencyList.find(cur =>
      cur.symbol.toUpperCase() === inputSymbol
  );

  if (!currency) {
    const oneCurrencyMonitor: HTMLDivElement = document.createElement('div');
    oneCurrencyMonitor.className = 'one-currency-monitor';
    const closeButton: HTMLButtonElement = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = 'X';
    closeButton.addEventListener('click', (): void => oneCurrencyMonitor.remove());
    oneCurrencyMonitor.appendChild(closeButton);

    const message: HTMLDivElement = document.createElement('div');
    message.className = 'message-container';
    message.innerText = 'That currency does not exist';
    oneCurrencyMonitor.appendChild(message);
    document.body.appendChild(oneCurrencyMonitor);
    mainInput!.value = '';
    return;
  }

  const oneCurrencyMonitor: HTMLDivElement = document.createElement('div');
  oneCurrencyMonitor.className = 'one-currency-monitor';

  const closeButton: HTMLButtonElement = document.createElement('button');
  closeButton.className = 'close-button';
  closeButton.innerHTML = 'X';
  closeButton.addEventListener('click', (): void => oneCurrencyMonitor.remove());
  oneCurrencyMonitor.appendChild(closeButton);

  renderCurrencyList([currency], oneCurrencyMonitor);
  document.body.appendChild(oneCurrencyMonitor);

  mainInput!.value = '';
}

/* ───────────────────────────────────────────────
   Utility
─────────────────────────────────────────────── */

/**
 * Clears all content from the main pages-monitor area
 */
function clearPagesFromMonitor(): void {
  pagesMonitor!.innerHTML = '';
}

/**
 * On window load:
 * 1. Fetches full currency list from CoinGecko via manager
 * 2. Renders the main list page (renderPage2)
 */
window.addEventListener('load', async (): Promise<void> => {
  await manager.getCurrencyList();
  renderPage2();
});