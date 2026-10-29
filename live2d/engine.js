/* LOSTAR half-body "Live2D-style" rig — layered PNG/WebP parts driven by parameters.
   Sources (priority): webcam face tracking (MediaPipe, on demand) > pointer follow > idle motion. */
(function(){
'use strict';
var TAU=Math.PI*2, clamp=function(v,a,b){return v<a?a:v>b?b:v;}, lerp=function(a,b,t){return a+(b-a)*t;};
function load(src){return new Promise(function(res,rej){var i=new Image();i.decoding='async';i.onload=function(){res(i)};i.onerror=function(){rej(new Error('img '+src))};i.src=src;});}

function create(canvas,opt){
  opt=opt||{}; var base=opt.base||'live2d/';
  return fetch(base+'rig.json').then(function(r){return r.json();}).then(function(rig){
    return Promise.all(rig.layers.map(function(l){return load(base+l.id);})).then(function(imgs){
      rig.layers.forEach(function(l,i){l.img=imgs[i]; l.ph=(i*2.399)%TAU; l.ang=0; l.vel=0; l.sx=l.px!=null?l.px:l.x+l.w/2; l.sy=l.py!=null?l.py:(l.pv==='t'?l.y+2:l.y+l.h/2);});
      return new Rig(canvas,rig,opt);
    });
  });
}

function Rig(canvas,rig,opt){
  var me=this, ctx=canvas.getContext('2d');
  this.canvas=canvas; this.rig=rig; this.running=false; this.t0=performance.now();
  // target + smoothed params
  var P={yaw:0,pitch:0,roll:0,eyeL:1,eyeR:1,mouth:0,smile:.35,gx:0,gy:0};
  var S={yaw:0,pitch:0,roll:0,eyeL:1,eyeR:1,mouth:0,smile:.35,gx:0,gy:0};
  var prevYaw=0, headVel=0, headVelY=0, prevPitch=0;
  var src={cam:0,pointer:0}; // timestamps of last input
  var ptr={x:0,y:0}, blink={next:2.2,t:-1,dbl:false};
  var react={t:-9}, gz={x:0,y:0,next:0}; // click reaction
  var mouthLayers={}, eyeL=null, eyeR=null;
  rig.layers.forEach(function(l){ if(/^mouth\d$/.test(l.role||'')) mouthLayers[l.role.slice(5)]=l; if(l.role==='eyeL')eyeL=l; if(l.role==='eyeR')eyeR=l; });
  var eyeU={L:{parts:[],iris:[],first:-1},R:{parts:[],iris:[],first:-1}};
  rig.layers.forEach(function(l,i){ var m=/^eye([LR]):(\w+)$/.exec(l.role||''); if(!m) return; var u=eyeU[m[1]]; if(u.first<0)u.first=i;
    if(m[2]==='white')u.white=l; else if(m[2]==='iris')u.iris.push(l); else if(m[2]==='brow')u.brow=l; else u.parts.push(l); });
  ['L','R'].forEach(function(sd){ var u=eyeU[sd]; if(!u.white||!u.iris.length)return; var all=[u.white].concat(u.iris), x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    all.forEach(function(l){x0=Math.min(x0,l.x);y0=Math.min(y0,l.y);x1=Math.max(x1,l.x+l.w);y1=Math.max(y1,l.y+l.h);});
    u.bx=Math.floor(x0)-1;u.by=Math.floor(y0)-1;u.bw=Math.ceil(x1-x0)+3;u.bh=Math.ceil(y1-y0)+3;
    u.mask=document.createElement('canvas');u.mask.width=u.bw;u.mask.height=u.bh;var mc=u.mask.getContext('2d');
    mc.drawImage(u.white.img,u.white.x-u.bx,u.white.y-u.by,u.white.w,u.white.h); mc.drawImage(u.iris[0].img,u.iris[0].x-u.bx,u.iris[0].y-u.by,u.iris[0].w,u.iris[0].h);
    u.oc=document.createElement('canvas');u.oc.width=u.bw;u.oc.height=u.bh;u.octx=u.oc.getContext('2d'); u.ok=true; });
  var PIV=rig.pivot, W=rig.w, H=rig.h, U=(rig.sc||0.5)/0.5;
  var dpr=1, cw=0, ch=0, k=1;
  function resize(){
    var r=canvas.getBoundingClientRect(); dpr=Math.min(window.devicePixelRatio||1,2);
    cw=Math.max(2,Math.round(r.width*dpr)); ch=Math.max(2,Math.round(r.height*dpr));
    if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
    k=Math.min(cw/W,ch/H);
  }
  this.resize=resize;

  // ---- inputs ----
  this.setPointer=function(nx,ny){ptr.x=clamp(nx,-1,1);ptr.y=clamp(ny,-1,1);src.pointer=performance.now();};
  this.feedFace=function(f){ // f: {yaw,pitch,roll,eyeL,eyeR,mouth,smile}
    src.cam=performance.now();
    P.yaw=clamp(f.yaw,-1,1);P.pitch=clamp(f.pitch,-1,1);P.roll=clamp(f.roll,-1,1);
    P.eyeL=f.eyeL;P.eyeR=f.eyeR;P.mouth=clamp(f.mouth,0,1);P.smile=clamp(f.smile,0,1);
    P.gx=f.gx!==undefined?clamp(f.gx,-1,1):P.yaw*.4;P.gy=f.gy!==undefined?clamp(f.gy,-1,1):P.pitch*.4;
  };
  this.react=function(){react.t=performance.now()/1000;};
  this.mode=function(){var n=performance.now(); return n-src.cam<400?'cam':(n-src.pointer<3500?'pointer':'idle');};

  // ---- update ----
  function update(t,dt){
    var n=performance.now(), mode=me.mode();
    if(mode==='pointer'){
      P.yaw=ptr.x*.9; P.pitch=ptr.y*.7; P.roll=ptr.x*.25; P.gx=clamp(ptr.x*1.5,-1,1); P.gy=clamp(ptr.y*1.5,-1,1); P.smile=.4; P.mouth=0;
    }else if(mode==='idle'){
      P.yaw=Math.sin(t*.37)*.22+Math.sin(t*.91)*.06; P.pitch=Math.sin(t*.29+1)*.12; P.roll=Math.sin(t*.43+2)*.1;
      if(t>gz.next){gz.x=(Math.random()*2-1)*.55;gz.y=(Math.random()*2-1)*.25;gz.next=t+1.2+Math.random()*2.6;}
      P.gx=P.yaw*.6+gz.x;P.gy=P.pitch*.6+gz.y;P.smile=.35;P.mouth=0;
    }
    if(mode!=='cam'){ // auto blink
      if(t>blink.next&&blink.t<0){blink.t=t;}
      var o=1;
      if(blink.t>=0){var p=(t-blink.t)/.2; if(p>=1){blink.t=-1;blink.next=t+(blink.dbl?.18:2+Math.random()*4);blink.dbl=!blink.dbl&&Math.random()<.18;o=1;}else o=Math.abs(1-2*p)*.97+.03;}
      P.eyeL=P.eyeR=o;
    }
    var rt=t-react.t; var happy=rt>=0&&rt<1.4;
    if(happy){P.smile=1;P.mouth=Math.max(P.mouth,.0);}
    var a=1-Math.pow(.0008,dt); // ~fast smoothing
    var aSlow=1-Math.pow(.02,dt), aEye=1-Math.pow(.00002,dt);
    S.yaw=lerp(S.yaw,P.yaw,aSlow);S.pitch=lerp(S.pitch,P.pitch,aSlow);S.roll=lerp(S.roll,P.roll,aSlow);
    S.gx=lerp(S.gx,P.gx,a);S.gy=lerp(S.gy,P.gy,a);
    S.eyeL=lerp(S.eyeL,P.eyeL,aEye);S.eyeR=lerp(S.eyeR,P.eyeR,aEye);
    S.mouth=lerp(S.mouth,P.mouth,1-Math.pow(.0003,dt));S.smile=lerp(S.smile,P.smile,a);
    headVel=lerp(headVel,(S.yaw-prevYaw)/Math.max(dt,.001),.25); prevYaw=S.yaw;
    headVelY=lerp(headVelY,(S.pitch-prevPitch)/Math.max(dt,.001),.25); prevPitch=S.pitch;
    me._happy=happy?clamp(1-Math.abs(rt-.35)/1.05,0,1):0; me._hop=happy?Math.sin(clamp(rt/.45,0,1)*Math.PI):0;
  }
  function pickMouth(){
    var o=S.mouth, s=S.smile, id;
    if(me._happy>0.05&&o<.15) id='6';
    else if(o<.07) id=s>.62?'9':(s>.25?'9':'8');
    else if(o<.2) id='4'; else if(o<.38) id='1'; else if(o<.58) id='5'; else if(o<.78) id='2'; else id='3';
    if(o>=.07&&s>.7&&o<.5) id='6';
    return mouthLayers[id]||mouthLayers['9'];
  }

  // ---- draw ----
  function drawLayer(l,x,y,rot,sx,sy,alpha){
    ctx.save();
    ctx.translate(x,y);
    if(rot)ctx.rotate(rot);
    if(sx!==1||sy!==1)ctx.scale(sx,sy);
    if(alpha!==1)ctx.globalAlpha=alpha;
    ctx.drawImage(l.img,-(l.sx-l.x),-(l.sy-l.y),l.w,l.h);
    ctx.restore();
  }
  function drawEyeUnit(u,o,dx,dy){
    if(!u||!u.ok) return;
    ctx.translate(dx,dy);
    var sc=lerp(.07,1,clamp(o,0,1)), py=rig.eyePy||0;
    ctx.save(); ctx.translate(0,py); ctx.scale(1,sc); ctx.translate(0,-py);
    ctx.drawImage(u.white.img,u.white.x,u.white.y,u.white.w,u.white.h);
    var oc=u.octx, gx=S.gx*11*U, gy=S.gy*5*U;
    oc.globalCompositeOperation='source-over'; oc.clearRect(0,0,u.bw,u.bh);
    for(var j=0;j<u.iris.length;j++){var q=u.iris[j]; oc.drawImage(q.img,q.x-u.bx+gx,q.y-u.by+gy,q.w,q.h);}
    oc.globalCompositeOperation='destination-in'; oc.drawImage(u.mask,0,0); oc.globalCompositeOperation='source-over';
    ctx.drawImage(u.oc,u.bx,u.by);
    for(var m=0;m<u.parts.length;m++){var p=u.parts[m]; if(p.bm)ctx.globalCompositeOperation=p.bm; ctx.drawImage(p.img,p.x,p.y,p.w,p.h); if(p.bm)ctx.globalCompositeOperation='source-over';}
    ctx.restore();
    if(u.brow){ctx.drawImage(u.brow.img,u.brow.x,u.brow.y+(1-sc)*1.5*U,u.brow.w,u.brow.h);}
  }
  function render(t){
    ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cw,ch);
    var ox=(cw-W*k)/2, oy=0; // bottom-crop: anchor top
    var breath=Math.sin(t*1.5), bob=breath*1.6*U, bs=1+breath*.0035;
    var yaw=S.yaw, pitch=S.pitch, roll=S.roll*.17; // rad (~10deg)
    var hop=-(me._hop||0)*9*U;
    var PXX=24*U, PXY=14*U;
    // body base: scale about bottom, lean
    var bodyRot=roll*.25+yaw*.015, bodyX=yaw*7*U;
    for(var i=0;i<rig.layers.length;i++){
      var l=rig.layers[i], g=l.g;
      if(l.role&&/^mouth\d$/.test(l.role)){ if(pickMouth()!==l) continue; }
      if(l.role&&/^eye[LR]:/.test(l.role)&&eyeU[l.role[3]].first!==i) continue;
      ctx.setTransform(k,0,0,k,ox,oy);
      // body transform
      ctx.translate(PIV[0]+bodyX,H);ctx.rotate(bodyRot);ctx.scale(1,bs);ctx.translate(-PIV[0],-H+bob+hop*.5);
      var x=l.sx,y=l.sy,rot=0,sx=1,sy=1,dx=0,dy=0;
      if(g==='neck'){
        ctx.translate(PIV[0],PIV[1]);ctx.rotate(roll*.4);ctx.translate(-PIV[0]+yaw*PXX*l.d,-PIV[1]+pitch*PXY*l.d);
      }else if(g==='head'){
        ctx.translate(PIV[0],PIV[1]);ctx.rotate(roll);ctx.translate(-PIV[0],-PIV[1]);
        dx=yaw*PXX*l.d; dy=pitch*PXY*l.d+hop*.5;
        if(l.role&&/^eye[LR]:/.test(l.role)){ drawEyeUnit(eyeU[l.role[3]], l.role[3]==='L'?S.eyeL:S.eyeR, dx, dy); continue; }
        if(l.role&&/^mouth\d$/.test(l.role)){ dy+=S.mouth*1.2*U; }
      }else if(g==='stage'){
        var f=Math.sin(t*.8+l.ph);dx=(Math.sin(t*.5+l.ph)*3+(-yaw*8))*U;dy=f*5*U;
        ctx.translate(dx,dy);dx=dy=0;
      }else if(l.role==='float'){ dy=Math.sin(t*.9+l.ph)*3*U; dx=Math.cos(t*.7+l.ph)*2*U; ctx.translate(dx,dy); dx=dy=0; }
      // strand / hanging sway (spring)
      if(l.sw){
        var tgt=clamp(-headVel*l.sw*.07-headVelY*l.sw*.02,-l.sw*.9,l.sw*.9)*Math.PI/180*18;
        var w0=6+(l.ph%1)*5, z=.32, dt=me._dt||.016;
        var acc=-w0*w0*(l.ang-tgt)-2*z*w0*l.vel; l.vel+=acc*dt; l.ang+=l.vel*dt;
        var idle=Math.sin(t*(1+(l.ph%1))+l.ph)*l.sw*.28*Math.PI/180;
        rot=clamp(l.ang+idle,-l.sw*Math.PI/180*1.8,l.sw*Math.PI/180*1.8);
      }
      ctx.translate(x+dx,y+dy); if(rot)ctx.rotate(rot);
      if(l.op!==undefined&&l.op<1)ctx.globalAlpha=l.op;
      if(l.bm)ctx.globalCompositeOperation=l.bm;
      ctx.drawImage(l.img,-(l.sx-l.x),-(l.sy-l.y),l.w,l.h);
      ctx.globalAlpha=1; if(l.bm)ctx.globalCompositeOperation='source-over';
    }
  }
  var last=0,acc=0,minDt=(opt.fps?1000/opt.fps:0),raf=0;
  function frame(ts){
    if(!me.running)return; raf=requestAnimationFrame(frame);
    if(minDt&&ts-last<minDt-2)return;
    var dt=Math.min((ts-(last||ts))/1000||.016,.05); last=ts; me._dt=dt;
    var t=(performance.now()-me.t0)/1000; update(t,dt); render(t);
  }
  this.start=function(){if(this.running)return;this.running=true;resize();last=0;raf=requestAnimationFrame(frame);};
  this.stop=function(){this.running=false;cancelAnimationFrame(raf);};
  this.setFps=function(f){minDt=f?1000/f:0;};
  this.state=S;
  resize(); update(0,.016); render(0);
}

/* ---- webcam face tracking (MediaPipe Face Landmarker, loaded on demand; video never leaves the browser) ---- */
function startCamera(rigObj,videoEl,onStatus){
  var VER='0.10.14', stream=null, lm=null, stopped=false, raf=0, calib=[], neutral=null, lastVT=-1;
  function st(s){onStatus&&onStatus(s);}
  var ctl={stop:function(){stopped=true;cancelAnimationFrame(raf);if(stream)stream.getTracks().forEach(function(t){t.stop();});videoEl.srcObject=null;if(lm&&lm.close)try{lm.close();}catch(e){}}};
  st('requesting');
  navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false}).then(function(s){
    stream=s; videoEl.srcObject=s; videoEl.setAttribute('playsinline',''); videoEl.muted=true;
    return videoEl.play();
  }).then(function(){
    st('loading');
    return import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@'+VER+'/vision_bundle.mjs');
  }).then(function(M){
    return M.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@'+VER+'/wasm').then(function(fs){
      var mk=function(del){return M.FaceLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',delegate:del},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:true});};
      return mk('GPU').catch(function(){return mk('CPU');});
    });
  }).then(function(l){
    if(stopped){try{l.close();}catch(e){}return;}
    lm=l; st('on');
    var mobile=/Mobi|Android/i.test(navigator.userAgent), gap=mobile?50:33, lastRun=0;
    (function loop(ts){
      if(stopped)return; raf=requestAnimationFrame(loop);
      if(ts-lastRun<gap||videoEl.readyState<2||videoEl.currentTime===lastVT)return; lastRun=ts; lastVT=videoEl.currentTime;
      var res; try{res=lm.detectForVideo(videoEl,ts);}catch(e){return;}
      var p=res&&res.faceLandmarks&&res.faceLandmarks[0]; if(!p){st('noface');return;} st('on');
      var d=function(a,b){return Math.hypot(a.x-b.x,a.y-b.y);};
      var eR=p[33],eL=p[263],nose=p[1],chin=p[152];
      var eyeD=d(eR,eL)||1, midX=(eR.x+eL.x)/2, midY=(eR.y+eL.y)/2;
      var yawRaw=(nose.x-midX)/eyeD, pitchRaw=(nose.y-midY)/Math.max(.001,(chin.y-midY)), rollRaw=Math.atan2(eL.y-eR.y,eL.x-eR.x);
      if(!neutral){calib.push([yawRaw,pitchRaw,rollRaw]);if(calib.length>=20){var s=[0,0,0];calib.forEach(function(c){s[0]+=c[0];s[1]+=c[1];s[2]+=c[2];});neutral=s.map(function(v){return v/calib.length;});}else{st('calib');}}
      var n=neutral||[yawRaw,pitchRaw,rollRaw];
      var bs={}; if(res.faceBlendshapes&&res.faceBlendshapes[0]) res.faceBlendshapes[0].categories.forEach(function(c){bs[c.categoryName]=c.score;});
      var op=function(b){return clamp(1-(b-.18)/.45,0,1);};
      rigObj.feedFace({
        yaw:-(yawRaw-n[0])*3.2, pitch:(pitchRaw-n[1])*3.4, roll:-(rollRaw-n[2])*2.2,
        eyeL:op(bs.eyeBlinkLeft||0), eyeR:op(bs.eyeBlinkRight||0),
        gx:clamp((((bs.eyeLookInLeft||0)-(bs.eyeLookOutLeft||0))+((bs.eyeLookOutRight||0)-(bs.eyeLookInRight||0)))/2*2.2,-1,1),
        gy:clamp((((bs.eyeLookDownLeft||0)-(bs.eyeLookUpLeft||0))+((bs.eyeLookDownRight||0)-(bs.eyeLookUpRight||0)))/2*2.2,-1,1),
        mouth:clamp((bs.jawOpen||0)/.5,0,1),
        smile:clamp(((bs.mouthSmileLeft||0)+(bs.mouthSmileRight||0))/2/.45,0,1)*.8+.15
      });
    })(0);
  }).catch(function(e){
    var name=e&&e.name; st(name==='NotAllowedError'||name==='SecurityError'?'denied':(name==='NotFoundError'?'nocam':'error')); ctl.stop();
  });
  return ctl;
}
window.LostarLive2D={create:create,startCamera:startCamera};
})();
