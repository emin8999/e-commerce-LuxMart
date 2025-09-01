
// Minimal admin/store dashboard handlers (demo)
(async function(){
  const path = location.pathname;
  if(path.endsWith('/admin.html')){
    // Rates
    const r = await fetch('http://localhost:8080/api/config/rates').then(r=>r.json()).catch(()=>({AZN:1.7,EUR:0.92,TRY:33}));
    document.getElementById('rateAZN').value = r.AZN || 1.7;
    document.getElementById('rateEUR').value = r.EUR || 0.92;
    document.getElementById('rateTRY').value = r.TRY || 33;
    document.getElementById('saveRates').onclick = async ()=>{
      const body = {
        AZN: Number(document.getElementById('rateAZN').value||1.7),
        EUR: Number(document.getElementById('rateEUR').value||0.92),
        TRY: Number(document.getElementById('rateTRY').value||33)
      };
      await fetch('http://localhost:8080/api/config/rates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      alert('Rates saved');
    };
    // Shipping
    const s = await fetch('http://localhost:8080/api/config/shipping').then(r=>r.json()).catch(()=>({shippingCost:5}));
    document.getElementById('shippingCost').value = s.shippingCost || 5;
    document.getElementById('saveShipping').onclick = async ()=>{
      const body = { shippingCost: Number(document.getElementById('shippingCost').value||5) };
      await fetch('http://localhost:8080/api/config/shipping',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      alert('Shipping saved');
    };
  }
})();