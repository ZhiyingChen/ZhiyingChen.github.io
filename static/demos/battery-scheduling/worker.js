importScripts('engine.js');
self.onmessage=({data})=>{
  try {
    const start=performance.now();
    const result=BatteryEngine.solve(data,p=>self.postMessage({progress:p}));
    result.runtime=(performance.now()-start)/1000;
    self.postMessage({result});
  } catch(e) { self.postMessage({error:e.message}); }
};
