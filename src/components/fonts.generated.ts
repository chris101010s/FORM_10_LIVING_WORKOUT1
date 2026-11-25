declare const require: (path:string)=>number;
export const bundledFonts:Record<string,number>={FormDisplay:require('../../assets/fonts/FormDisplay.ttf'),FormText:require('../../assets/fonts/FormText.ttf'),FormMono:require('../../assets/fonts/FormMono.ttf'),FormHand:require('../../assets/fonts/FormHand.ttf')};
