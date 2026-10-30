// The workshop is authored in model coordinates; the header and clue collection
// stay in screen coordinates so touch targets remain useful in either orientation.
(function () {
  'use strict';
  const S = window.SCENE = { state: null, cameraX: 960, REPEAT: [], NEAREST: [] }, L = LIB, M = L.M;
  const C = { paper:[1,.969,.878], cream:[1,.984,.925], teal:[.098,.42,.45], mint:[.70,.90,.83], gold:[1,.76,.24], darkGold:[.73,.42,.12] };
  const FONT = 'Nunito, "Trebuchet MS", sans-serif';
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth = (v)=>{v=clamp(v,0,1);return v*v*(3-2*v);};
  const inBox = (x,y,r)=>x>=r.x&&y>=r.y&&x<=r.x+r.w&&y<=r.y+r.h;
  const centre = (r)=>({px:r.x+r.w/2,py:r.y+r.h/2});
  const view = ()=>window.ISKRA_VIEW || SIM.VIEW;
  const state = ()=>S.state || SIM.at(0);
  const UI_ALPHA = 1;
  const HINT_VEIL = `uniform vec2 u_at; uniform float u_r,u_a;
void main(){ float d=length(v_px-u_at);float a=smoothstep(u_r*.8,u_r*1.85,d)*u_a;o=vec4(vec3(.035,.12,.13)*a,a); }`;

  S.programs = () => {
    const v=view(); L.init(v.W,v.H,{hintveil:HINT_VEIL});
    const chars=[...new Set('0123456789/+ —!.,:АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя')].join('');
    L.glyphs(chars,{size:66,font:FONT,stroke:'#1a5962',fill:['#fffef1','#fff4bc','#f3c35c']});
  };
  S.layout = (ST=state()) => {
    const {W,H}=view(),portrait=H>W,narrow=H/W>1.7,footerH=portrait?(narrow&&SIM.layout(ST).targets.length>8?370:260):144,headerH=portrait?128:96;
    const scale=Math.max(W/SIM.WORLD.W,H/SIM.WORLD.H),originX=portrait?0:(W-SIM.WORLD.W*scale)/2,originY=(H-SIM.WORLD.H*scale)/2;
    return {W,H,portrait,narrow,footerH,headerH,footerY:H-footerH,room:{x:0,y:0,w:W,h:H},frame:{x:0,y:0,w:W,h:H},
      scale,originX,originY,camMin:960,camMax:960,camera:960,
      title:{x:16,y:12,w:portrait?590:740,h:portrait?100:72},
      hint:portrait?{x:W-320,y:16,w:288,h:88}:{x:W-270,y:12,w:244,h:72},
      restart:portrait?{x:W-432,y:16,w:96,h:88}:{x:W-470,y:12,w:174,h:72},
      count:{x:W-696,y:12,w:200,h:72},
      fullscreen:portrait?{x:W-138,y:136,w:112,h:112}:{x:W-820,y:12,w:96,h:72}};
  };
  const expanded=(r,n)=>({x:r.x-(Math.max(n,r.w)-r.w)/2,y:r.y-(Math.max(n,r.h)-r.h)/2,w:Math.max(n,r.w),h:Math.max(n,r.h)});
  const GF=[0,1,2,5,6,7,8,9,10,11],orders=[[0,1,6,7,2,5,8,9,3,4],[5,0,1,6,9,3,4,2,7,8],[2,7,9,0,4,6,1,8,5,3]];
  S.itemPlacements = (ST=state()) => {
    const a=S.layout(ST),src=SIM.SOURCE.scale;
    const ground=a.portrait?[[85,259],[215,274],[65,503],[276,503],[170,503],[.56,690],[.76,710],[.91,710],[.56,830],[.83,830]]:
      [[65,503],[276,503],[166,599],[1250,507],[1382,634],[1380,507],[520,722],[740,758],[930,758],[1110,740]];
    return SIM.items(ST).map(item=>{
      let sx,sy,slot=-1,hanging=item.face===3||item.face===4;
      if(hanging){sx=item.face===3?(a.portrait?.55:440):(a.portrait?.82:1000);sy=item.face===3?328:(a.portrait?385:300);}
      else {slot=orders[ST.level][GF.indexOf(item.face)];[sx,sy]=ground[slot];}
      let x=a.portrait&&sx<1?sx*a.W:a.originX+sx*src*a.scale;
      let y=a.originY+sy*src*a.scale;
      const maxW=a.portrait?(slot>=2&&slot<=4?130:154):(slot===2?120:150),maxH=a.portrait?166:(slot===2?124:150);
      const artScale=Math.min(a.scale,maxW/item.w,maxH/item.h),w=item.w*artScale,h=item.h*artScale;
      if(!hanging)y-=(SIM.ALPHA[item.face][3]/SIM.RECTS[item.face][3]-.5)*h;
      const p={item,x,y,w,h,rot:0,slot,hanging,contact:hanging?null:{x,y:a.originY+sy*src*a.scale},
        cord:hanging?{from:[x,a.headerH+14],to:[x,y-h*.46]}:null};
      p.hit=expanded({x:x-w/2,y:y-h/2,w,h},a.portrait?122:104);
      // Short Windows windows retain every toy below controls and above clues.
      // These bounded shifts affect only positions that would leave that area.
      const nextY=clamp(p.y,a.headerH+12+p.hit.h/2,a.footerY-12-p.hit.h/2),dy=nextY-p.y;
      p.y=nextY;p.hit.y+=dy;if(p.contact)p.contact.y+=dy;if(p.cord)p.cord.to[1]+=dy;
      const g=S.guide(ST).box;
      if(p.hit.x<g[0]+g[2]&&p.hit.x+p.hit.w>g[0]&&p.hit.y<g[1]+g[3]&&p.hit.y+p.hit.h>g[1]){
        const nextX=clamp(g[0]+g[2]+12+p.hit.w/2,p.hit.w/2+12,a.W-p.hit.w/2-12),dx=nextX-p.x;
        p.x=nextX;p.hit.x+=dx;if(p.contact)p.contact.x+=dx;if(p.cord){p.cord.from[0]+=dx;p.cord.to[0]+=dx;}
      }
      return p;
    });
  };
  S.toScreen = (x,y,ST=state()) => {
    const p=S.itemPlacements(ST).find(p=>Math.abs(p.item.x-x)<.001&&Math.abs(p.item.y-y)<.001);
    if(p)return [p.x,p.y];const a=S.layout();return [a.originX+x*a.scale,a.originY+y*a.scale];
  };
  S.guide = (ST=state()) => {
    const a=S.layout(ST),height=a.H*.26,scale=height/380,x=24+height*.47,y=a.footerY-20;
    return {x,y,scale,box:[16,y-height*1.04,height*.80,height*1.08],height};
  };
  S.clues = (ST=state()) => {
    const a=S.layout(ST),target=SIM.layout(ST).targets,cols=a.portrait?(a.narrow?4:target.length>8?6:4):target.length;
    const gap=12,available=a.W-64,maxW=a.portrait?236:176;
    const w=Math.min(maxW,(available-gap*(cols-1))/cols),h=a.portrait?110:112;
    const nrows=Math.ceil(target.length/cols),top=a.footerY+(a.narrow?8:12),out=[];
    for(let i=0;i<target.length;i++) {
      const row=Math.floor(i/cols),n=Math.min(cols,target.length-row*cols),rowW=n*w+(n-1)*gap;
      const r={face:target[i],item:SIM.items(ST).find((o)=>o.face===target[i]),x:(a.W-rowW)/2+(i%cols)*(w+gap),y:top+row*(h+12),w,h,row,nrows};
      r.hit=expanded(r,a.portrait?122:104);out.push(r);
    }
    return out;
  };
  S.winButtons = () => {
    const a=S.layout(),w=a.portrait?400:360,h=96,gap=40,y=a.H/2+(a.portrait?200:174);
    return {replay:{x:a.W/2-gap/2-w,y,w,h},next:{x:a.W/2+gap/2,y,w,h}};
  };
  S.mapPointer = (x,y) => {
    const a=S.layout(),ST=state();
    if(ST.mode==='win') {
      const b=S.winButtons();for(const key of ['replay','next'])if(inBox(x,y,expanded(b[key],a.portrait?122:104)))return Object.assign(centre(SIM.UI[key]),{hud:key});
      return {blocked:true};
    }
    if(inBox(x,y,expanded(a.fullscreen,a.portrait?122:104)))return {fullscreen:true};
    for(const key of ['hint','restart'])if(inBox(x,y,expanded(a[key],a.portrait?122:104)))return Object.assign(centre(SIM.UI[key]),{hud:key});
    const clue=S.clues(ST).find((r)=>inBox(x,y,r.hit));
    if(clue) {const model=SIM.clueSlots(ST).find((r)=>r.face===clue.face);return Object.assign(centre(model),{hud:'clue',face:clue.face});}
    const guide=S.guide();if(inBox(x,y,{x:guide.box[0],y:guide.box[1],w:guide.box[2],h:guide.box[3]}))return {blocked:true,guide:true};
    const item=S.itemPlacements(ST).slice().reverse().find(p=>!SIM.isFound(ST,p.item)&&inBox(x,y,p.hit));
    if(item)return {px:item.item.x,py:item.item.y,room:true,item:item.item.id};
    return {blocked:true,room:true};
  };
  const labels={};let measure=null;
  function text(slot,str,x,y,maxW,size=30,opts={}) {
    measure=measure||document.createElement('canvas').getContext('2d');
    const weight=opts.weight||'900',col=opts.col||'#195961',al=opts.al===undefined?.5:opts.al;
    measure.font=weight+' '+size+'px '+FONT;let width=measure.measureText(str).width;
    if(width>maxW){size*=maxW/width;width=maxW;}
    const key=[str,size,col,weight].join('|');let r=labels[slot];
    if(!r||r.key!==key){
      const cv=document.createElement('canvas');cv.width=Math.ceil(width)+12;cv.height=Math.ceil(size*1.5)+12;
      const g=cv.getContext('2d');g.font=weight+' '+size+'px '+FONT;g.textBaseline='middle';g.fillStyle=col;g.fillText(str,6,cv.height/2);
      if(r)G.gl.deleteTexture(r.rec.t);
      r=labels[slot]={key,rec:G.canvasTex('ui_'+slot,cv),w:cv.width,h:cv.height};
    }
    const left=x-width*al;L.sprite('ui_'+slot,left-6,y-r.h/2,{w:r.w,h:r.h});
    L.uiText(slot,str,left,y-size*.62,width,size*1.24);return width;
  }
  function panel(id,r,col=C.cream,shadow=true,pad=10) {
    if(shadow)L.rrect(r.x,r.y+7,r.w,r.h,28,[.11,.29,.29],[.11,.29,.29],.18);
    L.rrect(r.x,r.y,r.w,r.h,28,col,col,id==='win_panel'?.96:.80); L.uiBox(id,r.x,r.y,r.w,r.h,pad);
  }
  function button(id,r,label,{gold=false,quiet=false,sub='',disabled=false,size=31}={}) {
    const base=gold?C.darkGold:quiet?[.42,.63,.61]:[.17,.52,.51];
    L.rrect(r.x,r.y+5,r.w,r.h,22,base,base,disabled?.28:.52);
    L.rrect(r.x,r.y,r.w,r.h-2,22,gold?[1,.85,.40]:quiet?[1,.99,.91]:[.73,.94,.85],gold?[1,.73,.22]:quiet?[.95,.93,.79]:[.48,.80,.72],disabled?.64:.82);
    L.rrect(r.x+8,r.y+7,r.w-16,6,3,[1,1,.91],[1,1,.91],.65);
    L.uiBox(id,r.x,r.y,r.w,r.h,12);
    if(label)text(id+'_text',label,r.x+r.w/2,r.y+r.h*(sub?.40:.51),r.w-28,size,{col:gold?'#684316':'#195961'});
    if(sub)text(id+'_sub',sub,r.x+r.w/2,r.y+r.h*.76,r.w-28,18,{weight:'800',col:'#486555'});
  }
  function check(x,y,r=17,a=1) {
    L.rrect(x-r,y-r,2*r,2*r,r,[.15,.55,.39],[.13,.46,.34],a);
    L.solid(x-r*.44,y-r*.04,r*.56,r*.19,[1,1,.90],.78,0,0,a);
    L.solid(x-r*.12,y+r*.27,r*.98,r*.19,[1,1,.90],-.81,0,0,a);
  }
  function arrow(x,y,dir=1,size=27) {
    const line=(x1,y1,x2,y2)=>L.solid(x1,y1,Math.hypot(x2-x1,y2-y1),6,C.teal,Math.atan2(y2-y1,x2-x1),0,3);
    line(x-dir*size*.32,y-size*.62,x+dir*size*.32,y);
    line(x+dir*size*.32,y,x-dir*size*.32,y+size*.62);
  }
  function restartIcon(r) {
    const x=r.x+r.w/2,y=r.y+r.h/2;
    L.ring(x,y,25,25,C.teal,1,.16);
    L.rrect(x-32,y-29,30,24,0,C.cream,C.cream,1);
    L.solid(x-28,y-23,25,7,C.teal,.2);
    L.solid(x-28,y-23,22,7,C.teal,1.65);
  }
  function toy(face,x,y,w,h,rot=0,alpha=1,opts={}) {
    const r=SIM.FACES[face].rect,tx=G.tex('toys'),src=[r[0]/tx.w,r[1]/tx.h,(r[0]+r[2])/tx.w,(r[1]+r[3])/tx.h];
    L.sprite('toys',0,0,{m:M.of(M.t(x,y),M.r(rot)),pivot:[w/2,h/2],w,h,src,u:Object.assign({alpha},opts)});
  }
  function clipRoom(a,on) {
    const gl=G.gl;
    if(on){gl.enable(gl.SCISSOR_TEST);gl.scissor(Math.floor(a.room.x),Math.floor(a.H-a.room.y-a.room.h),Math.ceil(a.room.w),Math.ceil(a.room.h));}
    else gl.disable(gl.SCISSOR_TEST);
  }
  function drawRoom(ST,t,a) {
    const R=a.room,k=a.scale;
    clipRoom(a,true);
    L.sprite('workshop',a.originX,a.originY,{w:SIM.WORLD.W*k,h:SIM.WORLD.H*k});
    clipRoom(a,false);
    L.beginComp();clipRoom(a,true);
    for(const p of S.itemPlacements(ST)) {
      const o=p.item;
      if(SIM.isFound(ST,o))continue;
      const {x,y}=p,hv=ST.hov[o.id]?ST.hov[o.id][0]:0,scale=1+hv*.065;
      const last=(ST.ev||[]).slice().reverse().find((e)=>e.k==='distractor'&&e.id===o.id),age=last?ST.t-last.t:99;
      const wobble=age<.55?.045*Math.sin(age*25)*Math.exp(-age*7):0;
      if(p.contact)L.shadow(p.contact.x,p.contact.y+2,p.w*.32,5,.28);
      if(p.cord) {
        const u=p.cord.from,q=p.cord.to;
        L.solid(u[0]-1,u[1],2,Math.max(0,q[1]-u[1]),[.45,.28,.14]);
        L.rrect(u[0]-3,u[1]-3,6,6,3,[.98,.79,.41]);
      }
      toy(o.face,x,y-hv*4,p.w*scale,p.h*scale,p.rot+wobble);
    }
    const hinted=ST.hint&&ST.hint.until>ST.t&&S.itemPlacements(ST).find((p)=>p.item.id===ST.hint.id&&!SIM.isFound(ST,p.item));
    if(hinted) {
      const {x,y}=hinted,fade=Math.min(1,(ST.hint.until-ST.t)*3),r=Math.max(hinted.w,hinted.h)*.85;
      G.draw(L.P.hintveil,{u_at:[x,y],u_r:r,u_a:.42*fade},G.xf(R.x,R.y,R.w,R.h));
      L.glow(x,y,r*1.9,[1,.81,.32],.20*fade,3.5);
      L.ring(x,y,r*(1+.04*Math.sin(ST.t*4)),r*(1+.04*Math.sin(ST.t*4)),[1,.86,.32],.94*fade,.047);
      L.ring(x,y,r*1.10,r*1.10,[1,1,.80],.64*fade,.022);
      toy(hinted.item.face,x,y,hinted.w,hinted.h,hinted.rot);
      for(let j=0;j<4;j++){const ang=j*Math.PI/2+.18*Math.sin(ST.t*1.7);L.star(x+Math.cos(ang)*r*1.12,y+Math.sin(ang)*r*1.12,10*k,[1,.94,.59],fade*.9);}
    }
    for(const e of ST.ev||[]) {
      const age=ST.t-e.t;if(age<0)continue;const [x,y]=S.toScreen(e.x||0,e.y||0,ST);
      if(e.k==='find'&&age<.85) {
        const q=age/.85;
        for(let j=0;j<10;j++) {const ang=j*Math.PI*.2+e.face*.73,r=(16+62*smooth(q))*k;L.star(x+Math.cos(ang)*r,y+Math.sin(ang)*r-30*k*q,7*k*(1-q)+3,[1,.93,.55],(1-q)*.9);}
        L.ring(x,y,(22+54*q)*k,(22+54*q)*k,[1,.94,.64],(1-q)*.75,.05);
      }
      if((e.k==='tap'||e.k==='distractor')&&age<.45){const q=age/.45;L.ring(x,y,(10+25*q)*k,(10+25*q)*k,[1,.97,.79],(1-q)*.6,.08);}
    }
    if(window.ISKRA_RIG) {
      const p=S.guide(),gaze=S.toScreen(ST.x,ST.y,ST),rigState=Object.assign({},ST,{rigTarget:gaze});
      L.shadow(p.x,p.y+3*k,84*k,16*k,.30);window.ISKRA_RIG.draw(rigState,ST.t,p.x,p.y,p.scale);
    }
    clipRoom(a,false);
    // The supplied room already contains its finished light and colour grade.
    // A single copy preserves that artwork and avoids six unused bloom passes.
    G.bind(null);G.blend('none');G.full(L.P.copy,{u_src:L.T.comp});G.blend();
  }
  function drawHeader(ST,a) {
    panel('header_title',a.title,C.paper,false,12);
    text('title',a.portrait?'Найди игрушки':'Мастерская находок',32,a.portrait?43:37,a.title.w-32,a.portrait?35:37,{al:0});
    text('level_title',a.portrait?'Уровень '+(ST.level+1)+'  ·  Найдено '+ST.count+' / '+ST.total:'Уровень '+(ST.level+1)+'  ·  '+SIM.layout(ST).name,32,a.portrait?83:68,a.title.w-32,a.narrow?34:a.portrait?25:20,{al:0,col:'#35695f',weight:'800'});
    if(!a.portrait) {
      panel('count_panel',a.count,[.88,.94,.82],false,8);
      text('count_label','НАЙДЕНО',a.count.x+a.count.w/2,a.count.y+19,a.count.w-24,17,{col:'#35695f'});
      text('count_value',ST.count+' / '+ST.total,a.count.x+a.count.w/2,a.count.y+49,a.count.w-24,31);
    }
    const remain=SIM.hintRemaining(ST);
    button('hint_button',a.hint,'Подсказка',{gold:true,sub:remain>0?'Через '+Math.ceil(remain)+' с':'',disabled:remain>0,size:a.portrait?30:28});
    button('restart_button',a.restart,a.portrait?'':'Заново',{quiet:true,size:27});if(a.portrait)restartIcon(a.restart);
    panel('fullscreen_button',a.fullscreen,C.paper,false,8);
    const f=a.fullscreen,cx=f.x+f.w/2,cy=f.y+f.h/2,r=20;
    for(const dx of [-1,1])for(const dy of [-1,1]){
      const xx=cx+dx*r,yy=cy+dy*r;L.solid(dx<0?xx:xx-12,yy,16,4,C.teal);L.solid(xx,dy<0?yy:yy-12,4,16,C.teal);
    }
  }
  function drawClues(ST,a) {
    const tray={x:16,y:a.footerY+4,w:a.W-32,h:a.footerH-12};panel('clue_tray',tray,C.paper,false,8);
    for(const [i,r] of S.clues(ST).entries()) {
      const got=SIM.isFound(ST,r.item),selected=!got&&ST.focus===r.face;
      L.rrect(r.x,r.y+4,r.w,r.h,22,[.61,.67,.53],[.61,.67,.53],.25);
      L.rrect(r.x-2,r.y-2,r.w+4,r.h+4,20,selected?C.gold:got?[.39,.72,.58]:[.90,.84,.65],selected?C.gold:got?[.39,.72,.58]:[.90,.84,.65],.78);
      L.rrect(r.x,r.y,r.w,r.h,18,got?[.83,.94,.79]:C.cream,got?[.75,.89,.72]:[1,.96,.84],.72);
      L.uiBox('clue_'+i,r.x,r.y,r.w,r.h,6);
      const maxH=a.narrow?54:70,maxW=r.w-30,rect=SIM.FACES[r.face].rect,scale=Math.min(maxW/rect[2],maxH/rect[3]);
      toy(r.face,r.x+r.w/2,r.y+(a.narrow?31:39),rect[2]*scale,rect[3]*scale,0,got?.87:1);
      text('clue_name_'+i,SIM.FACES[r.face].name,r.x+r.w/2,r.y+r.h-(a.narrow?26:18),r.w-14,a.narrow?34:a.portrait?22:21,{col:got?'#3b7252':'#245b60'});
      if(got)check(r.x+r.w-18,r.y+17,14);
    }
  }
  function drawFlights(ST) {
    if(ST.mode==='win')return;
    for(const o of SIM.items(ST)) {
      if(!SIM.isFound(ST,o))continue;const age=ST.t-ST.found[o.id];if(age<0||age>.8)continue;
      const q=smooth(age/.8),p=S.toScreen(o.x,o.y,ST),slot=S.clues(ST).find((r)=>r.face===o.face);if(!slot)continue;
      const tx=slot.x+slot.w/2,ty=slot.y+44,x=p[0]+(tx-p[0])*q,y=p[1]+(ty-p[1])*q-Math.sin(q*Math.PI)*110;
      const placed=S.itemPlacements(ST).find(p=>p.item.id===o.id),w=placed.w+(74-placed.w)*q,h=placed.h+(74-placed.h)*q;
      toy(o.face,x,y,w,h,o.rot*(1-q),1-.2*q);
    }
  }
  function drawWin(ST,a) {
    L.solid(0,0,a.W,a.H,[.04,.19,.21],0,0,0,.62);
    const r={x:a.W/2-(a.portrait?480:540),y:a.H/2-(a.portrait?330:280),w:a.portrait?960:1080,h:a.portrait?660:560};
    panel('win_panel',r,C.cream,true,24);
    L.rrect(r.x+16,r.y+16,r.w-32,11,5,C.gold,C.gold);
    toy(10,a.W/2,r.y+107,110,90,0);
    text('win_title','Все игрушки найдены!',a.W/2,r.y+205,r.w-100,56,{col:'#1c6261'});
    text('win_subtitle',SIM.layout(ST).name,a.W/2,r.y+266,r.w-100,31,{col:'#61836d',weight:'800'});
    text('win_count',ST.count+' из '+ST.total+'  —  отлично!',a.W/2,r.y+331,r.w-100,40,{col:'#926219'});
    const b=S.winButtons();button('win_replay',b.replay,'Ещё раз',{quiet:true,size:33});
    button('win_next',b.next,ST.level<2?'Следующий уровень':'Играть сначала',{gold:true,size:ST.level<2?29:31});
    const age=ST.wonAt>=0?ST.t-ST.wonAt:99;
    if(age<2.4)for(let i=0;i<36;i++) {
      const u=age/2.4,seed=L.rnd(i,2),x=a.W/2+(seed-.5)*r.w*1.2*(.2+u),y=r.y+130+(L.rnd(i,7)-.5)*220-age*95+age*age*68;
      const size=5+L.rnd(i,11)*8;L.solid(x,y,size,size*.55,i%2?C.gold:C.mint,age*2+i,0,0,(1-u)*.9);
    }
  }
  S.render = (t) => {
    const ST=S.state||SIM.at(t),a=S.layout();L.beginBG([...C.paper,1]);
    drawRoom(ST,t,a);drawHeader(ST,a);drawClues(ST,a);drawFlights(ST);
    if(ST.mode==='win')drawWin(ST,a);
  };
  S.QA = () => {
    const names=['match','play','finds','hint','cooldown','level2','level3','win','win12','drag'];
    const states=names.map((n)=>[n,SIM.namedState(n)]),base=SIM.namedState('play');
    const loop=window.ISKRA_RIG?window.ISKRA_RIG.qaLoop(base):[];
    return {states,cycles:{},loops:loop.length?{iskra_idle:loop}:{},subject:{iskra_idle:'iskra'},actors:loop.length?['iskra']:[],
      sprites:{iskra_idle:window.ISKRA_RIG?window.ISKRA_RIG.textures:[]},
      box:()=>S.guide().box};
  };
})();
