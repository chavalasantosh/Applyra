/* Applyra auth page ambient effect: a soft electric-current flicker behind
   the sign-in card. Purely decorative, silent in light theme, reduced or
   skipped under prefers-reduced-motion. External file only (extension CSP). */
(function(){
  var canvas = document.getElementById('bolt-canvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function size(){
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
  }
  size();
  window.addEventListener('resize', size);

  function drawBolt(x0, y0, x1, y1, color, glow, segments){
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4 * devicePixelRatio;
    ctx.shadowColor = color;
    ctx.shadowBlur = glow * devicePixelRatio;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    for(var i = 1; i <= segments; i++){
      var t = i / segments;
      var nx = x0 + (x1 - x0) * t + (Math.random() - 0.5) * 34 * devicePixelRatio;
      var ny = y0 + (y1 - y0) * t + (Math.random() - 0.5) * 16 * devicePixelRatio;
      ctx.lineTo(nx, ny);
    }
    ctx.stroke();
    ctx.restore();
  }

  function flash(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var theme = root.getAttribute('data-theme');
    if(theme === 'light') return;
    var accentColor = getComputedStyle(root).getPropertyValue('--accent').trim();
    var count = theme === 'thunder' ? 2 : 1;
    for(var i = 0; i < count; i++){
      var x0 = canvas.width * (0.1 + Math.random() * 0.8);
      var y0 = 0;
      var x1 = x0 + (Math.random() - 0.5) * canvas.width * 0.2;
      var y1 = canvas.height * (0.4 + Math.random() * 0.5);
      drawBolt(x0, y0, x1, y1, accentColor, theme === 'thunder' ? 14 : 8, 6);
    }
  }

  function loop(){
    if(!reduceMotion){
      flash();
      setTimeout(function(){ ctx.clearRect(0, 0, canvas.width, canvas.height); }, 130);
    }
    var theme = root.getAttribute('data-theme');
    var next = theme === 'thunder' ? 1800 + Math.random() * 1600 : 4200 + Math.random() * 3600;
    setTimeout(loop, next);
  }
  loop();
})();
