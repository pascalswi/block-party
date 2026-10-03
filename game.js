/* Block Party: canvas renderer, keyboard input and original synthesized audio. */
(() => {
  'use strict';
  const {Game, SHAPES, COLORS}=BlockParty;
  const $=id=>document.getElementById(id);
  const canvas=$('board'),ctx=canvas.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let game=null,mode='arcade',state='ready',last=0,fall=0,ground=0,lockResets=0,particles=[],toastTimer;
  let sound=true,music=false,audio=null,musicTimer=null,noteIndex=0;
  const pressed=new Map();
  function stored(key,fallback){try{return localStorage.getItem(key)??fallback;}catch{return fallback;}}
  function save(key,value){try{localStorage.setItem(key,String(value));}catch{/* Game works without storage. */}}
  const bests={arcade:Number(stored('block-party-best-arcade',0))||0,chill:Number(stored('block-party-best-chill',0))||0};
  sound=stored('block-party-sound','true')==='true';
  music=stored('block-party-music','false')==='true';
  function initAudio(){try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch{audio=null;}}
  function tone(freq,duration=.08,type='sine',volume=.045,delay=0){
    if(!audio || audio.state!=='running')return;
    const osc=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime+delay;
    osc.type=type;osc.frequency.setValueAtTime(freq,t);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+.008);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
    osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+duration+.02);
  }
  function sfx(name){if(!sound)return;const fx={move:[220],rotate:[440,660],hold:[330,494],drop:[160,90],clear:[523,659,784],party:[523,659,784,1047,1319],start:[392,494,587,784],over:[392,330,262,196]};(fx[name]||[]).forEach((n,i)=>tone(n,name==='over'?.22:.10,name==='drop'?'triangle':'sine',.045,i*.065));}
  function syncMusic(){
    clearInterval(musicTimer);musicTimer=null;
    if(music && state==='playing' && audio){
      const notes=[262,0,330,392,0,330,294,0,220,0,262,330,0,294,247,0];
      musicTimer=setInterval(()=>{const n=notes[noteIndex++%notes.length];if(n)tone(n,.18,'triangle',.018);},210);
    }
  }
  function audioButtons(){
    $('sound').setAttribute('aria-pressed',sound);$('sound').setAttribute('aria-label',sound?'Sound ausschalten':'Sound einschalten');
    $('music').setAttribute('aria-pressed',music);$('music').setAttribute('aria-label',music?'Musik ausschalten':'Musik einschalten');
  }
  $('sound').onclick=()=>{initAudio();sound=!sound;save('block-party-sound',sound);audioButtons();if(sound)sfx('rotate');if(state==='playing')canvas.focus({preventScroll:true});};
  $('music').onclick=()=>{initAudio();music=!music;save('block-party-music',music);audioButtons();syncMusic();if(state==='playing')canvas.focus({preventScroll:true});};
  function roundRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
  function block(c,x,y,size,type,ghost=false,eyes=false){
    const color=COLORS[type];c.save();
    if(ghost){c.globalAlpha=.30;c.strokeStyle=color;c.lineWidth=1.2;roundRect(c,x+3,y+3,size-6,size-6,4);c.stroke();}
    else{c.fillStyle=color;roundRect(c,x+2,y+2,size-4,size-4,5);c.fill();c.fillStyle='#ffffff35';roundRect(c,x+5,y+4,size-10,3,1);c.fill();c.fillStyle='#00000018';roundRect(c,x+5,y+size-7,size-10,3,1);c.fill();if(eyes){c.fillStyle='#182035';c.fillRect(x+size*.35,y+size*.43,2,3);c.fillRect(x+size*.59,y+size*.43,2,3);}}
    c.restore();
  }
  function piece(c,p,size,y=p.y,ghost=false){p.cells.forEach((row,cy)=>row.forEach((v,cx)=>{if(v)block(c,(p.x+cx)*size,(y+cy)*size,size,p.type,ghost,!ghost&&cy===1&&cx===1);}));}
  function preview(id,types){const c=$(id).getContext('2d');c.clearRect(0,0,c.canvas.width,c.canvas.height);types.forEach((type,i)=>{if(!type)return;const cells=SHAPES[type],size=25;const occupied=[];cells.forEach((r,y)=>r.forEach((v,x)=>{if(v)occupied.push([x,y]);}));const minX=Math.min(...occupied.map(a=>a[0])),maxX=Math.max(...occupied.map(a=>a[0])),minY=Math.min(...occupied.map(a=>a[1]));const offset=(180-(maxX-minX+1)*size)/2;occupied.forEach(([x,y])=>block(c,offset+(x-minX)*size,23+i*88+(y-minY)*size,size,type));});}
  function update(){
    $('score').textContent=(game?.score||0).toLocaleString('de-CH');$('lines').textContent=String(game?.lines||0).padStart(2,'0');$('level').textContent=String(game?.level||1).padStart(2,'0');
    if(game && game.score>bests[mode]){bests[mode]=game.score;save('block-party-best-'+mode,game.score);}
    $('best').textContent=bests[mode].toLocaleString('de-CH');preview('next',game?.queue.slice(0,3)||['T','I','L']);preview('hold',game?.held?[game.held]:[]);
    $('hold').style.opacity=game&&!game.canHold?'.4':'1';
  }
  function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),1250);}
  function resetTimers(){fall=0;ground=0;lockResets=0;}
  function celebrate(result){
    if(result.cleared){
      const labels=['','Nice. Weg damit!','Double trouble!','Drei? Läuft bei dir.','PARTY CLEAR! ✦'];toast(labels[result.cleared]+' +'+result.gained);sfx(result.cleared===4?'party':'clear');
      $('quip').textContent=['Das war keine Lücke. Das war eine Chance.','Reihen weg. Sorgen auch.','Du stapelst heute auf einem anderen Level.','Blöcke kommen. Blöcke gehen. Du bleibst cool.'][Math.floor(Math.random()*4)];
      if(!reduced)result.clearedRows.forEach(y=>{for(let i=0;i<24;i++)particles.push({x:Math.random()*300,y:y*30+15,vx:(Math.random()-.5)*150,vy:-Math.random()*150-30,life:1,color:Object.values(COLORS)[i%7]});});
    }else sfx('drop');
    resetTimers();update();if(game.over)finish();
  }
  function start(){
    initAudio();game=new Game(mode);state='playing';particles=[];pressed.clear();resetTimers();last=performance.now();$('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='Ⅱ Pause';$('state-label').textContent='LET’S ROLL';$('quip').textContent='Ich glaube an dich. Und an die Schwerkraft.';update();sfx('start');syncMusic();canvas.focus({preventScroll:true});
  }
  function pause(){
    if(state!=='playing'&&state!=='paused')return;
    pressed.clear();state=state==='playing'?'paused':'playing';$('overlay').hidden=state==='playing';$('pause').textContent=state==='paused'?'▶ Weiter':'Ⅱ Pause';$('state-label').textContent=state==='paused'?'DURCHATMEN':'LET’S ROLL';
    if(state==='paused'){showOverlay('PAUSE IST AUCH EIN MOVE.','Kurz durchatmen.','Deine Blöcke warten auf dich.','Weiterfeiern ↗');}else{last=performance.now();}
    syncMusic();
  }
  function showOverlay(kicker,title,copy,button){$('overlay').hidden=false;$('overlay-kicker').textContent=kicker;$('overlay-title').textContent=title;$('overlay-copy').textContent=copy;$('start').textContent=button;$('modes').hidden=true;$('overlay-hint').textContent='P / Escape zum Pausieren · R für eine neue Runde';}
  function finish(){state='over';pressed.clear();syncMusic();sfx('over');$('pause').disabled=true;$('state-label').textContent='NOCH EINE RUNDE?';showOverlay('DU WARST AUF DER PARTY.','Bis oben gefeiert.',game.score.toLocaleString('de-CH')+' Punkte · '+game.lines+' Reihen. Die nächste Runde gehört dir.','Nochmal feiern ↗');$('modes').hidden=false;$('quip').textContent='Das war kein Scheitern. Das war die Generalprobe.';}
  function action(name){
    if(state!=='playing')return;
    if(name==='drop'){celebrate(game.hardDrop());return;}
    if(name==='hold'){if(game.hold()){sfx('hold');resetTimers();update();if(game.over)finish();}return;}
    const wasGrounded=game.collides(game.piece,0,1);let moved=false;
    if(name==='left'||name==='right')moved=game.move(name==='left'?-1:1);
    if(name==='rotate'||name==='counter')moved=game.rotate(name==='counter'?-1:1);
    if(name==='down'){moved=game.softDrop();if(moved)fall=0;}
    if(moved){if(wasGrounded&&lockResets<15){ground=0;lockResets++;}if(name!=='down')sfx(name==='rotate'||name==='counter'?'rotate':'move');update();}
  }
  const keyActions={ArrowLeft:'left',ArrowRight:'right',ArrowDown:'down',ArrowUp:'rotate',KeyX:'rotate',KeyZ:'counter',KeyC:'hold',Space:'drop'};
  addEventListener('keydown',e=>{
    if($('help-dialog').open)return;
    if(['BUTTON','A','INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName) && e.code==='Space')return;
    if(keyActions[e.code]){e.preventDefault();if(e.repeat)return;action(keyActions[e.code]);if(['left','right','down'].includes(keyActions[e.code]))pressed.set(e.code,{action:keyActions[e.code],elapsed:0,next:keyActions[e.code]==='down'?50:165});}
    if(['KeyP','Escape'].includes(e.code)){e.preventDefault();if(!e.repeat)pause();}
    if(e.code==='Enter'&&['ready','over'].includes(state)){e.preventDefault();start();}
    if(e.code==='KeyR'&&state!=='playing'){e.preventDefault();start();}
  });
  addEventListener('keyup',e=>pressed.delete(e.code));
  addEventListener('blur',()=>{pressed.clear();if(state==='playing')pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause();});
  $('start').onclick=()=>{if(state==='paused')pause();else start();$('start').blur();};$('pause').onclick=()=>{pause();$('pause').blur();};
  $('restart').onclick=()=>{if(state==='playing')pause();if(game){showOverlay('NEUE RUNDE?','Frisch aufstapeln.','Dein Rekord bleibt. Die aktuelle Runde endet beim Neustart.','Neue Party starten ↗');state='restart';$('pause').disabled=true;$('modes').hidden=false;}else start();};
  document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{mode=button.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',b===button);});$('mode-label').textContent=mode.toUpperCase();$('best').textContent=bests[mode].toLocaleString('de-CH');});
  $('help').onclick=()=>{if(state==='playing')pause();$('help-dialog').showModal();};$('close-help').onclick=$('help-done').onclick=()=>$('help-dialog').close();
  function sizeCanvas(){const dpr=Math.min(devicePixelRatio||1,3);canvas.width=300*dpr;canvas.height=600*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  addEventListener('resize',sizeCanvas);sizeCanvas();audioButtons();update();
  function draw(dt){
    ctx.clearRect(0,0,300,600);ctx.fillStyle='#11131f';ctx.fillRect(0,0,300,600);ctx.strokeStyle='#ffffff06';ctx.lineWidth=1;
    for(let x=0;x<=10;x++){ctx.beginPath();ctx.moveTo(x*30,0);ctx.lineTo(x*30,600);ctx.stroke();}for(let y=0;y<=20;y++){ctx.beginPath();ctx.moveTo(0,y*30);ctx.lineTo(300,y*30);ctx.stroke();}
    if(game){game.board.forEach((row,y)=>row.forEach((type,x)=>{if(type)block(ctx,x*30,y*30,30,type);}));if(!game.over){piece(ctx,game.piece,30,game.ghostY(),true);piece(ctx,game.piece,30);}}
    else{const decorative=[['S',1,18],['S',2,18],['O',7,18],['O',8,18],['J',0,19],['S',1,19],['L',4,19],['L',5,19],['O',7,19],['O',8,19],['T',9,19]];decorative.forEach(([t,x,y])=>block(ctx,x*30,y*30,30,t));}
    if(state==='playing')particles=particles.filter(p=>{p.life-=dt/850;p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;p.vy+=dt*.25;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4);return p.life>0;});ctx.globalAlpha=1;
  }
  function frame(t){const dt=Math.min(t-last,60);last=t;if(state==='playing'){
    for(const hold of pressed.values()){hold.elapsed+=dt;if(hold.elapsed>=hold.next){action(hold.action);hold.next+=hold.action==='down'?45:55;}}
    fall+=dt;if(fall>=game.interval){game.move(0,1);fall=0;}
    if(game.collides(game.piece,0,1)){ground+=dt;if(ground>=450)celebrate(game.lock());}else ground=0;
  }draw(dt);requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
})();
