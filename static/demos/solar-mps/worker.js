importScripts('engine.js');
onmessage=({data})=>{try{postMessage({type:'result',result:SolarEngine.solve(data,p=>postMessage({type:'progress',value:p}))});}catch(e){postMessage({type:'error',message:e.message});}};
