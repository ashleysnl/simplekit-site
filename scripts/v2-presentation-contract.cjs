// Exact allowed presentation-only transformations. Every other source byte stays original.
module.exports = before => before
 .replace(/canvas.width = Math.max\((800|900|640), Math.floor\(rect.width \* dpr\)\);/g,
  (_,min)=>`canvas.width = canvas.closest('[data-v2-pilot]') ? Math.max(1, Math.round(rect.width * dpr)) : Math.max(${min}, Math.floor(rect.width * dpr));`)
 .replace(/(ctx|g)\.font = "(12|10)px Avenir Next";/g,
  (_,context,size)=>`${context}.font = canvas.closest('[data-v2-pilot]') ? '12px ' + getComputedStyle(canvas).fontFamily : "${size}px Avenir Next";`);
