const STORE_PHONE = '5598999999999'; // troque pelo WhatsApp da lanchonete

const products = [
  {id:1, name:'X-Burguer', price:10, desc:'Pão, ovo, carne, tomate, alface, batata palha e molho especial.', emoji:'🍔'},
  {id:2, name:'X-Burguer Duplo', price:13, desc:'Versão com duas carnes de hambúrguer.', emoji:'🍔'},
  {id:3, name:'X-Tudão', price:14, desc:'Carne, bacon, calabresa, queijo, presunto, salada e molho especial.', emoji:'🥓'},
  {id:4, name:'X-Tudão Duplo', price:17, desc:'Versão reforçada com duas carnes.', emoji:'🍟'},
  {id:5, name:'Hot Dog Simples', price:10, desc:'Pão, salsicha, carne moída, salada, milho, queijo ralado e batata palha.', emoji:'🌭'},
  {id:6, name:'Bob Dog', price:17, desc:'Hot dog especial da casa.', emoji:'🌭'},
  {id:7, name:'Misto Quente na Chapa', price:8, desc:'Pão, ovo, queijo e presunto.', emoji:'🥪'}
];

const brl = value => value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const getOrders = () => JSON.parse(localStorage.getItem('orders') || '[]');
const saveOrders = orders => localStorage.setItem('orders', JSON.stringify(orders));

function renderMenu(){
  const grid = document.getElementById('menuGrid');
  grid.innerHTML = products.map(p => `
    <article class="product-card">
      <div class="product-img">${p.emoji}</div>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <p class="price">${brl(p.price)}</p>
      <a class="btn primary full" href="pedido.html?produto=${p.id}">Pedir este item</a>
    </article>
  `).join('');
}

function initOrderPage(){
  const select = document.getElementById('produto');
  select.innerHTML = products.map(p => `<option value="${p.id}">${p.name} - ${brl(p.price)}</option>`).join('');
  const idFromUrl = new URLSearchParams(location.search).get('produto');
  if(idFromUrl) select.value = idFromUrl;
  ['produto','quantidade','observacao','cliente','telefone'].forEach(id => document.getElementById(id).addEventListener('input', updateTotal));
  document.querySelectorAll('[data-price]').forEach(c => c.addEventListener('change', updateTotal));
  document.getElementById('orderForm').addEventListener('submit', saveOrder);
  updateTotal();
}

function currentOrderData(){
  const p = products.find(x => x.id == document.getElementById('produto').value);
  const qtd = Number(document.getElementById('quantidade').value || 1);
  const extras = [...document.querySelectorAll('[data-price]:checked')].map(e => ({name:e.value, price:Number(e.dataset.price)}));
  const extrasTotal = extras.reduce((sum,e)=>sum+e.price,0) * qtd;
  const total = (p.price * qtd) + extrasTotal;
  return {
    id: Date.now(), cliente: document.getElementById('cliente').value.trim(), telefone: document.getElementById('telefone').value.trim(),
    produto: p.name, quantidade:qtd, extras, observacao: document.getElementById('observacao').value.trim(), total, status:'novo', createdAt:new Date().toLocaleString('pt-BR')
  };
}

function updateTotal(){
  const order = currentOrderData();
  document.getElementById('total').textContent = brl(order.total);
  document.getElementById('orderPreview').innerHTML = `
    <b>Produto:</b> ${order.produto}<br>
    <b>Quantidade:</b> ${order.quantidade}<br>
    <b>Adicionais:</b> ${order.extras.length ? order.extras.map(e=>e.name).join(', ') : 'Nenhum'}<br>
    <b>Observação:</b> ${order.observacao || 'Nenhuma'}<br>
    <b>Total:</b> ${brl(order.total)}
  `;
}

function saveOrder(e){
  e.preventDefault();
  const order = currentOrderData();
  const orders = getOrders();
  orders.unshift(order); saveOrders(orders);
  alert('Pedido salvo no teste local!');
  document.getElementById('orderForm').reset(); updateTotal();
}

function whatsappMessage(){
  const o = currentOrderData();
  return `Olá! Quero fazer um pedido:%0ACliente: ${o.cliente}%0ATelefone: ${o.telefone}%0AProduto: ${o.produto}%0AQuantidade: ${o.quantidade}%0AAdicionais: ${o.extras.map(e=>e.name).join(', ') || 'Nenhum'}%0AObservação: ${o.observacao || 'Nenhuma'}%0ATotal: ${brl(o.total)}`;
}
function sendWhatsAppPreview(){ window.open(`https://wa.me/${STORE_PHONE}?text=${whatsappMessage()}`, '_blank'); }

function adminLogin(){
  const u = document.getElementById('adminUser').value;
  const p = document.getElementById('adminPass').value;
  if(u === 'admin' && p === '1234'){ localStorage.setItem('adminLogged','1'); initAdmin(); }
  else alert('Usuário ou senha inválidos.');
}
function adminLogout(){ localStorage.removeItem('adminLogged'); initAdmin(); }
function initAdmin(){
  const logged = localStorage.getItem('adminLogged') === '1';
  document.getElementById('loginBox').classList.toggle('hidden', logged);
  document.getElementById('adminPanel').classList.toggle('hidden', !logged);
  if(logged) renderOrders();
}
function renderOrders(){
  const table = document.getElementById('ordersTable');
  const orders = getOrders();
  table.innerHTML = orders.length ? orders.map(o => `
    <tr>
      <td><b>${o.cliente || 'Cliente'}</b><br><small>${o.telefone || ''}<br>${o.createdAt}</small></td>
      <td>${o.produto}<br><small>Qtd: ${o.quantidade} | Extras: ${o.extras?.map(e=>e.name).join(', ') || 'Nenhum'}</small></td>
      <td>${brl(o.total)}</td>
      <td><span class="status ${o.status}">${o.status}</span></td>
      <td><div class="action-row">
        <button class="btn outline small" onclick="setStatus(${o.id},'preparo')">Preparo</button>
        <button class="btn outline small" onclick="setStatus(${o.id},'pronto')">Pronto</button>
        <button class="btn outline small" onclick="setStatus(${o.id},'concluido')">Concluir</button>
        <button class="btn outline small" onclick="setStatus(${o.id},'cancelado')">Cancelar</button>
        <button class="btn primary small" onclick="deleteOrder(${o.id})">Excluir</button>
      </div></td>
    </tr>`).join('') : '<tr><td colspan="5">Nenhum pedido salvo ainda.</td></tr>';
}
function setStatus(id,status){ const orders = getOrders().map(o => o.id === id ? {...o,status} : o); saveOrders(orders); renderOrders(); }
function deleteOrder(id){ if(confirm('Excluir este pedido?')){ saveOrders(getOrders().filter(o => o.id !== id)); renderOrders(); } }
