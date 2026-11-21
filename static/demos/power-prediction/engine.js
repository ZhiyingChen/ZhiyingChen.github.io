/* Standalone educational subset of the monthly material / tap power model. */
(function (root) {
  'use strict';
  const powers = [560, 565, 570, 575, 580];
  const materials = [
    {id:'A', name:'标准材料 · 中档', cost:0.72, dist:[.12,.28,.38,.18,.04]},
    {id:'B', name:'高效材料 · 高档', cost:0.91, dist:[.02,.08,.25,.40,.25]},
    {id:'C', name:'经济材料 · 低档', cost:0.58, dist:[.35,.38,.20,.06,.01]}
  ];
  function validate(x) {
    for (const [k,lo,hi] of [['quantity',100,1000000],['maxMaterials',1,3],['downgrade',0,20],['shortageWeight',1,100],['costWeight',0,10]]) {
      if (!Number.isFinite(x[k]) || x[k]<lo || x[k]>hi || (['quantity','maxMaterials'].includes(k) && !Number.isInteger(x[k]))) throw Error('参数 '+k+' 超出允许范围。');
    }
    if (!Array.isArray(x.demand)||x.demand.length!==5||x.demand.some(v=>!Number.isFinite(v)||v<0)||Math.abs(x.demand.reduce((a,b)=>a+b,0)-100)>0.001) throw Error('五个功率档位的需求比例必须为非负数，且合计为 100%。');
    if (!Array.isArray(x.caps)||x.caps.length!==3||x.caps.some(v=>!Number.isFinite(v)||v<0||v>100)) throw Error('材料占比上限必须在 0–100% 之间。');
  }
  function evaluate(x,mix) {
    const supply=powers.map((_,p)=>materials.reduce((s,m,i)=>s+mix[i]*m.dist[p]*x.quantity,0));
    const remaining=supply.slice(), demand=x.demand.map(v=>v*x.quantity/100), fit=demand.map((v,p)=>Math.min(v,remaining[p]));
    fit.forEach((v,p)=>remaining[p]-=v);
    const down=Array(5).fill(0),flows=[];
    // Direct matching first, then high-to-low demand with nearest eligible surplus.
    for(let p=4;p>=0;p--) for(let q=p+1;q<5;q++) {
      if(powers[q]-powers[p]>x.downgrade) continue;
      const n=Math.min(remaining[q],Math.max(0,demand[p]-fit[p]-down[p]));
      if(n>1e-8){ remaining[q]-=n;down[p]+=n;flows.push({from:powers[q],to:powers[p],quantity:n}); }
    }
    const gap=demand.map((v,p)=>Math.max(0,v-fit[p]-down[p]));
    const shortage=gap.reduce((a,b)=>a+b,0),byproduct=remaining.reduce((a,b)=>a+b,0),downgraded=down.reduce((a,b)=>a+b,0);
    const cost=materials.reduce((s,m,i)=>s+mix[i]*m.cost*x.quantity,0);
    const loss=flows.reduce((s,f)=>s+(f.from-f.to)*f.quantity,0);
    return {mix,supply,demand,fit,down,gap,remaining,flows,shortage,byproduct,downgraded,cost,loss,score:x.shortageWeight*shortage+byproduct+loss/5*.1+x.costWeight*cost};
  }
  function solve(x) {
    validate(x);let best=null,count=0;
    for(let a=0;a<=20;a++)for(let b=0;b<=20-a;b++){
      const mix=[a/20,b/20,(20-a-b)/20];
      if(mix.filter(v=>v>0).length>x.maxMaterials||mix.some((v,i)=>v*100>x.caps[i]+1e-8))continue;
      const r=evaluate(x,mix);count++;
      if(!best||r.score<best.score-1e-8)best=r;
    }
    if(!best)throw Error('当前材料上限与材料种数无法组成 100% 配比。请提高上限或允许更多材料；搜索步长为 5%。');
    return {...best,candidates:count,input:JSON.parse(JSON.stringify(x)),powers,materials};
  }
  const api={powers,materials,solve,evaluate};
  if(typeof module!=='undefined')module.exports=api;else root.PowerEngine=api;
})(globalThis);
