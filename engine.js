const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const di={ng:'ڠ',ny:'ڽ',sy:'ش',kh:'خ',gh:'غ'};
const co={b:'ب',c:'چ',d:'د',f:'ف',g:'ݢ',h:'ه',j:'ج',k:'ک',l:'ل',m:'م',n:'ن',p:'ڤ',q:'ق',r:'ر',s:'س',t:'ت',v:'ۏ',w:'و',x:'کس',y:'ي',z:'ز'};
export function rules(w){let out='';for(let i=0;i<w.length;){const two=w.slice(i,i+2);if(own(di,two)){out+=di[two];i+=2;continue;}const c=w[i],first=i===0,last=i===w.length-1;out+=own(co,c)?co[c]:c==='a'?(first||last?'ا':''):c==='e'?(first?'ا':''):c==='i'?(first?'اي':'ي'):c==='o'||c==='u'?(first?'او':'و'):c;i++;}return out;}
export function word(w,dict){const k=w.toLowerCase();if(own(dict,k))return {j:dict[k],p:false};if(k.includes('-')){const parts=k.split('-');if(parts.length===2&&parts[0]===parts[1]){const a=word(parts[0],dict);return {j:a.j+'٢',p:a.p};}const a=parts.map(x=>word(x,dict));return {j:a.map(x=>x.j).join('-'),p:a.some(x=>x.p)};}return {j:rules(k),p:true};}
export function convert(text,dict){
 const phrases=Object.create(null);for(const k of Object.keys(dict)){if(!/^[a-z]+(?:-[a-z]+)*(?: [a-z]+(?:-[a-z]+)*)+$/.test(k))continue;const ws=k.split(' ');(phrases[ws[0]]??=[]).push({ws,j:dict[k]});}for(const a of Object.values(phrases))a.sort((a,b)=>b.ws.length-a.ws.length);
 const tokens=[...text.matchAll(/[A-Za-z]+(?:-[A-Za-z]+)*|[?,;]/g)],out=[];let last=0,i=0;const punctuation={'?':'؟',',':'،',';':'؛'};
 while(i<tokens.length){const t=tokens[i],start=t.index;if(start>last)out.push({j:text.slice(last,start),p:false});if(own(punctuation,t[0])){out.push({j:punctuation[t[0]],p:false});last=start+t[0].length;i++;continue;}
 let hit=null;for(const candidate of phrases[t[0].toLowerCase()]||[]){if(i+candidate.ws.length>tokens.length)continue;let ok=true;for(let n=0;n<candidate.ws.length;n++){const cur=tokens[i+n];if(cur[0].toLowerCase()!==candidate.ws[n]||(n&& !/^[ \t]+$/.test(text.slice(tokens[i+n-1].index+tokens[i+n-1][0].length,cur.index)))){ok=false;break;}}if(ok){hit=candidate;break;}}
 if(hit){const end=tokens[i+hit.ws.length-1].index+tokens[i+hit.ws.length-1][0].length;out.push({r:text.slice(start,end),j:hit.j,p:false});last=end;i+=hit.ws.length;}else{out.push({r:t[0],...word(t[0],dict)});last=start+t[0].length;i++;}}
 if(last<text.length)out.push({j:text.slice(last),p:false});return out;
}
