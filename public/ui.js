// UI helpers: theme toggle, result image, mascot interaction
(function(){
  const stored = localStorage.getItem('quizphoria-theme');
  if (stored === 'dark') document.body.classList.add('dark');

  function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('quizphoria-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  }

  window.toggleTheme = toggleTheme;

  // generate shareable result image
  window.generateResultImage = function(name, scoreText) {
    const w = 800, h = 420;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    // background
    const g = ctx.createLinearGradient(0,0,w, h);
    g.addColorStop(0, '#8b5cf6'); g.addColorStop(1, '#06b6d4');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    // badge circle
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(120,120,90,90,0,0,Math.PI*2); ctx.fill();
    // title
    ctx.fillStyle = '#fff'; ctx.font = '700 36px Fredoka, sans-serif'; ctx.fillText('Quizphoria Result', 220, 80);
    ctx.font = '600 28px Outfit, sans-serif'; ctx.fillText(name || 'Anonymous', 220, 130);
    ctx.font = '800 64px Fredoka, sans-serif'; ctx.fillText(scoreText || '', 220, 220);
    // footer small
    ctx.font = '500 14px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillText('Celebrate learning with Quizphoria', 220, 320);
    // download
    const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'quizphoria-result.png'; a.click();
  };

  // attach theme toggles and mascot handlers when DOM ready
  function initUI(){
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => btn.addEventListener('click', toggleTheme));
    document.querySelectorAll('.mascot').forEach(m => m.addEventListener('click', ()=>{
      // playful wiggle
      m.animate([{transform:'rotate(0)'},{transform:'rotate(10deg)'},{transform:'rotate(-10deg)'},{transform:'rotate(0)'}], {duration:600});
    }));
    // inject bg shapes once
    if (!document.querySelector('.bg-shapes')){
      const bg = document.createElement('div'); bg.className='bg-shapes'; bg.innerHTML='<div class="shape s1"></div><div class="shape s2"></div><div class="shape s3"></div>';
      document.body.appendChild(bg);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI); else initUI();
})();
