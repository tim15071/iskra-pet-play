// Iskra's workshop: a deterministic, pointer-first hidden-object model.
// The model owns all actions and reactions; drawing and browser storage are adapters.
(function (root) {
  'use strict';
  const DT = 1 / 120, L = 25, VIEW = { W: 1920, H: 1080 }, WORLD = { W: 1920, H: 1440 };
  const SAVE_KEY = 'iskra-ref2game-find-v1', VERSION = 1;
  const HINT_COOLDOWN = 8, HINT_REVEAL = 3.2, TAP_SLOP = 22;
  const FACE_IDS = ['rocket', 'duck', 'dinosaur', 'star', 'airplane', 'candy', 'top', 'strawberry', 'ball', 'shell', 'crown', 'gamepad'];
  const FACE_NAMES = ['Ракета', 'Уточка', 'Динозаврик', 'Звёздочка', 'Самолётик', 'Конфета', 'Юла', 'Клубника', 'Мяч', 'Ракушка', 'Корона', 'Геймпад'];
  // Exact custom crops from the existing Godot toy atlas, not equal grid cells.
  const RECTS = [[46,40,300,334],[410,70,295,305],[731,57,356,319],[1116,70,307,302],[30,428,354,276],[392,430,365,252],[782,396,296,318],[1138,400,270,308],[40,732,302,298],[392,740,314,286],[736,734,348,286],[1088,770,344,260]];
  const FACES = FACE_IDS.map((id, i) => ({ id, name: FACE_NAMES[i], rect: RECTS[i] }));
  const SOURCE = { W: 1448, H: 1086, scale: WORLD.W / 1448 };
  // Alpha bounds measured at A>150 in unchanged custom atlas crops. The visible
  // base meets a source-painting support; transparent crop edges do not float.
  const ALPHA = [[9,21,288,321],[13,13,282,296],[9,10,347,309],[8,10,294,287],[7,13,345,260],[12,10,355,238],[12,9,278,302],[12,13,257,298],[9,8,292,287],[9,9,305,273],[8,10,340,273],[8,8,334,244]];
  // Row: face, source x/contact y, crop height, measured support. Hanging rows
  // use source centre y and an attachment y. Both axes share SOURCE.scale.
  const placed = (level, rows, targets) => rows.map(([face,sx,sy,sh,support,anchorY], i) => {
    const h=sh*SOURCE.scale,w=h*RECTS[face][2]/RECTS[face][3],x=sx*SOURCE.scale,hanging=support==='hanging';
    const y=hanging?sy*SOURCE.scale:sy*SOURCE.scale-(ALPHA[face][3]/RECTS[face][3]-.5)*h;
    return { id:'l'+level+'-'+FACE_IDS[face],face,x,y,w,h,rot:0,z:i,target:targets.includes(face),support,
      source:{x:sx,y:sy,height:sh},contact:hanging?null:{x,y:sy*SOURCE.scale},
      cord:hanging?{from:[x,anchorY*SOURCE.scale],to:[x,y+(ALPHA[face][1]/RECTS[face][3]-.5)*h]}:null };
  });
  const level = (n, name, subtitle, targets, rows) => ({ id: n, name, subtitle, targets, items: placed(n, rows, targets) });
  const LEVELS = [
    level(1, 'Тёплая мастерская', 'Найди 8 игрушек для Искры', [0,1,2,3,4,5,8,10], [
      [0,85,259,112,'upper-left-shelf'], [1,276,503,102,'left-worktop'], [2,565,735,98,'rug'],
      [3,440,328,96,'hanging',230], [4,1208,385,96,'hanging',130], [5,215,274,80,'upper-left-shelf'],
      [6,166,599,106,'left-stool'], [7,1380,507,104,'right-worktop'], [8,740,758,102,'rug'],
      [9,1040,746,98,'rug'], [10,1250,507,106,'right-worktop'], [11,1382,634,90,'right-stool']
    ]),
    level(2, 'Переполох на полках', 'Ещё 8 находок — в новых местах', [1,2,4,6,7,9,10,11], [
      [0,1380,507,112,'right-worktop'], [1,215,274,102,'upper-left-shelf'], [2,276,503,98,'left-worktop'],
      [3,468,449,96,'hanging',318], [4,1000,330,96,'hanging',42], [5,65,503,80,'left-worktop'],
      [6,565,735,106,'rug'], [7,1250,507,104,'right-worktop'], [8,1390,634,102,'right-stool'],
      [9,166,599,98,'left-stool'], [10,85,259,106,'upper-left-shelf'], [11,1000,746,90,'rug']
    ]),
    level(3, 'Большой поиск', 'Собери все 12 игрушек', [0,1,2,3,4,5,6,7,8,9,10,11], [
      [0,166,599,112,'left-stool'], [1,740,758,102,'rug'], [2,1040,746,98,'rug'],
      [3,1123,245,96,'hanging',40], [4,614,355,96,'hanging',92], [5,215,274,80,'upper-left-shelf'],
      [6,1390,634,106,'right-stool'], [7,565,735,104,'rug'], [8,65,503,102,'left-worktop'],
      [9,85,259,98,'upper-left-shelf'], [10,276,503,106,'left-worktop'], [11,1250,507,90,'right-worktop']
    ])
  ];
  const UI = {
    hint: { x: 1576, y: 36, w: 288, h: 90 },
    restart: { x: 1296, y: 36, w: 244, h: 90 },
    replay: { x: 560, y: 704, w: 360, h: 88 },
    next: { x: 1000, y: 704, w: 360, h: 88 },
    tray: { x: 88, y: 900, w: 1744, h: 156 }
  };
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const layout = (S) => LEVELS[clamp(S.level | 0, 0, LEVELS.length - 1)];
  const items = (S) => layout(S).items;
  const inside = (x,y,r) => x >= r.x && y >= r.y && x <= r.x+r.w && y <= r.y+r.h;
  const has = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
  const isFound = (S,item) => has(S.found, typeof item === 'string' ? item : item.id);
  const foundCount = (S) => items(S).filter((o) => o.target && isFound(S,o)).length;
  function clueSlots(S) {
    const target = layout(S).targets, w = 128, gap = 12;
    const start = (VIEW.W - target.length * w - (target.length-1) * gap) / 2;
    return target.map((face,i) => ({ x: start+i*(w+gap), y: 919, w, h: 116, face, item: items(S).find((o) => o.face === face) }));
  }
  const event = (S,k,data={}) => { S.ev.push(Object.assign({k,t:S.t},data)); if (S.ev.length>64) S.ev.splice(0,S.ev.length-64); };
  function create(number=0) {
    const n = clamp(number | 0,0,LEVELS.length-1), def = LEVELS[n];
    return { schema: VERSION, t: 0, steps: 0, wt0: 0, level: n, mode: 'play', found: {}, count: 0, total: def.targets.length,
      focus: def.targets[0], hint: { id: '', until: -1, readyAt: 0 }, hintUses: 0, ev: [],
      x: VIEW.W/2, y: VIEW.H/2, press: 0, pointer: null, hoverId: '', hov: Object.fromEntries(def.items.map((o)=>[o.id,[0,0]])),
      progress: { completed: [false,false,false] }, revision: 0, wonAt: -1, lastFound: '', lastMiss: '',
      gestureBlocked: false, controls: { act: false, left: false, right: false, jump: false },
      reaction: { joy: 0, joyV: 0, curious: 0, curiousV: 0 } };
  }
  function spawn(worldT=0) { const S = create(); S.wt0 = Number.isFinite(worldT) ? worldT : 0; return S; }
  function startLevel(S,number,replay=false) {
    const previous = S.level, n = clamp(number|0,0,LEVELS.length-1), keep = { t:S.t,steps:S.steps,wt0:S.wt0,progress:clone(S.progress),revision:S.revision+1,controls:S.controls };
    Object.assign(S,create(n),keep);
    event(S,replay?'replay':'level',{level:n,from:previous});
    return S;
  }
  // Expanded rotated rectangles provide generous finger targets while preserving depth order.
  function hitTest(S,x,y) {
    return items(S).slice().reverse().find((o) => {
      if (isFound(S,o)) return false;
      const c=Math.cos(o.rot),sn=Math.sin(o.rot),dx=x-o.x,dy=y-o.y;
      return Math.abs(dx*c+dy*sn) <= Math.max(144,o.w)/2 && Math.abs(-dx*sn+dy*c) <= Math.max(144,o.h)/2;
    }) || null;
  }
  function nextMissing(S) {
    return items(S).find((o)=>o.target && o.face===S.focus && !isFound(S,o)) ||
      layout(S).targets.map((face)=>items(S).find((o)=>o.face===face)).find((o)=>!isFound(S,o)) || null;
  }
  const hintRemaining = (S) => Math.max(0,S.hint.readyAt-S.t);
  function useHint(S) {
    if (S.mode!=='play' || hintRemaining(S)>0) return false;
    const o=nextMissing(S); if (!o) return false;
    S.focus=o.face; S.hint={id:o.id,until:S.t+HINT_REVEAL,readyAt:S.t+HINT_COOLDOWN}; S.hintUses++; S.revision++;
    S.reaction.curiousV+=4;
    event(S,'hint',{id:o.id,face:o.face,x:o.x,y:o.y}); return true;
  }
  function find(S,o) {
    if (S.mode!=='play' || !o || !o.target || isFound(S,o)) return false;
    S.found[o.id]=S.t; S.count=foundCount(S); S.lastFound=o.id; S.revision++; S.reaction.joyV+=7;
    event(S,'find',{id:o.id,face:o.face,x:o.x,y:o.y,count:S.count});
    if (S.hint.id===o.id) { S.hint.id=''; S.hint.until=-1; }
    const next=nextMissing(S); if(next)S.focus=next.face;
    if (S.count===S.total) {
      S.mode='win'; S.wonAt=S.t; S.progress.completed[S.level]=true; S.revision++;
      event(S,'win',{level:S.level,x:VIEW.W/2,y:VIEW.H/2});
    }
    return true;
  }
  function tap(S,x,y,options={}) {
    const room=options.room===true,bounds=room?WORLD:VIEW;
    if (!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>bounds.W||y>bounds.H) return false;
    if (S.mode==='win') {
      if(room)return false;
      if (inside(x,y,UI.replay)) { startLevel(S,S.level,true); return true; }
      if (inside(x,y,UI.next)) { startLevel(S,(S.level+1)%LEVELS.length); return true; }
      return false;
    }
    if (!room && inside(x,y,UI.hint)) return useHint(S);
    if (!room && inside(x,y,UI.restart)) { startLevel(S,S.level,true); return true; }
    const slot=!room&&clueSlots(S).find((r)=>inside(x,y,r));
    if(slot) {
      if(!isFound(S,slot.item)) { S.focus=slot.face; event(S,'focus',{face:slot.face,x,y}); }
      return true;
    }
    // Header and clue tray never pass a tap through to room props.
    if(!room && (y<144 || y>884)) return false;
    const o=hitTest(S,x,y);
    if(find(S,o)) return true;
    if(o) { S.lastMiss=o.id; S.reaction.curiousV+=3; }
    event(S,o?'distractor':'tap',{id:o?o.id:'',x,y});
    return false;
  }
  function step(S,inp={}) {
    S.steps++; S.t=S.steps*DT;
    if(Number.isFinite(inp.px)) S.x=inp.px;
    if(Number.isFinite(inp.py)) S.y=inp.py;
    const down=!!inp.press;
    if(inp.cancel) { S.pointer=null; S.gestureBlocked=down; }
    if(!down)S.gestureBlocked=false;
    // The stock engine click is pointer-down, not a completed tap. Start a gesture,
    // then wait for release; leaving the hit box and returning still counts as drag.
    if(!inp.cancel && !S.gestureBlocked && (down && !S.press || inp.click && down)) S.pointer={x:S.x,y:S.y,max:0,room:inp.room===true};
    let confirmed=false;
    if(S.pointer) {
      S.pointer.max=Math.max(S.pointer.max,Math.hypot(S.x-S.pointer.x,S.y-S.pointer.y));
      if(!down && S.press) {
        const p=S.pointer; S.pointer=null;
        if(p.max<=TAP_SLOP) {tap(S,S.x,S.y,{room:p.room&&inp.room===true});confirmed=true;}
      }
    }
    // Explicit tap is an already-confirmed release from an input adapter or test.
    if(inp.tap && !inp.cancel && !confirmed) {tap(S,S.x,S.y,{room:inp.room===true});confirmed=true;}
    if(inp.click && !down && !S.press && !inp.cancel && !confirmed)tap(S,S.x,S.y,{room:inp.room===true});
    const edge=(k)=>!!inp[k]&&!S.controls[k];
    if(edge('act')) { if(S.mode==='win')startLevel(S,(S.level+1)%LEVELS.length); else useHint(S); }
    if(edge('jump') && S.mode==='win')startLevel(S,S.level,true);
    if(S.mode==='play' && (edge('left')||edge('right'))) {
      const pending=layout(S).targets.filter((face)=>!isFound(S,items(S).find((o)=>o.face===face)));
      const i=Math.max(0,pending.indexOf(S.focus)), dir=edge('right')?1:-1;
      if(pending.length)S.focus=pending[(i+dir+pending.length)%pending.length];
    }
    Object.keys(S.controls).forEach((k)=>S.controls[k]=!!inp[k]);
    S.press=down?1:0;
    const over=S.mode==='play' && (inp.room===true || S.y>=144 && S.y<=884) ? hitTest(S,S.x,S.y) : null;
    S.hoverId=over?over.id:'';
    for(const o of items(S)) {
      const h=S.hov[o.id] || (S.hov[o.id]=[0,0]), target=S.hoverId===o.id?(down?0.4:1):0;
      h[1]+=(240*(target-h[0])-19*h[1])*DT; h[0]+=h[1]*DT;
    }
    const R=S.reaction;
    R.joyV+=(-150*R.joy-15*R.joyV)*DT; R.joy+=R.joyV*DT;
    R.curiousV+=(-100*R.curious-15*R.curiousV)*DT; R.curious+=R.curiousV*DT;
    S.ev=S.ev.filter((e)=>S.t-e.t<8).slice(-64);
    return S;
  }
  // Serialisable local-only progress. No main-game inventory, scores or rewards.
  function encodeSave(S) {
    return JSON.stringify({version:VERSION,level:S.level,found:Object.keys(S.found),completed:S.progress.completed,
      hintRemaining:hintRemaining(S),hintUses:S.hintUses});
  }
  function restoreSave(raw,worldT=0) {
    let data;
    try { data=typeof raw==='string'?JSON.parse(raw):raw; } catch (_) {return spawn(worldT);}
    if(!data || typeof data!=='object' || data.version!==VERSION || !Number.isInteger(data.level) || data.level<0 || data.level>=LEVELS.length) return spawn(worldT);
    const S=create(data.level); S.wt0=Number.isFinite(worldT)?worldT:0;
    const valid=new Set(items(S).filter((o)=>o.target).map((o)=>o.id));
    for(const id of Array.isArray(data.found)?data.found:[]) if(typeof id==='string'&&valid.has(id))S.found[id]=-1;
    S.count=foundCount(S);
    S.progress.completed=LEVELS.map((_,i)=>Array.isArray(data.completed)&&data.completed[i]===true);
    if(S.count===S.total) {S.mode='win';S.wonAt=-1;S.progress.completed[S.level]=true;}
    const next=nextMissing(S); if(next)S.focus=next.face;
    S.hint.readyAt=typeof data.hintRemaining==='number'&&Number.isFinite(data.hintRemaining)?clamp(data.hintRemaining,0,HINT_COOLDOWN):0;
    S.hintUses=Number.isInteger(data.hintUses)?clamp(data.hintUses,0,99999):0;
    return S;
  }
  const ROUTE = LEVELS[0].targets.map((face,i)=>({t:2.1+i*2.35,item:LEVELS[0].items.find((o)=>o.face===face)}));
  function scriptInput(t) {
    let from={x:1000,y:650},last=0;
    for(const beat of ROUTE) {
      if(t<beat.t) {
        const u=clamp((t-last-0.4)/(beat.t-last-0.7),0,1),q=u*u*(3-2*u);
        return {px:from.x+(beat.item.x-from.x)*q,py:from.y+(beat.item.y-from.y)*q,press:t>beat.t-0.09,room:true};
      }
      if(t<beat.t+0.1)return {px:beat.item.x,py:beat.item.y,press:false,room:true};
      from=beat.item; last=beat.t;
    }
    return {px:from.x,py:from.y,press:false,room:true};
  }
  let cache=null;
  function at(t) {
    t=Math.max(0,Number.isFinite(t)?t:0);
    const loop=Math.floor(t/L),q=t-loop*L,n=Math.round(q/DT);
    if(!cache||cache.loop!==loop||cache.S.steps>n)cache={loop,S:Object.assign(create(),{wt0:loop*L})};
    while(cache.S.steps<n)step(cache.S,scriptInput(cache.S.t,cache.S));
    return Object.assign(clone(cache.S),{loop,q});
  }
  function namedState(name='play') {
    const number=name==='level2'?1:name==='level3'||name==='win12'?2:0,S=create(number);
    for(let i=0;i<120;i++)step(S,{});
    if(['finds','hint','cooldown','win','win12'].includes(name)) {
      const n=name==='win'||name==='win12'?S.total:3;
      for(const face of layout(S).targets.slice(0,n)) {const o=items(S).find((o)=>o.face===face);step(S,{px:o.x,py:o.y,tap:true,room:true});}
    }
    if(name==='hint'||name==='cooldown')useHint(S);
    if(name==='cooldown')for(let i=0;i<390;i++)step(S,{});
    if(name==='drag') {
      const o=items(S).find((o)=>o.target); step(S,{px:o.x,py:o.y,press:true,room:true});step(S,{px:o.x+100,py:o.y+50,press:true,room:true});
    }
    return S;
  }
  const demoCheck=(S)=>S.mode==='win'&&S.count===8&&S.progress.completed[0];
  function selfCheck() {
    const failures=[];
    LEVELS.forEach((def,i)=>{
      if(def.items.length!==12||new Set(def.items.map((o)=>o.face)).size!==12)failures.push('Level '+(i+1)+' must contain exactly twelve distinct toys');
      if(def.targets.length!==(i===2?12:8)||new Set(def.targets).size!==def.targets.length)failures.push('Level '+(i+1)+' target count/uniqueness');
      const S=create(i);
      for(const o of def.items) {
        if(!FACES[o.face]||o.w<80||o.h<88||o.x-o.w/2<4||o.x+o.w/2>WORLD.W-4||o.y-o.h/2<0||o.y+o.h/2>WORLD.H)failures.push(o.id+' invalid bounds or finger target');
        if(Math.abs(o.w/o.h-RECTS[o.face][2]/RECTS[o.face][3])>1e-9)failures.push(o.id+' sprite aspect changed');
        if(o.contact&&Math.abs(o.y+(ALPHA[o.face][3]/RECTS[o.face][3]-.5)*o.h-o.contact.y)>1e-8)failures.push(o.id+' misses its painted support');
        if(!o.contact&&!o.cord)failures.push(o.id+' has no support or hanging attachment');
        const hit=hitTest(S,o.x,o.y);
        if(!hit||hit.id!==o.id)failures.push(o.id+' centre is covered by '+(hit&&hit.id));
      }
      for(const face of def.targets) {const o=def.items.find((p)=>p.face===face);tap(S,o.x,o.y,{room:true});}
      if(S.mode!=='win'||S.count!==def.targets.length)failures.push('Level '+(i+1)+' cannot be completed');
      if(restoreSave(encodeSave(S)).mode!=='win')failures.push('Level '+(i+1)+' complete save does not round-trip');
    });
    return failures;
  }
  root.SIM={DT,L,VIEW,WORLD,SOURCE,ALPHA,HINT:'Найди в комнате игрушки с нижней панели. Образец выбирает предмет для подсказки. Enter — подсказка, F — во весь экран, R — начать заново.',
    SAVE_KEY,VERSION,FACES,FACE_IDS,FACE_NAMES,RECTS,LEVELS,UI,HINT_COOLDOWN,HINT_REVEAL,TAP_SLOP,ROUTE,
    create,spawn,step,at,scriptInput,layout,items,clueSlots,hitTest,isFound,foundCount,nextMissing,hintRemaining,useHint,
    tap,find,startLevel,encodeSave,restoreSave,namedState,demoCheck,selfCheck,outOfPlay:()=>false};
  if(typeof module!=='undefined')module.exports=root.SIM;
})(typeof window!=='undefined'?window:globalThis);
