/* Solar Studio: finite-horizon beam search over aggregate equipment cohorts. */
(function(root){
  'use strict';
  const example=()=>({days:21,beam:80,crystalMachines:4,sliceMachines:4,initialCrystal:1,initialSlice:1,crystalCapacity:140,sliceCapacity:120,crystalRamp:2,sliceRamp:2,minRun:4,startup:70,crystallization:90,finished:81,rawStock:500,stock:150,safety:200,orders:[{id:'PV-01',quantity:1200,due:5},{id:'PV-02',quantity:1600,due:10},{id:'PV-03',quantity:1800,due:15},{id:'PV-04',quantity:2000,due:21}]});
  function validate(c){
    const int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b;
    if(!int(c.days,3,31)||!int(c.beam,20,120)||!int(c.minRun,1,c.days))throw Error('计划天数为 3–31，搜索宽度为 20–120，最短运行天数不得超过计划期。');
    for(const s of ['Crystal','Slice']){
      const k=s.toLowerCase();
      if(!int(c[k+'Machines'],1,6)||!int(c['initial'+s],0,c[k+'Machines'])||!int(c[k+'Ramp'],1,6)||!int(c[k+'Capacity'],1,10000))throw Error('每道工序设备为 1–6 台，初始开机不得超过设备总数，日启停上限为 1–6，单机日产能为 1–10000。');
    }
    for(const k of ['startup','crystallization','finished'])if(!Number.isFinite(c[k])||c[k]<=0||c[k]>100)throw Error('产能比例与工艺比率须大于 0 且不超过 100%。');
    if(c.finished>c.crystallization)throw Error('成品率不能高于成晶率，综合良率须不超过 100%。');
    for(const k of ['rawStock','stock','safety'])if(!int(c[k],0,1000000))throw Error('库存须为 0–1000000 的整数。');
    if(!Array.isArray(c.orders)||c.orders.length<1||c.orders.length>30)throw Error('请输入 1–30 笔订单。');
    const ids=new Set();
    for(const o of c.orders){if(typeof o.id!=='string'||!o.id.trim()||o.id.length>40||ids.has(o.id)||!int(o.quantity,1,1000000)||!int(o.due,1,c.days))throw Error('订单编号须唯一且为 1–40 字符；数量为正整数；交期须在计划期内。');ids.add(o.id);}
    return c;
  }
  function choices(ages,total,ramp,minRun,day,days){
    const locked=ages.filter(a=>a<minRun), mature=ages.length-locked.length, out=[];
    for(let n=Math.max(locked.length,ages.length-ramp);n<=Math.min(total,ages.length+ramp);n++){
      const starts=Math.max(0,n-ages.length);
      if(starts&&day+minRun-1>days)continue;
      out.push({n,starts,stops:Math.max(0,ages.length-n),ages:[...locked.map(a=>a+1),...Array(Math.min(mature,n-locked.length)).fill(minRun),...Array(starts).fill(1)].sort((a,b)=>a-b)});
    }
    return out;
  }
  function solve(config,progress=()=>{}){
    const c=validate(config), yieldRate=c.finished/c.crystallization, total=c.orders.reduce((s,o)=>s+o.quantity,0);
    const orderIndex=c.orders.map((_,i)=>i).sort((a,b)=>c.orders[a].due-c.orders[b].due||a-b);
    let beam=[{ca:Array(c.initialCrystal).fill(c.minRun),sa:Array(c.initialSlice).fill(c.minRun),raw:c.rawStock,stock:c.stock,remaining:c.orders.map(o=>o.quantity),late:0,short:0,holding:0,switches:0,production:0,path:[]}];
    for(let day=1;day<=c.days;day++){
      const candidates=new Map();
      for(const state of beam){
        const cc=choices(state.ca,c.crystalMachines,c.crystalRamp,c.minRun,day,c.days),sc=choices(state.sa,c.sliceMachines,c.sliceRamp,c.minRun,day,c.days);
        for(const a of cc)for(const b of sc){
          const crystal=a.n*c.crystalCapacity;
          const sliced=(b.n-b.starts+b.starts*c.startup/100)*c.sliceCapacity;
          // Today's crystal output becomes available to slicing tomorrow.
          if(sliced>state.raw+1e-7)continue;
          const produced=sliced*yieldRate, remaining=state.remaining.slice(), deliveries=[];
          let stock=state.stock+produced;
          for(const i of orderIndex){if(c.orders[i].due>day)continue;const q=Math.min(stock,remaining[i]);if(q>1e-7){remaining[i]-=q;stock-=q;deliveries.push({order:i,quantity:q});}}
          const raw=Math.max(0,state.raw-sliced+crystal),backlog=remaining.reduce((s,q,i)=>s+(c.orders[i].due<=day?q:0),0);
          // Compare inventory in finished-equivalent units: yield losses must not
          // reward unnecessary slicing merely for reducing physical stock.
          const short=state.short+Math.max(0,c.safety-stock),late=state.late+backlog,holding=state.holding+stock+raw*yieldRate;
          const switches=state.switches+a.starts+a.stops+b.starts+b.stops, production=state.production+crystal+produced;
          const outstanding=remaining.reduce((s,q)=>s+q,0);
          const next={ca:a.ages,sa:b.ages,raw,stock,remaining,late,short,holding,switches,production,path:[...state.path,{day,crystalMachines:a.n,sliceMachines:b.n,crystalStarts:a.starts,crystalStops:a.stops,sliceStarts:b.starts,sliceStops:b.stops,crystal,sliced,produced,raw,stock,backlog,safetyGap:Math.max(0,c.safety-stock),deliveries}]};
          // Anticipate cumulative deadlines using the currently active stages.
          // Without this look-ahead, cheap idle states can crowd out early starts.
          let cumulative=0,future=0;
          for(const i of orderIndex){
            cumulative+=remaining[i];const h=Math.max(0,c.orders[i].due-day);
            const potential=Math.min(raw*yieldRate+a.n*c.crystalCapacity*yieldRate*Math.max(0,h-1),b.n*c.sliceCapacity*yieldRate*h);
            future+=Math.max(0,cumulative-stock-potential);
          }
          next.rank=(day===c.days?outstanding*1000:future*10)+late*100+short*2+holding*.015+switches*3+production*.002;
          const key=[a.ages.join(','),b.ages.join(','),raw.toFixed(5),stock.toFixed(5),remaining.map(x=>x.toFixed(5)).join(',')].join('|');
          const prev=candidates.get(key);if(!prev||prev.rank>next.rank)candidates.set(key,next);
        }
      }
      beam=[...candidates.values()].sort((a,b)=>a.rank-b.rank).slice(0,c.beam);
      if(!beam.length)throw Error('未找到可行计划：初始切片设备的最短运行与原料库存可能冲突。请增加在制品库存或减少初始切片开机数。有限搜索也可能遗漏可行方案。');
      progress(day/c.days);
    }
    const best=beam[0];
    const orders=c.orders.map((o,i)=>{let onTime=0,delivered=0,last=null;for(const d of best.path)for(const x of d.deliveries)if(x.order===i){delivered+=x.quantity;if(d.day<=o.due)onTime+=x.quantity;last=d.day;}return {...o,delivered,onTime,remaining:best.remaining[i],completed:best.remaining[i]<1e-6?last:null};});
    return {config:c,method:'有限宽度束搜索启发式；非原 Pyomo 工业模型；不保证最优或可行性完备',daily:best.path,orders,summary:{total,onTime:orders.reduce((s,o)=>s+o.onTime,0)/total*100,fulfillment:(total-best.remaining.reduce((s,x)=>s+x,0))/total*100,backlog:best.remaining.reduce((s,x)=>s+x,0),switches:best.switches,stock:best.stock,raw:best.raw,safetyDays:best.path.filter(d=>d.safetyGap>1e-6).length,yieldRate,late:best.late}};
  }
  const api={example,validate,solve};if(typeof module!=='undefined')module.exports=api;else root.SolarEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
