import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';

// World coordinates enter this module already scaled to the board. All meshes
// are pooled so crossing another finish never grows the scene.
export class LevelEffects {
  constructor(scene, { glow, ui, cellSize = 4, boardMin = -4, boardMax = 3, platformTop = -1.1 } = {}) {
    this.scene = scene;
    this.cellSize = cellSize;
    this.platformTop = platformTop;
    this.center = (boardMin + boardMax) * cellSize / 2;
    this.width = (boardMax - boardMin + 1) * cellSize;
    this.time = 0;
    this.finish = null;
    this.celebration = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.materials = [];
    const material = (name, hex, emission = 0) => {
      const mat = new StandardMaterial(name, scene);
      mat.diffuseColor = Color3.FromHexString(hex);
      mat.emissiveColor = mat.diffuseColor.scale(emission);
      mat.specularColor = Color3.Black();
      this.materials.push(mat);
      return mat;
    };
    const mint = material('finish mint', '#baffea', .9);
    const gold = material('goal champagne', '#ffe4a6', 1);
    const ink = material('finish checker ink', '#192537', .08);
    const dark = material('course beyond finish', '#121022', .16);
    const lavender = material('finish lavender', '#c4b4ff', .8);
    const box = (name, width, height, depth, x, y, z, mat, parent) => {
      const mesh = MeshBuilder.CreateBox(name, { width, height, depth }, scene);
      mesh.position.set(x, y, z);
      mesh.material = mat;
      mesh.parent = parent;
      mesh.isPickable = false;
      return mesh;
    };
    this.finishRoot = new TransformNode('level finish', scene);
    this.finishRoot.position.x = this.center;
    this.finishRoot.setEnabled(false);
    // A pair of luminous edges surrounds a real checker stripe on the floor.
    // Its low height leaves the raised landing squares fully readable.
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 16; col++) {
        const tile = box('finish checker', this.width / 16, .045, .64,
          -this.width / 2 + (col + .5) * this.width / 16, -1.89,
          (row - .5) * .64, (row + col) % 2 ? mint : ink, this.finishRoot);
        glow?.addExcludedMesh(tile);
      }
    }
    for (const side of [-1, 1]) {
      box('finish stripe edge', this.width, .06, .08, 0, -1.85, side * .7, mint, this.finishRoot);
      const x = side * (this.width / 2 + .18);
      box('finish beacon pedestal', .65, .2, .85, x, -1.88, 0, ink, this.finishRoot);
      box('finish beacon', .12, 3.2, .12, x, -.22, 0, mint, this.finishRoot);
      box('finish beacon pennant', .8, .64, .08, x - side * .35, 1.15, 0, gold, this.finishRoot);
    }
    this.endCap = box('quiet board beyond finish', this.width - .3, .025, 40,
      this.center, -1.975, 0, dark);
    this.endCap.setEnabled(false);
    glow?.addExcludedMesh(this.endCap);
    this.goals = Array.from({ length: 2 }, () => {
      const ring = MeshBuilder.CreateTorus('final landing halo', { diameter: 3.95, thickness: .065, tessellation: 48 }, scene);
      ring.material = gold;
      ring.isPickable = false;
      ring.setEnabled(false);
      return ring;
    });
    this.rings = Array.from({ length: 3 }, () => {
      const ring = MeshBuilder.CreateTorus('goal shockwave', { diameter: 2, thickness: .075, tessellation: 48 }, scene);
      ring.material = gold;
      ring.isPickable = false;
      ring.setEnabled(false);
      return ring;
    });
    this.sparks = Array.from({ length: 32 }, (_, i) => {
      const mesh = box('goal confetti', i % 3 ? .12 : .23, .28, .075, 0, 0, 0,
        [gold, mint, lavender][i % 3]);
      mesh.setEnabled(false);
      return { mesh, velocity: new Vector3(), start: new Vector3(), delay: i % 4 * .025 };
    });
    this.label = document.createElement('div');
    this.label.className = 'finish-label hidden';
    this.label.setAttribute('aria-hidden', 'true');
    this.label.innerHTML = '<span class="finish-checker"></span><strong>FINISH</strong><span class="finish-distance"></span>';
    this.card = document.createElement('section');
    this.card.className = 'level-clear hidden';
    this.card.setAttribute('role', 'status');
    this.card.setAttribute('aria-live', 'polite');
    this.card.innerHTML = `<div class="level-clear-panel">
      <div class="level-clear-mark" aria-hidden="true"><span></span><svg viewBox="0 0 32 32"><path d="m8 16 5 5 11-12"/></svg></div>
      <div class="level-clear-kicker"></div><h2>CLEAR!</h2>
      <div class="level-clear-next"><span class="level-clear-next-number"></span><strong class="level-clear-difficulty"></strong></div>
      <p class="level-clear-name"></p>
      <div class="level-clear-footer"><span class="level-clear-status">NEXT WAVE INCOMING</span><span aria-hidden="true">↗</span></div>
      <div class="level-clear-timer" aria-hidden="true"><i></i></div>
    </div>`;
    (ui || document.querySelector('#ui') || document.body).append(this.label, this.card);
  }

  setFinish(finish) {
    this.finish = finish;
    const visible = Boolean(finish && finish.remaining <= 3);
    this.finishRoot.setEnabled(visible);
    this.endCap.setEnabled(visible);
    this.label.classList.toggle('hidden', !visible || Boolean(this.celebration));
    this.goals.forEach(ring => ring.setEnabled(false));
    if (!visible) return;
    this.finishRoot.position.z = finish.z;
    const options = finish.options || [];
    const end = finish.endZ ?? Math.max(finish.z + this.cellSize, ...options.map(p => p.z + this.cellSize / 2));
    this.endCap.position.z = end + 20;
    this.label.querySelector('.finish-distance').textContent = `${finish.remaining} ${finish.remaining === 1 ? 'JUMP' : 'JUMPS'}`;
    if (finish.remaining === 1) options.slice(0, 2).forEach((option, i) => {
      this.goals[i].position.set(option.x, this.platformTop + .12, option.z);
      this.goals[i].setEnabled(true);
    });
  }

  clear({ completedLevel, nextLevel, difficulty, nextDifficulty, nextName, position, duration = 2.6, bandChanged = false }) {
    this.celebration = { age: 0, duration, position: new Vector3(position.x, position.y, position.z) };
    this.label.classList.add('hidden');
    this.card.querySelector('.level-clear-kicker').textContent = `LEVEL ${String(completedLevel).padStart(2, '0')}`;
    this.card.querySelector('.level-clear-next-number').textContent = `NEXT / ${String(nextLevel).padStart(2, '0')}`;
    this.card.querySelector('.level-clear-difficulty').textContent = nextDifficulty || difficulty || 'KEEP THE RHYTHM';
    this.card.querySelector('.level-clear-name').textContent = nextName || 'Your next wave is ready.';
    this.card.querySelector('.level-clear-status').textContent = bandChanged ? 'NEW TEMPO INCOMING' : 'NEXT WAVE INCOMING';
    this.card.classList.toggle('tempo-up', bandChanged);
    this.card.classList.remove('hidden');
    this.card.style.setProperty('--clear-progress', '0');
    for (const [i, spark] of this.sparks.entries()) {
      const angle = i * 2.3999632297;
      const speed = 2.5 + (i % 5) * .8;
      spark.start.copyFrom(this.celebration.position);
      spark.start.y += .4;
      spark.mesh.position.copyFrom(spark.start);
      spark.velocity.set(Math.cos(angle) * speed, 4 + i % 6 * .55, Math.sin(angle) * speed);
      spark.mesh.rotation.set(angle, angle * .5, angle * .3);
      spark.mesh.scaling.setAll(1);
      spark.mesh.setEnabled(!this.reducedMotion);
    }
  }

  update(dt, { camera, arena, mode } = {}) {
    this.time += dt;
    this.card.classList.toggle('effects-paused', mode === 'paused');
    if (this.finish && this.finishRoot.isEnabled() && camera && arena && !this.celebration) {
      const engine = this.scene.getEngine();
      const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
      const point = Vector3.Project(new Vector3(this.center, -.9, this.finish.z), Matrix.Identity(), this.scene.getTransformMatrix(), viewport);
      const x = point.x * innerWidth / engine.getRenderWidth();
      const y = point.y * innerHeight / engine.getRenderHeight() - 22;
      this.label.classList.toggle('hidden', y < arena.top + 8 || y > arena.bottom - 15 || !['playing', 'ready'].includes(mode));
      this.label.style.left = `${x}px`;
      this.label.style.top = `${y}px`;
      this.goals.forEach(ring => ring.scaling.setAll(this.reducedMotion ? 1 : 1 + Math.sin(this.time * 4) * .035));
    }
    if (!this.celebration) return;
    const effect = this.celebration;
    effect.age += dt;
    this.card.style.setProperty('--clear-progress', String(Math.min(1, effect.age / effect.duration)));
    for (const [i, ring] of this.rings.entries()) {
      const age = effect.age - i * .16;
      ring.setEnabled(!this.reducedMotion && age >= 0 && age < 1.15);
      ring.position.copyFrom(effect.position);
      ring.position.y = this.platformTop + .16 + i * .025;
      ring.scaling.setAll(1 + Math.max(0, age) * (4 + i));
      ring.visibility = Math.max(0, 1 - age / 1.15);
    }
    for (const [i, spark] of this.sparks.entries()) {
      const age = effect.age - spark.delay;
      spark.mesh.setEnabled(!this.reducedMotion && age >= 0 && age < 1.7);
      if (age < 0) continue;
      spark.mesh.position.copyFrom(spark.start).addInPlace(spark.velocity.scale(age));
      spark.mesh.position.y -= 4 * age * age;
      spark.mesh.rotation.x = i + age * 2;
      spark.mesh.rotation.z = i * .7 + age * 3;
      spark.mesh.visibility = Math.max(0, Math.min(1, (1.7 - age) / .6));
    }
  }

  hideClear() {
    this.celebration = null;
    this.card.classList.add('hidden');
    this.rings.forEach(mesh => mesh.setEnabled(false));
    this.sparks.forEach(({ mesh }) => mesh.setEnabled(false));
  }

  reset() {
    this.hideClear();
    this.setFinish(null);
    this.time = 0;
  }

  get state() {
    return { finishVisible: this.finishRoot.isEnabled(), finishZ: this.finish?.z ?? null,
      remaining: this.finish?.remaining ?? null, clearVisible: Boolean(this.celebration),
      clearAge: this.celebration?.age ?? 0, goalMarkers: this.goals.filter(mesh => mesh.isEnabled()).length };
  }
}
