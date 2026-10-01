
/* Resume hub routing */
(function(){
  if(document.body && document.body.dataset.resumePage==="true") return;
  const parts=window.location.pathname.split('/').filter(Boolean);
  const prefix=parts.length>1?'../':'./';
  document.querySelectorAll('a[href$="Atharva_Barad_Resume.pdf"]').forEach(a=>{
    a.href=prefix+'resume.html';
  });
})();

/* Progressive navigation and reading tools. Content remains available without JS. */
(function(){
  const nav=document.querySelector('.nav-links');
  if(nav){
    const pages=document.createElement('div');
    pages.className='nav-pages';
    pages.id='navigation-pages';
    nav.querySelectorAll('a:not(.nav-cta)').forEach(link=>pages.appendChild(link));
    nav.prepend(pages);
    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='nav-toggle';
    toggle.textContent='Menu';
    toggle.setAttribute('aria-controls',pages.id);
    toggle.setAttribute('aria-expanded','false');
    nav.insertBefore(toggle,pages);
    nav.classList.add('is-enhanced');
    function closeMenu(restoreFocus=false){
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded','false');
      if(restoreFocus) toggle.focus();
    }
    toggle.addEventListener('click',()=>{
      const open=toggle.getAttribute('aria-expanded')!=='true';
      if(open && window.portfolioSearch) window.portfolioSearch.close();
      nav.classList.toggle('is-open',open);
      toggle.setAttribute('aria-expanded',String(open));
    });
    document.addEventListener('click',event=>{if(!nav.contains(event.target)) closeMenu();});
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape' && nav.classList.contains('is-open')) closeMenu(true);
    });
    nav.addEventListener('focusout',()=>{
      requestAnimationFrame(()=>{if(!nav.contains(document.activeElement)) closeMenu();});
    });
    document.addEventListener('portfolio:search-open',()=>closeMenu());
    matchMedia('(min-width: 781px)').addEventListener('change',()=>closeMenu());
  }

  const prose=document.querySelector('.case-layout .prose');
  if(prose){
    const headings=[...prose.querySelectorAll('h2')];
    if(headings.length>=4){
      const index=document.createElement('details');
      index.className='section-index';
      const summary=document.createElement('summary');
      summary.textContent='On this page';
      const count=document.createElement('span');
      count.textContent=headings.length+' sections';
      summary.appendChild(count);
      const links=document.createElement('nav');
      links.setAttribute('aria-label','On this page');
      headings.forEach((heading,i)=>{
        if(!heading.id) heading.id='section-'+(i+1)+'-'+heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
        const link=document.createElement('a');
        link.href='#'+heading.id;
        link.textContent=heading.textContent;
        links.appendChild(link);
      });
      index.append(summary,links);
      prose.prepend(index);
    }
    prose.querySelectorAll('.result-table').forEach(table=>{
      const wrap=document.createElement('div');
      wrap.className='table-scroll';
      wrap.tabIndex=0;
      wrap.setAttribute('role','region');
      wrap.setAttribute('aria-label','Scrollable results table');
      table.before(wrap);
      wrap.appendChild(table);
    });
  }
  document.querySelectorAll('.evidence-figure > svg').forEach(svg=>{
    const viewport=document.createElement('div');
    viewport.className='figure-scroll';
    viewport.tabIndex=0;
    viewport.setAttribute('role','region');
    viewport.setAttribute('aria-label','Scrollable figure: '+(svg.getAttribute('aria-label')||'project evidence'));
    svg.before(viewport);
    viewport.appendChild(svg);
  });
  document.querySelectorAll('.resume-choice').forEach(card=>{
    const name=card.querySelector('.resume-meta').textContent.split(' · ')[0];
    card.querySelectorAll('.resume-actions a').forEach(link=>{
      link.setAttribute('aria-label',(link.hasAttribute('download')?'Download ':'Open ')+name+' PDF');
    });
  });
})();

document.querySelectorAll('[data-filter]').forEach(btn=>{
  btn.setAttribute('aria-pressed',String(btn.classList.contains('active')));
  btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false');});
    btn.classList.add('active');
    btn.setAttribute('aria-pressed','true');
    const v=btn.dataset.filter;
    document.querySelectorAll('[data-kind]').forEach(card=>{
      card.dataset.hidden=(v!=='all' && !card.dataset.kind.split(' ').includes(v))?'true':'false';
    });
  });
});


(function(){
  const moneyM=v=>{
    const sign=v<0?'-':'';
    return sign+'$'+Math.abs(v).toFixed(1)+'M';
  };
  const pct=v=>Number(v).toFixed(1)+'%';

  function initMonteCarlo(){
    const root=document.querySelector('[data-monte-carlo-explorer]');
    if(!root) return;

    const rows=[
      {income:'Low',strategy:'Aggressive',p10:-323.2,median:-268.9,p90:-170.3,positive:1.4,completion:100.0,strict:1.3,sponsor:318.3,explanation:'Sponsor support guarantees the six-warehouse rollout, but it does not rescue the underlying economics: the full P10–P90 range remains negative and only 1.4% of paths produce positive NPV. The result is maximum execution certainty paired with the largest capital exposure in the weakest reference class.'},
      {income:'Low',strategy:'Moderate',p10:-161.8,median:-139.8,p90:-107.1,positive:1.6,completion:25.1,strict:1.5,sponsor:159.4,explanation:'Staging materially reduces downside and sponsor capital versus Aggressive, but even P90 remains negative. Only 25.1% of paths complete all six warehouses and strict full-project success is 1.5%, so financing discipline cannot overcome the weak base economics.'},
      {income:'Low',strategy:'Organic',p10:-53.2,median:-42.2,p90:-27.3,positive:1.7,completion:.1,strict:.1,sponsor:53.4,explanation:'Organic produces the narrowest loss range and the least negative median by withholding later investment when retained cash is insufficient. That capital protection comes from not committing later capital when the project cannot fund the next stage: full six-warehouse completion and strict success are both about 0.1%.'},

      {income:'Lower-middle',strategy:'Aggressive',p10:-286.0,median:-166.7,p90:107.2,positive:17.7,completion:100.0,strict:17.0,sponsor:286.8,explanation:'The favorable tail finally crosses into positive value, but the median remains strongly negative. Aggressive still completes all six warehouses, so the model captures more upside when conditions are favorable while also committing substantial capital to the many paths that remain unattractive.'},
      {income:'Lower-middle',strategy:'Moderate',p10:-144.6,median:-107.2,p90:90.9,positive:17.9,completion:67.8,strict:17.7,sponsor:145.6,explanation:'Moderate keeps a meaningful positive upper tail while cutting sponsor exposure roughly in half versus Aggressive. The median is still negative, however, so this remains an exception-driven opportunity set rather than a typical positive-value case; 67.8% of paths complete the full network.'},
      {income:'Lower-middle',strategy:'Organic',p10:-46.0,median:-28.1,p90:23.0,positive:16.3,completion:3.1,strict:3.1,sponsor:49.4,explanation:'Organic compresses both upside and downside and brings the median closest to zero, but only 3.1% of paths complete all six warehouses. Some partial-expansion paths create value, yet the retained-cash rule rarely supports the intended six-store strategy.'},

      {income:'Upper-middle',strategy:'Aggressive',p10:-281.8,median:-71.3,p90:353.7,positive:38.4,completion:100.0,strict:37.1,sponsor:286.8,explanation:'Upper-middle income is the transition zone: the median is still negative, but the P90 rises to $353.7M and 38.4% of paths have positive NPV. Aggressive captures the largest upside and guarantees scale, while also preserving a wide downside range that makes named-country and site evidence important.'},
      {income:'Upper-middle',strategy:'Moderate',p10:-143.1,median:-50.0,p90:302.9,positive:39.2,completion:79.6,strict:38.7,sponsor:146.6,explanation:'Moderate preserves much of the favorable tail while reducing sponsor exposure and filtering weaker continuation states. It produces the highest strict full-project success rate in this income group at 38.7%, but the median NPV remains negative, supporting a case-by-case underwriting interpretation rather than automatic approval.'},
      {income:'Upper-middle',strategy:'Organic',p10:-43.8,median:-14.2,p90:120.7,positive:37.5,completion:9.2,strict:9.1,sponsor:50.1,explanation:'Organic limits downside and keeps the median close to break-even, but the same capital-preservation rule severely limits scale: only 9.2% of paths complete all six warehouses. Positive NPV occurs in 37.5% of paths, so positive value and full strategic completion remain distinct outcomes.'},

      {income:'High',strategy:'Aggressive',p10:-317.7,median:257.0,p90:833.2,positive:69.8,completion:100.0,strict:69.4,sponsor:322.8,explanation:'High-income economics support a strongly positive median and the largest upside in the study, while sponsor support guarantees the six-warehouse rollout. The tradeoff is the widest downside and the highest sponsor capital requirement, so Aggressive pays for execution certainty with capital exposure.'},
      {income:'High',strategy:'Moderate',p10:-159.5,median:226.9,p90:760.2,positive:70.7,completion:81.9,strict:70.6,sponsor:165.5,explanation:'Moderate keeps a strongly positive median and substantial upside while materially reducing sponsor capital. Its strict full-project success rate is slightly above Aggressive at 70.6%; the report also notes that its mean NPV is slightly higher because staged continuation filters some severe downside paths even though Aggressive has the higher median.'},
      {income:'High',strategy:'Organic',p10:-46.0,median:69.6,p90:418.4,positive:74.2,completion:19.9,strict:19.9,sponsor:57.0,explanation:'Organic has the highest probability of positive NPV in the High-income class and protects outside capital most strongly, but only 19.9% of paths complete all six warehouses. This is the clearest example of why positive enterprise value and strategic completion are not the same outcome.'}
    ];

    const incomeButtons=[...root.querySelectorAll('[data-mc-income-filter]')];
    const strategyButtons=[...root.querySelectorAll('[data-mc-strategy-filter]')];
    const svg=root.querySelector('[data-mc-figure6]');
    const analysis=root.querySelector('[data-mc-analysis]');
    let income='All';
    let strategy='All';

    const moneyM=v=>{
      const sign=v<0?'-':'';
      return sign+'$'+Math.abs(v).toFixed(1)+'M';
    };
    const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

    function renderChart(filtered){
      const W=980,H=520;
      const left=78,right=818,top=38,bottom=338;
      const yMin=-400,yMax=900;
      const ticks=[-400,-200,0,200,400,600,800];
      const y=v=>top+(yMax-v)/(yMax-yMin)*(bottom-top);
      const n=filtered.length;
      const xAt=i=>n===1?(left+right)/2:left+(right-left)*(i/(n-1));

      let out='';
      out+='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="transparent"></rect>';
      ticks.forEach(t=>{
        const yy=y(t);
        out+='<line class="mc-grid" x1="'+left+'" y1="'+yy+'" x2="'+right+'" y2="'+yy+'"></line>';
        out+='<text class="mc-y-label" x="'+(left-12)+'" y="'+(yy+4)+'" text-anchor="end">'+t+'</text>';
      });
      out+='<line class="mc-axis" x1="'+left+'" y1="'+top+'" x2="'+left+'" y2="'+bottom+'"></line>';
      out+='<line class="mc-axis" x1="'+left+'" y1="'+bottom+'" x2="'+right+'" y2="'+bottom+'"></line>';
      out+='<text class="mc-axis-title" transform="translate(20 '+((top+bottom)/2)+') rotate(-90)" text-anchor="middle">NPV ($M)</text>';
      out+='<line class="mc-zero" x1="'+left+'" y1="'+y(0)+'" x2="'+right+'" y2="'+y(0)+'"></line>';

      filtered.forEach((d,i)=>{
        const x=xAt(i), yp10=y(d.p10), ymed=y(d.median), yp90=y(d.p90);
        const label=d.income+' / '+d.strategy;
        out+='<g class="mc-scenario-mark"><title>'+esc(label)+': P10 '+esc(moneyM(d.p10))+', Median '+esc(moneyM(d.median))+', P90 '+esc(moneyM(d.p90))+'</title>';
        out+='<line class="mc-whisker" x1="'+x+'" y1="'+yp90+'" x2="'+x+'" y2="'+yp10+'"></line>';
        out+='<line class="mc-cap" x1="'+(x-7)+'" y1="'+yp90+'" x2="'+(x+7)+'" y2="'+yp90+'"></line>';
        out+='<line class="mc-cap" x1="'+(x-7)+'" y1="'+yp10+'" x2="'+(x+7)+'" y2="'+yp10+'"></line>';
        out+='<circle class="mc-median-dot" cx="'+x+'" cy="'+ymed+'" r="4.5"></circle>';
        out+='<text class="mc-x-label" x="'+x+'" y="'+(bottom+24)+'" transform="rotate(56 '+x+' '+(bottom+24)+')" text-anchor="start">'+esc(label)+'</text>';
        out+='</g>';
      });

      out+='<g class="mc-legend" transform="translate(710 15)">';
      out+='<line class="mc-whisker" x1="0" y1="0" x2="0" y2="20"></line><line class="mc-cap" x1="-6" y1="0" x2="6" y2="0"></line><line class="mc-cap" x1="-6" y1="20" x2="6" y2="20"></line><text x="13" y="14">P10–P90 range</text>';
      out+='<circle class="mc-median-dot" cx="132" cy="10" r="4.5"></circle><text x="143" y="14">Median</text>';
      out+='</g>';
      svg.setAttribute('viewBox','0 0 '+W+' '+H);
      svg.innerHTML=out;
    }

    function renderValues(filtered){
      const wrap=root.querySelector('[data-mc-values]');
      if(!wrap) return;
      if(filtered.length===1){
        const d=filtered[0];
        wrap.innerHTML=
          '<div class="mc-value-cards">'+
            '<div class="mc-value-card"><span>P10</span><strong>'+moneyM(d.p10)+'</strong></div>'+
            '<div class="mc-value-card median"><span>Median</span><strong>'+moneyM(d.median)+'</strong></div>'+
            '<div class="mc-value-card"><span>P90</span><strong>'+moneyM(d.p90)+'</strong></div>'+
          '</div>';
        return;
      }

      wrap.innerHTML=
        '<div class="mc-values-table-wrap" tabindex="0" role="region" aria-label="Scrollable Monte Carlo values"><table class="mc-values-table">'+
          '<thead><tr><th>Configuration</th><th>P10</th><th>Median</th><th>P90</th></tr></thead>'+
          '<tbody>'+filtered.map(d=>
            '<tr><td>'+esc(d.income)+' · '+esc(d.strategy)+'</td><td>'+moneyM(d.p10)+'</td><td><strong>'+moneyM(d.median)+'</strong></td><td>'+moneyM(d.p90)+'</td></tr>'
          ).join('')+'</tbody>'+
        '</table></div>';
    }

    function renderAnalysis(filtered){
      if(income!=='All' && strategy!=='All'){
        const d=filtered[0];
        analysis.innerHTML='<div class="mc-analysis-kicker">Scenario analysis · Section 7 / Appendix D</div>'+
          '<h4>'+esc(d.income)+' income · '+esc(d.strategy)+'</h4>'+
          '<p>'+esc(d.explanation)+'</p>'+
          '<div class="mc-analysis-stats">'+
            '<span><strong>P10</strong> '+moneyM(d.p10)+'</span>'+
            '<span><strong>Median</strong> '+moneyM(d.median)+'</span>'+
            '<span><strong>P90</strong> '+moneyM(d.p90)+'</span>'+
            '<span><strong>P(NPV &gt; 0)</strong> '+d.positive.toFixed(1)+'%</span>'+
            '<span><strong>6/6 by Y15</strong> '+d.completion.toFixed(1)+'%</span>'+
            '<span><strong>Strict success</strong> '+d.strict.toFixed(1)+'%</span>'+
          '</div>';
      }else if(income==='All' && strategy==='All'){
        analysis.innerHTML='<div class="mc-analysis-kicker">Figure 6 · report-level interpretation</div>'+
          '<h4>All 12 country–strategy configurations</h4>'+
          '<p>The dominant pattern is the report\'s development gradient: outcomes progress from strongly negative Low-income economics toward positive High-income economics. Strategy changes both the center and the dispersion: Aggressive generally captures the most scale and upside with the most capital exposure, Organic compresses upside and downside by withholding later investment, and Moderate usually sits between those extremes.</p>'+
          '<p class="mc-analysis-hint">Choose one income group and one strategy to see the report-based interpretation for that exact combination.</p>';
      }else{
        analysis.innerHTML='<div class="mc-analysis-kicker">Filtered Figure 6</div>'+
          '<h4>Showing '+filtered.length+' of 12 configurations</h4>'+
          '<p>The chart keeps the same P10–Median–P90 structure as Figure 6 while limiting the view to your selected '+(income!=='All'?'income group':'strategy')+'. Choose one option in the other filter to open the analysis for a specific country-type / rollout combination.</p>';
      }
    }

    function render(){
      const filtered=rows.filter(d=>(income==='All'||d.income===income)&&(strategy==='All'||d.strategy===strategy));
      renderChart(filtered);
      renderValues(filtered);
      renderAnalysis(filtered);
      incomeButtons.forEach(b=>{const active=b.dataset.mcIncomeFilter===income;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
      strategyButtons.forEach(b=>{const active=b.dataset.mcStrategyFilter===strategy;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    }

    incomeButtons.forEach(b=>b.addEventListener('click',()=>{income=b.dataset.mcIncomeFilter;render();}));
    strategyButtons.forEach(b=>b.addEventListener('click',()=>{strategy=b.dataset.mcStrategyFilter;render();}));
    render();
  }

  function initCapitalBudget(){
    const root=document.querySelector('[data-capital-budget-explorer]');
    if(!root) return;
    const scenarios={
      pessimistic:{npv:3.99,irr:9.14,label:'Accept — thin margin'},
      base:{npv:140.96,irr:25.58,label:'Proceed'},
      optimistic:{npv:326.13,irr:54.26,label:'Proceed'}
    };
    const sensitivities={
      revenue:{label:'Mature revenue',points:[['80%',94.27],['100%',140.96],['120%',187.66]]},
      variable:{label:'Variable warehouse cost',points:[['5.75%',176.18],['6.25%',140.96],['6.75%',105.75]]},
      capex:{label:'Initial CapEx multiplier',points:[['75%',163.71],['100%',140.96],['125%',118.22]]}
    };
    const buttons=[...root.querySelectorAll('[data-cb-scenario]')];
    const driver=root.querySelector('[data-cb-driver]');
    function renderScenario(key){
      const s=scenarios[key];
      root.querySelector('[data-cb-npv]').textContent=moneyM(s.npv);
      root.querySelector('[data-cb-irr]').textContent=pct(s.irr);
      root.querySelector('[data-cb-decision]').textContent=s.label;
      buttons.forEach(b=>{const active=b.dataset.cbScenario===key;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    }
    function renderSensitivity(){
      const s=sensitivities[driver.value];
      root.querySelector('[data-cb-driver-label]').textContent=s.label;
      const wrap=root.querySelector('[data-cb-bars]');
      const maxV=200;
      wrap.innerHTML=s.points.map(([label,value])=>'<div class="lab-bar-row"><span>'+label+'</span><div class="lab-bar-track"><div class="lab-bar-fill" style="width:'+Math.max(2,value/maxV*100)+'%"></div></div><strong>'+moneyM(value)+'</strong></div>').join('');
    }
    buttons.forEach(b=>b.addEventListener('click',()=>renderScenario(b.dataset.cbScenario)));
    driver.addEventListener('change',renderSensitivity);
    renderScenario('base'); renderSensitivity();
  }

  function initCountryWeights(){
    const root=document.querySelector('[data-country-weight-explorer]');
    if(!root) return;
    const avg={
      'Singapore':{b:7.4,c:7.6666667,r:7.5},
      'South Korea':{b:5.2,c:7.8333333,r:6.5},
      'Japan':{b:3.4,c:7.3333333,r:7.25}
    };
    const b=root.querySelector('[data-weight-benefits]');
    const c=root.querySelector('[data-weight-costs]');
    const r=root.querySelector('[data-weight-risks]');
    const total=root.querySelector('[data-weight-total]');
    const results=root.querySelector('[data-weight-results]');
    function render(){
      let bv=+b.value,cv=+c.value,rv=+r.value;
      const sum=bv+cv+rv;
      total.textContent=sum+'%';
      root.querySelector('[data-out-benefits]').textContent=bv+'%';
      root.querySelector('[data-out-costs]').textContent=cv+'%';
      root.querySelector('[data-out-risks]').textContent=rv+'%';
      const normalized=sum>0?{b:bv/sum,c:cv/sum,r:rv/sum}:{b:0,c:0,r:0};
      const rows=Object.entries(avg).map(([name,a])=>({name,score:a.b*normalized.b+a.c*normalized.c+a.r*normalized.r})).sort((x,y)=>y.score-x.score);
      const maxScore=10;
      results.innerHTML=rows.map((x,i)=>'<div class="rank-row"><span class="rank-pos">'+(i+1)+'</span><span class="rank-name">'+x.name+'</span><div class="lab-bar-track"><div class="lab-bar-fill" style="width:'+x.score/maxScore*100+'%"></div></div><strong>'+x.score.toFixed(2)+'</strong></div>').join('');
      root.querySelector('[data-weight-status]').textContent=sum===100?'Weights sum to 100%. Scores reproduce the original framework when set to 50 / 30 / 20.':'Weights currently sum to '+sum+'%. The explorer normalizes them proportionally for comparison.';
    }
    [b,c,r].forEach(x=>x.addEventListener('input',render));
    root.querySelector('[data-weight-reset]').addEventListener('click',()=>{b.value=50;c.value=30;r.value=20;render();});
    render();
  }

  function initUniPath(){
    const root=document.querySelector('[data-unipath-pipeline]');
    if(!root) return;
    const completeness=root.querySelector('[data-up-completeness]');
    const words=root.querySelector('[data-up-words]');
    const ai=root.querySelector('[data-up-ai]');
    const optin=root.querySelector('[data-up-optin]');
    function render(){
      const complete=+completeness.value;
      const wordCount=+words.value;
      root.querySelector('[data-up-completeness-out]').textContent=complete+'%';
      root.querySelector('[data-up-words-out]').textContent=wordCount;
      const active=complete>=40 && wordCount>=20 && ai.checked && optin.checked;
      const status=root.querySelector('[data-up-status]');
      status.innerHTML=active?'<strong>AI matched mode</strong> — hard filters run first, then semantic embeddings + cosine similarity; downstream admission likelihood remains a prototype signal.':'<strong>Fallback mode</strong> — hard filters still apply, but results are sorted by the visible composite ranking score instead of semantic AI matching.';
      root.querySelectorAll('[data-up-ai-step]').forEach(el=>{el.style.opacity=active?'1':'.38';});
      root.querySelector('[data-up-mode]').textContent=active?'AI matched':'Suggested for you';
    }
    [completeness,words].forEach(x=>x.addEventListener('input',render));
    [ai,optin].forEach(x=>x.addEventListener('change',render));
    render();
  }

  function initReporting(){
    const root=document.querySelector('[data-reporting-demo]');
    if(!root) return;
    const modes={
      complete:{
        fields:[['Date','Jun 18','good'],['Time in','9:05 AM','good'],['Time out','12:20 PM','good'],['Task','Harvesting','good'],['Evidence','Photo attached','good']],
        status:'Record is report-ready. It flows into the same Excel/Power Query reporting layer without re-entry.'
      },
      missing:{
        fields:[['Date','Jun 18','good'],['Time in','9:05 AM','good'],['Time out','Missing','bad'],['Task','Harvesting','good'],['Evidence','Photo attached','good']],
        status:'Validation catches the missing time-out before quarterly consolidation. Staff can contact the volunteer, correct the record, and then include it.'
      },
      fallback:{
        fields:[['Submission','Text message','bad'],['Hours','9:05 AM–12:20 PM','good'],['Task','Harvesting','good'],['Evidence','Sent separately','good']],
        status:'Fallback path: staff enters the texted details into the same structured record so accessibility problems do not break the reporting system.'
      }
    };
    const buttons=[...root.querySelectorAll('[data-report-mode]')];
    const record=root.querySelector('[data-report-record]');
    function render(key){
      const m=modes[key];
      record.innerHTML=m.fields.map(([label,value,state])=>'<div class="'+state+'"><small>'+label+'</small><strong>'+value+'</strong></div>').join('');
      root.querySelector('[data-report-status]').textContent=m.status;
      buttons.forEach(b=>{const active=b.dataset.reportMode===key;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    }
    buttons.forEach(b=>b.addEventListener('click',()=>render(b.dataset.reportMode)));
    render('complete');
  }

  initMonteCarlo();
  initCapitalBudget();
  initCountryWeights();
  initUniPath();
  initReporting();
})();


/* Global portfolio search */
(function(){
  const searchItems=[{"type":"page","title":"About","href":"/about.html","description":"Background, working loop, education, credentials, and capabilities.","tags":["about","education","credentials","capabilities","working loop"]},{"type":"page","title":"Experience","href":"/experience.html","description":"Professional operations, consulting, event work, and experience case studies.","tags":["experience","operations","consulting","leadership"]},{"type":"page","title":"Projects","href":"/projects.html","description":"Selected work across systems, finance, analytics, strategy, and product.","tags":["projects","portfolio","case studies"]},{"type":"page","title":"Articles","href":"/articles.html","description":"Writing on systems, modeling, finance, strategy, operations, and decision-making.","tags":["articles","writing","essays"]},{"type":"page","title":"Resume Library","href":"/resume.html","description":"One-page resumes for finance, analytics, product systems, operations, and consulting.","tags":["resume","finance resume","analytics resume","product resume","operations resume","consulting resume"]},{"type":"experience","title":"United Indians — Operations, Grants & Process Redesign","href":"/experience/united-indians.html","description":"Workflow redesign, Excel automation, grant budgeting, compliance reporting, internship leadership, and communication systems.","tags":["process redesign","program operations","excel modeling","power query","vba","grant","compliance","internship","stakeholder communication","workflow"]},{"type":"experience","title":"Business Consulting Association","href":"/experience/bca.html","description":"Client research, pricing, market analysis, case leadership, strategic recommendations, and deliverable QA.","tags":["consulting","strategy","stakeholder research","market research","pricing","leadership","client research","decision support"]},{"type":"experience","title":"N&M Events — Live Event Operations","href":"/experience/nm-events.html","description":"Setup, logistics, inventory, layouts, transportation, and real-time coordination under changing requirements.","tags":["operations","event operations","logistics","coordination","contingency","program operations"]},{"type":"project","title":"Modeling International Expansion Under Uncertainty","href":"/projects/monte-carlo.html","description":"15-year Monte Carlo expansion framework across 120,000 simulated paths, 23 stochastic variables, financing, rollout strategy, and valuation.","tags":["monte carlo","python","model validation","npv","irr","wacc","finance","simulation","dependence modeling","international expansion","decision science"]},{"type":"project","title":"System — A Local-First Personal Analytics Platform","href":"/projects/system.html","description":"Kotlin Multiplatform product spanning requirements, local-first data, sync/history semantics, analytics, testing, and AI-assisted development.","tags":["product requirements","kotlin multiplatform","sql","postgresql","sqldelight","supabase","regression testing","ai-assisted workflows","local-first","product","relational modeling"]},{"type":"project","title":"Capital Budgeting for a Five-Warehouse Expansion","href":"/projects/costco-capital-budgeting.html","description":"Incremental cash-flow modeling, sensitivity, WACC, NPV/IRR, downside analysis, and financing decisions.","tags":["capital budgeting","excel modeling","npv","irr","wacc","finance","sensitivity","model validation","costco"]},{"type":"project","title":"Valuing Apple When the Methods Disagree","href":"/projects/apple-valuation.html","description":"FCFF DCF, dividend discount, peer P/E, WACC, reconciliation, and interpretation of conflicting valuation methods.","tags":["apple","valuation","dcf","fcff","ddm","p/e","wacc","finance","excel modeling","model validation"]},{"type":"project","title":"Screening Singapore for Costco Market Entry","href":"/projects/costco-singapore.html","description":"Country screening, pricing and financial research, localization, operating constraints, and decision-framework QA.","tags":["costco singapore","international strategy","country screening","strategy","excel modeling","model validation","market entry"]},{"type":"project","title":"UniPath — AI-Assisted Student Lifecycle Platform","href":"/projects/unipath.html","description":"34-table PostgreSQL schema, Python proof of concept, ranking, semantic matching, admissions estimates, and academic-risk workflows.","tags":["unipath","python","sql","postgresql","relational modeling","product requirements","ai","database","semantic matching"]},{"type":"project","title":"WEBTOON — Strategy as an Activity System","href":"/projects/webtoon.html","description":"Organizational structure, Five Forces, competitive dynamics, value-chain analysis, and strategic synthesis.","tags":["webtoon","strategy","five forces","value chain","competitive analysis","research"]},{"type":"project","title":"Visionaire — Product Economics for Smart Glasses","href":"/projects/visionaire.html","description":"Pricing, startup costs, revenue and expense projections, break-even, and early-stage product economics.","tags":["visionaire","product economics","pricing","break-even","excel modeling","smart glasses"]},{"type":"article","title":"Automating orchestration without automating judgment","href":"/articles/ai-orchestration.html","description":"Durable worker state, task contracts, handoffs, validation, and human review in AI-assisted development.","tags":["ai-assisted workflows","product requirements","regression testing","system","orchestration"]},{"type":"article","title":"Historical truth is a product requirement","href":"/articles/historical-truth-is-a-product-requirement.html","description":"Why identity, sync, history, and analytics semantics have to agree before a product can be trusted.","tags":["product requirements","regression testing","sql","postgresql","relational modeling","system","local-first"]},{"type":"article","title":"Digitizing a workflow is not the same as improving it","href":"/articles/workflow-redesign.html","description":"Validation, correction paths, information reuse, and the difference between digitizing and redesigning an operating process.","tags":["process redesign","program operations","excel modeling","united indians","workflow","power query"]},{"type":"article","title":"Making the work visible is part of doing the work","href":"/articles/make-the-work-visible.html","description":"Communication as a trust, alignment, and correction mechanism in collaborative work.","tags":["program operations","stakeholder communication","leadership","united indians"]},{"type":"article","title":"A model can run and still be wrong","href":"/articles/model-can-run-and-still-be-wrong.html","description":"Separating data, calibration, economic logic, implementation, and documentation failures.","tags":["model validation","python","monte carlo","debugging","governance"]},{"type":"article","title":"Why dependence modeling became the hardest part","href":"/articles/dependence-modeling.html","description":"Empirical marginals, rank dependence, PSD repair, temporal persistence, and joint-system validation.","tags":["monte carlo","python","model validation","dependence modeling","correlation"]},{"type":"article","title":"When financing constraints change the strategy itself","href":"/articles/financing-changes-strategy.html","description":"Why financing capacity can change the realized expansion path, not just the discount rate.","tags":["monte carlo","finance","npv","irr","wacc","strategy","financing"]},{"type":"article","title":"A positive NPV is not the end of the decision","href":"/articles/capital-budgeting-under-downside.html","description":"Sensitivity, downside analysis, operating controls, and capital-allocation decisions.","tags":["capital budgeting","npv","irr","wacc","excel modeling","model validation","finance"]},{"type":"article","title":"When valuation methods disagree, don’t average them","href":"/articles/valuation-disagreement.html","description":"Why FCFF, DDM, peer P/E, and market price can tell different economic stories.","tags":["valuation","dcf","fcff","ddm","p/e","finance","apple"]},{"type":"article","title":"A weighted score is not a strategy","href":"/articles/scores-vs-decisions.html","description":"Why ranking frameworks help only when their tradeoffs, assumptions, and governance remain visible.","tags":["strategy","country screening","model validation","costco singapore","decision framework"]},{"type":"article","title":"AI confidence is not user trust","href":"/articles/ai-confidence-is-not-user-trust.html","description":"Explainability, hard constraints, fallback behavior, and honest boundaries around probabilistic outputs.","tags":["product requirements","python","ai-assisted workflows","unipath","ai","trust"]},{"type":"article","title":"Strategy frameworks are better when they connect","href":"/articles/activity-systems-beat-framework-checklists.html","description":"Turning separate strategy analyses into a coherent activity system.","tags":["strategy","webtoon","consulting","stakeholder research","synthesis"]},{"type":"article","title":"Robust decisions beat perfect forecasts","href":"/articles/robust-decisions-under-incomplete-information.html","description":"Ranges, downside, reversibility, and decisions that remain acceptable under incomplete information.","tags":["model validation","process redesign","product requirements","decision-making","uncertainty","operations"]}];
  searchItems.push(...[{"type": "page", "title": "Atharva Barad — Home", "href": "/index.html", "description": "Selected work across systems, analytics, finance, product, and operations.", "tags": ["home", "atharva barad"]}, {"type": "project", "title": "CommuteWise", "href": "/projects.html#commutewise", "description": "Public team release; requirements consolidation, integration review, manual/user testing, bug identification, and release validation.", "tags": ["commutewise", "fastapi", "maps", "qa", "requirements", "software", "product"]}, {"type": "project", "title": "Database Systems", "href": "/projects.html#database-systems", "description": "Coursework / team project: schemas, ERDs, parameterized queries, transactions, and application integration.", "tags": ["css 475", "database", "sql", "postgresql", "python", "data", "relational modeling"]}, {"type": "project", "title": "Tableau Data Visualization", "href": "/projects.html#tableau", "description": "Public academic visualization project demonstrating dashboard and storytelling exposure.", "tags": ["tableau", "data visualization", "dashboard", "data"]}]);
  const nav=document.querySelector('.nav-links');
  const header=document.querySelector('.site-header');
  if(!nav||!header||document.querySelector('[data-global-search-trigger]')) return;

  const resumeLink=nav.querySelector('.nav-cta');
  const trigger=document.createElement('button');
  trigger.type='button';
  trigger.className='global-search-trigger';
  trigger.setAttribute('data-global-search-trigger','');
  trigger.setAttribute('aria-label','Search portfolio');
  trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-controls','global-search-dropdown');
  trigger.innerHTML='<span class="global-search-icon" aria-hidden="true"></span><span class="global-search-label">Search</span>';
  nav.insertBefore(trigger,resumeLink||null);

  const dropdown=document.createElement('div');
  dropdown.className='global-search-dropdown';
  dropdown.id='global-search-dropdown';
  dropdown.hidden=true;
  dropdown.innerHTML='<div class="shell global-search-shell"><div class="global-search-panel" role="search">'+
    '<div class="global-search-input-row"><span class="global-search-large-icon" aria-hidden="true"></span><input type="search" autocomplete="off" spellcheck="false" aria-label="Search portfolio" placeholder="Search projects, experience, articles, skills…"><button type="button" class="global-search-close" aria-label="Close search">Close</button></div>'+
    '<div class="global-search-controls"><div class="global-search-types" aria-label="Filter search results"><button type="button" class="active" data-global-search-type="all">All</button><button type="button" data-global-search-type="experience">Experience</button><button type="button" data-global-search-type="project">Projects</button><button type="button" data-global-search-type="article">Articles</button><button type="button" data-global-search-type="page">Pages</button></div><span class="global-search-status" aria-live="polite"></span></div>'+
    '<div class="global-search-results"></div><div class="global-search-empty" hidden>No matches. Try a broader term.</div>'+
    '<div class="global-search-hint"><span><kbd>/</kbd> search</span><span><kbd>Esc</kbd> close</span></div>'+
    '</div></div>';
  header.appendChild(dropdown);

  const input=dropdown.querySelector('input');
  const close=dropdown.querySelector('.global-search-close');
  const results=dropdown.querySelector('.global-search-results');
  const empty=dropdown.querySelector('.global-search-empty');
  const status=dropdown.querySelector('.global-search-status');
  const typeButtons=[...dropdown.querySelectorAll('[data-global-search-type]')];
  let type='all';

  const norm=s=>(s||'').toLowerCase().replace(/[–—]/g,'-').replace(/\s+\/\s+/g,' ').trim();
  // Prepare searchable text once, not on every keystroke.
  const index=searchItems.map(item=>{
    const title=norm(item.title),desc=norm(item.description),tags=(item.tags||[]).map(norm);
    return {item,title,desc,tags,haystack:[title,desc,...tags].join(' ')};
  });
  let returnFocus=trigger;
  let pendingRender=0;
  let lastRenderKey='';
  const label=t=>({experience:'Experience',project:'Project',article:'Article',page:'Page'}[t]||t);

  function score(entry,q,terms){
    if(!q) return entry.item.type==='page'?2:1;
    const {title,desc,tags,haystack}=entry;
    if(!terms.every(term=>haystack.includes(term))) return -1;
    let s=0;
    if(title.includes(q)) s+=20;
    if(title.startsWith(q)) s+=12;
    if(tags.some(tag=>tag===q)) s+=16;
    terms.forEach(term=>{
      if(title.includes(term)) s+=8;
      if(tags.some(tag=>tag.includes(term))) s+=6;
      if(desc.includes(term)) s+=2;
    });
    return s;
  }

  function render(){
    const q=norm(input.value);
    const key=type+'|'+q;
    if(key===lastRenderKey) return;
    lastRenderKey=key;
    const terms=q.split(/\s+/).filter(Boolean);
    const allMatches=index.filter(entry=>type==='all'||entry.item.type===type)
      .map(entry=>({item:entry.item,score:score(entry,q,terms)})).filter(x=>x.score>=0)
      .sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title));
    const matches=allMatches.slice(0,q?10:8);

    results.innerHTML=matches.map(({item})=>
      '<a class="global-search-result" href="'+item.href+'"><span class="global-search-result-type">'+label(item.type)+'</span><span class="global-search-result-copy"><strong>'+item.title+'</strong><small>'+item.description+'</small></span><span class="global-search-result-arrow" aria-hidden="true">→</span></a>'
    ).join('');
    empty.hidden=matches.length!==0;
    status.textContent=q?(allMatches.length>matches.length?'Showing '+matches.length+' of '+allMatches.length+' results':allMatches.length+' result'+(allMatches.length===1?'':'s')):'Featured links';
    results.scrollTop=0;
    typeButtons.forEach(btn=>{const active=btn.dataset.globalSearchType===type;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
  }

  function openSearch(query){
    if(dropdown.hidden) returnFocus=document.activeElement;
    document.dispatchEvent(new Event('portfolio:search-open'));
    dropdown.hidden=false;
    trigger.setAttribute('aria-expanded','true');
    if(typeof query==='string'){input.value=query;type='all';}
    render();
    requestAnimationFrame(()=>{if(!dropdown.hidden) input.focus({preventScroll:true});});
  }
  function closeSearch(restoreFocus=false){
    cancelAnimationFrame(pendingRender);
    dropdown.hidden=true;
    trigger.setAttribute('aria-expanded','false');
    if(restoreFocus && returnFocus && returnFocus.isConnected) returnFocus.focus({preventScroll:true});
  }

  trigger.addEventListener('click',()=>dropdown.hidden?openSearch(''):closeSearch());
  close.addEventListener('click',()=>closeSearch(true));
  input.addEventListener('input',()=>{cancelAnimationFrame(pendingRender);pendingRender=requestAnimationFrame(render);});
  dropdown.addEventListener('keydown',event=>{
    if(event.key!=='ArrowDown' && event.key!=='ArrowUp' && event.key!=='Enter') return;
    if(pendingRender){cancelAnimationFrame(pendingRender);render();}
    const links=[...results.querySelectorAll('a')];
    const current=links.indexOf(document.activeElement);
    if(event.key==='Enter' && document.activeElement===input && links.length){event.preventDefault();links[0].click();}
    else if((document.activeElement===input || current>=0) && event.key!=='Enter'){
      event.preventDefault();
      const next=current+(event.key==='ArrowDown'?1:-1);
      if(next<0) input.focus({preventScroll:true});
      else if(links.length) links[Math.min(next,links.length-1)].focus({preventScroll:true});
      if(document.activeElement!==input) document.activeElement.scrollIntoView({block:'nearest'});
    }
  });
  header.addEventListener('focusout',()=>{requestAnimationFrame(()=>{
    if(!dropdown.hidden && !dropdown.contains(document.activeElement) && document.activeElement!==trigger) closeSearch();
  });});
  typeButtons.forEach(btn=>btn.addEventListener('click',()=>{type=btn.dataset.globalSearchType;render();input.focus();}));

  document.addEventListener('click',event=>{
    const capability=event.target.closest('[data-global-search-query]');
    if(capability){
      event.preventDefault();
      openSearch(capability.dataset.globalSearchQuery||capability.textContent.trim());
      return;
    }
    if(!dropdown.hidden&&!dropdown.contains(event.target)&&!trigger.contains(event.target)) closeSearch();
  });

  document.addEventListener('keydown',event=>{
    const active=document.activeElement;
    const typing=active&&(active.tagName==='INPUT'||active.tagName==='TEXTAREA'||active.isContentEditable);
    if(event.key==='/'&&!typing){event.preventDefault();openSearch('');}
    else if(event.key==='Escape'&&!dropdown.hidden){event.preventDefault();closeSearch(true);}
  });

  window.portfolioSearch={open:openSearch,close:closeSearch};
  render();
})();
