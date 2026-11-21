/* Two-phase simplex for max c*x subject to A*x<=b, x>=0.
   Tableau includes an artificial variable for phase-I feasibility. */
(function(root){
'use strict';
const EPS=1e-9;
function lp(A,b,c){
 const m=b.length,n=c.length,B=Array.from({length:m},(_,i)=>n+i),N=Array.from({length:n+1},(_,i)=>i<n?i:-1),D=Array.from({length:m+2},()=>Array(n+2).fill(0));
 for(let i=0;i<m;i++){for(let j=0;j<n;j++)D[i][j]=A[i][j];D[i][n]=-1;D[i][n+1]=b[i];}
 for(let j=0;j<n;j++)D[m][j]=-c[j];D[m+1][n]=1;
 function pivot(r,s){const inv=1/D[r][s];for(let i=0;i<m+2;i++)if(i!==r)for(let j=0;j<n+2;j++)if(j!==s)D[i][j]-=D[r][j]*D[i][s]*inv;for(let j=0;j<n+2;j++)if(j!==s)D[r][j]*=inv;for(let i=0;i<m+2;i++)if(i!==r)D[i][s]*=-inv;D[r][s]=inv;[B[r],N[s]]=[N[s],B[r]];}
 function simplex(phase){const row=phase===1?m+1:m;for(let iter=0;iter<10000;iter++){let s=-1;for(let j=0;j<=n;j++){if(phase===2&&N[j]===-1)continue;if(s===-1||D[row][j]<D[row][s]-EPS||(Math.abs(D[row][j]-D[row][s])<=EPS&&N[j]<N[s]))s=j;}if(D[row][s]>=-EPS)return true;let r=-1;for(let i=0;i<m;i++){if(D[i][s]<=EPS)continue;const v=D[i][n+1]/D[i][s],old=r<0?Infinity:D[r][n+1]/D[r][s];if(r<0||v<old-EPS||(Math.abs(v-old)<=EPS&&B[i]<B[r]))r=i;}if(r===-1)return false;pivot(r,s);}throw Error('求解迭代达到上限，请调整输入。');}
 let r=0;for(let i=1;i<m;i++)if(D[i][n+1]<D[r][n+1])r=i;
 if(D[r][n+1]<-EPS){pivot(r,n);if(!simplex(1)||D[m+1][n+1]<-EPS||Math.abs(D[m+1][n+1])>EPS)return null;const k=B.indexOf(-1);if(k>=0){let s=-1;for(let j=0;j<=n;j++)if(N[j]!==-1&&Math.abs(D[k][j])>EPS&&(s<0||N[j]<N[s]))s=j;if(s>=0)pivot(k,s);}}
 if(!simplex(2))throw Error('模型无界，请检查配料数据。');const x=Array(n).fill(0);for(let i=0;i<m;i++)if(B[i]>=0&&B[i]<n)x[B[i]]=D[i][n+1];return x;
}
const chemicals=['TFe','CaO','SiO2','MgO','Al2O3','P','S'];
const headers=['原料','价格','水分','烧损','下限','上限','初始',...chemicals];
const sample=`原料,价格,水分,烧损,下限,上限,初始,TFe,CaO,SiO2,MgO,Al2O3,P,S
赤铁精矿,780,8,1,10,65,40,65,0.5,4,0.3,1.5,0.04,0.02
低价混合矿,610,10,3,0,55,30,58,1,8,0.5,3,0.07,0.04
高品精矿,940,7,0.5,0,55,10,69,0.3,2,0.2,0.8,0.02,0.01
石灰石,120,3,42,0,20,12,0.5,54,2,1,0.6,0.01,0.01
白云石,160,2,44,0,15,5,0.5,30,2,20,0.5,0.01,0.01
焦粉,1050,9,82,2,6,3,1,3,5,0.5,3,0.02,0.2`;
const limits=`指标,下限,上限,脱除率
TFe,54,65,0
CaO,7,15,0
SiO2,3,7,0
MgO,1,3,0
Al2O3,0.5,3,0
P,0,0.09,0
S,0,0.06,0.7
CaO/SiO2,1.7,2.1,0
MgO/Al2O3,0.6,1.6,0
Al2O3/SiO2,0.15,0.6,0`;
function rows(text){return text.replace(/^\uFEFF/,'').trim().split(/\r?\n/).map(l=>l.split(',').map(v=>v.trim()));}
function number(v,label){if(v===''||!Number.isFinite(Number(v)))throw Error(label+' 必须为有限数字。');return Number(v);}
function parse(materialText,limitText){
 const lines=rows(materialText);if(lines[0].join(',')!==headers.join(','))throw Error('原料 CSV 表头与模板不一致。');if(lines.length<3||lines.length>21)throw Error('请提供 2–20 种原料。');const names=new Set();
 const materials=lines.slice(1).map((r,i)=>{if(r.length!==headers.length||!r[0])throw Error('原料第 '+(i+2)+' 行列数或名称无效。');if(names.has(r[0]))throw Error('原料名称不能重复。');names.add(r[0]);const a={name:r[0]};headers.slice(1).forEach((k,j)=>a[k]=number(r[j+1],r[0]+' '+k));if(a.价格<0||a.水分<0||a.水分>=100||a.烧损<0||a.烧损>=100||a.下限<0||a.上限>100||a.下限>a.上限||a.初始<0||a.初始>100)throw Error(r[0]+'：价格、百分比或配比边界无效。');for(const k of chemicals)if(a[k]<0||a[k]>100)throw Error(r[0]+'：成分必须在 0–100%。');return a;});
 const ls=rows(limitText);if(ls[0].join(',')!=='指标,下限,上限,脱除率')throw Error('约束 CSV 表头与模板不一致。');const seen=new Set();const constraints=ls.slice(1).map(r=>{if(r.length!==4||seen.has(r[0]))throw Error('约束行列数无效或指标重复。');seen.add(r[0]);const [name]=r,lo=number(r[1],name),hi=number(r[2],name),drop=number(r[3],name);if(!chemicals.includes(name)&&!['CaO/SiO2','MgO/Al2O3','Al2O3/SiO2'].includes(name))throw Error('不支持的指标：'+name);if(lo<0||hi<lo||drop<0||drop>1||(!chemicals.includes(name)&&drop!==0))throw Error(name+'：上下限或脱除率无效。');return {name,lo,hi,drop};});
 for(const c of constraints.filter(c=>c.name.includes('/'))){const denominator=c.name.split('/')[1];if(constraints.find(v=>v.name===denominator)?.drop===1||materials.some(a=>a.上限>0&&a[denominator]<=0))throw Error(c.name+'：可用原料的分母成分必须大于 0，且其脱除率小于 1。');}if(chemicals.some(k=>!seen.has(k)))throw Error('必须保留模板中的七项成分约束。');if(materials.reduce((s,a)=>s+a.下限,0)>100+EPS||materials.reduce((s,a)=>s+a.上限,0)<100-EPS)throw Error('原料上下限无法组成 100% 配比。');if(Math.abs(materials.reduce((s,a)=>s+a.初始,0)-100)>1e-6)throw Error('初始配比之和必须为 100%。');return {materials,constraints};
}
function prepare(data){const {materials, constraints}=data;const dry=materials.map(a=>1-a.水分/100),ret=materials.map((a,i)=>dry[i]*(1-a.烧损/100)),cost=materials.map((a,i)=>dry[i]*a.价格),eff={};for(const k of chemicals){const drop=constraints.find(v=>v.name===k).drop;eff[k]=materials.map((a,i)=>dry[i]*a[k]*(1-drop));}return {dry,ret,cost,eff};}
function evaluate(data,x){const p=prepare(data),sum=v=>v.reduce((s,a,i)=>s+a*x[i],0),retained=sum(p.ret),composition={};for(const k of chemicals)composition[k]=sum(p.eff[k])/retained;const checks=data.constraints.map(c=>{const parts=c.name.split('/'),value=parts.length===1?composition[c.name]:composition[parts[0]]/composition[parts[1]];return {...c,value,ok:Number.isFinite(value)&&value>=c.lo-1e-5&&value<=c.hi+1e-5};});data.materials.forEach((a,i)=>checks.push({name:a.name+' 配比',lo:a.下限,hi:a.上限,value:x[i]*100,ok:x[i]*100>=a.下限-1e-5&&x[i]*100<=a.上限+1e-5}));checks.push({name:'配比合计',lo:100,hi:100,value:x.reduce((s,v)=>s+v,0)*100,ok:Math.abs(x.reduce((s,v)=>s+v,0)-1)<1e-6});return {x,cost:sum(p.cost)/retained,retained,composition,checks,feasible:checks.every(v=>v.ok),consumption:p.dry.map((v,i)=>v*x[i]/retained),costs:p.cost.map((v,i)=>v*x[i]/retained)};}
function solve(data){const p=prepare(data),n=data.materials.length,A=[],b=[],add=(a,r)=>{A.push(a);b.push(r);};add(p.ret,1);add(p.ret.map(v=>-v),-1);data.materials.forEach((a,i)=>{add(Array.from({length:n},(_,j)=>(i===j?1:0)-a.上限/100),0);add(Array.from({length:n},(_,j)=>a.下限/100-(i===j?1:0)),0);});
 for(const c of data.constraints){const parts=c.name.split('/'),num=p.eff[parts[0]],den=parts.length===1?p.ret:p.eff[parts[1]];add(num.map((v,i)=>v-c.hi*den[i]),0);add(num.map((v,i)=>c.lo*den[i]-v),0);}
 const y=lp(A,b,p.cost.map(v=>-v));if(!y)return {status:'infeasible'};const total=y.reduce((s,v)=>s+v,0),result=evaluate(data,y.map(v=>v/total));if(!result.feasible)throw Error('结果未通过数值复核，请调整输入。');return {status:'optimal',...result,baseline:evaluate(data,data.materials.map(a=>a.初始/100))};}
const api={parse,solve,evaluate,prepare,sample,limits,headers,lp};if(typeof module!=='undefined')module.exports=api;root.SinterEngine=api;
})(globalThis);
