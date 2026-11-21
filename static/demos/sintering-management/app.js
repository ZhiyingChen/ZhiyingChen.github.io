'use strict';
const $=id=>document.getElementById(id), E=SinterEngine;
let result=null, input=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,n=2)=>Number(v).toLocaleString('zh-CN',{minimumFractionDigits:n,maximumFractionDigits:n});
function table(headers,rows){return '<table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';}
function notice(text,error=false){$('notice').textContent=text;$('notice').className='notice'+(error?' error':'');}
function invalidate(){result=null;input=null;$('exportCsv').disabled=$('exportJson').disabled=true;$('resultContent').hidden=true;$('empty').hidden=false;$('empty').querySelector('h3').textContent='配置已更新，等待重新计算';for(const id of ['cost','saving','retained','passed'])$(id).textContent='—';notice('配置已修改。点击运行以计算当前方案。');}
function scenario(name){$('materials').value=E.sample;$('limits').value=E.limits;if(name==='price')$('materials').value=E.sample.replace('高品精矿,940','高品精矿,1400');if(name==='quality')$('limits').value=E.limits.replace('TFe,54','TFe,58');if(name==='impossible')$('limits').value=E.limits.replace('TFe,54,65','TFe,80,85');document.querySelectorAll('[data-scenario]').forEach(b=>b.classList.toggle('active',b.dataset.scenario===name));invalidate();preview();}
function preview(){try{const d=E.parse($('materials').value,$('limits').value);$('preview').innerHTML=table(['原料','价格 / 元','配比范围 / %'],d.materials.map(a=>[a.name,a.价格,a.下限+' — '+a.上限]));}catch(e){$('preview').textContent='输入将在运行时校验：'+e.message;}}
function render(){const r=result,d=input;$('empty').hidden=true;$('resultContent').hidden=false;$('cost').textContent=fmt(r.cost);const delta=r.baseline.cost-r.cost;$('saving').textContent=(delta>=0?'节省 ':'增加 ')+fmt(Math.abs(delta));$('baselineLabel').textContent='初始成本 '+fmt(r.baseline.cost)+' 元/吨 · '+(r.baseline.feasible?'初始配比达标':'初始配比未达标');$('retained').textContent=fmt(r.retained*100)+'%';$('passed').textContent=r.checks.filter(c=>c.ok).length+' / '+r.checks.length;
 $('chart').innerHTML=d.materials.map((a,i)=>'<div class="mix-row"><div><span>'+esc(a.name)+'</span><span>'+fmt(a.初始)+'% → '+fmt(r.x[i]*100)+'%</span></div><div class="track"><i style="width:'+a.初始+'%"></i></div><div class="track optimized"><i style="width:'+Math.max(0,r.x[i]*100)+'%"></i></div></div>').join('');
 $('mixTable').innerHTML=table(['原料','配比 / %','干基吨 / 吨烧结矿','成本 / 元'],d.materials.map((a,i)=>[a.name,fmt(r.x[i]*100,3),fmt(r.consumption[i],4),fmt(r.costs[i])]));
 $('checks').innerHTML=table(['指标','下限','上限','初始值','优化值','校验'],r.checks.map((c,i)=>[c.name,fmt(c.lo,4),fmt(c.hi,4),fmt(r.baseline.checks[i].value,4),fmt(c.value,4),c.ok?'✓ 通过':'未通过']));$('exportCsv').disabled=$('exportJson').disabled=false;
}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('run').addEventListener('click',()=>{invalidate();try{input=E.parse($('materials').value,$('limits').value);result=E.solve(input);if(result.status==='infeasible'){result=null;input=null;$('empty').querySelector('h3').textContent='当前约束下没有可行配方';notice('未找到可行解：请放宽铁品位、碱度或原料配比边界，再重新运行。',true);return;}render();notice('求解完成：当前线性规划的最优方案已通过原始公式校验。'+(!result.baseline.feasible?' 初始配比未达标，成本差仅作对照。':''));}catch(e){result=null;input=null;notice(e.message,true);}});
for(const id of ['materials','limits'])$(id).addEventListener('input',()=>{invalidate();preview();document.querySelectorAll('[data-scenario]').forEach(b=>b.classList.remove('active'));});
$('reset').onclick=()=>scenario('base');document.querySelectorAll('[data-scenario]').forEach(b=>b.onclick=()=>scenario(b.dataset.scenario));
$('template').onclick=()=>download('sinter-materials.csv','\uFEFF'+E.sample,'text/csv;charset=utf-8');
$('upload').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>100000)throw Error('CSV 文件请小于 100 KB。');$('materials').value=await file.text();invalidate();preview();}catch(e){notice(e.message,true);}event.target.value='';};
$('exportJson').onclick=()=>{if(result)download('sinter-result.json',JSON.stringify({model:'single-batch-sinter-lp-v1',input,result},null,2),'application/json');};
$('exportCsv').onclick=()=>{if(!result)return;const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';const rows=[['原料','初始配比(%)','优化配比(%)','干基投入(t/t)','成本(元/t)'],...input.materials.map((a,i)=>[a.name,a.初始,result.x[i]*100,result.consumption[i],result.costs[i]])];download('sinter-blend.csv','\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8');};
const sections=document.querySelectorAll('main>section');const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));},{rootMargin:'-10% 0px -65% 0px'});sections.forEach(s=>observer.observe(s));
if(new URLSearchParams(location.search).get('lang')==='en')$('projectLink').href='../../en/projects/sintering-management/';
scenario('base');
notice('示例已就绪，点击运行开始计算。');
$('empty').querySelector('h3').textContent='等待第一次配料计算';
