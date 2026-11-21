importScripts('engine.js');
onmessage=({data})=>{try{postMessage({result:OreEngine.solve(data)});}catch(error){postMessage({error:error.message});}};
