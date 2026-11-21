/* UI stays independent of the original Python model. */
'use strict';
const $=id=>document.getElementById(id),esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),num=x=>Number(x).toLocaleString('zh-CN',{maximumFractionDigits:1});
const fields=[['计划与搜索',null],['days','计划天数',3,31],['minRun','新开设备最短运行 / 天',1,31],['beam','搜索宽度',20,120],['safety','成品安全库存 / 单位',0,1000000],['拉晶设备',null],['crystalMachines','设备总数 / 台',1,6],['initialCrystal','初始开机 / 台',0,6],['crystalCapacity','单机日产能 / 单位',1,10000],['crystalRamp','日启停上限 / 台',1,6],['切片设备',null],['sliceMachines','设备总数 / 台',1,6],['initialSlice','初始开机 / 台',0,6],['sliceCapacity','单机日用料 / 单位',1,10000],['sliceRamp','日启停上限 / 台',1,6],['startup','新开切片首日产能 / %',0.1,100],['crystallization','成晶率 / %',0.1,100],['finished','成品率 / %',0.1,100],['rawStock','期初在制品 / 单位',0,1000000],['stock','期初成品 / 单位',0,1000000]];
$('parameterFields').innerHTML=fields.map(([key,label,min,max])=>label===null?`<div class="field-group">${key}</div>`:`<div class="solar-field"><label for="${key}">${label}</label><input id="${key}" type="number" min="${min}" max="${max}" step="${min===0.1?'0.1':'1'}" required></div>`).join('');
let result=null,tab='daily',worker=null,timer=null,started=0;
function notice(message,type=''){$('notice').textContent=message;$('notice').className='notice '+type;}
function parseCSV(text){
  text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],value='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else if(quoted){quoted=false;}else if(value===''){quoted=true;}else throw Error('CSV 引号格式错误。');}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(x=>x.trim()))rows.push(row);row=[];value='';}else value+=c;}
  if(quoted)throw Error('CSV 有未闭合的引号。');row.push(value);if(row.some(x=>x.trim()))rows.push(row);
  if(!rows.length||rows[0].map(x=>x.trim()).join(',')!=='订单编号,数量,交期')throw Error('CSV 表头必须为：订单编号,数量,交期。');
  return rows.slice(1).map(r=>{if(r.length!==3)throw Error('每笔订单需有三列。');return{id:r[0].trim(),quantity:Number(r[1]),due:Number(r[2])};});
}
function table(headers,rows){return `<table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${esc(typeof x==='number'?num(x):x??'—')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
function read(){const c={orders:parseCSV($('demandEditor').value)};for(const [key,label]of fields)if(label!==null)c[key]=Number($(key).value);return SolarEngine.validate(c);}
function preview(){try{const c=read();$('inputPreview').innerHTML=table(['订单编号','数量','交期 / 天'],c.orders.map(o=>[o.id,o.quantity,o.due]));$('editorStats').textContent=`${c.orders.length} 笔订单 · 总需求 ${num(c.orders.reduce((s,o)=>s+o.quantity,0))}`;return c;}catch(e){notice(e.message,'error');throw e;}}
function stale(){if(result){$('exportJson').disabled=true;$('exportCsv').disabled=true;notice('输入已改变，下方保留上次结果；请重新运行以更新计划。','stale');$('runTitle').textContent='输入已更新，等待重新计算';}}
function load(kind='normal'){
  const c=SolarEngine.example();if(kind==='rush')c.orders.push({id:'PV-RUSH',quantity:1500,due:7});if(kind==='tight'){c.sliceMachines=2;c.initialSlice=1;c.sliceRamp=1;}
  for(const [key,label]of fields)if(label!==null)$(key).value=c[key];
  $('demandEditor').value='订单编号,数量,交期\n'+c.orders.map(o=>[o.id,o.quantity,o.due].join(',')).join('\n');
  document.querySelectorAll('.scenario').forEach(b=>b.classList.toggle('active',b.dataset.scenario===kind));preview();if(result)stale();else notice('场景已就绪，点击生成生产计划。');
}
function busy(on){$('runButton').disabled=on;$('loadExample').disabled=on;$('cancelButton').hidden=!on;$('csvUpload').disabled=on;$('previewButton').disabled=on;document.querySelectorAll('#parameterFields input,#demandEditor,.scenario').forEach(e=>e.disabled=on);}
function stop(){if(worker)worker.terminate();worker=null;clearInterval(timer);timer=null;busy(false);}
function run(){let c;try{c=preview();}catch{return;}stop();busy(true);$('exportJson').disabled=true;$('exportCsv').disabled=true;started=performance.now();$('progressBar').style.width='0%';notice('正在生成候选设备计划…');$('runTitle').textContent='正在计算生产计划';
  try{worker=new Worker('worker.js');timer=setTimeout(()=>{stop();notice('计算超过 45 秒已停止，请降低搜索宽度或缩短计划期后重试。','error');},45000);
    worker.onmessage=({data})=>{if(data.type==='progress'){$('progressBar').style.width=data.value*100+'%';notice(`正在规划第 ${Math.round(data.value*c.days)} / ${c.days} 天…`);}else if(data.type==='error'){stop();$('runTitle').textContent='本次计算未完成';notice(data.message,'error');}else{const elapsed=(performance.now()-started)/1000;stop();result=data.result;render();$('progressBar').style.width='100%';$('runTitle').textContent='生产计划已生成';notice(`计算完成，用时 ${elapsed.toFixed(2)} 秒。修改输入后可再次运行。`);}};
    worker.onerror=()=>{stop();notice('计算线程启动失败，请使用 HTTP 服务访问此页面。','error');};worker.postMessage(c);
  }catch(e){stop();notice(e.message+'；请通过本地 HTTP 服务打开页面。','error');}
}
function chart(id,series){const w=620,h=240,left=50,top=15,bottom=30,plotW=w-left-15,plotH=h-top-bottom,days=result.daily.length,max=Math.max(1,...series.flatMap(s=>result.daily.map(d=>d[s.key]))),y=v=>top+plotH-v/max*plotH;
  let svg=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${id==='productionChart'?'逐日产出':'库存与欠交'}，精确数值见逐日生产计划表">`;
  for(let i=0;i<=4;i++){const v=max*i/4;svg+=`<line class="grid" x1="${left}" x2="${w-15}" y1="${y(v)}" y2="${y(v)}"/><text x="${left-7}" y="${y(v)+4}" text-anchor="end">${num(v)}</text>`;}
  for(const s of series){const points=result.daily.map((d,i)=>`${left+i*plotW/(days-1)},${y(d[s.key])}`).join(' ');svg+=`<polyline fill="none" stroke="${s.color}" stroke-width="2.5" points="${points}"/>`;result.daily.forEach((d,i)=>{svg+=`<circle cx="${left+i*plotW/(days-1)}" cy="${y(d[s.key])}" r="3" fill="${s.color}"><title>第 ${d.day} 天 · ${s.label} ${num(d[s.key])}</title></circle>`;});}
  result.daily.forEach((d,i)=>{if(i%Math.ceil(days/7)===0||i===days-1)svg+=`<text x="${left+i*plotW/(days-1)}" y="${h-8}" text-anchor="middle">D${d.day}</text>`;});$(id).innerHTML=svg+'</svg>';
}
function render(){const s=result.summary;$('emptyResults').hidden=true;$('resultContent').hidden=false;$('exportJson').disabled=false;$('exportCsv').disabled=false;$('kpiOnTime').textContent=num(s.onTime)+'%';$('kpiBacklog').textContent=num(s.backlog);$('kpiSwitches').textContent=s.switches;$('kpiSafety').textContent=s.safetyDays+' 天';$('resultSummary').textContent=`本次总需求 ${num(s.total)}，期末履约率 ${num(s.fulfillment)}%；期末在制品 ${num(s.raw)}，成品 ${num(s.stock)}。综合良率 ${num(s.yieldRate*100)}%。${s.backlog>1e-6?'存在期末欠交，可调整产能、初始库存或交期后对比。':'计划期内已完成全部订单。'} 结果来自启发式搜索，不保证最优。`;
  $('equipmentChart').innerHTML=`<table class="equipment-table"><thead><tr><th>工序 / 天</th>${result.daily.map(d=>`<th>${d.day}</th>`).join('')}</tr></thead><tbody>${[['拉晶','crystal'],['切片','slice']].map(([label,key])=>`<tr><th scope="row">${label}</th>${result.daily.map(d=>{const n=d[key+'Machines'];return `<td class="${n?'':'zero'}" style="${n?`background:rgba(65,107,85,${.15+.7*n/result.config[key+'Machines']});color:${n/result.config[key+'Machines']>.5?'white':'#31533b'}`:''}" title="第 ${d.day} 天 ${label}：${n} 台；新开 ${d[key+'Starts']} 台，关闭 ${d[key+'Stops']} 台">${n}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
  chart('productionChart',[{key:'crystal',label:'拉晶',color:'#416b55'},{key:'produced',label:'切片成品',color:'#b3cb7e'}]);chart('inventoryChart',[{key:'raw',label:'在制品',color:'#416b55'},{key:'stock',label:'成品',color:'#b3cb7e'},{key:'backlog',label:'欠交',color:'#c37b58'}]);renderTable();
}
function rows(){return tab==='daily'?{headers:['天','拉晶开机','切片开机','拉晶新开','拉晶关闭','切片新开','切片关闭','拉晶产出','切片用料','成品产出','在制品库存','成品库存','当日交付','到期欠交','安全库存缺口'],data:result.daily.map(d=>[d.day,d.crystalMachines,d.sliceMachines,d.crystalStarts,d.crystalStops,d.sliceStarts,d.sliceStops,d.crystal,d.sliced,d.produced,d.raw,d.stock,d.deliveries.reduce((s,x)=>s+x.quantity,0),d.backlog,d.safetyGap])}:{headers:['订单编号','需求','交期 / 天','已交付','按期交付','期末欠交','完成日'],data:result.orders.map(o=>[o.id,o.quantity,o.due,o.delivered,o.onTime,o.remaining,o.completed])};}
function renderTable(){if(!result)return;const r=rows();$('resultTable').innerHTML=table(r.headers,r.data);$('resultRowCount').textContent=`${r.data.length} 行 · 数量保留一位小数，计算使用连续产量`;for(const t of ['daily','orders']){$(t+'Tab').classList.toggle('active',tab===t);$(t+'Tab').setAttribute('aria-selected',tab===t);}$('resultTable').setAttribute('aria-labelledby',tab+'Tab');}
function download(name,type,content){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('runButton').onclick=run;$('cancelButton').onclick=()=>{stop();$('runTitle').textContent='计算已取消';notice('计算已取消；如有上次结果，则继续保留。');};$('loadExample').onclick=()=>load();$('previewButton').onclick=()=>{try{preview();notice('预览已更新。');stale();}catch{}};
document.querySelectorAll('.scenario').forEach(b=>b.onclick=()=>load(b.dataset.scenario));document.querySelectorAll('#parameterFields input,#demandEditor').forEach(e=>e.addEventListener('input',stale));
$('csvUpload').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>100000)throw Error('CSV 需小于 100 KB。');$('demandEditor').value=await f.text();stale();preview();notice('CSV 已导入，请重新运行。');}catch(err){notice(err.message,'error');}finally{e.target.value='';}};
$('dailyTab').onclick=()=>{tab='daily';renderTable();};$('ordersTab').onclick=()=>{tab='orders';renderTable();};
$('exportJson').onclick=()=>download('solar-plan.json','application/json',JSON.stringify(result,null,2));$('exportCsv').onclick=()=>{const r=rows(),cell=x=>{let s=String(x??'');if(/^[=+@-]/.test(s)&&typeof x!=='number')s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};download('solar-'+tab+'.csv','text/csv;charset=utf-8','\uFEFF'+[r.headers,...r.data].map(row=>row.map(cell).join(',')).join('\r\n'));};
const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));},{rootMargin:'-10% 0px -65% 0px'});document.querySelectorAll('main>section').forEach(s=>observer.observe(s));
if(!location.pathname.includes('/demos/')){$('projectLink').href='https://zhiyingchen.github.io/projects/solar-mps/';}
load();
