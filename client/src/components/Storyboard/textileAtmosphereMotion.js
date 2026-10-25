const base='/assets/threadlabs-cinematic/';
const legacy={
 '01_fabric_valley_hero':'01-textile-landscape','04_floating_fabric_ribbons':'02-floating-silk',
 '02_interwoven_silk_landscape':'11-flowing-threads','08_unfurling_silk_transition':'08-fabric-architecture',
 '03_embroidered_ivory_folds':'04-embroidered-fabric','09_macro_fabric_weave':'09-textile-macro',
 '07_woven_textile_orb':'03-woven-orb','06_botanical_textile_closeup':'04-embroidered-fabric',
 '11_artisan_thread_spools':'07-artisan-materials','10_tailoring_mannequin':'06-tailoring-mannequin',
 '05_sunset_fabric_horizon':'12-textile-horizon','12_woven_valley_cta':'12-textile-horizon'
};
export function textileImage(name){return `${base}${legacy[name]||name}.webp`;}
const clamp=n=>Math.max(0,Math.min(1,n));
function layer(element,amount,x,y){
 const visible=clamp(amount);
 const mask=element.querySelector('.textile-scene-mask');
 if(mask){const y=1.12-visible*1.45;mask.setAttribute('d',`M0,${y} C.2,${y-.15} .42,${y+.12} .65,${y-.05} S.9,${y-.2} 1,${y-.08} L1,1 L0,1Z`);}

 element.style.transform=`translate3d(${x}px,${y}px,0) rotate(${x*.035}deg)`;
 element.style.visibility=visible>0?'visible':'hidden';
}
export function updateTextileAtmosphere(root,p){
 const valley=root.querySelector('.textile-world-valley');
 const reveal=(p<1?.2+p*.2:p<3?.4-(p-1)*.045:.31)*(1-clamp((p-5)/.8)*.7);
 const top=(1-reveal)*100;
 valley.style.setProperty('--landscape-edge',`${top-8}%`);
 valley.style.clipPath='none';
 valley.firstElementChild.style.transform=`translateY(${p*-3}px) scale(${1+p*.006})`;
 layer(root.querySelector('.textile-world-origin'),Math.max(0,1-Math.abs(p-.6)/1.5),0,30-p*20);
 layer(root.querySelector('.textile-world-ribbons'),Math.min(clamp((p-1)/.8),clamp((4-p)/.6)),(p-2)*-25,(p-2)*-22);
 layer(root.querySelector('.textile-world-continuation'),Math.min(clamp((p-2)/.7),clamp((4.1-p)/.65)),(p-2.5)*24,(p-2.5)*-20);
 layer(root.querySelector('.textile-world-embroidery'),Math.min(clamp((p-3.45)/.6),clamp((5.5-p)/.5)),(p-4.4)*15,(p-4.4)*-12);
 layer(root.querySelector('.textile-world-unfurl'),clamp((p-5.15)/.6),(p-5)*-30,(p-5)*-40);
}
