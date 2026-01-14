import {Image} from "./image.model.js";

export class Currency {
    constructor(
      public id: string,
      public symbol: string,
      public name: string,
      public isOn: boolean = false,
  //  public image: Image = new Image('', '', ''),
      public image: string | { thumb: string; small: string; large: string } = '',
      public priceUSD: string = '',
      public priceEUR: string = '',
      public priceILS: string = '',
      public timeStamp: number = 0,
    ) {}
}