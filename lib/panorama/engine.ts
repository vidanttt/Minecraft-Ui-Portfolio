"use client";

import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Fog,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from "three";
import { gsap } from "gsap";
import { completeBootTask } from "@/lib/boot";
import { generateWorld, type MeshData } from "@/lib/panorama/terrain";

export interface PanoramaOptions {
  animate: boolean;
  quality: "fancy" | "fast";
  dimmed: boolean;
}

export interface PanoramaEngine {
  configure(opts: PanoramaOptions): void;
  dispose(): void;
}

const HORIZON = new Color("#c6dcff");
const YAW_SPEED = 0.022; // radians per second: one turn every ~5 minutes
const START_YAW = 2.35;

function toGeometry(data: MeshData): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(data.positions, 3));
  g.setAttribute("uv", new BufferAttribute(data.uvs, 2));
  g.setAttribute("color", new BufferAttribute(data.colors, 3));
  g.setIndex(new BufferAttribute(data.indices, 1));
  g.computeBoundingSphere();
  return g;
}

function cloudTexture(): CanvasTexture {
  const n = 32;
  const canvas = document.createElement("canvas");
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext("2d")!;
  let s = 91;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  // blobby cells: seed points then grow
  const grid = new Uint8Array(n * n);
  for (let i = 0; i < 22; i++) {
    const cx = Math.floor(rnd() * n);
    const cy = Math.floor(rnd() * n);
    const w = 2 + Math.floor(rnd() * 5);
    const h = 1 + Math.floor(rnd() * 3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) grid[((cy + y) % n) * n + ((cx + x) % n)] = 1;
  }
  ctx.fillStyle = "#ffffff";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (grid[y * n + x]) ctx.fillRect(x, y, 1, 1);
  const tex = new CanvasTexture(canvas);
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.generateMipmaps = false;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  return tex;
}

/** Radial fade so the cloud layer dissolves into the sky instead of ending at an edge. */
function radialAlpha(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
  g.addColorStop(0, "#fff");
  g.addColorStop(0.55, "#bbb");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}

const nextFrame = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * Creates the voxel panorama inside `container`. Throws if WebGL is
 * unavailable; the caller then keeps the CSS fallback sky.
 */
export async function createPanorama(
  container: HTMLElement,
  initial: PanoramaOptions,
  onFirstFrame: () => void,
  onLost: () => void,
): Promise<PanoramaEngine> {
  const renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: "low-power" });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";

  let disposed = false;
  let opts = initial;

  const onContextLost = (e: Event) => {
    e.preventDefault();
    stop();
    onLost();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  const atlas = await new TextureLoader().loadAsync("/textures/terrain.png");
  atlas.magFilter = NearestFilter;
  atlas.minFilter = NearestFilter;
  atlas.generateMipmaps = false;
  atlas.colorSpace = SRGBColorSpace;
  completeBootTask("textures");

  await nextFrame();
  const world = generateWorld(1337, 112);
  completeBootTask("terrain");

  const scene = new Scene();
  scene.fog = new Fog(HORIZON, 26, world.size / 2 - 2);

  const opaqueMat = new MeshBasicMaterial({ map: atlas, vertexColors: true });
  const cutoutMat = new MeshBasicMaterial({ map: atlas, vertexColors: true, alphaTest: 0.5, side: DoubleSide });
  const waterMat = new MeshBasicMaterial({
    map: atlas,
    vertexColors: true,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  const geometries = [toGeometry(world.opaque), toGeometry(world.cutout), toGeometry(world.water)];
  scene.add(new Mesh(geometries[0], opaqueMat));
  scene.add(new Mesh(geometries[1], cutoutMat));
  const waterMesh = new Mesh(geometries[2], waterMat);
  waterMesh.renderOrder = 2;
  scene.add(waterMesh);

  const clouds = cloudTexture();
  const cloudFade = radialAlpha();
  const cloudSize = 420;
  clouds.repeat.set(cloudSize / (32 * 12), cloudSize / (32 * 12));
  const cloudGeo = new PlaneGeometry(cloudSize, cloudSize);
  cloudGeo.rotateX(Math.PI / 2);
  const cloudMat = new MeshBasicMaterial({
    map: clouds,
    alphaMap: cloudFade,
    transparent: true,
    opacity: 0.82,
    side: DoubleSide,
    depthWrite: false,
    fog: false,
  });
  const cloudMesh = new Mesh(cloudGeo, cloudMat);
  cloudMesh.position.y = world.cameraHeight + 26;
  cloudMesh.renderOrder = 1;
  scene.add(cloudMesh);

  const camera = new PerspectiveCamera(70, 1, 0.1, 400);
  camera.rotation.order = "YXZ";
  camera.position.set(0.5, world.cameraHeight, 0.5);
  camera.rotation.x = -0.24;

  container.appendChild(canvas);

  let width = 0;
  let height = 0;
  const applySize = () => {
    width = container.clientWidth || window.innerWidth;
    height = container.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const scale = opts.dimmed ? 0.5 : opts.quality === "fast" ? 0.6 : dpr;
    renderer.setPixelRatio(scale);
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  };

  let elapsed = 0;
  let lastRender = -1;
  let firstFrame = false;

  const draw = () => {
    camera.rotation.y = START_YAW + elapsed * YAW_SPEED;
    clouds.offset.x = (elapsed * 0.0016) % 1;
    renderer.render(scene, camera);
    if (!firstFrame) {
      firstFrame = true;
      onFirstFrame();
    }
  };

  const tick = (time: number, deltaTime: number) => {
    elapsed += Math.min(deltaTime, 100) / 1000;
    // dimmed backgrounds and "fast" graphics render at ~30fps
    const minGap = opts.dimmed || opts.quality === "fast" ? 1 / 31 : 0;
    if (lastRender >= 0 && time - lastRender < minGap) return;
    lastRender = time;
    draw();
  };

  let running = false;
  const start = () => {
    if (running || disposed) return;
    running = true;
    gsap.ticker.add(tick);
  };
  function stop() {
    if (!running) return;
    running = false;
    gsap.ticker.remove(tick);
  }

  const ro = new ResizeObserver(() => {
    applySize();
    if (!running) draw();
  });
  ro.observe(container);

  const configure = (next: PanoramaOptions) => {
    opts = next;
    applySize();
    if (next.animate) start();
    else {
      stop();
      draw();
    }
  };

  configure(initial);

  return {
    configure,
    dispose() {
      disposed = true;
      stop();
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      geometries.forEach((g) => g.dispose());
      cloudGeo.dispose();
      [opaqueMat, cutoutMat, waterMat, cloudMat].forEach((m) => m.dispose());
      atlas.dispose();
      clouds.dispose();
      cloudFade.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
