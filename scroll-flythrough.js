class ScrollFlythrough extends HTMLElement {
  connectedCallback() {
    this.attachShadow({mode:'open'});
    this.shadowRoot.innerHTML = `<style>:host{display:block;width:100%;height:100%;overflow:hidden}canvas{display:block;width:100%;height:100%}</style><canvas></canvas>`;
    this.canvas=this.shadowRoot.querySelector('canvas');
    this.ctx=this.canvas.getContext('2d',{alpha:false});
    this.count=196;this.frames=new Array(this.count);this.inflight=new Set();this.current=0;this.last=-1;this.active=true;
    this.base=new URL('./frames/',Array.from(document.scripts).find(s=>s.src.includes('scroll-flythrough.js'))?.src || location.href).href;
    this.resize=()=>{const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.clientWidth*dpr);this.canvas.height=Math.round(this.clientHeight*dpr);this.last=-1;};
    this.ro=new ResizeObserver(this.resize);this.ro.observe(this);this.resize();
    this.findTrack=()=>{let p=this.parentElement;while(p&&p!==document.body){if(p.getBoundingClientRect().height>innerHeight*1.5)return p;p=p.parentElement;}return this.parentElement;};
    this.track=this.findTrack();
    this.load(0);for(let i=16;i<this.count;i+=16)this.load(i);
    this.loop=()=>{if(!this.active)return;const r=this.track.getBoundingClientRect();const total=Math.max(1,r.height-innerHeight);const progress=Math.max(0,Math.min(1,-r.top/total));const target=progress*(this.count-1);this.current+=(target-this.current)*0.18;if(Math.abs(target-this.current)<0.02)this.current=target;const idx=Math.round(this.current);this.load(idx);for(let d=1;d<=8;d++){this.load(Math.min(this.count-1,idx+d));this.load(Math.max(0,idx-d));}if(idx!==this.last)this.draw(idx);this.raf=requestAnimationFrame(this.loop);};
    this.raf=requestAnimationFrame(this.loop);
  }
  load(i){if(this.frames[i]||this.inflight.has(i))return;this.inflight.add(i);const img=new Image();img.onload=()=>{this.frames[i]=img;this.inflight.delete(i);this.last=-1;};img.onerror=()=>this.inflight.delete(i);img.src=this.base+`f_${String(i+1).padStart(4,'0')}.webp`;}
  draw(i){let nearest=-1;for(let d=0;d<this.count;d++){if(i-d>=0&&this.frames[i-d]){nearest=i-d;break;}if(i+d<this.count&&this.frames[i+d]){nearest=i+d;break;}}if(nearest<0)return;const img=this.frames[nearest],cw=this.canvas.width,ch=this.canvas.height;const scale=Math.max(cw/img.width,ch/img.height),w=img.width*scale,h=img.height*scale;this.ctx.drawImage(img,(cw-w)/2,(ch-h)/2,w,h);this.last=i;}
  disconnectedCallback(){this.active=false;cancelAnimationFrame(this.raf);this.ro?.disconnect();}
}
if(!customElements.get('scroll-flythrough'))customElements.define('scroll-flythrough',ScrollFlythrough);
