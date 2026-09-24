let cart=[];
let modalDraftQty=1;
const $=id=>document.getElementById(id);
const money=n=>Number(n).toLocaleString('ru-RU')+' ₽';

// v9: one navigation tree, one event system, no inline category handlers.
const MENU_TREE=[
  {id:'popular',title:'Популярное',sub:'Все доступные блюда',icon:'⭐',direct:true,filter:'popular'},
  {id:'sushi',title:'Суши',sub:'Классические суши',icon:'🍣',children:[
    {id:'classic-sushi',title:'Классические суши',sub:'Нигири с лососем, креветкой и угрем',icon:'🍣',filter:'Суши'}
  ]},
  {id:'sets',title:'Сеты',sub:'Выгодные наборы',icon:'🍱',direct:true,filter:'Сеты'},
  {id:'rolls',title:'Роллы',sub:'Лосось, угорь, креветка и другие',icon:'🥢',children:[
    {id:'salmon-rolls',title:'С лососем',sub:'Филадельфия, Лава, Аляска и другие',icon:'🐟',filter:'Роллы с лососем'},
    {id:'eel-rolls',title:'С копчёным угрём',sub:'Унаги и фирменные роллы',icon:'🍣',filter:'Роллы с копченым угрем'},
    {id:'shrimp-rolls',title:'С креветкой',sub:'Эби, Сенсей и другие',icon:'🍤',filter:'Роллы с креветкой'},
    {id:'crab-rolls',title:'С крабовым мясом',sub:'Бостон, Калифорния и другие',icon:'🦀',filter:'Роллы с крабовым мясом'},
    {id:'chicken-rolls',title:'С курицей',sub:'Дакота, Цезарь и Окава',icon:'🍗',filter:'Роллы с куриным филе'},
    {id:'veg-rolls',title:'Вегетарианские',sub:'Свежие и лёгкие роллы',icon:'🥒',filter:'Роллы вегетарианские'}
  ]},
  {id:'baked',title:'Запечённые',sub:'Горячие и сытные роллы',icon:'🔥',direct:true,filter:'Запечённые роллы'},
  {id:'hot-rolls',title:'Горячие роллы',sub:'Темпура и горячая подача',icon:'⚡',direct:true,filter:'Горячие роллы'},
  {id:'wok',title:'WOK',sub:'Горячие блюда по-азиатски',icon:'🍜',direct:true,filter:'Горячие блюда'},
  {id:'soups',title:'Супы',sub:'Том-Ям, Том-Кха и рамен',icon:'🥣',children:[
    {id:'tom-yam',title:'Том-Ям',sub:'Остро-кислый тайский суп',icon:'🌶️',test:p=>/том-ям/i.test(p.name)},
    {id:'tom-kha',title:'Том-Кха',sub:'Сливочный тайский суп',icon:'🥥',test:p=>/том-кха/i.test(p.name)},
    {id:'ramen',title:'Рамен',sub:'Японский суп с лапшой',icon:'🍜',test:p=>/рамен/i.test(p.name)}
  ]},
  {id:'salads',title:'Салаты',sub:'Свежие и лёгкие',icon:'🥗',direct:true,filter:'Салаты'},
  {id:'hot-dishes',title:'Горячие блюда',sub:'Полноценные блюда',icon:'🍛',direct:true,filter:'Горячие блюда'},
  {id:'snacks',title:'Закуски',sub:'Для компании и перекуса',icon:'🍤',direct:true,filter:'Закуски'},
  {id:'pizza',title:'Пицца',sub:'Классические вкусы',icon:'🍕',direct:true,filter:'Пицца'},
  {id:'desserts',title:'Десерты',sub:'Сладкое к заказу',icon:'🍰',direct:true,filter:'Десерты'},
  {id:'extras',title:'Дополнительно',sub:'Соусы, имбирь, васаби и палочки',icon:'🥤',direct:true,filter:'Сопутствующие товары'}
];

function findCategory(id){
  for(const c of MENU_TREE){
    if(c.id===id)return c;
    if(c.children){const child=c.children.find(x=>x.id===id);if(child)return child;}
  }
  return null;
}
function matches(item, rule){
  if(!rule)return false;
  if(rule==='popular')return item.available;
  if(typeof rule==='function')return rule(item);
  return item.cat===rule;
}
function categoryCount(rule){return products.filter(p=>p.available && matches(p,rule)).length;}
function treeCount(c){
  if(c.direct)return categoryCount(c.filter);
  return (c.children||[]).reduce((sum,ch)=>sum+categoryCount(ch.filter||ch.test),0);
}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}

function categoryImage(id){
  const images={
    popular:'assets/categories/salmon.webp',
    sushi:'assets/categories/sushi.webp',
    sets:'assets/categories/sets.webp',
    rolls:'assets/categories/salmon.webp',
    baked:'assets/categories/baked.webp',
    'hot-rolls':'assets/categories/hot-rolls.webp',
    wok:'assets/categories/wok.webp',
    soups:'assets/categories/soups.webp',
    salads:'assets/categories/salads.webp',
    'hot-dishes':'assets/categories/hot-dishes.webp',
    snacks:'assets/categories/snacks.webp',
    pizza:'assets/categories/pizza.webp',
    desserts:'assets/categories/desserts.webp',
    extras:'assets/categories/extras.webp'
  };
  return images[id] || 'assets/categories/salmon.webp';
}

function renderCategoryGrid(){
  const grid=$('categoryGrid');
  if(!grid)return;
  grid.innerHTML=MENU_TREE.map(c=>`<button type="button" class="category-card" data-category-id="${c.id}">
    <span class="category-icon"><img src="${categoryImage(c.id)}" alt="" loading="lazy"></span><strong>${escapeHtml(c.title)}</strong><small>${escapeHtml(c.sub)}</small>
    <em class="category-count">${treeCount(c)} ${treeCount(c)===1?'позиция':'позиций'}</em><span class="tileArrow">→</span>
  </button>`).join('');
}

function setView(mode){
  $('categoryHub').hidden=mode!=='categories';
  $('menuView').hidden=mode!=='subcategories';
  $('productsSection').hidden=mode!=='products';
}
function openCategory(id){
  const c=findCategory(id);
  if(!c)return;
  if(c.direct){showProducts(c.filter,c.title,c.sub);return;}
  setView('subcategories');
  $('menuViewTitle').textContent=c.title;
  $('menuViewSubtitle').textContent=c.sub;
  const grid=$('subcategoryGrid');
  grid.innerHTML=(c.children||[]).map((s,i)=>{
    const rule=s.filter||s.test;
    const count=categoryCount(rule);
    return `<button type="button" class="subcategoryTile" data-parent-id="${c.id}" data-sub-index="${i}">
      <span>${s.icon}</span><div><strong>${escapeHtml(s.title)}</strong><small>${escapeHtml(s.sub)}</small><em>${count} ${count===1?'позиция':'позиций'}</em></div><b>→</b>
    </button>`;
  }).join('');
  $('menuView').scrollIntoView({behavior:'smooth',block:'start'});
}
function backToCategories(){setView('categories');$('categoryHub').scrollIntoView({behavior:'smooth',block:'start'});}
function showProducts(rule,title,sub){
  const list=products.filter(p=>matches(p,rule));
  setView('products');
  render(list,title,sub);
  $('productsSection').scrollIntoView({behavior:'smooth',block:'start'});
}
function cartQty(productIndex){return cart.find(x=>x.product===productIndex)?.qty||0;}
function productAction(i){const q=cartQty(i);return q?`<div class="productQty"><button type="button" data-product-qty="${i}" data-product-delta="-1">−</button><strong>${q}</strong><button type="button" data-product-qty="${i}" data-product-delta="1">+</button></div>`:`<button type="button" class="add" data-add-index="${i}">Добавить</button>`;}
function refreshProductControls(){document.querySelectorAll('[data-product-card-index]').forEach(card=>{const i=Number(card.dataset.productCardIndex);const holder=card.querySelector('.productAction');if(holder)holder.innerHTML=productAction(i);});}
function render(list,title='Популярное',sub='Реальное меню SUSHI HOUSE'){
  $('menuTitle').textContent=title;
  $('menuSubtitle').textContent=`${sub} · ${list.length} ${list.length===1?'позиция':'позиций'}`;
  $('productGrid').innerHTML=list.map(p=>{
    const i=products.indexOf(p);
    return `<article class="product ${p.available?'':'sold'}" data-product-card-index="${i}" data-product-index="${i}"><div class="productImg">${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async">` : p.emoji}</div><div class="productBody"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.desc)}</p><div class="meta"><span>${escapeHtml(p.weight||'')}</span><strong class="price">${p.available?money(p.price):'Нет в наличии'}</strong></div><div class="productAction">${p.available?productAction(i):`<button type="button" class="add" disabled>Нет в наличии</button>`}</div></div></article>`;
  }).join('') || '<p class="emptyMenu">В этом разделе пока нет доступных позиций.</p>';
}
function openProductModal(i, fromCart=false){
  const p=products[i];
  if(!p)return;
  $('productModalTitle').textContent=p.name||'';
  const descText=(p.desc||'Описание блюда уточняется.').trim();
  const compositionText=(p.composition||'').trim();
  $('productModalDesc').textContent=descText;
  const compositionBox=$('productModalCompositionBox');
  const compositionEl=$('productModalComposition');
  const compositionToggle=$('productModalCompositionToggle');
  const hasDistinctComposition=!!compositionText && compositionText!==descText;
  compositionBox.hidden=!hasDistinctComposition;
  compositionToggle.hidden=true;
  compositionEl.classList.remove('expanded');
  if(hasDistinctComposition){
    compositionEl.textContent=compositionText;
    requestAnimationFrame(()=>{
      const needsExpand=compositionEl.scrollHeight>compositionEl.clientHeight+2;
      compositionToggle.hidden=!needsExpand;
      compositionToggle.textContent='Развернуть';
    });
  } else {
    compositionEl.textContent='';
  }
  $('productModalWeight').textContent=p.weight||'—';
  $('productModalPrice').textContent=p.available?money(p.price):'Нет в наличии';
  const media=$('productModalImage');
  media.innerHTML=p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" decoding="async">` : `<span>${p.emoji||'🍣'}</span>`;
  const add=$('productModalAdd');
  add.dataset.productIndex=i;
  add.disabled=!p.available;
  modalDraftQty=1;
  $('productModalQtyValue').textContent=modalDraftQty;
  const currentQty=cartQty(i);
  add.textContent=p.available?(currentQty?`Добавить ещё · ${money(p.price*modalDraftQty)}`:`Добавить в корзину · ${money(p.price*modalDraftQty)}`):'Нет в наличии';
  const modalBody=$('productModal').querySelector('.productModalBody');
  const resetModalScroll=()=>{
    if(!modalBody) return;
    modalBody.style.scrollBehavior='auto';
    modalBody.scrollTop=0;
    modalBody.scrollTo({top:0,left:0,behavior:'auto'});
    if(modalBody.parentElement) modalBody.parentElement.scrollTop=0;
  };
  resetModalScroll();
  $('productModal').classList.add('open');
  $('productModal').setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  document.body.classList.toggle('modal-from-cart', !!fromCart);
  resetModalScroll();
  requestAnimationFrame(()=>{
    resetModalScroll();
    requestAnimationFrame(resetModalScroll);
  });
  setTimeout(resetModalScroll, 80);
  const modalImg=modalBody?.parentElement?.querySelector('#productModalImage img');
  if(modalImg && !modalImg.complete){
    modalImg.addEventListener('load', resetModalScroll, {once:true});
  }
}

function closeProductModal(){
  $('productModal').classList.remove('open');
  $('productModal').setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
  document.body.classList.remove('modal-from-cart');
}

function addToCart(i){addQtyToCart(i,1);}
function addQtyToCart(i,amount){
  if(!products[i]?.available || amount<1)return;
  const x=cart.find(v=>v.product===i);
  if(x)x.qty+=amount;else cart.push({product:i,qty:amount});
  updateCart();
}
function updateCart(){
  refreshProductControls();
  const count=cart.reduce((s,x)=>s+x.qty,0),total=cart.reduce((s,x)=>s+products[x.product].price*x.qty,0);
  $('cartCount').textContent=count;$('stickyCount').textContent=count;$('cartTotal').textContent=money(total);$('stickyTotal').textContent=money(total);
  $('cartItems').innerHTML=cart.length?cart.map((x,i)=>{const p=products[x.product];return `<div class="cartItem" data-cart-product-index="${x.product}"><button type="button" class="cartProductPreview" data-cart-product-preview="${x.product}" aria-label="Подробнее: ${escapeHtml(p.name)}"><div class="emoji">${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async">` : p.emoji}</div><div class="cartProductText"><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.weight||'')} · ${money(p.price*x.qty)}</small></div></button><div class="qty"><button type="button" data-qty-index="${i}" data-qty-delta="-1">−</button><strong>${x.qty}</strong><button type="button" data-qty-index="${i}" data-qty-delta="1">+</button></div><button type="button" class="remove" data-remove-index="${i}">×</button></div>`}).join(''):'<p style="color:#777">Корзина пока пустая. Выберите что-нибудь вкусное 🍣</p>';
}
function qty(i,d){if(!cart[i])return;cart[i].qty+=d;if(cart[i].qty<1)cart.splice(i,1);updateCart();}
function removeItem(i){cart.splice(i,1);updateCart();}
function openCart(){$('cartOverlay').classList.add('open');updateCart();}
function closeCart(e){if(!e||e.target===$('cartOverlay'))$('cartOverlay').classList.remove('open');}
function filterCategory(cat){const map={'Сеты':'sets','Суши':'sushi','Роллы':'rolls','WOK':'wok','Том-Ям':'tom-yam'};const id=map[cat];if(id==='tom-yam'){const c=findCategory('soups');showProducts(c.children[0].test,c.children[0].title,c.children[0].sub);}else if(id)openCategory(id);else showProducts(cat,cat,'');}
function showAll(){showProducts('popular','Всё меню','Все доступные блюда SUSHI HOUSE');}
function scrollToMenu(){$('categoryHub').scrollIntoView({behavior:'smooth',block:'start'});}
function toggleMenu(){$('mobileMenu').classList.toggle('open');}

function formatRussianPhone(value){
  let digits=String(value||'').replace(/\D/g,'');
  if(digits.startsWith('8')) digits='7'+digits.slice(1);
  if(digits.startsWith('7')) digits=digits.slice(1);
  digits=digits.slice(0,10);
  let out='+7';
  if(digits.length) out+=' '+digits.slice(0,3);
  if(digits.length>3) out+=' '+digits.slice(3,6);
  if(digits.length>6) out+='-'+digits.slice(6,8);
  if(digits.length>8) out+='-'+digits.slice(8,10);
  return out;
}
function phoneDigits(value){
  let digits=String(value||'').replace(/\D/g,'');
  if(digits.startsWith('8')) digits='7'+digits.slice(1);
  if(digits.startsWith('7')) return digits;
  if(digits.length) return '7'+digits.slice(0,10);
  return '';
}
function initPhoneField(){
  const input=$('orderPhone');
  if(!input)return;
  input.addEventListener('input',()=>{
    input.value=formatRussianPhone(input.value);
    input.setCustomValidity(phoneDigits(input.value).length===11?'':'Введите полный номер телефона');
  });
  input.addEventListener('focus',()=>{
    if(!input.value) input.value='+7 ';
    requestAnimationFrame(()=>{try{input.setSelectionRange(input.value.length,input.value.length)}catch(_){}});
  });
}


let addressSuggestTimer=null;
let addressSuggestions=[];
let addressAbort=null;
let addressSelected=false;
const NOVOSIBIRSK_CITY='Новосибирск';
const NOVOSIBIRSK_CITY_KLADR='5400000100000';

function clearAddressSuggestions(){
  const box=$('addressSuggestions');
  if(!box)return;
  box.innerHTML='';
  box.hidden=true;
  addressSuggestions=[];
}

function escapeHtml(value){
  return String(value||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&quot;'}[c]));
}

function renderAddressSuggestions(items){
  const box=$('addressSuggestions');
  if(!box)return;
  addressSuggestions=items;
  box.innerHTML=items.map((item,i)=>{
    const value=escapeHtml(item.value);
    const full=escapeHtml(item.full);
    return `<button type="button" class="addressSuggestion" data-address-index="${i}" role="option"><strong>${value}</strong>${full&&full!==value?`<small>${full}</small>`:''}</button>`;
  }).join('');
  box.hidden=!items.length;
}

function normalizeNominatimResult(item){
  const a=item.address||{};
  const road=a.road||a.pedestrian||a.cycleway||a.footway||'';
  const house=a.house_number||'';
  if(!road)return null;
  const value=[road,house].filter(Boolean).join(', ');
  const full=[value,a.postcode].filter(Boolean).join(', ');
  return {
    value,
    full,
    kladr_id:NOVOSIBIRSK_CITY_KLADR,
    city:NOVOSIBIRSK_CITY,
    osm_id:item.osm_id||'',
    osm_type:item.osm_type||''
  };
}

async function fetchAddressSuggestions(query){
  const q=query.trim();
  if(q.length<2){clearAddressSuggestions();return;}
  if(addressAbort)addressAbort.abort();
  addressAbort=new AbortController();
  try{
    const params=new URLSearchParams({
      q:`${q}, ${NOVOSIBIRSK_CITY}, Россия`,
      format:'jsonv2',
      addressdetails:'1',
      limit:'8',
      countrycodes:'ru',
      layer:'address',
      viewbox:'82.45,55.20,83.35,54.75',
      bounded:'1',
      'accept-language':'ru'
    });
    const res=await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`,{signal:addressAbort.signal,headers:{Accept:'application/json'}});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    const items=data.map(normalizeNominatimResult).filter(Boolean).filter(x=>x.city===NOVOSIBIRSK_CITY);
    renderAddressSuggestions(items);
  }catch(err){
    if(err?.name!=='AbortError') clearAddressSuggestions();
  }
}

function initAddressAutocomplete(){
  const input=$('orderAddress'), box=$('addressSuggestions');
  if(!input||!box)return;
  input.addEventListener('input',()=>{
    addressSelected=false;
    input.setCustomValidity('Выберите адрес из подсказок');
    $('orderKladr').value='';
    $('orderFias').value='';
    $('orderCityKladr').value=NOVOSIBIRSK_CITY_KLADR;
    $('addressHint').textContent='Начните вводить улицу или дом.';
    clearTimeout(addressSuggestTimer);
    const q=input.value;
    addressSuggestTimer=setTimeout(()=>fetchAddressSuggestions(q),450);
  });
  input.addEventListener('focus',()=>{
    if(input.value.trim().length>=2) fetchAddressSuggestions(input.value);
  });
  box.addEventListener('click',e=>{
    const item=e.target.closest('[data-address-index]');
    if(!item)return;
    const data=addressSuggestions[Number(item.dataset.addressIndex)];
    if(!data)return;
    input.value=data.value||data.full||'';
    addressSelected=true;
    input.setCustomValidity('');
    $('orderKladr').value=data.kladr_id||NOVOSIBIRSK_CITY_KLADR;
    $('orderCityKladr').value=NOVOSIBIRSK_CITY_KLADR;
    $('orderFias').value='';
    clearAddressSuggestions();
    $('addressHint').textContent='Адрес выбран.';
  });
  document.addEventListener('click',e=>{
    if(!e.target.closest('#addressField'))clearAddressSuggestions();
  });
}

function checkout(){
  if(!cart.length)return;
  renderCheckoutSummary();
  $('checkoutOverlay').classList.add('open');
  $('checkoutOverlay').setAttribute('aria-hidden','false');
  $('checkoutForm').hidden=false;
  $('checkoutSuccess').hidden=true;
  $('checkoutOverlay').querySelector('#orderName')?.focus({preventScroll:true});
}
function closeCheckout(){
  $('checkoutOverlay').classList.remove('open');
  $('checkoutOverlay').setAttribute('aria-hidden','true');
}
function checkoutTotals(){
  const itemsTotal=cart.reduce((s,x)=>s+products[x.product].price*x.qty,0);
  const delivery=$('checkoutForm')?.querySelector('input[name="delivery"]:checked')?.value==='pickup'?0:null;
  return {itemsTotal,delivery,total:delivery===null?itemsTotal:itemsTotal+delivery};
}
function renderCheckoutSummary(){
  const t=checkoutTotals();
  $('checkoutItemsTotal').textContent=money(t.itemsTotal);
  $('checkoutDeliveryTotal').textContent=t.delivery===null?'Рассчитаем':money(t.delivery);
  $('checkoutGrandTotal').textContent=money(t.total);
}
function updateCheckoutDelivery(){
  const delivery=$('checkoutForm').querySelector('input[name="delivery"]:checked')?.value==='delivery';
  $('addressField').hidden=!delivery;
  $('orderAddress').required=delivery;
  renderCheckoutSummary();
}
function submitCheckout(e){
  e.preventDefault();
  if(!cart.length)return;
  const phone=$('orderPhone');
  const phoneValue=phoneDigits(phone?.value);
  if(phone) phone.setCustomValidity(phoneValue.length===11?'':'Введите полный номер телефона');
  if(!e.currentTarget.reportValidity())return;
  $('checkoutForm').hidden=true;
  $('checkoutSuccess').hidden=false;
}


function bindEvents(){
  $('categoryGrid').addEventListener('click',e=>{const card=e.target.closest('[data-category-id]');if(!card)return;e.preventDefault();openCategory(card.dataset.categoryId);});
  $('subcategoryGrid').addEventListener('click',e=>{const btn=e.target.closest('[data-sub-index]');if(!btn)return;e.preventDefault();const parent=findCategory(btn.dataset.parentId);const sub=parent?.children?.[Number(btn.dataset.subIndex)];if(sub)showProducts(sub.filter||sub.test,sub.title,sub.sub);});
  $('productGrid').addEventListener('click',e=>{const add=e.target.closest('[data-add-index]');if(add){addToCart(Number(add.dataset.addIndex));return;}const q=e.target.closest('[data-product-qty]');if(q){const i=Number(q.dataset.productQty),d=Number(q.dataset.productDelta);if(d>0)addToCart(i);else{const x=cart.find(v=>v.product===i);if(x){x.qty--;if(x.qty<1)cart.splice(cart.indexOf(x),1);updateCart();}}return;}const card=e.target.closest('[data-product-index]');if(card)openProductModal(Number(card.dataset.productIndex));});
  $('productModal').addEventListener('click',e=>{if(e.target.closest('[data-product-modal-close]'))closeProductModal();});
  $('productModalAdd').addEventListener('click',e=>{
    const i=Number(e.currentTarget.dataset.productIndex);
    if(!products[i]?.available || modalDraftQty<1)return;
    const amount=modalDraftQty;
    addQtyToCart(i,amount);
    closeProductModal();
  });
  $('productModalCompositionToggle').addEventListener('click',()=>{
    const box=$('productModalComposition');
    const btn=$('productModalCompositionToggle');
    box.classList.toggle('expanded');
    btn.textContent=box.classList.contains('expanded')?'Свернуть':'Развернуть';
  });
  $('productModalQty').addEventListener('click',e=>{
    const b=e.target.closest('[data-modal-delta]');
    if(!b)return;
    e.preventDefault();
    e.stopPropagation();
    const d=Number(b.dataset.modalDelta);
    modalDraftQty=Math.max(1,modalDraftQty+d);
    $('productModalQtyValue').textContent=modalDraftQty;
    const i=Number($('productModalAdd').dataset.productIndex);
    const p=products[i];
    const currentQty=cartQty(i);
    $('productModalAdd').textContent=currentQty?`Добавить ещё · ${money(p.price*modalDraftQty)}`:`Добавить в корзину · ${money(p.price*modalDraftQty)}`;
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && $('productModal').classList.contains('open'))closeProductModal();});
  $('cartItems').addEventListener('click',e=>{const q=e.target.closest('[data-qty-index]');if(q){e.stopPropagation();qty(Number(q.dataset.qtyIndex),Number(q.dataset.qtyDelta));return;}const r=e.target.closest('[data-remove-index]');if(r){e.stopPropagation();removeItem(Number(r.dataset.removeIndex));return;}const preview=e.target.closest('[data-cart-product-preview]');if(preview){openProductModal(Number(preview.dataset.cartProductPreview), true);return;}});
  $('checkoutOverlay').addEventListener('click',e=>{if(e.target.closest('[data-checkout-close]')||e.target===e.currentTarget.querySelector('.checkoutBackdrop'))closeCheckout();});
  $('checkoutForm').addEventListener('submit',submitCheckout);
  $('checkoutForm').querySelectorAll('input[name="delivery"]').forEach(r=>r.addEventListener('change',updateCheckoutDelivery));
  initPhoneField();
  initAddressAutocomplete();
  $('backToCategories').addEventListener('click',backToCategories);
  $('showAllButton').addEventListener('click',showAll);
}

let products=[];

async function loadMenu(){
  const response=await fetch('menu.json', {cache:'no-store'});
  if(!response.ok) throw new Error(`menu.json: ${response.status}`);
  const data=await response.json();
  if(!Array.isArray(data.products)) throw new Error('menu.json: products[] missing');
  products=data.products;
}

document.addEventListener('DOMContentLoaded',async()=>{
  try{
    await loadMenu();
    renderCategoryGrid();
    bindEvents();
    updateCart();
    updateCheckoutDelivery();
    setView('categories');
  }catch(error){
    console.error('SUSHI HOUSE menu load failed:',error);
    document.body.insertAdjacentHTML('beforeend','<div style="position:fixed;inset:auto 12px 12px 12px;z-index:9999;padding:14px 16px;border-radius:14px;background:#181818;color:#fff;font:600 14px/1.4 system-ui">Не удалось загрузить меню. Обновите страницу.</div>');
  }
});
