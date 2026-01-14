import {Currency} from './currency.model.js';

class Manager {
    constructor(
      public currencyList: Currency[] = []
    ) {}

    public async getCurrencyList(): Promise<void> {
        const shitCoinsUrl = 'https://api.coingecko.com/api/v3/coins/list';
        const goodCoinsUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1';
      this.show();
      const response: Response = await fetch(goodCoinsUrl);
        if (response.ok) {
            const data:[] = await response.json();
            this.hide();
            this.currencyList = data.map(
              (currencY: {
                  id: string,
                  symbol: string,
                  name: string,
                  isOn: boolean,
                  image: string,
                  priceUSD: string,
                  priceEUR: string,
                  priceILS: string
                  timeStamp: string,
              }): Currency =>
                new Currency(
                  currencY.id,
                  currencY.symbol,
                  currencY.name,
                  currencY.isOn,
                  currencY.image,
                  currencY.priceUSD,
                  currencY.priceEUR,
                  currencY.priceILS,
                  Date.now()
                  )
            );
        } else {
          this.hide();
            this.currencyList = [];
            return;
        }
    }

    public async getOneCurrency(id: string): Promise<Currency | null> {

        const currency: Currency | undefined = this.currencyList.find(currency => currency.id === id);
        this.show();
        const response: Response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${id}`
        );
        if (!response.ok) {
            return null;
            this.hide();
        }
      this.hide();
        const data = await response.json();
        const newCurrency = new Currency(
          data.id,
          data.symbol,
          data.name,
          false,
          data.image,
          data.market_data.current_price.usd,
          data.market_data.current_price.eur,
          data.market_data.current_price.ils,
          data.timeStamp
        );
        return newCurrency;
    }

    async getFiveCurrencies(
        coins: string[],
        apiKey?: string
    ): Promise<Record<string, { USD: number }> | undefined> {

        const url = apiKey
            ? `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins.join(',')}&tsyms=USD&api_key=${apiKey}`
            : `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins.join(',')}&tsyms=USD`;

        const res = await fetch(url);

        if (!res.ok) {
            console.error("Failed to fetch prices:", res.status, res.statusText);
            return undefined;
        }

        const data: Record<string, { USD: number }> = await res.json();
        return data;
    }

    public saveDataLocally(oneCurrency: Currency | any): void {
      localStorage.setItem(`one-currency${oneCurrency?.id}`, JSON.stringify(oneCurrency));
    }


    //////---Progress-Bar-Functions-for-crying-out-loud!!--////

    public show(): void {
      if (document.querySelector('.progress-bar-container')) return;

      const container:HTMLDivElement = document.createElement('div');
      container.className = 'progress-bar-container';

      container.innerHTML = `
      <div class="currency-loader">
        <div class="center-currency">$</div>
        <div class="orbit orbit1" data-currency="€"></div>
        <div class="orbit orbit2" data-currency="¥"></div>
        <div class="orbit orbit3" data-currency="£"></div>
      </div>
    `;
      document.body.appendChild(container);
    }

    public hide() {
      document.querySelector('.progress-bar-container')?.remove();
     }
    ////////////---End-Of-Functions-Thank-God!--////////////
  }

export const manager: Manager = new Manager();
