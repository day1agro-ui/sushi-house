const products=[
{name:'Филадельфия',cat:'Роллы',desc:'Лосось, сливочный сыр, огурец',weight:'230 г',price:590,emoji:'🍣'},
{name:'Калифорния',cat:'Роллы',desc:'Краб, авокадо, огурец, икра тобико',weight:'220 г',price:520,emoji:'🍣'},
{name:'Дракон',cat:'Роллы',desc:'Угорь, авокадо, соус унаги',weight:'240 г',price:650,emoji:'🍣'},
{name:'Спайси тунец',cat:'Роллы',desc:'Тунец, спайси соус, огурец',weight:'210 г',price:560,emoji:'🌶️'},
{name:'Темпура креветка',cat:'Роллы',desc:'Креветка, сливочный сыр, темпура',weight:'230 г',price:580,emoji:'🍤'},
{name:'Большой сет',cat:'Сеты',desc:'Ассорти любимых роллов',weight:'900 г',price:1390,emoji:'🍱'},
{name:'Сет Филадельфия',cat:'Сеты',desc:'Филадельфия и классические роллы',weight:'760 г',price:1190,emoji:'🍱'},
{name:'Суши лосось',cat:'Суши',desc:'Свежий лосось, рис',weight:'120 г',price:390,emoji:'🍣'},
{name:'WOK с курицей',cat:'WOK',desc:'Лапша, курица, овощи, соус',weight:'380 г',price:490,emoji:'🍜'},
{name:'WOK с креветкой',cat:'WOK',desc:'Лапша, креветка, овощи',weight:'380 г',price:590,emoji:'🍜'},
{name:'Том-Ям с креветкой',cat:'Том-Ям',desc:'Креветка, кокос, лемонграсс, лайм',weight:'450 г',price:620,emoji:'🥣'},
{name:'Том-Ям с курицей',cat:'Том-Ям',desc:'Курица, грибы, кокос, лайм',weight:'450 г',price:540,emoji:'🥣'},
{name:'Гёдза',cat:'Закуски',desc:'Японские пельмени с начинкой',weight:'180 г',price:390,emoji:'🥟'},
{name:'Креветки темпура',cat:'Закуски',desc:'Хрустящие креветки с соусом',weight:'160 г',price:490,emoji:'🍤'},
{name:'Морс ягодный',cat:'Напитки',desc:'Домашний охлажденный морс',weight:'500 мл',price:180,emoji:'🥤'}
];
let cart=[];
const money=n=>n.toLocaleString('ru-RU')+' ₽';
function render(list=products.slice(0,5)){
 document.getElementById('productGrid').innerHTML=list.map(p=>`<article class="product"><div class="product-img" aria-hidden="true">${p.emoji}</div><div class="product-body"><h3>${p.name}</h3><p>${p.desc}</p><div class="meta"><span>${p.weight}</span><span class="price">${money(p.price)}</span></div><button class="add" onclick="addToCart(${products.indexOf(p)})">🛒 В корзину</button></div></article>`).join('');
}
function addToCart(i){cart.push(products[i]);updateCart();}
function updateCart(){
 const total=cart.reduce((s,p)=>s+p.price,0);
 document.getElementById('cartCount').textContent=cart.length;
 document.getElementById('cartItems').innerHTML=cart.length?cart.map((p,i)=>`<div class="cart-item"><div class="emoji">${p.emoji}</div><div class="item-info"><b>${p.name}</b><small>${p.weight} · ${money(p.price)}</small></div><button aria-label="Удалить ${p.name}" onclick="removeFromCart(${i})">×</button></div>`).join(''):'<p style="color:#777">Корзина пока пустая. Выберите что-нибудь вкусное 🍣</p>';
 document.getElementById('cartTotal').textContent=money(total);
 const bar=document.getElementById('mobileCartBar');
 if(bar){bar.querySelector('.cart-summary').innerHTML=cart.length?`Корзина <strong>${cart.length} ${plural(cart.length,['товар','товара','товаров'])}</strong> · ${money(total)}`:'Корзина пока пустая';bar.querySelector('button').textContent=cart.length?'Открыть корзину':'Перейти к меню';}
}
function plural(n,a){return a[n%10===1&&n%100!==11?0:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?1:2]}
function removeFromCart(i){cart.splice(i,1);updateCart()}
function openCart(){document.getElementById('cartOverlay').classList.add('open');document.body.classList.add('no-scroll');updateCart()}
function closeCart(e){if(!e||e.target===document.getElementById('cartOverlay')){document.getElementById('cartOverlay').classList.remove('open');document.body.classList.remove('no-scroll')}}
function filterCategory(cat){document.querySelectorAll('.cat').forEach(x=>x.classList.toggle('active',x.dataset.cat===cat));render(products.filter(p=>p.cat===cat));document.getElementById('menu').scrollIntoView({behavior:'smooth',block:'start'})}
function showAll(){render(products);document.querySelectorAll('.cat').forEach(x=>x.classList.remove('active'));document.getElementById('menu').scrollIntoView({behavior:'smooth'})}
function scrollToMenu(){document.getElementById('menu').scrollIntoView({behavior:'smooth'})}
function toggleMenu(){document.getElementById('mobileMenu').classList.toggle('open')}
function checkout(){if(!cart.length){alert('Добавьте блюда в корзину');return}alert('Демо-заказ: следующий шаг — подключаем реальную форму оформления и оплату.')}
function mobileCartAction(){if(cart.length)openCart();else scrollToMenu()}
document.querySelectorAll('.cat').forEach(x=>x.addEventListener('click',()=>filterCategory(x.dataset.cat)));
render();updateCart();
