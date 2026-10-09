import { store } from '../core/data.js?v=202610090840';
import { esc } from '../core/fmt.js?v=202610090840';
import { card, pageHead, icon } from '../core/ui.js?v=202610090840';

const ITEMS = [
    'Trend klar definiert (Higher Highs / Lower Lows)',
    'Entry Level bestätigt (Support / Resistance)',
    'Volume Confirmation vorhanden',
    'Risk/Reward mindestens 1:2',
    'Stop Loss logisch platziert',
    'Position Size berechnet (max 1 bis 2% Risk)',
    'Keine FOMO, kein Revenge Trade',
    'News / Events gecheckt',
];
const KEY = 'c2_checklist_state';
const today = () => new Date().toISOString().slice(0, 10);
function load() {
    const raw = store.get(KEY, {}) || {};
    return raw.date === today() && Array.isArray(raw.done) ? new Set(raw.done) : new Set();
}

export default {
    styles: `
        .tc-kopf { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; flex-wrap: wrap; margin-bottom: 14px; }
        .tc-track { height: 10px; border-radius: 99px; background: var(--bg); box-shadow: var(--sh-in); overflow: hidden; }
        .tc-fill { height: 100%; width: 0; border-radius: 99px; background: var(--grad); transition: width .6s var(--ease); }
        .tc-list { display: grid; gap: 10px; margin-top: 24px; }
        .tc-item { display: flex; align-items: center; gap: 16px; padding: 16px 18px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); cursor: pointer; text-align: left; width: 100%;
            border: 1px solid transparent; transition: border-color .3s var(--ease), background .3s var(--ease), transform .25s var(--ease); }
        .tc-item:hover { transform: translateX(3px); }
        .tc-box { width: 26px; height: 26px; border-radius: 9px; flex: none; display: grid; place-items: center; background: var(--surface); box-shadow: var(--sh-sm); color: transparent;
            transition: background .3s var(--ease), color .3s var(--ease), transform .35s var(--ease-spring); }
        .tc-box svg { width: 15px; height: 15px; }
        .tc-label { font-size: .95rem; color: var(--ink-2); transition: color .3s var(--ease); }
        .tc-item.done { border-color: color-mix(in srgb, var(--up) 40%, transparent); background: color-mix(in srgb, var(--up) 7%, var(--bg)); }
        .tc-item.done .tc-box { background: var(--up); color: var(--surface); transform: scale(1.08); }
        .tc-item.done .tc-label { color: var(--ink); }`,
    render(root) {
        const state = load();
        root.classList.add('stack');
        root.innerHTML = pageHead('Trading', 'Trade-Check', 'Bevor du auf den Buy-Button drückst. Hake ab, was wirklich bestätigt ist.') +
            card({ eyebrow: 'Discipline Protocol', title: 'Pre-Trade Checklist', body: `
                <div class="tc-kopf"><div class="big num" id="tcZahl">0 / ${ITEMS.length}</div><div class="eyebrow" id="tcText">0 / ${ITEMS.length} bestätigt</div></div>
                <div class="tc-track"><div class="tc-fill" id="tcFill"></div></div>
                <div class="tc-list" id="tcList">${ITEMS.map((txt, i) =>
                    `<button type="button" class="tc-item${state.has(i) ? ' done' : ''}" data-idx="${i}" aria-pressed="${state.has(i)}"><span class="tc-box">${icon('check')}</span><span class="tc-label">${esc(txt)}</span></button>`).join('')}</div>` });

        const list = root.querySelector('#tcList');
        const progress = () => {
            const total = ITEMS.length, done = list.querySelectorAll('.tc-item.done').length;
            root.querySelector('#tcFill').style.width = (done / total) * 100 + '%';
            root.querySelector('#tcZahl').textContent = done + ' / ' + total;
            root.querySelector('#tcText').textContent = done + ' / ' + total + ' bestätigt';
            root.querySelector('#tcText').style.color = done === total ? 'var(--up)' : '';
        };
        list.onclick = e => {
            const item = e.target.closest('.tc-item');
            if (!item) return;
            item.classList.toggle('done');
            item.setAttribute('aria-pressed', item.classList.contains('done'));
            store.set(KEY, { date: today(), done: [...list.querySelectorAll('.tc-item.done')].map(el => +el.dataset.idx) });
            progress();
        };
        requestAnimationFrame(progress);
    },
};
