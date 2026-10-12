const normalize=s=>s.replace(/\s+/g," ").trim();
async function outputs(page, selectors) {
  const values = {};
  for (const selector of selectors) values[selector] = normalize(await page.locator(selector).evaluate(node => {
    // Compare rendered output even when the tool keeps its results panel closed.
    // Reading innerText from display:none returns all hidden details in newer
    // Chromium. Render a test-only clone; never alter the user's calculator.
    const clone=node.cloneNode(true);clone.style.setProperty('display','block','important');
    clone.style.position='fixed';clone.style.left='0';clone.style.width='1440px';
    for(const child of clone.querySelectorAll('details:not([open]) > :not(summary)'))child.style.setProperty('display','none','important');
    document.body.append(clone);const text=clone.innerText;clone.remove();return text;
  }));
  return values;
}
module.exports=outputs;
