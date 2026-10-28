const AREAS=[
 {id:'math',name:'Mathematics',emoji:'🔢',cls:'m'},
 {id:'eng',name:'English',emoji:'📖',cls:'e'},
 {id:'kis',name:'Kiswahili',emoji:'🗣️',cls:'k'},
 {id:'env',name:'Environment and Science',emoji:'🌳',cls:'s'}
];
const $=id=>document.getElementById(id);
const menu=document.querySelector('.menu'),links=$('links');
if(menu)menu.onclick=()=>{const o=links.classList.toggle('open');menu.setAttribute('aria-expanded',o)};
if(typeof Q!=='undefined'&&$('qn'))$('qn').textContent=Object.values(Q).flat().length;
if($('quiz')){
  let grade=null,area=null,items=[],i=0,score=0,timer;
  const pick=new URLSearchParams(location.search).get('area');
  area=AREAS.find(a=>a.id===pick)||null;
  if(area)$('hint').textContent=area.name+' selected. Now choose your grade.';
  [1,2,3,4,5].forEach(g=>{const b=document.createElement('button');b.className='gb';b.setAttribute('aria-pressed','false');
    b.innerHTML='<span>Grade</span><b>'+g+'</b>';
    b.onclick=()=>{grade=g;document.querySelectorAll('.gb').forEach(x=>x.setAttribute('aria-pressed',x===b));
      if(area)start();else $('hint').textContent='Grade '+g+' selected. Now choose a subject.'};$('grades').append(b)});
  AREAS.forEach(a=>{const b=document.createElement('button');b.className='ab '+a.cls;
    b.innerHTML='<span>'+a.emoji+'</span>'+a.name;
    b.onclick=()=>{area=a;if(grade)start();else $('hint').textContent=a.name+' selected. Now choose your grade.'};$('areas').append(b)});
  function start(){
    clearTimeout(timer);
    items=Q[area.id].filter(q=>q[0]===grade).sort(()=>Math.random()-.5);i=0;score=0;
    if(!items.length){$('hint').textContent='No questions yet for '+area.name+' in Grade '+grade+'.';$('quiz').style.display='none';return}
    $('hint').textContent=area.name+', Grade '+grade;$('end').style.display='none';$('play').style.display='block';$('quiz').style.display='block';
    $('back').onclick=()=>{clearTimeout(timer);$('quiz').style.display='none'};$('again').onclick=start;show();
    $('quiz').scrollIntoView({behavior:'smooth',block:'center'});
  }
  function show(){
    const [,q,o]=items[i];$('q').textContent=q;$('fb').textContent='';$('count').textContent=(i+1)+'/'+items.length;
    $('prog').style.width=(i/items.length*100)+'%';$('opts').innerHTML='';
    o.map((_,k)=>k).sort(()=>Math.random()-.5).forEach(k=>{const b=document.createElement('button');b.className='opt';b.textContent=o[k];b.dataset.k=k;b.onclick=()=>choose(k);$('opts').append(b)});
  }
  function choose(k){
    const c=items[i][3],bs=[...document.querySelectorAll('.opt')];
    bs.forEach(b=>b.disabled=true);bs.find(b=>+b.dataset.k===c).classList.add('good');
    if(k===c){score++;$('fb').textContent='⭐ Correct! Well done!'}else{bs.find(b=>+b.dataset.k===k).classList.add('bad');$('fb').textContent='Not this time. The green answer is correct.'}
    timer=setTimeout(()=>{i++;i<items.length?show():finish()},k===c?1200:2600);
  }
  function finish(){
    $('prog').style.width='100%';$('play').style.display='none';$('end').style.display='block';
    $('stars').textContent='⭐'.repeat(score)+'☆'.repeat(items.length-score);
    $('msg').textContent=score===items.length?'Super job!':score>0?'Good try!':'Keep practising!';
    $('sc').textContent='You got '+score+' out of '+items.length+'.';
  }
}
