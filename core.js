(function (root) {
  'use strict';
  const singles = {};
  const rows = [
    ['あいうえお','A I U E O'],['かきくけこ','KA KI KU KE KO'],['さしすせそ','SA SHI SU SE SO'],
    ['たちつてと','TA CHI TSU TE TO'],['なにぬねの','NA NI NU NE NO'],['はひふへほ','HA HI FU HE HO'],
    ['まみむめも','MA MI MU ME MO'],['やゆよ','YA YU YO'],['らりるれろ','RA RI RU RE RO'],
    ['わゐゑをん','WA I E O N'],['がぎぐげご','GA GI GU GE GO'],['ざじずぜぞ','ZA JI ZU ZE ZO'],
    ['だぢづでど','DA JI ZU DE DO'],['ばびぶべぼ','BA BI BU BE BO'],['ぱぴぷぺぽ','PA PI PU PE PO'],['ぁぃぅぇぉ','A I U E O']
  ];
  rows.forEach(([kana, latin]) => [...kana].forEach((c, i) => singles[c] = latin.split(' ')[i]));
  const pairs = { 'ちぇ':'CHE' };
  Object.entries({'き':'KY','し':'SH','ち':'CH','に':'NY','ひ':'HY','み':'MY','り':'RY','ぎ':'GY','じ':'J','び':'BY','ぴ':'PY'}).forEach(([k,v]) => {
    [...'ゃゅょ'].forEach((s,i) => pairs[k+s] = v + ['A','U','O'][i]);
  });
  function romanize(input) {
    const chars = [...input.normalize('NFC')];
    let out = '';
    for (let i=0;i<chars.length;i++) {
      const pair = chars[i] + (chars[i+1] || '');
      if (pairs[pair]) { out += pairs[pair]; i++; }
      else if (chars[i] !== 'ー') out += singles[chars[i]] || chars[i];
    }
    out = out.replace(/っ(?=CHI|CHA|CHU|CHO|CHE)/g, 'T').replace(/っ([A-Z])/g, '$1$1').replace(/っ/g,'TSU');
    return out.replace(/UU|EE|OO|OU/g, s => s[0]).replace(/N(?=[BMP])/g,'M');
  }
  function digitSum(n) { return [...String(n)].reduce((a,c) => a+Number(c),0); }
  function reduce(n, master=false) {
    if (!Number.isSafeInteger(n) || n<0) throw new Error('計算する数が正しくありません。');
    const steps=[n];
    while(n>9 && !(master && (n===11 || n===22))) { n=digitSum(n); steps.push(n); }
    return {value:n, previous:steps.length>1 ? steps.at(-2):null, steps};
  }
  function notation(n) { return n.previous===null ? String(n.value) : `${n.value} / ${n.previous}`; }
  function parseDate(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error('生年月日を入力してください。');
    const [year,month,day]=iso.split('-').map(Number);
    const date = new Date(Date.UTC(year,month-1,day));
    if (year<1000 || year>9999 || date.getUTCFullYear()!==year || date.getUTCMonth()!==month-1 || date.getUTCDate()!==day) throw new Error('実在する生年月日を入力してください。');
    return {year,month,day,date};
  }
  function localISO(date=new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  const weekdayTexts = ['この世に秩序や法則をもたらすこと','基礎を充実させたり原型を造り出すこと','衣食住に関係した分野で働くこと','物質的、精神的な繁栄をもたらすこと','特殊な環境で働くスペシャリストになること','芸術、文学、理論など何かを生み出すこと','人を神聖にさせ、魂を活性化させること'];
  function birthNumber(year,month,day) {
    const total=year+month+day;
    const intermediate=total>=2000 ? Math.floor(total/100)+total%100 : digitSum(total);
    return {...reduce(intermediate), total, intermediate, split:total>=2000};
  }
  function cycleAt(birth,age) { return (birth-1+age)%9+1; }
  function calculate({surname,given,birthday,displayName='',asOf=localISO()}) {
    for (const name of [surname,given]) {
      if (!name || !/^[ぁ-ゖー]+$/.test(name.normalize('NFC'))) throw new Error('姓・名の読みは、それぞれひらがなで入力してください。');
      if (name.length>50) throw new Error('読みは姓・名それぞれ50文字以内で入力してください。');
    }
    const roman = romanize(surname)+' '+romanize(given);
    if (!/^[A-Z]+ [A-Z]+$/.test(roman)) throw new Error('この読みには変換を確定できない文字が含まれています。読みを確認してください。');
    const {year,month,day,date}=parseDate(birthday);
    parseDate(asOf);
    if (birthday>asOf) throw new Error('生年月日は今日以前の日付を入力してください。');
    const [cy,cm,cd]=asOf.split('-').map(Number);
    const age=cy-year-((cm<month || (cm===month && cd<day))?1:0);
    const letters=[...roman].filter(c=>c!==' ').map(letter=>({letter,value:(letter.charCodeAt(0)-65)%9+1,vowel:'AEIOU'.includes(letter)}));
    const sum = list=>list.reduce((a,c)=>a+c.value,0);
    const person=reduce(sum(letters)), soul=reduce(sum(letters.filter(l=>l.vowel))), outer=reduce(sum(letters.filter(l=>!l.vowel)));
    const birth=birthNumber(year,month,day), maturity=reduce(birth.value+person.value,true);
    const bases=[month,day,year].map(n=>reduce(n).value);
    const [m,d,y]=bases, p1=reduce(m+d).value,p2=reduce(d+y).value;
    const values=[p1,p2,reduce(p1+p2).value,reduce(m+y).value], firstEnd=36-birth.value;
    // 杖は各数の差。3期は「4期の数」ではなく、1期・2期の杖同士の差を使う。
    const c1=Math.abs(m-d), c2=Math.abs(d-y);
    const challenges=[c1,c2,Math.abs(c1-c2),Math.abs(m-y)];
    const stages=values.map((value,i)=>({value,start:i===0?0:firstEnd+1+(i-1)*9,end:firstEnd+i*9,challenge:challenges[i]}));
    const wd=date.getUTCDay();
    return {roman,letters,person,soul,outer,birth,maturity,bases,stages,age,birthday,asOf,year,month,day,displayName:displayName.trim()||`${surname} ${given}`,weekday:'日月火水木金土'[wd],mission:weekdayTexts[wd],cycle:cycleAt(birth.value,age)};
  }
  const api={romanize,digitSum,reduce,notation,parseDate,localISO,birthNumber,cycleAt,calculate};
  if (typeof module!=='undefined' && module.exports) module.exports=api;
  else root.Numerology=api;
})(typeof globalThis!=='undefined'?globalThis:this);
