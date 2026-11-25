document.addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;var d=t.dataset;
  document.title="المنيو الرقمي";
  if(d.snd){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();AC.resume();}catch(x){}O.snd=true;beep();render();return}
  if(d.open!==undefined){C.open=d.open==="1";C.err="";render();return}
  if(d.add||d.plus){var id=d.add||d.plus;C.cart[id]=Math.min(20,(C.cart[id]||0)+1);C.err="";render();return}
  if(d.minus){var q=(C.cart[d.minus]||1)-1;if(q<1)delete C.cart[d.minus];else C.cart[d.minus]=q;if(!Object.keys(C.cart).length)C.open=false;render();return}
  if(d.mode){O.mode=d.mode;O.msg="";O.info="";render();return}
  if(t.id==="again"){C.done=null;render();return}
  if(t.id==="signup"){act(async function(){
    var n=$("rn").value.trim(),sl=$("rs").value.trim().toLowerCase(),em=$("em").value.trim(),pw=$("pw").value;
    if(!n||!SLUG.test(sl)){O.msg="اكتب اسم المشروع، واسم الرابط بحروف إنجليزية صغيرة وأرقام فقط (3 أحرف على الأقل).";return}
    if(pw.length<6){O.msg="كلمة السر يجب أن تكون 6 أحرف على الأقل.";return}
    var r=await sb.auth.signUp({email:em,password:pw});
    if(r.error){var sm=(r.error.message||"").toLowerCase();O.msg=sm.indexOf("already")>-1?"هذا البريد مسجّل من قبل. اضغط «لديّ حساب، دخول».":sm.indexOf("rate")>-1?"تجاوزت حدّ الإرسال. حاول بعد ساعة، أو أوقف تأكيد البريد من Supabase.":sm.indexOf("password")>-1?"كلمة السر ضعيفة. استخدم 6 أحرف على الأقل وأرقاماً وحروفاً.":"تعذّر إنشاء الحساب: "+r.error.message;return}
    if(r.data.session){O.user=r.data.user;await createRest(n,sl);}
    else{O.mode="login";O.info="تم إنشاء الحساب. افتح بريدك وأكّد الرسالة، ثم ادخل وسيطلب منك إنشاء مطعمك.";}
  });return}
  if(t.id==="mkRest"){act(async function(){
    var n=$("rn").value.trim(),sl=$("rs").value.trim().toLowerCase();
    if(!n||!SLUG.test(sl)){O.msg="اكتب اسم المشروع، واسم الرابط بحروف إنجليزية صغيرة وأرقام فقط (3 أحرف على الأقل).";return}
    await createRest(n,sl);
  });return}
  if(t.id==="send"){sendOrder();return}
  if(t.id==="login"){act(async function(){
    var r=await sb.auth.signInWithPassword({email:$("em").value.trim(),password:$("pw").value});
    if(r.error){var lm=(r.error.message||"").toLowerCase();O.msg=lm.indexOf("confirm")>-1?"البريد غير مؤكد. أكّد الرسالة في بريدك، أو أطلب من مدير النظام تأكيد الحساب.":lm.indexOf("invalid")>-1?"البريد أو كلمة السر غير صحيحة.":"تعذّر الدخول: "+r.error.message;return}
    O.user=r.data.user;await loadOwner();});return}
  if(d.t){if(d.t==="out"){act(async function(){await sb.auth.signOut();O.user=null;O.rest=null;O.items=[];O.orders=[];O.tab="orders"});}else{O.tab=d.t;O.msg="";render();}return}
  if(t.id==="addItem"){act(async function(){
    var n=$("n1").value.trim(),p=parseInt($("p1").value,10),m=parseInt($("m1").value,10)||10;
    if(!n||!(p>=0)){O.msg="اكتب اسم الطبق وسعراً صحيحاً.";return}
    var url=null,fl=$("im").files[0];
    if(fl){url=await uploadImg(fl);if(!url)return;}
    var r=await sb.from("menu_items").insert({restaurant_id:O.rest.id,name:n,price:p,prep_minutes:m,is_available:true,image_url:url});
    if(r.error)throw r.error;await loadItems();});return}
  if(d.color){act(async function(){
    var r=await sb.from("restaurants").update({color:d.color}).eq("id",O.rest.id);
    if(r.error){O.msg="تعذّر حفظ اللون. تأكد أنك شغّلت كود التحديث في Supabase.";return}
    O.rest.color=d.color;});return}
  if(d.tog){act(async function(){var it=O.items.find(function(x){return x.id===d.tog});
    var r=await sb.from("menu_items").update({is_available:!it.is_available}).eq("id",d.tog);if(r.error)throw r.error;await loadItems();});return}
  if(d.del){if(!confirm("حذف هذا الطبق؟"))return;act(async function(){
    var r=await sb.from("menu_items").delete().eq("id",d.del);if(r.error)throw r.error;await loadItems();});return}
  if(d.adv){act(async function(){
    var r=await sb.from("orders").update({status:parseInt(d.st,10)+1}).eq("id",d.adv);if(r.error)throw r.error;await loadOrders();});return}
});
document.addEventListener("change",function(e){
  var t=e.target;
  if(t.dataset&&t.dataset.img&&t.files&&t.files[0]){
    var id=t.dataset.img,fl=t.files[0];
    act(async function(){
      var url=await uploadImg(fl);if(!url)return;
      var r=await sb.from("menu_items").update({image_url:url}).eq("id",id);
      if(r.error)throw r.error;await loadItems();});
  }
});
document.addEventListener("input",function(e){
  if(e.target.id==="tb")C.table=e.target.value;
  if(e.target.id==="nt")C.note=e.target.value;
  if(e.target.id==="qt"){O.qt=e.target.value;drawQR()}
});
window.addEventListener("hashchange",function(){render()});
setInterval(function(){
  if(isOwnerView()&&O.user&&O.rest&&O.tab==="orders"&&!document.hidden){
    loadOrders().then(function(){
      var nw=O.orders.filter(function(o){return o.status===0&&O.seen&&!O.seen[o.id]});
      markSeen();
      if(nw.length&&O.snd){beep();document.title="🔔 ("+nw.length+") طلب جديد";}
      render();}).catch(function(){});}
},10000);

if(sb){loadCustomer();initOwner();}else render();
