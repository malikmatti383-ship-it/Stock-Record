/* ================= Stock Record v1 ================= */
const DB_KEY = 'stockrecord_v1';
let DB = null;

/* ---------- Data ---------- */
function defaultDB(){ return { products:[], sales:[], purchases:[], customers:[], cash:0, seq:{p:1,s:1,pu:1,c:1} }; }
function load(){ try{ DB = JSON.parse(localStorage.getItem(DB_KEY)) || defaultDB(); }catch(e){ DB = defaultDB(); }
  if(!DB.seq) DB.seq = {p:1,s:1,pu:1,c:1}; }
function save(){ localStorage.setItem(DB_KEY, JSON.stringify(DB)); }
const $ = id => document.getElementById(id);
const fmt = n => '₨ ' + Number(n||0).toLocaleString('en-PK');
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const todayStr = () => new Date().toISOString().slice(0,10);
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.remove('hidden'); clearTimeout(t._tm); t._tm=setTimeout(()=>t.classList.add('hidden'),2200); }

/* ---------- i18n ---------- */
const I18N = {
en:{appName:'Stock Record',dashboard:'Dashboard',cashBalance:'Cash Balance',todaySale:"Today's Sale",stockValue:'Stock Value',totalCredit:'Total Credit (Udhaar)',lowStock:'Low Stock',quickActions:'Quick Actions',newSale:'New Sale',newPurchase:'New Purchase',addStock:'Add Stock',khata:'Khata',stock:'Stock',addProduct:'Add Product',searchPh:'🔍 Search product...',sale:'Sale',payment:'Payment',cash:'Cash',credit:'Credit (Udhaar)',customer:'Customer',newCustomer:'New Customer',completeSale:'✅ Complete Sale',total:'Total',reports:'Reports',today:'Today',week:'Week',month:'Month',all:'All',sales:'Sales',profit:'Profit',purchases:'Purchases',bills:'Bills',backup:'Backup',backupDesc:'Save all your data to a file. Keep it safe — you can restore it anytime.',exportBackup:'Download Backup',importBackup:'Restore Backup',resetDesc:'Delete ALL data and start fresh. This cannot be undone!',resetAll:'Delete All Data',home:'Home',save:'Save',cancel:'Cancel',delete:'Delete',edit:'Edit'},
ur:{appName:'اسٹاک ریکارڈ',dashboard:'ڈیش بورڈ',cashBalance:'نقد بیلنس',todaySale:'آج کی فروخت',stockValue:'اسٹاک مالیت',totalCredit:'کل ادھار',lowStock:'کم اسٹاک',quickActions:'فوری عمل',newSale:'نئی فروخت',newPurchase:'نئی خریداری',addStock:'اسٹاک شامل کریں',khata:'کھاتہ',stock:'اسٹاک',addProduct:'پروڈکٹ شامل کریں',searchPh:'🔍 پروڈکٹ تلاش کریں...',sale:'فروخت',payment:'ادائیگی',cash:'نقد',credit:'ادھار',customer:'گاہک',newCustomer:'نیا گاہک',completeSale:'✅ فروخت مکمل کریں',total:'کل',reports:'رپورٹس',today:'آج',week:'ہفتہ',month:'مہینہ',all:'سب',sales:'فروخت',profit:'منافع',purchases:'خریداری',bills:'بل',backup:'بیک اپ',backupDesc:'اپنا تمام ڈیٹا فائل میں محفوظ کریں۔ اسے سنبھال کر رکھیں — کبھی بھی بحال کر سکتے ہیں۔',exportBackup:'بیک اپ ڈاؤن لوڈ کریں',importBackup:'بیک اپ بحال کریں',resetDesc:'تمام ڈیٹا حذف کر کے نئے سرے سے شروع کریں۔ یہ واپس نہیں ہوگا!',resetAll:'تمام ڈیٹا حذف کریں',home:'ہوم',save:'محفوظ کریں',cancel:'منسوخ',delete:'حذف کریں',edit:'ترمیم'}};
let lang = localStorage.getItem('sr_lang') || 'en';
const t = k => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
function applyLang(){
  document.documentElement.dir = lang==='ur' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang==='ur' ? 'ur' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{ el.placeholder = t(el.dataset.i18nPh); });
  $('btn-lang').textContent = lang==='ur' ? '🌐 English' : '🌐 اردو';
  localStorage.setItem('sr_lang', lang);
}
$('btn-lang').onclick = ()=>{ lang = lang==='ur'?'en':'ur'; applyLang(); renderAll(); };

/* ---------- Navigation ---------- */
function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  $(id).classList.add('active');
  document.querySelectorAll('.bn').forEach(b=>b.classList.toggle('active', b.dataset.view===id));
  window.scrollTo(0,0);
  if(id==='view-home') renderHome();
  if(id==='view-stock') renderStock();
  if(id==='view-sale') renderSale();
  if(id==='view-purchase') renderPurchase();
  if(id==='view-khata') renderKhata();
  if(id==='view-reports') renderReports();
}
document.querySelectorAll('.bn').forEach(b=>b.onclick=()=>showView(b.dataset.view));
document.querySelectorAll('.qa').forEach(b=>b.onclick=()=>showView('view-'+b.dataset.go));

/* ---------- Modal ---------- */
function openModal(html){ $('modal-box').innerHTML = html; $('modal').classList.remove('hidden'); }
function closeModal(){ $('modal').classList.add('hidden'); $('modal-box').innerHTML=''; }
$('modal').onclick = e => { if(e.target.id==='modal') closeModal(); };

/* ---------- Dashboard ---------- */
function stockValue(){ return DB.products.reduce((s,p)=>s + p.qty*(p.buyPrice||0), 0); }
function totalCredit(){ return DB.customers.reduce((s,c)=>s + (c.balance||0), 0); }
function salesOn(dateStr){ return DB.sales.filter(s=>s.date===dateStr); }
function renderHome(){
  $('d-cash').textContent = fmt(DB.cash);
  $('d-today').textContent = fmt(salesOn(todayStr()).reduce((s,x)=>s+x.total,0));
  $('d-stockval').textContent = fmt(stockValue());
  $('d-credit').textContent = fmt(totalCredit());
  const low = DB.products.filter(p=>p.qty<=5);
  $('d-lowstock-card').classList.toggle('hidden', !low.length);
  $('d-lowstock').innerHTML = low.map(p=>`• ${esc(p.name)} — <b>${p.qty}</b>`).join('<br>');
}

/* ---------- Product image helper ---------- */
function pimgHtml(p, cls){
  cls = cls || 'pimg';
  if(p.image) return `<img class="${cls}" src="${p.image}" alt="">`;
  return `<div class="${cls} emoji">📦</div>`;
}
function readImageFile(file, cb){
  if(!file) return cb(null);
  const r = new FileReader();
  r.onload = ()=>{
    const img = new Image();
    img.onload = ()=>{
      const c = document.createElement('canvas');
      const s = Math.min(1, 256/Math.max(img.width,img.height));
      c.width = Math.round(img.width*s); c.height = Math.round(img.height*s);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      cb(c.toDataURL('image/jpeg',0.82));
    };
    img.src = r.result;
  };
  r.readAsDataURL(file);
}

/* ---------- Stock ---------- */
let stockQ = '';
$('stock-search').oninput = e=>{ stockQ = e.target.value.toLowerCase(); renderStock(); };
function renderStock(){
  const list = DB.products.filter(p=>p.name.toLowerCase().includes(stockQ));
  $('product-list').innerHTML = list.length ? list.map(p=>`
    <div class="pitem">
      ${pimgHtml(p)}
      <div class="pinfo">
        <div class="pname">${esc(p.name)}</div>
        <div class="psub">${fmt(p.sellPrice)} ${lang==='ur'?'فروخت':'sale'} • ${fmt(p.buyPrice)} ${lang==='ur'?'خرید':'cost'}</div>
        <div class="pqty ${p.qty<=5?'low':''}">${lang==='ur'?'مقدار':'Qty'}: ${p.qty}</div>
      </div>
      <div class="qty-ctl">
        <button class="qty-btn minus" onclick="chQty(${p.id},-1)">−</button>
        <button class="qty-btn plus" onclick="chQty(${p.id},1)">＋</button>
      </div>
      <div class="pactions">
        <button class="icon-btn" onclick="editProduct(${p.id})" title="${t('edit')}">✏️</button>
        <button class="icon-btn" onclick="delProduct(${p.id})" title="${t('delete')}">🗑️</button>
      </div>
    </div>`).join('')
    : `<p style="text-align:center;color:var(--sub);padding:20px">${lang==='ur'?'کوئی پروڈکٹ نہیں':'No products yet'}</p>`;
}
window.chQty = (id,d)=>{
  const p = DB.products.find(x=>x.id===id); if(!p) return;
  if(p.qty+d < 0){ toast(lang==='ur'?'اسٹاک ختم!':'Out of stock!'); return; }
  p.qty += d; save(); renderStock(); renderHome();
};
$('btn-add-product').onclick = ()=>productForm(null);
window.editProduct = id => productForm(DB.products.find(x=>x.id===id));
function productForm(p){
  const isNew = !p; p = p || {name:'', qty:0, buyPrice:0, sellPrice:0, image:null};
  openModal(`
    <h3>${isNew?t('addProduct'):t('edit')+' '+t('stock')}</h3>
    <img id="pf-img" class="mimg-preview" src="${p.image||''}" style="${p.image?'':'display:none'}">
    <div class="pimg emoji mimg-preview" id="pf-img-ph" style="${p.image?'display:none':''}">📦</div>
    <label class="fld"><span>${lang==='ur'?'تصویر':'Photo'}</span><input type="file" id="pf-file" accept="image/*"></label>
    <label class="fld"><span>${lang==='ur'?'نام':'Name'}</span><input id="pf-name" value="${esc(p.name)}" placeholder="${lang==='ur'?'مثلاً چینی 1 کلو':'e.g. Sugar 1kg'}"></label>
    <label class="fld"><span>${lang==='ur'?'مقدار':'Quantity'}</span><input id="pf-qty" type="number" min="0" value="${p.qty}"></label>
    <label class="fld"><span>${lang==='ur'?'خرید قیمت':'Buy Price'} (₨)</span><input id="pf-buy" type="number" min="0" value="${p.buyPrice}"></label>
    <label class="fld"><span>${lang==='ur'?'فروخت قیمت':'Sell Price'} (₨)</span><input id="pf-sell" type="number" min="0" value="${p.sellPrice}"></label>
    <div class="mrow"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" id="pf-save">${t('save')}</button></div>`);
  let imgData = p.image;
  $('pf-file').onchange = e=>readImageFile(e.target.files[0], d=>{ imgData=d;
    if(d){ $('pf-img').src=d; $('pf-img').style.display='block'; $('pf-img-ph').style.display='none'; } });
  $('pf-save').onclick = ()=>{
    const name = $('pf-name').value.trim();
    if(!name){ toast(lang==='ur'?'نام لکھیں':'Enter a name'); return; }
    const data = { name, qty:Math.max(0,parseInt($('pf-qty').value)||0), buyPrice:Math.max(0,parseFloat($('pf-buy').value)||0), sellPrice:Math.max(0,parseFloat($('pf-sell').value)||0), image:imgData };
    if(isNew){ data.id = DB.seq.p++; DB.products.push(data); }
    else Object.assign(DB.products.find(x=>x.id===p.id), data);
    save(); closeModal(); renderStock(); renderHome();
    toast('✅ '+(lang==='ur'?'محفوظ ہو گیا':'Saved'));
  };
}
window.delProduct = id=>{
  const p = DB.products.find(x=>x.id===id);
  if(confirm((lang==='ur'?'حذف کریں؟ ':'Delete ')+'“'+p.name+'”?')){ DB.products = DB.products.filter(x=>x.id!==id); save(); renderStock(); renderHome(); }
};

/* ---------- Sale ---------- */
let saleQ = '', cart = [];
$('sale-search').oninput = e=>{ saleQ = e.target.value.toLowerCase(); renderSaleList(); };
function renderSale(){
  renderSaleList(); renderCart();
  $('sale-customer').innerHTML = DB.customers.map(c=>`<option value="${c.id}">${esc(c.name)} (${fmt(c.balance)})</option>`).join('');
  $('sale-payment').onchange = ()=>{
    const isC = $('sale-payment').value==='credit';
    $('sale-cust-wrap').classList.toggle('hidden', !isC);
    $('btn-sale-add-cust').classList.toggle('hidden', !isC);
  };
  $('sale-payment').onchange();
}
function renderSaleList(){
  const avail = DB.products.filter(p=>p.qty>0 && p.name.toLowerCase().includes(saleQ));
  $('sale-cart').previousElementSibling; // noop
  let box = $('sale-items');
  if(!box){ box = document.createElement('div'); box.id='sale-items'; box.className='plist'; $('sale-cart').before(box); }
  box.innerHTML = avail.slice(0,30).map(p=>`
    <div class="pitem">${pimgHtml(p)}
      <div class="pinfo"><div class="pname">${esc(p.name)}</div><div class="psub">${fmt(p.sellPrice)} • ${lang==='ur'?'باقی':'left'}: ${p.qty}</div></div>
      <button class="btn small primary" onclick="addToCart(${p.id})">＋ ${lang==='ur'?'شامل':'Add'}</button>
    </div>`).join('') || `<p style="text-align:center;color:var(--sub)">${lang==='ur'?'پروڈکٹ نہیں ملا':'No product found'}</p>`;
}
window.addToCart = id=>{
  const p = DB.products.find(x=>x.id===id); if(!p||p.qty<1) return;
  const line = cart.find(x=>x.id===id);
  if(line){ if(line.qty>=p.qty){ toast(lang==='ur'?'اتنا اسٹاک نہیں':'Not enough stock'); return; } line.qty++; }
  else cart.push({id, qty:1});
  renderCart();
};
function renderCart(){
  const box = $('sale-cart');
  box.setAttribute('data-empty', lang==='ur'?'کارٹ خالی ہے':'Cart is empty — add products above');
  box.innerHTML = cart.map(l=>{
    const p = DB.products.find(x=>x.id===l.id);
    return `<div class="pitem">${pimgHtml(p)}
      <div class="pinfo"><div class="pname">${esc(p.name)}</div><div class="psub">${fmt(p.sellPrice)} × ${l.qty}</div></div>
      <div class="qty-ctl"><button class="qty-btn minus" onclick="cartQty(${l.id},-1)">−</button><span class="qty-num">${l.qty}</span><button class="qty-btn plus" onclick="cartQty(${l.id},1)">＋</button></div>
    </div>`;
  }).join('');
  $('sale-total').textContent = fmt(cartTotal());
}
window.cartQty = (id,d)=>{
  const l = cart.find(x=>x.id===id); if(!l) return;
  const p = DB.products.find(x=>x.id===id);
  l.qty += d;
  if(l.qty<=0) cart = cart.filter(x=>x.id!==id);
  if(l.qty>p.qty){ l.qty=p.qty; toast(lang==='ur'?'اتنا اسٹاک نہیں':'Not enough stock'); }
  renderCart();
};
const cartTotal = ()=>cart.reduce((s,l)=>{ const p=DB.products.find(x=>x.id===l.id); return s + l.qty*(p?p.sellPrice:0); },0);
$('btn-complete-sale').onclick = ()=>{
  if(!cart.length){ toast(lang==='ur'?'کارٹ خالی ہے':'Cart is empty'); return; }
  const total = cartTotal(), pay = $('sale-payment').value;
  let customerId = null;
  if(pay==='credit'){
    if(!DB.customers.length){ toast(lang==='ur'?'پہلے گاہک شامل کریں':'Add a customer first'); return; }
    customerId = parseInt($('sale-customer').value);
  }
  // check stock
  for(const l of cart){ const p=DB.products.find(x=>x.id===l.id); if(!p||p.qty<l.qty){ toast(lang==='ur'?'اسٹاک کم ہے':'Low stock'); return; } }
  const items = cart.map(l=>{ const p=DB.products.find(x=>x.id===l.id); p.qty-=l.qty;
    return {productId:p.id, name:p.name, qty:l.qty, price:p.sellPrice, cost:p.buyPrice}; });
  DB.sales.push({id:DB.seq.s++, items, total, payment:pay, customerId, date:todayStr(), ts:Date.now()});
  if(pay==='cash') DB.cash += total;
  else { const c=DB.customers.find(x=>x.id===customerId); if(c) c.balance += total; }
  save(); cart=[]; renderCart(); renderSaleList(); renderHome();
  toast('✅ '+(lang==='ur'?'فروخت مکمل! ':'Sale done! ')+fmt(total));
  showView('view-home');
};
$('btn-sale-add-cust').onclick = ()=>customerForm(null, ()=>renderSale());
$('btn-add-cust').onclick = ()=>customerForm(null, ()=>renderKhata());

/* ---------- Purchase ---------- */
let purQ = '';
$('pur-search').oninput = e=>{ purQ = e.target.value.toLowerCase(); renderPurchase(); };
function renderPurchase(){
  const list = DB.products.filter(p=>p.name.toLowerCase().includes(purQ));
  $('pur-list').innerHTML = list.map(p=>`
    <div class="pitem">${pimgHtml(p)}
      <div class="pinfo"><div class="pname">${esc(p.name)}</div><div class="psub">${lang==='ur'?'موجودہ':'In stock'}: <b>${p.qty}</b> • ${lang==='ur'?'خرید':'cost'}: ${fmt(p.buyPrice)}</div></div>
      <button class="btn small" onclick="purchaseFor(${p.id})">🛒 ${lang==='ur'?'خریدیں':'Buy'}</button>
    </div>`).join('') || `<p style="text-align:center;color:var(--sub)">${lang==='ur'?'پہلے پروڈکٹ شامل کریں':'Add a product first'}</p>`;
}
window.purchaseFor = id=>{
  const p = DB.products.find(x=>x.id===id);
  openModal(`<h3>🛒 ${esc(p.name)}</h3>
    <label class="fld"><span>${lang==='ur'?'مقدار':'Quantity'}</span><input id="pu-qty" type="number" min="1" value="1"></label>
    <label class="fld"><span>${lang==='ur'?'فی یونٹ خرید قیمت':'Cost per unit'} (₨)</span><input id="pu-cost" type="number" min="0" value="${p.buyPrice}"></label>
    <div class="mrow"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" id="pu-save">${t('save')}</button></div>`);
  $('pu-save').onclick = ()=>{
    const q = Math.max(1, parseInt($('pu-qty').value)||1), cost = Math.max(0, parseFloat($('pu-cost').value)||0);
    p.qty += q; p.buyPrice = cost;
    DB.purchases.push({id:DB.seq.pu++, productId:p.id, name:p.name, qty:q, cost:cost*q, date:todayStr(), ts:Date.now()});
    DB.cash -= cost*q;
    save(); closeModal(); renderPurchase(); renderHome();
    toast('✅ '+(lang==='ur'?'اسٹاک بڑھ گیا':'Stock added'));
  };
};

/* ---------- Khata (credit) ---------- */
function renderKhata(){
  $('k-total').textContent = fmt(totalCredit());
  $('cust-list').innerHTML = DB.customers.map(c=>`
    <div class="pitem">
      <div class="pimg emoji">👤</div>
      <div class="pinfo"><div class="pname">${esc(c.name)}</div><div class="psub">${esc(c.phone||'')}</div>
      <div class="pqty ${c.balance>0?'low':''}">${lang==='ur'?'باقی':'Balance'}: ${fmt(c.balance)}</div></div>
      <button class="btn small primary" onclick="receivePayment(${c.id})">💵 ${lang==='ur'?'وصول':'Receive'}</button>
      <button class="icon-btn" onclick="delCustomer(${c.id})">🗑️</button>
    </div>`).join('') || `<p style="text-align:center;color:var(--sub)">${lang==='ur'?'کوئی گاہک نہیں':'No customers'}</p>`;
}
function customerForm(c, after){
  const isNew = !c; c = c || {name:'', phone:''};
  openModal(`<h3>${isNew?t('newCustomer'):t('edit')}</h3>
    <label class="fld"><span>${lang==='ur'?'نام':'Name'}</span><input id="cf-name" value="${esc(c.name)}"></label>
    <label class="fld"><span>${lang==='ur'?'فون':'Phone'}</span><input id="cf-phone" value="${esc(c.phone||'')}" inputmode="tel"></label>
    <div class="mrow"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" id="cf-save">${t('save')}</button></div>`);
  $('cf-save').onclick = ()=>{
    const name = $('cf-name').value.trim(); if(!name){ toast(lang==='ur'?'نام لکھیں':'Enter name'); return; }
    if(isNew) DB.customers.push({id:DB.seq.c++, name, phone:$('cf-phone').value.trim(), balance:0});
    else Object.assign(c,{name, phone:$('cf-phone').value.trim()});
    save(); closeModal(); (after||renderKhata)(); toast('✅');
  };
}
window.receivePayment = id=>{
  const c = DB.customers.find(x=>x.id===id);
  openModal(`<h3>💵 ${esc(c.name)} <small>(${fmt(c.balance)})</small></h3>
    <label class="fld"><span>${lang==='ur'?'وصول شدہ رقم':'Amount received'} (₨)</span><input id="rp-amt" type="number" min="1" value="${c.balance}"></label>
    <div class="mrow"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" id="rp-save">${t('save')}</button></div>`);
  $('rp-save').onclick = ()=>{
    const a = Math.max(0, parseFloat($('rp-amt').value)||0);
    c.balance = Math.max(0, c.balance - a); DB.cash += a;
    save(); closeModal(); renderKhata(); renderHome(); toast('✅ '+fmt(a));
  };
};
window.delCustomer = id=>{
  const c = DB.customers.find(x=>x.id===id);
  if(c.balance>0 && !confirm(lang==='ur'?'اس گاہک کا ادھار باقی ہے! پھر بھی حذف کریں؟':'Customer still owes money! Delete anyway?')) return;
  if(c.balance===0 && !confirm(lang==='ur'?'حذف کریں؟':'Delete?')) return;
  DB.customers = DB.customers.filter(x=>x.id!==id); save(); renderKhata();
};

/* ---------- Reports ---------- */
let repRange = 'today';
document.querySelectorAll('.rep-filters .chip').forEach(ch=>ch.onclick=()=>{
  document.querySelectorAll('.rep-filters .chip').forEach(x=>x.classList.remove('active'));
  ch.classList.add('active'); repRange = ch.dataset.range; renderReports();
});
function inRange(ts){
  const d = new Date(ts), now = new Date();
  if(repRange==='today') return d.toDateString()===now.toDateString();
  if(repRange==='week'){ const w = new Date(now); w.setDate(w.getDate()-7); return d>=w; }
  if(repRange==='month'){ const m = new Date(now); m.setMonth(m.getMonth()-1); return d>=m; }
  return true;
}
function renderReports(){
  const sales = DB.sales.filter(s=>inRange(s.ts)), purs = DB.purchases.filter(p=>inRange(p.ts));
  const sTotal = sales.reduce((a,s)=>a+s.total,0);
  const profit = sales.reduce((a,s)=>a + s.items.reduce((x,i)=>x + i.qty*((i.price||0)-(i.cost||0)),0),0);
  const pTotal = purs.reduce((a,p)=>a+p.cost,0);
  $('r-sales').textContent = fmt(sTotal);
  $('r-profit').textContent = fmt(profit);
  $('r-pur').textContent = fmt(pTotal);
  $('r-count').textContent = sales.length;
  const rows = sales.slice().reverse().slice(0,50).map(s=>`
    <div class="rep-row"><div>🧾 #${s.id}<div class="dt">${new Date(s.ts).toLocaleString()} • ${s.payment==='cash'?(lang==='ur'?'نقد':'Cash'):(lang==='ur'?'ادھار':'Credit')}</div></div>
    <div class="amt">${fmt(s.total)}</div></div>`).join('');
  $('rep-list').innerHTML = rows || `<p style="text-align:center;color:var(--sub)">${lang==='ur'?'کوئی ریکارڈ نہیں':'No records'}</p>`;
}

/* ---------- Backup ---------- */
$('btn-export').onclick = ()=>{
  const blob = new Blob([JSON.stringify(DB,null,1)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'stock-record-backup-'+todayStr()+'.json';
  a.click(); URL.revokeObjectURL(a.href);
  toast('💾 '+(lang==='ur'?'بیک اپ ڈاؤن لوڈ ہو گیا':'Backup downloaded'));
};
$('btn-import').onclick = ()=>$('import-file').click();
$('import-file').onchange = e=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const d = JSON.parse(r.result);
      if(!d.products || !d.seq) throw 0;
      if(!confirm(lang==='ur'?'موجودہ ڈیٹا مٹ جائے گا۔ جاری رکھیں؟':'Current data will be replaced. Continue?')) return;
      DB = d; save(); renderAll(); toast('✅ '+(lang==='ur'?'بیک اپ بحال ہو گیا':'Backup restored'));
    }catch(err){ toast('❌ '+(lang==='ur'?'غلط فائل':'Invalid file')); }
  };
  r.readAsText(f); e.target.value='';
};
$('btn-reset').onclick = ()=>{
  if(confirm(lang==='ur'?'سچ میں سب کچھ حذف کریں؟':'Really delete ALL data?') && confirm(lang==='ur'?'آخری وارننگ!':'Final warning!')){
    DB = defaultDB(); save(); cart=[]; renderAll(); toast('🗑️ '+(lang==='ur'?'صاف ہو گیا':'Cleared'));
  }
};

/* ---------- Init ---------- */
function renderAll(){ renderHome(); renderStock(); renderSale(); renderPurchase(); renderKhata(); renderReports(); }
load(); applyLang(); renderAll(); showView('view-home');
