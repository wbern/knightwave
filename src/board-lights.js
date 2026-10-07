import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';

// Course lighting uses a fixed pool of platform corners and edge glints.
export class BoardLights {
  constructor(scene, { boardMin = -4, boardMax = 3, cellSize = 4, platformTop = -1.1 } = {}) {
    this.scene = scene;
    this.cellSize = cellSize;
    this.platformTop = platformTop;
    this.time = 0;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.materials = [];
    const material = (name, hex, intensity = 1.3) => {
      const mat = new StandardMaterial(name, scene);
      mat.disableLighting = true;
      mat.diffuseColor = Color3.Black();
      mat.emissiveColor = Color3.FromHexString(hex).scale(intensity);
      mat.specularColor = Color3.Black();
      this.materials.push(mat);
      return mat;
    };
    this.mint = material('route light mint', '#83ffdd', 1.65);
    this.lilac = material('route light lavender', '#b7a1ff', 1.25);
    this.gold = material('route light gold', '#ffda94', 1.4);
    const box = (name, width, height, depth, x = 0, y = 0, z = 0) => {
      const mesh = MeshBuilder.CreateBox(name, { width, height, depth }, scene);
      mesh.position.set(x, y, z);
      mesh.isPickable = false;
      return mesh;
    };
    const merge = (name, parts) => {
      const mesh = Mesh.MergeMeshes(parts, true, true);
      mesh.name = name;
      mesh.isPickable = false;
      mesh.setEnabled(false);
      return mesh;
    };
    const corner = cellSize * .475;
    const arm = cellSize * .2;
    const sparkleTexture = new Texture(`${import.meta.env.BASE_URL}sparkle.svg`, scene);
    sparkleTexture.hasAlpha = true;
    this.starMaterials = [this.mint, this.lilac, this.gold].map((source, i) => {
      const mat = material(`course shine ${i}`, '#ffffff');
      mat.emissiveColor.copyFrom(source.emissiveColor);
      mat.diffuseTexture = sparkleTexture;
      mat.useAlphaFromDiffuseTexture = true;
      mat.backFaceCulling = false;
      return mat;
    });
    this.platforms = Array.from({ length: 12 }, (_, i) => {
      const corners = [];
      for (const x of [-1, 1]) for (const z of [-1, 1]) {
        corners.push(box('corner light', arm, .045, .065, x * (corner - arm / 2), 0, z * corner));
        corners.push(box('corner light', .065, .045, arm, x * corner, 0, z * (corner - arm / 2)));
      }
      const frame = merge(`illuminated landing corners ${i}`, corners);
      const star = MeshBuilder.CreatePlane(`platform shine ${i}`, { size: 1 }, scene);
      star.billboardMode = Mesh.BILLBOARDMODE_ALL;
      star.isPickable = false;
      star.setEnabled(false);
      return { frame, star };
    });
    this.rails = [];
    this.railGlints = [];
    for (const [side, edge] of [boardMin - .5, boardMax + .5].entries()) {
      const x = edge * cellSize;
      const mat = side ? this.lilac : this.mint;
      const rail = box('luminous board edge', .055, .05, 120, x, -1.62);
      rail.material = mat;
      const wash = box('board edge soft light', .18, .02, 120, x, -1.64);
      wash.material = mat;
      wash.visibility = .21;
      this.rails.push(rail, wash);
      for (let i = 0; i < 6; i++) {
        const glint = box('traveling edge light', .12, .065, .65, x, -1.59);
        glint.material = mat;
        this.railGlints.push({ mesh: glint, index: i, side });
      }
    }
    this.reset();
  }

  update(dt, { scrollZ = 0, platforms = [], mode, currentIndex } = {}) {
    if (mode !== 'paused') this.time += dt;
    const on = !mode || ['start', 'playing', 'paused', 'level-clear'].includes(mode);
    for (const rail of this.rails) {
      rail.setEnabled(on);
      rail.position.z = scrollZ + 12;
    }
    for (const { mesh, index, side } of this.railGlints) {
      mesh.setEnabled(on);
      const motion = this.reducedMotion ? 0 : this.time * 1.3;
      mesh.position.z = Math.floor(scrollZ / 12) * 12 - 20 + index * 12 + (motion + side * 5) % 12;
      mesh.visibility = .45;
    }
    const current = currentIndex ?? Math.max(0, ...platforms.filter(p => !p.origin && !p.preview).map(p => p.index ?? 0));
    const stops = on ? platforms.filter(p => p.index >= current && p.visible !== false).slice(0, this.platforms.length) : [];
    for (const [i, { frame, star }] of this.platforms.entries()) {
      const stop = stops[i];
      frame.setEnabled(Boolean(stop));
      star.setEnabled(Boolean(stop));
      if (!stop) continue;
      const preferred = stop.route || stop.index === current;
      const palette = stop.piece ? 2 : preferred ? 0 : 1;
      frame.material = [this.mint, this.lilac, this.gold][palette];
      const height = stop.height ?? this.platformTop;
      frame.position.set(stop.x * this.cellSize, height + .075, stop.z * this.cellSize);
      const shimmer = this.reducedMotion ? 1 : .88 + Math.sin(this.time * 2.3 + stop.index * .8) * .12;
      frame.visibility = (preferred ? .9 : .38) * shimmer;
      star.material = this.starMaterials[palette];
      const side = stop.index % 2 ? -1 : 1;
      star.position.set(frame.position.x + side * this.cellSize * .46, height + .15, frame.position.z + this.cellSize * .44);
      const twinkle = this.reducedMotion ? .5 : Math.pow(Math.max(0, Math.sin(this.time * 2.1 + stop.index * 1.4)), 6);
      star.scaling.setAll(.18 + twinkle * (preferred ? .55 : .3));
      star.visibility = (preferred ? .8 : .34) * (.25 + twinkle * .75);
    }
  }

  reset() {
    this.time = 0;
    this.rails.forEach(mesh => mesh.setEnabled(false));
    this.railGlints.forEach(({ mesh }) => mesh.setEnabled(false));
    this.platforms.forEach(({ frame, star }) => { frame.setEnabled(false); star.setEnabled(false); });
  }

  get state() {
    return { platforms: this.platforms.filter(({ frame }) => frame.isEnabled()).length,
      links: 0, pooledMeshes: 40 };
  }
}
