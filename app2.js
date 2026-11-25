/* ---------- صاحب المشروع ---------- */
async function initOwner(){
  if(!sb)return;
  var s=await sb.auth.getSession();
  O.user=s.data&&s.data.session?s.data.session.user:null;
  if(O.user)await loadOwner();
  O.loaded=true;render();
}
async function loadOwner(){
  var r=await sb.from("restaurants").select(RCOLS).eq("owner_id",O.user.id).limit(1).maybeSingle();
  O.rest=r.data||null;
  if(O.rest){await loadItems();await loadOrders();markSeen();}
}
async function loadItems(){var m=await sb.from("menu_items").select("*").eq("restaurant_id",O.rest.id).order("name");O.items=m.data||[];}
async function loadOrders(){var o=await sb.from("orders").select("*").eq("restaurant_id",O.rest.id).order("created_at",{ascending:false}).limit(50);O.orders=o.data||[];}

/* رفع الصور: نصغّر الصورة أولاً لتوفير الإنترنت */
function resizeImg(file,max){return new Promise(function(res,rej){
  var img=new Image(),u=URL.createObjectURL(file);
  img.onload=function(){var s=Math.min(1,max/Math.max(img.width,img.height));
    var c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);
    c.toBlob(function(b){b?res(b):rej(new Error("blob"))},"image/jpeg",0.82);};
  img.onerror=function(){rej(new Error("img"))};img.src=u;});}
async function uploadImg(file){
  try{
    var blob=await resizeImg(file,900);
    var path=O.user.id+"/"+Date.now()+".jpg";
    var r=await sb.storage.from("dishes").upload(path,blob,{contentType:"image/jpeg"});
    if(r.error)throw r.error;
    return sb.storage.from("dishes").getPublicUrl(path).data.publicUrl;
  }catch(e){O.msg="تعذّر رفع الصورة. تأكد أنك شغّلت كود الصور في Supabase.";return null;}
}

function menuUrl(t){return location.origin+location.pathname+"?r="+encodeURIComponent(O.rest.slug)+(t?"&table="+encodeURIComponent(t):"")}function ownerHTML(){
  if(!O.loaded)return "جارٍ التحميل…";
  var msgH=(O.msg?'<p class="err" role="alert">'+O.msg+'</p>':'')+(O.info?'<p class="okm" role="status">'+O.info+'</p>':'');
  if(!O.user){
    if(O.mode==="signup")return '<h1>إنشاء حساب صاحب مشروع</h1><div class="card"><div class="f"><label for="rn">اسم المشروع (Project name)</label><input id="rn" maxlength="60"></div><div class="f"><label for="rs">اسم الرابط بالإنجليزية، مثل: alnakheel (Link name)</label><input id="rs" maxlength="30" dir="ltr" autocapitalize="none"></div><div class="f"><label for="em">البريد الإلكتروني (Email)</label><input id="em" type="email" dir="ltr" autocomplete="username"></div><div class="f"><label for="pw">كلمة السر، 6 أحرف على الأقل (Password)</label><input id="pw" type="password" autocomplete="new-password"></div>'+msgH+'<button class="pri" id="signup">إنشاء الحساب</button></div><p class="foot"><button class="lnk" data-mode="login">لديّ حساب، دخول</button></p>';
    return '<h1>دخول صاحب المشروع</h1><div class="card"><div class="f"><label for="em">البريد الإلكتروني (Email)</label><input id="em" type="email" dir="ltr" autocomplete="username"></div><div class="f"><label for="pw">كلمة السر (Password)</label><input id="pw" type="password" autocomplete="current-password"></div>'+msgH+'<button class="pri" id="login">دخول</button></div><p class="foot"><button class="lnk" data-mode="signup">ليس لديك حساب؟ إنشاء حساب جديد</button></p><p class="foot"><a href="#">العودة إلى المنيو</a></p>';
  }
  if(!O.rest)return '<h1>أنشئ مشروعك</h1><div class="card"><p class="mt">حسابك جاهز. أدخل بيانات مشروعك لتبدأ.</p><div class="f"><label for="rn">اسم المشروع (Project name)</label><input id="rn" maxlength="60"></div><div class="f"><label for="rs">اسم الرابط بالإنجليزية، مثل: alnakheel (Link name)</label><input id="rs" maxlength="30" dir="ltr" autocapitalize="none"></div>'+msgH+'<button class="pri" id="mkRest">إنشاء المشروع</button></div><p class="foot"><button class="lnk" data-t="out">خروج</button></p>';
  var open=O.orders.filter(function(o){return o.status<3}).length;
  var h=hero(O.rest.name,"لوحة التحكم")+(O.rest.approved?'':'<div class="card"><strong>⏳ مشروعك قيد المراجعة</strong><p class="mt">سيظهر منيو مشروعك للزبائن بعد موافقة الإدارة. يمكنك إضافة الأطباق الآن.</p></div>')+'<div class="tabs"><button data-t="orders" class="'+(O.tab==="orders"?'act':'')+'">الطلبات ('+open+')</button><button data-t="items" class="'+(O.tab==="items"?'act':'')+'">الأطباق</button><button data-t="look" class="'+(O.tab==="look"?'act':'')+'">المظهر</button><button data-t="qr" class="'+(O.tab==="qr"?'act':'')+'">رمز QR</button><button data-t="out">خروج</button></div>';
  if(O.tab==="orders"){
    h+='<button class="sm" data-snd="1" style="margin:10px 0">'+(O.snd?'🔔 التنبيه الصوتي: مفعّل':'🔕 فعّل التنبيه الصوتي')+'</button>';
    if(!O.orders.length)h+='<p class="mt">لا توجد طلبات بعد. تتحدث القائمة تلقائياً كل 10 ثوانٍ.</p>';
    O.orders.forEach(function(o){var ls=(o.lines||[]).map(function(l){return esc(l.name)+' ×'+l.q}).join("، ");
      h+='<div class="card'+(o.status===0?' new':'')+'"><div class="row" style="border:0;padding:0"><strong>طاولة '+esc(o.table_no)+'</strong><span class="st">'+ST[o.status]+'</span></div><div class="mt">🕒 '+fmtT(o.created_at)+'</div><div class="mt">'+ls+'</div><div class="row" style="border:0;padding-bottom:0"><span class="price">'+money(o.total)+'</span>'+(o.status<3?'<button class="sm" data-adv="'+o.id+'" data-st="'+o.status+'">'+NEXT[o.status]+'</button>':'')+'</div></div>';});
  }
  if(O.tab==="items"){
    h+='<div class="card"><strong>رابط منيو مشروعك</strong><p class="mt" style="word-break:break-all">'+esc(menuUrl())+'</p><a href="'+menuUrl()+'">فتح المنيو كما يراه الزبون</a></div>';h+='<div class="card"><strong>إضافة طبق</strong><div class="grid"><div class="f"><label for="n1">الاسم</label><input id="n1" maxlength="60"></div><div class="f"><label for="p1">السعر (د.ع)</label><input id="p1" inputmode="numeric"></div></div><div class="f"><label for="m1">وقت التحضير (دقائق)</label><input id="m1" inputmode="numeric"></div><div class="f"><label for="im">صورة الطبق (اختياري)</label><input id="im" type="file" accept="image/*"></div>'+msgH+'<button class="pri" id="addItem">إضافة</button></div>';
    O.items.forEach(function(i){h+='<div class="row">'+(i.image_url?'<img class="thumb" src="'+esc(i.image_url)+'" alt="">':'<div class="thumb e">🍽️</div>')+'<div style="flex:1;min-width:0"><div class="nm">'+esc(i.name)+'</div><div class="mt">'+money(i.price)+' | '+(i.prep_minutes||0)+' دقيقة</div></div><div class="qty" style="background:none"><label class="sm lab">صورة<input type="file" accept="image/*" data-img="'+i.id+'" hidden></label><button class="sm" data-tog="'+i.id+'">'+(i.is_available?'متوفر':'غير متوفر')+'</button><button class="sm del" data-del="'+i.id+'">حذف</button></div></div>';});
  }
  if(O.tab==="look"){
    h+='<div class="card"><strong>لون مشروعك</strong><p class="mt">يظهر في رأس المنيو والأزرار عند الزبائن.</p><div class="sw">'+COLORS.map(function(c){return '<button class="swb'+(O.rest.color===c?' sel':'')+'" style="background:'+c+'" data-color="'+c+'" aria-label="لون"></button>'}).join("")+'</div>'+msgH+'</div>';
  }
  if(O.tab==="qr")h+='<div class="card"><div class="f"><label for="qt">رقم الطاولة</label><input id="qt" inputmode="numeric" value="'+esc(O.qt)+'"></div><p class="mt">اطبع الرمز وضعه على الطاولة. عند مسحه يفتح المنيو وتُسجَّل الطاولة تلقائياً.</p><div id="qr"></div></div>';
  return h+'<p class="foot"><a href="'+menuUrl("5")+'">عرض المنيو كزبون</a></p>';
}
function drawQR(){var b=$("qr");if(!b||!O.rest)return;b.innerHTML="";
  var url=location.origin+location.pathname+"?r="+encodeURIComponent(O.rest.slug)+"&table="+encodeURIComponent(O.qt);
  try{new QRCode(b,{text:url,width:180,height:180});}catch(e){b.textContent="تعذّر رسم الرمز";}
  var p=document.createElement("p");p.className="mt";p.style.wordBreak="break-all";p.textContent=url;b.parentNode.appendChild(p);}

/* ---------- العرض ---------- */
function render(){
  if(!sb){$("app").innerHTML='<p class="err">تعذّر تحميل مكتبة الاتصال. تحقق من الإنترنت وأعد المحاولة.</p>';return}
  var col=(isOwnerView()?(O.rest&&O.rest.color):(C.rest&&C.rest.color))||"#0e5a58";
  if(!/^#[0-9a-f]{6}$/i.test(col))col="#0e5a58";
  document.documentElement.style.setProperty("--brand",col);
  $("app").innerHTML=isOwnerView()?ownerHTML():customerHTML();
  if(isOwnerView()&&O.user&&O.rest&&O.tab==="qr")drawQR();
}
var SLUG=/^[a-z0-9-]{3,30}$/;
async function createRest(name,slg){
  var r=await sb.from("restaurants").insert({owner_id:O.user.id,name:name,slug:slg}).select(RCOLS).single();
  if(r.error){O.msg=r.error.code==="23505"?"اسم الرابط مستخدم، اختر اسماً آخر.":"تعذّر إنشاء المشروع، حاول مرة أخرى.";return false}
  O.rest=r.data;O.items=[];O.orders=[];O.tab="items";return true;
}
async function act(fn){O.msg="";O.info="";try{await fn();}catch(e){O.msg="حدث خطأ، حاول مرة أخرى.";}render();}
