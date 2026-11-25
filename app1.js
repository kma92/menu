var SB_URL="https://zayfkpqqplzdglmitbjr.supabase.co";
var SB_KEY="sb_publishable_bh09vVqac-KhD4EA6BI_vg_F5WYWhDZ";
var sb=null;
/* بعض البيئات لا تقبل كائن Headers، فنحوّله إلى كائن عادي قبل الإرسال */
function safeFetch(url,opts){
  opts=opts||{};
  var h=opts.headers;
  if(h&&typeof h.forEach==="function"&&!Array.isArray(h)){
    var plain={};h.forEach(function(v,k){plain[k]=v});
    opts=Object.assign({},opts,{headers:plain});
  }
  return fetch(url,opts);
}
try{
  sb=supabase.createClient(SB_URL,SB_KEY,{
    global:{fetch:safeFetch},
    auth:{lock:function(name,timeout,fn){return fn();}}
  });
}catch(e){}

var qs=new URLSearchParams(location.search);
async function loadCustomer(){if(!slug){C.loaded=true;render();return}
var $=function(i){return document.getElementById(i)};
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function money(n){return new Intl.NumberFormat("ar-IQ").format(n)+" د.ع"}
var ST=["جديد","قيد التحضير","جاهز","تم التقديم"],NEXT=["ابدأ التحضير","جاهز","تم التقديم"];
function fmtT(t){if(!t)return"";var d=new Date(t),m=Math.round((Date.now()-d.getTime())/60000),s=d.toLocaleString("ar-IQ",{weekday:"long",day:"numeric",month:"long",hour:"numeric",minute:"2-digit"});var r=m<1?"الآن":m<60?"منذ "+m+" دقيقة":m<1440?"منذ "+Math.floor(m/60)+" ساعة":"";return s+(r?" ("+r+")":"")}var AC=null;
function beep(){try{if(!AC)return;[0,0.3,0.6].forEach(function(t){var o=AC.createOscillator(),g=AC.createGain();o.frequency.value=880;g.gain.value=0.3;o.connect(g);g.connect(AC.destination);o.start(AC.currentTime+t);o.stop(AC.currentTime+t+0.2);});}catch(e){}}
function markSeen(){O.seen={};O.orders.forEach(function(o){O.seen[o.id]=1});}
var COLORS=["#0e5a58","#b3261e","#c2570c","#2e7d32","#1f5fa8","#6a3fa0","#2b2b2b"];
var RCOLS="id,name,slug,color";

var C={rest:null,items:[],cart:{},table:qs.get("table")||"",note:"",err:"",done:null,open:false,loaded:false,busy:false};
var O={user:null,rest:null,items:[],orders:[],tab:"orders",msg:"",info:"",mode:"login",qt:"5",snd:false,seen:null,loaded:false,busy:false};

function isOwnerView(){return location.hash==="#owner"}
function hero(name,sub,pill){return '<header class="hero"><h1>'+esc(name)+'</h1>'+(sub?'<p>'+esc(sub)+'</p>':'')+(pill?'<span class="pill">'+esc(pill)+'</span>':'')+'</header>'}
function pic(i){return i.image_url?'<img src="'+esc(i.image_url)+'" alt="" loading="lazy">':'<div class="ph">🍽️</div>'}

/* ---------- الزبون ---------- */
async function loadCustomer(){if(!slug){C.loaded=true;render();return}
  try{
    var r=await sb.from("restaurants").select(RCOLS).eq("slug",slug).maybeSingle();
    if(r.error){C.err="تعذّر قراءة المشروع من قاعدة البيانات. تفاصيل الخطأ: "+(r.error.message||r.error.code||"")+" | "+(r.error.code||"");}
    else if(!r.data){C.err="لم يتم العثور على مشروع باسم «"+slug+"».";}
    else{
      C.rest=r.data;
      var m=await sb.from("menu_items").select("*").eq("restaurant_id",r.data.id).order("name");
      if(m.error)C.err="تعذّر تحميل الأطباق.";else C.items=m.data||[];
    }
  }catch(e){C.err="تعذّر الاتصال. تحقق من الإنترنت.";}
  C.loaded=true;render();
}
function customerHTML(){if(!slug)return hero("المنيو الرقمي","امسح رمز QR الموجود على طاولتك لعرض المنيو وإرسال طلبك")+'<p class="foot"><a href="#owner">دخول صاحب المشروع</a></p>';
  if(!C.loaded)return "جارٍ التحميل…";
  if(C.err&&!C.rest)return '<p class="err">'+C.err+'</p>';
  if(C.done)return hero(C.rest.name,"")+'<div class="card"><h2>تم إرسال طلبك ✅</h2><p>رقم الطلب: <strong>'+C.done.no+'</strong> | طاولة '+esc(C.done.table)+'</p><p class="mt">🕒 '+fmtT(C.done.at)+'</p><p>الدفع نقداً عند الاستلام.</p><button class="pri" id="again">طلب إضافي</button></div>';
  var h=hero(C.rest.name,"اختر أطباقك ثم أرسل الطلب",C.table?"طاولة "+C.table:"");
  h+='<div class="sec">القائمة</div>';
  if(!C.items.length)h+='<p class="mt">لا توجد أصناف في المنيو بعد.</p>';
  C.items.forEach(function(i){var q=C.cart[i.id]||0,ctl;
    if(!i.is_available)ctl='<span class="tag">غير متوفر</span>';
    else if(!q)ctl='<button class="add" data-add="'+i.id+'" aria-label="أضف">+</button>';
    else ctl='<div class="qty"><button data-plus="'+i.id+'" aria-label="زيادة">+</button><strong>'+q+'</strong><button data-minus="'+i.id+'" aria-label="إنقاص">−</button></div>';
    h+='<article class="dish'+(i.is_available?'':' off')+'"><div class="pic">'+pic(i)+'</div><div class="bd"><div class="nm">'+esc(i.name)+'</div><div class="mt">⏱ '+(i.prep_minutes||0)+' دقيقة</div><div class="ft"><span class="price">'+money(i.price)+'</span>'+ctl+'</div></div></article>';});
  var ch=C.items.filter(function(i){return C.cart[i.id]});
  if(ch.length){
    var tot=ch.reduce(function(s,i){return s+i.price*C.cart[i.id]},0),pm=ch.reduce(function(m,i){return Math.max(m,i.prep_minutes||0)},0),cnt=ch.reduce(function(s,i){return s+C.cart[i.id]},0);
    h+='<div class="dock"><div class="in">';
    if(C.open){
      h+='<div class="sheet"><div class="row" style="border:0;padding-top:0"><strong>طلبك</strong><button class="lnk" data-open="0">إغلاق</button></div>'
      +ch.map(function(i){return '<div class="row"><span>'+esc(i.name)+' ×'+C.cart[i.id]+'</span><span class="price">'+money(i.price*C.cart[i.id])+'</span></div>'}).join("")
      +'<div class="f"><label for="tb">رقم الطاولة</label><input id="tb" inputmode="numeric" maxlength="10" value="'+esc(C.table)+'"></div>'
      +'<div class="f"><label for="nt">ملاحظات (اختياري)</label><input id="nt" maxlength="200" value="'+esc(C.note)+'"></div>'
      +'<p class="mt">طريقة الدفع: نقداً (الدفع الإلكتروني قريباً)</p>'
      +(C.err?'<p class="err" role="alert">'+C.err+'</p>':'')
      +'<div class="mt">أطول وقت تحضير: حوالي '+pm+' دقيقة</div>'
      +'<button class="pri wide" id="send"'+(C.busy?' disabled':'')+'>'+(C.busy?'جارٍ الإرسال…':'أرسل الطلب · '+money(tot))+'</button></div>';
    }else{
      h+='<button class="cartbtn" data-open="1"><span class="cnt">'+cnt+'</span><span>عرض السلة وإتمام الطلب</span><strong>'+money(tot)+'</strong></button>';
    }
    h+='</div></div>';
  }
  return h+'<p class="foot"><a href="#owner">دخول صاحب المشروع</a></p>';
}
async function sendOrder(){
  C.err="";
  var table=($("tb")?$("tb").value:C.table).trim();C.table=table;C.note=$("nt")?$("nt").value.trim():C.note;
  if(!table){C.err="أدخل رقم الطاولة.";render();return}
  C.busy=true;render();
  try{
    var ids=Object.keys(C.cart);
    var f=await sb.from("menu_items").select("id,name,price,is_available").eq("restaurant_id",C.rest.id).in("id",ids);
    if(f.error)throw f.error;
    var lines=[],total=0;
    for(var k=0;k<ids.length;k++){
      var m=(f.data||[]).find(function(x){return x.id===ids[k]});
      if(!m||!m.is_available){C.err="«"+(m?m.name:"أحد الأطباق")+"» غير متوفر الآن. أزله من الطلب.";C.busy=false;await loadCustomer();return}
      lines.push({name:m.name,q:C.cart[ids[k]],p:m.price});total+=m.price*C.cart[ids[k]];
    }
    var ins=await sb.from("orders").insert({restaurant_id:C.rest.id,table_no:C.note?table+" - "+C.note:table,lines:lines.length?lines:null,total:total,payment:"cash",status:0});
    if(ins.error)throw ins.error;
    C.done={no:String(Date.now()).slice(-4),table:table,at:new Date().toISOString()};C.cart={};C.open=false;
  }catch(e){C.err="تعذّر إرسال الطلب، حاول مرة أخرى.";}
  C.busy=false;render();
}
