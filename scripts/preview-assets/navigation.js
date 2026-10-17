// Preview-only navigation. Canonical metadata and production code are untouched.
(() => {
  if(!/^[a-z0-9-]+\.simplekit-preview\.pages\.dev$/.test(location.hostname))return;
  function localize(link) {
    if(!link?.matches?.('a[href]'))return;
    try {
      const url=new URL(link.getAttribute('href'),document.baseURI);
      if(url.origin==='https://simplekit.app')link.setAttribute('href',url.pathname+url.search+url.hash);
    }catch{}
  }
  function scan(node) {
    localize(node);
    node.querySelectorAll?.('a[href]').forEach(localize);
  }
  scan(document);
  new MutationObserver(records=>{
    for(const record of records) {
      if(record.type==='attributes')localize(record.target);
      else record.addedNodes.forEach(scan);
    }
  }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['href']});
  for(const event of ['click','auxclick','contextmenu'])document.addEventListener(event,e=>localize(e.target.closest?.('a[href]')),true);
})();
