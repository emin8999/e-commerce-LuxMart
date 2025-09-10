
window.i18n = (function(){
  let locale = localStorage.getItem('locale') || 'en';
  let dict = {};
  const listeners = [];

  async function load(){
    const namespaces = ['common','nav','catalog','checkout','dashboard','categories','home','product','auth','orders','profile','about','customer'];
    const loaded = {};
    for(const ns of namespaces){
      try{
        const res = await fetch(`./assets/i18n/${locale}/${ns}.json`);
        loaded[ns] = await res.json();
      }catch(e){ loaded[ns] = {}; }
    }
    dict = loaded;
    translatePage();
    listeners.forEach(cb=>cb());
  }

  function t(path){
    const [ns, key] = path.split('.', 2);
    return (dict[ns] && dict[ns][key]) || path;
  }

  function translatePage(){
    // text content
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    // common attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(key));
    });
    document.querySelectorAll('[data-i18n-value]').forEach(el=>{
      const key = el.getAttribute('data-i18n-value');
      el.setAttribute('value', t(key));
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el=>{
      const key = el.getAttribute('data-i18n-aria-label');
      el.setAttribute('aria-label', t(key));
    });
  }

  function setLocale(lc){
    locale = lc; localStorage.setItem('locale', lc); load();
  }

  function getLocale(){ return locale; }

  // init
  load();

  return { t, setLocale, getLocale, onUpdate: (cb)=>listeners.push(cb) };
})();
