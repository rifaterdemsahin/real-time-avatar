(function(){
 var L=[['/','🎭','Avatar'],['/realtime.html','⚡','Real-time'],['/heygen.html','💬','HeyGen'],['/heygen-api.html','💰','API & break-even'],['/liveavatar.html','🧪','LiveAvatar PoC'],['/references.html','📚','References']];
 var p=location.pathname==='/index.html'?'/':location.pathname;
 var l=document.createElement('link');l.rel='stylesheet';l.href='/style.css';document.head.appendChild(l);
 var h=document.createElement('header');h.className='topnav';
 h.innerHTML='<div class="in"><a class="brand" href="/"><span>🎭</span>Real-Time Avatar</a><button class="burger" aria-label="Menu" aria-expanded="false">☰</button><ul>'+
  L.map(function(i){return '<li><a href="'+i[0]+'"'+(i[0]===p?' class="on"':'')+'>'+i[1]+' '+i[2]+'</a></li>'}).join('')+'</ul></div>';
 document.body.insertBefore(h,document.body.firstChild);
 var b=h.querySelector('.burger'),u=h.querySelector('ul');
 b.onclick=function(){var o=u.classList.toggle('open');b.setAttribute('aria-expanded',o);b.textContent=o?'✕':'☰'};
})();
