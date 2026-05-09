/* =====================================================
   Hey Milano — Dashboard
   Render + interazione (vanilla JS)
   ===================================================== */

(function () {
  const D = window.HM_DATA;
  if (!D) { console.error('HM_DATA non caricato'); return; }

  // ----- filtro vista -----
  // Mostriamo tutte le assemblee Svolta o Confermata, anche quelle senza data
  // (bilaterali informali, riunioni ristrette senza data definita).
  // Sono escluse: le "Da programmare" (ipotesi future) e le annullate.
  // I dati grezzi restano in data.js: il filtro è solo a video.
  D.assemblee = D.assemblee.filter(a =>
    a.stato === 'Svolta' || a.stato === 'Confermata'
  );

  // ----- helpers -----
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const slug = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const monthsIT = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
  const fmtDate = iso => {
    if (!iso) return null;
    const d = new Date(iso);
    return { day: d.getDate(), month: monthsIT[d.getMonth()], year: d.getFullYear() };
  };
  const fmtDateLong = iso => {
    if (!iso) return 'Data da definire';
    const d = new Date(iso);
    return `${d.getDate()} ${monthsIT[d.getMonth()]} ${d.getFullYear()}`;
  };
  const themeMap = Object.fromEntries(D.temi.map(t => [t.nome, t.colore]));

  // ----- META -----
  $('#meta-data').textContent = D.meta.aggiornamento;
  $('#cta-workspace').href = D.meta.workspaceUrl;
  $('#footer-data-date').textContent = `aggiornato il ${D.meta.aggiornamento}`;

  // ----- KPI -----
  const counts = {
    totale: D.assemblee.length,
    svolte: D.assemblee.filter(a => a.stato === 'Svolta').length,
    confermate: D.assemblee.filter(a => a.stato === 'Confermata' && !a.daVerificare).length,
    daVerificare: D.assemblee.filter(a => a.daVerificare).length,
    contributi: D.contributi.length,
    promotori: new Set(D.assemblee.map(a => a.promotore).filter(Boolean)).size,
    temiAttivi: new Set(D.assemblee.flatMap(a => a.temi).concat(D.contributi.flatMap(c => c.temi))).size,
    sitoPubblicate: D.assemblee.filter(a => a.sito === 'Pubblicato').length
  };

  const kpiHtml = `
    <div class="kpi dark">
      <div class="kpi-label">Assemblee svolte</div>
      <div class="kpi-value">${counts.svolte}</div>
      <div class="kpi-meta">incontri confermati realizzati</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Prossime in calendario</div>
      <div class="kpi-value accent">${counts.confermate}</div>
      <div class="kpi-meta">confermate fino al Congresso</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Da verificare</div>
      <div class="kpi-value">${counts.daVerificare}</div>
      <div class="kpi-meta">svoltesi ma in attesa di conferma</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Contributi raccolti</div>
      <div class="kpi-value">${counts.contributi}</div>
      <div class="kpi-meta">vocali, verbali, documenti</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Realtà coinvolte</div>
      <div class="kpi-value">${counts.promotori}</div>
      <div class="kpi-meta">promotori distinti</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Temi attivi</div>
      <div class="kpi-value">${counts.temiAttivi}<span style="font-size:.4em; opacity:.5">/${D.temi.length}</span></div>
      <div class="kpi-meta">su 15 temi chiave</div>
    </div>
  `;
  $('#kpi-grid').innerHTML = kpiHtml;

  // ----- CHART: Stato (donut) -----
  const drawCharts = () => {
    if (!window.Chart) { setTimeout(drawCharts, 100); return; }

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#000';

    // Stato
    new Chart($('#chart-stato'), {
      type: 'doughnut',
      data: {
        labels: ['Svolte', 'Confermate'],
        datasets: [{
          data: [counts.svolte, counts.confermate],
          backgroundColor: ['#16794D', '#ED9220'],
          borderColor: '#000',
          borderWidth: 2
        }]
      },
      options: {
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 18, font: { size: 12, weight: 600 }, boxWidth: 14, boxHeight: 14 }
          },
          tooltip: { backgroundColor: '#000', padding: 12, cornerRadius: 0, displayColors: false }
        },
        maintainAspectRatio: false
      }
    });

    // Top realtà più attive (assemblee + contributi combinati)
    const promCount = {};

    // Assemblee: conta per promotore (prende il primo soggetto se multipli con +//)
    D.assemblee.forEach(a => {
      const p = (a.promotore || 'Da definire').split(/\s*[+\/]\s*/)[0].trim();
      promCount[p] = (promCount[p] || 0) + 1;
    });

    // Contributi: conta per fonte (prende il primo nome, esclude note parentetiche)
    D.contributi.forEach(c => {
      if (!c.fonte) return;
      const f = c.fonte.split(/\s*[—,\/\(]\s*/)[0].trim();
      if (!f) return;
      promCount[f] = (promCount[f] || 0) + 1;
    });

    const topProm = Object.entries(promCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
    new Chart($('#chart-promotori'), {
      type: 'bar',
      data: {
        labels: topProm.map(([n]) => n.length > 28 ? n.slice(0, 26) + '…' : n),
        datasets: [{
          data: topProm.map(([, c]) => c),
          backgroundColor: '#ED9220',
          borderColor: '#000',
          borderWidth: 1.5,
          borderRadius: 0
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#000', padding: 12, cornerRadius: 0, displayColors: false,
            callbacks: {
              label: ctx => `${ctx.raw} tra assemblee e contributi`
            }
          }
        },
        scales: {
          x: { grid: { color: '#E6E6E6' }, ticks: { stepSize: 1, font: { size: 11 } } },
          y: { grid: { display: false }, ticks: { font: { size: 12, weight: 500 } } }
        },
        maintainAspectRatio: false
      }
    });
  };
  drawCharts();

  // ----- ASSEMBLEE LIST -----
  const filterStati = ['Tutte', 'Svolta', 'Confermata', 'Da verificare'];
  const filterBar = $('#filter-bar');
  filterBar.innerHTML = filterStati.map((s, i) => {
    let count;
    if (s === 'Tutte') count = counts.totale;
    else if (s === 'Svolta') count = counts.svolte;
    else if (s === 'Confermata') count = counts.confermate;
    else if (s === 'Da verificare') count = counts.daVerificare;
    else count = 0;
    return `<button class="filter-chip ${i === 0 ? 'active' : ''}" data-filter="${s}">${s} (${count})</button>`;
  }).join('');

  const contribByAssemblea = {};
  D.contributi.forEach(c => {
    if (c.assembleaUrl) {
      if (!contribByAssemblea[c.assembleaUrl]) contribByAssemblea[c.assembleaUrl] = [];
      contribByAssemblea[c.assembleaUrl].push(c);
    }
  });

  const sortAssemblee = arr => [...arr].sort((a, b) => {
    if (!a.data && !b.data) return 0;
    if (!a.data) return 1;
    if (!b.data) return -1;
    return new Date(b.data) - new Date(a.data);
  });

  const renderAssembleeList = (filter = 'Tutte') => {
    const list = $('#assemblea-list');
    let arr;
    if (filter === 'Tutte') arr = D.assemblee;
    else if (filter === 'Da verificare') arr = D.assemblee.filter(a => a.daVerificare);
    else if (filter === 'Confermata') arr = D.assemblee.filter(a => a.stato === 'Confermata' && !a.daVerificare);
    else arr = D.assemblee.filter(a => a.stato === filter);
    const sorted = sortAssemblee(arr);
    list.innerHTML = sorted.map(a => {
      const fd = fmtDate(a.data);
      const dateBlock = fd
        ? `<div class="assemblea-date"><span class="day">${fd.day}</span><span class="month">${fd.month}</span></div>`
        : `<div class="assemblea-date tbd">Data<br>da definire</div>`;
      const stato = slug(a.stato);
      const statoLabel = a.daVerificare ? 'Da verificare' : a.stato;
      const statoClass = a.daVerificare ? 'da-verificare' : stato;
      const tags = (a.temi || []).map(t => `<span class="tag" style="border-color:${themeMap[t]||'#000'}">${t}</span>`).join('');
      const contribs = contribByAssemblea[a.url] || [];
      const contribBlock = contribs.length
        ? `<div class="assemblea-contributi">
             <div class="assemblea-contributi-label">Contributi collegati (${contribs.length})</div>
             ${contribs.map(c => `
               <a class="contrib-link" href="${c.url}" target="_blank" rel="noopener">
                 <span class="tipo">${c.tipo || 'Altro'}</span>
                 <span class="titolo">${c.nome}</span>
                 <span class="arrow">↗</span>
               </a>`).join('')}
           </div>`
        : '';
      return `
        <article class="assemblea">
          ${dateBlock}
          <div class="assemblea-body">
            <h3 class="assemblea-title"><a href="${a.url}" target="_blank" rel="noopener">${a.nome}</a></h3>
            <div class="assemblea-meta">
              ${a.luogo ? `<span>${a.luogo}</span>` : ''}
              ${a.promotore ? `<span>${a.promotore}</span>` : ''}
              ${a.sito ? `<span>Sito: ${a.sito}</span>` : ''}
            </div>
            ${tags ? `<div class="assemblea-tags">${tags}</div>` : ''}
          </div>
          <div class="assemblea-status ${statoClass}">${statoLabel}</div>
          ${contribBlock}
        </article>
      `;
    }).join('');
  };
  renderAssembleeList();

  filterBar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    $$('.filter-chip', filterBar).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAssembleeList(btn.dataset.filter);
  });

  // ----- TEMI -----
  const themeFreq = {};
  D.temi.forEach(t => themeFreq[t.nome] = { assemblee: 0, contributi: 0 });
  D.assemblee.forEach(a => (a.temi || []).forEach(t => themeFreq[t] && themeFreq[t].assemblee++));
  D.contributi.forEach(c => (c.temi || []).forEach(t => themeFreq[t] && themeFreq[t].contributi++));

  const themeArr = D.temi.map(t => ({
    nome: t.nome,
    colore: t.colore,
    assemblee: themeFreq[t.nome].assemblee,
    contributi: themeFreq[t.nome].contributi,
    totale: themeFreq[t.nome].assemblee + themeFreq[t.nome].contributi
  })).sort((a, b) => b.totale - a.totale);

  const maxTheme = Math.max(...themeArr.map(t => t.totale), 1);
  $('#theme-list').innerHTML = themeArr.map(t => `
    <div class="theme-row">
      <div class="theme-name" style="border-left: 4px solid ${t.colore}; padding-left: 10px;">${t.nome}</div>
      <div class="theme-bar"><div class="theme-bar-fill" style="width:${(t.totale / maxTheme) * 100}%; background:${t.colore};"></div></div>
      <div class="theme-count">${t.totale}</div>
    </div>
  `).join('');

  $('#themes-grid').innerHTML = themeArr.map(t => `
    <div class="theme-card">
      <div class="theme-card-head">
        <div class="theme-dot" style="background:${t.colore};"></div>
        <div class="theme-card-title">${t.nome}</div>
      </div>
      <div class="theme-card-count">${t.totale}</div>
      <div class="theme-card-meta">${t.assemblee} assemblee · ${t.contributi} contributi</div>
    </div>
  `).join('');

  // ----- CONTRIBUTI -----
  const sortContrib = [...D.contributi].sort((a, b) => {
    if (!a.data && !b.data) return 0;
    if (!a.data) return 1;
    if (!b.data) return -1;
    return new Date(b.data) - new Date(a.data);
  });
  $('#contrib-list').innerHTML = sortContrib.map(c => {
    const tipoSlug = slug(c.tipo);
    const prioSlug = slug(c.priorita);
    const tags = (c.temi || []).map(t => `<span class="tag" style="border-color:${themeMap[t]||'#000'}">${t}</span>`).join('');
    return `
      <article class="contrib-item">
        <div class="contrib-head">
          <span class="contrib-pill tipo-${tipoSlug}">${c.tipo || 'Altro'}</span>
          ${c.priorita ? `<span class="contrib-priorita ${prioSlug}">priorità ${c.priorita.toLowerCase()}</span>` : ''}
          <span>${fmtDateLong(c.data)}</span>
        </div>
        <h3 class="contrib-title"><a href="${c.url}" target="_blank" rel="noopener">${c.nome}</a></h3>
        ${c.fonte ? `<div class="contrib-fonte">Fonte: ${c.fonte}</div>` : ''}
        ${c.sintesi ? `<p class="contrib-sintesi">${c.sintesi}</p>` : ''}
        ${tags ? `<div class="contrib-tags">${tags}</div>` : ''}
      </article>
    `;
  }).join('');

})();
