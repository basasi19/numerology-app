(function(){
  'use strict';
  const N=window.Numerology, $=id=>document.getElementById(id);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lines=s=>esc(s).replace(/\n/g,'<br>');
  const color=n=>`var(--c${n===11?2:n===22?8:n})`;
  const badge=n=>`<span class="badge" style="--badge-color:${color(n)}">${n}</span>`;
  const number=n=>`${n.value}${n.previous===null?'':` <small>/ ${n.previous}</small>`}`;
  let current=null;
  $('birthday').max=N.localISO();
  function showView(view){
    const isRef=view==='reference';
    $('result-view').hidden=isRef; $('reference-view').hidden=!isRef; $('input-panel').hidden=isRef;
    document.querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===(isRef?'reference':'result');b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  }
  function navigate(view){if(location.hash!==`#${view}`)location.hash=view;else showView(view);}
  window.addEventListener('hashchange',()=>showView(location.hash==='#reference'?'reference':'result'));
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));
  showView(location.hash==='#reference'?'reference':'result');
  $('start-input').addEventListener('click',()=>$('surname').focus());
  function previewRoman(){
    const surname=$('surname').value.trim(),given=$('given').value.trim();
    $('roman-preview').textContent=surname||given?`ローマ字：${N.romanize(surname)} ${N.romanize(given)}`:'ローマ字表記は、読みの入力後に表示されます。';
    // An edited form invalidates its old result so it cannot be printed under new inputs.
    if(current){current=null;$('result-sheet').hidden=true;$('empty-state').hidden=false;$('calculation-details').hidden=true;$('pdf-button').disabled=true;}
    $('form-error').hidden=true;
  }
  $('reading-form').addEventListener('input',previewRoman);
  function correlation(){
    const nodes={1:[150,30],3:[58,70],2:[242,70],5:[58,138],4:[242,138],6:[150,169],8:[58,214],7:[242,214],9:[150,274]};
    const edges=[[1,3],[1,2],[3,2],[3,5],[2,4],[5,8],[4,7],[8,7],[8,9],[7,9],[1,6],[6,9],[3,6],[2,6],[5,6],[4,6],[8,6],[7,6]];
    return `<svg class="correlation" viewBox="0 0 300 305" role="img" aria-label="数字の相関図。上に1、左右に3と2、5と4、8と7、中央に6、下に9、中央上に11と22。"><g stroke="#626d7d" stroke-width="2.7">${edges.map(([a,b])=>`<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}"/>`).join('')}</g><path d="M146 9V2H141L150 -8L159 2H154V9" fill="none" stroke="var(--c1)" stroke-width="2"/><circle cx="150" cy="111" r="32" fill="white" stroke="var(--c2)" stroke-dasharray="2 2"/><circle cx="150" cy="125" r="16" fill="white" stroke="var(--c8)" stroke-dasharray="2 2"/><text x="150" y="103" text-anchor="middle" fill="#748392" font-size="19">11</text><text x="150" y="131" text-anchor="middle" fill="var(--c8)" font-size="17">22</text>${Object.entries(nodes).map(([n,[x,y]])=>`<circle cx="${x}" cy="${y}" r="23" fill="${color(Number(n))}"/><text x="${x}" y="${y+10}" text-anchor="middle" fill="white" font-size="30">${n}</text>`).join('')}</svg>`;
  }
  function cycleTable(r){
    const offset=r.birth.value-1;
    const rowCount=Math.max(7,Math.ceil((offset+r.age+1)/9));
    let rows='';
    for(let row=0;row<rowCount;row++){
      const first=row*9-offset,last=first+8;
      rows+=`<tr><th scope="row">${Math.max(0,first)}–${last}歳</th>`;
      for(let col=0;col<9;col++){
        const age=first+col;
        rows+=`<td${age===r.age?' class="current-age" aria-label="現在 '+age+'歳"':''}>${age<0?'':age}</td>`;
      }
      rows+='</tr>';
    }
    return `<div class="cycle-scroll"><table class="cycle-table"><thead><tr><th class="age-head" scope="col">年齢</th>${Array.from({length:9},(_,i)=>`<th scope="col">${badge(i+1)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function plantStrip(){
    // Explicit bounds follow the whitespace between the nine complete pots.
    // A viewBox alone does not clip neighbouring artwork in its letterbox area.
    const boundaries=[0,240,470,710,935,1175,1430,1665,1915,2172];
    return boundaries.slice(0,-1).map((x,i)=>{
      const width=boundaries[i+1]-x;
      return `<svg class="plant" viewBox="${x} 35 ${width} 610" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs><clipPath id="plant-clip-${i}" clipPathUnits="userSpaceOnUse"><rect x="${x}" y="35" width="${width}" height="610"/></clipPath></defs><image href="plant-lifecycle.png" width="2172" height="724" clip-path="url(#plant-clip-${i})"/></svg>`;
    }).join('');
  }
  function renderResult(r){
    const labels=['トラウマ期','自立期','成人期','老年期'];
    const metrics=[['人質数',r.person,'全体的な人柄'],['心質',r.soul,'本心・本音・魂の本質'],['気質',r.outer,'社会性・雰囲気・外から見られる気質'],['成熟数',{value:r.maturity.value,previous:null},'36歳より徐々に目覚める人格']];
    $('result-sheet').innerHTML=`<h1 class="result-title">数秘術鑑定結果</h1><div class="result-grid"><div class="result-left"><h2 class="person-name">${esc(r.displayName)} <span>様</span></h2><p class="birth-date">${r.year}年${r.month}月${r.day}日生まれ　${r.age}歳</p><h3 class="section-heading">出生時の名前</h3><div class="name-letters">${r.roman.split(' ').map(word=>`<div class="letter-word">${[...word].map(c=>`<span class="letter"><span class="value ${'AEIOU'.includes(c)?'vowel':''}">${(c.charCodeAt(0)-65)%9+1}</span><span class="alpha">${c}</span></span>`).join('')}</div>`).join('')}</div><dl class="metrics">${metrics.map(([label,n,desc])=>`<div class="metric"><dt>${label}</dt><dd class="number">${number(n)}</dd><dd class="description">${desc}</dd></div>`).join('')}</dl><h3 class="section-heading correlation-heading">数字の相関図</h3>${correlation()}</div><div class="result-right"><div class="birth-mission"><div class="birth-stat"><p class="stat-label">誕生数</p><div class="big-number">${number(r.birth)}</div><p>ベースに在る使命</p></div><div class="mission"><p class="stat-label">天命</p><div class="weekday">${r.weekday}曜日</div><p class="mission-text">${r.mission}</p></div></div><h3 class="section-heading">誕生数と人生の4期</h3><div class="stages">${r.stages.map((s,i)=>({s,i})).reverse().map(({s,i})=>`<div class="stage-row" style="--indent:${i+1};--stage-color:${color(s.value)}">${badge(s.value)}<span class="stage-label">${labels[i]}</span><span class="stage-age">${s.start}〜${s.end}歳</span><span class="challenge">杖：${s.challenge}</span></div>`).join('')}<div class="stage-row foundation" style="--stage-color:var(--c1)">${badge(r.birth.value)}<span class="stage-label">誕生数</span><span class="stage-age">人生の土台</span></div></div><h3 class="section-heading">個人の周期</h3>${cycleTable(r)}<div class="lifecycle"><h3 class="section-heading">9年ライフサイクル</h3><div class="plant-strip" role="img" aria-label="種から芽生え、成長、開花、実りを経て手放す、9つの植物のライフサイクル">${plantStrip()}</div><div class="lifecycle-numbers">${Array.from({length:9},(_,i)=>`<span style="color:${color(i+1)}">${i+1}</span>`).join('')}</div></div></div></div><footer class="paper-footer">鑑定基準日：${r.asOf.replaceAll('-','/')}　｜　図版参考：ON PROJECT ／ Zen Education Network・Zen Session</footer>`;
    const seq=n=>n.steps.join(' → ');
    const [m,d,y]=r.bases;
    const difference=(a,b)=>`${Math.max(a,b)} − ${Math.min(a,b)} ＝ ${Math.abs(a-b)}`;
    $('calculation-content').innerHTML=`<p><strong>お名前</strong>　${esc(r.roman)}<br>人質数：${seq(r.person)}　／　心質：${seq(r.soul)}　／　気質：${seq(r.outer)}</p><p><strong>誕生数</strong>　${r.year} ＋ ${r.month} ＋ ${r.day} ＝ ${r.birth.total}<br>${r.birth.split?`${Math.floor(r.birth.total/100)} ＋ ${r.birth.total%100}`:[...String(r.birth.total)].join(' ＋ ')} ＝ ${r.birth.intermediate} → ${r.birth.steps.slice(1).join(' → ')||r.birth.value}<br>表示：${N.notation(r.birth)}</p><p><strong>成熟数</strong>　${r.birth.value} ＋ ${r.person.value} ＝ ${seq(r.maturity)}<br><strong>4期</strong>　月 ${m}・日 ${d}・年 ${y}<br>1期：${m}＋${d} → ${r.stages[0].value}　2期：${d}＋${y} → ${r.stages[1].value}　3期：${r.stages[0].value}＋${r.stages[1].value} → ${r.stages[2].value}　4期：${m}＋${y} → ${r.stages[3].value}</p><p><strong>杖</strong>　大きい数から小さい数を引き、同じ数なら0。<br>1期（月と日）：${difference(m,d)}　2期（日と年）：${difference(d,y)}<br>3期（1期の杖と2期の杖）：${difference(r.stages[0].challenge,r.stages[1].challenge)}　4期（月と年）：${difference(m,y)}</p><p><strong>期間</strong>　トラウマ期の終わり：36 − ${r.birth.value} ＝ ${r.stages[0].end}歳。以降は9年ごとの区切り。<br><strong>個人の周期</strong>　${r.birth.value}の列が0歳。現在は${r.age}歳、周期は${r.cycle}。</p>`;
    $('result-sheet').hidden=false;$('empty-state').hidden=true;$('calculation-details').hidden=false;$('pdf-button').disabled=false;
  }
  function calculateForm(){
    try {
      current=N.calculate({surname:$('surname').value.trim(),given:$('given').value.trim(),birthday:$('birthday').value,displayName:$('display-name').value});
      renderResult(current);$('form-error').hidden=true;navigate('result');return current;
    } catch(error){$('form-error').textContent=error.message;$('form-error').hidden=false;current=null;$('pdf-button').disabled=true;return null;}
  }
  $('reading-form').addEventListener('submit',event=>{event.preventDefault();if(calculateForm())$('result-sheet').scrollIntoView({behavior:'smooth',block:'start'});});
  $('meanings-table').innerHTML=`<table class="meaning-table"><thead><tr><th scope="col">数</th><th scope="col">数字の意味</th><th scope="col">プラスの作用</th><th scope="col">マイナスの作用</th></tr></thead><tbody>${window.NUMBER_MEANINGS.slice(0,9).map(([n,meaning,plus,minus])=>`<tr><th scope="row">${badge(n)}</th><td>${lines(meaning)}</td><td data-label="プラスの作用">${lines(plus)}</td><td data-label="マイナスの作用">${lines(minus)}</td></tr>`).join('')}</tbody></table><table class="meaning-table master-table" aria-label="11と22の意味"><tbody>${window.NUMBER_MEANINGS.slice(9).map(([n,meaning])=>`<tr><th scope="row">${badge(n)}</th><td>${lines(meaning)}</td></tr>`).join('')}</tbody></table>`;
  $('pdf-button').addEventListener('click',()=>{if(current)$('print-dialog').showModal();});
  $('confirm-print').addEventListener('click',async()=>{
    $('print-dialog').close();
    const image=new Image();image.src='plant-lifecycle.png';
    await image.decode().catch(()=>{});
    window.print();
  });
  // The same calculation is available to supported in-browser agents.
  const context=document.modelContext;
  if(context?.registerTool){
    const lifecycle=new AbortController();
    const tool={
      name:'calculate_numerology',title:'数秘術鑑定を計算する',
      description:'出生時の姓と名のひらがな読み、生年月日から計算し、鑑定結果を画面に表示する。入力は保存・送信しない。',
      inputSchema:{type:'object',properties:{surname:{type:'string'},given:{type:'string'},birthday:{type:'string',description:'YYYY-MM-DD'},displayName:{type:'string'}},required:['surname','given','birthday'],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:true},
      execute(input){
        if(!input||typeof input!=='object'||['surname','given','birthday'].some(k=>typeof input[k]!=='string')||(input.displayName!==undefined&&typeof input.displayName!=='string'))throw new Error('氏名の読みと生年月日を文字列で指定してください。');
        const result=N.calculate(input);
        $('surname').value=input.surname;$('given').value=input.given;$('birthday').value=input.birthday;$('display-name').value=input.displayName||'';
        previewRoman();current=result;renderResult(result);navigate('result');
        return {roman:result.roman,birth:N.notation(result.birth),person:N.notation(result.person),soul:N.notation(result.soul),outer:N.notation(result.outer),maturity:result.maturity.value,stages:result.stages,weekday:result.weekday};
      }
    };
    try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
  // State remains in memory. No analytics, remote API, or browser storage.
})();
