// Review specimens only; deliberately excluded from the deployed artifact.
const form = document.querySelector('#reference-form');
if (form) {
  const amount = document.querySelector('#amount');
  const error = document.querySelector('#amount-error');
  const status = document.querySelector('#form-status');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const valid = /^\d+(\.\d{1,2})?$/.test(amount.value) && Number(amount.value) > 0;
    amount.setAttribute('aria-invalid', String(!valid));
    error.hidden = valid;
    status.textContent = valid ? 'Example inputs reviewed. Illustrative results are unchanged.' : 'Review the amount field. Illustrative results are unchanged.';
    if (!valid) amount.focus();
  });
  form.addEventListener('reset', () => {
    amount.removeAttribute('aria-invalid'); error.hidden = true;
    status.textContent = 'Example inputs reset. Illustrative results are unchanged.';
    const slider = document.querySelector('#slider');
    if (slider) {slider.setAttribute('aria-valuetext','20 years');document.querySelector('#slider-value').textContent='20 years';}
  });
}
const slider = document.querySelector('#slider');
if (slider) slider.addEventListener('input', () => {
  const value = slider.value + ' years';
  slider.setAttribute('aria-valuetext', value);
  document.querySelector('#slider-value').textContent = value;
});
for (const button of document.querySelectorAll('[data-example-export]')) button.addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob(['year,ending_balance_CAD\n0,100000\n5,80000\n10,55000\n'],{type:'text/csv'}));
  const link = document.createElement('a');link.href=url;link.download='simplekit-design-example.csv';link.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
});
