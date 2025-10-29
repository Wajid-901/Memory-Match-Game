const grid = document.getElementById('grid');
const movesEl = document.getElementById('moves');
const timeEl = document.getElementById('time');
const bestEl = document.getElementById('best');
const restartBtn = document.getElementById('restart');
const sizeButtons = [...document.querySelectorAll('[data-size]')];
const themeButtons = [...document.querySelectorAll('[data-theme]')];
const modal = document.getElementById('win');
const summary = document.getElementById('summary');
const againBtn = document.getElementById('again');
const closeBtn = document.getElementById('close');

let size = '4x4';
let theme = 'emoji';
let deck = [];
let first = null, second = null, lock = false;
let moves = 0, matches = 0, totalPairs = 8;
let timer = null, seconds = 0;

const EMOJIS = ['🍎','🍌','🍒','🍇','🍉','🥝','🍑','🍍','🥑','🥕','🌽','🍆','🍩','🍪','🍰','🧁','🍕','🍔','🍟','🌮','🍣','🍤','🍙','🍜'];

function SHAPES(n){
  const shapes = ['●','■','▲','◆','⬟','⬢','★','☘','♥','♣','♦','✚','✦','✿','☀','☾','✈','⌂','⚙','☯','∞','♫','☕','⚡'];
  return shapes.slice(0,n);
}

function setSize(newSize){
  size = newSize; sizeButtons.forEach(b=>b.classList.toggle('active', b.dataset.size===size));
  totalPairs = (size==='4x4') ? 8 : 12;
  build();
}
function setTheme(newTheme){
  theme = newTheme; themeButtons.forEach(b=>b.classList.toggle('active', b.dataset.theme===theme));
  build();
}

function build(){
  deck = []; first = second = null; lock = false; matches = 0; moves = 0; seconds = 0; updateHUD(); stopTimer();

  const symbols = (theme==='emoji') ? EMOJIS.slice(0,totalPairs) : SHAPES(totalPairs);
  deck = shuffle([...symbols, ...symbols]).map((sym, i)=>({ id:i, sym, cleared:false }));

  grid.className = 'grid ' + (size==='4x4' ? 'cols-4' : 'cols-6');
  grid.innerHTML = '';
  deck.forEach((card, idx)=>{
    const el = document.createElement('button');
    el.className = 'card';
    el.dataset.idx = idx;
    el.innerHTML = `
      <div class="card-inner">
        <div class="face front">?</div>
        <div class="face back">${card.sym}</div>
      </div>`;
    el.addEventListener('click', onFlip);
    grid.appendChild(el);
  });
}

function onFlip(e){
  const el = e.currentTarget;
  const idx = +el.dataset.idx;
  if(lock) return;
  if(deck[idx].cleared) return;
  if(first && +first.dataset.idx === idx) return;

  if(moves===0 && !first && seconds===0) startTimer();

  flip(el, true);

  if(!first){ first = el; return; }
  second = el; lock = true; moves++; updateHUD();

  const a = deck[+first.dataset.idx];
  const b = deck[+second.dataset.idx];
  if(a.sym === b.sym){
    a.cleared = b.cleared = true; matches++;
    setTimeout(()=>{
      first.classList.add('cleared');
      second.classList.add('cleared');
      resetPick();
      if(matches === totalPairs) win();
    }, 450);
  } else {
    setTimeout(()=>{
      flip(first, false); flip(second, false);
      resetPick();
    }, 800);
  }
}

function flip(el, on){ el.classList.toggle('flipped', on); }
function resetPick(){ first = null; second = null; lock = false; }

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr;
}

function startTimer(){ stopTimer(); timer = setInterval(()=>{ seconds++; timeEl.textContent = fmt(seconds); },1000); }
function stopTimer(){ if(timer){ clearInterval(timer); timer=null; } timeEl.textContent = fmt(seconds); }
function fmt(s){ const m = Math.floor(s/60), ss = s%60; return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}` }

function updateHUD(){ movesEl.textContent = moves; }

function win(){
  stopTimer();
  const bestKey = `best_${size}_${theme}`;
  const prev = localStorage.getItem(bestKey);
  const current = { moves, seconds };
  if(!prev){ localStorage.setItem(bestKey, JSON.stringify(current)); }
  else {
    const p = JSON.parse(prev);
    if(current.moves < p.moves || (current.moves===p.moves && current.seconds < p.seconds)){
      localStorage.setItem(bestKey, JSON.stringify(current));
    }
  }
  const best = JSON.parse(localStorage.getItem(bestKey));
  bestEl.textContent = `${best.moves} / ${fmt(best.seconds)}`;
  summary.textContent = `You finished ${size} in ${moves} moves and ${fmt(seconds)}! Best: ${best.moves} moves, ${fmt(best.seconds)}.`;
  modal.classList.remove('hidden');
}

function loadBest(){
  const bestKey = `best_${size}_${theme}`;
  const best = localStorage.getItem(bestKey);
  bestEl.textContent = best ? `${JSON.parse(best).moves} / ${fmt(JSON.parse(best).seconds)}` : '—';
}

restartBtn.addEventListener('click', ()=>{ build(); loadBest(); });
sizeButtons.forEach(b=> b.addEventListener('click', ()=>{ setSize(b.dataset.size); loadBest(); }));
themeButtons.forEach(b=> b.addEventListener('click', ()=>{ setTheme(b.dataset.theme); loadBest(); }));
againBtn.addEventListener('click', ()=>{ modal.classList.add('hidden'); build(); loadBest(); });
closeBtn.addEventListener('click', ()=>{ modal.classList.add('hidden'); });

build();
loadBest();
