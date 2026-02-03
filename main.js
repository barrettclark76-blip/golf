// === SCENE SETUP ===
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87ceeb, 50, 300);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1); // retro feel
document.body.appendChild(renderer.domElement);

// === LIGHTING ===
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(50, 100, -50);
scene.add(sun);
scene.add(new THREE.AmbientLight(0xcccccc));

// === AUGUSTA-INSPIRED TERRAIN ===
const groundGeo = new THREE.PlaneGeometry(500, 500, 20, 20);
groundGeo.rotateX(-Math.PI / 2);

for (let i = 0; i < groundGeo.attributes.position.count; i++) {
  const y = Math.sin(i * 0.3) * 2 + Math.random();
  groundGeo.attributes.position.setY(i, y);
}

const groundMat = new THREE.MeshLambertMaterial({
  color: 0x1e7f3b,
  flatShading: true
});

const ground = new THREE.Mesh(groundGeo, groundMat);
scene.add(ground);

// === BALL ===
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);
ball.position.set(0, 1, 0);
scene.add(ball);

// === CAMERA STATE ===
let cameraMode = "player"; // "player" or "ball"
camera.position.set(0, 2, 5);

// === SHOT STATE ===
let power = 0;
let charging = false;
let velocity = new THREE.Vector3();
let tracerPoints = [];

// === SHOT TRACER ===
const tracerMat = new THREE.LineBasicMaterial({ color: 0xffff00 });
let tracerLine = null;

// === INPUT ===
window.addEventListener("mousedown", () => {
  if (velocity.length() === 0) charging = true;
});

window.addEventListener("mouseup", () => {
  if (!charging) return;

  charging = false;
  document.getElementById("power").textContent = 0;

  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  velocity.copy(direction.multiplyScalar(power * 0.15));
  velocity.y += power * 0.05;

  power = 0;
  tracerPoints = [];
  if (tracerLine) scene.remove(tracerLine);

  cameraMode = "ball";
});

// === GAME LOOP ===
function animate() {
  requestAnimationFrame(animate);

  if (charging) {
    power = Math.min(power + 1, 100);
    document.getElementById("power").textContent = power;
  }

  // Ball physics
  if (velocity.length() > 0) {
    ball.position.add(velocity);
    velocity.y -= 0.02; // gravity
    velocity.multiplyScalar(0.99); // drag

    tracerPoints.push(ball.position.clone());

    if (ball.position.y <= 0.3) {
      velocity.set(0, 0, 0);
      ball.position.y = 0.3;
      cameraMode = "player";
    }

    if (tracerPoints.length > 1) {
      const tracerGeo = new THREE.BufferGeometry().setFromPoints(tracerPoints);
      tracerLine = new THREE.Line(tracerGeo, tracerMat);
      scene.add(tracerLine);
    }
  }

  // Camera behavior
  if (cameraMode === "player") {
    camera.position.lerp(
      new THREE.Vector3(ball.position.x, 2, ball.position.z + 5),
      0.1
    );
    camera.lookAt(ball.position.x, 1, ball.position.z - 10);
  } else {
    camera.position.lerp(
      new THREE.Vector3(ball.position.x, ball.position.y + 3, ball.position.z + 6),
      0.1
    );
    camera.lookAt(ball.position);
  }

  renderer.render(scene, camera);
}

animate();
