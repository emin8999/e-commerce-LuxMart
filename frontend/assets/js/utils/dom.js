export function el(tag, attrs={}, ...children){
  const n = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)){
    if(k==='class') n.className=v;
    else if(k==='html') n.innerHTML=v;
    else if(k.startsWith('on') && typeof v==='function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k,v);
  }
  for (const c of children){
    if (c==null) continue;
    if (Array.isArray(c)) c.forEach(ch => ch!=null && n.appendChild(typeof ch==='string'?document.createTextNode(ch):ch));
    else n.appendChild(typeof c==='string'?document.createTextNode(c):c);
  }
  return n;
}
export const qs = (s,root=document)=>root.querySelector(s);
export const qsa = (s,root=document)=>Array.from(root.querySelectorAll(s));
