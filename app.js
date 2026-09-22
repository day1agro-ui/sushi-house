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
function render(list=products.slice(0,5)){document.getElementById('productGrid').innerHTML=list.map((p,i)=>`<article class="product"><div class="product-img">${p.emoji}</div><div class="product-body"><h3>${p.name}</h3><p>${p.desc}</p><div class="meta">${p.weight} <span class="price">${p.price} ₽</span></div><button class="add" onclick="addToCart(${products.indexOf(p)})">🛒 В корзину</button></div></article>`).join('')}
function addToCart(i){cart.push(products[i]);updateCart();openCart()}
function updateCart(){document.getElementById('cartCount').textContent=cart.length;document.getElementById('cartItems').innerHTML=cart.length?cart.map((p,i)=>`<div class="cart-item"><div class="emoji">${p.emoji}</div><div><b>${p.name}</b><small>${p.weight} · ${p.price} ₽</small></div><button onclick="removeFromCart(${i})">×</button></div>`).join(''):'<p style="color:#777">Корзина пока пустая. Выберите что-нибудь вкусное 🍣</p>';document.getElementById('cartTotal').textContent=cart.reduce((s,p)=>s+p.price,0)+' ₽'}
function removeFromCart(i){cart.splice(i,1);updateCart()}
function openCart(){document.getElementById('cartOverlay').classList.add('open');updateCart()}
function closeCart(e){if(!e||e.target===document.getElementById('cartOverlay'))document.getElementById('cartOverlay').classList.remove('open')}
function filterCategory(cat){document.querySelectorAll('.cat').forEach(x=>x.classList.toggle('active',x.dataset.cat===cat));render(products.filter(p=>p.cat===cat));document.getElementById('menu').scrollIntoView({behavior:'smooth'})}
function showAll(){render(products);document.querySelectorAll('.cat').forEach(x=>x.classList.remove('active'))}
function scrollToMenu(){document.getElementById('menu').scrollIntoView({behavior:'smooth'})}
function toggleMenu(){document.getElementById('mobileMenu').classList.toggle('open')}
document.querySelectorAll('.cat').forEach(x=>x.addEventListener('click',()=>filterCategory(x.dataset.cat)));
function checkout(){if(!cart.length){alert('Добавьте блюда в корзину');return}alert('Демо-заказ: следующий шаг — подключаем реальную форму оформления и оплату.');}
render();updateCart();
