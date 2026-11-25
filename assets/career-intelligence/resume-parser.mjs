const MAX=10*1024*1024, TEXT_MAX=500000;
export async function docxText(buffer){
 const v=new DataView(buffer), bytes=new Uint8Array(buffer), names=new TextDecoder();let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(v.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw Error('Invalid DOCX archive.');
 let offset=v.getUint32(end+16,true);const count=v.getUint16(end+10,true),chunks=[];if(count>2000)throw Error('DOCX has too many archive entries.');
 for(let i=0;i<count;i++){
  if(offset+46>bytes.length||v.getUint32(offset,true)!==0x02014b50)throw Error('Invalid DOCX directory.');
  const method=v.getUint16(offset+10,true),compressed=v.getUint32(offset+20,true),size=v.getUint32(offset+24,true),n=v.getUint16(offset+28,true),extra=v.getUint16(offset+30,true),comment=v.getUint16(offset+32,true),local=v.getUint32(offset+42,true);
  const name=names.decode(bytes.slice(offset+46,offset+46+n));offset+=46+n+extra+comment;
  if(!/^word\/(?:document|header\d+|footer\d+)\.xml$/.test(name))continue;
  if(size>MAX||compressed>MAX||local+30>bytes.length||v.getUint32(local,true)!==0x04034b50)throw Error('DOCX entry is oversized or invalid.');
  const start=local+30+v.getUint16(local+26,true)+v.getUint16(local+28,true);if(start+compressed>bytes.length)throw Error('Truncated DOCX.');
  let raw=bytes.slice(start,start+compressed);
  if(method===8){const reader=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();const parts=[];let total=0;try{while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>MAX)throw Error('DOCX expansion limit exceeded.');parts.push(value);}}finally{await reader.cancel().catch(()=>{});}raw=new Uint8Array(total);let at=0;for(const b of parts){raw.set(b,at);at+=b.length;}}
  else if(method!==0)throw Error('Unsupported DOCX compression.');
  const xml=new DOMParser().parseFromString(names.decode(raw),'application/xml');if(xml.querySelector('parsererror'))throw Error('Invalid DOCX document XML.');
  const walk=n=>{if(n.nodeType!==1)return '';const ln=n.localName;if(ln==='t')return n.textContent||'';if(ln==='tab')return ' ';if(ln==='br'||ln==='cr')return '\n';let out='';for(let c=n.firstChild;c;c=c.nextSibling)out+=walk(c);return out;};
  const paragraphs=[...xml.getElementsByTagNameNS('*','p')].map(p=>walk(p).trim()).filter(Boolean);
  chunks.push(paragraphs.join('\n'));
 }
 const text=chunks.join('\n');if(text.length>TEXT_MAX)throw Error('Resume text is too large.');return text;
}
export async function parseResume(file){
 if(!file||file.size>MAX)throw Error('Choose a resume no larger than 10 MB.');
 const ext=file.name.split('.').pop().toLowerCase();let text='',pages=null;
 if(ext==='txt'||ext==='md')text=await file.text();
 else if(ext==='docx')text=await docxText(await file.arrayBuffer());
 else if(ext==='pdf'){
  const pdfjs=await import('../vendor/pdfjs/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc=new URL('../vendor/pdfjs/pdf.worker.mjs',import.meta.url).href;
  const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,useSystemFonts:true});let doc;
  try{doc=await task.promise;if(doc.numPages>30)throw Error('Resume PDFs must be 30 pages or fewer.');pages=doc.numPages;const output=[];for(let n=1;n<=pages;n++){const page=await doc.getPage(n),content=await page.getTextContent();output.push(content.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join(''));}text=output.join('\n\n');}finally{if(doc)await doc.destroy();else await task.destroy();}
 }else throw Error('Supported formats: PDF, DOCX, TXT and Markdown.');
 text=text.replace(/\r\n/g,'\n').trim();if(text.length>TEXT_MAX)throw Error('Resume text is too large.');if(text.replace(/\s/g,'').length<30)throw Error('No readable resume text found. Scanned PDFs need OCR; paste the text or upload a text-based PDF.');
 return {filename:file.name,text,pages,format:ext,uploadedAt:new Date().toISOString()};
}
