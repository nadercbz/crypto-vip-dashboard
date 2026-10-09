import { coin, signal } from '../core/data.js?v=202610090840';
import { esc, fUsd, fBig, fNum } from '../core/fmt.js?v=202610090840';
import { card, pageHead, seg } from '../core/ui.js?v=202610090840';

const st = { coin: '', atr: 1.5, cap: '10000', risk: '1', entry: '100', stop: '95' };

const box = (k, v, sub, farbe) => `<div class="rc-box"><div class="eyebrow">${k}</div>
    <div class="rc-v num"${farbe ? ` style="color:${farbe}"` : ''}>${v}</div>${sub ? `<div class="rc-s">${sub}</div>` : ''}</div>`;

const spanneVon = r => r && r.vol30 ? (r.vol30 / Math.sqrt(365)) / 100 : null;

function nachkomma(v) {
    const a = Math.abs(v);
    if (!a || !isFinite(a)) return 2;
    return Math.min(14, Math.max(a < 1 ? 6 : 2, 3 - Math.floor(Math.log10(a))));
}
const feldWert = (v, d = nachkomma(v)) => v.toFixed(d);
const fPreis = v => (v == null || isNaN(v) || Math.abs(v) >= 1) ? fUsd(v)
    : '$' + v.toLocaleString('de-DE', { minimumFractionDigits: nachkomma(v), maximumFractionDigits: nachkomma(v) });

export default {
    styles: `
        .rc-top { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 22px; }
        .rc-info { font-size: .8rem; color: var(--ink-3); transition: color .3s var(--ease); }
        .rc-info.ok { color: var(--up); } .rc-info.fehler { color: var(--down); }
        .rc-form { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
        .rc-form label { display: block; margin-bottom: 8px; }
        .rc-form .input { font-family: var(--mono); }
        .rc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
        .rc-box { padding: 18px 20px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); }
        .rc-v { font-size: 1.5rem; font-weight: 300; letter-spacing: -.02em; margin-top: 10px; line-height: 1.1; transition: color .3s var(--ease); }
        .rc-s { font-size: .74rem; color: var(--ink-3); margin-top: 6px; line-height: 1.45; }
        @media (max-width: 1180px) { .rc-form { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 860px) { .rc-form { grid-template-columns: minmax(0, 1fr); } }`,
    render(root) {
        root.classList.add('stack');
        const feld = (id, label, key, step = 'any') => `<div><label class="eyebrow" for="${id}">${label}</label><input class="input" type="number" inputmode="decimal" id="${id}" data-k="${key}" value="${esc(st[key])}"${step ? ` step="${step}"` : ''}></div>`;
        root.innerHTML = pageHead('Trading', 'Positionsrechner', 'Rechne präzise deine Größe aus. Wähl einen Coin, dann kommen Kurs und ein Stop-Vorschlag aus der gemessenen Volatilität. Der Rest ist Disziplin.') +
            card({ eyebrow: 'Risk Management', title: 'Position Size Calculator', body: `
                <div class="rc-top">
                    <div style="flex:1;min-width:200px;max-width:240px"><input class="input" id="rcCoin" type="text" placeholder="Coin wählen, z.B. BTC" autocomplete="off" value="${esc(st.coin)}"></div>
                    ${seg('rcatr', [['1', 'Stop 1x Tagesspanne'], ['1.5', '1,5x'], ['2', '2x']], String(st.atr))}
                    <span class="rc-info" id="rcInfo"></span>
                </div>
                <div class="rc-form">
                    ${feld('rcCap', 'Account Kapital ($)', 'cap')}${feld('rcRisk', 'Risiko pro Trade (%)', 'risk', '0.1')}
                    ${feld('rcEntry', 'Entry Preis ($)', 'entry')}${feld('rcStop', 'Stop Loss ($)', 'stop')}
                </div>` }) +
            card({ eyebrow: 'Ergebnis', body: `<div class="rc-grid" id="rcResult"></div>` }) +
            `<div id="rcExtraWrap" hidden>${card({ eyebrow: 'Einordnung', body: `<div class="rc-grid" id="rcExtra"></div>` })}</div>`;

        const $ = id => root.querySelector('#' + id);
        const zahl = k => parseFloat(st[k]) || 0;

        function calcPosition() {
            const cap = zahl('cap'), risk = zahl('risk'), entry = zahl('entry'), stop = zahl('stop');
            const out = $('rcResult');
            if (!cap || !risk || !entry || !stop || entry === stop) {
                out.innerHTML = `<div class="empty" style="grid-column:1/-1">Bitte alle Felder ausfüllen.</div>`;
                return;
            }
            const riskAmount = cap * (risk / 100);
            const priceDiff = Math.abs(entry - stop);
            const units = riskAmount / priceDiff;
            const posValue = units * entry;
            const leverage = posValue / cap;
            out.innerHTML = box('Risiko', '$' + fNum(riskAmount, 2), fNum(risk, risk % 1 ? 1 : 0) + '% vom Kapital') +
                box('Positions-Einheiten', fNum(units, 4)) +
                box('Positionsgröße', '$' + fNum(posValue, 2)) +
                box('Effektiver Hebel', fNum(leverage, 2) + 'x');
        }

        function calcExtra(c, r, tagesSpanne) {
            const kapital = zahl('cap'), risikoProz = zahl('risk'), entry = zahl('entry'), stop = zahl('stop');
            const risikoBetrag = kapital * risikoProz / 100;
            const abstand = entry - stop;
            const menge = abstand > 0 ? risikoBetrag / abstand : 0;
            const einsatz = menge * entry;
            const anteil = kapital ? einsatz / kapital * 100 : 0;
            const teile = [];
            if (einsatz > 0) {
                teile.push(box('Einsatz', fBig(einsatz), fNum(anteil, 0) + '% vom Kapital',
                    anteil > 40 ? 'var(--down)' : anteil > 20 ? 'var(--warn)' : 'var(--up)'));
                teile.push(box('Stop-Abstand', fNum(abstand / entry * 100, 2) + '%',
                    fPreis(abstand) + ' pro Einheit' + (tagesSpanne ? ', ' + fNum((abstand / entry) / tagesSpanne, 1) + 'x Tagesspanne' : '')));
            }
            if (r) {
                teile.push(box('Volatilität', r.vol30 != null ? fNum(r.vol30, 0) + '%' : '—', 'annualisiert'));
                teile.push(box('RSI', r.rsi != null ? fNum(r.rsi, 0) : '—',
                    r.rsi >= 70 ? 'überkauft, Rücksetzer möglich' : r.rsi <= 32 ? 'überverkauft' : 'neutral'));
                if (r.beta != null) teile.push(box('Beta zu BTC', fNum(r.beta, 2),
                    r.beta > 1.3 ? 'bewegt sich stärker als Bitcoin' : r.beta < 0.8 ? 'ruhiger als Bitcoin' : 'läuft mit Bitcoin'));
                if (tagesSpanne && entry) {
                    const z1 = entry * (1 + tagesSpanne * 2), z2 = entry * (1 + tagesSpanne * 3);
                    teile.push(box('Ziele', fPreis(z1) + ' / ' + fPreis(z2),
                        'zwei und drei Tagesspannen, Verhältnis ' + (abstand > 0 ? fNum((z1 - entry) / abstand, 1) + ' zu 1' : '—')));
                }
            }
            $('rcExtra').innerHTML = teile.join('');
            $('rcExtraWrap').hidden = !teile.length;
        }

        function extraAusFeldern() {
            const c = st.coin.trim() ? coin(st.coin.trim()) : null;
            const r = c ? signal(c.symbol) : null;
            calcExtra(c, r, spanneVon(r));
        }

        function coinSetzen(sym) {
            const c = coin(sym), info = $('rcInfo');
            if (!c) { info.textContent = 'Coin nicht gefunden.'; info.className = 'rc-info fehler'; return; }
            const r = signal(c.symbol);
            const preis = c.current_price;
            if (preis == null || isNaN(preis)) { info.textContent = 'Kein Kurs für diesen Coin.'; info.className = 'rc-info fehler'; return; }
            let d = nachkomma(preis);
            st.entry = feldWert(preis, d);
            const tagesSpanne = spanneVon(r);
            if (tagesSpanne) {
                const wert = preis - preis * tagesSpanne * st.atr;
                while (d < 14 && feldWert(wert, d) === feldWert(preis, d)) d++;
                st.entry = feldWert(preis, d);
                st.stop = feldWert(wert, d);
                $('rcStop').value = st.stop;
            } else {
                st.stop = '';
                $('rcStop').value = '';
            }
            $('rcEntry').value = st.entry;
            calcPosition();
            info.className = 'rc-info ok';
            info.textContent = c.name + ' bei ' + fPreis(preis) + (tagesSpanne ? ', übliche Tagesspanne ' + fNum(tagesSpanne * 100, 1) + '%' : '. Keine Volatilitätsdaten, bitte den Stop selbst setzen.');
            calcExtra(c, r, tagesSpanne);
        }

        $('rcCoin').oninput = e => {
            st.coin = e.target.value;
            const t = st.coin.trim();
            if (t.length >= 2) coinSetzen(t);
        };
        root.querySelectorAll('.rc-form input').forEach(inp => {
            inp.oninput = () => { st[inp.dataset.k] = inp.value; calcPosition(); extraAusFeldern(); };
        });
        root.querySelector('[data-seg="rcatr"]').onclick = e => {
            const b = e.target.closest('button');
            if (!b) return;
            st.atr = parseFloat(b.dataset.v);
            root.querySelectorAll('[data-seg="rcatr"] button').forEach(x => x.classList.toggle('on', x === b));
            if (st.coin.trim()) coinSetzen(st.coin.trim());
        };

        calcPosition();
        const c0 = st.coin.trim().length >= 2 ? coin(st.coin.trim()) : null;
        if (c0) {
            const ts = spanneVon(signal(c0.symbol));
            $('rcInfo').className = 'rc-info ok';
            $('rcInfo').textContent = c0.name + ' bei ' + fPreis(c0.current_price) + (ts ? ', übliche Tagesspanne ' + fNum(ts * 100, 1) + '%' : '');
        }
        extraAusFeldern();
    },
};
