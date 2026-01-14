declare var CanvasJS: any;

import { manager } from './manager.js';
import {Currency} from "./currency.model.js";

const pagesMonitor = document.getElementById('pages-monitor');

/////////////////////////////////////////-SCROLL TO LOAD CONTENT MOTHER FUCKER-//////////////////////////////

const container = document.getElementById('scroll-container') as HTMLElement;
const searchButton = document.querySelector('#search-button') as HTMLButtonElement;
const aboutButton = document.querySelector('#about-button') as HTMLButtonElement;
const homeButton = document.querySelector('#home-button') as HTMLButtonElement;
const liveReportsButton = document.querySelector('#live-reports-button') as HTMLButtonElement;

const mainInput: HTMLInputElement | null = document.querySelector('#main-input') as HTMLInputElement;

const myApiKey: string ='785e25aa48363b73d265706d01aaf5b730d0f78a58578a8ab52f211ae73e2293';
mainInput.addEventListener('keydown', (event: KeyboardEvent): void => {
  if(event.key === 'Enter') {
    search();
  }
})

setTimeout((): void => {
  container.scrollTop = 590;
}, 0);

///---Buttons Functionality blat mother fuckersssss---///

homeButton.onclick = (): void => {
  if (document.querySelector('#chartContainer')) {
    stopCryptoChart();
  }
  clearPagesFromMonitor();
  renderPage2();
};

liveReportsButton.onclick = (): void => {
  if (selectedCurrencies.length === 0) {
    return;
  }
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

searchButton.onclick = (): void => {
  if (document.querySelector('#chartContainer')) {
    stopCryptoChart();
  }
  search();
  // console.log(oneCurrencyArr);   // ← this line can probably be removed too later
};

aboutButton.onclick = (): void => {
  if (document.querySelector('#chartContainer')) {
    stopCryptoChart();
  }
  clearPagesFromMonitor();
  renderPage3();
}

//////////////////////////////////////////-END OF LOADING STUFF-/////////////////////////////////////////////

const selectedCurrencies: Currency[] = [];
let pendingSixth: Currency | null = null;

/*-------------------------------------RENDER-PAGE-2-MOTHER-FUCKER!!!!!----------------------------------*/

function renderPage2(): void{
  const listContainer:HTMLDivElement = document.createElement('div');
  listContainer.className = 'pages-monitor';
  pagesMonitor?.appendChild(listContainer);
  const currencyList: Currency[] = manager.currencyList.slice(0, 99);
  renderCurrencyList(currencyList, listContainer);
}

/*----------------------------------END-OF-renderPage2-Thank-God-----------------------------------------*/

/*--------------------------RENDER-PAGE-3-MOTHER-FUCKER!!!!!-----------------------------*/

function renderPage3(): void {
  clearPagesFromMonitor();

  const container: HTMLDivElement = document.createElement('div');
  container.classList.add('page-3-container');

  const title: HTMLHeadingElement = document.createElement('h1');
  title.className = 'about-headline';
  title.textContent = 'About-Me';

  // Stuff about me allegedly:
  const text: HTMLParagraphElement = document.createElement('p');
  text.className = 'about';
  text.textContent = 'I am a young web developer who intends to integrate all the rich life experience he has accumulated, over the thousand years that have passed him, into the amazing humble art of web development. Born in 1977 and been making music most of my life, I see web development as a direct continuation of my previous occupation and I find this new occupation mind-blowing';

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
/*----------------------------------END-OF-renderPage3-Thank-God-----------------------------------------*/


/*-------------------------------------RENDER-PAGE-4-MOTHER-FUCKER!!!!!----------------------------------*/
let chart: any; // that fucker comes from canvas js //
let updateIntervalId: number | null = null;
const maxPoints: number = 20;

// Y axis
function addSymbols(e: { value: number }): string {
  const suffixes: string[] = ["", "K", "M", "B"];
  let order: number = Math.max(Math.floor(Math.log(Math.abs(e.value)) / Math.log(1000)), 0);
  if (order > suffixes.length - 1) order = suffixes.length - 1;
  const formattedValue = CanvasJS.formatNumber(e.value / Math.pow(1000, order));
  return "$" + formattedValue + suffixes[order];
}

// X axis
function formatTimeLabel(e: { value: Date }): string {
  const h: string = String(e.value.getHours()).padStart(2, "0");
  const m: string = String(e.value.getMinutes()).padStart(2, "0");
  const s: string = String(e.value.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
// THE MAIN FUNCTION FOR THE FUCKIN' FRIKIN' CRYING OUT LOUD!!!!! :

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

function stopCryptoChart(): void {
  if (updateIntervalId !== null) {
    clearInterval(updateIntervalId);
    updateIntervalId = null;
  }
}

/*----------------------------------END-OF-renderPage4-Thank-God-----------------------------------------*/


function createCollapserContainer(currency: Currency | null): string {
  const imgSrc: string = (currency?.image as any).large || '₵ryptonit€';
  /// **********THAT: "(currency?.image as any)" I did not quite understand, but it is the only thing that works//
  return `
    <div class="collapser">
      <img class="images" src="${imgSrc}">
      <div>Currency Price USD: <span class="collapser-span">${currency?.priceUSD || 'priceUSD'}</span> $</div>
      <div>Currency Price EUR: <span class="collapser-span">${currency?.priceEUR || 'priceEUR'}</span> €</div>
      <div>Currency Price ILS: <span class="collapser-span">${currency?.priceILS || 'priceILS'}</span> ₪</div>
    </div>
  `;
}

//////////-----------------------------RENDERING_FUNCTIONS_MOTHER_FUCKER-----------------------------------//////

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

    //-----------------------------Card-Toggle-Button-Stuff-bla-bla-bla-----------------------------///

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
  });
}

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
    message.innerText = 'That currency does not exist in the currencies you have selected';
    oneCurrencyMonitor.appendChild(message);
    document.body.appendChild(oneCurrencyMonitor);
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

function clearPagesFromMonitor(): void {
  pagesMonitor!.innerHTML = '';
}

window.addEventListener('load', async (): Promise<void> => {
  await manager.getCurrencyList();
  renderPage2();
});