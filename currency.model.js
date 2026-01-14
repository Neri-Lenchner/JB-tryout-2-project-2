import { Image } from "./image.model.js";
export class Currency {
    id;
    symbol;
    name;
    isOn;
    image;
    priceUSD;
    priceEUR;
    priceILS;
    timeStamp;
    constructor(id, symbol, name, isOn = false, 
    //  public image: Image = new Image('', '', ''),
    image = '', priceUSD = '', priceEUR = '', priceILS = '', timeStamp = 0) {
        this.id = id;
        this.symbol = symbol;
        this.name = name;
        this.isOn = isOn;
        this.image = image;
        this.priceUSD = priceUSD;
        this.priceEUR = priceEUR;
        this.priceILS = priceILS;
        this.timeStamp = timeStamp;
    }
}
//# sourceMappingURL=currency.model.js.map