/** Plate decomposition per side; report any unachievable remainder rather than rounding up. */
export function platePlan(total:number,bar:number):{plates:number[];remainderKg:number}|null{
 if(!Number.isFinite(total)||!Number.isFinite(bar)||bar<0||total<bar||total>1000)return null;
 const plates:number[]=[];let remaining=(total-bar)/2;
 for(const plate of [25,20,15,10,5,2.5,1.25])while(remaining+1e-8>=plate){plates.push(plate);remaining-=plate;}
 return {plates,remainderKg:Math.round(Math.max(0,remaining)*2*10000)/10000};
}
export const restLeft=(until:number|null,now:number)=>until===null?0:Math.max(0,Math.ceil((until-now)/1000));
