import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';

// Three overlapping landing bursts, allocated once. Celebrating a long run
// never adds meshes, materials, textures, or DOM elements to the scene.
export class ComboEffects {
  constructor(scene, { ui, platformTop = -1.1 } = {}) {
    this.scene = scene;
    this.platformTop = platformTop;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cursor = 0;
    this.successes = 0;
    this.pulse = 0;
    this.host = ui || document.querySelector('#ui') || document.body;
    this.edge = document.createElement('div');
    this.edge.className = 'combo-energy';
    this.edge.setAttribute('aria-hidden', 'true');
    this.host.append(this.edge);
    const texture = new Texture(`${import.meta.env.BASE_URL}sparkle.svg`, scene);
    texture.hasAlpha = true;
    this.materials = ['#baffea', '#ffa9e5', '#e5d0ff'].map((hex, index) => {
      const material = new StandardMaterial(`combo star ${index}`, scene);
      material.disableLighting = true;
      material.emissiveColor = Color3.FromHexString(hex).scale(1.2);
      material.diffuseColor = Color3.Black();
      material.diffuseTexture = texture;
      material.useAlphaFromDiffuseTexture = true;
      material.backFaceCulling = false;
      return material;
    });
    this.ringMaterial = new StandardMaterial('combo impact neon', scene);
    this.ringMaterial.disableLighting = true;
    this.ringMaterial.emissiveColor = Color3.FromHexString('#baffea').scale(1.4);
    this.ringMaterial.diffuseColor = Color3.Black();
    this.slots = Array.from({ length: 3 }, (_, slotIndex) => {
      const ring = MeshBuilder.CreateTorus(`combo landing ring ${slotIndex}`, { diameter: 2.3, thickness: .055, tessellation: 48 }, scene);
      ring.material = this.ringMaterial;
      ring.isPickable = false;
      ring.setEnabled(false);
      const stars = Array.from({ length: 16 }, (_, index) => {
        const mesh = MeshBuilder.CreatePlane(`combo radiant star ${slotIndex}-${index}`, { size: 1 }, scene);
        mesh.material = this.materials[index % 3];
        mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
        mesh.isPickable = false;
        mesh.setEnabled(false);
        return { mesh, angle: index * 2.39996323, delay: index % 4 * .027 };
      });
      const label = document.createElement('div');
      label.className = 'combo-success hidden';
      label.setAttribute('aria-hidden', 'true');
      label.innerHTML = '<strong></strong><span></span>';
      this.host.append(label);
      return { age: 2, position: new Vector3(), ring, stars, label, count: 2, complete: false };
    });
  }

  success(count, { position, chain = 0, complete = false } = {}) {
    if (count < 2 || !position) return;
    const slot = this.slots[this.cursor++ % this.slots.length];
    slot.age = 0;
    slot.position.set(position.x, position.y, position.z);
    slot.count = Math.min(4, count);
    slot.complete = complete;
    slot.label.querySelector('strong').textContent = complete ? `${count}× COMBO` : ['NICE!', 'SWEET!', 'CLEAN!'][chain % 3];
    slot.label.querySelector('span').textContent = complete ? (count >= 4 ? 'PERFECT FLOW' : count >= 3 ? 'ON FIRE' : 'KEEP IT GOING') : '';
    slot.label.classList.toggle('combo-finale', complete);
    slot.label.classList.remove('hidden');
    this.successes++;
    this.pulse = Math.max(this.pulse, complete ? .75 + slot.count * .1 : .32);
    this.edge.classList.toggle('combo-energy-pink', complete);
  }

  update(dt, { camera, mode } = {}) {
    if (mode === 'paused') dt = 0;
    if (mode && !['playing', 'paused', 'level-clear'].includes(mode)) {
      this.hide();
      return;
    }
    this.pulse = Math.max(0, this.pulse - dt * 1.6);
    this.edge.style.opacity = String(this.reducedMotion ? 0 : Math.min(.72, this.pulse));
    const engine = this.scene.getEngine();
    const viewport = camera?.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    for (const slot of this.slots) {
      slot.age += dt;
      const age = slot.age;
      const life = slot.complete ? 1.2 : .8;
      const active = age < life;
      slot.label.classList.toggle('hidden', !active);
      slot.ring.setEnabled(active && age < .62 && !this.reducedMotion);
      if (active) {
        slot.ring.position.copyFrom(slot.position);
        slot.ring.position.y = this.platformTop + .14;
        slot.ring.scaling.setAll(.75 + age * (slot.complete ? 4 : 2.8));
        slot.ring.visibility = Math.max(0, 1 - age / .62) * .8;
        if (camera) {
          const world = new Vector3(slot.position.x, slot.position.y + 2.5, slot.position.z);
          const projected = Vector3.Project(world, Matrix.Identity(), this.scene.getTransformMatrix(), viewport);
          const x = projected.x * innerWidth / engine.getRenderWidth();
          const y = projected.y * innerHeight / engine.getRenderHeight();
          slot.label.style.left = `${Math.max(80, Math.min(innerWidth - 80, x))}px`;
          slot.label.style.top = `${Math.max(125, y - 20 - (this.reducedMotion ? 0 : age * 22))}px`;
          slot.label.style.opacity = String(Math.min(1, (life - age) / .3));
          slot.label.style.setProperty('--success-scale', String(this.reducedMotion ? 1 : 1 + Math.max(0, .12 - age * .65)));
        }
      }
      for (const [index, star] of slot.stars.entries()) {
        const t = age - star.delay;
        const visible = active && t >= 0 && t < .85 && !this.reducedMotion;
        star.mesh.setEnabled(visible);
        if (!visible) continue;
        const reach = (slot.complete ? 2.8 : 1.8) + slot.count * .3;
        const radius = 1 + Math.sin(Math.min(1, t) * 1.6) * reach;
        star.mesh.position.set(
          slot.position.x + Math.cos(star.angle) * radius,
          slot.position.y + .45 + Math.sin(t * 2.2) * (1.4 + index % 3 * .45),
          slot.position.z + Math.sin(star.angle) * radius,
        );
        const fade = Math.max(0, 1 - t / .85);
        const scale = (index % 4 === 0 ? 1.2 : .65) * Math.sin(Math.min(1, t * 10) * Math.PI / 2) * fade;
        star.mesh.scaling.setAll(scale * (slot.complete ? 1.3 : 1));
        star.mesh.visibility = fade;
        star.mesh.rotation.z = star.angle + t * .6;
      }
    }
  }

  hide() {
    this.pulse = 0;
    this.edge.style.opacity = '0';
    for (const slot of this.slots) {
      slot.age = 2;
      slot.label.classList.add('hidden');
      slot.ring.setEnabled(false);
      slot.stars.forEach(({ mesh }) => mesh.setEnabled(false));
    }
  }

  reset() {
    this.hide();
    this.cursor = 0;
    this.successes = 0;
  }

  get state() {
    return { successes: this.successes, active: this.slots.filter(slot => slot.age < (slot.complete ? 1.2 : .8)).length,
      particles: this.slots.reduce((count, slot) => count + slot.stars.filter(({ mesh }) => mesh.isEnabled()).length, 0),
      pooledMeshes: 51, pulse: this.pulse, reducedMotion: this.reducedMotion };
  }
}
