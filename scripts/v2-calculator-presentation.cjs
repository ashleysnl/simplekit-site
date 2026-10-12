// Only exact recorded chart, disclosure and control-semantic edits are allowed.
const originals=require('../docs/v2/phase-15/presentation-js-baseline.json');
module.exports=(file,before)=>{
  const entry=Object.entries(originals).find(([id,e])=>file===id+'/'+e.file)?.[1];
  if(!entry)return null;
  let after=before;
  for(const[original,replacement]of entry.exactReplacements) {
    if(after.split(original).length!==2)throw Error('Ambiguous presentation change: '+file);
    after=after.replace(original,replacement);
  }
  return after;
};
