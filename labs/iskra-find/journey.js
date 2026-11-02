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
  .journey-tabs button{flex:1;min-width:0;min-height:48px;padding:8px 6px;background:transparent;box-shadow:none;border:0;border-radius:14px;color:#52746a;font-size:16px;white-space:nowrap}
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
  .journey-rooms[hidden]{display:none}
  .journey-grid[data-view=care],.journey-grid[data-view=day]{display:flex;flex-direction:column;gap:12px}
  .friend-card{padding:16px 18px;border:1px solid #d3ddbd;border-radius:20px;background:linear-gradient(140deg,#fff8df,#e8f2d9)}
  .friend-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px;font-size:18px;font-weight:950}
  .friend-head small{font-size:13px;color:#6b7758;font-weight:850;white-space:nowrap}
  .friend-card p{font-size:14px;line-height:1.35;margin:8px 0 0;color:#536f5c}
  .journey-meter{height:10px;border-radius:8px;overflow:hidden;background:#d4dfc8}
  .journey-meter span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#54ab89,#b0d563)}
  .need-list,.care-actions,.daily-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .need-item{padding:10px 12px;border-radius:16px;background:#eff2e5}
  .need-item div:first-child{display:flex;justify-content:space-between;gap:6px;font-size:14px;font-weight:900;margin-bottom:7px}
  .need-item small{font-size:12px;color:#6c7d65;font-weight:850}
  .care-card{min-height:145px;gap:5px}
  .care-card canvas{width:64px;height:64px}
  .care-card strong{font-size:16px}.care-card small{font-size:12px}
  .care-note{font-size:14px;line-height:1.35;margin:0;color:#557363;text-align:center}
  .daily-task{display:flex;flex-direction:column;align-items:center;gap:8px;min-width:0;padding:14px 12px;border:1px solid #d5dfc9;border-radius:20px;background:#f3f5e9;text-align:center}
  .daily-task canvas{width:50px;height:50px;object-fit:contain;filter:drop-shadow(0 3px 3px #685e2820)}
  .daily-task strong{display:block;font-size:16px;line-height:1.2;font-weight:950}
  .daily-task p{font-size:13px;line-height:1.3;margin:5px 0 0;color:#647963;font-weight:850}
  .daily-task button{width:100%;min-height:44px;padding:8px 7px;font-size:14px;border-radius:14px;box-shadow:0 3px 0 #bc8733}
  .daily-task button:disabled{background:#e3ead9;border:1px solid #d1ddc2;box-shadow:none;color:#527760;cursor:default}
  .daily-chest{display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid #e6c46a;border-radius:20px;background:linear-gradient(120deg,#fff5d0,#f1f4de)}
  .daily-chest canvas{width:68px;height:68px;flex:none;filter:drop-shadow(0 3px 3px #685e2820)}
  .daily-chest div{min-width:0;flex:1}.daily-chest strong{display:block;font-size:18px;font-weight:950}
  .daily-chest p{font-size:14px;line-height:1.35;margin:5px 0 0;color:#617259}
  .daily-chest button{min-height:48px;padding:10px 16px;border-radius:16px;font-size:15px;white-space:nowrap;flex:none}
  .daily-chest button:disabled{background:#e5e7d9;color:#788266;border-color:#d0d6bf;box-shadow:none;cursor:default}
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
    .journey-tabs button{font-size:14px;padding:8px 4px}
    .friend-card{padding:12px 13px;border-radius:17px}.friend-head{font-size:16px}.friend-head small{font-size:12px}
    .friend-card p,.care-note{font-size:12px}.need-list,.care-actions{gap:8px}
    .need-item{padding:8px;border-radius:12px}.need-item div:first-child{display:block;font-size:11px}.need-item div:first-child span{display:block}.need-item small{display:block;margin-top:3px;font-size:10px;white-space:nowrap}
    .care-card{min-height:135px;padding:10px 4px}.care-card canvas{width:48px;height:48px}.care-card strong{font-size:13px}.care-card small{font-size:11px}
    .daily-list{grid-template-columns:1fr;gap:9px}.daily-task{display:grid;grid-template-columns:43px minmax(0,1fr) 93px;align-items:center;gap:8px;padding:10px;text-align:left;min-height:91px;border-radius:16px}
    .daily-task canvas{width:43px;height:43px}.daily-task strong{font-size:13px}.daily-task p{font-size:12px}.daily-task button{font-size:12px;padding:8px 5px}
    .daily-chest{gap:10px;padding:12px;border-radius:17px;flex-wrap:wrap}.daily-chest canvas{width:48px;height:48px}.daily-chest strong{font-size:16px}.daily-chest p{font-size:12px}
    .daily-chest button{width:100%;font-size:14px;min-height:44px}
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
    const opener=node('button',{id:'journey-open',type:'button','aria-label':'Открыть карту, заботу и задания дня','aria-haspopup':'dialog'});
    const dialog=node('dialog',{id:'journey','aria-labelledby':'journey-title','aria-describedby':'journey-description'});
    const close=node('button',{class:'journey-close',type:'button','aria-label':'Вернуться к поиску',text:'×'});
    const title=node('h2',{id:'journey-title',text:'Маленькие открытия'});
    const description=node('p',{id:'journey-description',text:'Две комнаты. Двенадцать подарков Искре.'});
    const head=node('header',{class:'journey-head'},[node('div',{},[node('span',{class:'journey-eyebrow',text:'Приключение Искры'}),title,description]),close]);
    const rooms=node('nav',{class:'journey-rooms','aria-label':'Комнаты приключения'});
    const tabs=node('nav',{class:'journey-tabs','aria-label':'Разделы приключения'});
    const levels=node('button',{type:'button','data-section':'levels','aria-pressed':'true',text:'Поиски'}),collection=node('button',{type:'button','data-section':'collection','aria-pressed':'false',text:'Призы'});
    const careTab=node('button',{type:'button','data-section':'care','aria-pressed':'false',text:'Забота'}),dayTab=node('button',{type:'button','data-section':'day','aria-pressed':'false',text:'День'});
    tabs.append(levels,collection,careTab,dayTab);
    const grid=node('div',{class:'journey-grid'}),body=node('div',{class:'journey-body'},[grid]);
    const summary=node('p',{id:'journey-summary'}),action=node('button',{id:'journey-action',type:'button'});
    const modalStatus=node('p',{class:'sr-only',role:'status','aria-live':'polite'});
    dialog.appendChild(node('div',{class:'journey-shell'},[head,rooms,tabs,body,node('footer',{class:'journey-bottom'},[summary,action]),modalStatus]));
    const winCollection=node('button',{id:'win-collection',type:'button',text:'Мои призы ›',hidden:''});
    stage.append(opener,winCollection,dialog);
    let section='levels',selectedRoom=SIM.room(state()).id,revision=-1,lastWin=-1,positionKey='',careKey='';
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
    function say(message){modalStatus.textContent=message;notice(message);}
    function open(view='levels'){
      clearInput();section=['levels','collection','care','day'].includes(view)?view:'levels';selectedRoom=SIM.room(state()).id;render();if(!dialog.open)dialog.showModal();close.focus({preventScroll:true});
    }
    function chooseLevel(number){
      const S=state();if(number!==S.level||S.mode==='win'){if(!SIM.startLevel(S,number,S.mode==='win'&&number===S.level))return;save();}
      dismiss();
    }
    function continueSearch(){
      const S=state();if(S.mode==='win')SIM.startLevel(S,(S.level+1)%SIM.LEVELS.length);save();dismiss();
    }
    function showSection(view){section=view;render();}
    function meter(value,label){
      const number=Math.max(0,Math.min(100,Number(value)||0)),bar=node('div',{class:'journey-meter',role:'progressbar','aria-label':label,'aria-valuemin':0,'aria-valuemax':100,'aria-valuenow':Math.round(number)}),fill=node('span');
      fill.style.width=number+'%';bar.appendChild(fill);return bar;
    }
    function beginCare(kind){
      const S=state(),status=SIM.careStatus(S),owned=SIM.collection(S).filter(t=>t.unlocked),selected=owned.find(t=>t.selected);
      if(kind==='play'&&!selected){
        if(owned.length){section='collection';selectedRoom=SIM.LEVELS[owned[0].level-1].room;render();say('Выбери подарок, чтобы поиграть с Искрой.');}
        else{chooseLevel(0);say('Пройди первый поиск — получишь игрушку для Искры.');}
        return;
      }
      if(kind==='feed'&&!status.foodUnlocked){showSection('day');say('Открой сундук дня — в нём ягодное угощение.');return;}
      if(status.active){say('Искра ещё занята. Через пару секунд можно продолжить.');return;}
      const remaining=status.actions[kind]?.remaining||0;
      if(remaining>0){say('Ещё '+Math.ceil(remaining)+' с — и можно снова.');return;}
      if(S.mode==='win')SIM.startLevel(S,(S.level+1)%SIM.LEVELS.length);
      if(SIM.care(S,kind)){save();dismiss();say(kind==='feed'?'Ягодное угощение для Искры!':kind==='rest'?'Немного отдыха вместе с Искрой.':'Искра играет с твоим подарком!');}
      else{render();say('Сейчас действие недоступно. Можно продолжить поиск.');}
    }
    function renderCare(S){
      const friendship=SIM.friendship(S),status=SIM.careStatus(S),selected=SIM.collection(S).find(t=>t.selected&&t.unlocked),next=friendship.nextAt;
      const xpText=next?friendship.xp+' / '+next+' опыта':friendship.xp+' опыта';
      const benefit=next?(friendship.level===1?'Ещё '+Math.max(0,next-friendship.xp)+' опыта — подсказка будет готова за 6 с.':'Ещё '+Math.max(0,next-friendship.xp)+' опыта — подсветка продлится 5 с.'):'Дружба выросла! Подсказка готова за 6 с и подсвечивает предмет 5 с.';
      grid.appendChild(node('section',{class:'friend-card','aria-label':'Развитие дружбы'},[node('div',{class:'friend-head'},[node('strong',{text:'Дружба '+friendship.level}),node('small',{text:xpText})]),meter((friendship.progress||0)*100,next?'До следующего уровня дружбы':'Развитие дружбы'),node('p',{text:benefit})]));
      const needs=node('div',{class:'need-list'});
      for(const [id,label]of [['food','Сытость'],['fun','Настроение'],['rest','Отдых']]){
        const value=Math.round(status.needs[id]);needs.appendChild(node('section',{class:'need-item'},[node('div',{},[node('span',{text:label}),node('small',{text:value+' / 100'})]),meter(value,label)]));
      }
      grid.appendChild(needs);
      const actions=node('div',{class:'care-actions'}),defs=[['play','Поиграть',selected?selected.face:0,selected?'+18 настроения':'Выбрать игрушку'],['rest','Отдохнуть',22,'+18 отдыха'],['feed','Угостить',7,status.foodUnlocked?'+18 сытости':'За сундук дня']];
      for(const [kind,label,face,effect]of defs){
        const model=status.actions[kind],remaining=Math.ceil(model?.remaining||0),busy=!!status.active,small=busy?'Искра занята…':remaining>0?'Ещё '+remaining+' с':effect;
        const button=node('button',{type:'button',class:'journey-card care-card','data-care':kind,'aria-label':label+'. '+small},[picture(face),node('strong',{text:label}),node('small',{text:small})]);
        button.disabled=busy||remaining>0;button.addEventListener('click',()=>beginCare(kind));actions.appendChild(button);
      }
      grid.append(actions,node('p',{class:'care-note',text:selected?'Играем с подарком «'+selected.name+'». Забота и находки развивают дружбу.':'Первый поиск подарит игрушку. Выбери её в «Призах» — и поиграем!'}));
      summary.textContent=status.foodUnlocked?'Ягода доступна после сундука дня. Выбери действие — и Искра откликнется.':'Сундук за три задания дня откроет ягодное угощение.';
      action.textContent='Продолжить поиск';action.disabled=false;
    }
    function renderDay(S){
      const today=SIM.daily(S),status=SIM.careStatus(S),selected=SIM.collection(S).find(t=>t.selected&&t.unlocked),list=node('div',{class:'daily-list'}),claimed=today.tasks.filter(t=>t.claimed).length;
      for(const task of today.tasks){
        const face=task.id==='rest1'?22:task.id==='play1'?(selected?selected.face:0):SIM.room(S).faces[0],done=!!task.claimed,ready=!!task.ready;
        const button=node('button',{type:'button','data-task':task.id,text:done?'Получено':ready?'Забрать · +5':task.id==='find8'?'К поиску':'К заботе'});
        button.disabled=done;button.addEventListener('click',()=>{
          if(ready){if(SIM.claimDaily(S,task.id)){save();render();dayTab.focus({preventScroll:true});say('Награда получена: +5 опыта дружбы.');}}
          else if(task.id==='find8')continueSearch();else showSection('care');
        });
        list.appendChild(node('article',{class:'daily-task','data-quest':task.id},[picture(face),node('div',{},[node('strong',{text:task.label}),node('p',{text:Math.min(task.count,task.target)+' / '+task.target+(done?' · награда получена':ready?' · награда готова':' · +5 опыта')})]),button]));
      }
      const chestButton=node('button',{type:'button','data-chest':'',text:today.chestClaimed?'Угостить':today.chestReady?'Открыть сундук':'Награды '+claimed+' / 3'});
      chestButton.disabled=!today.chestClaimed&&!today.chestReady;
      chestButton.addEventListener('click',()=>{
        if(today.chestClaimed){beginCare('feed');return;}
        if(SIM.claimDailyChest(S)){save();render();dialog.querySelector('[data-chest]')?.focus({preventScroll:true});say(status.foodUnlocked?'Сундук открыт: +15 опыта дружбы!':'Сундук открыт! Ягодное угощение теперь доступно Искре.');}
      });
      const chestText=today.chestClaimed?'Сегодняшний сундук получен. Ягода для Искры доступна в заботе.':'Забери все три награды: получишь +15 опыта и откроешь ягодное угощение.';
      grid.append(list,node('section',{class:'daily-chest'},[picture(7),node('div',{},[node('strong',{text:'Сундук дня'}),node('p',{text:chestText})]),chestButton]));
      summary.textContent='Получено '+claimed+' из 3 наград. Открыто сундуков: '+today.chestsTotal+'.';
      action.textContent='К заботе';action.disabled=false;
    }
    function render(){
      const S=state(),room=SIM.ROOMS.find(r=>r.id===selectedRoom)||SIM.room(S),roomLevels=SIM.LEVELS.map((level,i)=>({level,i})).filter(o=>o.level.room===room.id),trophies=SIM.collection(S),roomTrophies=trophies.filter(t=>SIM.LEVELS[t.level-1].room===room.id),earned=roomTrophies.filter(o=>o.unlocked).length,done=roomLevels.filter(o=>S.progress.completed[o.i]).length,unlocked=SIM.roomUnlocked(S,room.id);
      const personal=section==='care'||section==='day';rooms.hidden=personal;
      title.textContent=section==='care'?'Забота об Искре':section==='day'?'День с Искрой':'Маленькие открытия';
      rooms.replaceChildren();
      for(const region of SIM.ROOMS){
        const count=SIM.LEVELS.filter((level,i)=>level.room===region.id&&S.progress.completed[i]).length;
        const available=SIM.roomUnlocked(S,region.id),button=node('button',{type:'button','data-room':region.id,'aria-pressed':String(region.id===room.id),'aria-label':region.name+(available?'':' — откроется после поиска 6')},[node('span',{text:region.name}),node('small',{text:available?count+' / 6':'После 6'})]);
        button.addEventListener('click',()=>{selectedRoom=region.id;render();rooms.querySelector('[data-room="'+region.id+'"]').focus({preventScroll:true});});rooms.appendChild(button);
      }
      description.textContent=section==='care'?'Играй, отдыхай и угощай. Дружба улучшает подсказки.':section==='day'?'Три небольших задания — и подарок для Искры.':unlocked?room.name+' · раскрывай тайники и ищи по силуэтам.':'Сад откроется после поиска 6. Здесь можно посмотреть подарки.';
      for(const button of [levels,collection,careTab,dayTab])button.setAttribute('aria-pressed',String(button.dataset.section===section));
      const today=SIM.daily?SIM.daily(S):null,ready=today?today.tasks.filter(t=>t.ready&&!t.claimed).length+(today.chestReady?1:0):0;
      dayTab.textContent=ready?'День · '+ready:'День';collection.textContent='Призы';
      careTab.disabled=typeof SIM.careStatus!=='function';dayTab.disabled=typeof SIM.daily!=='function';
      grid.replaceChildren();grid.dataset.view=section;
      if(section==='care'){renderCare(S);return;}
      if(section==='day'){renderDay(S);return;}
      if(section==='levels')roomLevels.forEach(({level,i})=>{
        const available=SIM.levelUnlocked(S,i),completed=S.progress.completed[i],current=i===S.level,attempt=S.progress.attempts&&S.progress.attempts[i],partial=current?S.count:attempt?attempt.found.length:0;
        const card=node('button',{type:'button',class:'journey-card','data-level':i,'aria-label':'Поиск '+(i+1)+'. '+level.name+'. '+(available?completed?'Пройден':current?'Продолжить':'Играть':'Откроется после поиска '+i)},[
          node('span',{class:'journey-number',text:completed?'✓':String(i+1)}),picture(SIM.TROPHIES[i].face),node('strong',{text:level.name}),
          node('small',{text:level.targets.length+' предметов · '+(level.searchStyle==='silhouette'?'силуэты':'тайники')}),
          node('span',{class:'journey-state',text:!available?'После поиска '+i:current?(S.mode==='win'?'Пройден · сыграть ещё':'Продолжить · '+S.count+' / '+S.total):completed?'Пройден · сыграть ещё':partial?'Продолжить · '+partial+' / '+level.targets.length:'Начать поиск'})]);
        if(!available)card.disabled=true;if(current)card.setAttribute('data-current','');
        card.addEventListener('click',()=>chooseLevel(i));grid.appendChild(card);
      });
      else roomTrophies.forEach((t)=>{
        const card=node('button',{type:'button',class:'journey-card','data-trophy':t.id,'aria-pressed':String(t.selected),'aria-label':t.name+'. '+(t.unlocked?t.selected?'Рядом с Искрой':'Поставить рядом с Искрой':'Пройди поиск '+t.level)},[
          node('span',{class:'journey-number',text:t.unlocked?'✓':String(t.level)}),picture(t.face),node('strong',{text:t.name}),
          node('small',{text:t.unlocked?'Твой подарок Искре':'За поиск '+t.level}),node('span',{class:'journey-state',text:t.selected?'Рядом с Искрой':t.unlocked?'Поставить рядом с Искрой':'Пока закрыт'})]);
        if(!t.unlocked)card.disabled=true;if(t.selected)card.setAttribute('data-selected','');
        card.addEventListener('click',()=>{if(SIM.selectTrophy(S,t.id)){if(S.mode==='win')SIM.startLevel(S,(S.level+1)%SIM.LEVELS.length);save();dismiss();say('Приз рядом с Искрой. Коснись его — поиграем!');}});grid.appendChild(card);
      });
      summary.textContent=section==='levels'?(unlocked?'В комнате пройдено '+done+' из 6. За каждый поиск — подарок.':'Пройди поиск 6 в мастерской, чтобы открыть сад.'):'В этой комнате собрано '+earned+' из 6. Всего призов '+trophies.filter(t=>t.unlocked).length+' из '+trophies.length+'.';
      const selected=trophies.find(t=>t.selected);
      action.textContent=section==='levels'?'Продолжить поиск':selected?'Убрать приз':'Выбери открытый приз';action.disabled=section==='collection'&&!selected;
    }
    opener.addEventListener('click',()=>open());close.addEventListener('click',dismiss);
    winCollection.addEventListener('click',()=>open('collection'));
    levels.addEventListener('click',()=>{section='levels';render();});collection.addEventListener('click',()=>{section='collection';render();});
    careTab.addEventListener('click',()=>showSection('care'));dayTab.addEventListener('click',()=>showSection('day'));
    action.addEventListener('click',()=>{if(section==='collection'){SIM.selectTrophy(state(),null);save();render();}else if(section==='day')showSection('care');else if(section==='care')continueSearch();else dismiss();});
    dialog.addEventListener('cancel',()=>{clearInput();});dialog.addEventListener('close',()=>{clearInput();canvas.focus({preventScroll:true});});
    function update(){
      const a=SCENE.layout(),r=canvas.getBoundingClientRect(),s=stage.getBoundingClientRect(),box=a.title;
      const key=[a.W,a.H,r.x,r.y,r.width,r.height].join(':');
      if(key!==positionKey){positionKey=key;Object.assign(opener.style,{left:(r.left-s.left+box.x/a.W*r.width)+'px',top:(r.top-s.top+box.y/a.H*r.height)+'px',width:box.w/a.W*r.width+'px',height:box.h/a.H*r.height+'px'});}
      const S=state(),status=SIM.careStatus&&dialog.open&&section==='care'?SIM.careStatus(S):null;
      const nextCareKey=status?[status.active?.kind||'',...['play','rest','feed'].map(kind=>Math.ceil(status.actions[kind]?.remaining||0))].join(':'):'';
      if(S.revision!==revision||nextCareKey!==careKey){revision=S.revision;careKey=nextCareKey;if(dialog.open)render();}
      winCollection.hidden=S.mode!=='win';
      if(S.mode==='win'){
        const w=320,h=72,x=a.W/2-w/2,y=a.H/2+(a.portrait?70:80);
        Object.assign(winCollection.style,{left:(r.left-s.left+x/a.W*r.width)+'px',top:(r.top-s.top+y/a.H*r.height)+'px',width:w/a.W*r.width+'px',height:h/a.H*r.height+'px'});
      }
      if(S.mode==='win'&&S.reward&&S.reward.first&&lastWin!==S.level){lastWin=S.level;opener.setAttribute('aria-label','Новый приз! Открыть карту, заботу и задания дня');}
      if(S.mode!=='win'){lastWin=-1;opener.setAttribute('aria-label','Открыть карту, заботу и задания дня');}
    }
    return{update,open,dismiss,isOpen:()=>dialog.open};
  }};
})();
