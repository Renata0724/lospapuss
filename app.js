const STORAGE_KEY = "polkasell_prototype_v1";
const defaultListings = [
  {id:"p1",title:"Tenis blancos casuales",price:650,category:"Ropa",kind:"Físico",description:"Tenis en buen estado, cómodos y listos para estrenar. Entrega en punto acordado.",seller:"Andrea",rating:4.9,image:"",status:"Disponible",createdAt:Date.now()-50000,favorite:false},
  {id:"p2",title:"Audífonos inalámbricos",price:420,category:"Tecnología",kind:"Físico",description:"Audífonos Bluetooth. Funcionan correctamente e incluyen su estuche.",seller:"Carlos",rating:4.7,image:"",status:"Disponible",createdAt:Date.now()-40000,favorite:false},
  {id:"p3",title:"Pastel de chocolate",price:280,category:"Comida",kind:"Físico",description:"Pastel casero de chocolate. Se prepara bajo pedido; pregunta por tamaños.",seller:"Mariana",rating:5,image:"",status:"Disponible",createdAt:Date.now()-30000,favorite:false},
  {id:"p4",title:"Asesoría de programación",price:180,category:"Servicios",kind:"Servicio",description:"Sesión de apoyo para principiantes en programación. Una hora de asesoría.",seller:"Diego",rating:4.8,image:"",status:"Disponible",createdAt:Date.now()-20000,favorite:false},
  {id:"p5",title:"Escritorio minimalista",price:950,category:"Hogar",kind:"Físico",description:"Escritorio práctico para estudiar o trabajar. Se entrega en punto acordado.",seller:"Sofía",rating:4.6,image:"",status:"Disponible",createdAt:Date.now()-10000,favorite:false},
  {id:"p6",title:"Plantillas para organizar gastos",price:90,category:"Digital",kind:"Digital",description:"Plantilla digital para llevar el control de tus gastos personales.",seller:"Luis",rating:4.9,image:"",status:"Disponible",createdAt:Date.now(),favorite:false}
];

let state = loadState();
let activeCategory = "Todas";
let searchTerm = "";
let favoritesOnly = false;
let toastTimer;

const $ = (selector) => document.querySelector(selector);
const grid = $("#productGrid");
const listingDialog = $("#listingDialog");

function loadState(){
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved){
      const parsed = JSON.parse(saved);
      return {
        listings: Array.isArray(parsed.listings) ? parsed.listings : [...defaultListings],
        sales: Array.isArray(parsed.sales) ? parsed.sales : [],
        auctions: Array.isArray(parsed.auctions) ? parsed.auctions : []
      };
    }
  } catch(error){ console.warn("No se pudieron cargar los datos guardados.", error); }
  return {listings:[...defaultListings],sales:[],auctions:[]};
}
function saveState(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch(error){ showToast("No se pudieron guardar los cambios en este navegador."); }
}
function money(value){
  return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:2}).format(Number(value)||0);
}
function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function showToast(message){
  const toast=$("#toast"); toast.textContent=message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove("show"),2600);
}
function categoryIcon(category){
  return ({Ropa:"♧",Tecnología:"▣",Hogar:"⌂",Comida:"♡",Servicios:"✎",Cursos:"▤",Digital:"◎"})[category]||"✦";
}
function filteredListings(){
  let items=state.listings.filter(item=>item.status==="Disponible");
  if(activeCategory!=="Todas") items=items.filter(item=>item.category===activeCategory);
  if(searchTerm){
    const term=searchTerm.toLocaleLowerCase("es");
    items=items.filter(item=>[item.title,item.description,item.category,item.seller].join(" ").toLocaleLowerCase("es").includes(term));
  }
  if(favoritesOnly) items=items.filter(item=>item.favorite);
  const sort=$("#sortSelect").value;
  if(sort==="priceAsc") items.sort((a,b)=>a.price-b.price);
  else if(sort==="priceDesc") items.sort((a,b)=>b.price-a.price);
  else items.sort((a,b)=>b.createdAt-a.createdAt);
  return items;
}
function render(){
  const items=filteredListings();
  grid.innerHTML=items.map(item=>{
    const image=item.image ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">` : "";
    const placeholder=`<div class="image-placeholder" ${item.image?'style="display:none"':""}>${categoryIcon(item.category)}</div>`;
    return `<article class="product-card">
      <div class="product-image">${image}${placeholder}<span class="product-tag">${escapeHTML(item.kind)}</span>
        <button class="heart-button ${item.favorite?'saved':''}" data-action="favorite" data-id="${item.id}" aria-label="Agregar a favoritos">${item.favorite?"♥":"♡"}</button>
      </div>
      <div class="product-info">
        <div class="product-category">${escapeHTML(item.category)}</div>
        <h3 title="${escapeHTML(item.title)}">${escapeHTML(item.title)}</h3>
        <p class="product-description">${escapeHTML(item.description)}</p>
        <div class="price">${money(item.price)}</div>
        <div class="product-bottom">
          <button class="seller-link" data-action="profile" data-seller="${escapeHTML(item.seller)}">Por ${escapeHTML(item.seller)}</button>
          <span class="rating">★ ${Number(item.rating||5).toFixed(1)}</span>
        </div>
        <div class="card-actions">
          <button class="small-button" data-action="contact" data-id="${item.id}">Contactar</button>
          <button class="small-button" data-action="auction" data-id="${item.id}">Subastar</button>
          <button class="small-button" data-action="edit" data-id="${item.id}">Editar</button>
          <button class="small-button sold" data-action="sold" data-id="${item.id}">Vendido</button>
          <button class="small-button" data-action="delete" data-id="${item.id}">Eliminar</button>
        </div>
      </div>
    </article>`;
  }).join("");
  $("#emptyState").classList.toggle("hidden",items.length!==0);
  $("#resultsNote").textContent=`${items.length} ${items.length===1?"publicación disponible":"publicaciones disponibles"}`;
  $("#listingHeading").textContent=favoritesOnly?"Tus favoritos":activeCategory==="Todas"?"Publicaciones recientes":activeCategory;
  document.querySelectorAll(".category,.chip").forEach(button=>{
    button.classList.toggle("active",button.classList.contains("category")&&button.dataset.category===activeCategory);
    button.classList.toggle("selected",button.classList.contains("chip")&&button.dataset.category===activeCategory);
  });
}
function openListing(item=null){
  $("#listingForm").reset();
  $("#listingId").value=item?.id||"";
  $("#listingDialogTitle").textContent=item?"Editar publicación":"Crear publicación";
  $("#title").value=item?.title||"";
  $("#price").value=item?.price??"";
  $("#category").value=item?.category||"Ropa";
  $("#kind").value=item?.kind||"Físico";
  $("#description").value=item?.description||"";
  $("#imageUrl").value=item?.image||"";
  $("#sellerName").value=item?.seller||"Mi perfil";
  listingDialog.showModal();
}
function getSellerSales(seller){
  return state.sales.filter(sale=>sale.seller===seller).sort((a,b)=>b.date-a.date);
}
function openProfile(seller){
  const listings=state.listings.filter(item=>item.seller===seller);
  const sales=getSellerSales(seller);
  const ratings=listings.map(item=>Number(item.rating||5));
  const average=ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:5;
  $("#profileContent").innerHTML=`
    <div class="profile-top"><div class="avatar">${escapeHTML(seller.charAt(0).toUpperCase())}</div><div><h3>${escapeHTML(seller)}</h3><p>★ ${average.toFixed(1)} · Perfil de vendedor</p></div></div>
    <div class="profile-stats"><div class="profile-stat"><strong>${sales.length}</strong><span>Ventas registradas</span></div><div class="profile-stat"><strong>${listings.filter(x=>x.status==="Disponible").length}</strong><span>Publicaciones activas</span></div><div class="profile-stat"><strong>${average.toFixed(1)}</strong><span>Calificación demo</span></div></div>
    <div class="profile-subtitle">Últimas 3 ventas</div>
    ${sales.length?sales.slice(0,3).map(sale=>`<div class="history-item"><span>${escapeHTML(sale.title)}</span><span>${money(sale.price)}</span></div>`).join(""):`<p class="form-help">Todavía no hay ventas registradas para este perfil.</p>`}
    <p class="form-help" style="margin-top:14px">Prototipo: las calificaciones son demostrativas. En la versión real solo podrán calificar usuarios que hayan participado en una venta confirmada.</p>`;
  $("#profileDialog").showModal();
}
function markSold(id){
  const item=state.listings.find(x=>x.id===id); if(!item)return;
  if(!confirm(`¿Confirmas que "${item.title}" se vendió? En esta demostración se registrará como venta completada.`))return;
  item.status="Vendido";
  state.sales.push({id:"s"+Date.now(),listingId:item.id,title:item.title,price:item.price,seller:item.seller,date:Date.now()});
  saveState();render();showToast("Venta registrada. La publicación ya no aparece en el catálogo.");
}
function deleteListing(id){
  const item=state.listings.find(x=>x.id===id);if(!item)return;
  if(!confirm(`¿Deseas eliminar "${item.title}"?`))return;
  state.listings=state.listings.filter(x=>x.id!==id);saveState();render();showToast("Publicación eliminada.");
}
function createAuctionFrom(item){
  $("#auctionTitle").value=item.title;$("#auctionPrice").value=item.price;$("#auctionSeller").value=item.seller;
  $("#auctionDialog").showModal();
}
function renderAuctions(){
  const now=Date.now();
  state.auctions.forEach(a=>{if(a.status==="Activa"&&a.endsAt<=now)a.status="Finalizada";});
  saveState();
  if(!state.auctions.length)return;
  const panel=document.createElement("section");
  panel.style.cssText="margin-top:35px";
  panel.innerHTML=`<div class="section-head"><div><p class="eyebrow">OFERTAS POR TIEMPO LIMITADO</p><h2>Subastas</h2></div></div><div class="product-grid" id="auctionGrid"></div>`;
  $(".content").appendChild(panel);
  $("#auctionGrid").innerHTML=state.auctions.map(a=>{
    const remaining=Math.max(0,a.endsAt-now);
    const time=remaining===0?"Finalizada":formatRemaining(remaining);
    return `<article class="product-card"><div class="product-info"><span class="product-tag" style="position:static;display:inline-block">${a.status}</span><h3>${escapeHTML(a.title)}</h3><p class="product-description">Vendedor: ${escapeHTML(a.seller)}</p><div class="product-category">Oferta actual</div><div class="price">${money(a.currentBid)}</div><p class="product-description">Termina: ${time}</p><button class="small-button" data-action="bid" data-id="${a.id}" ${a.status!=="Activa"?"disabled":""}>Ofertar + $10</button></div></article>`;
  }).join("");
}
function formatRemaining(ms){
  const total=Math.floor(ms/1000),days=Math.floor(total/86400),hours=Math.floor(total%86400/3600),minutes=Math.floor(total%3600/60);
  return `${days?days+" d ":""}${hours} h ${minutes} min`;
}
function refreshAuctionPanel(){
  const old=$(".content > section.auction-panel");if(old)old.remove();
  const now=Date.now();
  state.auctions.forEach(a=>{if(a.status==="Activa"&&a.endsAt<=now)a.status="Finalizada";});
  if(!state.auctions.length)return;
  const panel=document.createElement("section");panel.className="auction-panel";panel.style.marginTop="36px";
  panel.innerHTML=`<div class="section-head"><div><p class="eyebrow">OFERTAS POR TIEMPO LIMITADO</p><h2>Subastas</h2></div></div><div class="product-grid" id="auctionGrid"></div>`;
  $(".content").appendChild(panel);
  $("#auctionGrid").innerHTML=state.auctions.map(a=>{
    const remaining=Math.max(0,a.endsAt-now);
    return `<article class="product-card"><div class="product-info"><span class="product-tag" style="position:static;display:inline-block">${a.status}</span><h3>${escapeHTML(a.title)}</h3><p class="product-description">Vendedor: ${escapeHTML(a.seller)}</p><div class="product-category">Oferta actual</div><div class="price">${money(a.currentBid)}</div><p class="product-description">${remaining?`Tiempo restante: ${formatRemaining(remaining)}`:"La subasta ha terminado."}</p><button class="small-button" data-action="bid" data-id="${a.id}" ${a.status!=="Activa"?"disabled":""}>Ofertar + $10</button></div></article>`;
  }).join("");
}

$("#listingForm").addEventListener("submit",event=>{
  event.preventDefault();
  const id=$("#listingId").value;
  const existing=state.listings.find(x=>x.id===id);
  const item={
    id:id||"p"+Date.now(),title:$("#title").value.trim(),price:Number($("#price").value),
    category:$("#category").value,kind:$("#kind").value,description:$("#description").value.trim(),
    image:$("#imageUrl").value.trim(),seller:$("#sellerName").value.trim(),rating:existing?.rating||5,
    status:existing?.status||"Disponible",createdAt:existing?.createdAt||Date.now(),favorite:existing?.favorite||false
  };
  if(existing)Object.assign(existing,item);else state.listings.push(item);
  saveState();listingDialog.close();render();showToast(existing?"Publicación actualizada.":"¡Publicación creada!");
});
$("#auctionForm").addEventListener("submit",event=>{
  event.preventDefault();
  const start=Number($("#auctionPrice").value);
  const duration=Number($("#auctionDuration").value);
  state.auctions.push({id:"a"+Date.now(),title:$("#auctionTitle").value.trim(),seller:$("#auctionSeller").value.trim(),startPrice:start,currentBid:start,endsAt:Date.now()+duration*3600000,status:"Activa"});
  saveState();$("#auctionDialog").close();refreshAuctionPanel();showToast("Subasta creada.");
});
document.addEventListener("click",event=>{
  const close=event.target.closest("[data-close]");
  if(close){$("#"+close.dataset.close).close();return;}
  const button=event.target.closest("[data-action]");
  if(!button)return;
  const {action,id,seller}=button.dataset;
  if(action==="favorite"){const item=state.listings.find(x=>x.id===id);item.favorite=!item.favorite;saveState();render();}
  if(action==="profile")openProfile(seller);
  if(action==="edit"){const item=state.listings.find(x=>x.id===id);if(item)openListing(item);}
  if(action==="sold")markSold(id);
  if(action==="delete")deleteListing(id);
  if(action==="contact"){const item=state.listings.find(x=>x.id===id);if(item)showToast(`Contacta a ${item.seller}: el chat se implementará en la siguiente fase.`);}
  if(action==="auction"){const item=state.listings.find(x=>x.id===id);if(item)createAuctionFrom(item);}
  if(action==="bid"){
    const auction=state.auctions.find(x=>x.id===id);
    if(auction&&auction.status==="Activa"&&auction.endsAt>Date.now()){
      auction.currentBid+=10;saveState();refreshAuctionPanel();showToast("Oferta de demostración registrada.");
    }
  }
});
document.querySelectorAll(".category,.chip").forEach(button=>button.addEventListener("click",()=>{
  activeCategory=button.dataset.category;favoritesOnly=false;$("#favoritesFilter").classList.remove("selected");render();
}));
$("#searchForm").addEventListener("submit",event=>{event.preventDefault();searchTerm=$("#searchInput").value.trim();favoritesOnly=false;render();});
$("#searchInput").addEventListener("input",()=>{searchTerm=$("#searchInput").value.trim();render();});
$("#sortSelect").addEventListener("change",render);
$("#favoritesFilter").addEventListener("click",()=>{
  favoritesOnly=!favoritesOnly;$("#favoritesFilter").classList.toggle("selected",favoritesOnly);activeCategory="Todas";render();
});
$("#openCreate").addEventListener("click",()=>openListing());
$("#welcomeCreate").addEventListener("click",()=>openListing());
$("#clearFilters").addEventListener("click",()=>{activeCategory="Todas";searchTerm="";favoritesOnly=false;$("#searchInput").value="";render();});
document.addEventListener("keydown",event=>{if(event.key==="Escape")document.querySelectorAll("dialog[open]").forEach(d=>d.close());});

render();
refreshAuctionPanel();
