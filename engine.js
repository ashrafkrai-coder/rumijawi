const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const di={ng:'ڠ',ny:'ڽ',sy:'ش',kh:'خ',gh:'غ'};
const co={b:'ب',c:'چ',d:'د',f:'ف',g:'ݢ',h:'ه',j:'ج',k:'ک',l:'ل',m:'م',n:'ن',p:'ڤ',q:'ق',r:'ر',s:'س',t:'ت',v:'ۏ',w:'و',x:'کس',y:'ي',z:'ز',"'":'ء'};
const clitic={nya:'ڽ',ku:'کو',mu:'مو',lah:'له',kah:'که',tah:'ته'};
const APOS=/['‘’ʼ`]/g;
const plain=w=>w.normalize('NFD').replace(/\p{M}/gu,'').normalize('NFC');
// Cuba ejaan asal, kemudian variasi apostrof (’ ‘ atau tiada) dan tanpa aksen.
function lookup(k,dict,strip=true){const c=new Set([k,k.replace(APOS,'’'),k.replace(APOS,'‘')]);if(strip)c.add(k.replace(APOS,''));for(const x of[...c])c.add(plain(x));for(const x of c)if(own(dict,x))return dict[x];}
export function rules(w){w=plain(w).replace(APOS,"'");let out='';for(let i=0;i<w.length;){const two=w.slice(i,i+2);if(own(di,two)){out+=di[two];i+=2;continue;}const c=w[i],first=i===0,last=i===w.length-1;out+=own(co,c)?co[c]:c==='a'?(first||last?'ا':''):c==='e'?(first?'ا':''):c==='i'?(first?'اي':'ي'):c==='o'||c==='u'?(first?'او':'و'):c;i++;}return out;}
export function word(w,dict){const k=w.normalize('NFC').toLowerCase(),hit=lookup(k,dict);if(hit!==undefined)return {j:hit,p:false};if(k.includes('-')){const parts=k.split('-');if(parts.length===2&&parts.every(Boolean)){const [a,b]=parts;
 // Gandaan penuh (buku-buku) → ٢. Gandaan berimbuhan (berlari-lari) kekal bersengkang, ikut konvensyen kamus.
 if(a===b){const x=word(a,dict);return {j:x.j+'٢',p:x.p};}
 // Gandaan + klitik (buku-bukunya, rumah-rumahku) → ٢ diikuti klitik
 for(const s of Object.keys(clitic))if(b===a+s){const x=word(a,dict);return {j:x.j+'٢'+clitic[s],p:x.p};}}
 const xs=parts.map(x=>x?word(x,dict):{j:'',p:false});return {j:xs.map(x=>x.j).join('-'),p:xs.some(x=>x.p)};}return {j:rules(k),p:true};}
// Indeks frasa dibina sekali bagi setiap objek kamus (bukan setiap penukaran).
const phraseCache=new WeakMap();
function phraseIndex(dict){let phrases=phraseCache.get(dict);if(phrases)return phrases;phrases=Object.create(null);for(const k of Object.keys(dict)){if(!/^[a-z]+(?:-[a-z]+)*(?: [a-z]+(?:-[a-z]+)*)+$/.test(k))continue;const ws=k.split(' ');(phrases[ws[0]]??=[]).push({ws,j:dict[k]});}for(const a of Object.values(phrases))a.sort((a,b)=>b.ws.length-a.ws.length);phraseCache.set(dict,phrases);return phrases;}
export function convert(text,dict){
 const phrases=phraseIndex(dict);
 const tokens=[...text.matchAll(/[\p{Script=Latin}\p{M}]+(?:['‘’ʼ\-][\p{Script=Latin}\p{M}]+)*['‘’ʼ]?|[?,;]/gu)],out=[];let last=0,i=0;const punctuation={'?':'؟',',':'،',';':'؛'};
 // Apostrof di hujung (dato') hanya sebahagian perkataan jika ada dalam kamus; jika tidak, ia tanda petik penutup.
 for(const t of tokens)if(/['‘’ʼ]$/.test(t[0])&&lookup(t[0].normalize('NFC').toLowerCase(),dict,false)===undefined)t[0]=t[0].slice(0,-1);
 while(i<tokens.length){const t=tokens[i],start=t.index;if(start>last)out.push({j:text.slice(last,start),p:false});if(own(punctuation,t[0])){out.push({j:punctuation[t[0]],p:false});last=start+t[0].length;i++;continue;}
 let hit=null;for(const candidate of phrases[t[0].toLowerCase()]||[]){if(i+candidate.ws.length>tokens.length)continue;let ok=true;for(let n=0;n<candidate.ws.length;n++){const cur=tokens[i+n];if(cur[0].toLowerCase()!==candidate.ws[n]||(n&& !/^[ \t]+$/.test(text.slice(tokens[i+n-1].index+tokens[i+n-1][0].length,cur.index)))){ok=false;break;}}if(ok){hit=candidate;break;}}
 if(hit){const end=tokens[i+hit.ws.length-1].index+tokens[i+hit.ws.length-1][0].length;out.push({r:text.slice(start,end),j:hit.j,p:false});last=end;i+=hit.ws.length;}else{out.push({r:t[0],...word(t[0],dict)});last=start+t[0].length;i++;}}
 if(last<text.length)out.push({j:text.slice(last),p:false});return out;
}
