// Iskra's workshop: a deterministic, pointer-first hidden-object model.
// The model owns all actions and reactions; drawing and browser storage are adapters.
(function (root) {
  'use strict';
  const DT = 1 / 120, L = 25, VIEW = { W: 1920, H: 1080 }, WORLD = { W: 1920, H: 1440 };
  // Keep the original storage key: each schema extends the same local journey.
  const SAVE_KEY = 'iskra-ref2game-find-v1', VERSION = 3;
  const HINT_COOLDOWN = 8, HINT_REVEAL = 3.2, TAP_SLOP = 22;
  const FACE_IDS = ['rocket', 'duck', 'dinosaur', 'star', 'airplane', 'candy', 'top', 'strawberry', 'ball', 'shell', 'crown', 'gamepad',
    'wateringcan','flowerpot','butterfly','ladybug','mushroom','sunflower','acorn','pear','leaf','seedbag','lantern','pinwheel'];
  const FACE_NAMES = ['Ракета', 'Уточка', 'Динозаврик', 'Звёздочка', 'Самолётик', 'Конфета', 'Юла', 'Клубника', 'Мяч', 'Ракушка', 'Корона', 'Геймпад',
    'Лейка','Цветок','Бабочка','Жучок','Грибочек','Подсолнух','Жёлудь','Груша','Листочек','Семена','Фонарик','Вертушка'];
  // Exact custom crops from the existing Godot toy atlas, not equal grid cells.
  const RECTS = [[46,40,300,334],[410,70,295,305],[731,57,356,319],[1116,70,307,302],[30,428,354,276],[392,430,365,252],[782,396,296,318],[1138,400,270,308],[40,732,302,298],[392,740,314,286],[736,734,348,286],[1088,770,344,260]];
  // Production alpha components, including each prop's full soft edge.
  RECTS.push([30,26,330,301],[443,7,266,326],[785,54,344,251],[1179,53,320,259],
    [46,358,297,295],[428,346,276,312],[829,348,256,302],[1207,345,271,310],
    [39,686,308,307],[422,683,285,314],[836,683,237,319],[1182,675,292,329]);
  const FACES = FACE_IDS.map((id, i) => ({ id, name: FACE_NAMES[i], rect: RECTS[i],texture:i<12?'toys':'garden-toys' }));
  const SOURCE = { W: 1448, H: 1086, scale: WORLD.W / 1448 };
  // Alpha bounds measured at A>150 in unchanged custom atlas crops. The visible
  // base meets a source-painting support; transparent crop edges do not float.
  const ALPHA = [[9,21,288,321],[13,13,282,296],[9,10,347,309],[8,10,294,287],[7,13,345,260],[12,10,355,238],[12,9,278,302],[12,13,257,298],[9,8,292,287],[9,9,305,273],[8,10,340,273],[8,8,334,244]];
  ALPHA.push([8,8,322,294],[8,7,259,319],[8,8,337,244],[8,7,313,251],
    [8,8,289,288],[7,7,269,305],[8,8,249,295],[8,8,263,303],
    [8,8,300,300],[8,7,278,306],[8,8,230,312],[8,8,284,322]);
  const ROOMS = [
    {id:'workshop',name:'Мастерская',texture:'workshop',start:0,end:6,faces:Array.from({length:12},(_,i)=>i)},
    {id:'garden',name:'Сад облаков',texture:'garden',start:6,end:12,faces:Array.from({length:12},(_,i)=>i+12)}
  ];
  // Row: face, source x/contact y, crop height, measured support. Hanging rows
  // use source centre y and an attachment y. Both axes share SOURCE.scale.
  const placed = (level, rows, targets) => rows.map(([face,sx,sy,sh,support,anchorY], i) => {
    const h=sh*SOURCE.scale,w=h*RECTS[face][2]/RECTS[face][3],x=sx*SOURCE.scale,hanging=support==='hanging';
    const y=hanging?sy*SOURCE.scale:sy*SOURCE.scale-(ALPHA[face][3]/RECTS[face][3]-.5)*h;
    return { id:'l'+level+'-'+FACE_IDS[face],face,x,y,w,h,rot:0,z:i,target:targets.includes(face),support,
      source:{x:sx,y:sy,height:sh},contact:hanging?null:{x,y:sy*SOURCE.scale},
      cord:hanging?{from:[x,anchorY*SOURCE.scale],to:[x,y+(ALPHA[face][1]/RECTS[face][3]-.5)*h]}:null };
  });
  const level = (n, name, subtitle, targets, rows,room='workshop') => ({ id: n, name, subtitle, targets, room,items: placed(n, rows, targets) });
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
  // New searches reuse measured furniture supports, with different ground toys.
  // Hanging star/plane remain hanging: a shelf toy is never put on a cord.
  const groundFaces = [0,1,2,5,6,7,8,9,10,11];
  function remixRows(base,shift) {
    return base.items.map((item) => {
      const ground=groundFaces.indexOf(item.face),face=ground<0?item.face:groundFaces[(ground+shift)%groundFaces.length];
      const sh=ground<0?item.source.height:face===5?80:90;
      return [face,item.source.x,item.source.y,sh,item.support,item.cord?item.cord.from[1]/SOURCE.scale:undefined];
    });
  }
  LEVELS.push(
    level(4,'Секретные полки','Найди 8 сокровищ мастерской',[0,2,3,5,6,7,9,11],remixRows(LEVELS[0],3)),
    level(5,'Игрушечная экспедиция','Найди 10 любимых вещей',[0,1,2,3,4,6,7,8,10,11],remixRows(LEVELS[1],4)),
    level(6,'Сокровища Искры','Последний большой поиск: 12 игрушек',[0,1,2,3,4,5,6,7,8,9,10,11],remixRows(LEVELS[2],7))
  );
  const gardenNames=['Первые ростки','Крылатые гости','Урожай на облаке','Вечерний фонарик','Цветочная тропа','Праздник в саду'];
  const gardenTargets=[[12,13,14,15,16,17,19,22],[12,14,15,16,18,20,22,23],
    [12,13,14,15,17,18,19,20,21,23],[12,13,15,16,17,18,19,20,21,22],
    [12,13,14,15,16,17,18,19,20,21,22,23],[12,13,14,15,16,17,18,19,20,21,22,23]];
  const gardenOrder=[0,1,2,3,4,5,6,7,8,9,10,11];
  const gardenSpots=[[85,259],[276,503],[565,735],[440,328],[1208,385],[215,274],
    [166,599],[1380,507],[740,758],[1040,746],[1250,507],[1382,634]];
  for(let i=0;i<6;i++){
    const rows=gardenOrder.map((_,slot)=>{
      const face=12+(slot+i*5)%12,[sx,sy]=gardenSpots[slot];
      return [face,sx,sy,90,'garden-support-'+slot];
    });
    LEVELS.push(level(i+7,gardenNames[i],'Найди '+gardenTargets[i].length+' сокровищ сада',gardenTargets[i],rows,'garden'));
  }
  const TROPHIES = [
    {id:'rocket',name:'Ракета мечты',face:0,level:1},
    {id:'duck',name:'Солнечная уточка',face:1,level:2},
    {id:'dinosaur',name:'Друг-динозаврик',face:2,level:3},
    {id:'star',name:'Звезда открытий',face:3,level:4},
    {id:'crown',name:'Корона сыщика',face:10,level:5},
    {id:'gamepad',name:'Геймпад чемпиона',face:11,level:6},
    {id:'wateringcan',name:'Лейка роста',face:12,level:7},
    {id:'flowerpot',name:'Цветок дружбы',face:13,level:8},
    {id:'butterfly',name:'Облачная бабочка',face:14,level:9},
    {id:'lantern',name:'Фонарик мечтателя',face:22,level:10},
    {id:'sunflower',name:'Солнечный подсолнух',face:17,level:11},
    {id:'pinwheel',name:'Вертушка ветра',face:23,level:12}
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
  const room = (S) => ROOMS.find((o)=>o.id===layout(S).room);
  const items = (S) => layout(S).items;
  const inside = (x,y,r) => x >= r.x && y >= r.y && x <= r.x+r.w && y <= r.y+r.h;
  const has = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
  const isFound = (S,item) => has(S.found, typeof item === 'string' ? item : item.id);
  const foundCount = (S) => items(S).filter((o) => o.target && isFound(S,o)).length;
  const levelUnlocked = (S,n) => Number.isInteger(n)&&n>=0&&n<LEVELS.length&&(n<3||S.progress.completed[n-1]===true);
  const roomUnlocked = (S,id) => {const target=ROOMS.find((o)=>o.id===id);return !!target&&levelUnlocked(S,target.start);};
  const collection = (S) => TROPHIES.map((o)=>Object.assign({},o,{unlocked:S.progress.claimed[o.level-1]===true,selected:S.progress.selected===o.id}));
  function selectTrophy(S,id) {
    if(id!==null&&!TROPHIES.some((o)=>o.id===id&&S.progress.claimed[o.level-1]===true))return false;
    if(S.progress.selected===id)return true;
    S.progress.selected=id;S.revision++;event(S,'decoration',{id});return true;
  }
  function interactTrophy(S) {
    if(S.mode!=='play')return false;
    const trophy=collection(S).find((o)=>o.selected&&o.unlocked);
    if(!trophy)return false;
    S.reaction.joyV+=6;event(S,'trophy',{id:trophy.id,face:trophy.face});return true;
  }
  function award(S) {
    const trophy=TROPHIES[S.level],first=S.progress.claimed[S.level]!==true;
    S.progress.completed[S.level]=true;S.progress.claimed[S.level]=true;
    delete S.progress.attempts[S.level];
    S.reward={id:trophy.id,first};
    return S.reward;
  }
  function clueSlots(S) {
    const target = layout(S).targets, w = 128, gap = 12;
    const start = (VIEW.W - target.length * w - (target.length-1) * gap) / 2;
    return target.map((face,i) => ({ x: start+i*(w+gap), y: 919, w, h: 116, face, item: items(S).find((o) => o.face === face) }));
  }
  const event = (S,k,data={}) => { S.ev.push(Object.assign({k,t:S.t},data)); if (S.ev.length>64) S.ev.splice(0,S.ev.length-64); };
  // Off-screen attempts are finite snapshots, never live simulation objects.
  function cleanAttempt(number,data) {
    if(!data||typeof data!=='object'||Array.isArray(data))return null;
    const valid=new Set(LEVELS[number].items.filter((o)=>o.target).map((o)=>o.id));
    const found=[...new Set((Array.isArray(data.found)?data.found:[]).slice(0,12).filter((id)=>typeof id==='string'&&valid.has(id)))];
    // A real last find awards immediately. A complete off-screen attempt is
    // inconsistent input and must not create an unfinishable board or a prize.
    if(found.length===valid.size)return null;
    return {found,hintRemaining:typeof data.hintRemaining==='number'&&Number.isFinite(data.hintRemaining)?clamp(data.hintRemaining,0,HINT_COOLDOWN):0,
      hintUses:Number.isInteger(data.hintUses)?clamp(data.hintUses,0,99999):0};
  }
  function attemptSnapshot(S) {
    return {found:Object.keys(S.found),hintRemaining:hintRemaining(S),hintUses:S.hintUses};
  }
  function applyAttempt(S,data) {
    const attempt=cleanAttempt(S.level,data);if(!attempt)return;
    S.found=Object.fromEntries(attempt.found.map((id)=>[id,-1]));S.count=foundCount(S);
    S.hint.readyAt=S.t+attempt.hintRemaining;S.hintUses=attempt.hintUses;
    const next=nextMissing(S);if(next)S.focus=next.face;
  }
  function savedAttempts(S) {
    const out={};
    for(let i=0;i<LEVELS.length;i++)if(!S.progress.completed[i]) {
      const attempt=cleanAttempt(i,S.progress.attempts[i]);if(attempt)out[i]=attempt;
    }
    if(S.mode==='play'&&!S.progress.completed[S.level])out[S.level]=attemptSnapshot(S);
    else delete out[S.level];
    return out;
  }
  function create(number=0) {
    const n = clamp(number | 0,0,LEVELS.length-1), def = LEVELS[n];
    return { schema: VERSION, t: 0, steps: 0, wt0: 0, level: n, mode: 'play', found: {}, count: 0, total: def.targets.length,
      focus: def.targets[0], hint: { id: '', until: -1, readyAt: 0 }, hintUses: 0, ev: [],
      x: VIEW.W/2, y: VIEW.H/2, press: 0, pointer: null, hoverId: '', hov: Object.fromEntries(def.items.map((o)=>[o.id,[0,0]])),
      progress: { completed: LEVELS.map(()=>false),claimed:LEVELS.map(()=>false),selected:null,attempts:{} },reward:null,revision: 0, wonAt: -1, lastFound: '', lastMiss: '',
      gestureBlocked: false, controls: { act: false, left: false, right: false, jump: false },
      reaction: { joy: 0, joyV: 0, curious: 0, curiousV: 0 } };
  }
  function spawn(worldT=0) { const S = create(); S.wt0 = Number.isFinite(worldT) ? worldT : 0; return S; }
  function startLevel(S,number,replay=false) {
    if(!levelUnlocked(S,number))return false;
    const previous = S.level, n = number, keep = { t:S.t,steps:S.steps,wt0:S.wt0,progress:clone(S.progress),revision:S.revision+1,controls:S.controls };
    keep.progress.attempts=replay?clone(S.progress.attempts):savedAttempts(S);
    if(replay||keep.progress.completed[n])delete keep.progress.attempts[n];
    const resume=!replay&&!keep.progress.completed[n]?keep.progress.attempts[n]:null;
    Object.assign(S,create(n),keep);
    if(resume)applyAttempt(S,resume);
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
      S.mode='win'; S.wonAt=S.t;award(S);S.revision++;
      event(S,'win',{level:S.level,reward:S.reward.id,first:S.reward.first,x:VIEW.W/2,y:VIEW.H/2});
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
  // Local workshop collection only; the main Godot profile is separate.
  function encodeSave(S) {
    return JSON.stringify({version:VERSION,level:S.level,found:Object.keys(S.found),completed:S.progress.completed,claimed:S.progress.claimed,selected:S.progress.selected,attempts:savedAttempts(S),
      hintRemaining:hintRemaining(S),hintUses:S.hintUses});
  }
  function restoreSave(raw,worldT=0) {
    let data;
    try { data=typeof raw==='string'?JSON.parse(raw):raw; } catch (_) {return spawn(worldT);}
    if(!data || typeof data!=='object' || ![1,2,VERSION].includes(data.version))return spawn(worldT);
    const oldLimit=data.version===1?3:data.version===2?6:LEVELS.length;
    if(!Number.isInteger(data.level)||data.level<0||data.level>=oldLimit)return spawn(worldT);
    const completed=LEVELS.map((_,i)=>i<oldLimit&&Array.isArray(data.completed)&&data.completed[i]===true);
    // A forged later completion cannot open a gap in the sequential extension.
    for(let i=3;i<completed.length;i++)if(!completed[i-1])completed[i]=false;
    let number=data.level;
    if(number>=3&&!completed[number-1])number=completed.findIndex((done,i)=>i>=2&&!done);
    if(number<0)number=0;
    const S=create(number); S.wt0=Number.isFinite(worldT)?worldT:0;
    S.progress.completed=completed;
    S.progress.claimed=completed.slice();
    const attempts=data.version>=2&&data.attempts&&typeof data.attempts==='object'&&!Array.isArray(data.attempts)?data.attempts:{};
    for(let i=0;i<oldLimit;i++)if(!completed[i]&&levelUnlocked(S,i)&&has(attempts,String(i))) {
      const attempt=cleanAttempt(i,attempts[i]);if(attempt)S.progress.attempts[i]=attempt;
    }
    const valid=new Set(items(S).filter((o)=>o.target).map((o)=>o.id));
    for(const id of number===data.level&&Array.isArray(data.found)?data.found:[]) if(typeof id==='string'&&valid.has(id))S.found[id]=-1;
    S.count=foundCount(S);
    if(S.count===S.total) {S.mode='win';S.wonAt=-1;award(S);S.reward.first=false;}
    S.progress.selected=typeof data.selected==='string'&&TROPHIES.some((o)=>o.id===data.selected&&S.progress.claimed[o.level-1])?data.selected:null;
    const next=nextMissing(S); if(next)S.focus=next.face;
    S.hint.readyAt=typeof data.hintRemaining==='number'&&Number.isFinite(data.hintRemaining)?clamp(data.hintRemaining,0,HINT_COOLDOWN):0;
    S.hintUses=Number.isInteger(data.hintUses)?clamp(data.hintUses,0,99999):0;
    if(number!==data.level)applyAttempt(S,S.progress.attempts[number]);
    if(S.mode==='play'&&!S.progress.completed[S.level])S.progress.attempts[S.level]=attemptSnapshot(S);
    else delete S.progress.attempts[S.level];
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
    const number=/^level(?:[2-9]|1[0-2])$/.test(name)?Number(name.slice(5))-1:name==='win12'?2:name==='winlast'?5:name==='garden'||name==='gardenhint'?6:name==='gardenwin'?11:0,S=create(number);
    if(number>=3)for(let i=2;i<number;i++){S.progress.completed[i]=true;S.progress.claimed[i]=true;}
    for(let i=0;i<120;i++)step(S,{});
    if(['finds','hint','cooldown','win','win12','winlast','gardenhint','gardenwin'].includes(name)) {
      const n=name==='win'||name==='win12'||name==='winlast'||name==='gardenwin'?S.total:3;
      for(const face of layout(S).targets.slice(0,n)) {const o=items(S).find((o)=>o.face===face);step(S,{px:o.x,py:o.y,tap:true,room:true});}
    }
    if(name==='hint'||name==='cooldown'||name==='gardenhint')useHint(S);
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
      if(def.targets.length!==[8,8,12,8,10,12,8,8,10,10,12,12][i]||new Set(def.targets).size!==def.targets.length)failures.push('Level '+(i+1)+' target count/uniqueness');
      if(!ROOMS.some((o)=>o.id===def.room&&i>=o.start&&i<o.end))failures.push('Level '+(i+1)+' invalid room range');
      if(def.items.some((o)=>!room(create(i)).faces.includes(o.face)))failures.push('Level '+(i+1)+' mixed-room objects');
      const S=create(i);
      if(i>=3)for(let previous=2;previous<i;previous++){S.progress.completed[previous]=true;S.progress.claimed[previous]=true;}
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
  root.SIM={DT,L,VIEW,WORLD,SOURCE,ALPHA,HINT:'Найди в комнате предметы с нижней панели. Образец выбирает предмет для подсказки. Enter — подсказка, F — во весь экран, R — начать заново.',
    SAVE_KEY,VERSION,FACES,FACE_IDS,FACE_NAMES,RECTS,LEVELS,TROPHIES,ROOMS,UI,HINT_COOLDOWN,HINT_REVEAL,TAP_SLOP,ROUTE,
    create,spawn,step,at,scriptInput,layout,items,clueSlots,hitTest,isFound,foundCount,nextMissing,hintRemaining,useHint,
    tap,find,startLevel,levelUnlocked,room,roomUnlocked,collection,selectTrophy,interactTrophy,encodeSave,restoreSave,namedState,demoCheck,selfCheck,outOfPlay:()=>false};
  if(typeof module!=='undefined')module.exports=root.SIM;
})(typeof window!=='undefined'?window:globalThis);
