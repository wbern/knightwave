// Original 160 BPM arcade composition. No recordings or external audio assets.
export class Soundtrack {
  constructor(){this.ctx=null;this.muted=false;this.timer=null;this.step=0;this.next=0;this.beat=60/160;this.playing=false;}
  async start(){
    if(!this.ctx){
      this.ctx=new (window.AudioContext||window.webkitAudioContext)();
      this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:.62;
      const compressor=this.ctx.createDynamicsCompressor();compressor.threshold.value=-18;compressor.ratio.value=5;this.master.connect(compressor);compressor.connect(this.ctx.destination);
      this.delay=this.ctx.createDelay(.5);this.delay.delayTime.value=this.beat*.75;
      const wet=this.ctx.createGain();wet.gain.value=.18;const feedback=this.ctx.createGain();feedback.gain.value=.3;this.delay.connect(wet);wet.connect(this.master);this.delay.connect(feedback);feedback.connect(this.delay);
      this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate*.3,this.ctx.sampleRate);let n=this.noise.getChannelData(0);for(let i=0;i<n.length;i++)n[i]=Math.random()*2-1;
    }
    await this.ctx.resume();this.playing=true;
    if(!this.timer){this.next=this.ctx.currentTime+.06;this.timer=setInterval(()=>this.schedule(),25);}
  }
  stop(){this.playing=false;if(this.timer){clearInterval(this.timer);this.timer=null;}if(this.ctx)this.ctx.suspend();}
  mute(){this.muted=!this.muted;if(this.ctx)this.master.gain.setTargetAtTime(this.muted?0:.62,this.ctx.currentTime,.03);return this.muted;}
  tone(midi,t,duration,volume=.08,type='sawtooth',detune=0,delay=false){
    const o=this.ctx.createOscillator(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();o.type=type;o.frequency.value=440*Math.pow(2,(midi-69)/12);o.detune.value=detune;f.type='lowpass';f.frequency.setValueAtTime(6000,t);f.frequency.exponentialRampToValueAtTime(1200,t+duration);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(f);f.connect(g);g.connect(this.master);if(delay)g.connect(this.delay);o.start(t);o.stop(t+duration+.02);
  }
  kick(t){let o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.setValueAtTime(145,t);o.frequency.exponentialRampToValueAtTime(43,t+.13);g.gain.setValueAtTime(.65,t);g.gain.exponentialRampToValueAtTime(.001,t+.23);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.25);}
  hit(t,volume,duration,frequency){const n=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();n.buffer=this.noise;f.type='highpass';f.frequency.value=frequency;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);n.connect(f);f.connect(g);g.connect(this.master);n.start(t);n.stop(t+duration);}
  schedule(){if(!this.playing)return;while(this.next<this.ctx.currentTime+.15){this.compose(this.step++,this.next);this.next+=this.beat/4;}}
  compose(s,t){
    const bar=Math.floor(s/16),p=s%16,root=[48,55,57,53][Math.floor(bar/2)%4],major=root!==57;
    if(p%4===0)this.kick(t);if(p===4||p===12){this.hit(t,.23,.16,1200);this.tone(38,t,.08,.09,'triangle');}
    if(p%2===0)this.hit(t,p%4===2?.075:.027,p%4===2?.10:.035,8000);
    if(p%2===0){this.tone(root-12+(p===14?7:0),t,this.beat*.36,.15,'sawtooth');this.tone(root-24,t,this.beat*.36,.17,'sine');}
    const chord=[root,root+(major?4:3),root+7,root+12];if(p===2||p===10)for(const note of chord){this.tone(note,t,this.beat*1.3,.025,'sawtooth',-7,true);this.tone(note,t,this.beat*1.3,.025,'sawtooth',7,true);}
    const melody=[12,19,16,19,24,19,16,14,12,16,19,24,23,19,16,19];if(p%2===0){const note=root+melody[(p/2+(bar%2)*8)%16];this.tone(note,t,this.beat*.4,.06,'square',0,true);this.tone(note+12,t,this.beat*.25,.023,'triangle',0,true);}
    if(bar%4===3&&p>=12)this.hit(t,.03,.04,6000);
  }
  spin(step){if(!this.ctx||!this.playing)return;this.tone(72+Math.abs(step)%4*4,this.ctx.currentTime,.16,.10,'triangle',0,true);}
  dispatch(){if(!this.ctx||!this.playing)return;[76,83,88].forEach((n,i)=>this.tone(n,this.ctx.currentTime+i*.035,.16,.06,'triangle',0,true));}
  land(combo){if(!this.ctx||!this.playing)return;[72,76,79,84].forEach((n,i)=>this.tone(n+Math.min(combo,6),this.ctx.currentTime+i*.045,.25,.07,'triangle',0,true));}
  fall(){if(!this.ctx||!this.playing)return;[65,60,53].forEach((n,i)=>this.tone(n,this.ctx.currentTime+i*.09,.28,.12,'sawtooth'));}
  get pulse(){return this.ctx&&this.playing?Math.pow(1-(this.ctx.currentTime%(this.beat))/this.beat,3):0;}
}
