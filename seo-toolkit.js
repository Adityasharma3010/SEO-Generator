// ---------- THEME TOGGLE ----------
(function(){
  const root = document.documentElement;
  const darkBtn = document.getElementById('themeDark');
  const lightBtn = document.getElementById('themeLight');

  function applyTheme(theme){
    if(theme === 'light'){ root.setAttribute('data-theme','light'); }
    else{ root.removeAttribute('data-theme'); }
    darkBtn.classList.toggle('active', theme !== 'light');
    lightBtn.classList.toggle('active', theme === 'light');
    try{ localStorage.setItem('seo-toolkit-theme', theme); }catch(e){}
  }

  let saved = 'dark';
  try{ saved = localStorage.getItem('seo-toolkit-theme') || 'dark'; }catch(e){}
  applyTheme(saved);

  darkBtn.addEventListener('click', () => applyTheme('dark'));
  lightBtn.addEventListener('click', () => applyTheme('light'));
})();

// ---------- CUSTOM CURSOR ----------
(function(){
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if(!dot || !ring) return;
  let ringX = 0, ringY = 0, mouseX = 0, mouseY = 0;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  });

  function animateRing(){
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Grow the ring over interactive elements
  document.addEventListener('mouseover', e => {
    if(e.target.closest('button, a, input, textarea, .tab, .copy')){
      document.body.classList.add('cursor-active');
    }
  });
  document.addEventListener('mouseout', e => {
    if(e.target.closest('button, a, input, textarea, .tab, .copy')){
      document.body.classList.remove('cursor-active');
    }
  });

  // Click ripple effect
  document.addEventListener('mousedown', e => {
    ring.classList.add('clicking');
    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    ripple.style.left = e.clientX + 'px';
    ripple.style.top = e.clientY + 'px';
    document.body.appendChild(ripple);
    setTimeout(()=> ripple.remove(), 500);
  });
  document.addEventListener('mouseup', () => ring.classList.remove('clicking'));
})();

function copyText(id){
  const el = document.getElementById(id);
  navigator.clipboard.writeText(el.innerText);
  const btn = event.target;
  const orig = btn.innerText;
  btn.innerText = 'Copied!';
  setTimeout(()=> btn.innerText = orig, 1200);
}

function buildMetaPackage(topic, keyword, brand, year){
  const kwTitle = titleCase(keyword);
  const yearPart = year ? ` ${year}` : '';

  const titles = [
    `${kwTitle}${yearPart} – Complete Guide | ${brand}`,
    `${kwTitle}: Everything You Need to Know${yearPart}`,
    `${kwTitle}${yearPart} – Steps, Tips & FAQ | ${brand}`
  ].map(t => t.length > 60 ? t.slice(0,57) + '...' : t);

  const descriptions = [
    `Complete guide to ${keyword} — step-by-step instructions, common issues, and answers to frequently asked questions. Updated${yearPart ? ' for ' + year : ''}.`,
    `Looking for help with ${keyword}? This guide covers everything from the basics to troubleshooting, so you know exactly what to expect.`
  ].map(d => d.length > 160 ? d.slice(0,157) + '...' : d);

  return {titles, descriptions, keyword: keyword.toLowerCase()};
}

function renderMetaPackage(pkg, titlesElId, descElId, fkElId, prefix){
  const titlesEl = document.getElementById(titlesElId);
  titlesEl.innerHTML = pkg.titles.map((t,i) => `
    <div class="result">
      <button class="copy" onclick="copyText('${prefix}t${i}')">Copy</button>
      <div class="val" id="${prefix}t${i}">${t}</div>
      <div class="charcount ${t.length<=60?'ok':'bad'}">${t.length} / 60 characters</div>
    </div>
  `).join('');

  const descEl = document.getElementById(descElId);
  descEl.innerHTML = pkg.descriptions.map((d,i) => `
    <div class="result">
      <button class="copy" onclick="copyText('${prefix}d${i}')">Copy</button>
      <div class="val" id="${prefix}d${i}">${d}</div>
      <div class="charcount ${d.length>=150 && d.length<=160?'ok':'bad'}">${d.length} / 150-160 characters</div>
    </div>
  `).join('');

  document.getElementById(fkElId).innerText = pkg.keyword;
}

// Pulls a topic, focus keyword guess, and brand name straight out of pasted HTML —
// no manual typing needed when you're using the Checklist Analyzer.
const STOPWORDS = new Set(['a','an','the','and','or','but','of','to','in','on','for','with','is','are','how','what','your','you','at','from','by','it','this','that','as','be','can']);

function extractTopicFromDoc(doc, pageUrl){
  const h1 = doc.querySelector('h1');
  const titleTag = doc.querySelector('title');
  const titleText = titleTag ? titleTag.textContent.trim() : '';

  // Topic: prefer H1 text, fall back to title tag
  let topic = h1 ? h1.textContent.trim() : titleText;
  topic = topic.replace(/\s+/g,' ').trim();

  // Brand: try the tail of the title tag after a separator ( - , | , – )
  let brand = '';
  const sepMatch = titleText.match(/[-|–]\s*([^-|–]+)$/);
  if(sepMatch) brand = sepMatch[1].trim();
  if(!brand && pageUrl){
    try{ brand = new URL(pageUrl).hostname.replace('www.',''); }catch(e){ brand = ''; }
  }
  if(!brand) brand = 'Site';

  // Keyword: take the topic, strip stopwords/punctuation, keep first 4-6 meaningful words
  const words = topic.toLowerCase().replace(/[^\w\s]/g,'').split(/\s+/).filter(w => w && !STOPWORDS.has(w));
  const keyword = words.slice(0,5).join(' ') || topic.toLowerCase();

  return {topic, keyword, brand};
}

function titleCase(str){
  return str.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
}

// ---------- CHECKLIST ANALYZER ----------
function runChecklist(){
  const html = document.getElementById('check-html').value;
  const pageUrl = document.getElementById('check-url').value.trim();
  if(!html.trim()){
    alert('Paste the page HTML source first.');
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Auto-generate meta suggestions from the page's own content first
  const extracted = extractTopicFromDoc(doc, pageUrl);
  const pkg = buildMetaPackage(extracted.topic, extracted.keyword, extracted.brand, '');
  renderMetaPackage(pkg, 'check-titles', 'check-descriptions', 'check-fk', 'c');
  document.getElementById('check-extract-note').innerText =
    `Pulled from: H1/title "${extracted.topic.slice(0,70)}${extracted.topic.length>70?'...':''}" — brand guessed as "${extracted.brand}". Edit the copied text if the keyword needs tightening.`;

  const checks = [];

  // 1. Title tag
  const titleEl = doc.querySelector('title');
  const titleText = titleEl ? titleEl.textContent.trim() : '';
  if(!titleText){
    checks.push({status:'fail', title:'Title tag', detail:'No <title> tag found on the page.'});
  } else if(titleText.length < 30 || titleText.length > 65){
    checks.push({status:'warn', title:'Title tag', detail:`Found: "${titleText}" (${titleText.length} chars). Recommended range is 50-60 characters.`});
  } else {
    checks.push({status:'pass', title:'Title tag', detail:`"${titleText}" (${titleText.length} chars) — good length.`});
  }

  // 2. Meta description
  const metaDesc = doc.querySelector('meta[name="description"]');
  const descContent = metaDesc ? metaDesc.getAttribute('content') || '' : '';
  if(!metaDesc || !descContent.trim()){
    checks.push({status:'fail', title:'Meta description', detail:'No meta description found — Google will auto-pull a snippet from body text instead.'});
  } else if(descContent.length < 140 || descContent.length > 165){
    checks.push({status:'warn', title:'Meta description', detail:`Found (${descContent.length} chars): "${descContent}". Recommended range is 150-160 characters.`});
  } else {
    checks.push({status:'pass', title:'Meta description', detail:`(${descContent.length} chars) — good length.`});
  }

  // 3. Canonical
  const canonicalEl = doc.querySelector('link[rel="canonical"]');
  const canonicalHref = canonicalEl ? canonicalEl.getAttribute('href') : '';
  if(!canonicalEl){
    checks.push({status:'fail', title:'Canonical tag', detail:'No canonical tag found.'});
  } else if(pageUrl && canonicalHref && !canonicalHref.replace(/\/$/,'') .includes(pageUrl.replace(/\/$/,'').replace(/^https?:\/\//,''))){
    checks.push({status:'warn', title:'Canonical tag', detail:`Canonical points to "${canonicalHref}" — doesn't clearly match the URL you entered. Double-check it's self-referencing.`});
  } else {
    checks.push({status:'pass', title:'Canonical tag', detail:`Points to: ${canonicalHref}`});
  }

  // 4. Meta robots / noindex
  const metaRobots = doc.querySelector('meta[name="robots"]');
  const robotsContent = metaRobots ? (metaRobots.getAttribute('content') || '').toLowerCase() : '';
  if(robotsContent.includes('noindex')){
    checks.push({status:'fail', title:'Meta robots', detail:`Found "noindex" — this page is telling Google NOT to index it. Remove unless intentional.`});
  } else {
    checks.push({status:'pass', title:'Meta robots', detail: metaRobots ? `Content: "${robotsContent}"` : 'No robots meta tag found — defaults to indexable, which is fine.'});
  }

  // 5. H1 count and order
  const h1s = doc.querySelectorAll('h1');
  if(h1s.length === 0){
    checks.push({status:'fail', title:'H1 heading', detail:'No H1 found on the page.'});
  } else if(h1s.length > 1){
    checks.push({status:'fail', title:'H1 heading', detail:`Found ${h1s.length} H1 tags — should be exactly one per page.`});
  } else {
    checks.push({status:'pass', title:'H1 heading', detail:`Exactly one H1: "${h1s[0].textContent.trim().slice(0,80)}"`});
  }

  // Heading order check
  const headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => parseInt(h.tagName[1]));
  let skipped = false;
  for(let i=1;i<headings.length;i++){
    if(headings[i] - headings[i-1] > 1) skipped = true;
  }
  checks.push({
    status: skipped ? 'warn' : 'pass',
    title: 'Heading order',
    detail: skipped ? 'A heading level appears to be skipped (e.g. H2 straight to H4) somewhere on the page.' : 'Heading levels appear to follow a logical order.'
  });

  // 6. Nav/footer links to # or same-page anchors
  const allLinks = Array.from(doc.querySelectorAll('a[href]'));
  const brokenLinks = allLinks.filter(a => {
    const href = a.getAttribute('href');
    return href === '#' || href === '' || href === 'javascript:void(0)';
  });
  if(brokenLinks.length > 0){
    checks.push({status:'fail', title:'Broken/placeholder links', detail:`Found ${brokenLinks.length} link(s) pointing to "#" or empty — these go nowhere. Examples: ${brokenLinks.slice(0,3).map(a=>`"${a.textContent.trim().slice(0,25)}"`).join(', ')}`});
  } else {
    checks.push({status:'pass', title:'Broken/placeholder links', detail:'No "#" or empty href links found.'});
  }

  // Self-referencing links (only meaningful if pageUrl given)
  if(pageUrl){
    const cleanPageUrl = pageUrl.replace(/\/$/,'');
    const selfLinks = allLinks.filter(a => {
      const href = a.getAttribute('href') || '';
      return href.replace(/\/$/,'') === cleanPageUrl && a.textContent.trim().length > 0;
    });
    if(selfLinks.length > 0){
      checks.push({status:'warn', title:'Self-referencing links', detail:`Found ${selfLinks.length} link(s) in body text pointing back to this same page — no SEO value, consider removing or pointing elsewhere.`});
    }
  }

  // 7. Image alt text
  const imgs = Array.from(doc.querySelectorAll('img'));
  const missingAlt = imgs.filter(img => !img.getAttribute('alt') || img.getAttribute('alt').trim() === '');
  if(imgs.length === 0){
    checks.push({status:'warn', title:'Image alt text', detail:'No <img> tags found in the pasted source (page may load images via JS/CSS background).'});
  } else if(missingAlt.length > 0){
    checks.push({status:'fail', title:'Image alt text', detail:`${missingAlt.length} of ${imgs.length} images are missing alt text.`});
  } else {
    checks.push({status:'pass', title:'Image alt text', detail:`All ${imgs.length} images have alt text set.`});
  }

  // 8. Width/height on images
  const missingDims = imgs.filter(img => !img.getAttribute('width') || !img.getAttribute('height'));
  if(imgs.length > 0){
    checks.push({
      status: missingDims.length > 0 ? 'warn' : 'pass',
      title: 'Image width/height attributes',
      detail: missingDims.length > 0 ? `${missingDims.length} of ${imgs.length} images are missing width/height attributes — can cause layout shift.` : 'All images have width/height set.'
    });
  }

  // 9. Lazy loading
  const lazyImgs = imgs.filter(img => img.getAttribute('loading') === 'lazy');
  checks.push({
    status: 'warn',
    title: 'Lazy loading',
    detail: `${lazyImgs.length} of ${imgs.length} images use loading="lazy". Manually confirm your hero/carousel image is NOT lazy-loaded, and everything below the fold IS.`
  });

  // 10. JSON-LD
  const jsonLd = doc.querySelectorAll('script[type="application/ld+json"]');
  if(jsonLd.length === 0){
    checks.push({status:'fail', title:'JSON-LD schema', detail:'No JSON-LD structured data found on this page.'});
  } else {
    checks.push({status:'pass', title:'JSON-LD schema', detail:`Found ${jsonLd.length} JSON-LD block(s).`});
  }

  // 11. Mixed content (http:// resources when canonical is https)
  const httpResources = Array.from(doc.querySelectorAll('img[src^="http://"], script[src^="http://"], link[href^="http://"]'));
  if(httpResources.length > 0){
    checks.push({status:'fail', title:'Mixed content', detail:`Found ${httpResources.length} resource(s) loaded over plain http:// — will break HTTPS padlock.`});
  } else {
    checks.push({status:'pass', title:'Mixed content', detail:'No plain http:// resources found in the source.'});
  }

  // 12. Viewport meta (mobile)
  const viewport = doc.querySelector('meta[name="viewport"]');
  checks.push({
    status: viewport ? 'pass' : 'fail',
    title: 'Mobile viewport tag',
    detail: viewport ? `Found: "${viewport.getAttribute('content')}"` : 'No viewport meta tag found — page likely won\'t scale properly on mobile.'
  });

  // 13. External links to common accidental-link domains
  const suspiciousDomains = ['wikipedia.org', 'casino.com'];
  const suspiciousLinks = allLinks.filter(a => {
    const href = a.getAttribute('href') || '';
    return suspiciousDomains.some(d => href.includes(d));
  });
  if(suspiciousLinks.length > 0){
    checks.push({status:'warn', title:'Unexpected external links', detail:`Found ${suspiciousLinks.length} link(s) to ${[...new Set(suspiciousLinks.map(a=>{try{return new URL(a.getAttribute('href')).hostname}catch(e){return a.getAttribute('href')}}))].join(', ')} — confirm these are intentional and not accidental auto-links.`});
  }

  // 14. Age gate / responsible gambling text visible in raw HTML body text
  const bodyText = (doc.body ? doc.body.textContent : '').toLowerCase();
  const hasResponsibleText = /responsible gambling|responsible gaming|18\+|age.?gate|gamcare|begambleaware/.test(bodyText);
  checks.push({
    status: hasResponsibleText ? 'pass' : 'warn',
    title: 'Responsible gambling / age gate text',
    detail: hasResponsibleText ? 'Found responsible-gambling related text in the raw page text (present for crawlers, not just via JS).' : 'No responsible-gambling/age-gate keywords found in the raw text — if this is a gambling page, verify this messaging exists and isn\'t JS-only.'
  });

  renderResults(checks);
}

function renderResults(checks){
  const passCount = checks.filter(c=>c.status==='pass').length;
  const warnCount = checks.filter(c=>c.status==='warn').length;
  const failCount = checks.filter(c=>c.status==='fail').length;

  document.getElementById('check-summary').innerHTML = `
    <div class="stat pass"><div class="num">${passCount}</div><div class="lbl">Pass</div></div>
    <div class="stat warn"><div class="num">${warnCount}</div><div class="lbl">Warning</div></div>
    <div class="stat fail"><div class="num">${failCount}</div><div class="lbl">Fail</div></div>
  `;

  const icons = {pass:'✓', warn:'!', fail:'✕'};
  document.getElementById('check-list').innerHTML = checks.map(c => `
    <div class="check-item">
      <div class="icon ${c.status}">${icons[c.status]}</div>
      <div class="check-text">
        <div class="title">${c.title}</div>
        <div class="detail">${c.detail}</div>
      </div>
    </div>
  `).join('');

  document.getElementById('check-results').style.display = 'block';
  document.getElementById('check-results').scrollIntoView({behavior:'smooth'});
}
