(()=>{'use strict';
const T=THREE,$=id=>document.getElementById(id),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const HW=20,HD=9.5,WH=8,PI=Math.PI;
const lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),ease=t=>t*t*(3-2*t);
const wrapA=a=>((a+PI)%(2*PI)+2*PI)%(2*PI)-PI;
let dt=.016,time=0;
const damp=(c,t,k)=>c+(t-c)*(1-Math.exp(-k*dt));
const dAng=(c,t,k)=>c+wrapA(t-c)*(1-Math.exp(-k*dt));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const until=fn=>new Promise(r=>{const i=setInterval(()=>{if(fn()){clearInterval(i);r();}},80);});
const SKIP=location.hash==='#proposal'; // testing shortcut: open index.html#proposal

/* ---------------- AUDIO (generated romantic music, no files needed) ---------------- */
const Aud=(()=>{let c,m,d,fb,step=0,next=0,vol=.5,tempo=1,muted=false;
 const CH=[[48,55,59,64],[45,52,57,64],[41,48,53,60],[43,50,55,62]],AR=[0,1,2,3,2,3,1,2];
 const fr=n=>440*Math.pow(2,(n-69)/12);
 function note(n,t,dur,g){const o=c.createOscillator(),e=c.createGain();o.type='triangle';o.frequency.value=fr(n);e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(g,t+.02);e.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(e);e.connect(m);e.connect(d);o.start(t);o.stop(t+dur+.05);}
 function pump(){while(next<c.currentTime+.35){const ch=CH[Math.floor(step/8)%4],k=step%8,up=tempo>1.2?12:0;
  if(k===0)[0,1,2].forEach(i=>note(ch[i]-12,next,3.8/tempo,.07));
  note(ch[AR[k]]+12+up,next,1.4,.11);
  if(k%4===0&&tempo>1.2)note(ch[3]+24,next,.8,.05);
  next+=.46/tempo;step++;}}
 return{start(){if(c){c.resume();return;}c=new(window.AudioContext||window.webkitAudioContext)();m=c.createGain();m.gain.value=muted?0:vol;m.connect(c.destination);
  d=c.createDelay(.6);d.delayTime.value=.38;fb=c.createGain();fb.gain.value=.38;const w=c.createGain();w.gain.value=.5;d.connect(fb);fb.connect(d);d.connect(w);w.connect(c.destination);
  next=c.currentTime+.1;setInterval(pump,120);},
  set(v,t){vol=v;tempo=t;if(m&&!muted)m.gain.setTargetAtTime(v,c.currentTime,.8);},
  toggle(){muted=!muted;if(m)m.gain.setTargetAtTime(muted?0:vol,c.currentTime,.1);return!muted;}};})();

/* ---------------- RENDERER ---------------- */
const renderer=new T.WebGLRenderer({canvas:$('c'),antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
const scene=new T.Scene();scene.background=new T.Color(0x07040a);scene.fog=new T.Fog(0x07040a,22,60);
const camera=new T.PerspectiveCamera(60,1,.1,100);
const resize=()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();};
addEventListener('resize',resize);resize();
if('ontouchstart' in window||matchMedia('(pointer:coarse)').matches)document.body.classList.add('touch');

/* ---------------- TEXTURES ---------------- */
function canvasTex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;return t;}
const dotTex=canvasTex(64,64,g=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.3,'rgba(255,255,255,.6)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);});
const heartTex=canvasTex(64,64,g=>{g.fillStyle='#fff';g.shadowColor='#ff5c8a';g.shadowBlur=8;g.beginPath();g.moveTo(32,54);g.bezierCurveTo(4,34,10,8,32,22);g.bezierCurveTo(54,8,60,34,32,54);g.fill();});
const floorTex=canvasTex(512,512,g=>{g.fillStyle='#efe4d8';g.fillRect(0,0,512,512);
 for(let i=0;i<40;i++){g.strokeStyle=`rgba(${120+Math.random()*60|0},${100+Math.random()*50|0},100,${.05+Math.random()*.1})`;g.lineWidth=1+Math.random()*2;g.beginPath();let x=Math.random()*512,y=Math.random()*512;g.moveTo(x,y);for(let k=0;k<6;k++){x+=Math.random()*120-40;y+=Math.random()*120-40;g.lineTo(x,y);}g.stroke();}
 g.strokeStyle='rgba(180,140,70,.7)';g.lineWidth=4;g.strokeRect(0,0,512,512);});
floorTex.wrapS=floorTex.wrapT=T.RepeatWrapping;floorTex.repeat.set(HW,HD);floorTex.anisotropy=8;
const skyTex=canvasTex(512,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#0b0b2b');gr.addColorStop(.6,'#3a1c4d');gr.addColorStop(1,'#7a3358');g.fillStyle=gr;g.fillRect(0,0,w,h);
 for(let i=0;i<120;i++){g.fillStyle=`rgba(255,255,255,${Math.random()*.8})`;g.fillRect(Math.random()*w,Math.random()*h*.6,1.5,1.5);}
 for(let i=0;i<70;i++){g.fillStyle=`rgba(255,${180+Math.random()*60|0},120,${.2+Math.random()*.4})`;g.beginPath();g.arc(Math.random()*w,h*.75+Math.random()*h*.25,2+Math.random()*5,0,7);g.fill();}
 g.fillStyle='#fff6d8';g.beginPath();g.arc(400,60,16,0,7);g.fill();});

/* ---------------- WORLD ---------------- */
const deco=new T.Group();scene.add(deco);
const MS=(c,o={})=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.8},o));
const wallM=MS(0xe3cfbf,{roughness:.95}),woodM=MS(0x4b2a1d,{roughness:.45}),goldM=MS(0xd4a944,{metalness:.8,roughness:.3});
const bulbM=new T.MeshBasicMaterial({color:0xfff0c8}),stripM=new T.MeshBasicMaterial({color:0xfff0c8});
const add=(g,m,x,y,z,p=deco)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;};
const B=(w,h,d)=>new T.BoxGeometry(w,h,d);
const obstacles=[];
const floor=add(new T.PlaneGeometry(HW*2,HD*2),new T.MeshStandardMaterial({map:floorTex,roughness:.16,metalness:.15,transparent:true,opacity:.82}),0,0,0,scene);floor.rotation.x=-PI/2;
[-1,1].forEach(s=>{
 add(B(HW*2,WH,.4),wallM,0,WH/2,s*(HD+.2));
 add(B(HW*2,1.1,.12),woodM,0,.55,s*(HD-.06));
 add(B(HW*2,.08,.14),goldM,0,1.15,s*(HD-.07));
 add(B(HW*2,.18,.16),goldM,0,WH-.3,s*(HD-.08));
 const w=add(new T.PlaneGeometry(HD*2,WH),new T.MeshBasicMaterial({map:skyTex}),s*HW,WH/2,0);w.rotation.y=-s*PI/2;
 for(let k=-4;k<=4;k++)add(B(.12,WH,.12),goldM,s*(HW-.06),WH/2,k*HD/4);
 add(B(.12,.1,HD*2),goldM,s*(HW-.06),4.2,0);add(B(.12,.2,HD*2),goldM,s*(HW-.06),1,0);
 add(new T.PlaneGeometry(HW*1.8,.1),goldM,0,.014,s*1.4).rotation.x=-PI/2;
 add(B(HW*1.8,.06,.25),stripM,0,WH-.05,s*3.5);
});
add(new T.PlaneGeometry(HW*2,HD*2),MS(0x2a1a22),0,WH,0).rotation.x=PI/2;
add(new T.PlaneGeometry(HW*1.8,2.8),MS(0x7d1530,{roughness:.95}),0,.012,0).rotation.x=-PI/2;
const chand=[];
[-13,0,13].forEach(x=>{const g=new T.Group();g.position.set(x,6.5,0);deco.add(g);
 add(new T.CylinderGeometry(.03,.03,1.6),goldM,0,.8,0,g);
 [[1.1,0],[.72,-.35],[.4,-.7]].forEach(([r,y],i)=>{add(new T.TorusGeometry(r,.035,8,32),goldM,0,y,0,g).rotation.x=PI/2;const n=i?8:12;for(let k=0;k<n;k++){const a=k/n*2*PI;add(new T.SphereGeometry(.06,8,6),bulbM,Math.cos(a)*r,y+.07,Math.sin(a)*r,g);}});
 const l=new T.PointLight(0xffc27a,1.1,24,1.6);l.position.set(x,6,0);scene.add(l);chand.push(l);});
function plant(x,z){const g=new T.Group();g.position.set(x,0,z);deco.add(g);
 add(new T.CylinderGeometry(.5,.38,.8,14),MS(0xf2ece4,{roughness:.4}),0,.4,0,g);add(new T.TorusGeometry(.5,.03,6,16),goldM,0,.8,0,g).rotation.x=PI/2;
 [[0,1.2,0,.65],[.35,1.05,.2,.45],[-.3,1.1,-.2,.5]].forEach(([a,b,c,r])=>add(new T.SphereGeometry(r,10,8),MS(0x2f6b3a),a,b,c,g));
 for(let i=0;i<7;i++){const a=i*2.4;add(new T.SphereGeometry(.09,8,6),MS([0xff5c8a,0xd7263d,0xffd1dc][i%3]),Math.cos(a)*.5,1.2+Math.sin(i*3)*.35,Math.sin(a)*.5,g);}
 obstacles.push({x,z,r:.85});}
[-18.6,-9.5,0,9.5,18.6].forEach(x=>[-8.4,8.4].forEach(z=>plant(x,z)));
const amb=new T.AmbientLight(0xffe2c0,.6),hemi=new T.HemisphereLight(0xffe9cf,0x3a2018,.45);scene.add(amb,hemi);
const fs=new T.SpotLight(0xfff0d0,0,16,.5,.8,1);fs.position.set(0,7.6,0);scene.add(fs,fs.target);

/* ---------------- PHOTO FRAMES ---------------- */
const PH=[...PHOTOS].sort((a,b)=>a.order-b.order),P=[];
function buildPhotos(texs){
 PH.forEach((cfg,i)=>{const tex=texs[i],s=cfg.wall==='south'?1:-1,asp=tex.image.width/tex.image.height;
  let h=3.5,w=h*asp;if(w>4.4){w=4.4;h=w/asp;}
  const g=new T.Group();g.position.set(cfg.x,3.5,s*(HD-.1));g.rotation.y=s>0?PI:0;deco.add(g);
  const pm=new T.MeshStandardMaterial({map:tex,roughness:.5,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.3});
  const fm=new T.MeshStandardMaterial({color:0xc99a3c,metalness:.85,roughness:.28,emissive:0xffb347,emissiveIntensity:0}),bd=.22;
  add(new T.PlaneGeometry(w,h),pm,0,0,.07,g);add(B(w+bd*2,h+bd*2,.12),fm,0,0,0,g);
  add(B(w+bd*2,.12,.16),fm,0,h/2+bd-.06,.02,g);add(B(w+bd*2,.12,.16),fm,0,-h/2-bd+.06,.02,g);
  add(B(.12,h+bd*2,.16),fm,-w/2-bd+.06,0,.02,g);add(B(.12,h+bd*2,.16),fm,w/2+bd-.06,0,.02,g);
  const sp=new T.SpotLight(0xffd9a0,0,14,.42,.7,1.2);sp.position.set(cfg.x,WH-.4,s*(HD-4.2));sp.target.position.set(cfg.x,3.5,s*HD);scene.add(sp,sp.target);
  P.push({cfg,fm,sp,caption:cfg.caption,center:new T.Vector3(cfg.x,1.5,s*HD),stand:{x:cfg.x,z:s*5},mx:cfg.x+2.4,mz:s*5,face:{x:cfg.x,z:s*HD}});});
 const mir=deco.clone();mir.scale.y=-1;scene.add(mir); // reflection on polished floor
}

/* ---------------- CHARACTERS (procedural, rigged, custom animations) ---------------- */
function tag(txt){const t=canvasTex(256,64,g=>{g.fillStyle='rgba(30,10,20,.65)';g.beginPath();g.rect(4,8,248,48);g.fill();g.fillStyle='#ffe3ef';g.font='600 30px Georgia';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,128,34);});
 const s=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(1.9,.475,1);return s;}
const shadowTex=canvasTex(64,64,g=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(0,0,0,.6)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,64,64);});
function makeChar(o){
 const root=new T.Group(),hips=new T.Group(),torso=new T.Group(),head=new T.Group();root.add(hips);hips.add(torso);torso.add(head);head.position.y=.72;
 const M=(c,r=.7)=>new T.MeshStandardMaterial({color:c,roughness:r}),sk=M(o.skin,.55),shirtM=M(o.shirt,.85),pn=M(o.pants,.8),hr=M(o.hair,.4),shoe=M(0x1a1a1f,.5);
 const ad=(p,geo,m,x=0,y=0,z=0)=>{const e=new T.Mesh(geo,m);e.position.set(x,y,z);p.add(e);return e;};
 const w=o.female?.4:.52;
 ad(hips,B(.38,.22,.24),pn);ad(torso,B(w,.64,.26),shirtM,0,.38,0);ad(torso,new T.CylinderGeometry(.06,.07,.1,8),sk,0,.74,0);
 ad(head,new T.SphereGeometry(.17,16,14),sk,0,.2,0).scale.y=1.08;
 [-.06,.06].forEach(x=>ad(head,new T.SphereGeometry(.018,8,6),M(0x111111),x,.22,.155));
 ad(head,new T.TorusGeometry(.04,.008,6,10,PI),M(0x8a3a3a),0,.15,.16).rotation.z=PI;
 if(o.female){ad(head,new T.SphereGeometry(.185,14,12),hr,0,.27,-.02);ad(head,new T.SphereGeometry(.09,10,8),hr,0,.45,-.06);ad(head,B(.32,.5,.1),hr,0,.02,-.15);}
 else{ad(head,new T.SphereGeometry(.182,14,12),hr,0,.27,-.02);const bd=ad(head,new T.SphereGeometry(.165,12,10),M(0x1c1412),0,.12,.02);bd.scale.y=.55;}
 const arm=sx=>{const sh=new T.Group();sh.position.set(sx*(w/2+.08),.62,0);torso.add(sh);
  ad(sh,new T.CylinderGeometry(.075,.07,.32,8),shirtM,0,-.16,0);ad(sh,new T.SphereGeometry(.075,8,6),shirtM);
  const el=new T.Group();el.position.y=-.32;sh.add(el);ad(el,new T.CylinderGeometry(.06,.05,.3,8),sk,0,-.15,0);ad(el,new T.SphereGeometry(.065,8,6),sk,0,-.32,0);
  const hand=new T.Group();hand.position.y=-.34;el.add(hand);return{sh,el,hand};};
 const leg=sx=>{const th=new T.Group();th.position.set(sx*.1,-.02,0);hips.add(th);ad(th,new T.CylinderGeometry(.09,.075,.46,8),pn,0,-.23,0);
  const kn=new T.Group();kn.position.y=-.46;th.add(kn);ad(kn,new T.CylinderGeometry(.075,.065,.46,8),pn,0,-.23,0);ad(kn,B(.12,.07,.26),shoe,0,-.5,.05);return{th,kn};};
 const c={root,hips,torso,head,aL:arm(-1),aR:arm(1),lL:leg(-1),lR:leg(1),goal:null,look:null,speed:3,heading:0,
  s:{sp:0,ph:0,kneel:0,crouch:0,lean:0,hang:false,splay:0,arms:null,talk:false}};
 root.scale.setScalar(o.scale);const t=tag(o.name);t.position.y=2.55;root.add(t);
 const sh=new T.Mesh(new T.PlaneGeometry(1.1,1.1),new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));sh.rotation.x=-PI/2;scene.add(sh);
 const D=(ob,p,v,k=16)=>{ob[p]=damp(ob[p],v,k);};
 c.update=()=>{const s=c.s,k=s.kneel,cr=s.crouch;s.ph+=dt*s.sp*9;const sw=Math.sin(s.ph)*.75*s.sp;
  let tL=sw,tR=-sw,sL=Math.max(0,-Math.sin(s.ph+1))*.9*s.sp,sR=Math.max(0,Math.sin(s.ph+1))*.9*s.sp;
  if(s.hang){const a=Math.sin(time*5);tL=.25+a*.3;tR=.25-a*.3;sL=.6+a*.3;sR=.6-a*.3;}
  tL=tL*(1-k)-1.57*k-1.3*cr;tR=tR*(1-k)-1.3*cr;sL=sL*(1-k)+2.6*cr;sR=sR*(1-k)+1.57*k+2.6*cr;
  D(c.lL.th.rotation,'x',tL);D(c.lR.th.rotation,'x',tR);D(c.lL.kn.rotation,'x',sL);D(c.lR.kn.rotation,'x',sR);
  D(c.lL.th.rotation,'z',-s.splay);D(c.lR.th.rotation,'z',s.splay);
  let A=s.arms;if(!A){const a=sw*.7;A={lx:a,lz:-.08,le:-.15,rx:-a,rz:-.08,re:-.15};if(s.talk){A.rx=-.6+Math.sin(time*3)*.15;A.re=-1.1;}}
  D(c.aL.sh.rotation,'x',A.lx);D(c.aL.sh.rotation,'z',A.lz);D(c.aL.el.rotation,'x',A.le);
  D(c.aR.sh.rotation,'x',A.rx);D(c.aR.sh.rotation,'z',-A.rz);D(c.aR.el.rotation,'x',A.re);
  const by=lerp(1.015-.92*(1-Math.cos(1.3*cr)),.58,k)+Math.abs(Math.cos(s.ph))*.04*s.sp+Math.sin(time*1.8)*.004;
  hips.position.y=damp(hips.position.y,by,14);torso.rotation.x=damp(torso.rotation.x,s.lean+Math.sin(time*1.8)*.01,10);
  sh.position.set(root.position.x,.02,root.position.z);sh.scale.setScalar(1-root.position.y*.5);};
 return c;}
const F=makeChar({name:'Yvone 💖',scale:.84,female:true,skin:0xf0c8a4,shirt:0x16161a,pants:0x3d4f6b,hair:0x0e0a0a});
const Mn=makeChar({name:'Hanzallah ❤️',scale:.88,skin:0xc68a62,shirt:0x15151a,pants:0x23232b,hair:0x1a1210});
scene.add(F.root,Mn.root);
const POSE={
 offer:{lx:-.3,lz:.2,le:-1.5,rx:-1.5,rz:0,re:-.6},show:{lx:-.3,lz:.2,le:-1.5,rx:-2.7,rz:0,re:-.2},
 happy:{lx:-1.3,lz:.5,le:-2,rx:-1.3,rz:.5,re:-2},hug:{lx:-.8,lz:.5,le:-.9,rx:-.8,rz:.5,re:-.9},neck:{lx:-1.4,lz:.6,le:-.5,rx:-1.4,rz:.6,re:-.5}};
// engagement ring
const ring=new T.Group();ring.visible=false;
{const r=new T.Mesh(new T.TorusGeometry(.06,.012,8,24),goldM);r.rotation.y=PI/2;ring.add(r);
 const gem=new T.Mesh(new T.OctahedronGeometry(.04),new T.MeshBasicMaterial({color:0xcfefff}));gem.position.set(0,0,.075);ring.add(gem);
 const gl=new T.Sprite(new T.SpriteMaterial({map:dotTex,color:0xbfe6ff,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));gl.scale.set(.5,.5,1);gl.position.copy(gem.position);ring.add(gl);
 Mn.aR.hand.add(ring);}
function walkTo(c,x,z){return new Promise(res=>{if(c.goal&&c.goal.res)c.goal.res();c.goal={x,z,res};c.look=null;});}
function collide(p){p.x=clamp(p.x,-HW+1,HW-1);p.z=clamp(p.z,-HD+1,HD-1);
 for(const o of obstacles){const dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz),m=o.r+.35;if(d<m&&d>0){p.x=o.x+dx/d*m;p.z=o.z+dz/d*m;}}}
function step(c){const p=c.root.position;let mv=false;
 if(c.goal){const dx=c.goal.x-p.x,dz=c.goal.z-p.z,d=Math.hypot(dx,dz);
  if(d>.1){const v=Math.min(c.speed*dt,d);p.x+=dx/d*v;p.z+=dz/d*v;c.heading=Math.atan2(dx,dz);mv=true;}else{const r=c.goal.res;c.goal=null;r&&r();}}
 c.s.sp=damp(c.s.sp,mv?.85:0,8);
 if(!mv&&c.look)c.heading=Math.atan2(c.look.x-p.x,c.look.z-p.z);
 collide(p);c.root.rotation.y=dAng(c.root.rotation.y,c.heading,9);}

/* ---------------- EFFECTS ---------------- */
function pts(n,tex,size,color){const g=new T.BufferGeometry(),p=new Float32Array(n*3);g.setAttribute('position',new T.BufferAttribute(p,3));
 const o=new T.Points(g,new T.PointsMaterial({size,map:tex,color,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));o.frustumCulled=false;scene.add(o);return{o,p,n,g};}
const dust=pts(160,dotTex,.12,0xffd98a),hearts=pts(70,heartTex,.45,0xff5c8a),spark=pts(110,dotTex,.18,0xffe08a);
hearts.o.visible=false;spark.o.visible=false;
for(let i=0;i<dust.n;i++){dust.p[i*3]=(Math.random()-.5)*HW*1.9;dust.p[i*3+1]=Math.random()*WH;dust.p[i*3+2]=(Math.random()-.5)*HD*1.9;}
const sparkC=new T.Vector3();let sparkR=.5,sparkH=.4,petalMode=0;
const NP=500,petals=new T.InstancedMesh(new T.PlaneGeometry(.13,.17),new T.MeshBasicMaterial({side:T.DoubleSide}),NP),pd=[],dm=new T.Object3D(),pc=new T.Color();
petals.frustumCulled=false;scene.add(petals);
for(let i=0;i<NP;i++){pd.push({x:0,y:-50,z:0,v:.8+Math.random()*.8,ph:Math.random()*6,r:Math.random()*6});petals.setColorAt(i,pc.setHex([0xff5c8a,0xd7263d,0xff9db8,0xb3123a][i%4]));}
const flowers=new T.Group();flowers.scale.setScalar(.001);flowers.visible=false;scene.add(flowers);
for(let i=0;i<30;i++){const r=i%2?2.6:2.1,a=i/30*2*PI;const g=new T.Group();g.position.set(Math.cos(a)*r,.12,Math.sin(a)*r);flowers.add(g);
 add(new T.SphereGeometry(.16,10,8),MS([0xd7263d,0xff5c8a,0xffd1dc][i%3]),0,.12,0,g);add(new T.SphereGeometry(.14,8,6),MS(0x2f6b3a),.12,.04,.05,g);add(new T.SphereGeometry(.14,8,6),MS(0x2f6b3a),-.12,.04,-.05,g);}
const marker=new T.Mesh(new T.RingGeometry(.55,.75,40),new T.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));
marker.rotation.x=-PI/2;marker.position.y=.04;marker.visible=false;scene.add(marker);

/* ---------------- STATE / INPUT ---------------- */
const st={canMove:false,cur:-1,focus:null,marker:null,hop:false,flowT:0};
const spin={on:false,t:0,a:0,k:0,kT:1,x0:0,z0:0,xe:0,ze:0,d0:1};
const mood={b:1,s:0,bT:1,sT:0};let fsT=0;
const setMood=(b,s)=>{mood.bT=b;mood.sT=s;};
let camMode='follow',yaw=PI/2,pitch=.32,dragT=0;const camPos=new T.Vector3(),camLook=new T.Vector3(),sLook=new T.Vector3(),want=new T.Vector3(),orb={c:new T.Vector3(),r:5,sw:false};
let camFov=60;
function cineSet(p,l,f=50){p.x=clamp(p.x,-HW+.6,HW-.6);p.z=clamp(p.z,-HD+.6,HD-.6);camMode='cine';camPos.copy(p);camLook.copy(l);camFov=f;}
function pairCam(d=3.6,h=1.3,fov=48){const a=F.root.position,b=Mn.root.position,mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;let dx=b.x-a.x,dz=b.z-a.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
 let nx=-dz,nz=dx;if(Math.abs(mz+nz*d)>Math.abs(mz-nz*d)){nx=-nx;nz=-nz;}cineSet(new T.Vector3(mx+nx*d,h,mz+nz*d),new T.Vector3(mx,1.05,mz),fov);}
const keys={},joy={x:0,y:0};
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code.startsWith('Arrow'))e.preventDefault();});
addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
const jz=$('joy'),kn=$('knob');let jid=null;
jz.addEventListener('pointerdown',e=>{jid=e.pointerId;jz.setPointerCapture(e.pointerId);jm(e);});
jz.addEventListener('pointermove',e=>{if(e.pointerId===jid)jm(e);});
const jend=e=>{if(e.pointerId===jid){jid=null;joy.x=joy.y=0;kn.style.transform='';}};jz.addEventListener('pointerup',jend);jz.addEventListener('pointercancel',jend);
function jm(e){const r=jz.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const l=Math.hypot(dx,dy),m=48;if(l>m){dx*=m/l;dy*=m/l;}kn.style.transform=`translate(${dx}px,${dy}px)`;joy.x=dx/m;joy.y=-dy/m;}
let drag=null;const cv=$('c');
cv.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};});
addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.id){yaw-=(e.clientX-drag.x)*.005;pitch=clamp(pitch+(e.clientY-drag.y)*.004,.05,1);drag.x=e.clientX;drag.y=e.clientY;dragT=performance.now();}});
addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.id)drag=null;});
function inputVec(){let fx=0,fz=0;if(keys.KeyW||keys.ArrowUp)fz++;if(keys.KeyS||keys.ArrowDown)fz--;if(keys.KeyD||keys.ArrowRight)fx++;if(keys.KeyA||keys.ArrowLeft)fx--;
 fx+=joy.x;fz+=joy.y;const l=Math.hypot(fx,fz);if(l>1){fx/=l;fz/=l;}return[fx,fz];}

/* ---------------- MAIN LOOP ---------------- */
function tick(now){requestAnimationFrame(tick);dt=Math.min(.05,(now-tick.last)/1000||.016);tick.last=now;time+=dt;
 // characters
 if(spin.on){
  spin.t+=dt;spin.k=damp(spin.k,spin.kT,3.2);const k=spin.k;spin.a+=dt*2.2*Math.min(1,spin.t);
  const g=ease(clamp((spin.t-1.2)/9,0,1)),cx=lerp(spin.x0,spin.xe,g),cz=lerp(spin.z0,spin.ze,g),off=lerp(spin.d0,.52,k);
  Mn.root.position.set(cx,0,cz);Mn.root.rotation.y=spin.a;Mn.s.sp=.55*k;Mn.s.lean=lerp(.35,-.1,k);Mn.s.crouch=lerp(.6,0,k);
  F.root.position.set(cx+Math.sin(spin.a)*off,.55*k+Math.sin(time*3)*.05*k,cz+Math.cos(spin.a)*off);F.root.rotation.y=spin.a+PI;F.s.sp=0;
 }else{
  let moved=false;
  if(st.canMove){const[fx,fz]=inputVec(),l=Math.hypot(fx,fz);
   if(l>.05){const sy=Math.sin(yaw),cy=Math.cos(yaw),dx=sy*fz-cy*fx,dz=cy*fz+sy*fx,n=Math.hypot(dx,dz)||1,p=F.root.position;
    p.x+=dx/n*3.4*Math.min(1,l)*dt;p.z+=dz/n*3.4*Math.min(1,l)*dt;collide(p);F.heading=Math.atan2(dx,dz);F.look=null;F.goal=null;
    F.s.sp=damp(F.s.sp,Math.min(1,l),10);F.root.rotation.y=dAng(F.root.rotation.y,F.heading,12);moved=true;}}
  if(!moved)step(F);
  step(Mn);
  F.root.position.y=st.hop?Math.abs(Math.sin(time*9))*.18:damp(F.root.position.y,0,10);
 }
 F.update();Mn.update();
 // camera
 const fp=F.root.position;
 if(camMode==='orbit'){const a=orb.sw?Math.sin(time*.25)*.9:time*.35;camPos.set(orb.c.x+Math.sin(a)*orb.r,2+Math.sin(time*.5)*.3,orb.c.z+Math.cos(a)*orb.r);camLook.set(orb.c.x,1.3,orb.c.z);camPos.x=clamp(camPos.x,-HW+.6,HW-.6);camPos.z=clamp(camPos.z,-HD+.6,HD-.6);camFov=55;}
 if(camMode==='follow'){
  if(st.focus&&performance.now()-dragT>1500)yaw+=wrapA(Math.atan2(st.focus.x-fp.x,st.focus.z-fp.z)-yaw)*(1-Math.exp(-1.2*dt));
  const d=innerWidth<700?5:4.3,cp=Math.cos(pitch);
  want.set(fp.x-Math.sin(yaw)*d*cp,1.45+Math.sin(pitch)*d+.2,fp.z-Math.cos(yaw)*d*cp);
  want.x=clamp(want.x,-HW+.5,HW-.5);want.z=clamp(want.z,-HD+.5,HD-.5);want.y=clamp(want.y,.5,WH-.6);
  camera.position.lerp(want,1-Math.exp(-9*dt));
  const tg=new T.Vector3(fp.x,1.45,fp.z);if(st.focus)tg.lerp(st.focus,.35);sLook.lerp(tg,1-Math.exp(-8*dt));
  const nf=damp(camera.fov,st.focus?48:60,3);if(Math.abs(nf-camera.fov)>.01){camera.fov=nf;camera.updateProjectionMatrix();}
 }else{const k=1-Math.exp(-2.2*dt);camera.position.lerp(camPos,k);sLook.lerp(camLook,k);const nf=damp(camera.fov,camFov,2.5);if(Math.abs(nf-camera.fov)>.01){camera.fov=nf;camera.updateProjectionMatrix();}}
 camera.lookAt(sLook);
 // mood / lights
 mood.b=damp(mood.b,mood.bT,1.6);mood.s=damp(mood.s,mood.sT,1.6);
 amb.intensity=.05+.6*mood.b;hemi.intensity=.03+.45*mood.b;chand.forEach(l=>l.intensity=1.1*mood.b);
 stripM.color.setRGB(1,.94,.78).multiplyScalar(.12+.88*Math.min(1,mood.b));bulbM.color.copy(stripM.color);
 P.forEach((p,i)=>{p.sp.intensity=3*mood.s*(i===st.cur?1.8:1);p.fm.emissiveIntensity=damp(p.fm.emissiveIntensity,i===st.cur&&st.focus?.8:0,4);});
 fs.intensity=damp(fs.intensity,fsT,2);
 // marker
 marker.visible=!!st.marker;if(st.marker){marker.position.x=st.marker.x;marker.position.z=st.marker.z;marker.scale.setScalar(1+Math.sin(time*3)*.12);}
 // particles
 for(let i=0;i<dust.n;i++){const j=i*3;dust.p[j+1]+=.08*dt;if(dust.p[j+1]>WH)dust.p[j+1]=0;dust.p[j]+=Math.sin(time*.4+i)*.1*dt;}dust.g.attributes.position.needsUpdate=true;
 if(hearts.o.visible){for(let i=0;i<hearts.n;i++){const j=i*3;hearts.p[j]=sparkC.x+Math.sin(i*12.9)*6+Math.sin(time+i)*.3;hearts.p[j+1]=((time*.35*(.6+(i%5)*.15)+i*.37)%1)*7;hearts.p[j+2]=sparkC.z+Math.cos(i*7.7)*4;}hearts.g.attributes.position.needsUpdate=true;}
 if(spark.o.visible){for(let i=0;i<spark.n;i++){const j=i*3,fr=(time*.6+i*.618)%1,a=i*2.399;spark.p[j]=sparkC.x+Math.cos(a)*sparkR*fr;spark.p[j+1]=sparkC.y+fr*sparkH+Math.sin(i*7)*.2;spark.p[j+2]=sparkC.z+Math.sin(a)*sparkR*fr;}spark.g.attributes.position.needsUpdate=true;}
 if(ring.visible){ring.getWorldPosition(sparkC);}
 // petals
 if(petalMode){for(let i=0;i<NP;i++){const p=pd[i];
  if(p.y<-40||p.y<.02){if(p.y<-40||petalMode===1){p.y=p.y<-40?7+Math.random()*14:7+Math.random()*3;const c=spin.on?Mn.root.position:{x:0,z:0};p.x=c.x+(Math.random()-.5)*14;p.z=c.z+(Math.random()-.5)*10;}else p.y=.02;}
  else{p.y-=p.v*dt;p.x+=Math.sin(time+p.ph)*.4*dt;p.z+=Math.cos(time*.8+p.ph)*.3*dt;}
  dm.position.set(p.x,Math.max(.02,p.y),p.z);dm.rotation.set(p.y<=.03?-PI/2:time*1.5+p.r,p.r+time*.7,p.ph);dm.updateMatrix();petals.setMatrixAt(i,dm.matrix);}
  petals.instanceMatrix.needsUpdate=true;if(petals.instanceColor)petals.instanceColor.needsUpdate=true;}
 if(flowers.visible){st.flowT=Math.min(1,st.flowT+dt/2.5);flowers.scale.setScalar(Math.max(.001,ease(st.flowT)));}
 renderer.render(scene,camera);}
tick.last=performance.now();

/* ---------------- UI HELPERS ---------------- */
let typeTok=0;
async function say(name,text,hold=1400){const tok=++typeTok,el=$('dtext');$('dname').textContent=name;$('dlg').classList.add('show');el.textContent='';
 if(name==='Hanzallah')Mn.s.talk=true;const ch=Array.from(text);
 for(let i=1;i<=ch.length;i++){if(tok!==typeTok)return;el.textContent=ch.slice(0,i).join('');await sleep(28);}
 await sleep(hold);if(tok===typeTok)Mn.s.talk=false;}
const hideDlg=()=>{typeTok++;Mn.s.talk=false;$('dlg').classList.remove('show');};
async function big(t,hold=2200,keep=false){const e=$('big');e.classList.remove('show');e.innerHTML=t;void e.offsetWidth;e.classList.add('show');await sleep(hold);if(!keep){e.classList.remove('show');await sleep(800);}}
const hint=t=>$('hint').textContent=t;
function showCap(t){const c=$('caption');c.textContent=t;c.classList.add('show');}const hideCap=()=>$('caption').classList.remove('show');
function ask(msg,labels){return new Promise(res=>{const c=$('choices');c.innerHTML='';
 if(msg){const p=document.createElement('div');p.className='popup';p.textContent=msg;c.appendChild(p);}
 const row=document.createElement('div');row.className='row';
 labels.forEach((l,i)=>{const b=document.createElement('button');b.className='btn '+(i?'no':'yes');b.textContent=l;b.onclick=()=>{c.classList.remove('show');setTimeout(()=>res(i),400);};row.appendChild(b);});
 c.appendChild(row);c.classList.add('show');});}
async function popup(msg,ms){const c=$('choices');c.innerHTML='';const p=document.createElement('div');p.className='popup';p.textContent=msg;c.appendChild(p);c.classList.add('show');await sleep(ms);c.classList.remove('show');await sleep(500);}
const fade=on=>{$('fade').style.opacity=on?1:0;return sleep(1800);};

/* ---------------- STORY ---------------- */
function resetWorld(){
 F.root.position.set(-17.5,0,0);F.heading=F.root.rotation.y=PI/2;Mn.root.position.set(-7,0,0);Mn.heading=Mn.root.rotation.y=-PI/2;
 for(const c of[F,Mn]){c.goal=null;c.look=null;Object.assign(c.s,{sp:0,kneel:0,crouch:0,lean:0,hang:false,splay:0,arms:null,talk:false});}
 ring.visible=false;spin.on=false;spin.t=0;spin.a=0;spin.k=0;spin.kT=1;st.hop=false;st.focus=null;st.marker=null;st.cur=-1;st.canMove=false;st.flowT=0;
 petalMode=0;pd.forEach(p=>p.y=-50);for(let i=0;i<NP;i++){dm.position.set(0,-50,0);dm.updateMatrix();petals.setMatrixAt(i,dm.matrix);}petals.instanceMatrix.needsUpdate=true;
 hearts.o.visible=false;spark.o.visible=false;flowers.visible=false;flowers.scale.setScalar(.001);
 setMood(1,0);fsT=0;camMode='follow';yaw=PI/2;pitch=.32;camera.fov=60;camera.updateProjectionMatrix();Aud.set(.5,1);
 ['big','dlg','caption','choices'].forEach(i=>$(i).classList.remove('show'));$('replay').classList.add('hidden');}
const SIDE={x:0,z:8};
async function run(){
 resetWorld();$('hud').classList.remove('hidden');await fade(false);
 hint('Walk with W A S D / arrow keys / joystick · drag to look around');st.canMove=true;
 await say('Hanzallah','Hey beautiful, come with me. I have something to show you. ❤️',1200);
 if(SKIP){F.root.position.set(-14,0,5);Mn.root.position.set(-11.6,0,5);}
 else{await until(()=>dist(F.root.position,Mn.root.position)<2.8);
  st.canMove=false;hint('');F.look=Mn.root.position;Mn.look=F.root.position;pairCam(3.4,1.4,50);
  await say('Hanzallah',"Finally, you're here. I've been waiting for you.",1400);
  await say('Hanzallah','Do you remember these moments?',1200);hideDlg();
  camMode='follow';setMood(.28,1);await sleep(1600);st.canMove=true;F.look=null;Mn.look=null;
  for(let i=0;i<P.length;i++){const p=P[i];st.cur=i;st.marker=p.stand;st.focus=null;
   hint(i?'Follow Hanzallah to the next memory →':'Walk to the glowing circle to see our first memory');
   walkTo(Mn,p.mx,p.mz).then(()=>{Mn.look=p.face;});
   await until(()=>dist(F.root.position,p.stand)<2.6);
   st.focus=p.center;st.marker=null;showCap(p.caption);Mn.look=F.root.position;hint('');
   await sleep(4200);hideCap();st.focus=null;await sleep(600);}}
 st.canMove=false;st.marker=null;st.cur=-1;hideCap();hint('');
 await say('Hanzallah',"There's just one last thing I want to show you...",2200);hideDlg();
 setMood(.02,0);Aud.set(.28,.8);
 const fp=F.root.position;let dx=Mn.root.position.x-fp.x,dz=Mn.root.position.z-fp.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
 await walkTo(Mn,fp.x+dx*1.25,fp.z+dz*1.25);Mn.look=fp;F.look=Mn.root.position;
 const mid=new T.Vector3((fp.x+Mn.root.position.x)/2,0,(fp.z+Mn.root.position.z)/2);fs.position.set(mid.x,7.6,mid.z);fs.target.position.copy(mid);fsT=5;
 pairCam(3.8,1.4,46);await sleep(1800);
 await big('Yvone, every picture tells a story...',2800);await sleep(2000);
 await big('...but my favourite story is the one I am living with you.',3600);await sleep(600);
 await big('Every memory with you means more than words can explain.',3600);
 await big('And I don\'t want this beautiful story to ever end.',3600);
 // proposal
 pairCam(2.8,1.0,40);Mn.s.kneel=1;Mn.s.arms=POSE.offer;await sleep(1700);
 ring.visible=true;spark.o.visible=true;sparkR=.45;sparkH=.5;pairCam(2.3,.95,36);await sleep(1500);
 await big('Yvone...',1800);await big('Will you make me the happiest man in this world?',3200);
 await big('Will you marry me? ❤️',1000,true);
 const NO=['Are you sure, my love? 🥺','Please think again, my love. 🥺❤️','Again? After all these memories? 🥺','Yvone, please say yes. You know how much I love you. 🥺'];
 let n=0,r=await ask('',['YES, I WILL ❤️','NO 🥺']);
 while(r===1){
  if(n<4){Mn.s.arms={...POSE.offer,rx:-1.5+(n+1)*.12};r=await ask(NO[n],['YES ❤️','NO']);n++;}
  else{await popup('Okay, now you\'re just breaking my heart. 😭❤️',2000);await ask('One last time... please? 🥺',['YES, I WILL ❤️']);r=0;}}
 await yes();}

async function yes(){
 $('big').classList.remove('show');
 Aud.set(.7,1.4);setMood(1.5,.8);fsT=0;hearts.o.visible=true;petalMode=1;
 const texts=(async()=>{await big('SHE SAID YES!!! ❤️',2600);await big('MY FOREVER PERSON. ❤️',2600);
  await big('Yvone, I choose you today, tomorrow, and every day after that.',4000);await big('Thank you for being my favourite part of this life.<br>I love you. ❤️',4200);})();
 Mn.s.kneel=0;Mn.s.arms=POSE.show;F.s.arms=POSE.happy;st.hop=true;sparkR=3;sparkH=3;pairCam(4.2,1.5,55);await sleep(2000);
 ring.visible=false;Mn.s.arms=null;sparkC.copy(Mn.root.position);sparkC.y=.5;
 st.hop=false;F.s.arms=POSE.neck;F.look=Mn.root.position;Mn.look=F.root.position;
 const a=F.root.position,b=Mn.root.position,l=Math.hypot(a.x-b.x,a.z-b.z)||1;
 await walkTo(Mn,b.x+(a.x-b.x)/l*(l-.95),b.z+(a.z-b.z)/l*(l-.95));
 Mn.look=F.root.position;await sleep(700);
 Mn.s.crouch=.6;Mn.s.lean=.35;Mn.s.arms=POSE.hug;await sleep(900);
 const d=Math.hypot(a.x-b.x,a.z-b.z);Object.assign(spin,{on:true,t:0,k:0,kT:1,a:Mn.root.rotation.y,x0:b.x,z0:b.z,xe:0,ze:0,d0:d});
 F.s.hang=true;F.s.splay=.3;orb.c=Mn.root.position;orb.r=5.2;orb.sw=false;camMode='orbit';
 await texts;
 spin.kT=0;await sleep(1500);spin.on=false;F.root.position.y=0;
 Object.assign(F.s,{hang:false,splay:0,arms:null});Object.assign(Mn.s,{crouch:0,lean:0,arms:null,sp:0});
 F.look=Mn.look=SIDE;Mn.root.position.y=0;
 walkTo(Mn,-.6,0);walkTo(F,.6,0);
 flowers.visible=true;st.flowT=0;sparkC.set(0,.3,0);sparkR=4;sparkH=4;Aud.set(.45,1);
 orb.c=new T.Vector3(0,0,0);orb.r=5.4;orb.sw=true;
 await sleep(2500);
 await big('OUR STORY DOESN\'T END HERE...',2800);await big('IT\'S ONLY THE BEGINNING. ❤️',1000,true);
 $('replay').classList.remove('hidden');}

$('replay').onclick=async()=>{$('replay').classList.add('hidden');$('big').classList.remove('show');await fade(true);$('hud').classList.add('hidden');resetWorld();showIntro();};

/* ---------------- INTRO / LOADING ---------------- */
async function showIntro(){
 const it=$('intro');it.classList.remove('hidden');it.style.opacity=1;const a=$('i1'),b=$('i2'),s=$('startBtn');
 a.classList.remove('on');b.classList.remove('on');s.classList.add('hidden');a.textContent='Something special has been waiting for you...';b.textContent='Welcome to a little world made just for us, Yvone ❤️';
 await sleep(600);a.classList.add('on');await sleep(3000);b.classList.add('on');await sleep(2400);s.classList.remove('hidden');}
$('startBtn').onclick=async()=>{Aud.start();Aud.set(.5,1);const it=$('intro');it.style.opacity=0;await sleep(1200);it.classList.add('hidden');run();};
$('music').onclick=()=>{$('music').textContent=Aud.toggle()?'🔊':'🔇';};
(async()=>{
 requestAnimationFrame(tick);
 if(location.protocol==='file:'){$('lderr').textContent='Please open this through a local server (see README) – browsers block photo textures from file:// pages.';return;}
 let done=0;const L=new T.TextureLoader(),ld=$('loading');
 try{
  const texs=await Promise.all(PH.map(c=>new Promise((res,rej)=>L.load('assets/photos/'+c.file,t=>{t.encoding=T.sRGBEncoding;t.anisotropy=renderer.capabilities.getMaxAnisotropy();$('barfill').style.width=(++done/PH.length*100)+'%';res(t);},undefined,()=>rej(c.file)))));
  buildPhotos(texs);
 }catch(f){$('lderr').textContent='Could not load photo "'+f+'". Check that it is inside assets/photos/ and matches photos.js.';return;}
 resetWorld();ld.style.opacity=0;await sleep(1200);ld.classList.add('hidden');showIntro();
})();
})();
