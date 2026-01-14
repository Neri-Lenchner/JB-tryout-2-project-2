import { Currency } from './currency.model.js';
declare class Manager {
    currencyList: Currency[];
    constructor(currencyList?: Currency[]);
    getCurrencyList(): Promise<void>;
    getOneCurrency(id: string): Promise<Currency | null>;
    getFiveCurrencies(coins: string[], apiKey?: string): Promise<Record<string, {
        USD: number;
    }> | undefined>;
    saveDataLocally(oneCurrency: Currency | any): void;
    show(): void;
    hide(): void;
}
export declare const manager: Manager;
export {};
//# sourceMappingURL=manager.d.ts.map