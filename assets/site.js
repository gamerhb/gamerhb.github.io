
document.querySelectorAll('[data-filter]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
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
    const data={
      'Low':{
        'Aggressive':[-323.2,-268.9,-170.3,1.4,-3.0,20.6,.65,10.3,16.7,100,6,0,0,318.3,0,1.3],
        'Moderate':[-161.8,-139.8,-107.1,1.6,-6.0,20.6,.56,12.1,7.5,25.1,4,100,30,159.4,7.1,1.5],
        'Organic':[-53.2,-42.2,-27.3,1.7,-.6,20.6,.87,9.2,19.5,.1,1,100,71,53.4,0,.1]
      },
      'Lower-middle':{
        'Aggressive':[-286.0,-166.7,107.2,17.7,6.5,17.6,1.91,10.0,57.5,100,6,0,0,286.8,0,17.0],
        'Moderate':[-144.6,-107.2,90.9,17.9,5.3,17.6,1.51,13.6,42.1,67.8,6,96.9,12,145.6,24.3,17.7],
        'Organic':[-46.0,-28.1,23.0,16.3,5.8,17.6,1.51,11.4,55.4,3.1,2,100,66,49.4,0,3.1]
      },
      'Upper-middle':{
        'Aggressive':[-281.8,-71.3,353.7,38.4,12.2,15.3,3.28,10.1,72.7,100,6,0,0,286.8,0,37.1],
        'Moderate':[-143.1,-50.0,302.9,39.2,12.4,15.3,3.10,14.1,65.6,79.6,6,89.1,5,146.6,31.9,38.7],
        'Organic':[-43.8,-14.2,120.7,37.5,11.7,15.3,2.07,14.0,65.4,9.2,2,100,58,50.1,0,9.1]
      },
      'High':{
        'Aggressive':[-317.7,257.0,833.2,69.8,17.6,10.4,5.77,11.3,76.8,100,6,0,0,322.8,0,69.4],
        'Moderate':[-159.5,226.9,760.2,70.7,18.6,10.4,5.92,15.7,73.3,81.9,6,74.4,2,165.5,55.8,70.6],
        'Organic':[-46.0,69.6,418.4,74.2,19.1,10.4,3.59,16.6,76.8,19.9,3,100,51,57.0,0,19.9]
      }
    };
    const income=root.querySelector('[data-mc-income]');
    const strategyBtns=[...root.querySelectorAll('[data-mc-strategy]')];
    let strategy='Moderate';
    const min=-350,max=850,scale=v=>Math.max(0,Math.min(100,(v-min)/(max-min)*100));
    const set=(sel,value)=>{const el=root.querySelector(sel); if(el) el.textContent=value;};
    function render(){
      const d=data[income.value][strategy];
      set('[data-mc-median]',moneyM(d[1]));
      set('[data-mc-positive]',pct(d[3]));
      set('[data-mc-strict]',pct(d[15]));
      set('[data-mc-complete]',pct(d[9]));
      set('[data-mc-irr]',pct(d[4]));
      set('[data-mc-wacc]',pct(d[5]));
      set('[data-mc-moic]',d[6].toFixed(2)+'x');
      set('[data-mc-sponsor]',moneyM(d[13]));
      set('[data-mc-debt]',moneyM(d[14]));
      const range=root.querySelector('[data-mc-range]');
      const line=range.querySelector('.range-line');
      const dot=range.querySelector('.range-dot');
      const zero=range.querySelector('.zero-line');
      const labels=[...range.querySelectorAll('.range-labels span')];
      const p10=scale(d[0]),med=scale(d[1]),p90=scale(d[2]);
      line.style.left=p10+'%'; line.style.width=Math.max(1,p90-p10)+'%';
      dot.style.left='calc('+med+'% - 7px)';
      zero.style.left=scale(0)+'%';
      labels[0].textContent='P10 '+moneyM(d[0]);
      labels[1].textContent='Median '+moneyM(d[1]);
      labels[2].textContent='P90 '+moneyM(d[2]);

      const labelRow=range.querySelector('.range-labels');
      let leaders=range.querySelector('.range-leaders');
      if(!leaders){
        leaders=document.createElementNS('http://www.w3.org/2000/svg','svg');
        leaders.setAttribute('class','range-leaders');
        leaders.setAttribute('aria-hidden','true');
        leaders.innerHTML='<defs><marker id="range-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#61635f"></path></marker></defs><path class="range-leader" marker-end="url(#range-arrow)"></path><path class="range-leader" marker-end="url(#range-arrow)"></path><path class="range-leader" marker-end="url(#range-arrow)"></path>';
        range.appendChild(leaders);
      }
      requestAnimationFrame(()=>{
        const width=labelRow.clientWidth;
        if(!width) return;
        const anchors=[p10,med,p90].map(v=>v/100*width);
        const widths=labels.map(el=>el.offsetWidth);
        const edge=10;
        const gap=12;
        let centers=anchors.map((x,i)=>Math.max(edge+widths[i]/2,Math.min(width-edge-widths[i]/2,x)));

        for(let pass=0;pass<3;pass++){
          for(let i=1;i<centers.length;i++){
            const minimum=centers[i-1]+widths[i-1]/2+gap+widths[i]/2;
            if(centers[i]<minimum) centers[i]=minimum;
          }
          const rightLimit=width-edge-widths[2]/2;
          if(centers[2]>rightLimit){
            const shift=centers[2]-rightLimit;
            centers=centers.map(x=>x-shift);
          }
          for(let i=centers.length-2;i>=0;i--){
            const maximum=centers[i+1]-widths[i+1]/2-gap-widths[i]/2;
            if(centers[i]>maximum) centers[i]=maximum;
          }
          const leftLimit=edge+widths[0]/2;
          if(centers[0]<leftLimit){
            const shift=leftLimit-centers[0];
            centers=centers.map(x=>x+shift);
          }
        }

        labels.forEach((label,i)=>{label.style.left=centers[i]+'px';});
        leaders.setAttribute('viewBox','0 0 '+width+' 44');
        [...leaders.querySelectorAll('.range-leader')].forEach((path,i)=>{
          const displaced=Math.abs(centers[i]-anchors[i])>6;
          path.style.opacity=displaced?'1':'0';
          const mid=(centers[i]+anchors[i])/2;
          path.setAttribute('d','M '+centers[i]+' 38 Q '+mid+' 24 '+anchors[i]+' 6');
        });
      });
      strategyBtns.forEach(b=>b.classList.toggle('active',b.dataset.mcStrategy===strategy));
      const note=root.querySelector('[data-mc-interpretation]');
      if(note){
        let txt='';
        if(income.value==='Low') txt='The full P10–P90 value range remains negative. Strategy mainly changes capital exposure and completion behavior.';
        else if(income.value==='Lower-middle') txt='Median value remains negative, but the upper tail crosses into positive territory. Favorable cases exist without being typical.';
        else if(income.value==='Upper-middle') txt='This is the transition zone: negative median value with a substantial positive upper tail and much stronger strict-success frequency.';
        else txt='Median value is positive under all three strategies, but P10 remains negative—so the class is a screening signal, not automatic approval.';
        note.textContent=txt;
      }
    }
    income.addEventListener('change',render);
    strategyBtns.forEach(b=>b.addEventListener('click',()=>{strategy=b.dataset.mcStrategy;render();}));
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
      buttons.forEach(b=>b.classList.toggle('active',b.dataset.cbScenario===key));
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
      buttons.forEach(b=>b.classList.toggle('active',b.dataset.reportMode===key));
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
