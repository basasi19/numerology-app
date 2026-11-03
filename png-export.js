/* Render one existing sheet locally. The print layout lives in a private frame so
   a narrow screen, an inactive tab, and the PDF print lifecycle cannot affect it. */
(() => {
  'use strict';
  const width = 2480, height = 1754, margin = width * 10 / 297;
  const loads = new Map();
  function loadScript(src) {
    if (!loads.has(src)) {
      const script = document.createElement('script');
      script.src = src;
      loads.set(src, new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => { loads.delete(src); script.remove(); reject(new Error('画像作成用のファイルを読み込めませんでした。')); };
        document.head.append(script);
      }));
    }
    return loads.get(src);
  }
  function stylesheet(doc, href) {
    return new Promise((resolve, reject) => {
      const link = doc.createElement('link');
      link.rel = 'stylesheet'; link.href = href;
      link.onload = resolve; link.onerror = () => reject(new Error('レイアウトを読み込めませんでした。'));
      doc.head.append(link);
    });
  }
  async function paintPlants(doc, sheet, scale) {
    const plants = [...sheet.querySelectorAll('svg.plant')];
    if (!plants.length) return;
    const imageTag = plants[0].querySelector('image');
    const image = new Image();
    if (location.protocol === 'file:') {
      // Browsers do not allow a canvas containing a file:// image to be downloaded.
      await loadScript('png-plant-offline.js');
      image.src = window.NumerologyPlantImage;
    } else {
      image.src = new URL(imageTag.getAttribute('href'), document.baseURI).href;
    }
    await image.decode();
    const unitX = image.naturalWidth / Number(imageTag.getAttribute('width'));
    const unitY = image.naturalHeight / Number(imageTag.getAttribute('height'));
    for (const plant of plants) {
      const {x,y,width:w,height:h} = plant.viewBox.baseVal;
      const box = plant.getBoundingClientRect();
      const canvas = doc.createElement('canvas');
      canvas.width = Math.max(1, Math.ceil(box.width * scale));
      canvas.height = Math.max(1, Math.ceil(box.height * scale));
      canvas.style.cssText = 'width:100%;height:' + box.height + 'px;display:block';
      const fit = Math.min(canvas.width / w, canvas.height / h);
      // Same xMidYMax meet and crop as the SVG: one complete pot per number.
      canvas.getContext('2d').drawImage(image, x*unitX, y*unitY, w*unitX, h*unitY,
        (canvas.width - w*fit)/2, canvas.height - h*fit, w*fit, h*fit);
      plant.replaceWith(canvas);
    }
  }
  function paintStageBands(doc, sheet, scale) {
    // html2canvas does not draw CSS clip-path polygons. Keep the arrow tips.
    for (const row of sheet.querySelectorAll('.stage-row')) {
      const css = doc.defaultView.getComputedStyle(row, '::before');
      const box = row.getBoundingClientRect();
      const left = parseFloat(css.left), top = parseFloat(css.top), bottom = parseFloat(css.bottom);
      const w = box.width-left, h = box.height-top-bottom;
      const canvas = doc.createElement('canvas');
      canvas.width = Math.ceil(w*scale); canvas.height = Math.ceil(h*scale);
      canvas.style.cssText = 'position:absolute;left:'+left+'px;top:'+top+'px;width:'+w+'px;height:'+h+'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(canvas.width/w,canvas.height/h); ctx.fillStyle = css.backgroundColor; ctx.globalAlpha = Number(css.opacity);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(w*.96,0); ctx.lineTo(w,h/2);
      ctx.lineTo(w*.96,h); ctx.lineTo(0,h); ctx.closePath(); ctx.fill();
      row.prepend(canvas);
    }
    const style = doc.createElement('style');
    style.textContent='.stage-row::before{display:none}.current-age{box-shadow:inset 0 0 0 2px var(--c1);border:2px solid var(--c1)!important}';
    doc.head.append(style);
  }
  async function render(source) {
    await loadScript('vendor/html2canvas-1.4.1.min.js');
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden','true'); frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;left:-20000px;top:0;width:1280px;height:900px;border:0;pointer-events:none';
    document.body.append(frame);
    let rendered, output;
    try {
      const doc = frame.contentDocument;
      doc.open(); doc.write('<!doctype html><html lang="ja"><head><meta charset="utf-8"></head><body></body></html>'); doc.close();
      await Promise.all([...document.querySelectorAll('head link[rel="stylesheet"]')].map(link => stylesheet(doc, link.href)));
      const sheet = doc.importNode(source,true);
      sheet.hidden=false;
      // The original draws its arrow above the SVG viewBox via overflow:visible.
      // Reserve this space inside the SVG when it becomes a bitmap.
      sheet.querySelector('.correlation')?.setAttribute('viewBox','0 -10 300 315');
      doc.body.append(sheet);
      const content = sheet.querySelector('.sheet-content');
      await doc.fonts.ready;
      const box = content.getBoundingClientRect();
      const w = Math.max(box.width,content.scrollWidth), h = Math.max(box.height,content.scrollHeight);
      const scale = Math.min((width-2*margin)/Math.ceil(w),(height-2*margin)/Math.ceil(h));
      await paintPlants(doc,sheet,scale);
      paintStageBands(doc,sheet,scale);
      rendered = await window.html2canvas(content, {
        scale, width:Math.ceil(w), height:Math.ceil(h), backgroundColor:'#fff', logging:false,
        windowWidth:1280, windowHeight:900, scrollX:0, scrollY:0
      });
      output = document.createElement('canvas'); output.width=width; output.height=height;
      const ctx = output.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,width,height);
      ctx.drawImage(rendered,Math.round((width-rendered.width)/2),Math.round(margin));
      return await new Promise((resolve,reject) => output.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('画像を作成できませんでした。')), 'image/png'));
    } finally {
      if (rendered) rendered.width=rendered.height=0;
      if (output) output.width=output.height=0;
      frame.remove();
    }
  }
  window.NumerologyPng = {render};
})();
