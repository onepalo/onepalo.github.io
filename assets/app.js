(function(){
  const body = document.body;
  const cinematicBtn = document.getElementById('cinematicBtn');
  const recruiterBtn = document.getElementById('recruiterBtn');
  const recruiterView = document.getElementById('recruiterView');
  const cinematicView = document.getElementById('cinematicView');
  const cv = document.getElementById('cv');
  const depthBadge = document.getElementById('depthBadge');
  const drill = document.querySelector('.drill');
  const fixedRig = document.querySelector('.fixed-rig');
  const drillPill = document.getElementById('drillPill');
  const drillPillDate = document.getElementById('drillPillDate');
  const drillPillLayer = document.getElementById('drillPillLayer');
  const layers = Array.from(document.querySelectorAll('.layer'));

  let activeIndex = -1;

  function updateViewSwitchVisibility(){
    body.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  function setMode(mode){
    const recruiter = mode === 'recruiter';
    body.classList.toggle('recruiter-mode', recruiter);
    updateViewSwitchVisibility();

    cinematicBtn.classList.toggle('active', !recruiter);
    recruiterBtn.classList.toggle('active', recruiter);
    cinematicBtn.setAttribute('aria-pressed', String(!recruiter));
    recruiterBtn.setAttribute('aria-pressed', String(recruiter));

    if(recruiter){
      body.classList.remove('in-cv', 'past-cv');
      document.documentElement.style.setProperty('--rig-clip-inset-bottom', '0px');
    }

    requestAnimationFrame(() => {
      if(recruiter){
        recruiterView.scrollIntoView({behavior:'smooth', block:'start'});
      } else {
        const target = cinematicView || cv;
        target.scrollIntoView({behavior:'smooth', block:'start'});
        updateScroll();
      }
    });
  }

  cinematicBtn.addEventListener('click', function(){ setMode('cinematic'); });
  recruiterBtn.addEventListener('click', function(){ setMode('recruiter'); });
  document.getElementById('recruiterViewLink')?.addEventListener('click', function(event){
    event.preventDefault();
    setMode('recruiter');
  });

  function syncDrillPill(index){
    const activeYear = layers[index]?.dataset.label?.match(/\d{4}/)?.[0] || '';
    const activeDepth = layers[index]?.querySelector('.period .depth')?.textContent.trim() || '';
    if(drillPillDate && activeYear) drillPillDate.textContent = activeYear;
    if(drillPillLayer && activeDepth) drillPillLayer.textContent = activeDepth;
  }

  function activate(index){
    activeIndex = index;
    layers.forEach((layer,i)=>layer.classList.toggle('active', i===index));
    syncDrillPill(index);
    if(layers[index]){
      if(depthBadge) depthBadge.textContent = layers[index].dataset.label || 'Career depth';
    }
  }

  function updateScroll(){
    updateViewSwitchVisibility();

    if(body.classList.contains('recruiter-mode')){
      body.classList.remove('in-cv');
      body.classList.remove('past-cv');
      return;
    }

    const rect = cv.getBoundingClientRect();
    const lastLayerRect = layers[layers.length - 1]?.getBoundingClientRect();
    const pastLastLayerThreshold = window.matchMedia('(max-width: 600px)').matches ? 0.36 : 0.18;
    const pastLastLayer = lastLayerRect ? lastLayerRect.bottom < window.innerHeight * pastLastLayerThreshold : false;
    const layerInView = layers.some((layer) => {
      const layerRect = layer.getBoundingClientRect();
      return layerRect.top < window.innerHeight * 0.92 && layerRect.bottom > window.innerHeight * 0.08;
    });
    body.classList.toggle('in-cv', layerInView || (rect.top < window.innerHeight * 0.72 && rect.bottom > 0));
    body.classList.toggle('past-cv', pastLastLayer);
    const max = rect.height - window.innerHeight;
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(max, 1)));
    document.documentElement.style.setProperty('--scroll', progress.toFixed(4));

    const desiredDrillY = window.innerHeight * (0.16 + progress * 0.74);
    const drillHeight = drill ? drill.getBoundingClientRect().height : 112;
    const visualTipOffset = drillHeight * 0.95;
    const sandstoneStop = lastLayerRect && lastLayerRect.bottom < window.innerHeight
      ? window.innerHeight - visualTipOffset - 24
      : desiredDrillY;
    const minDrillY = window.innerHeight * 0.12;
    const drillY = Math.max(minDrillY, Math.min(desiredDrillY, sandstoneStop));
    document.documentElement.style.setProperty('--drill-y', `${drillY.toFixed(1)}px`);

    const clippingFinalLayer = lastLayerRect && lastLayerRect.top < window.innerHeight && lastLayerRect.bottom < window.innerHeight;
    if(clippingFinalLayer){
      const sandstoneBoundary = Math.max(0, Math.min(window.innerHeight, lastLayerRect.bottom));
      const rigRect = fixedRig?.getBoundingClientRect();
      const rigInset = rigRect ? Math.max(0, rigRect.bottom - sandstoneBoundary) : 0;
      document.documentElement.style.setProperty('--rig-clip-inset-bottom', `${rigInset.toFixed(1)}px`);
    } else {
      document.documentElement.style.setProperty('--rig-clip-inset-bottom', '0px');
    }

    let best = Infinity;
    let nextIndex = 0;

    if(!layerInView){
      layers.forEach((layer)=>layer.classList.remove('active'));
      activeIndex = -1;
      return;
    }

    layers.forEach((layer,i)=>{
      const r = layer.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const distance = Math.abs(center - window.innerHeight * 0.52);
      if(distance < best){
        best = distance;
        nextIndex = i;
      }
    });

    if(nextIndex !== activeIndex) activate(nextIndex);
  }

  window.addEventListener('scroll', updateScroll, {passive:true});
  window.addEventListener('resize', updateScroll);
  updateViewSwitchVisibility();
  updateScroll();
})();

