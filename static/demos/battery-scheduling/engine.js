/* Battery Studio: bounded beam search, no runtime dependencies. */
(function (root) {
  'use strict';
  const example = () => ({ days: 14, lines: 2, capacity: 1000, minRun: 3,
    ramp: [30, 65, 85], changeLoss: 20, changeWeight: 300, beam: 160,
    orders: [
      {id:'ORD-01', model:'V3', quantity:2400, due:4, priority:2},
      {id:'ORD-02', model:'V4', quantity:1800, due:5, priority:3},
      {id:'ORD-03', model:'V3', quantity:3000, due:9, priority:1},
      {id:'ORD-04', model:'V5', quantity:2600, due:10, priority:2},
      {id:'ORD-05', model:'V4', quantity:2200, due:12, priority:2},
      {id:'ORD-06', model:'V5', quantity:1800, due:14, priority:1}
    ] });
  function validate(c) {
    const integer=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
    if(!integer(c.days,3,21)||!integer(c.lines,1,3)||!integer(c.capacity,1,100000)||!integer(c.minRun,1,c.days)) throw Error('计划天数需为 3–21，产线 1–3，日产能 1–100000，连续运行天数不得超过计划天数。');
    if(!Array.isArray(c.ramp)||c.ramp.length<1||c.ramp.length>5||c.ramp.some(v=>!Number.isFinite(v)||v<0||v>100)) throw Error('请填写 1–5 个 0–100 的爬坡产能百分比，以逗号分隔。');
    if(!Number.isFinite(c.changeLoss)||c.changeLoss<0||c.changeLoss>100||!Number.isFinite(c.changeWeight)||c.changeWeight<0||c.changeWeight>100000) throw Error('换型损耗应在 0–100%，换型权重应在 0–100000。');
    if(!integer(c.beam,20,200)) throw Error('搜索宽度应为 20–200。');
    if(!Array.isArray(c.orders)||c.orders.length<1||c.orders.length>30) throw Error('请输入 1–30 笔订单。');
    const ids=new Set(), models=new Set();
    for(const o of c.orders) {
      if(typeof o.id!=='string'||!o.id.trim()||o.id.length>40||ids.has(o.id)) throw Error('订单编号不能为空、重复或超过 40 字符。');
      if(typeof o.model!=='string'||!o.model.trim()||o.model.length>20) throw Error('型号名称须为 1–20 字符。');
      if(!integer(o.quantity,1,1000000)||!integer(o.due,1,c.days)||!integer(o.priority,1,5)) throw Error('订单数量需为 1–1000000 的整数，交期须在计划期内，优先级为 1–5。');
      ids.add(o.id); models.add(o.model);
    }
    if(models.size>3) throw Error('交互示例最多支持 3 个型号。');
    return c;
  }
  function solve(config, progress=()=>{}) {
    const c=validate(config), models=[...new Set(c.orders.map(o=>o.model))];
    const orderIndexes=models.map(m=>c.orders.map((o,i)=>i).filter(i=>c.orders[i].model===m).sort((a,b)=>c.orders[a].due-c.orders[b].due||c.orders[b].priority-c.orders[a].priority));
    let beam=[{remaining:c.orders.map(o=>o.quantity), machines:Array.from({length:c.lines},()=>({model:-1,age:0,last:-1})),cost:0,changes:0,path:[]}];
    for(let day=1;day<=c.days;day++) {
      const candidates=new Map();
      for(const state of beam) {
        const choices=state.machines.map(machine=>{
          if(machine.model>=0&&machine.age<c.minRun) return [machine.model];
          const available=models.map((_,m)=>m).filter(m=>orderIndexes[m].some(i=>state.remaining[i]>0));
          return [-1,...available.filter(m=>m===machine.model||day+c.minRun-1<=c.days)];
        });
        function visit(selected) {
          if(selected.length<c.lines) { for(const m of choices[selected.length]) visit([...selected,m]); return; }
          const remaining=state.remaining.slice(), machines=[], cells=[];
          let changes=0, holding=0;
          selected.forEach((m,line)=>{
            const prev=state.machines[line], start=m>=0&&m!==prev.model;
            const change=start&&prev.last>=0&&prev.last!==m, age=m<0?0:(start?1:prev.age+1);
            const ratio=m<0?0:(c.ramp[age-1]??100)/100*(change?1-c.changeLoss/100:1);
            const capacity=Math.floor(c.capacity*ratio+1e-8), allocations=[];
            let room=capacity;
            if(m>=0) for(const i of orderIndexes[m]) {
              const qty=Math.min(room,remaining[i]);
              if(qty>0) { remaining[i]-=qty; room-=qty; allocations.push({order:i,quantity:qty}); holding+=qty*Math.max(0,c.orders[i].due-day)*0.002; }
              if(room===0) break;
            }
            machines.push({model:m,age,last:m<0?prev.last:m}); changes+=Number(change);
            cells.push({day,line,model:m<0?null:models[m],age,start,change,capacity,quantity:capacity-room,allocations});
          });
          const backlog=remaining.reduce((s,q,i)=>s+(c.orders[i].due<=day?q*c.orders[i].priority:0),0);
          const cost=state.cost+backlog+changes*c.changeWeight+holding;
          const potential=remaining.reduce((s,q,i)=>s+q*c.orders[i].priority*Math.max(0,day+q/(c.capacity*c.lines)-c.orders[i].due)*0.35,0);
          const terminal=day===c.days?remaining.reduce((s,q,i)=>s+q*c.orders[i].priority*10,0):0;
          const next={remaining,machines,cost,changes:state.changes+changes,path:[...state.path,cells],rank:cost+potential+terminal};
          // Lines are interchangeable; keep only the cheapest equivalent future state.
          const key=remaining.join(',')+'|'+machines.map(m=>m.model+':'+m.last+':'+Math.min(m.age,Math.max(c.minRun,c.ramp.length+1))).sort().join(',');
          if(!candidates.has(key)||candidates.get(key).rank>next.rank) candidates.set(key,next);
        }
        visit([]);
      }
      beam=[...candidates.values()].sort((a,b)=>a.rank-b.rank).slice(0,c.beam);
      progress(day/c.days);
    }
    const best=beam[0], schedule=best.path.flat();
    const orders=c.orders.map((o,i)=>{
      let onTime=0,produced=0,completion=null;
      for(const cell of schedule) for(const a of cell.allocations) if(a.order===i) {
        produced+=a.quantity; if(cell.day<=o.due) onTime+=a.quantity;
        if(produced>=o.quantity) completion=cell.day;
      }
      return {...o,produced,onTime,late:produced-onTime,shortage:o.quantity-produced,completion};
    });
    const total=c.orders.reduce((s,o)=>s+o.quantity,0), produced=orders.reduce((s,o)=>s+o.produced,0);
    return {config:c,orders,schedule,summary:{total,produced,onTime:orders.reduce((s,o)=>s+o.onTime,0),shortage:total-produced,changes:best.changes,utilization:produced/(c.capacity*c.lines*c.days),score:best.rank},algorithm:'beam-search',optimal:false};
  }
  const api={example,validate,solve};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else root.BatteryEngine=api;
})(typeof self!=='undefined'?self:globalThis);
