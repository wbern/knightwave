// Downloaded tempo variants follow the same phrase position as levels change.
export const MUSIC_TRACKS=[
  {speed:.50,file:'nebula-050.m4a'},
  {speed:1,file:'nebula-100.m4a'},
  {speed:1.26,file:'nebula-126.m4a'},
  {speed:1.50,file:'nebula-150.m4a'},
];
export function musicTrack(level=1){return MUSIC_TRACKS[Math.min(MUSIC_TRACKS.length-1,Math.max(0,Math.floor(level)-1))];}
export class Soundtrack {
  constructor(){this.ctx=null;this.muted=false;this.playing=false;this.track=null;this.music=null;this.phrasePosition=0;this.setLevel(1);}
  setLevel(level,{reset=false}={}){
    const track=musicTrack(level);
    if(this.track===track&&!reset)return;
    // Times are measured in seconds of the original (1x) recording.
    this.phrasePosition=reset?0:(this.music?.currentTime||0)*(this.track?.speed||1);
    this.track=track;this.beat=60/(160*track.speed);
    if(this.delay)this.delay.delayTime.setTargetAtTime(this.beat*.75,this.ctx.currentTime,.03);
    if(!this.music){
      this.music=new Audio();this.music.loop=true;this.music.preload='auto';
      this.music.addEventListener('loadedmetadata',()=>{
        this.music.currentTime=(this.phrasePosition/this.track.speed)%this.music.duration;
      });
    }
    this.music.pause();
    this.music.src=`${import.meta.env?.BASE_URL||'./'}audio/${track.file}`;
    this.music.load();
    if(this.playing)this.music.play().catch(()=>{});
  }
  async start(){
    if(!this.ctx){
      this.ctx=new (window.AudioContext||window.webkitAudioContext)();
      this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:.62;
      const compressor=this.ctx.createDynamicsCompressor();compressor.threshold.value=-18;compressor.ratio.value=5;this.master.connect(compressor);compressor.connect(this.ctx.destination);
      this.delay=this.ctx.createDelay(1);this.delay.delayTime.value=this.beat*.75;
      const wet=this.ctx.createGain();wet.gain.value=.18;const feedback=this.ctx.createGain();feedback.gain.value=.3;this.delay.connect(wet);wet.connect(this.master);this.delay.connect(feedback);feedback.connect(this.delay);
      this.ctx.createMediaElementSource(this.music).connect(this.master);
    }
    this.playing=true;
    await Promise.all([this.ctx.resume(),this.music.play()]);
  }
  stop(){this.playing=false;this.music.pause();if(this.ctx)this.ctx.suspend();}
  mute(){this.muted=!this.muted;if(this.ctx)this.master.gain.setTargetAtTime(this.muted?0:.62,this.ctx.currentTime,.03);return this.muted;}
  tone(midi,t,duration,volume=.08,type='sawtooth',detune=0,delay=false){
    const o=this.ctx.createOscillator(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();o.type=type;o.frequency.value=440*Math.pow(2,(midi-69)/12);o.detune.value=detune;f.type='lowpass';f.frequency.setValueAtTime(6000,t);f.frequency.exponentialRampToValueAtTime(1200,t+duration);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(f);f.connect(g);g.connect(this.master);if(delay)g.connect(this.delay);o.start(t);o.stop(t+duration+.02);
  }
  spin(step){if(!this.ctx||!this.playing)return;this.tone(72+Math.abs(step)%4*4,this.ctx.currentTime,.16,.10,'triangle',0,true);}
  dispatch(){if(!this.ctx||!this.playing)return;[76,83,88].forEach((n,i)=>this.tone(n,this.ctx.currentTime+i*.035,.16,.06,'triangle',0,true));}
  land(combo){if(!this.ctx||!this.playing)return;[72,76,79,84].forEach((n,i)=>this.tone(n+Math.min(combo,6),this.ctx.currentTime+i*.045,.25,.07,'triangle',0,true));}
  fall(){if(!this.ctx||!this.playing)return;[65,60,53].forEach((n,i)=>this.tone(n,this.ctx.currentTime+i*.09,.28,.12,'sawtooth'));}
  get pulse(){return this.ctx&&this.playing?Math.pow(1-(this.music.currentTime%(this.beat))/this.beat,3):0;}
}
