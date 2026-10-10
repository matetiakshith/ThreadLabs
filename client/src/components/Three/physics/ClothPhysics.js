import * as THREE from 'three';

/**
 * 3D Cloth Physics Engine based on Verlet Integration & Position-Based Dynamics (PBD)
 * Supports gravity, air drag, wind turbulence, angular inertia transfer, mannequin collision,
 * and interactive real-time vertex grabbing/pulling.
 */

export const FABRIC_PROFILES = {
  silk: {
    id: 'silk',
    name: 'Habotai Silk (रेशम)',
    mass: 0.05,
    stiffness: 0.18,
    damping: 0.985,
    windSensitivity: 2.4,
    stretchResistance: 0.88,
    bendingResistance: 0.12,
    description: 'Very soft, lightweight, and highly fluid with delicate flutter.'
  },
  cotton: {
    id: 'cotton',
    name: 'Organic Cotton / Khadi (सूती)',
    mass: 0.16,
    stiffness: 0.48,
    damping: 0.955,
    windSensitivity: 1.1,
    stretchResistance: 0.94,
    bendingResistance: 0.40,
    description: 'Medium weight, natural drape, balanced folds, and organic settle.'
  },
  denim: {
    id: 'denim',
    name: 'Raw Selvedge Denim (डेनिम)',
    mass: 0.42,
    stiffness: 0.82,
    damping: 0.93,
    windSensitivity: 0.45,
    stretchResistance: 0.98,
    bendingResistance: 0.85,
    description: 'Heavy and rugged with structured creases and firm resistance.'
  },
  leather: {
    id: 'leather',
    name: 'Full-Grain Leather (चमड़ा)',
    mass: 0.68,
    stiffness: 0.92,
    damping: 0.90,
    windSensitivity: 0.22,
    stretchResistance: 0.99,
    bendingResistance: 0.92,
    description: 'Very heavy, rigid silhouette with subtle, weighty deformation.'
  },
  polyester: {
    id: 'polyester',
    name: 'Techwear Ripstop Nylon / Poly',
    mass: 0.09,
    stiffness: 0.35,
    damping: 0.97,
    windSensitivity: 1.6,
    stretchResistance: 0.91,
    bendingResistance: 0.28,
    description: 'Lightweight, elastic springback, and aerodynamic response.'
  }
};

export class ClothParticle {
  constructor(x, y, z, mass = 0.1, isPinned = false) {
    this.position = new THREE.Vector3(x, y, z);
    this.previous = new THREE.Vector3(x, y, z);
    this.original = new THREE.Vector3(x, y, z);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.mass = mass;
    this.invMass = isPinned ? 0 : 1 / mass;
    this.isPinned = isPinned;
    this.isGrabbed = false;
    this.grabPosition = new THREE.Vector3();
    this.flexFactor = 1.0; // 0 = stiff (collar), 1 = free (hem)
  }

  addForce(force) {
    if (this.invMass === 0) return;
    this.acceleration.addScaledVector(force, this.invMass);
  }

  integrate(dt, damping) {
    if (this.isPinned) {
      this.position.copy(this.original);
      this.previous.copy(this.original);
      return;
    }

    if (this.isGrabbed) {
      this.position.copy(this.grabPosition);
      this.previous.copy(this.grabPosition);
      return;
    }

    // Verlet integration: x_next = x + (x - x_prev) * damping + a * dt^2
    const velocity = new THREE.Vector3().subVectors(this.position, this.previous).multiplyScalar(damping);
    const nextPos = new THREE.Vector3()
      .copy(this.position)
      .add(velocity)
      .addScaledVector(this.acceleration, dt * dt);

    this.previous.copy(this.position);
    this.position.copy(nextPos);
    this.acceleration.set(0, 0, 0);
  }
}

export class ClothConstraint {
  constructor(p1, p2, restDistance, stiffness = 0.9) {
    this.p1 = p1;
    this.p2 = p2;
    this.restDistance = restDistance !== undefined ? restDistance : p1.position.distanceTo(p2.position);
    this.stiffness = stiffness;
  }

  solve() {
    const delta = new THREE.Vector3().subVectors(this.p2.position, this.p1.position);
    const currentDist = delta.length();
    if (currentDist === 0) return;

    const diff = (currentDist - this.restDistance) / currentDist;
    const totalInvMass = this.p1.invMass + this.p2.invMass;
    if (totalInvMass === 0) return;

    const correction = delta.multiplyScalar(diff * this.stiffness);

    if (this.p1.invMass > 0 && !this.p1.isGrabbed) {
      this.p1.position.addScaledVector(correction, this.p1.invMass / totalInvMass);
    }
    if (this.p2.invMass > 0 && !this.p2.isGrabbed) {
      this.p2.position.addScaledVector(correction, -this.p2.invMass / totalInvMass);
    }
  }
}

export class ClothPhysicsSimulator {
  constructor(options = {}) {
    this.particles = [];
    this.constraints = [];
    this.mesh = null;
    this.geometry = null;
    this.vertexToParticleMap = [];

    this.profile = FABRIC_PROFILES.silk;
    this.gravity = new THREE.Vector3(0, -9.8, 0);
    this.wind = new THREE.Vector3(0.5, 0, 0.5);
    this.windIntensity = 1.0;
    this.windTurbulence = 0.5;
    
    // Mannequin collision capsules / spheres
    this.collisionSpheres = [
      { center: new THREE.Vector3(0, 0.85, 0), radius: 0.42 },   // Chest / shoulders
      { center: new THREE.Vector3(0, 0.35, 0), radius: 0.38 },   // Upper abdomen
      { center: new THREE.Vector3(0, -0.15, 0), radius: 0.39 },  // Waist / hips
      { center: new THREE.Vector3(0, -0.75, 0), radius: 0.40 },  // Upper thighs
      { center: new THREE.Vector3(-0.55, 0.6, 0), radius: 0.22 }, // Left shoulder/arm
      { center: new THREE.Vector3(0.55, 0.6, 0), radius: 0.22 },  // Right shoulder/arm
    ];

    this.grabbedParticle = null;
    this.angularVelocity = 0;
    this.prevRotationY = 0;
    this.time = 0;
  }

  setProfile(profileId) {
    if (FABRIC_PROFILES[profileId]) {
      this.profile = FABRIC_PROFILES[profileId];
      // Update particle masses
      this.particles.forEach(p => {
        if (!p.isPinned) {
          p.mass = this.profile.mass;
          p.invMass = 1 / this.profile.mass;
        }
      });
      // Update constraint stiffness
      this.constraints.forEach(c => {
        c.stiffness = this.profile.stiffness;
      });
    }
  }

  /**
   * Initializes cloth grid from a BufferGeometry
   */
  initFromGeometry(geometry, mesh, options = {}) {
    this.geometry = geometry;
    this.mesh = mesh;
    this.particles = [];
    this.constraints = [];
    this.vertexToParticleMap = [];

    const posAttr = geometry.attributes.position;
    const vertexCount = posAttr.count;

    // Pinning predicate
    const isPinnedFn = options.isPinned || ((y, x, z) => y > 1.0);
    const flexFactorFn = options.flexFactor || ((y) => Math.max(0.05, 1.2 - y * 0.8));

    // Deduplicate / create particle per unique vertex position
    const uniquePositions = [];
    const threshold = 0.001;

    for (let i = 0; i < vertexCount; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);

      let foundIdx = -1;
      for (let u = 0; u < uniquePositions.length; u++) {
        const up = uniquePositions[u];
        if (
          Math.abs(up.x - vx) < threshold &&
          Math.abs(up.y - vy) < threshold &&
          Math.abs(up.z - vz) < threshold
        ) {
          foundIdx = u;
          break;
        }
      }

      if (foundIdx === -1) {
        const isPinned = isPinnedFn(vy, vx, vz);
        const particle = new ClothParticle(vx, vy, vz, this.profile.mass, isPinned);
        particle.flexFactor = flexFactorFn(vy, vx, vz);
        this.particles.push(particle);
        uniquePositions.push(new THREE.Vector3(vx, vy, vz));
        this.vertexToParticleMap.push(this.particles.length - 1);
      } else {
        this.vertexToParticleMap.push(foundIdx);
      }
    }

    // Build Structural, Shear, and Bending Constraints from Geometry Index or adjacency
    const index = geometry.index;
    const addedPairs = new Set();

    const addConstraintPair = (i1, i2, stiffnessMult = 1.0) => {
      const p1 = this.particles[i1];
      const p2 = this.particles[i2];
      if (!p1 || !p2 || p1 === p2) return;

      const key = i1 < i2 ? `${i1}_${i2}` : `${i2}_${i1}`;
      if (addedPairs.has(key)) return;
      addedPairs.add(key);

      const dist = p1.position.distanceTo(p2.position);
      this.constraints.push(new ClothConstraint(p1, p2, dist, this.profile.stiffness * stiffnessMult));
    };

    if (index) {
      for (let i = 0; i < index.count; i += 3) {
        const a = this.vertexToParticleMap[index.getX(i)];
        const b = this.vertexToParticleMap[index.getX(i + 1)];
        const c = this.vertexToParticleMap[index.getX(i + 2)];

        // Structural edge constraints
        addConstraintPair(a, b, 1.0);
        addConstraintPair(b, c, 1.0);
        addConstraintPair(c, a, 1.0);
      }
    } else {
      // Proximity based fallback
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dist = this.particles[i].position.distanceTo(this.particles[j].position);
          if (dist < 0.28) {
            addConstraintPair(i, j, 1.0);
          } else if (dist < 0.5) {
            // Shear / Bending constraint
            addConstraintPair(i, j, 0.4);
          }
        }
      }
    }
  }

  /**
   * Main Physics Step: applies forces, integrates Verlet, relaxes constraints, checks collisions
   */
  step(dt, options = {}) {
    if (!this.geometry || this.particles.length === 0) return;

    const clampedDt = Math.min(dt, 0.033);
    const subSteps = 3;
    const subDt = clampedDt / subSteps;

    const {
      mannequinRotationY = 0,
      dragVelocityX = 0,
      dragVelocityY = 0,
      windFactor = 1.0,
      windDirection = new THREE.Vector3(1, 0, 0.5).normalize(),
    } = options;

    this.time += clampedDt;

    // Track rotation delta for centrifugal & angular inertia
    const deltaRotY = mannequinRotationY - this.prevRotationY;
    this.prevRotationY = mannequinRotationY;
    this.angularVelocity = THREE.MathUtils.lerp(this.angularVelocity, deltaRotY / (clampedDt || 0.016), 0.2);

    const actualWind = windDirection.clone().multiplyScalar(this.windIntensity * windFactor);

    for (let step = 0; step < subSteps; step++) {
      // 1. Accumulate Forces
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        if (p.isPinned) continue;

        // Gravity
        p.addForce(this.gravity.clone().multiplyScalar(p.mass));

        // Wind Force with Perlin-style harmonic oscillation
        const turbulence = Math.sin(this.time * 4.5 + p.position.y * 3.0 + p.position.x * 2.0) * 0.4 +
                           Math.cos(this.time * 3.2 - p.position.z * 2.5) * 0.3;
        
        const windForce = actualWind.clone()
          .multiplyScalar(this.profile.windSensitivity * p.flexFactor * (1.0 + turbulence * this.windTurbulence));
        p.addForce(windForce);

        // Angular Inertial Lag when rotating mannequin (Euler & Centrifugal Force)
        if (Math.abs(this.angularVelocity) > 0.01) {
          const radial = new THREE.Vector3(p.position.x, 0, p.position.z);
          const tangent = new THREE.Vector3(-p.position.z, 0, p.position.x).normalize();
          
          // Tangential lag force
          const inertialLag = tangent.multiplyScalar(-this.angularVelocity * 0.45 * p.mass * p.flexFactor);
          // Centrifugal outward fling force
          const centrifugal = radial.clone().multiplyScalar(this.angularVelocity * this.angularVelocity * 0.12 * p.mass * p.flexFactor);
          
          p.addForce(inertialLag);
          p.addForce(centrifugal);
        }

        // Mouse Drag Momentum Transfer
        if (Math.abs(dragVelocityX) > 0.001 || Math.abs(dragVelocityY) > 0.001) {
          const dragForce = new THREE.Vector3(
            -dragVelocityX * 0.8 * p.mass * p.flexFactor,
            -dragVelocityY * 0.5 * p.mass * p.flexFactor,
            (dragVelocityX * 0.4) * p.mass * p.flexFactor
          );
          p.addForce(dragForce);
        }
      }

      // 2. Verlet Integration
      for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].integrate(subDt, this.profile.damping);
      }

      // 3. Relax Distance Constraints (PBD)
      const iterations = 4;
      for (let iter = 0; iter < iterations; iter++) {
        for (let c = 0; c < this.constraints.length; c++) {
          this.constraints[c].solve();
        }
      }

      // 4. Mannequin Body Collision Detection & Resolution
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        if (p.isPinned) continue;

        for (let s = 0; s < this.collisionSpheres.length; s++) {
          const sphere = this.collisionSpheres[s];
          const toParticle = new THREE.Vector3().subVectors(p.position, sphere.center);
          const dist = toParticle.length();

          if (dist < sphere.radius && dist > 0) {
            // Push outside collision sphere
            const penetration = sphere.radius - dist;
            const pushDir = toParticle.normalize();
            p.position.addScaledVector(pushDir, penetration * 1.05);
          }
        }
      }
    }

    // 5. Update BufferGeometry attribute positions & compute vertex normals
    this.updateGeometry();
  }

  updateGeometry() {
    if (!this.geometry) return;
    const posAttr = this.geometry.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      const pIdx = this.vertexToParticleMap[i];
      if (pIdx !== undefined && this.particles[pIdx]) {
        const p = this.particles[pIdx];
        posAttr.setXYZ(i, p.position.x, p.position.y, p.position.z);
      }
    }

    posAttr.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  /**
   * Raycast to find the nearest cloth particle to grab
   */
  findNearestParticle(raycaster, maxDistance = 0.5) {
    if (!this.mesh) return null;
    const intersects = raycaster.intersectObject(this.mesh);
    if (intersects.length === 0) return null;

    const hitPoint = intersects[0].point;
    let closestParticle = null;
    let minDistance = Infinity;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const d = p.position.distanceTo(hitPoint);
      if (d < minDistance && d < maxDistance) {
        minDistance = d;
        closestParticle = p;
      }
    }

    return closestParticle;
  }

  setGrabbedParticle(particle, position) {
    if (this.grabbedParticle && this.grabbedParticle !== particle) {
      this.grabbedParticle.isGrabbed = false;
    }
    this.grabbedParticle = particle;
    if (particle) {
      particle.isGrabbed = true;
      particle.grabPosition.copy(position);
    }
  }

  updateGrabPosition(newPos) {
    if (this.grabbedParticle) {
      this.grabbedParticle.grabPosition.copy(newPos);
    }
  }

  releaseGrab() {
    if (this.grabbedParticle) {
      this.grabbedParticle.isGrabbed = false;
      this.grabbedParticle = null;
    }
  }
}
