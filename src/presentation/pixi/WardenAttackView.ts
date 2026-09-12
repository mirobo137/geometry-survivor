import { Container, Graphics } from 'pixi.js';
import { ARENA_CENTER } from '../../config/constants';
import type { BossRenderState } from '../../simulation/combat/CombatRenderState';
import type { FxQuality } from '../../content/visual/VisualTokens';

const INK = 0x111e30;
const METAL = 0x557387;
const IVORY = 0xffedc5;
const COPPER = 0xefb77f;
const ICE = 0x78dbe0;

/** One persistent assembly: no paths, textures or particles allocated by render. */
export class WardenAttackView {
  public readonly root = new Container();
  private readonly route: Graphics[] = [];
  private readonly wake: Graphics[] = [];
  private readonly gates: Container[] = [];
  private readonly jaws: Graphics[][] = [];
  private readonly shards: Graphics[] = [];
  private readonly collar = new Graphics();

  public constructor(quality: FxQuality = 'medium') {
    const count = quality === 'low' ? 12 : quality === 'high' ? 20 : 16;
    for (let i = 0; i < count; i++) {
      const route = new Graphics();
      // Open feather: direction is conveyed by converging surfaces, not arrows.
      route.beginPath().poly([-14,-7, 9,-3, 15,0, 5,-1, -11,-3]).fill({color:COPPER,alpha:0.75});
      route.beginPath().poly([-14,7, 9,3, 15,0, 5,1, -11,3]).fill({color:ICE,alpha:0.45});
      const wake = new Graphics();
      // Unit-length tapered lamina. Width never scales with travelled distance.
      wake.beginPath().poly([-1,-12,0,-16,0,16,-1,12]).fill({color:INK,alpha:0.5});
      wake.beginPath().poly([-1,-9,0,-12,0,12,-1,9]).fill({color:ICE,alpha:0.5});
      wake.beginPath().poly([-1,-4,0,-5,0,5,-1,4]).fill({color:IVORY,alpha:0.7});
      wake.beginPath().poly([-1,-9,0,-12,0,-10,-1,-8]).fill({color:COPPER,alpha:0.8});
      this.route.push(route); this.wake.push(wake);
      this.root.addChild(route, wake);
    }
    for (let gateIndex = 0; gateIndex < 2; gateIndex++) {
      const gate = new Container(); const blades: Graphics[] = [];
      for (let i = 0; i < 3; i++) {
        const blade = new Graphics();
        blade.beginPath().poly([10,-9,24,-15,33,-4,24,6,20,1,26,-5,22,-9,12,-5]).fill({color:INK});
        blade.beginPath().poly([12,-9,24,-13,31,-4,25,3,23,0,27,-5,23,-9,14,-6]).fill({color:METAL});
        blade.beginPath().poly([14,-9,24,-12,29,-5,26,-6,23,-9,16,-7]).fill({color:IVORY,alpha:0.85});
        blade.beginPath().poly([12,-5,23,-7,25,-4,21,-3]).fill({color:ICE});
        blades.push(blade); gate.addChild(blade);
      }
      this.jaws.push(blades); this.gates.push(gate); this.root.addChild(gate);
    }
    for (let i = 0; i < 12; i++) {
      const shard = new Graphics().beginPath().poly([-7,0,0,-2,5,0,0,2]).fill({color:i%2 ? ICE : COPPER});
      this.shards.push(shard); this.root.addChild(shard);
    }
    for (let i = 0; i < 3; i++) {
      const a = i*Math.PI*2/3;
      this.collar.beginPath().arc(0,0,57,a,a+0.55).stroke({color:INK,width:5,alpha:0.5});
      this.collar.beginPath().arc(0,0,57,a,a+0.55).stroke({color:COPPER,width:1.5,alpha:0.85});
    }
    this.root.addChild(this.collar);
    this.root.visible = false;
  }

  public render(s: Readonly<BossRenderState>): void {
    const supported = s.pattern === 'charge' || s.pattern === 'curve' || s.pattern === 'replicas';
    this.root.visible = s.active && s.bossId === 'orbital-warden' && supported;
    if (!this.root.visible) return;
    for (const child of this.root.children) child.visible = false;
    const p = Math.max(0, Math.min(1,s.progress));
    const warning = s.phase.endsWith('telegraph');
    const recovery = s.phase === 'recovery';
    const fade = recovery ? (1-p)**2 : 1;
    this.collar.visible = true;
    this.collar.position.set(s.x,s.y);
    this.collar.rotation = warning ? p*0.5 : -p*0.3;
    this.collar.alpha = warning ? 0.25+p*0.6 : fade*0.5;
    this.collar.scale.set(warning ? 1.12-p*0.12 : 1+p*0.12);
    if (s.pattern === 'replicas') {
      this.renderReplication(s,p,warning,recovery);
      return;
    }
    const curved = s.pattern === 'curve';
    const angle = Math.atan2(s.chargeAimY-s.chargeStartY,s.chargeAimX-s.chargeStartX);
    const length = Math.hypot(s.chargeAimX-s.chargeStartX,s.chargeAimY-s.chargeStartY);
    for (let i=0;i<this.route.length;i++) {
      const t = i/(this.route.length-1);
      const marker = this.route[i];
      marker.visible = warning && (curved || i<3);
      if (curved) {
        const a = s.curveStartAngle+s.curveDirection*s.curveTravelRadians*t;
        marker.position.set(ARENA_CENTER.x+Math.cos(a)*s.curveRadius,ARENA_CENTER.y+Math.sin(a)*s.curveRadius);
        marker.rotation = a+s.curveDirection*Math.PI/2;
      } else {
        const d = 60+i*23-p*8;
        marker.position.set(s.x+Math.cos(angle)*d,s.y+Math.sin(angle)*d);
        marker.rotation = angle;
      }
      marker.alpha = (0.18+0.55*p)*(1-t*0.65);
      marker.scale.set(0.8+p*0.25,1);
      const wake = this.wake[i];
      const tail = (i+0.5)/this.wake.length;
      wake.visible = !warning;
      if (curved) {
        const travelled = Math.abs(s.curveAngle-s.curveStartAngle);
        const span = Math.min(1.15,travelled);
        const a = s.curveAngle-s.curveDirection*span*tail;
        wake.position.set(ARENA_CENTER.x+Math.cos(a)*s.curveRadius,ARENA_CENTER.y+Math.sin(a)*s.curveRadius);
        wake.rotation = a+s.curveDirection*Math.PI/2;
        wake.scale.set(Math.max(0.01,span*s.curveRadius/this.wake.length*1.1),(1-tail)*1.1);
      } else {
        const travelled = recovery ? length : length*p;
        const span = Math.min(230,travelled);
        wake.position.set(s.x-Math.cos(angle)*span*tail,s.y-Math.sin(angle)*span*tail);
        wake.rotation = angle;
        wake.scale.set(Math.max(0.01,span/this.wake.length*1.1),(1-tail)*1.25);
      }
      wake.alpha = (1-tail)**0.75*fade*0.95;
    }
  }

  private renderReplication(s: Readonly<BossRenderState>,p:number,warning:boolean,recovery:boolean): void {
    for(let g=0;g<2;g++) {
      const x=g===0?s.replicaLeftX:s.replicaRightX;
      const y=g===0?s.replicaLeftY:s.replicaRightY;
      const gate=this.gates[g]; gate.visible=true;
      gate.position.set(x,y);
      gate.alpha=recovery?(1-p)**2*0.25:warning?0.35+p*0.65:(1-p)*0.85;
      gate.scale.set(warning?1.2-p*0.25:1+p*0.6);
      for(let i=0;i<3;i++) {
        const blade=this.jaws[g][i];
        const a=i*Math.PI*2/3+(warning?-p*0.65:p*0.8)*(g===0?1:-1);
        blade.rotation=a;
        const spread=warning?(1-p)*5:p*9;
        blade.position.set(Math.cos(a)*spread,Math.sin(a)*spread);
      }
      for(let i=0;i<6;i++) {
        const shard=this.shards[g*6+i]; shard.visible=!recovery;
        const a=i*Math.PI/3+g*0.4;
        const distance=warning?45*(1-p)+12:14+p*45;
        shard.position.set(x+Math.cos(a)*distance,y+Math.sin(a)*distance);
        shard.rotation=a; shard.scale.set(warning?0.5+p*0.5:1-p*0.7,1);
        shard.alpha=warning?p*0.55:(1-p)**2*0.8;
      }
    }
  }
}
