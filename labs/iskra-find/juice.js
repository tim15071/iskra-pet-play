// Painted effect shapes, authored in code as finite event responses.
// All sampling is deterministic; rendering never mutates the simulation.
(function (root) {
  'use strict';
  const TAU=Math.PI*2, BUDGET={ambient:6,world:88,care:16,win:40};
  const FRAME_NAMES=['star_gold','glint','feather_blue','petal_pink','leaf_green','heart_warm','cloud_puff','ribbon_teal','ribbon_gold','seed_spark','dew_drop','confetti_pink'];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const smooth=n=>{n=clamp(n,0,1);return n*n*(3-2*n);};
  const finite=(n,f=0)=>Number.isFinite(n)?n:f;
  const mix=(a,b,q)=>a+(b-a)*q;
  const rnd=(a,b)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v);};
  const pulse=q=>smooth(q/.10)*(1-smooth((q-.35)/.65));
  const wind=(t,x)=>6*Math.sin(t*.7+x*.0013)+3.5*Math.sin(t*1.17+x*.002+1.2);
  const point=p=>Array.isArray(p)?{x:p[0],y:p[1]}:p;
  const garden=ST=>root.SIM&&typeof root.SIM.room==='function'?root.SIM.room(ST).id==='garden':ST.level>=6;
  const enabled=(ST,ctx)=>!ST.juiceDisabled&&!ctx.disabled&&!(root.LIB&&root.LIB.NOFX);
  const region=ctx=>({x:8,y:finite(ctx.a.headerH)+8,w:ctx.a.W-16,h:ctx.a.footerY-finite(ctx.a.headerH)-16});
  function frame(name){const f=(root.EFFECT_FRAMES||{})[name];return f&&(Array.isArray(f)?f:f.rect);}
  function eventPoint(e,ctx){
    const p=typeof ctx.point==='function'&&point(ctx.point(e.itemId||e.id));
    if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))return p;
    const placed=(ctx.placements||[]).find(p=>p.item&&(p.item.id===(e.itemId||e.id)||p.item.face===e.face));
    if(placed)return{x:placed.x,y:placed.y};
    return typeof ctx.toScreen==='function'?point(ctx.toScreen(finite(e.x),finite(e.y))):null;
  }
  function add(batch,name,x,y,size,rot,alpha,bounds,meta={}){
    const r=frame(name);if(!r||r.length!==4||r[2]<=0||r[3]<=0)return;
    const k=size/Math.max(r[2],r[3]),w=r[2]*k,h=r[3]*k;
    if(![x,y,w,h,rot,alpha].every(Number.isFinite)||size<=0||alpha<=.003)return;
    const c=Math.abs(Math.cos(rot)),s=Math.abs(Math.sin(rot)),hx=(w*c+h*s)/2,hy=(w*s+h*c)/2;
    if(bounds){
      const clearance=Math.min(x-hx-bounds.x,bounds.x+bounds.w-x-hx,y-hy-bounds.y,bounds.y+bounds.h-y-hy);
      alpha*=smooth(clearance/12);if(alpha<=.003)return;
    }
    batch.particles.push(Object.assign({frame:name,x,y,w,h,rot,alpha:clamp(alpha,0,1)},meta));
  }
  function anchor(batch,name,p){if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))batch.anchors.push({name,sim:[p.x,p.y],drawn:[p.x,p.y],tol:2});}
  function findBurst(ST,ctx,batch,e){
    const age=ST.t-e.t,reduced=!!ctx.reducedMotion,life=reduced?.42:1.08;
    if(age<0||age>=life)return;
    const p=eventPoint(e,ctx);if(!p)return;const bounds=region(ctx),q=age/life;
    const placed=(ctx.placements||[]).find(p=>p.item&&p.item.id===e.id),unit=clamp(placed?Math.max(placed.w,placed.h)/140:1,.72,1.25),isGarden=garden(ST);
    anchor(batch,'fx_find_'+e.id,p);
    add(batch,isGarden?'seed_spark':'glint',p.x,p.y,(86-40*q)*unit,0,Math.pow(1-q,3)*.9,bounds,{family:'find-core',glow:{r:(62+30*q)*unit,col:isGarden?[.88,.93,.45]:[1,.78,.31],alpha:Math.pow(1-q,2)*.15}});
    const n=reduced?2:12;
    for(let i=0;i<n;i++){
      const delay=reduced?0:rnd(e.t+i,e.face+19)*.075,a=age-delay;if(a<0)continue;
      const u=a/(life-delay),seed=e.t*23+e.face*11+i,angle=(i/n)*TAU+(rnd(seed,2)-.5)*.45;
      const travel=reduced?5:(25+65*rnd(seed,3))*(1-Math.pow(1-u,3));
      const drift=reduced?0:wind(ST.t,p.x)*u*.35;
      const x=p.x+Math.cos(angle)*travel+drift,y=p.y+Math.sin(angle)*travel*.66-(reduced?0:34*u)+36*u*u;
      const name=isGarden?(i%4===0?'leaf_green':i%3===0?'dew_drop':'petal_pink'):(i%4===0?'feather_blue':i%3===0?'glint':'star_gold');
      const size=(isGarden?30:23)+(isGarden?19:16)*rnd(seed,4);
      add(batch,name,x,y,size*unit*(.95-.35*u),reduced?0:angle*.6+(rnd(seed,6)-.5)*u*3,pulse(u)*(.65+.25*rnd(seed,5)),bounds,{family:isGarden?'garden-find':'workshop-find'});
    }
  }
  function cacheBurst(ST,ctx,batch,e){
    const reduced=!!ctx.reducedMotion,life=reduced?.40:1.12,age=ST.t-e.t;if(age<0||age>=life)return;
    const explicit=typeof ctx.cachePoint==='function'&&point(ctx.cachePoint(e));
    const p=explicit&&Number.isFinite(explicit.x)&&Number.isFinite(explicit.y)?explicit:eventPoint(e,ctx);if(!p)return;const bounds=region(ctx),q=age/life,isGarden=garden(ST);
    anchor(batch,'fx_cache_'+e.id,p);
    if(!reduced)for(let i=0;i<3;i++){
      const seed=e.t*17+i*2,side=i-1;
      add(batch,'cloud_puff',p.x+side*(8+q*25)+wind(ST.t,p.x)*q*.2,p.y-8-q*(24+10*rnd(seed,2)),(52+q*40)*(1-.12*i),side*q*.22,Math.pow(1-q,2)*.5,bounds,{family:'cache-puff'});
    }
    for(let i=0;i<(reduced?3:10);i++){
      const seed=e.t*13+i*7,angle=-Math.PI*.92+i/(reduced?2:9)*Math.PI*.84,q2=clamp((q-rnd(seed,4)*.06)/.94,0,1),r=reduced?8:18+55*q2;
      const name=isGarden?(i%3===0?'seed_spark':'leaf_green'):(i%3===0?'glint':'star_gold');
      add(batch,name,p.x+Math.cos(angle)*r,p.y+Math.sin(angle)*r+(reduced?0:80*q2*q2),19+19*rnd(seed,1),reduced?0:(rnd(seed,5)-.5)*3*q2,pulse(q2)*.88,bounds,{family:'cache-reveal'});
    }
  }
  function hint(ST,ctx,batch){
    if(!ST.hint||ST.hint.until<=ST.t||!ST.hint.id)return;
    const p=eventPoint({id:ST.hint.id},ctx);if(!p)return;
    const e=(ST.ev||[]).slice().reverse().find(e=>e.k==='hint'&&e.id===ST.hint.id),age=e?Math.max(0,ST.t-e.t):1.2;
    const reduced=!!ctx.reducedMotion,unit=clamp(ctx.guide?ctx.guide.scale:1,.6,1.6),bounds=region(ctx);
    const joints=ctx.joints||(ctx.care&&ctx.care.joints),remaining=Math.min(1,(ST.hint.until-ST.t)/.35),head=joints?joints.beak:null;
    const from=head?{x:head[0],y:head[1]}:{x:ctx.guide.x+30*unit,y:ctx.guide.y-210*unit};
    const q=reduced?1:smooth(age/.7),arrived=q>=1,orbit=reduced?0:(age-.7)*2.5;
    const x=mix(from.x,p.x,q)+(arrived&&!reduced?Math.cos(orbit)*22:0),y=mix(from.y,p.y,q)-(reduced?0:Math.sin(q*Math.PI)*70*unit)+(arrived&&!reduced?Math.sin(orbit)*15:0);
    add(batch,'glint',x,y,36*unit,0,.86*remaining,bounds,{family:'hint-guide',glow:{r:33*unit,col:[1,.84,.37],alpha:.10*remaining}});
    add(batch,'seed_spark',x,y,12*unit,0,.95*remaining,bounds,{family:'hint-core'});
    if(!reduced)for(let i=1;i<=5;i++){
      const past=Math.max(0,age-i*.055),tq=smooth(past/.7),done=tq>=1,theta=(past-.7)*2.5;
      const tx=mix(from.x,p.x,tq)+(done?Math.cos(theta)*22:0),ty=mix(from.y,p.y,tq)-Math.sin(tq*Math.PI)*70*unit+(done?Math.sin(theta)*15:0);
      add(batch,'glint',tx,ty,(11-i)*unit,0,(.35-i*.045)*remaining,bounds,{family:'hint-trail'});
    }
    // The target pulse is anchored to the actual responsive object position.
    anchor(batch,'fx_hint_target_'+ST.hint.id,p);
  }
  function ambient(ST,ctx,batch){
    if(ctx.reducedMotion||ST.mode==='win')return;const bounds=region(ctx),t=ST.t,isGarden=garden(ST);
    for(let i=0;i<6;i++){
      const span=bounds.w*.88,x0=bounds.x+bounds.w*.06+rnd(i+7,ST.level+3)*span,y0=bounds.y+bounds.h*(.12+rnd(i,11)*.55);
      const phase=t*(.14+rnd(i,12)*.08)+i*2.3,life=Math.pow(Math.max(0,Math.sin(phase)),3);
      if(life<=.04)continue;
      const x=x0+Math.sin(t*.25+i)*16+wind(t,x0)*.35,y=y0+Math.sin(t*.32+i*1.4)*12;
      add(batch,isGarden&&i%3===0?'petal_pink':isGarden?'dew_drop':'glint',x,y,isGarden&&i%3===0?15:7+rnd(i,14)*5,Math.sin(t*.2+i)*.3,life*(isGarden?.17:.15),bounds,{family:'ambient'});
    }
  }
  function care(ST,ctx,batch){
    const c=ctx.care;if(!c)return;const bounds=region(ctx),reduced=!!ctx.reducedMotion,unit=clamp(ctx.guide.scale,.6,1.7),clock=ST.pet?ST.pet.clock:ST.t;
    if(c.kind==='play'){
      const at={x:c.x,y:c.y};anchor(batch,'fx_play_origin',at);
      if(reduced){add(batch,'glint',at.x,at.y,18*unit,0,.28*c.weight,bounds,{family:'play-accent'});return;}
      const spacing=.075,last=Math.floor(c.age/spacing);
      for(let i=0;i<7;i++){
        const birth=(last-i)*spacing,age=c.age-birth;if(birth<.02||age>.48)continue;
        const past=typeof ctx.careAt==='function'?ctx.careAt(birth):c;if(!past)continue;
        const u=age/.48,seed=birth*19+i*.7,name=i%3===0?'feather_blue':'glint';
        const x=past.x+(rnd(seed,2)-.5)*10+wind(clock,past.x)*u*.3,y=past.y+(rnd(seed,3)-.5)*12+u*14;
        add(batch,name,x,y,(i%3===0?44:27)*unit*(1-u*.65),Math.sin(seed)*.7,Math.pow(1-u,2)*.78*c.weight,bounds,{family:'play-trail'});
      }
    }else if(c.kind==='rest'){
      const h=c.joints.head,weight=c.weight;
      for(let i=0;i<(reduced?2:6);i++){
        const phase=reduced?.5:(c.age*.38+i/6)%1,x=h[0]+(35+18*i)*unit+Math.sin(phase*TAU+i)*6*unit,y=h[1]-(14+45*phase)*unit;
        add(batch,i%3===0?'feather_blue':'glint',x,y,(i%3===0?50:25)*unit,Math.sin(phase*2+i)*.3,Math.sin(phase*Math.PI)*.72*weight,bounds,{family:'rest-motes'});
      }
      const beak=c.joints.beak;
      for(let i=0;i<(reduced?1:2);i++){
        const q=reduced?.4:(c.age*.48+i*.5)%1;
        add(batch,'cloud_puff',beak[0]+(84+q*23)*unit,beak[1]-(8+q*45)*unit,(32+q*29)*unit,0,Math.sin(q*Math.PI)*.58*weight,bounds,{family:'rest-bubble'});
      }
    }else if(c.kind==='feed'&&c.age>=1.05){
      const b=c.joints.beak,origin={x:b[0],y:b[1]},age=c.age-1.05;anchor(batch,'fx_feed_origin',origin);
      for(let i=0;i<(reduced?2:6);i++){
        const delay=i*.085,u=(age-delay)/(.85+(.1*rnd(i,4)));if(u<0||u>=1)continue;
        const side=i%2?1:-1,x=origin.x+side*(reduced?84:(64+30*u))*unit,y=origin.y-(reduced?10:(12+44*u))*unit;
        add(batch,i%3===0?'glint':'heart_warm',x,y,(i%3===0?30:41+8*rnd(i,3))*unit*(.8+.2*Math.sin(u*Math.PI)),side*.12,pulse(u)*.88*c.weight,bounds,{family:'feed-joy'});
      }
    }
  }
  function win(ST,ctx,batch){
    if(ST.mode!=='win'||ST.wonAt<0)return;const age=ST.t-ST.wonAt,reduced=!!ctx.reducedMotion;
    const p=ctx.winPanel||ctx.panel;if(!p||age<0||age>2.3)return;
    const bounds={x:p.x+8,y:p.y+8,w:p.w-16,h:p.h-16},unit=clamp(p.w/1080,.8,1.1);
    if(reduced){
      for(let side of [-1,1])for(let i=0;i<2;i++)add(batch,i?'glint':'star_gold',p.x+p.w/2+side*(p.w*.30+i*24),p.y+60+i*26,23*unit,side*.13,(1-smooth(age/2.3))*.55,bounds,{family:'win-calm'});
      return;
    }
    // Two shaped fountains stay in the side gutters, leaving the reward and
    // text in the middle of the panel clearly legible.
    for(let side of [-1,1])for(let i=0;i<18;i++){
      const seed=i*7+(side+1)*13,delay=rnd(seed,1)*.18,life=1.35+rnd(seed,2)*.55,a=age-delay;if(a<0||a>life)continue;
      const q=a/life,baseX=p.x+p.w/2+side*p.w*.36+(rnd(seed,9)-.5)*90*unit,baseY=p.y+p.h*.73+(rnd(seed,10)-.5)*36*unit;
      const vx=side*(-18+46*rnd(seed,3)),vy=-(190+170*rnd(seed,4))*unit;
      const x=baseX+vx*a+wind(ST.t,baseX)*a*.5,y=baseY+vy*a+148*a*a*unit;
      const name=i%5===0?'star_gold':i%3===0?'ribbon_gold':i%2?'ribbon_teal':'confetti_pink';
      add(batch,name,x,y,(i%5===0?30:34+24*rnd(seed,6))*unit,(rnd(seed,7)-.5)*.7+a*(rnd(seed,8)-.5)*3.5,pulse(q)*.78,bounds,{family:'win-fountain'});
    }
  }
  function sample(ST,ctx,phase='world'){
    const batch={particles:[],anchors:[]};if(!ST||!ctx||!ctx.a||!enabled(ST,ctx))return batch;
    if(phase==='ambient')ambient(ST,ctx,batch);
    else if(phase==='world'){
      if(ST.mode!=='win'){
        const finds=(ST.ev||[]).filter(e=>e.k==='find'&&ST.t-e.t>=0&&ST.t-e.t<1.08).slice(-4);
        const caches=(ST.ev||[]).filter(e=>e.k==='cache'&&ST.t-e.t>=0&&ST.t-e.t<1.12).slice(-2);
        finds.forEach(e=>findBurst(ST,ctx,batch,e));caches.forEach(e=>cacheBurst(ST,ctx,batch,e));hint(ST,ctx,batch);
      }
    }else if(phase==='care')care(ST,ctx,batch);
    else if(phase==='win')win(ST,ctx,batch);
    batch.particles=batch.particles.slice(0,BUDGET[phase]||0);return batch;
  }
  function paint(ST,ctx,phase){
    const batch=sample(ST,ctx,phase),L=root.LIB,G=root.G;if(!L||!G)return batch;
    let texture;try{texture=G.tex('effects');}catch(_){return batch;}
    for(const p of batch.particles){
      const r=frame(p.frame);if(!r)continue;
      if(p.glow&&typeof L.glow==='function')L.glow(p.x,p.y,p.glow.r,p.glow.col,p.glow.alpha,4);
      L.sprite('effects',0,0,{m:L.M.of(L.M.t(p.x,p.y),L.M.r(p.rot)),pivot:[p.w/2,p.h/2],w:p.w,h:p.h,
        src:[r[0]/texture.w,r[1]/texture.h,(r[0]+r[2])/texture.w,(r[1]+r[3])/texture.h],u:{alpha:p.alpha}});
    }
    for(const a of batch.anchors)if(typeof L.anchor==='function')L.anchor(a.name,a.sim,a.drawn,a.tol);
    return batch;
  }
  root.JUICE={sample,stats:(ST,ctx)=>Object.fromEntries(Object.keys(BUDGET).map(phase=>[phase,sample(ST,ctx,phase).particles.length])),budgets:Object.assign({},BUDGET),frames:FRAME_NAMES.slice(),wind,
    ambient:(ST,ctx)=>paint(ST,ctx,'ambient'),world:(ST,ctx)=>paint(ST,ctx,'world'),care:(ST,ctx)=>paint(ST,ctx,'care'),win:(ST,ctx)=>paint(ST,ctx,'win')};
})(typeof window!=='undefined'?window:globalThis);
