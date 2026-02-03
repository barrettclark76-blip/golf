// ================== BASIC SETUP ==================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 30, 250);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1);
document.body.appendChild(renderer.domElement);

// ================== LIGHTING ==================
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(50, 100, 50);
scene.add(sun);
scene.add(new THREE.AmbientLight(0xcccccc));

// ================== COURSE DATA ==================
const holes = [
  { tee: new THREE.Vector3(0, 1, 40), pin: new THREE.Vector3(0, 1, -40), par: 4 },
  { tee: new THREE.Vector3(20, 1, 40), pin: new THREE.Vector3(-20, 1, -30), par: 4 },
  { tee: new THREE.Vector3(-30, 1, 40), pin: new THREE.Vector3(30, 1, -20), par: 5 },
  { tee: new THREE.Vector3(0, 1, 50), pin: new THREE.Vector3(0, 1, -10), par: 3 },
  { tee: new THREE.Vector3(40, 1, 30), pin: new THREE.Vector3(-40, 1, -30), par: 4 },
  { tee: new THREE.Vector3(-40, 1, 30), pin: new THREE.Vector3(40, 1, -30), par: 5 },
  { tee: new THREE.Vector3(0, 1, 60), pin: new THREE.Vector3(20, 1, -40), par: 4 },
  { tee: new THREE.Vector3(30, 1, 50), pin: new THREE.Vector3(-10, 1, -20), par: 3 },
  { tee: new THREE.Vector3(-20, 1, 40), pin: new THREE.Vector3(0, 1, -50), par: 4 }
];

let currentHole = 0;

// ================== TERRAIN ==================
let ground;
function createTerrain() {
  if (ground) scene.remove(ground);

  const geo = new THREE.PlaneGeometry(200, 200, 24, 24);
  geo.rotateX(-Math.PI / 2);

  for (let i = 0; i < geo.attributes.position.count; i++) {
    const y = Math.sin(i * 0.4) * 1.5 + Math.random() * 0.5;
    geo.attributes.position.setY(i, y);
  }

  const mat = new THREE.MeshLambertMaterial({
    color: 0x1e7f3b,
    flatShading: true
  });

  ground = new THREE.Mesh(geo, mat);
  scene.add(ground);
}

// ================== BALL ==================
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);
scene.add(ball);

// ================== PIN ==================
let pin;
function createPin(position) {
  if (pin) scene.remove(pin);

  pin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 4),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  pin.position.copy(position);
  pin.position.y = 2;
  scene.add(pin);
}

// ================== SHOT STATE ==================
let velocity = new THREE.Vector3();
let charging = false;
let power = 0;
let cameraMode = "player";

// ================== TRACER ==================
let tracerLine = null;
const tracerMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
let tracerPoints = [];

// ================== LOAD HOLE ==================
function loadHole(index) {
  currentHole = index % holes.length;
  createTerrain();

  const hole = holes[currentHole];
  ball.position.copy(hole.tee);
  velocity.set(0, 0, 0);

  createPin(hole.pin);

  cameraMode = "player";
}

// ================== INPUT ==================
window.addEventListener("mousedown", () => {
  if (velocity.length() === 0) charging = true;
});

window.addEventListener("mouseup", () => {
  if (!charging) return;
  charging = false;

  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  velocity.copy(dir.multiplyScalar(power * 0.12));
  velocity.y += power * 0.05;

  power = 0;
  tracerPoints = [];

  if (tracerLine) {
    tracerLine.geometry.dispose();
    scene.remove(tracerLine);
    tracerLine = null;
  }

  cameraMode = "ball";
});

// ================== GAME LOOP ==================
function animate() {
  requestAnimationFrame(animate);

  if (charging) {
    power = Math.min(power + 1, 100);
    document.getElementById("power").textContent = power;
  }

  if (velocity.length() > 0) {
    ball.position.add(velocity);
    velocity.y -= 0.03;
    velocity.multiplyScalar(0.985);

    tracerPoints.push(ball.position.clone());

    // ground collision
    if (ball.position.y <= 0.35) {
      ball.position.y = 0.35;
      velocity.set(0, 0, 0);
      cameraMode = "player";

      // hole check
      if (ball.position.distanceTo(pin.position) < 1.5) {
        loadHole(currentHole + 1);
      }
    }

    // clamp world bounds
    ball.position.x = THREE.MathUtils.clamp(ball.position.x, -90, 90);
    ball.position.z = THREE.MathUtils.clamp(ball.position.z, -90, 90);

    if (tracerPoints.length > 1) {
      if (tracerLine) {
        tracerLine.geometry.dispose();
        scene.remove(tracerLine);
      }
      const geo = new THREE.BufferGeometry().setFromPoints(tracerPoints);
      tracerLine = new THREE.Line(geo, tracerMaterial);
      scene.add(tracerLine);
    }
  }

  // CAMERA
  if (cameraMode === "player") {
    camera.position.lerp(
      new THREE.Vector3(
        ball.position.x,
        2.5,
        ball.position.z + 6
      ),
      0.15
    );
    camera.lookAt(ball.position.x, 1, ball.position.z - 10);
  } else {
    camera.position.lerp(
      new THREE.Vector3(
        ball.position.x,
        ball.position.y + 4,
        ball.position.z + 8
      ),
      0.12
    );
    camera.lookAt(ball.position);
  }

  renderer.render(scene, camera);
}

loadHole(0);
animate();

