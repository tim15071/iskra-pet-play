// The campaign is a modal over the running room. Only SIM owns earned rewards.
(function () {
  'use strict';
  const style=document.createElement('style');
  style.textContent=`
  #journey-open{position:absolute;z-index:1;margin:0;padding:0;min-height:0;border:0;border-radius:18px;background:transparent;box-shadow:none;color:transparent}
  #journey-open:active{transform:none;background:#ffffff24}
  #journey-open:focus-visible{outline:3px solid #14756f;outline-offset:-3px}
  #win-collection{position:absolute;z-index:1;margin:0;min-height:44px;border:0;border-radius:14px;padding:6px 12px;background:#e4efd8;color:#276c5d;box-shadow:none;font-size:clamp(14px,1.8vw,19px)}
  #win-collection[hidden]{display:none}
  #journey{width:min(940px,calc(100% - 32px));max-width:none;max-height:calc(100dvh - 32px);padding:0;border:1px solid #fffaf0d9;border-radius:30px;color:#195961;background:#fff8e9f5;box-shadow:0 22px 80px #103b4266;font-family:Iskra,Nunito,sans-serif;overflow:hidden}
  #journey::backdrop{background:#0d343d70;backdrop-filter:blur(3px)}
  .journey-shell{max-height:calc(100dvh - 34px);display:flex;flex-direction:column;padding:20px 26px 16px;gap:12px}
  .journey-head{display:flex;align-items:center;gap:16px}
  .journey-head div{flex:1;min-width:0}
  .journey-eyebrow{font-size:12px;font-weight:900;letter-spacing:1.8px;color:#8a662c;text-transform:uppercase}
  #journey h2{font-size:clamp(24px,3.5vw,30px);line-height:1.1;margin:3px 0;font-weight:950}
  #journey-description{font-size:14px;line-height:1.3;margin:0;color:#52746a}
  .journey-close{min-width:52px;min-height:52px;padding:0;border:1px solid #21625c26;border-radius:18px;background:#f6eedf;box-shadow:none;color:#245f5d;font-size:30px;line-height:1}
  .journey-tabs{display:flex;padding:5px;gap:6px;border-radius:18px;background:#e5e9dca6}
  .journey-tabs button{flex:1;min-height:48px;padding:8px 12px;background:transparent;box-shadow:none;border:0;border-radius:14px;color:#52746a;font-size:17px}
  .journey-tabs button[aria-pressed=true]{background:#fffdf2;color:#195961;box-shadow:0 2px 5px #35685114}
  .journey-rooms{display:flex;gap:8px;flex:none}
  .journey-rooms button{display:flex;align-items:center;justify-content:center;gap:8px;flex:1;min-height:44px;padding:8px 12px;border:1px solid #d4dfc7;border-radius:15px;background:#f3f0e4;box-shadow:none;color:#5b7667;font-size:16px}
  .journey-rooms button[aria-pressed=true]{background:#dceecf;border-color:#76a783;color:#225f50}
  .journey-rooms small{font-size:12px;font-weight:900;color:inherit;white-space:nowrap}
  .journey-body{overflow:auto;overscroll-behavior:contain;min-height:0;padding:3px 3px 8px;margin:-3px -3px -8px;scrollbar-color:#a8bc9f transparent}
  .journey-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .journey-card{position:relative;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:164px;padding:10px 8px 11px;border:1px solid #d4dfc7;border-radius:22px;background:linear-gradient(150deg,#fffdf4,#e6f0d8);box-shadow:0 3px 0 #c9d7bc;color:#1e5d5e;font-size:16px;line-height:1.2;text-align:center}
  .journey-card:disabled{cursor:default;opacity:1;transform:none;box-shadow:0 3px 0 #d9ddd1;background:linear-gradient(150deg,#f5f2e8,#e5e8df);color:#687d74}
  .journey-card[data-selected]{border:3px solid #328d71;padding:8px 6px 9px;box-shadow:0 3px 0 #27785f;background:linear-gradient(150deg,#fffdf4,#d7efd6)}
  .journey-card[data-current]{border:3px solid #dfa437;padding:8px 6px 9px;background:linear-gradient(150deg,#fffdf4,#ffebba);box-shadow:0 3px 0 #c58f2c}
  .journey-card canvas{width:68px;height:68px;object-fit:contain;filter:drop-shadow(0 4px 3px #685e2829);flex:none}
  .journey-card:disabled canvas{filter:grayscale(.75) opacity(.5);}
  .journey-number{position:absolute;top:12px;left:12px;display:grid;place-content:center;min-width:28px;height:28px;padding:0 5px;border-radius:10px;background:#fffdf4;font-size:14px;font-weight:950;box-shadow:0 1px 4px #335c4320}
  .journey-card strong{font-weight:950;max-width:100%;font-size:16px}
  .journey-card small{font-size:13px;color:#607a65;font-weight:800;line-height:1.25}
  .journey-card .journey-state{font-size:13px;color:#98661e;font-weight:950;margin-top:3px}
  .journey-card[data-selected] .journey-state{color:#21724f}
  .journey-bottom{display:flex;align-items:center;gap:14px;justify-content:space-between;min-height:50px}
  #journey-summary{font-size:14px;line-height:1.3;font-weight:850;color:#547765;margin:0;max-width:54%}
  #journey-action{padding:10px 20px;min-height:48px;font-size:16px;border-radius:16px;white-space:nowrap}
  #journey-action:disabled{background:#e8e9df;border-color:#d2d8c5;box-shadow:none;color:#74816c;cursor:default}
  @media(max-width:650px){
    #journey{width:calc(100% - 20px);max-height:calc(100dvh - 20px);border-radius:24px}
    .journey-shell{max-height:calc(100dvh - 22px);padding:14px 14px 12px;gap:10px}
    .journey-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .journey-card{min-height:140px;padding:8px 6px;gap:3px;border-radius:18px}
    .journey-card[data-selected],.journey-card[data-current]{padding:8px 4px}
    .journey-card canvas{width:54px;height:54px}
    .journey-card strong{font-size:14px}.journey-card small,.journey-card .journey-state{font-size:12px}
    .journey-number{left:8px;top:8px;min-width:24px;height:24px;font-size:12px;border-radius:8px}
    #journey-description{font-size:12px}.journey-eyebrow{font-size:10px;letter-spacing:1.2px}
    .journey-rooms button{font-size:14px;padding:8px 5px;gap:5px}.journey-rooms small{font-size:11px}
    #journey-summary{font-size:12px}#journey-action{font-size:14px;padding:10px 14px}
  }
  @media(hover:hover) and (pointer:fine){.journey-card:not(:disabled):hover{background:#fff3cd}.journey-close:hover{background:#e4e8d9}}
  `;
  document.head.appendChild(style);
  function node(tag,props={},children=[]){
    const el=document.createElement(tag);for(const [key,value]of Object.entries(props)){
      if(key==='text')el.textContent=value;else if(key==='class')el.className=value;else el.setAttribute(key,value);
    }for(const child of children)el.appendChild(child);return el;
  }
  window.JOURNEY={init({state,save,clearInput,notice,assetURL=(url)=>url}){
    const stage=document.getElementById('stage'),canvas=document.getElementById('c');
    const opener=node('button',{id:'journey-open',type:'button','aria-label':'Открыть карту поисков и коллекцию','aria-haspopup':'dialog'});
    const dialog=node('dialog',{id:'journey','aria-labelledby':'journey-title','aria-describedby':'journey-description'});
    const close=node('button',{class:'journey-close',type:'button','aria-label':'Вернуться к поиску',text:'×'});
    const title=node('h2',{id:'journey-title',text:'Маленькие открытия'});
    const description=node('p',{id:'journey-description',text:'Две комнаты. Двенадцать подарков Искре.'});
    const head=node('header',{class:'journey-head'},[node('div',{},[node('span',{class:'journey-eyebrow',text:'Приключение Искры'}),title,description]),close]);
    const rooms=node('nav',{class:'journey-rooms','aria-label':'Комнаты приключения'});
    const tabs=node('nav',{class:'journey-tabs','aria-label':'Разделы приключения'});
    const levels=node('button',{type:'button','aria-pressed':'true',text:'Поиски'}),collection=node('button',{type:'button','aria-pressed':'false',text:'Мои призы'});
    tabs.append(levels,collection);
    const grid=node('div',{class:'journey-grid'}),body=node('div',{class:'journey-body'},[grid]);
    const summary=node('p',{id:'journey-summary'}),action=node('button',{id:'journey-action',type:'button'});
    dialog.appendChild(node('div',{class:'journey-shell'},[head,rooms,tabs,body,node('footer',{class:'journey-bottom'},[summary,action])]));
    const winCollection=node('button',{id:'win-collection',type:'button',text:'Мои призы ›',hidden:''});
    stage.append(opener,winCollection,dialog);
    let section='levels',selectedRoom=SIM.room(state()).id,revision=-1,lastWin=-1,positionKey='';
    const atlases=new Map();
    function atlasFor(texture){
      if(atlases.has(texture))return atlases.get(texture);
      const atlas=new Image();atlases.set(texture,atlas);
      atlas.onload=()=>{if(dialog.open)render();};
      atlas.onerror=()=>{atlas.onerror=null;atlas.src=assetURL('assets/'+texture+'.png');};
      atlas.src=assetURL('assets/'+texture+'.webp');return atlas;
    }
    function picture(face){
      const cv=node('canvas',{width:200,height:200,'aria-hidden':'true'});
      const atlas=atlasFor(SIM.FACES[face].texture||'toys');
      const draw=()=>{const r=SIM.FACES[face].rect,scale=Math.min(174/r[2],174/r[3]);cv.getContext('2d').drawImage(atlas,...r,(200-r[2]*scale)/2,(200-r[3]*scale)/2,r[2]*scale,r[3]*scale);};
      if(atlas.complete&&atlas.naturalWidth)draw();return cv;
    }
    function dismiss(){if(dialog.open)dialog.close();clearInput();canvas.focus({preventScroll:true});}
    function open(view='levels'){
      clearInput();section=view;selectedRoom=SIM.room(state()).id;render();if(!dialog.open)dialog.showModal();close.focus({preventScroll:true});
    }
    function chooseLevel(number){
      const S=state();if(number!==S.level||S.mode==='win'){if(!SIM.startLevel(S,number,S.mode==='win'&&number===S.level))return;save();}
      dismiss();
    }
    function render(){
      const S=state(),room=SIM.ROOMS.find(r=>r.id===selectedRoom)||SIM.room(S),roomLevels=SIM.LEVELS.map((level,i)=>({level,i})).filter(o=>o.level.room===room.id),trophies=SIM.collection(S),roomTrophies=trophies.filter(t=>SIM.LEVELS[t.level-1].room===room.id),earned=roomTrophies.filter(o=>o.unlocked).length,done=roomLevels.filter(o=>S.progress.completed[o.i]).length,unlocked=SIM.roomUnlocked(S,room.id);
      rooms.replaceChildren();
      for(const region of SIM.ROOMS){
        const count=SIM.LEVELS.filter((level,i)=>level.room===region.id&&S.progress.completed[i]).length;
        const available=SIM.roomUnlocked(S,region.id),button=node('button',{type:'button','data-room':region.id,'aria-pressed':String(region.id===room.id),'aria-label':region.name+(available?'':' — откроется после поиска 6')},[node('span',{text:region.name}),node('small',{text:available?count+' / 6':'После 6'})]);
        button.addEventListener('click',()=>{selectedRoom=region.id;render();rooms.querySelector('[data-room="'+region.id+'"]').focus({preventScroll:true});});rooms.appendChild(button);
      }
      description.textContent=unlocked?room.name+' · шесть поисков и шесть призов.':'Сад откроется после поиска 6. Здесь можно посмотреть подарки.';
      levels.setAttribute('aria-pressed',String(section==='levels'));collection.setAttribute('aria-pressed',String(section==='collection'));
      collection.textContent='Мои призы · '+earned;grid.replaceChildren();
      if(section==='levels')roomLevels.forEach(({level,i})=>{
        const available=SIM.levelUnlocked(S,i),completed=S.progress.completed[i],current=i===S.level,attempt=S.progress.attempts&&S.progress.attempts[i],partial=current?S.count:attempt?attempt.found.length:0;
        const card=node('button',{type:'button',class:'journey-card','data-level':i,'aria-label':'Поиск '+(i+1)+'. '+level.name+'. '+(available?completed?'Пройден':current?'Продолжить':'Играть':'Откроется после поиска '+i)},[
          node('span',{class:'journey-number',text:completed?'✓':String(i+1)}),picture(SIM.TROPHIES[i].face),node('strong',{text:level.name}),
          node('small',{text:level.targets.length+' предметов · подарок'}),
          node('span',{class:'journey-state',text:!available?'После поиска '+i:current?(S.mode==='win'?'Пройден · сыграть ещё':'Продолжить · '+S.count+' / '+S.total):completed?'Пройден · сыграть ещё':partial?'Продолжить · '+partial+' / '+level.targets.length:'Начать поиск'})]);
        if(!available)card.disabled=true;if(current)card.setAttribute('data-current','');
        card.addEventListener('click',()=>chooseLevel(i));grid.appendChild(card);
      });
      else roomTrophies.forEach((t)=>{
        const card=node('button',{type:'button',class:'journey-card','data-trophy':t.id,'aria-pressed':String(t.selected),'aria-label':t.name+'. '+(t.unlocked?t.selected?'Рядом с Искрой':'Поставить рядом с Искрой':'Пройди поиск '+t.level)},[
          node('span',{class:'journey-number',text:t.unlocked?'✓':String(t.level)}),picture(t.face),node('strong',{text:t.name}),
          node('small',{text:t.unlocked?'Твой подарок Искре':'За поиск '+t.level}),node('span',{class:'journey-state',text:t.selected?'Рядом с Искрой':t.unlocked?'Поставить рядом с Искрой':'Пока закрыт'})]);
        if(!t.unlocked)card.disabled=true;if(t.selected)card.setAttribute('data-selected','');
        card.addEventListener('click',()=>{if(SIM.selectTrophy(S,t.id)){if(S.mode==='win')SIM.startLevel(S,(S.level+1)%SIM.LEVELS.length);save();dismiss();notice('Приз рядом с Искрой. Коснись его!');}});grid.appendChild(card);
      });
      summary.textContent=section==='levels'?(unlocked?'В комнате пройдено '+done+' из 6. За каждый поиск — подарок.':'Пройди поиск 6 в мастерской, чтобы открыть сад.'):'В этой комнате собрано '+earned+' из 6. Всего призов '+trophies.filter(t=>t.unlocked).length+' из '+trophies.length+'.';
      const selected=trophies.find(t=>t.selected);
      action.textContent=section==='levels'?'Продолжить поиск':selected?'Убрать приз':'Выбери открытый приз';action.disabled=section==='collection'&&!selected;
    }
    opener.addEventListener('click',()=>open());close.addEventListener('click',dismiss);
    winCollection.addEventListener('click',()=>open('collection'));
    levels.addEventListener('click',()=>{section='levels';render();});collection.addEventListener('click',()=>{section='collection';render();});
    action.addEventListener('click',()=>{if(section==='collection'){SIM.selectTrophy(state(),null);save();render();}else dismiss();});
    dialog.addEventListener('cancel',()=>{clearInput();});dialog.addEventListener('close',()=>{clearInput();canvas.focus({preventScroll:true});});
    function update(){
      const a=SCENE.layout(),r=canvas.getBoundingClientRect(),s=stage.getBoundingClientRect(),box=a.title;
      const key=[a.W,a.H,r.x,r.y,r.width,r.height].join(':');
      if(key!==positionKey){positionKey=key;Object.assign(opener.style,{left:(r.left-s.left+box.x/a.W*r.width)+'px',top:(r.top-s.top+box.y/a.H*r.height)+'px',width:box.w/a.W*r.width+'px',height:box.h/a.H*r.height+'px'});}
      const S=state();if(S.revision!==revision){revision=S.revision;if(dialog.open)render();}
      winCollection.hidden=S.mode!=='win';
      if(S.mode==='win'){
        const w=320,h=72,x=a.W/2-w/2,y=a.H/2+(a.portrait?70:80);
        Object.assign(winCollection.style,{left:(r.left-s.left+x/a.W*r.width)+'px',top:(r.top-s.top+y/a.H*r.height)+'px',width:w/a.W*r.width+'px',height:h/a.H*r.height+'px'});
      }
      if(S.mode==='win'&&S.reward&&S.reward.first&&lastWin!==S.level){lastWin=S.level;opener.setAttribute('aria-label','Новый приз! Открыть карту и коллекцию');}
      if(S.mode!=='win'){lastWin=-1;opener.setAttribute('aria-label','Открыть карту поисков и коллекцию');}
    }
    return{update,open,dismiss,isOpen:()=>dialog.open};
  }};
})();
