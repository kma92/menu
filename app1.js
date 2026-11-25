/* ---------- دليل الخدمات (الصفحة العامة) ---------- */
var D={rows:[],type:"all",q:"",only:false,loaded:false,err:""};
var DT={all:"الكل",restaurant:"مطاعم",hotel:"فنادق",pharmacy:"صيدليات",transport:"نقل",delivery:"توصيل"};
var DM="color:var(--mut);font-size:.88rem";
function nz(s){return String(s||"").toLowerCase().replace(/[\u064B-\u0652]/g,"").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي")}
function waNum(n){var d=String(n).replace(/\D/g,"");if(d.indexOf("00")===0)d=d.slice(2);else if(d.charAt(0)==="0")d="964"+d.slice(1);return d}
async function loadDir(){
  try{
    var a=await sb.from("listings").select("*").order("name");
    var b=await sb.from("restaurants").select("id,name,slug,color").order("name");
    if(a.error)throw a.error;
    var rows=(a.data||[]).map(function(x){
      var ok=x.available!==false;
      return {type:x.type,name:x.name,city:x.city||"",area:x.area||"",phone:x.phone,wa:x.whatsapp,lines:String(x.details||"").split("\n").filter(Boolean),ok:ok,status:x.status_note||(ok?"متاح":"غير متاح"),upd:x.updated_at};
    });
    (b.data||[]).forEach(function(r){rows.push({type:"restaurant",name:r.name,city:"",area:"",lines:["اطلب من المنيو مباشرة"],ok:true,status:"المنيو متاح",slug:r.slug})});
    D.rows=rows;
  }catch(e){D.err="تعذّر تحميل الدليل. حاول مرة أخرى."}
  D.loaded=true;C.loaded=true;render();
}
function dirList(){
  var ws=nz(D.q).split(/\s+/).filter(Boolean);
  var r=D.rows.filter(function(x){
    if(D.type!=="all"&&x.type!==D.type)return false;
    if(D.only&&!x.ok)return false;
    var hay=nz([x.name,x.city,x.area,DT[x.type]].concat(x.lines).join(" "));
    return ws.every(function(w){return hay.indexOf(w)>-1});
  });
  if(!r.length)return '<p class="mt">لا توجد نتائج. جرّب كلمة أخرى مثل: الكرادة، فندق، صيدليات.</p>';
  return r.map(function(x){
    var place=[DT[x.type],x.city,x.area].filter(Boolean).join(" | ");
    var btn="display:inline-block;text-decoration:none;padding:9px 16px;margin:8px 8px 0 0";
    var acts="";
    if(x.slug)acts+='<a class="pri" style="'+btn+'" href="?r='+encodeURIComponent(x.slug)+'">افتح المنيو</a>';
    if(x.phone)acts+='<a class="pri" style="'+btn+'" href="tel:'+esc(String(x.phone).replace(/[^\d+]/g,""))+'">اتصال</a>';
    if(x.wa)acts+='<a class="pri" style="'+btn+'" href="https://wa.me/'+waNum(x.wa)+'">واتساب</a>';
    return '<div class="card"><div class="row" style="border:0;padding:0"><strong>'+esc(x.name)+'</strong><span class="'+(x.ok?'okm':'err')+'" style="margin:0">'+esc(x.status)+'</span></div>'
      +'<div style="'+DM+'">'+esc(place)+'</div>'
      +x.lines.map(function(l){return '<div>'+esc(l)+'</div>'}).join("")
      +(x.upd?'<div style="'+DM+';margin-top:6px">آخر تحديث: '+fmtT(x.upd)+'</div>':'')
      +acts+'</div>';
  }).join("");
}
function dirHTML(){
  if(!D.loaded)return "جارٍ التحميل…";
  var h=hero("دليل الخدمات","ابحث عن مطعم أو فندق أو صيدلية أو وسيلة نقل أو شركة توصيل");
  h+='<div class="f" style="margin-top:18px"><label for="dq">بحث</label><input id="dq" type="search" value="'+esc(D.q)+'" placeholder="مثال: الكرادة أو فندق أو صيدلية"></div><div class="tabs">';
  Object.keys(DT).forEach(function(k){h+='<button data-ty="'+k+'" class="'+(D.type===k?'act':'')+'">'+DT[k]+'</button>'});
  h+='</div><label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" id="donly" '+(D.only?'checked':'')+'> المتاح الآن فقط</label>';
  if(D.err)h+='<p class="err" role="alert">'+D.err+'</p>';
  return h+'<div id="dres">'+dirList()+'</div>';
}
document.addEventListener("click",function(e){var t=e.target.closest("button");if(!t||!t.dataset.ty)return;D.type=t.dataset.ty;render();});
document.addEventListener("input",function(e){if(e.target.id==="dq"){D.q=e.target.value;var r=$("dres");if(r)r.innerHTML=dirList();}});
document.addEventListener("change",function(e){if(e.target.id==="donly"){D.only=e.target.checked;var r=$("dres");if(r)r.innerHTML=dirList();}});
