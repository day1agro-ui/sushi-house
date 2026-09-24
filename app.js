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
function openProductModal(i){
  const p=products[i];
  if(!p)return;
  $('productModalTitle').textContent=p.name||'';
  $('productModalDesc').textContent=p.desc||'Описание блюда уточняется.';
  $('productModalComposition').textContent=p.composition||p.desc||'—';
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
  $('productModal').classList.add('open');
  $('productModal').setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
}
function closeProductModal(){
  $('productModal').classList.remove('open');
  $('productModal').setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
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
function checkout(){alert('Оформление заказа подключим следующим этапом. Корзина сохранена.');}

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
  $('cartItems').addEventListener('click',e=>{const q=e.target.closest('[data-qty-index]');if(q){e.stopPropagation();qty(Number(q.dataset.qtyIndex),Number(q.dataset.qtyDelta));return;}const r=e.target.closest('[data-remove-index]');if(r){e.stopPropagation();removeItem(Number(r.dataset.removeIndex));return;}const preview=e.target.closest('[data-cart-product-preview]');if(preview){openProductModal(Number(preview.dataset.cartProductPreview));return;}});
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
    setView('categories');
  }catch(error){
    console.error('SUSHI HOUSE menu load failed:',error);
    document.body.insertAdjacentHTML('beforeend','<div style="position:fixed;inset:auto 12px 12px 12px;z-index:9999;padding:14px 16px;border-radius:14px;background:#181818;color:#fff;font:600 14px/1.4 system-ui">Не удалось загрузить меню. Обновите страницу.</div>');
  }
});
