/* Fictional, discrete educational model. No production workbook data. */
const EXAMPLE = {
  ores: [
    {name:'高品位粉矿 A',price:920,fe:65,sio2:3.5,cao:0.2,moisture:7,max:70},
    {name:'均衡粉矿 B',price:790,fe:61,sio2:5.5,cao:0.3,moisture:8,max:80},
    {name:'经济粉矿 C',price:660,fe:57,sio2:8,cao:0.4,moisture:10,max:60},
    {name:'低硅精矿 D',price:1050,fe:68,sio2:1.8,cao:0.2,moisture:6,max:50}
  ],
  minFe:59, maxSilica:5.5, minBasicity:1.1, maxBasicity:1.7,
  maxOres:3, cokePrice:2100, coalPrice:1000, processCost:180
};
function validate(p) {
  const finite=(v,l,h)=>typeof v==='number'&&Number.isFinite(v)&&v>=l&&v<=h;
  if(!p||!Array.isArray(p.ores)||p.ores.length!==4) throw Error('请提供 4 种矿粉。');
  const names=new Set();
  for(const o of p.ores){
    if(typeof o.name!=='string'||!o.name.trim()||o.name.length>60||names.has(o.name))throw Error('矿种名称须非空、唯一且不超过 60 字。');
    names.add(o.name);
    for(const [k,l,h] of [['price',1,10000],['fe',1,75],['sio2',0.1,40],['cao',0,30],['moisture',0,40],['max',0,100]])
      if(!finite(o[k],l,h))throw Error(`${o.name} 的 ${k} 超出允许范围 ${l}–${h}。`);
  }
  for(const [k,l,h] of [['minFe',40,75],['maxSilica',0.1,20],['minBasicity',0,5],['maxBasicity',0,5],['maxOres',1,4],['cokePrice',1,10000],['coalPrice',1,10000],['processCost',0,5000]])
    if(!finite(p[k],l,h))throw Error(`参数 ${k} 超出允许范围。`);
  if(!Number.isInteger(p.maxOres))throw Error('矿仓数量必须是整数。');
  if(p.minBasicity>p.maxBasicity)throw Error('碱度下限不能大于上限。');
  return p;
}
function product(p,ratios){
  const avg=k=>ratios.reduce((s,r,i)=>s+r*p.ores[i][k]/100,0);
  // 92% dry ore + 6% flux + 2% fuel, 96% product yield.
  return {ratios,fe:.92*avg('fe')/.96,sio2:(.92*avg('sio2')+.06*2+.02*12)/.96,
    cao:(.92*avg('cao')+.06*50)/.96,
    cost:(.92*ratios.reduce((s,r,i)=>s+r*p.ores[i].price/(1-p.ores[i].moisture/100)/100,0)+.06*350+.02*1200+100)/.96};
}
function evaluate(p,sinter,pelletHigh,burden){
  const pellet={fe:65+3*pelletHigh,sio2:3.5-2*pelletHigh,cao:.5,cost:1100+180*pelletHigh};
  const lump={fe:63,sio2:4.5,cao:.3,cost:960};
  const mix=k=>(burden[0]*sinter[k]+burden[1]*pellet[k]+burden[2]*lump[k])/100;
  const fe=mix('fe'),sio2=mix('sio2'),cao=mix('cao');
  const oreTon=.945/(fe/100*.98);
  const cokeKg=340+Math.max(0,62-fe)*8+sio2*3;
  const coalKg=150;
  // Additional BF flux: 55% CaO, 2% SiO2; target midpoint basicity.
  const target=(p.minBasicity+p.maxBasicity)/2;
  const fluxTon=Math.max(0,oreTon*(target*sio2-cao)/100/(.55-target*.02));
  const basicity=(oreTon*cao/100+fluxTon*.55)/(oreTon*sio2/100+fluxTon*.02);
  const costs={ore:oreTon*mix('cost'),coke:cokeKg/1000*p.cokePrice,coal:coalKg/1000*p.coalPrice,flux:fluxTon*350,process:p.processCost};
  const checks=[['入炉品位 / %',fe,p.minFe,75],['入炉 SiO₂ / %',sio2,0,p.maxSilica],['炉渣碱度 CaO/SiO₂',basicity,p.minBasicity,p.maxBasicity],['高炉熔剂 / t/t铁',fluxTon,0,.25]];
  const feasible=checks.every(([,v,l,h])=>Number.isFinite(v)&&v>=l-1e-8&&v<=h+1e-8);
  return {sinter,pelletHigh,burden,fe,sio2,basicity,oreTon,cokeKg,coalKg,fluxTon,costs,checks,feasible,cost:Object.values(costs).reduce((a,b)=>a+b,0)};
}
function solve(raw){
  const p=validate(raw),start=Date.now(); let best=null,count=0,feasibleCount=0;
  for(let a=0;a<=100;a+=5)for(let b=0;b<=100-a;b+=5)for(let c=0;c<=100-a-b;c+=5){
    const r=[a,b,c,100-a-b-c];
    if(r.filter(v=>v>0).length>p.maxOres||r.some((v,i)=>v>p.ores[i].max+1e-8))continue;
    const s=product(p,r);
    for(const ph of [0,.25,.5,.75,1])for(let bs=50;bs<=80;bs+=5)for(let bp=10;bp<=40;bp+=5){
      const bl=100-bs-bp;if(bl<0||bl>20)continue;
      const x=evaluate(p,s,ph,[bs,bp,bl]);count++;
      if(x.feasible){feasibleCount++;if(!best||x.cost<best.cost)best=x;}
    }
  }
  const baseline=evaluate(p,product(p,[40,40,20,0]),0,[60,30,10]);
  baseline.checks.push(['矿种数量 / 种',3,1,p.maxOres],...p.ores.map((o,i)=>[o.name+' 上限 / %',baseline.sinter.ratios[i],0,o.max]));
  baseline.feasible=baseline.feasible&&baseline.checks.every(([,v,l,h])=>v>=l-1e-8&&v<=h+1e-8);
  return {mode:'browser-discrete-demo',input:p,best,baseline,count,feasibleCount,runtime:(Date.now()-start)/1000,step:5};
}
if(typeof self!=='undefined'&&typeof document==='undefined')self.onmessage=e=>{try{self.postMessage({result:solve(e.data)});}catch(e){self.postMessage({error:e.message});}};
if(typeof module!=='undefined')module.exports={solve,validate,EXAMPLE};
