/* Browser LP solver: two-phase simplex + Charnes–Cooper transformation.
 * x is dry mass fraction; chemistry and prices follow src/model.py.
 * No external dependencies. Exported for Node verification and Web Worker. */
(function (root) {
  'use strict';
  const EPS = 1e-9;
  function lp(A, b, c) {
    const m = b.length, n = c.length, B = [], N = [], D = Array.from({length:m+2},()=>Array(n+2).fill(0));
    for(let i=0;i<m;i++){for(let j=0;j<n;j++)D[i][j]=A[i][j];B[i]=n+i;D[i][n]=-1;D[i][n+1]=b[i];}
    for(let j=0;j<n;j++){N[j]=j;D[m][j]=-c[j];} N[n]=-1;D[m+1][n]=1;
    function pivot(r,s){const inv=1/D[r][s];for(let i=0;i<m+2;i++)if(i!==r)for(let j=0;j<n+2;j++)if(j!==s)D[i][j]-=D[r][j]*D[i][s]*inv;for(let j=0;j<n+2;j++)if(j!==s)D[r][j]*=inv;for(let i=0;i<m+2;i++)if(i!==r)D[i][s]*=-inv;D[r][s]=inv;[B[r],N[s]]=[N[s],B[r]];}
    function simplex(phase){const z=phase===1?m+1:m;for(let iter=0;iter<20000;iter++){let s=-1;for(let j=0;j<=n;j++){if(phase===2&&N[j]===-1)continue;if(s===-1||D[z][j]<D[z][s]-EPS||(Math.abs(D[z][j]-D[z][s])<EPS&&N[j]<N[s]))s=j;}if(D[z][s]>=-EPS)return true;let r=-1;for(let i=0;i<m;i++)if(D[i][s]>EPS){if(r===-1||D[i][n+1]/D[i][s]<D[r][n+1]/D[r][s]-EPS||(Math.abs(D[i][n+1]/D[i][s]-D[r][n+1]/D[r][s])<EPS&&B[i]<B[r]))r=i;}if(r===-1)return false;pivot(r,s);}throw Error('求解迭代达到限制，请调整数据。');}
    let r=0;for(let i=1;i<m;i++)if(D[i][n+1]<D[r][n+1])r=i;
    if(D[r][n+1]<-EPS){pivot(r,n);if(!simplex(1)||D[m+1][n+1]<-EPS||Math.abs(D[m+1][n+1])>EPS)return null;const k=B.indexOf(-1);if(k!==-1){let s=0;for(let j=1;j<=n;j++)if(D[k][j]<D[k][s]-EPS||(Math.abs(D[k][j]-D[k][s])<EPS&&N[j]<N[s]))s=j;if(Math.abs(D[k][s])>EPS)pivot(k,s);}}
    if(!simplex(2))throw Error('目标无界，请检查铁品位与价格。');const x=Array(n).fill(0);for(let i=0;i<m;i++)if(B[i]<n)x[B[i]]=D[i][n+1];return x;
  }
  const components=['TFe','SiO2','Al2O3','P','S','H2O'];
  function validate(data){
    const {materials,limits,batch}=data;
    if(!Array.isArray(materials)||materials.length<2||materials.length>20)throw Error('请提供 2–20 种原料。');
    if(!Number.isFinite(batch)||batch<=0||batch>1e7)throw Error('干基批量须在 0–10,000,000 吨之间。');
    const names=new Set();for(const m of materials){if(typeof m.name!=='string'||!m.name.trim()||m.name.length>60||names.has(m.name))throw Error('原料名称不能为空、重复或超过 60 字。');names.add(m.name);
      for(const k of ['price','min','max',...components])if(!Number.isFinite(m[k]))throw Error(`${m.name} 的 ${k} 必须是有效数字。`);
      if(m.price<=0||m.min<0||m.max>100||m.min>m.max||m.TFe<=0||m.H2O<0||m.H2O>=100||components.some(k=>m[k]<0||m[k]>100))throw Error(`${m.name} 的价格、成分或比例范围不正确（TFe > 0、水分 < 100%）。`);
    }
    if(materials.reduce((s,m)=>s+m.min,0)>100+EPS||materials.reduce((s,m)=>s+m.max,0)<100-EPS)throw Error('配比边界无法合计到 100%，请调整原料上下限。');
    for(const k of components){const l=limits?.[k];if(!l||!Number.isFinite(l.min)||!Number.isFinite(l.max)||l.min<0||l.max>100||l.min>l.max)throw Error(`${k} 的质量边界须满足 0 ≤ 下限 ≤ 上限 ≤ 100。`);}
  }
  function evaluate(data,shares){const ms=data.materials,wet=shares.map((x,i)=>x/(1-ms[i].H2O/100)),total=wet.reduce((a,b)=>a+b,0),chem={};for(const k of components)chem[k]=ms.reduce((s,m,i)=>s+(k==='H2O'?wet[i]/total:shares[i])*m[k],0);const dryPrice=ms.reduce((s,m,i)=>s+shares[i]*m.price/(1-m.H2O/100),0);return {shares,wetShares:wet.map(x=>x/total),dryPrice,ironCost:dryPrice/(chem.TFe/100),wetTons:total*data.batch,chem};}
  function solve(data){validate(data);const ms=data.materials,n=ms.length,A=[],b=[];
    const add=(row,rhs)=>{const scale=Math.max(1,...row.map(Math.abs),Math.abs(rhs));A.push(row.map(x=>x/scale));b.push(rhs/scale);};
    const eq=(row,rhs)=>{add(row,rhs);add(row.map(x=>-x),-rhs);};
    eq([...ms.map(()=>1),-1],0);eq([...ms.map(m=>m.TFe/100),0],1);
    ms.forEach((m,i)=>{const row=Array(n+1).fill(0);row[i]=1;row[n]=-m.max/100;add(row,0);const lo=Array(n+1).fill(0);lo[i]=-1;lo[n]=m.min/100;add(lo,0);});
    for(const k of components)for(const lower of [false,true]){const bound=data.limits[k][lower?'min':'max'];const row=k==='H2O'?[...ms.map(m=>(m.H2O-bound)/(1-m.H2O/100)),0]:[...ms.map(m=>m[k]),-bound];add(lower?row.map(x=>-x):row,0);}
    const sol=lp(A,b,[...ms.map(m=>-m.price/(1-m.H2O/100)),0]);
    if(!sol)throw Error('当前原料与质量边界无可行配方。请降低 TFe 下限、放宽杂质上限或原料比例范围。');
    if(!(sol[n]>EPS))throw Error('数值异常：无法恢复配比。');
    const result=evaluate(data,sol.slice(0,n).map(x=>Math.max(0,x/sol[n])));
    if(Math.abs(result.shares.reduce((a,b)=>a+b,0)-1)>1e-6||result.shares.some((x,i)=>x*100<ms[i].min-1e-5||x*100>ms[i].max+1e-5)||components.some(k=>result.chem[k]<data.limits[k].min-1e-5||result.chem[k]>data.limits[k].max+1e-5))throw Error('结果未通过精度校验，请调整输入范围。');
    return {...result,input:data,method:'Charnes–Cooper + two-phase simplex',tolerance:1e-5};
  }
  root.OreEngine={solve,evaluate,validate,components};if(typeof module!=='undefined')module.exports=root.OreEngine;
})(globalThis);
