import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Clock,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Sparkles,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { BookItem } from '../types.ts';
import {
  getTimeOfDay,
  getSkyPalette,
  getLastTrackedActivity,
  calculateReadingTier,
  calculateBookStacks,
  TimeOfDay,
} from '../utils/achievementLogic.ts';

interface AchievementViewProps {
  onBack: () => void;
  books: BookItem[];
}

interface LeafParticle {
  group: THREE.Group;
  fallSpeed: number;
  swayFreqX: number;
  swayAmpX: number;
  swayFreqZ: number;
  swayAmpZ: number;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  baseX: number;
  baseZ: number;
  spawnY: number;
}

export const AchievementView: React.FC<AchievementViewProps> = ({ onBack, books }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Real-time time of day
  const currentHour = new Date().getHours();
  const initialRealtimeMode = getTimeOfDay(currentHour);

  // Time-of-day mode: 'auto' (realtime) or manual override
  const [selectedTimeMode, setSelectedTimeMode] = useState<'auto' | TimeOfDay>('auto');
  const activeTimeOfDay: TimeOfDay =
    selectedTimeMode === 'auto' ? initialRealtimeMode : selectedTimeMode;

  // Last tracked activity for the floating sketch bubble
  const lastTracked = getLastTrackedActivity(books);

  // Filtered book subsets
  const doneBooks = books.filter((b) => b.status === 'done');
  const progressBooks = books.filter((b) => b.status === 'progress');
  const readingTier = calculateReadingTier(doneBooks.length);

  // Floating notification state ("Today - Sapiens +5 page" with 2.5s transition)
  const [showTodayToast, setShowTodayToast] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Auto-hide floating toast after 2.8 seconds on initial load, matching prompt
  useEffect(() => {
    setShowTodayToast(true);
    const timer = setTimeout(() => {
      setShowTodayToast(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  // Three.js Scene Setup & Lifecycle
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Palette for current time of day
    const palette = getSkyPalette(activeTimeOfDay);

    // Scene with fog matching atmospheric sky
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(palette.skyBottom);
    scene.fog = new THREE.Fog(palette.skyBottom, 22, 58);

    // Camera (cozy isometric perspective focused on reader and tree)
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 140);
    camera.position.set(0, 4.4, 11.2);
    camera.lookAt(0, 1.35, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = palette.isNight ? 0.95 : 1.18;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Ambient & Hemisphere Lighting (Natural sky-to-ground bounce)
    const ambientLight = new THREE.AmbientLight(palette.ambientLight, palette.isNight ? 0.9 : 1.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(palette.skyTop, palette.groundColor, palette.isNight ? 0.5 : 0.75);
    scene.add(hemiLight);

    // Directional Sun/Moon Light with soft shadows
    const dirLight = new THREE.DirectionalLight(palette.sunMoonColor, palette.lightIntensity * 1.4);
    dirLight.position.set(palette.isNight ? -8 : 8, 14, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 40;
    dirLight.shadow.camera.left = -14;
    dirLight.shadow.camera.right = 14;
    dirLight.shadow.camera.top = 14;
    dirLight.shadow.camera.bottom = -14;
    dirLight.shadow.bias = -0.0008;
    scene.add(dirLight);

    // Dedicated warm fill light ensuring character, face, and held book are clearly illuminated
    const characterFillLight = new THREE.DirectionalLight(
      palette.isNight ? '#94A3B8' : '#FFF7ED',
      palette.isNight ? 0.45 : 0.8
    );
    characterFillLight.position.set(0, 4.5, 9.5);
    scene.add(characterFillLight);

    // Subtle rim light from opposite angle for artistic depth
    const rimLight = new THREE.DirectionalLight(palette.ambientLight, palette.isNight ? 0.35 : 0.5);
    rimLight.position.set(palette.isNight ? 8 : -8, 8, -10);
    scene.add(rimLight);

    // =========================================================================
    // 1. EXPANSIVE MEADOW & SURROUNDING ROLLING HILLS (Lush Rolling Grass Front & Back)
    // =========================================================================
    const landscapeGroup = new THREE.Group();

    // Primary central hill material
    const groundMat = new THREE.MeshLambertMaterial({
      color: palette.groundColor,
      flatShading: true,
    });

    // Softer distant meadow plane material (slightly blended with fog)
    const distantMeadowMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(palette.groundColor).offsetHSL(0.02, -0.08, -0.04),
      flatShading: true,
    });

    // Broad outer meadow plane stretching wide to eliminate any void in front or around
    const broadMeadowGeo = new THREE.CircleGeometry(65, 48);
    const broadMeadow = new THREE.Mesh(broadMeadowGeo, distantMeadowMat);
    broadMeadow.rotation.x = -Math.PI / 2;
    broadMeadow.position.y = -0.85;
    broadMeadow.receiveShadow = true;
    landscapeGroup.add(broadMeadow);

    // Main central grassy hillock (smooth layered tiers)
    const baseHillGeo = new THREE.CylinderGeometry(8.5, 10.5, 1.4, 28);
    const baseHill = new THREE.Mesh(baseHillGeo, groundMat);
    baseHill.position.y = -0.7;
    baseHill.receiveShadow = true;
    landscapeGroup.add(baseHill);

    // Top gentle grassy terrace
    const topHillGeo = new THREE.CylinderGeometry(5.8, 6.6, 0.45, 22);
    const topHill = new THREE.Mesh(topHillGeo, groundMat);
    topHill.position.y = 0.12;
    topHill.receiveShadow = true;
    landscapeGroup.add(topHill);

    // Surrounding rolling green knolls / mounds (positioned naturally on the flanks & background)
    const knollMat1 = new THREE.MeshLambertMaterial({
      color: new THREE.Color(palette.groundColor).offsetHSL(-0.02, 0.05, 0.03),
      flatShading: true,
    });
    const knollMat2 = new THREE.MeshLambertMaterial({
      color: new THREE.Color(palette.groundColor).offsetHSL(0.03, -0.05, -0.02),
      flatShading: true,
    });

    const knollData = [
      // Flanking knolls (framing left and right gracefully without blocking the center view)
      { x: -6.8, z: 4.8, r: 4.2, h: 1.1, mat: knollMat1 },
      { x: 6.8, z: 4.8, r: 4.2, h: 1.1, mat: knollMat2 },
      { x: -8.8, z: 8.5, r: 5.5, h: 1.4, mat: knollMat2 },
      { x: 8.8, z: 8.5, r: 5.5, h: 1.4, mat: knollMat1 },
      { x: -11.5, z: 12.0, r: 6.5, h: 1.6, mat: knollMat1 },
      { x: 11.5, z: 12.0, r: 6.5, h: 1.6, mat: knollMat2 },
      // Side knolls
      { x: -9.5, z: -2.5, r: 4.8, h: 2.2, mat: knollMat1 },
      { x: 10.0, z: -1.0, r: 5.2, h: 2.4, mat: knollMat2 },
      { x: -12.0, z: 4.5, r: 6.0, h: 2.6, mat: knollMat1 },
      { x: 12.0, z: 4.5, r: 6.0, h: 2.6, mat: knollMat2 },
      // Background knolls behind tree
      { x: -4.5, z: -9.5, r: 6.5, h: 3.2, mat: knollMat1 },
      { x: 5.0, z: -9.0, r: 6.0, h: 2.9, mat: knollMat2 },
      { x: 0.0, z: -12.0, r: 7.2, h: 3.6, mat: knollMat1 },
    ];

    knollData.forEach((k) => {
      const geo = new THREE.SphereGeometry(k.r, 14, 10);
      const mesh = new THREE.Mesh(geo, k.mat);
      mesh.scale.set(1.1, k.h / k.r, 1.1);
      mesh.position.set(k.x, -0.6 + k.h * 0.45, k.z);
      mesh.receiveShadow = true;
      landscapeGroup.add(mesh);
    });

    // Gentle stepping cobblestones on the hill near tree
    const stoneMat = new THREE.MeshLambertMaterial({
      color: '#A0988A',
      flatShading: true,
    });
    const steppingStones = [
      { x: 0.4, y: 0.22, z: 1.6, sx: 0.55, sz: 0.45 },
      { x: -0.5, y: 0.22, z: 1.9, sx: 0.48, sz: 0.52 },
      { x: 0.1, y: 0.21, z: 2.3, sx: 0.6, sz: 0.5 },
      { x: -0.3, y: 0.18, z: 3.1, sx: 0.52, sz: 0.48 },
      { x: 0.35, y: 0.16, z: 3.9, sx: 0.58, sz: 0.52 },
    ];
    steppingStones.forEach((st) => {
      const sMesh = new THREE.Mesh(new THREE.CylinderGeometry(st.sx * 0.5, st.sx * 0.55, 0.08, 7), stoneMat);
      sMesh.position.set(st.x, st.y, st.z);
      sMesh.receiveShadow = true;
      landscapeGroup.add(sMesh);
    });

    scene.add(landscapeGroup);

    // =========================================================================
    // 2. MAJESTIC PANORAMIC MOUNTAIN CHAINS (Surrounding Valley & In Front of User)
    // =========================================================================
    const mountainsGroup = new THREE.Group();

    // Far mountain material with soft atmospheric tint
    const mtnMatDeep = new THREE.MeshLambertMaterial({
      color: palette.mountainFar,
      flatShading: true,
    });
    const mtnMatMid = new THREE.MeshLambertMaterial({
      color: palette.mountainNear,
      flatShading: true,
    });
    const mtnMatFoothill = new THREE.MeshLambertMaterial({
      color: new THREE.Color(palette.groundColor).offsetHSL(0.04, -0.15, -0.12),
      flatShading: true,
    });

    // Mountain peaks: Behind tree, flanking sides, and IN FRONT of the user!
    const mountainPeaks = [
      // Deep backdrop mountain peaks (behind tree)
      { x: -16.0, y: 5.5, z: -25.0, r: 9.5, h: 16.0, sides: 7, mat: mtnMatDeep },
      { x: -7.0, y: 7.0, z: -27.0, r: 11.5, h: 19.5, sides: 8, mat: mtnMatDeep },
      { x: 3.5, y: 8.5, z: -29.0, r: 13.0, h: 22.0, sides: 8, mat: mtnMatDeep },
      { x: 14.5, y: 6.5, z: -26.0, r: 10.5, h: 17.5, sides: 7, mat: mtnMatDeep },
      // Mid-ground mountain ridges (behind tree)
      { x: -11.0, y: 3.5, z: -18.0, r: 7.5, h: 11.0, sides: 6, mat: mtnMatMid },
      { x: -1.5, y: 4.2, z: -19.5, r: 8.5, h: 12.5, sides: 7, mat: mtnMatMid },
      { x: 9.0, y: 3.8, z: -18.5, r: 7.8, h: 11.5, sides: 6, mat: mtnMatMid },
      // Near foothills connecting behind
      { x: -14.0, y: 1.8, z: -12.0, r: 6.0, h: 6.5, sides: 6, mat: mtnMatFoothill },
      { x: 13.0, y: 2.0, z: -12.5, r: 6.5, h: 7.0, sides: 6, mat: mtnMatFoothill },

      // Flanking mountains (Left & Right)
      { x: -28.0, y: 5.5, z: 0.0, r: 11.0, h: 17.5, sides: 7, mat: mtnMatDeep },
      { x: -22.0, y: 3.5, z: 6.5, r: 8.5, h: 12.0, sides: 6, mat: mtnMatMid },
      { x: 28.0, y: 5.5, z: 0.0, r: 11.0, h: 17.5, sides: 7, mat: mtnMatDeep },
      { x: 22.0, y: 3.5, z: 6.5, r: 8.5, h: 12.0, sides: 6, mat: mtnMatMid },

      // Foreground Mountain Peaks in Front of User & Camera Horizon
      { x: -19.0, y: 5.0, z: 24.0, r: 10.5, h: 16.5, sides: 7, mat: mtnMatDeep },
      { x: -9.5, y: 3.6, z: 21.0, r: 8.5, h: 11.5, sides: 6, mat: mtnMatMid },
      { x: 19.0, y: 5.0, z: 24.0, r: 10.5, h: 16.5, sides: 7, mat: mtnMatDeep },
      { x: 9.5, y: 3.6, z: 21.0, r: 8.5, h: 11.5, sides: 6, mat: mtnMatMid },
      { x: -14.0, y: 1.9, z: 15.5, r: 6.5, h: 7.0, sides: 6, mat: mtnMatFoothill },
      { x: 14.0, y: 1.9, z: 15.5, r: 6.5, h: 7.0, sides: 6, mat: mtnMatFoothill },
    ];

    mountainPeaks.forEach((p) => {
      const geo = new THREE.ConeGeometry(p.r, p.h, p.sides);
      const mesh = new THREE.Mesh(geo, p.mat);
      mesh.position.set(p.x, p.y, p.z);
      mountainsGroup.add(mesh);
    });
    scene.add(mountainsGroup);

    // =========================================================================
    // 3. ENCHANTED CELESTIAL SKY: SUN / MOON WITH AURA & TWINKLE STARS
    // =========================================================================
    const celestialGroup = new THREE.Group();

    // Sun or Moon sphere
    const sunMoonGeo = new THREE.SphereGeometry(1.35, 16, 16);
    const sunMoonMat = new THREE.MeshBasicMaterial({ color: palette.sunMoonColor });
    const sunMoon = new THREE.Mesh(sunMoonGeo, sunMoonMat);
    const sunPos = {
      x: palette.isNight ? -6.5 : 6.8,
      y: 9.8,
      z: -16.0,
    };
    sunMoon.position.set(sunPos.x, sunPos.y, sunPos.z);
    celestialGroup.add(sunMoon);

    // Glowing outer halo ring
    const haloGeo = new THREE.RingGeometry(1.5, 3.2, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: palette.sunMoonColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: palette.isNight ? 0.22 : 0.35,
    });
    const sunHalo = new THREE.Mesh(haloGeo, haloMat);
    sunHalo.position.set(sunPos.x, sunPos.y, sunPos.z + 0.1);
    sunHalo.lookAt(camera.position);
    celestialGroup.add(sunHalo);

    // Starfield for night sky (only visible or active at night)
    let starsObj: THREE.Points | null = null;
    if (palette.isNight) {
      const starCount = 110;
      const starGeo = new THREE.BufferGeometry();
      const starCoords = new Float32Array(starCount * 3);
      for (let s = 0; s < starCount; s++) {
        starCoords[s * 3] = (Math.random() - 0.5) * 44;
        starCoords[s * 3 + 1] = 4 + Math.random() * 18;
        starCoords[s * 3 + 2] = -12 - Math.random() * 22;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
      const starMat = new THREE.PointsMaterial({
        color: '#FFFFFF',
        size: 0.18,
        transparent: true,
        opacity: 0.85,
      });
      starsObj = new THREE.Points(starGeo, starMat);
      celestialGroup.add(starsObj);
    }

    scene.add(celestialGroup);

    // =========================================================================
    // 4. MULTI-TIER FLUFFY DRIFTING CLOUDS
    // =========================================================================
    const cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({
      color: palette.isNight ? '#384659' : '#FFFFFF',
      flatShading: true,
      transparent: true,
      opacity: palette.isNight ? 0.65 : 0.92,
    });

    const createCloud = (x: number, y: number, z: number, scale: number) => {
      const cloud = new THREE.Group();
      const numBlocks = 6;
      for (let i = 0; i < numBlocks; i++) {
        const boxGeo = new THREE.BoxGeometry(
          1.3 + Math.random() * 0.9,
          0.65 + Math.random() * 0.45,
          0.85 + Math.random() * 0.45
        );
        const box = new THREE.Mesh(boxGeo, cloudMat);
        box.position.set(
          (i - 2.5) * 0.72,
          (Math.random() - 0.5) * 0.35,
          (Math.random() - 0.5) * 0.35
        );
        box.castShadow = !palette.isNight;
        cloud.add(box);
      }
      cloud.position.set(x, y, z);
      cloud.scale.setScalar(scale);
      return cloud;
    };

    const cloud1 = createCloud(-8.5, 8.5, -9.0, 1.3);
    const cloud2 = createCloud(5.2, 9.8, -12.0, 1.05);
    const cloud3 = createCloud(-2.0, 11.0, -15.0, 1.45);
    const cloud4 = createCloud(9.5, 7.8, -8.0, 0.9);
    cloudsGroup.add(cloud1, cloud2, cloud3, cloud4);
    scene.add(cloudsGroup);

    // =========================================================================
    // 5. LUSH VOXEL TREE IN CENTER WITH EXPANDED FOLIAGE CLUSTERS
    // =========================================================================
    const treeGroup = new THREE.Group();
    const trunkMat = new THREE.MeshLambertMaterial({
      color: palette.treeTrunk,
      flatShading: true,
    });

    // Trunk body
    const trunkGeo = new THREE.CylinderGeometry(0.58, 0.95, 4.0, 10);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, 1.95, -0.2);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Roots firmly gripping the grassy knoll
    const rootMat = new THREE.MeshLambertMaterial({ color: palette.treeTrunk, flatShading: true });
    const roots = [
      { x: 0.72, y: 0.28, z: 0.35, ry: 0.45, sx: 0.38, sz: 1.3 },
      { x: -0.72, y: 0.28, z: 0.25, ry: -0.4, sx: 0.36, sz: 1.2 },
      { x: 0.1, y: 0.26, z: -0.85, ry: 1.5, sx: 0.42, sz: 1.1 },
    ];
    roots.forEach((r) => {
      const rMesh = new THREE.Mesh(new THREE.BoxGeometry(r.sx, 0.32, r.sz), rootMat);
      rMesh.position.set(r.x, r.y, r.z);
      rMesh.rotation.y = r.ry;
      rMesh.castShadow = true;
      rMesh.receiveShadow = true;
      treeGroup.add(rMesh);
    });

    // Lush Foliage: 8 interlocking organic voxel tiers
    const foliageMat = new THREE.MeshLambertMaterial({
      color: palette.treeFoliage,
      flatShading: true,
    });
    const foliageMatLight = new THREE.MeshLambertMaterial({
      color: new THREE.Color(palette.treeFoliage).offsetHSL(0.04, 0.12, 0.1),
      flatShading: true,
    });
    const foliageMatDeep = new THREE.MeshLambertMaterial({
      color: new THREE.Color(palette.treeFoliage).offsetHSL(-0.02, -0.05, -0.08),
      flatShading: true,
    });

    const foliageGroup = new THREE.Group();
    const foliageBlocks = [
      { x: 0, y: 3.9, z: -0.2, sx: 4.1, sy: 1.8, sz: 3.8, mat: foliageMat },
      { x: 0, y: 4.9, z: -0.2, sx: 3.4, sy: 1.6, sz: 3.2, mat: foliageMatLight },
      { x: 0, y: 5.9, z: -0.2, sx: 2.4, sy: 1.3, sz: 2.3, mat: foliageMat },
      { x: -1.3, y: 3.7, z: 0.35, sx: 1.8, sy: 1.5, sz: 1.8, mat: foliageMatLight },
      { x: 1.3, y: 3.8, z: 0.25, sx: 1.9, sy: 1.5, sz: 1.9, mat: foliageMatDeep },
      { x: 0.2, y: 4.3, z: 1.25, sx: 1.7, sy: 1.4, sz: 1.7, mat: foliageMatLight },
      { x: -0.3, y: 4.4, z: -1.45, sx: 1.8, sy: 1.4, sz: 1.7, mat: foliageMatDeep },
      { x: 0.8, y: 5.3, z: -0.8, sx: 1.6, sy: 1.2, sz: 1.5, mat: foliageMatLight },
    ];

    foliageBlocks.forEach((fb) => {
      const geo = new THREE.BoxGeometry(fb.sx, fb.sy, fb.sz);
      const mesh = new THREE.Mesh(geo, fb.mat);
      mesh.position.set(fb.x, fb.y, fb.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      foliageGroup.add(mesh);
    });
    treeGroup.add(foliageGroup);
    scene.add(treeGroup);

    // =========================================================================
    // 6. HIGHLY DETAILED CHARACTER: RELAXED SEATED POSTURE HOLDING OPEN BOOK
    // =========================================================================
    const characterGroup = new THREE.Group();
    characterGroup.position.set(0.12, 0.32, 0.68);

    const skinColor = '#F5CEB2';
    const hairColor = '#24170E';
    const sweaterColor = '#FAF5EA';
    const sweaterTrim = '#ECE1CE';
    const pantsColor = '#342316';
    const shoeColor = '#22140C';

    const skinMat = new THREE.MeshLambertMaterial({ color: skinColor, flatShading: true });
    const hairMat = new THREE.MeshLambertMaterial({ color: hairColor, flatShading: true });
    const sweaterMat = new THREE.MeshLambertMaterial({ color: sweaterColor, flatShading: true });
    const sweaterTrimMat = new THREE.MeshLambertMaterial({ color: sweaterTrim, flatShading: true });
    const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor, flatShading: true });
    const shoeMat = new THREE.MeshLambertMaterial({ color: shoeColor, flatShading: true });

    // Torso (cozy knitted sweater leaning back comfortably against trunk)
    const torsoGeo = new THREE.BoxGeometry(0.54, 0.70, 0.40);
    const torso = new THREE.Mesh(torsoGeo, sweaterMat);
    torso.position.set(0, 0.62, 0);
    torso.rotation.x = -0.18;
    torso.castShadow = true;
    characterGroup.add(torso);

    // Ribbed collar trim
    const collarGeo = new THREE.BoxGeometry(0.38, 0.08, 0.32);
    const collar = new THREE.Mesh(collarGeo, sweaterTrimMat);
    collar.position.set(0, 0.98, 0.06);
    collar.rotation.x = -0.18;
    characterGroup.add(collar);

    // Sweater bottom hem band
    const hemGeo = new THREE.BoxGeometry(0.56, 0.1, 0.42);
    const hem = new THREE.Mesh(hemGeo, sweaterTrimMat);
    hem.position.set(0, 0.32, -0.05);
    hem.rotation.x = -0.18;
    characterGroup.add(hem);

    // Head tilted down toward the open book
    const headGeo = new THREE.BoxGeometry(0.40, 0.40, 0.38);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 1.10, 0.12);
    head.rotation.x = 0.24; // Focused downward reading angle looking directly at pages
    head.castShadow = true;

    // Detailed facial features: cute reading eyes angled down
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#2B1B10' });
    const eyeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.02), eyeMat);
    eyeLeft.position.set(-0.10, -0.03, 0.195);
    const eyeRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.02), eyeMat);
    eyeRight.position.set(0.10, -0.03, 0.195);
    head.add(eyeLeft, eyeRight);

    // Soft blush cheeks
    const blushMat = new THREE.MeshBasicMaterial({ color: '#F8B4A6', transparent: true, opacity: 0.75 });
    const blushLeft = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.02), blushMat);
    blushLeft.position.set(-0.13, -0.09, 0.195);
    const blushRight = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.02), blushMat);
    blushRight.position.set(0.13, -0.09, 0.195);
    head.add(blushLeft, blushRight);

    // Detailed Layered Hair with bangs and sideburns
    const hairCrown = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 0.44), hairMat);
    hairCrown.position.set(0, 0.17, -0.01);
    head.add(hairCrown);

    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.30, 0.16), hairMat);
    hairBack.position.set(0, 0.02, -0.17);
    head.add(hairBack);

    // Front bangs fringe
    const hairBangs = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.11, 0.12), hairMat);
    hairBangs.position.set(0, 0.16, 0.17);
    head.add(hairBangs);

    // Sleek headphones resting on ears (aesthetic mindful touch)
    const hpBandMat = new THREE.MeshLambertMaterial({ color: '#3A5A40' });
    const hpCupMat = new THREE.MeshLambertMaterial({ color: '#223827' });

    const hpBand = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.12), hpBandMat);
    hpBand.position.set(0, 0.23, 0);
    head.add(hpBand);

    const hpLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.15), hpCupMat);
    hpLeft.position.set(-0.22, 0.02, 0);
    const hpRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.15), hpCupMat);
    hpRight.position.set(0.22, 0.02, 0);
    head.add(hpLeft, hpRight);

    characterGroup.add(head);

    // Legs: Cozy seated posture with knees bent naturally on grass
    const legLeft = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.76), pantsMat);
    legLeft.position.set(-0.19, 0.12, 0.40);
    legLeft.castShadow = true;

    const legRight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.76), pantsMat);
    legRight.position.set(0.19, 0.12, 0.40);
    legRight.castShadow = true;
    characterGroup.add(legLeft, legRight);

    // Shoes at the feet
    const shoeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.15, 0.30), shoeMat);
    shoeLeft.position.set(-0.19, 0.08, 0.78);
    shoeLeft.castShadow = true;

    const shoeRight = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.15, 0.30), shoeMat);
    shoeRight.position.set(0.19, 0.08, 0.78);
    shoeRight.castShadow = true;
    characterGroup.add(shoeLeft, shoeRight);

    // =========================================================================
    // PROMINENT HELD BOOK & HANDS (Fixes: Player holding book bug)
    // =========================================================================
    const heldBookGroup = new THREE.Group();
    // Positioned right in front of chest & above lap
    heldBookGroup.position.set(0, 0.62, 0.52);
    // Tilted toward camera so open pages & text are completely visible!
    heldBookGroup.rotation.set(0.44, 0, 0);

    const bookCoverMat = new THREE.MeshLambertMaterial({ color: '#997950', flatShading: true });
    const bookPageMat = new THREE.MeshLambertMaterial({ color: '#FFFDF5', flatShading: true });
    const bookTextLineMat = new THREE.MeshBasicMaterial({ color: '#6A5440' });
    const bookmarkMat = new THREE.MeshLambertMaterial({ color: '#D97706' });

    // Sturdy hardcover back base
    const bookBackCover = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.03, 0.50), bookCoverMat);
    bookBackCover.position.set(0, -0.025, 0);
    heldBookGroup.add(bookBackCover);

    // Central spine
    const bookSpine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.52), bookCoverMat);
    bookSpine.position.set(0, 0.0, 0);
    heldBookGroup.add(bookSpine);

    // Left page spread
    const pageLeft = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.045, 0.46), bookPageMat);
    pageLeft.position.set(-0.17, 0.015, 0);
    pageLeft.rotation.z = -0.12;
    pageLeft.castShadow = true;
    heldBookGroup.add(pageLeft);

    // Right page spread
    const pageRight = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.045, 0.46), bookPageMat);
    pageRight.position.set(0.17, 0.015, 0);
    pageRight.rotation.z = 0.12;
    pageRight.castShadow = true;
    heldBookGroup.add(pageRight);

    // Delicate printed text lines on the creamy pages
    for (let line = 0; line < 3; line++) {
      const lineLeft = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.008, 0.03), bookTextLineMat);
      lineLeft.position.set(-0.17, 0.04, -0.12 + line * 0.11);
      lineLeft.rotation.z = -0.12;
      heldBookGroup.add(lineLeft);

      const lineRight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.008, 0.03), bookTextLineMat);
      lineRight.position.set(0.17, 0.04, -0.12 + line * 0.11);
      lineRight.rotation.z = 0.12;
      heldBookGroup.add(lineRight);
    }

    // Bookmark ribbon dangling down
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.015, 0.24), bookmarkMat);
    ribbon.position.set(0.02, 0.02, 0.22);
    ribbon.rotation.x = 0.25;
    heldBookGroup.add(ribbon);

    characterGroup.add(heldBookGroup);

    // Arms bent forward reaching hands to hold the book edges
    const armGeo = new THREE.BoxGeometry(0.15, 0.44, 0.15);
    const armLeft = new THREE.Mesh(armGeo, sweaterMat);
    armLeft.position.set(-0.31, 0.62, 0.26);
    armLeft.rotation.set(0.85, 0.18, 0.35);
    armLeft.castShadow = true;
    characterGroup.add(armLeft);

    const armRight = new THREE.Mesh(armGeo, sweaterMat);
    armRight.position.set(0.31, 0.62, 0.26);
    armRight.rotation.set(0.85, -0.18, -0.35);
    armRight.castShadow = true;
    characterGroup.add(armRight);

    // Sweater cuffs
    const cuffGeo = new THREE.BoxGeometry(0.16, 0.08, 0.16);
    const cuffLeft = new THREE.Mesh(cuffGeo, sweaterTrimMat);
    cuffLeft.position.set(-0.25, 0.58, 0.42);
    cuffLeft.rotation.set(0.85, 0.18, 0.35);
    characterGroup.add(cuffLeft);

    const cuffRight = new THREE.Mesh(cuffGeo, sweaterTrimMat);
    cuffRight.position.set(0.25, 0.58, 0.42);
    cuffRight.rotation.set(0.85, -0.18, -0.35);
    characterGroup.add(cuffRight);

    // Skin hands with fingers grasping the left & right sides of the book
    const handLeft = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.13), skinMat);
    handLeft.position.set(-0.28, 0.59, 0.52);
    handLeft.rotation.set(0.44, 0, -0.12);
    characterGroup.add(handLeft);

    const thumbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.06), skinMat);
    thumbLeft.position.set(-0.22, 0.63, 0.52);
    thumbLeft.rotation.set(0.44, 0, -0.12);
    characterGroup.add(thumbLeft);

    const handRight = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.13), skinMat);
    handRight.position.set(0.28, 0.59, 0.52);
    handRight.rotation.set(0.44, 0, 0.12);
    characterGroup.add(handRight);

    const thumbRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.06), skinMat);
    thumbRight.position.set(0.22, 0.63, 0.52);
    thumbRight.rotation.set(0.44, 0, 0.12);
    characterGroup.add(thumbRight);

    // Cozy ceramic tea mug sitting on a small flat stone
    const mugMat = new THREE.MeshLambertMaterial({ color: '#3A5A40', flatShading: true });
    const teaLiquidMat = new THREE.MeshLambertMaterial({ color: '#8C5E35' });
    const mugGroup = new THREE.Group();
    mugGroup.position.set(0.68, 0.22, 0.85);

    const mugMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.16, 10), mugMat);
    const teaMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 8), teaLiquidMat);
    teaMesh.position.y = 0.07;
    mugGroup.add(mugMesh, teaMesh);
    characterGroup.add(mugGroup);

    scene.add(characterGroup);

    // =========================================================================
    // 7. STACKS OF FINISHED & IN-PROGRESS BOOKS (Lying Flat, Max 5 Per Stack!)
    // =========================================================================
    const bookColors = ['#997950', '#3A5A40', '#D4A373', '#4A3220', '#2E5033', '#8C6D45', '#C07D4C', '#6B4226', '#5A6B42'];

    // Helper function to build flat horizontal book stacks (max 5 per stack, new stacks nearby)
    const createBookStackGroup = (
      totalBooksCount: number,
      side: 'right' | 'left',
      stackOffsets: { x: number; y: number; z: number; ry: number }[],
      isProgress: boolean
    ) => {
      const mainGroup = new THREE.Group();
      if (totalBooksCount <= 0) return mainGroup;

      // Split into stacks with maximum 5 books per stack
      const stacks = calculateBookStacks(totalBooksCount, 5);
      let globalBookIdx = 0;

      stacks.forEach((countInStack, sIdx) => {
        const offset = stackOffsets[sIdx % stackOffsets.length];
        const stackNode = new THREE.Group();
        stackNode.position.set(offset.x, offset.y, offset.z);
        stackNode.rotation.y = offset.ry;

        const bookThickness = 0.12;
        const bookWidth = 0.68;
        const bookDepth = 0.92;

        for (let b = 0; b < countInStack; b++) {
          const singleBook = new THREE.Group();
          const yPos = b * (bookThickness + 0.012);
          const jitterAngle = Math.sin((globalBookIdx + 1) * 2.3) * 0.14;

          const color = bookColors[globalBookIdx % bookColors.length];
          const bCoverMat = new THREE.MeshLambertMaterial({ color, flatShading: true });

          // 1. Hardcover outer shell (lying flat horizontally)
          const coverGeo = new THREE.BoxGeometry(bookWidth, bookThickness, bookDepth);
          const coverMesh = new THREE.Mesh(coverGeo, bCoverMat);
          coverMesh.castShadow = true;
          coverMesh.receiveShadow = true;
          singleBook.add(coverMesh);

          // 2. Creamy paper pages block inset
          const pagesGeo = new THREE.BoxGeometry(bookWidth * 0.94, bookThickness * 0.74, bookDepth * 0.94);
          const pagesMesh = new THREE.Mesh(pagesGeo, bookPageMat);
          pagesMesh.position.set(0.015, 0, 0.015);
          singleBook.add(pagesMesh);

          // 3. Satin ribbon bookmark draping over book edge
          const ribbonColor = isProgress ? '#EF4444' : '#D97706';
          const rMat = new THREE.MeshLambertMaterial({ color: ribbonColor });
          const ribbonMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.22), rMat);
          ribbonMesh.position.set(0.05, bookThickness * 0.35, bookDepth * 0.44);
          ribbonMesh.rotation.x = 0.2;
          singleBook.add(ribbonMesh);

          singleBook.position.set(0, yPos, 0);
          singleBook.rotation.y = jitterAngle;
          stackNode.add(singleBook);

          globalBookIdx++;
        }

        mainGroup.add(stackNode);
      });

      return mainGroup;
    };

    // Stacks of Finished Books on the RIGHT (lying flat horizontally, max 5 per stack, new stacks nearby)
    const finishedStackOffsets = [
      { x: 1.85, y: 0.40, z: 0.95, ry: 0.12 },
      { x: 2.65, y: 0.40, z: 1.45, ry: -0.22 },
      { x: 1.55, y: 0.40, z: 1.70, ry: 0.28 },
      { x: 3.10, y: 0.40, z: 0.85, ry: -0.15 },
    ];
    const finishedStackGroup = createBookStackGroup(
      doneBooks.length,
      'right',
      finishedStackOffsets,
      false
    );
    scene.add(finishedStackGroup);

    // Stacks of In-Progress Books on the LEFT (lying flat horizontally, max 5 per stack, new stacks nearby)
    const progressStackOffsets = [
      { x: -1.85, y: 0.40, z: 0.95, ry: -0.12 },
      { x: -2.65, y: 0.40, z: 1.45, ry: 0.22 },
      { x: -1.55, y: 0.40, z: 1.70, ry: -0.28 },
      { x: -3.10, y: 0.40, z: 0.85, ry: 0.15 },
    ];
    const inProgressGroup = createBookStackGroup(
      progressBooks.length,
      'left',
      progressStackOffsets,
      true
    );
    scene.add(inProgressGroup);

    // =========================================================================
    // 8. RICH & DIVERSE FLORA: DAISIES, POPPIES, LAVENDER, BUTTERCUPS & CLOVER
    // =========================================================================
    const floraGroup = new THREE.Group();
    const stemMat = new THREE.MeshLambertMaterial({ color: '#2B5735' });

    // Distinct Flower Blossom Materials
    const daisyMat = new THREE.MeshLambertMaterial({ color: '#FFFDF0', flatShading: true });
    const daisyCenterMat = new THREE.MeshLambertMaterial({ color: '#F59E0B' });
    const poppyMat = new THREE.MeshLambertMaterial({ color: '#EF4444', flatShading: true });
    const lavenderMat = new THREE.MeshLambertMaterial({ color: '#A855F7', flatShading: true });
    const buttercupMat = new THREE.MeshLambertMaterial({ color: '#FBBF24', flatShading: true });
    const pinkBlossomMat = new THREE.MeshLambertMaterial({ color: '#F472B6', flatShading: true });
    const grassBladeMat = new THREE.MeshLambertMaterial({ color: '#4E8752', flatShading: true });

    // 1. Daisies with radiating petals
    const createDaisy = (x: number, z: number) => {
      const g = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 4), stemMat);
      stem.position.y = 0.16;
      g.add(stem);

      const center = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), daisyCenterMat);
      center.position.y = 0.32;
      g.add(center);

      for (let p = 0; p < 4; p++) {
        const petal = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.06), daisyMat);
        petal.position.y = 0.31;
        petal.rotation.y = (p * Math.PI) / 4;
        g.add(petal);
      }
      g.position.set(x, 0.22, z);
      return g;
    };

    // 2. Poppies (vibrant cup bloom)
    const createPoppy = (x: number, z: number) => {
      const g = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 4), stemMat);
      stem.position.y = 0.175;
      g.add(stem);

      const cup = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.15), poppyMat);
      cup.position.y = 0.35;
      cup.rotation.y = Math.random() * Math.PI;
      g.add(cup);

      g.position.set(x, 0.22, z);
      return g;
    };

    // 3. Lavender / Bluebells (tiered spire stalk)
    const createLavender = (x: number, z: number) => {
      const g = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 4), stemMat);
      stem.position.y = 0.22;
      g.add(stem);

      for (let t = 0; t < 3; t++) {
        const cluster = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.09), lavenderMat);
        cluster.position.y = 0.3 + t * 0.07;
        g.add(cluster);
      }
      g.position.set(x, 0.22, z);
      return g;
    };

    // 4. Buttercup (sunny golden blossom)
    const createButtercup = (x: number, z: number) => {
      const g = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.26, 4), stemMat);
      stem.position.y = 0.13;
      g.add(stem);

      const blossom = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.13), buttercupMat);
      blossom.position.y = 0.27;
      blossom.rotation.y = 0.4;
      g.add(blossom);

      g.position.set(x, 0.22, z);
      return g;
    };

    // 5. Clover & Grass Tufts
    const createGrassTuft = (x: number, z: number) => {
      const g = new THREE.Group();
      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.08), grassBladeMat);
        blade.position.y = 0.11;
        blade.rotation.set((b - 1) * 0.2, (b * Math.PI) / 3, (b - 1) * 0.18);
        g.add(blade);
      }
      g.position.set(x, 0.22, z);
      return g;
    };

    // Distribute varied flora around the meadow hillock
    const flowerSpawns = [
      // Terrace & near tree
      { type: 'daisy', x: -1.2, z: 2.1 },
      { type: 'daisy', x: 1.1, z: 2.3 },
      { type: 'daisy', x: 2.4, z: 1.5 },
      { type: 'poppy', x: -2.3, z: 1.8 },
      { type: 'poppy', x: 1.6, z: 2.0 },
      { type: 'poppy', x: 0.8, z: 2.6 },
      { type: 'lavender', x: -1.8, z: 1.2 },
      { type: 'lavender', x: -2.5, z: 2.4 },
      { type: 'lavender', x: 2.2, z: 2.4 },
      { type: 'buttercup', x: -0.8, z: 2.5 },
      { type: 'buttercup', x: 1.4, z: 1.4 },
      { type: 'buttercup', x: -2.0, z: 0.6 },
      { type: 'grass', x: -1.5, z: 1.6 },
      { type: 'grass', x: 1.8, z: 1.8 },
      { type: 'grass', x: 0.2, z: 2.7 },
      { type: 'grass', x: -2.7, z: 1.9 },
      { type: 'grass', x: 2.7, z: 1.1 },

      // Foreground flowers across the rolling meadow in front
      { type: 'daisy', x: -2.2, z: 4.8 },
      { type: 'daisy', x: 1.8, z: 5.2 },
      { type: 'poppy', x: -0.8, z: 5.8 },
      { type: 'poppy', x: 2.5, z: 6.2 },
      { type: 'buttercup', x: -3.2, z: 6.5 },
      { type: 'buttercup', x: 0.5, z: 7.2 },
      { type: 'lavender', x: -1.5, z: 7.8 },
      { type: 'lavender', x: 3.0, z: 5.5 },
      { type: 'grass', x: -2.8, z: 5.2 },
      { type: 'grass', x: 2.0, z: 4.5 },
      { type: 'grass', x: 0.0, z: 6.2 },
      { type: 'grass', x: -1.0, z: 8.5 },
      { type: 'grass', x: 2.2, z: 8.2 },
    ];

    flowerSpawns.forEach((f) => {
      if (f.type === 'daisy') floraGroup.add(createDaisy(f.x, f.z));
      else if (f.type === 'poppy') floraGroup.add(createPoppy(f.x, f.z));
      else if (f.type === 'lavender') floraGroup.add(createLavender(f.x, f.z));
      else if (f.type === 'buttercup') floraGroup.add(createButtercup(f.x, f.z));
      else floraGroup.add(createGrassTuft(f.x, f.z));
    });
    scene.add(floraGroup);

    // =========================================================================
    // 9. FALLING REAL LEAF PARTICLES (Few & Graceful: 6 leaves only!)
    // =========================================================================
    const leafGroup = new THREE.Group();
    const leafBotanicalColors = ['#4E8752', '#3A5A40', '#D48B38', '#E07A5F', '#60993E', '#8C6D45'];
    const leafStemMat = new THREE.MeshLambertMaterial({ color: '#2B4028' });

    // Curved botanical leaf shape (true organic leaf)
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, -0.15);
    leafShape.bezierCurveTo(0.12, -0.06, 0.13, 0.08, 0, 0.18);
    leafShape.bezierCurveTo(-0.13, 0.08, -0.12, -0.06, 0, -0.15);

    const leafBladeGeo = new THREE.ExtrudeGeometry(leafShape, {
      depth: 0.012,
      bevelEnabled: false,
    });
    const leafStemGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.08, 4);

    const leafParticles: LeafParticle[] = [];
    const numLeaves = 6; // User requested: "cm beberapa aja jumlahnya sedikit aja"

    for (let l = 0; l < numLeaves; l++) {
      const singleLeafGroup = new THREE.Group();
      const col = leafBotanicalColors[l % leafBotanicalColors.length];
      const bladeMat = new THREE.MeshLambertMaterial({
        color: col,
        flatShading: true,
        side: THREE.DoubleSide,
      });
      const bladeMesh = new THREE.Mesh(leafBladeGeo, bladeMat);
      bladeMesh.castShadow = true;
      singleLeafGroup.add(bladeMesh);

      const stemMesh = new THREE.Mesh(leafStemGeo, leafStemMat);
      stemMesh.position.set(0, -0.18, 0);
      singleLeafGroup.add(stemMesh);

      // Initial randomized position within tree canopy volume
      const spawnX = -1.6 + Math.random() * 3.2;
      const spawnZ = -1.2 + Math.random() * 2.8;
      const spawnY = 3.8 + Math.random() * 2.2;

      singleLeafGroup.position.set(spawnX, Math.random() * 4.0 + 0.6, spawnZ);
      singleLeafGroup.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      singleLeafGroup.scale.setScalar(0.9 + Math.random() * 0.25);
      leafGroup.add(singleLeafGroup);

      leafParticles.push({
        group: singleLeafGroup,
        fallSpeed: 0.007 + Math.random() * 0.005, // Slow, peaceful, floating descent
        swayFreqX: 1.2 + Math.random() * 1.4,
        swayAmpX: 0.012 + Math.random() * 0.008,
        swayFreqZ: 0.9 + Math.random() * 1.2,
        swayAmpZ: 0.010 + Math.random() * 0.008,
        rotSpeedX: 0.012 + Math.random() * 0.018,
        rotSpeedY: 0.010 + Math.random() * 0.015,
        rotSpeedZ: 0.012 + Math.random() * 0.018,
        baseX: spawnX,
        baseZ: spawnZ,
        spawnY: spawnY,
      });
    }
    scene.add(leafGroup);

    // Night Fireflies / Daytime Floating Sunflecks
    const particleCount = palette.isNight ? 26 : 14;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      particlePositions[p * 3] = (Math.random() - 0.5) * 7.5;
      particlePositions[p * 3 + 1] = 0.5 + Math.random() * 3.8;
      particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 6.5;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: palette.isNight ? '#FDE047' : '#FEF08A',
      size: palette.isNight ? 0.2 : 0.12,
      transparent: true,
      opacity: 0.85,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // =========================================================================
    // 10. INTERACTIVE DRAG TO ROTATE (Smooth 3D Orbiting)
    // =========================================================================
    let isDragging = false;
    let prevMouseX = 0;
    let targetRotationY = 0;
    let currentRotationY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      targetRotationY += deltaX * 0.0055;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      prevMouseX = e.touches[0].clientX;
      targetRotationY += deltaX * 0.0075;
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElem.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // =========================================================================
    // 11. SMOOTH ANIMATION LOOP (Wind Sway, Drifting Leaves, Clouds & Twinkling)
    // =========================================================================
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera orbit lerp
      currentRotationY += (targetRotationY - currentRotationY) * 0.085;
      const radius = 11.2;
      camera.position.x = Math.sin(currentRotationY) * radius;
      camera.position.z = Math.cos(currentRotationY) * radius;
      camera.position.y = 4.4;
      camera.lookAt(0, 1.35, 0);

      // Gentle tree foliage breeze sway
      foliageGroup.rotation.z = Math.sin(elapsed * 1.1) * 0.022;
      foliageGroup.rotation.x = Math.cos(elapsed * 0.85) * 0.014;

      // Soft cloud drift
      cloud1.position.x = -8.5 + Math.sin(elapsed * 0.07) * 0.9;
      cloud2.position.x = 5.2 + Math.cos(elapsed * 0.05) * 0.8;
      cloud3.position.x = -2.0 + Math.sin(elapsed * 0.06) * 1.1;

      // Subtle star twinkle at night
      if (starsObj) {
        starsObj.rotation.y = elapsed * 0.004;
      }

      // Update falling leaf particles (flutter & looping descent)
      for (let i = 0; i < leafParticles.length; i++) {
        const lp = leafParticles[i];
        lp.group.position.y -= lp.fallSpeed;
        lp.group.position.x += Math.sin(elapsed * lp.swayFreqX + i) * lp.swayAmpX;
        lp.group.position.z += Math.cos(elapsed * lp.swayFreqZ + i) * lp.swayAmpZ;

        lp.group.rotation.x += lp.rotSpeedX;
        lp.group.rotation.y += lp.rotSpeedY;
        lp.group.rotation.z += lp.rotSpeedZ;

        // Reset to tree canopy upon reaching ground
        if (lp.group.position.y < 0.22) {
          lp.group.position.y = lp.spawnY;
          lp.group.position.x = lp.baseX + (Math.random() - 0.5) * 0.8;
          lp.group.position.z = lp.baseZ + (Math.random() - 0.5) * 0.8;
        }
      }

      // Floating sunflecks / fireflies
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < particleCount; k++) {
        let py = posAttr.getY(k);
        py += Math.sin(elapsed * 2.2 + k) * 0.0028;
        posAttr.setY(k, py);
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount or mode switch
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElem.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      // Dispose Three resources
      renderer.dispose();
      groundMat.dispose();
      broadMeadowGeo.dispose();
      distantMeadowMat.dispose();
      baseHillGeo.dispose();
      topHillGeo.dispose();
      trunkMat.dispose();
      trunkGeo.dispose();
      foliageMat.dispose();
      foliageMatLight.dispose();
      foliageMatDeep.dispose();
      leafBladeGeo.dispose();
      leafStemGeo.dispose();
      leafStemMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      if (mountRef.current && domElem.parentNode === mountRef.current) {
        mountRef.current.removeChild(domElem);
      }
    };
  }, [activeTimeOfDay, doneBooks.length, progressBooks.length]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col items-center">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between mb-6 flex-wrap gap-4">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 transition-all text-xs font-mono font-medium shadow-2xs cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Kembali</span>
        </button>

        {/* Time of Day Switcher: Realtime by default with preview options */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-[#A3B18A]/35 bg-[#FAF6EE] shadow-xs select-none">
          <button
            onClick={() => setSelectedTimeMode('auto')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              selectedTimeMode === 'auto'
                ? 'bg-[#3A5A40] text-white font-semibold shadow-xs'
                : 'text-neutral-700 hover:text-black'
            }`}
            title="Ikuti jam lokal sekarang secara real-time"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Otomatis (Jam {currentHour}:00)</span>
          </button>

          <div className="h-4 w-px bg-neutral-300 mx-0.5" />

          <button
            onClick={() => setSelectedTimeMode('pagi')}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
              selectedTimeMode === 'pagi'
                ? 'bg-[#FFAA44] text-white font-semibold shadow-xs'
                : 'text-neutral-600 hover:text-black'
            }`}
            title="Suasana Pagi"
          >
            <Sunrise className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pagi</span>
          </button>

          <button
            onClick={() => setSelectedTimeMode('siang')}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
              selectedTimeMode === 'siang'
                ? 'bg-[#4B88A2] text-white font-semibold shadow-xs'
                : 'text-neutral-600 hover:text-black'
            }`}
            title="Suasana Siang"
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Siang</span>
          </button>

          <button
            onClick={() => setSelectedTimeMode('sore')}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
              selectedTimeMode === 'sore'
                ? 'bg-[#E88873] text-white font-semibold shadow-xs'
                : 'text-neutral-600 hover:text-black'
            }`}
            title="Suasana Sore"
          >
            <Sunset className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sore</span>
          </button>

          <button
            onClick={() => setSelectedTimeMode('malam')}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
              selectedTimeMode === 'malam'
                ? 'bg-[#0F172A] text-white font-semibold shadow-xs'
                : 'text-neutral-600 hover:text-black'
            }`}
            title="Suasana Malam"
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Malam</span>
          </button>
        </div>
      </div>

      {/* Main 3D Pixel World Frame (Squircle Canvas Container) */}
      <div
        className={`relative w-full rounded-[2.5rem] border border-[#A3B18A]/40 overflow-hidden shadow-[0_12px_40px_rgba(58,90,64,0.08)] bg-gradient-to-b from-[#FAF6EE] to-[#EAE0D0] transition-all duration-300 ${
          isFullscreen ? 'fixed inset-4 z-50 rounded-3xl m-0 max-w-none' : 'aspect-4/3 sm:aspect-16/10 md:h-[540px]'
        }`}
      >
        {/* Three.js Canvas Container */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top Floating Controls Bar */}
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 z-20 flex items-start justify-between gap-2 pointer-events-none">
          {/* Left: Floating Toast or Re-show button */}
          <div className="pointer-events-auto">
            <AnimatePresence>
              {showTodayToast ? (
                <motion.div
                  initial={{ opacity: 0, y: -15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#A3B18A]/40 shadow-xl text-neutral-900 flex flex-col gap-0.5 sm:gap-1 max-w-[190px] sm:min-w-[200px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#3A5A40] font-bold">
                        Today
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    <div className="text-sm sm:text-lg font-bold font-sans tracking-tight text-neutral-950 truncate">
                      · {lastTracked.bookTitle}
                    </div>

                    <div className="font-mono text-xs sm:text-sm font-semibold text-[#3A5A40]">
                      +{lastTracked.pagesAdded} Page
                    </div>

                    <div className="text-[9px] sm:text-[10px] font-mono text-neutral-400 mt-0.5 border-t border-neutral-100 pt-1 line-clamp-1">
                      Buku Terakhir Ditrack
                    </div>
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={() => setShowTodayToast(true)}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-white/90 hover:bg-white backdrop-blur-sm border border-[#A3B18A]/40 shadow-sm text-[11px] sm:text-xs font-mono font-semibold text-[#3A5A40] flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
                  title="Tampilkan kembali info bacaan hari ini"
                >
                  <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#3A5A40]" />
                  <span className="truncate max-w-[120px] sm:max-w-none">Today: +{lastTracked.pagesAdded}p</span>
                </button>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Time Status & Fullscreen toggle */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-white/85 backdrop-blur-sm border border-[#A3B18A]/40 font-mono text-[10px] sm:text-xs text-neutral-800 shadow-2xs select-none flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="hidden sm:inline">{getSkyPalette(activeTimeOfDay).label}</span>
              <span className="sm:hidden capitalize font-semibold">{activeTimeOfDay}</span>
            </div>

            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-white/85 hover:bg-white backdrop-blur-sm border border-[#A3B18A]/40 text-neutral-800 transition-colors shadow-2xs cursor-pointer"
              title={isFullscreen ? 'Kecilkan' : 'Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" /> : <Maximize2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />}
            </button>
          </div>
        </div>

        {/* Floating Legends at Bottom overlay (sebelah kiri = Progres, sebelah kanan = Selesai) */}
        <div className="absolute bottom-3 sm:bottom-5 left-3 sm:left-5 right-3 sm:right-5 z-10 flex items-end justify-between pointer-events-none gap-2">
          {/* Sisi Kiri: Buku Tahap Progres (sesuai sketsa) */}
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md border border-[#A3B18A]/40 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md max-w-[145px] sm:max-w-[220px]">
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold mb-0.5">
              <BookOpen className="w-3 h-3 text-[#3A5A40] shrink-0" />
              <span className="truncate">Kiri · Progres</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight">
              {progressBooks.length} Sedang Dibaca
            </div>
            <p className="text-[9px] sm:text-[10px] font-mono text-neutral-500 mt-0.5 line-clamp-1 hidden sm:block">
              Buku yang belum tamat diletakkan di rerumputan
            </p>
          </div>

          {/* Tengah: Hint sentuh/geser 3D */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-[11px] font-mono shadow-xs select-none">
            <RotateCcw className="w-3 h-3 animate-spin-slow" />
            <span>Geser mouse / sentuh layar untuk putar sudut 3D</span>
          </div>

          {/* Sisi Kanan: Buku Tamat / Selesai (sesuai sketsa: bertumpuk) */}
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md border border-[#A3B18A]/40 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md max-w-[145px] sm:max-w-[220px] text-right">
            <div className="flex items-center justify-end gap-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold mb-0.5">
              <span className="truncate">Kanan · Tamat</span>
              <CheckCircle2 className="w-3 h-3 text-[#3A5A40] shrink-0" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight">
              {doneBooks.length} Buku Selesai
            </div>
            <p className="text-[9px] sm:text-[10px] font-mono text-neutral-500 mt-0.5 line-clamp-1 hidden sm:block">
              Buku yang telah selesai bertumpuk rapi di samping
            </p>
          </div>
        </div>
      </div>

      {/* Narrative & Stats Strip Underneath (Removed redundant Card 3 as requested) */}
      <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {/* Card 1: Detail Karakter */}
        <div className="p-5 rounded-2xl border border-[#A3B18A]/35 bg-[#FAF6EE] shadow-xs">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono font-semibold text-[#3A5A40]">
            <Sparkles className="w-4 h-4" />
            <span>Buku di Tangan Pembaca</span>
          </div>
          <div className="text-lg font-bold text-neutral-950 font-sans">
            {lastTracked.bookTitle}
          </div>
          <p className="text-xs text-neutral-600 font-mono mt-1">
            Halaman {lastTracked.currentPage} · Baru saja ditambah +{lastTracked.pagesAdded} halaman
          </p>
        </div>

        {/* Card 2: Peringkat Pembaca */}
        <div className="p-5 rounded-2xl border border-[#A3B18A]/35 bg-[#FAF6EE] shadow-xs">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono font-semibold text-[#3A5A40]">
            <CheckCircle2 className="w-4 h-4" />
            <span>{readingTier.rank}</span>
          </div>
          <div className="text-lg font-bold text-neutral-950 font-sans">
            {readingTier.title}
          </div>
          <p className="text-xs text-neutral-600 font-mono mt-1">
            {doneBooks.length} buku tamat dari {books.length} koleksi di perpustakaan
          </p>
        </div>
      </div>
    </div>
  );
};
