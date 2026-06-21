(function(){
  const body = document.body;
  const cinematicBtn = document.getElementById('cinematicBtn');
  const recruiterBtn = document.getElementById('recruiterBtn');
  const recruiterView = document.getElementById('recruiterView');
  const cv = document.getElementById('cv');
  const depthBadge = document.getElementById('depthBadge');
  const drill = document.querySelector('.drill');
  const fixedRig = document.querySelector('.fixed-rig');
  const yearNav = document.querySelector('.year-nav');
  const mobileNav = document.querySelector('.mobile-nav');
  const drillPill = document.getElementById('drillPill');
  const drillPillDate = document.getElementById('drillPillDate');
  const drillPillLayer = document.getElementById('drillPillLayer');
  const layers = Array.from(document.querySelectorAll('.layer'));
  const yearBtns = Array.from(document.querySelectorAll('.year-btn'));
  const mobileBtns = Array.from(document.querySelectorAll('.mobile-nav .nav-trigger'));

  let activeIndex = -1;
  let lastCinematicTarget = 'layer-1';

  function setMode(mode){
    const recruiter = mode === 'recruiter';
    body.classList.toggle('recruiter-mode', recruiter);

    cinematicBtn.classList.toggle('active', !recruiter);
    recruiterBtn.classList.toggle('active', recruiter);
    cinematicBtn.setAttribute('aria-pressed', String(!recruiter));
    recruiterBtn.setAttribute('aria-pressed', String(recruiter));

    if(recruiter){
      body.classList.remove('in-cv', 'past-cv');
      document.documentElement.style.setProperty('--rig-clip-inset-bottom', '0px');
      document.documentElement.style.setProperty('--year-clip-inset-bottom', '0px');
      document.documentElement.style.setProperty('--mobile-nav-clip-inset-bottom', '0px');
    }

    requestAnimationFrame(() => {
      if(recruiter){
        recruiterView.scrollIntoView({behavior:'smooth', block:'start'});
      } else {
        const target = document.getElementById(lastCinematicTarget) || cv;
        target.scrollIntoView({behavior:'smooth', block:'center'});
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

  function syncNav(index){
    yearBtns.forEach((b,i)=>b.classList.toggle('active', i===index));
    mobileBtns.forEach((b,i)=>b.classList.toggle('active', i===index));
    const activeYear = yearBtns[index]?.textContent.trim() || mobileBtns[index]?.textContent.trim() || '';
    const activeDepth = layers[index]?.querySelector('.period .depth')?.textContent.trim() || '';
    const compactDepth = activeDepth.replace(/Depth\s+0*/i, 'Layer-');
    if(drillPillDate && activeYear) drillPillDate.textContent = activeYear;
    if(drillPillLayer && compactDepth) drillPillLayer.textContent = compactDepth;
  }

  function activate(index){
    activeIndex = index;
    layers.forEach((layer,i)=>layer.classList.toggle('active', i===index));
    syncNav(index);
    if(layers[index]){
      if(depthBadge) depthBadge.textContent = layers[index].dataset.label || 'Career depth';
      lastCinematicTarget = layers[index].id;
    }
  }

  function updateScroll(){
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
      const yearNavRect = yearNav?.getBoundingClientRect();
      const mobileNavRect = mobileNav?.getBoundingClientRect();
      const rigInset = rigRect ? Math.max(0, rigRect.bottom - sandstoneBoundary) : 0;
      const yearInset = yearNavRect ? Math.max(0, yearNavRect.bottom - sandstoneBoundary) : 0;
      const mobileInset = mobileNavRect ? Math.max(0, mobileNavRect.bottom - sandstoneBoundary) : 0;
      document.documentElement.style.setProperty('--rig-clip-inset-bottom', `${rigInset.toFixed(1)}px`);
      document.documentElement.style.setProperty('--year-clip-inset-bottom', `${yearInset.toFixed(1)}px`);
      document.documentElement.style.setProperty('--mobile-nav-clip-inset-bottom', `${mobileInset.toFixed(1)}px`);
    } else {
      document.documentElement.style.setProperty('--rig-clip-inset-bottom', '0px');
      document.documentElement.style.setProperty('--year-clip-inset-bottom', '0px');
      document.documentElement.style.setProperty('--mobile-nav-clip-inset-bottom', '0px');
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

  function goToLayer(id){
    const target = document.getElementById(id);
    if(!target) return;
    body.classList.remove('recruiter-mode');
    cinematicBtn.classList.add('active');
    recruiterBtn.classList.remove('active');
    cinematicBtn.setAttribute('aria-pressed', 'true');
    recruiterBtn.setAttribute('aria-pressed', 'false');
    lastCinematicTarget = id;
    const mobileLayout = window.matchMedia('(max-width: 600px)').matches;
    const scrollTarget = mobileLayout ? target.querySelector('.card') || target : target;
    if(mobileLayout){
      const navRect = mobileNav?.getBoundingClientRect();
      const offset = Math.max(82, (navRect?.bottom || 0) + 18);
      const top = window.scrollY + scrollTarget.getBoundingClientRect().top - offset;
      window.scrollTo({top:Math.max(0, top), behavior:'smooth'});
    } else {
      scrollTarget.scrollIntoView({behavior:'smooth', block:'center'});
    }
    setTimeout(updateScroll, 260);
    setTimeout(updateScroll, 900);
  }

  document.addEventListener('click', function(event){
    const trigger = event.target.closest('.nav-trigger');
    if(!trigger) return;
    event.preventDefault();
    goToLayer(trigger.dataset.target);
  });

  window.addEventListener('scroll', updateScroll, {passive:true});
  window.addEventListener('resize', updateScroll);
  updateScroll();
})();

