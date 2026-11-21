'use strict';
const $=id=>document.getElementById(id), fields=['days','lines','capacity','minRun','ramp','changeLoss','changeWeight','beam'];
const colors=['#a6bf96','#abb9d5','#dec496'];
let result=null, worker=null, dirty=false;
const fmt=n=>Number(n).toLocaleString('zh-CN'), pct=n=>(n*100).toFixed(1)+'%';
function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function markDirty(){dirty=true;if(result){$('resultCaption').textContent='输入已修改。下方为上次运行结果，请重新生成排程。';$('exportJson').disabled=true;$('exportCsv').disabled=true;$('exportOrders').disabled=true;}}
function addOrder(order){
  if($('orderRows').children.length>=30){status('最多支持 30 笔订单。',true);return;}
  const row=el('tr');
  for(const field of ['id','model','quantity','due','priority']){
    const td=el('td'),input=el('input');input.dataset.field=field;input.value=order[field];input.type=['id','model'].includes(field)?'text':'number';
    input.setAttribute('aria-label',`${order.id} ${ {id:'订单编号',model:'型号',quantity:'数量',due:'交期',priority:'优先级'}[field]}`);
    if(input.type==='number'){input.min='1';input.step='1';input.max=field==='quantity'?'1000000':field==='priority'?'5':'21';}else input.maxLength=field==='id'?40:20;
    input.addEventListener('input',()=>{markDirty();summary();});td.append(input);row.append(td);
  }
  const td=el('td'),button=el('button','×','delete');button.setAttribute('aria-label','删除订单 '+order.id);button.addEventListener('click',()=>{row.remove();markDirty();summary();});td.append(button);row.append(td);$('orderRows').append(row);
}
function read(){const c={};for(const f of fields)c[f]=f==='ramp'?$(f).value.split(/[,，]/).map(v=>v.trim()===''?NaN:Number(v)):Number($(f).value);c.orders=[...$('orderRows').children].map(row=>{const o={};row.querySelectorAll('input').forEach(i=>o[i.dataset.field]=i.type==='number'?Number(i.value):i.value.trim());return o;});return BatteryEngine.validate(c);}
function summary(){const rows=[...$('orderRows').children];const total=rows.reduce((s,r)=>s+Number(r.querySelector('[data-field=quantity]').value||0),0);$('inputSummary').textContent=`${rows.length} 笔订单 · 总需求 ${fmt(total)} 件`;}
function load(c){BatteryEngine.validate(c);for(const f of fields)$(f).value=f==='ramp'?c.ramp.join(', '):c[f];$('orderRows').replaceChildren();c.orders.forEach(addOrder);summary();markDirty();}
function busy(value){$('run').disabled=value;$('cancel').hidden=!value;$('progress').hidden=!value;$('inputs').setAttribute('aria-busy',String(value));$('reset').disabled=value;$('addOrder').disabled=value;$('saveInput').disabled=value;$('import').disabled=value;for(const i of document.querySelectorAll('#inputs input,#inputs select,#orderRows button'))i.disabled=value;}
function stop(){if(worker)worker.terminate();worker=null;busy(false);}
function run(){
  let c;try{c=read();}catch(e){status(e.message,true);return;}
  busy(true);$('progress').value=0;status('正在探索可行排程…');
  try{worker=new Worker('worker.js');}catch(e){stop();status('无法启动计算，请通过 HTTP 服务打开此页面。',true);return;}
  worker.onmessage=({data})=>{
    if(data.progress!==undefined){$('progress').value=data.progress;status(`正在计算 · ${Math.round(data.progress*100)}%`);}
    if(data.error){stop();status(data.error,true);}
    if(data.result){result=data.result;dirty=false;stop();render();status(`排程已生成，用时 ${result.runtime.toFixed(2)} 秒。启发式候选方案，不保证全局最优。`);$('results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  };
  worker.onerror=()=>{stop();status('计算进程出错，请刷新页面或缩小场景后重试。',true);};worker.postMessage(c);
}
function render(){
  const r=result,s=r.summary,c=r.config,models=[...new Set(c.orders.map(o=>o.model))],color=m=>colors[models.indexOf(m)];
  $('empty').hidden=true;$('resultContent').hidden=false;for(const id of ['exportJson','exportCsv','exportOrders'])$(id).disabled=false;
  $('resultCaption').textContent=`${c.days} 天 · ${c.lines} 条产线 · ${c.orders.length} 笔订单 · 本次场景的计算结果`;
  $('kpis').replaceChildren();
  for(const [title,value,sub] of [['按时交付率',pct(s.onTime/s.total),`${fmt(s.onTime)} / ${fmt(s.total)} 件`],['期末欠交',fmt(s.shortage),'未在计划期内生产的数量'],['跨型号换型',fmt(s.changes),'不含首开与同型号重启'],['额定产能利用率',pct(s.utilization),'实际产出 / 全期额定产能']]){const card=el('article',undefined,'kpi');card.append(el('span',title),el('strong',value),el('small',sub));$('kpis').append(card);}
  $('legend').replaceChildren();models.forEach(m=>{const span=el('span');const i=el('i');i.style.background=color(m);span.append(i,document.createTextNode(m));$('legend').append(span);});
  $('gantt').replaceChildren();
  const header=el('div',undefined,'gantt-row');header.style.gridTemplateColumns=`65px repeat(${c.days},minmax(34px,1fr))`;header.append(el('span','产线 / 天','gantt-label'));for(let d=1;d<=c.days;d++)header.append(el('div',String(d).padStart(2,'0'),'gantt-header'));$('gantt').append(header);
  for(let l=0;l<c.lines;l++){
    const row=el('div',undefined,'gantt-row');row.style.gridTemplateColumns=header.style.gridTemplateColumns;row.append(el('div',`LINE ${String(l+1).padStart(2,'0')}`,'gantt-label'));
    for(const cell of r.schedule.filter(s=>s.line===l)){
      const ramp=cell.model!==null&&cell.age<=c.ramp.length,button=el('button',undefined,'gantt-cell'+(ramp?' ramp':''));
      if(cell.model!==null)button.style.backgroundColor=color(cell.model);
      button.append(el('span',(cell.change?'↻ ':'')+(cell.model??'空闲')),el('small',cell.model===null?'—':fmt(cell.quantity)));
      button.title=`第 ${cell.day} 天 · ${cell.model??'空闲'} · 产出 ${cell.quantity} / 可用 ${cell.capacity}`;
      button.setAttribute('aria-label',`产线 ${l+1}，${button.title}`);
      button.addEventListener('click',()=>{$('cellDetail').textContent=`产线 ${l+1} · 第 ${cell.day} 天 · ${cell.model??'空闲'}${cell.model===null?'':` · 连续运行第 ${cell.age} 天`} · 可用产能 ${fmt(cell.capacity)} · 产出 ${fmt(cell.quantity)} 件。${cell.allocations.map(a=>`${c.orders[a.order].id}：${fmt(a.quantity)} 件`).join('；')}`;});row.append(button);
    }$('gantt').append(row);
  }
  $('cellDetail').textContent='点击某个生产日查看可用产能与订单分配。';
  $('dailyChart').replaceChildren();
  for(let d=1;d<=c.days;d++){
    const cells=r.schedule.filter(s=>s.day===d),cap=cells.reduce((s,v)=>s+v.capacity,0),out=cells.reduce((s,v)=>s+v.quantity,0);
    const group=el('div',undefined,'bar-group'),bar=el('div',undefined,'bar-cap'),fill=el('div',undefined,'bar-output');
    bar.style.height=pct(cap/(c.capacity*c.lines));fill.style.height=pct(cap?out/cap:0);bar.append(fill);group.append(bar,el('span',String(d)));group.title=`第 ${d} 天 · 产出 ${fmt(out)} / 可用产能 ${fmt(cap)} 件`;$('dailyChart').append(group);
  }
  $('facts').replaceChildren();
  for(const [label,value] of [['已生产',`${fmt(s.produced)} 件 / 需求 ${fmt(s.total)} 件`],['延期交付',`${fmt(r.orders.reduce((v,o)=>v+o.late,0))} 件（计划期内晚于交期生产）`],['计算用时',`${r.runtime.toFixed(2)} 秒 · 搜索宽度 ${c.beam}`],['方案性质','束搜索启发式，不保证全局最优'],['初始条件','所有产线初始关闭，初始库存为 0']]){const p=el('p');p.append(el('strong',label+'：'),document.createTextNode(value));$('facts').append(p);}
  $('fulfillment').replaceChildren();for(const o of r.orders){const row=el('tr');[o.id,o.model,fmt(o.quantity),`D${o.due}`,fmt(o.onTime),fmt(o.late),fmt(o.shortage),o.completion===null?'未完成':`D${o.completion}`].forEach((v,i)=>row.append(el('td',v,i===6&&o.shortage?'warn':'')));$('fulfillment').append(row);}
}
function download(name,data,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function csv(rows){return '\ufeff'+rows.map(row=>row.map(v=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
$('run').addEventListener('click',run);$('cancel').addEventListener('click',()=>{stop();status('已取消本次计算。');});
$('reset').addEventListener('click',()=>{load(BatteryEngine.example());status('已恢复示例参数，请生成新排程。');});
$('addOrder').addEventListener('click',()=>{const ids=new Set([...$('orderRows').querySelectorAll('[data-field=id]')].map(i=>i.value));let n=1;while(ids.has('ORD-'+String(n).padStart(2,'0')))n++;addOrder({id:'ORD-'+String(n).padStart(2,'0'),model:'V3',quantity:1000,due:Number($('days').value),priority:1});summary();markDirty();});
for(const f of fields)$(f).addEventListener('input',markDirty);
$('saveInput').addEventListener('click',()=>{try{download('battery-scenario.json',JSON.stringify(read(),null,2),'application/json');}catch(e){status(e.message,true);}});
$('import').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>100000)throw Error('场景 JSON 不得超过 100 KB。');const c=JSON.parse((await file.text()).replace(/^\uFEFF/,''));load(c);status('已导入场景，请生成排程。');}catch(e){status('导入失败：'+e.message,true);}finally{event.target.value='';}});
$('exportJson').addEventListener('click',()=>{if(result&&!dirty)download('battery-result.json',JSON.stringify(result,null,2),'application/json');});
$('exportCsv').addEventListener('click',()=>{if(result&&!dirty)download('battery-schedule.csv',csv([['产线','日期','型号','连续运行天数','可用产能','产出','是否换型'],...result.schedule.map(s=>[s.line+1,s.day,s.model??'空闲',s.age,s.capacity,s.quantity,s.change?'是':'否'])]),'text/csv;charset=utf-8');});
$('exportOrders').addEventListener('click',()=>{if(result&&!dirty)download('battery-orders.csv',csv([['订单','型号','数量','交期','按时交付','延期交付','期末欠交','完成日'],...result.orders.map(o=>[o.id,o.model,o.quantity,o.due,o.onTime,o.late,o.shortage,o.completion])]),'text/csv;charset=utf-8');});
const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));},{rootMargin:'-10% 0px -65% 0px'});document.querySelectorAll('main section').forEach(s=>observer.observe(s));
load(BatteryEngine.example());dirty=false;
