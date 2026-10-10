import {discovery} from './discovery-index.js';
import {onboardingGoals, questionsFor, recommendTools} from './onboarding-engine.js';

const root = document.querySelector('[data-v2-onboarding]');
if (root) {
  const start = root.querySelector('[data-onboarding-start]');
  const flow = root.querySelector('[data-onboarding-flow]');
  const title = root.querySelector('#onboarding-flow-title');
  const content = root.querySelector('[data-onboarding-content]');
  const status = root.querySelector('[data-onboarding-status]');
  const next = root.querySelector('[data-onboarding-next]');
  const back = root.querySelector('[data-onboarding-back]');
  const skip = root.querySelector('[data-onboarding-skip]');
  let answers = {}, step = 0;
  const keys = ['goal','need','detail'];
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function render() {
    content.replaceChildren();
    back.hidden = step === 0; next.hidden = skip.hidden = step === 3;
    next.textContent = step === 2 ? 'Show tools' : 'Continue';
    if (step === 3) {
      title.textContent = 'Tools to explore';
      const recommendations = recommendTools(answers, discovery);
      status.textContent = recommendations.length ? `${recommendations.length} ${recommendations.length === 1 ? 'tool' : 'tools'} to explore.` : 'Browse all tools to find your starting point.';
      if (!recommendations.length) content.append(element('p','No need to choose a goal now. Browse all 22 tools whenever you are ready.'));
      else {
        const list = element('ul', null, 'v2-onboarding-results');
        for (const {tool, reason} of recommendations) {
          const item = element('li'), link = element('a', null, 'v2-onboarding-result');
          link.href = tool.url; link.dataset.onboardingTool = tool.id;
          link.append(element('span', tool.name, 'v2-onboarding-result-name'), element('span', reason, 'v2-onboarding-reason'));
          item.append(link); list.append(item);
        }
        content.append(list);
      }
      content.append(element('p','These tools provide educational estimates, not a financial recommendation.', 'v2-onboarding-note'));
    } else {
      const prompts = ['What are you planning?','What would you like to explore first?','How much would you like to explore?'];
      title.textContent = prompts[step]; status.textContent = `Step ${step + 1} of 3. All questions are optional.`;
      const fieldset = element('fieldset'), legend = element('legend', prompts[step], 'v2-visually-hidden');
      fieldset.append(legend);
      const options = step === 0 ? onboardingGoals : step === 1 ? questionsFor(answers.goal)
        : [{id:'focused',label:'Start with one tool'},{id:'related',label:'Explore a few related tools'}];
      for (const option of options) {
        const label = element('label', null, 'v2-onboarding-choice'), input = element('input');
        input.type = 'radio'; input.name = `onboarding-${keys[step]}`; input.value = option.id;
        input.checked = answers[keys[step]] === option.id;
        label.append(input, element('span', option.label)); fieldset.append(label);
      }
      content.append(fieldset);
    }
    title.focus();
  }
  function advance(skipped = false) {
    const key = keys[step], value = skipped ? null : content.querySelector('input:checked')?.value || null;
    if (key === 'goal' && answers.goal !== value) answers.need = null;
    answers[key] = value; step++; render();
  }
  function close() {
    answers = {}; step = 0; content.replaceChildren(); status.textContent = '';
    flow.hidden = true; start.setAttribute('aria-expanded','false'); start.focus();
  }
  start.addEventListener('click', () => {answers = {}; step = 0; flow.hidden = false; start.setAttribute('aria-expanded','true'); render();});
  next.addEventListener('click', () => advance());
  skip.addEventListener('click', () => advance(true));
  back.addEventListener('click', () => {step--; render();});
  root.querySelector('[data-onboarding-restart]').addEventListener('click', () => {answers = {}; step = 0; render();});
  root.querySelector('[data-onboarding-close]').addEventListener('click', close);
  flow.addEventListener('keydown', event => {if (event.key === 'Escape') {event.preventDefault(); close();}});
  root.querySelector('[data-onboarding-fallback]').hidden = true;
  start.hidden = false;
}
