// Game state
let gameState = 'menu'; // menu, playing, gameOver, missionComplete
let score = 0;
let playerHealth = 100;
let level = 1;
let kills = 0;
let currentMission = 1;
let missionProgress = 0;
let missionTarget = 5;

// Weapon system
let weaponLevel = 1;
let weaponType = 'basic'; // basic, laser, plasma, railgun
let weaponCooldown = 150; // ms
let currentCooldown = weaponCooldown;
let bulletDamage = 1;
let bulletSpeed = 1.5;
let bulletSize = 0.05;

// Power-ups
let powerUps = [];
let shieldsActive = false;
let shieldTimer = 0;
let rapidFireActive = false;
let rapidFireTimer = 0;
let tripleShotActive = false;
let tripleShotTimer = 0;

// Game objects
let scene, camera, renderer;
let bullets = [];
let enemies = [];
let stars = [];
let particles = [];
let playerShip;
let missionCompleteScreen;

// Controls
const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false
};

// Player physics
let playerVelocity = new THREE.Vector3(0, 0, 0);
const MAX_SPEED = 0.5;
const ACCELERATION = 0.03;
const FRICTION = 0.92;
let lastShootTime = 0;

// Enemy spawning
let lastEnemySpawn = 0;
const BASE_ENEMY_SPAWN_RATE = 1200; // ms
let enemySpawnRate = BASE_ENEMY_SPAWN_RATE;
let enemySpeedMultiplier = 1.0;

// Mouse look
let mouseX = 0;
let mouseY = 0;
let mouseSensitivity = 0.002;
let pitch = 0;
const PITCH_LIMIT = Math.PI / 2 - 0.1;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050515);
    
    // Create camera (first person)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);
    
    // Create starfield
    createStarfield();
    
    // Create player ship
    createPlayerShip();
    
    // Setup event listeners
    setupEventListeners();
    
    // Create mission complete screen
    createMissionCompleteScreen();
    
    // Start animation loop
    animate();
}

function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.15,
        transparent: true,
        opacity: 0.9
    });
    
    const starVertices = [];
    for (let i = 0; i < 5000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function createPlayerShip() {
    // Create a simple spaceship model
    const shipGroup = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.6, 2, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ff00,
        emissive: 0x008800,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    shipGroup.add(body);
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(2.5, 0.1, 0.8);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00cc00,
        emissive: 0x006600,
        shininess: 100
    });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.set(0, -0.2, 0);
    shipGroup.add(wings);
    
    // Engine glow
    const engineGeometry = new THREE.CylinderGeometry(0.3, 0.1, 0.5, 8);
    const engineMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00
    });
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.set(0, 1.2, 0);
    engine.rotation.x = Math.PI;
    shipGroup.add(engine);
    
    // Front sensor array
    const sensorGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const sensorMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        emissive: 0x00ffff
    });
    const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
    sensor.position.set(0, 0.5, 0);
    shipGroup.add(sensor);
    
    // Position the ship at the origin
    shipGroup.position.set(0, 0, 0);
    
    // Set initial rotation
    shipGroup.rotation.y = Math.PI;
    
    // Add to scene
    playerShip = shipGroup;
    scene.add(playerShip);
}

function createMissionCompleteScreen() {
    missionCompleteScreen = document.createElement('div');
    missionCompleteScreen.id = 'mission-complete-screen';
    missionCompleteScreen.style.position = 'fixed';
    missionCompleteScreen.style.top = '0';
    missionCompleteScreen.style.left = '0';
    missionCompleteScreen.style.width = '100%';
    missionCompleteScreen.style.height = '100%';
    missionCompleteScreen.style.display = 'none';
    missionCompleteScreen.style.flexDirection = 'column';
    missionCompleteScreen.style.justifyContent = 'center';
    missionCompleteScreen.style.alignItems = 'center';
    missionCompleteScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    missionCompleteScreen.style.zIndex = '200';
    missionCompleteScreen.style.fontFamily = "'Orbitron', sans-serif";
    
    const missionTitle = document.createElement('h1');
    missionTitle.id = 'mission-title';
    missionTitle.textContent = 'MISSION COMPLETE';
    missionTitle.style.fontSize = '64px';
    missionTitle.style.color = '#0ff';
    missionTitle.style.textShadow = '0 0 20px #0ff, 0 0 40px #0ff';
    missionTitle.style.marginBottom = '30px';
    missionTitle.style.letterSpacing = '4px';
    
    const missionInfo = document.createElement('div');
    missionInfo.id = 'mission-info';
    missionInfo.style.fontSize = '24px';
    missionInfo.style.color = '#fff';
    missionInfo.style.textShadow = '0 0 10px #fff';
    missionInfo.style.marginBottom = '30px';
    missionInfo.style.textAlign = 'center';
    missionInfo.innerHTML = 'You have completed Mission ' + currentMission + '!<br>Choose your upgrade:';
    
    const upgradesContainer = document.createElement('div');
    upgradesContainer.id = 'upgrades-container';
    upgradesContainer.style.display = 'flex';
    upgradesContainer.style.justifyContent = 'center';
    upgradesContainer.style.gap = '20px';
    upgradesContainer.style.marginBottom = '50px';
    
    // Create upgrade buttons
    const weaponUpgradeBtn = document.createElement('button');
    weaponUpgradeBtn.className = 'upgrade-button';
    weaponUpgradeBtn.textContent = 'UPGRADE WEAPON';
    weaponUpgradeBtn.style.padding = '15px 30px';
    weaponUpgradeBtn.style.fontSize = '20px';
    weaponUpgradeBtn.style.background = 'linear-gradient(45deg, #ff6600, #ffcc00)';
    weaponUpgradeBtn.style.color = '#000';
    weaponUpgradeBtn.style.border = 'none';
    weaponUpgradeBtn.style.borderRadius = '10px';
    weaponUpgradeBtn.style.cursor = 'pointer';
    weaponUpgradeBtn.style.fontFamily = "'Orbitron', sans-serif";
    weaponUpgradeBtn.style.fontWeight = 'bold';
    weaponUpgradeBtn.style.textTransform = 'uppercase';
    weaponUpgradeBtn.style.boxShadow = '0 0 20px #ff6600';
    weaponUpgradeBtn.style.transition = 'all 0.3s ease';
    
    weaponUpgradeBtn.addEventListener('mouseover', function() {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 0 30px #ff6600, 0 0 40px #ffcc00';
    });
    
    weaponUpgradeBtn.addEventListener('mouseout', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 0 20px #ff6600';
    });
    
    weaponUpgradeBtn.addEventListener('click', function() {
        upgradeWeapon();
        startNextMission();
    });
    
    const shieldUpgradeBtn = document.createElement('button');
    shieldUpgradeBtn.className = 'upgrade-button';
    shieldUpgradeBtn.textContent = 'SHIELD SYSTEM';
    shieldUpgradeBtn.style.padding = '15px 30px';
    shieldUpgradeBtn.style.fontSize = '20px';
    shieldUpgradeBtn.style.background = 'linear-gradient(45deg, #0066ff, #00ccff)';
    shieldUpgradeBtn.style.color = '#000';
    shieldUpgradeBtn.style.border = 'none';
    shieldUpgradeBtn.style.borderRadius = '10px';
    shieldUpgradeBtn.style.cursor = 'pointer';
    shieldUpgradeBtn.style.fontFamily = "'Orbitron', sans-serif";
    shieldUpgradeBtn.style.fontWeight = 'bold';
    shieldUpgradeBtn.style.textTransform = 'uppercase';
    shieldUpgradeBtn.style.boxShadow = '0 0 20px #0066ff';
    shieldUpgradeBtn.style.transition = 'all 0.3s ease';
    
    shieldUpgradeBtn.addEventListener('mouseover', function() {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 0 30px #0066ff, 0 0 40px #00ccff';
    });
    
    shieldUpgradeBtn.addEventListener('mouseout', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 0 20px #0066ff';
    });
    
    shieldUpgradeBtn.addEventListener('click', function() {
        unlockShield();
        startNextMission();
    });
    
    const rapidFireBtn = document.createElement('button');
    rapidFireBtn.className = 'upgrade-button';
    rapidFireBtn.textContent = 'RAPID FIRE';
    rapidFireBtn.style.padding = '15px 30px';
    rapidFireBtn.style.fontSize = '20px';
    rapidFireBtn.style.background = 'linear-gradient(45deg, #ff0066, #ff66cc)';
    rapidFireBtn.style.color = '#000';
    rapidFireBtn.style.border = 'none';
    rapidFireBtn.style.borderRadius = '10px';
    rapidFireBtn.style.cursor = 'pointer';
    rapidFireBtn.style.fontFamily = "'Orbitron', sans-serif";
    rapidFireBtn.style.fontWeight = 'bold';
    rapidFireBtn.style.textTransform = 'uppercase';
    rapidFireBtn.style.boxShadow = '0 0 20px #ff0066';
    rapidFireBtn.style.transition = 'all 0.3s ease';
    
    rapidFireBtn.addEventListener('mouseover', function() {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 0 30px #ff0066, 0 0 40px #ff66cc';
    });
    
    rapidFireBtn.addEventListener('mouseout', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 0 20px #ff0066';
    });
    
    rapidFireBtn.addEventListener('click', function() {
        unlockRapidFire();
        startNextMission();
    });
    
    upgradesContainer.appendChild(weaponUpgradeBtn);
    upgradesContainer.appendChild(shieldUpgradeBtn);
    upgradesContainer.appendChild(rapidFireBtn);
    
    missionCompleteScreen.appendChild(missionTitle);
    missionCompleteScreen.appendChild(missionInfo);
    missionCompleteScreen.appendChild(upgradesContainer);
    document.body.appendChild(missionCompleteScreen);
}

function createBullet(offsetX = 0, offsetY = 0) {
    let bulletGeometry, bulletMaterial;
    let bulletColor, bulletEmissive;
    let bulletSpeed = 1.5;
    let trailParticles = false;
    let pulseEffect = false;
    let spiralEffect = false;
    let explosionSize = 0.08;
    
    // Different bullet types based on weapon with unique animations
    switch(weaponType) {
        case 'basic':
            bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            bulletColor = 0xff00ff;
            bulletEmissive = 0xff00ff;
            bulletSpeed = 1.5;
            trailParticles = false;
            pulseEffect = false;
            spiralEffect = false;
            explosionSize = 0.08;
            break;
            
        case 'laser':
            bulletGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.4, 8);
            bulletColor = 0x00ffff;
            bulletEmissive = 0x00ffff;
            bulletSpeed = 2.5;
            trailParticles = true;
            pulseEffect = true;
            spiralEffect = false;
            explosionSize = 0.05;
            break;
            
        case 'plasma':
            bulletGeometry = new THREE.SphereGeometry(0.08, 12, 12);
            bulletColor = 0xff8800;
            bulletEmissive = 0xff8800;
            bulletSpeed = 1.2;
            trailParticles = true;
            pulseEffect = true;
            spiralEffect = true;
            explosionSize = 0.15;
            break;
            
        case 'railgun':
            bulletGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.6, 8);
            bulletColor = 0xffffff;
            bulletEmissive = 0xffffff;
            bulletSpeed = 3.5;
            trailParticles = true;
            pulseEffect = false;
            spiralEffect = false;
            explosionSize = 0.1;
            break;
    }
    
    bulletMaterial = new THREE.MeshBasicMaterial({ 
        color: bulletColor,
        emissive: bulletColor,
        transparent: true,
        opacity: 0.9
    });
    
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    // Position bullet at camera position
    bullet.position.copy(camera.position);
    
    // Get forward direction from camera
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    
    // Apply offset for triple shot
    const offset = new THREE.Vector3(offsetX, offsetY, 0);
    offset.applyQuaternion(camera.quaternion);
    bullet.position.add(offset);
    
    bullet.position.add(direction.clone().multiplyScalar(0.5));
    
    // Set bullet orientation to face forward
    bullet.quaternion.copy(camera.quaternion);
    if (weaponType === 'laser' || weaponType === 'railgun') {
        bullet.rotateX(Math.PI / 2); // Align cylinder with direction
    }
    
    // Store bullet properties
    bullet.userData.velocity = direction.clone().multiplyScalar(bulletSpeed);
    bullet.userData.birthTime = Date.now();
    bullet.userData.lifetime = 2000; // ms
    bullet.userData.damage = bulletDamage;
    bullet.userData.trailParticles = trailParticles;
    bullet.userData.pulseEffect = pulseEffect;
    bullet.userData.spiralEffect = spiralEffect;
    bullet.userData.explosionSize = explosionSize;
    bullet.userData.pulseTime = 0;
    bullet.userData.spiralAngle = 0;
    bullet.userData.lastTrailTime = Date.now();
    
    // Add to scene
    scene.add(bullet);
    bullets.push(bullet);
    
    // Create muzzle flash for visual feedback
    createMuzzleFlash(bullet.position.clone(), weaponType);
}

function createMuzzleFlash(position, weaponType) {
    let flashCount, flashSize, flashColor, flashDuration;
    
    // Different muzzle flash effects for each weapon type
    switch(weaponType) {
        case 'basic':
            flashCount = 5;
            flashSize = 0.2;
            flashColor = 0xff00ff;
            flashDuration = 300;
            break;
        case 'laser':
            flashCount = 8;
            flashSize = 0.3;
            flashColor = 0x00ffff;
            flashDuration = 200;
            break;
        case 'plasma':
            flashCount = 12;
            flashSize = 0.4;
            flashColor = 0xff8800;
            flashDuration = 400;
            break;
        case 'railgun':
            flashCount = 6;
            flashSize = 0.25;
            flashColor = 0xffffff;
            flashDuration = 150;
            break;
        default:
            flashCount = 5;
            flashSize = 0.2;
            flashColor = 0xff00ff;
            flashDuration = 300;
    }
    
    for (let i = 0; i < flashCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;
        const speed = 0.1 + Math.random() * 0.3;
        
        const particleGeometry = new THREE.SphereGeometry(flashSize * (0.5 + Math.random() * 0.5), 6, 6);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: flashColor,
            emissive: flashColor,
            transparent: true,
            opacity: 0.8
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);
        
        particle.userData.velocity = new THREE.Vector3(
            Math.cos(angle) * Math.sin(angle2) * speed,
            Math.sin(angle) * Math.sin(angle2) * speed,
            Math.cos(angle2) * speed
        );
        
        particle.userData.birthTime = Date.now();
        particle.userData.lifetime = flashDuration;
        particle.userData.type = 'muzzleFlash';
        
        scene.add(particle);
        particles.push(particle);
    }
}

function createEnemy() {
    // Create enemy ship (spaceship design)
    const enemyGroup = new THREE.Group();
    
    // Main body - different designs based on level
    let bodyGeometry, bodyMaterial;
    if (level <= 2) {
        // Basic enemy
        bodyGeometry = new THREE.ConeGeometry(0.8, 2, 8);
        bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff3300,
            emissive: 0x881100,
            shininess: 100
        });
    } else if (level <= 4) {
        // Advanced enemy
        bodyGeometry = new THREE.OctahedronGeometry(0.8, 1);
        bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff6600,
            emissive: 0x883300,
            shininess: 100
        });
    } else {
        // Elite enemy
        bodyGeometry = new THREE.DodecahedronGeometry(0.7, 0);
        bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0x880000,
            shininess: 100
        });
    }
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI;
    enemyGroup.add(body);
    
    // Wings for basic enemies
    if (level <= 3) {
        const wingGeometry = new THREE.BoxGeometry(2.5, 0.1, 0.8);
        const wingMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff6600,
            emissive: 0x883300,
            shininess: 100
        });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.set(0, -0.2, 0);
        enemyGroup.add(wings);
    }
    
    // Engine glow
    const engineGeometry = new THREE.CylinderGeometry(0.3, 0.1, 0.5, 8);
    let engineColor = 0xffff00;
    if (level > 3) engineColor = 0xff8800; // Orange for advanced enemies
    const engineMaterial = new THREE.MeshBasicMaterial({ 
        color: engineColor,
        emissive: engineColor
    });
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.set(0, 1.2, 0);
    engine.rotation.x = Math.PI;
    enemyGroup.add(engine);
    
    // Position enemy randomly in front of the player
    const distance = 40 + Math.random() * 30;
    const angleX = (Math.random() - 0.5) * Math.PI;
    const angleY = Math.random() * Math.PI * 2;
    
    const x = distance * Math.sin(angleX) * Math.cos(angleY);
    const y = distance * Math.sin(angleX) * Math.sin(angleY);
    const z = distance * Math.cos(angleX);
    
    enemyGroup.position.set(x, y, z);
    enemyGroup.userData.velocity = new THREE.Vector3(0, 0, 0);
    enemyGroup.userData.speed = (0.03 + Math.random() * 0.07) * enemySpeedMultiplier;
    enemyGroup.userData.health = Math.ceil(level / 2); // Tougher enemies at higher levels
    enemyGroup.userData.isEnemy = true;
    enemyGroup.userData.points = 100 * Math.ceil(level / 2);
    
    scene.add(enemyGroup);
    enemies.push(enemyGroup);
}

function createPowerUp(position) {
    const powerUpTypes = ['weapon', 'shield', 'rapidfire', 'health'];
    const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    const powerUpGeometry = new THREE.SphereGeometry(0.5, 12, 12);
    let powerUpColor, powerUpEmissive;
    
    switch(powerUpType) {
        case 'weapon':
            powerUpColor = 0xff00ff;
            powerUpEmissive = 0xff00ff;
            break;
        case 'shield':
            powerUpColor = 0x00ffff;
            powerUpEmissive = 0x00ffff;
            break;
        case 'rapidfire':
            powerUpColor = 0xffff00;
            powerUpEmissive = 0xffff00;
            break;
        case 'health':
            powerUpColor = 0x00ff00;
            powerUpEmissive = 0x00ff00;
            break;
    }
    
    const powerUpMaterial = new THREE.MeshPhongMaterial({ 
        color: powerUpColor,
        emissive: powerUpEmissive,
        shininess: 100
    });
    const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
    
    // Add pulsing effect
    powerUp.userData.pulseTime = 0;
    powerUp.userData.type = powerUpType;
    
    powerUp.position.copy(position);
    powerUp.userData.birthTime = Date.now();
    powerUp.userData.lifetime = 10000; // 10 seconds
    
    // Slow floating movement
    powerUp.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
    );
    
    scene.add(powerUp);
    powerUps.push(powerUp);
}

function createExplosion(position, explosionSize = 0.08) {
    const explosionCount = 30;
    const explosionGeometry = new THREE.SphereGeometry(explosionSize, 6, 6);
    const colors = [0xff0000, 0xffff00, 0xff8800];
    
    for (let i = 0; i < explosionCount; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const explosionMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            emissive: color
        });
        const particle = new THREE.Mesh(explosionGeometry, explosionMaterial);
        particle.position.copy(position);
        
        // Random velocity
        const angle = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;
        const speed = 0.2 + Math.random() * 0.5;
        particle.userData.velocity = new THREE.Vector3(
            Math.cos(angle) * Math.sin(angle2) * speed,
            Math.sin(angle) * Math.sin(angle2) * speed,
            Math.cos(angle2) * speed
        );
        
        // Lifetime
        particle.userData.birthTime = Date.now();
        particle.userData.lifetime = 800 + Math.random() * 1200;
        
        scene.add(particle);
        particles.push(particle);
    }
}

function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                keys.right = true;
                break;
            case 'Space':
                keys.up = true;
                break;
            case 'ShiftLeft':
                keys.down = true;
                break;
            case 'ControlLeft':
                keys.shoot = true;
                break;
        }
    });
    
    document.addEventListener('keyup', (event) => {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                keys.right = false;
                break;
            case 'Space':
                keys.up = false;
                break;
            case 'ShiftLeft':
                keys.down = false;
                break;
            case 'ControlLeft':
                keys.shoot = false;
                break;
        }
    });
    
    // Mouse look
    document.addEventListener('mousemove', (event) => {
        if (gameState === 'playing') {
            mouseX = event.movementX || 0;
            mouseY = event.movementY || 0;
        }
    });
    
    // Lock pointer on click
    document.addEventListener('click', () => {
        if (gameState === 'playing') {
            document.body.requestPointerLock();
        }
    });
    
    // Start button
    document.getElementById('start-button').addEventListener('click', () => {
        startGame();
        document.body.requestPointerLock();
    });
    
    // Restart button
    document.getElementById('restart-button').addEventListener('click', () => {
        resetGame();
        startGame();
        document.body.requestPointerLock();
    });
    
    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('mission-complete-screen').style.display = 'none';
    gameState = 'playing';
    score = 0;
    playerHealth = 100;
    level = 1;
    kills = 0;
    currentMission = 1;
    missionProgress = 0;
    missionTarget = 5;
    weaponLevel = 1;
    weaponType = 'basic';
    weaponCooldown = 150;
    bulletDamage = 1;
    bulletSpeed = 1.5;
    bulletSize = 0.05;
    enemySpawnRate = BASE_ENEMY_SPAWN_RATE;
    enemySpeedMultiplier = 1.0;
    
    // Reset power-ups
    shieldsActive = false;
    rapidFireActive = false;
    tripleShotActive = false;
    
    updateHUD();
    updateMissionDisplay();
}

function completeMission() {
    gameState = 'missionComplete';
    document.getElementById('mission-info').innerHTML = `You have completed Mission ${currentMission}!<br>Choose your upgrade:`;
    document.getElementById('mission-complete-screen').style.display = 'flex';
    document.exitPointerLock();
}

function startNextMission() {
    currentMission++;
    missionProgress = 0;
    missionTarget = 5 + (currentMission - 1) * 3; // Increase difficulty
    level = currentMission;
    
    // Increase difficulty
    enemySpawnRate = Math.max(500, BASE_ENEMY_SPAWN_RATE - (currentMission - 1) * 200);
    enemySpeedMultiplier = 1.0 + (currentMission - 1) * 0.2;
    
    // Clear existing enemies
    enemies.forEach(enemy => scene.remove(enemy));
    enemies = [];
    
    // Clear power-ups
    powerUps.forEach(powerUp => scene.remove(powerUp));
    powerUps = [];
    
    // Reset timers
    shieldTimer = 0;
    rapidFireTimer = 0;
    tripleShotTimer = 0;
    
    document.getElementById('mission-complete-screen').style.display = 'none';
    gameState = 'playing';
    document.body.requestPointerLock();
    
    updateMissionDisplay();
}

function gameOver() {
    gameState = 'gameOver';
    document.getElementById('final-score').textContent = `FINAL SCORE: ${score}`;
    document.getElementById('game-over-screen').style.display = 'flex';
    document.exitPointerLock();
}

function resetGame() {
    // Clear bullets
    bullets.forEach(bullet => scene.remove(bullet));
    bullets = [];
    
    // Clear enemies
    enemies.forEach(enemy => scene.remove(enemy));
    enemies = [];
    
    // Clear particles
    particles.forEach(particle => scene.remove(particle));
    particles = [];
    
    // Clear power-ups
    powerUps.forEach(powerUp => scene.remove(powerUp));
    powerUps = [];
    
    // Reset player position and rotation
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    playerVelocity.set(0, 0, 0);
    pitch = 0;
    
    // Reset power-up states
    shieldsActive = false;
    rapidFireActive = false;
    tripleShotActive = false;
    shieldTimer = 0;
    rapidFireTimer = 0;
    tripleShotTimer = 0;
    
    // Remove player ship
    if (playerShip) {
        scene.remove(playerShip);
    }
    
    // Recreate player ship
    createPlayerShip();
}

function upgradeWeapon() {
    weaponLevel++;
    
    // Cycle through weapon types with unique visual effects
    if (weaponLevel % 3 === 1) {
        weaponType = 'laser';
        weaponCooldown = 100;
        bulletDamage = 1;
        alert("Laser Weapon Unlocked: Fast, precise energy beams with particle trails!");
    } else if (weaponLevel % 3 === 2) {
        weaponType = 'plasma';
        weaponCooldown = 200;
        bulletDamage = 3;
        alert("Plasma Cannon Unlocked: Heavy plasma orbs with spiral effects!");
    } else {
        weaponType = 'railgun';
        weaponCooldown = 80;
        bulletDamage = 2;
        alert("Railgun Unlocked: Ultra-fast penetrative rounds with bright muzzle flash!");
    }
}

function unlockShield() {
    shieldsActive = true;
    shieldTimer = 30000; // 30 seconds
    alert("Shield System Activated: You're temporarily invulnerable!");
}

function unlockRapidFire() {
    rapidFireActive = true;
    rapidFireTimer = 20000; // 20 seconds
    weaponCooldown = 50; // Very fast firing
    alert("Rapid Fire Activated: Your weapon fires at maximum speed!");
}

function updateHUD() {
    document.getElementById('score-display').textContent = `SCORE: ${score}`;
    document.getElementById('health-bar').style.width = `${playerHealth}%`;
    
    // Change health bar color based on health
    if (playerHealth > 60) {
        document.getElementById('health-bar').style.backgroundColor = '#0ff';
    } else if (playerHealth > 30) {
        document.getElementById('health-bar').style.backgroundColor = '#ff0';
    } else {
        document.getElementById('health-bar').style.backgroundColor = '#f00';
    }
    
    // Update dashboard indicators
    const speed = playerVelocity.length().toFixed(1);
    document.getElementById('speed-indicator').textContent = `SPEED: ${speed}`;
    
    const altitude = Math.sqrt(camera.position.x * camera.position.x + camera.position.z * camera.position.z).toFixed(0);
    document.getElementById('altitude-indicator').textContent = `ALT: ${altitude}`;
    
    document.getElementById('target-indicator').textContent = `TARGETS: ${enemies.length}`;
    
    // Update weapon info
    const weaponInfo = document.getElementById('weapon-info');
    if (weaponInfo) {
        weaponInfo.textContent = `WEAPON: ${weaponType.toUpperCase()} LVL ${weaponLevel}`;
    }
}

function updateMissionDisplay() {
    // Add mission info to HUD if not exists
    let missionInfo = document.getElementById('mission-info-hud');
    if (!missionInfo) {
        missionInfo = document.createElement('div');
        missionInfo.id = 'mission-info-hud';
        missionInfo.style.position = 'fixed';
        missionInfo.style.top = '80px';
        missionInfo.style.left = '20px';
        missionInfo.style.color = '#ff0';
        missionInfo.style.fontSize = '18px';
        missionInfo.style.textShadow = '0 0 5px #ff0';
        missionInfo.style.pointerEvents = 'none';
        missionInfo.style.zIndex = '100';
        document.getElementById('hud').appendChild(missionInfo);
    }
    
    missionInfo.textContent = `MISSION ${currentMission}: Destroy ${missionTarget} enemies (${missionProgress}/${missionTarget})`;
    
    // Add weapon info if not exists
    let weaponInfo = document.getElementById('weapon-info');
    if (!weaponInfo) {
        weaponInfo = document.createElement('div');
        weaponInfo.id = 'weapon-info';
        weaponInfo.style.position = 'fixed';
        weaponInfo.style.top = '110px';
        weaponInfo.style.left = '20px';
        weaponInfo.style.color = '#0ff';
        weaponInfo.style.fontSize = '18px';
        weaponInfo.style.textShadow = '0 0 5px #0ff';
        weaponInfo.style.pointerEvents = 'none';
        weaponInfo.style.zIndex = '100';
        document.getElementById('hud').appendChild(weaponInfo);
    }
    
    weaponInfo.textContent = `WEAPON: ${weaponType.toUpperCase()} LVL ${weaponLevel}`;
    
    // Add power-up status
    let powerUpInfo = document.getElementById('powerup-info');
    if (!powerUpInfo) {
        powerUpInfo = document.createElement('div');
        powerUpInfo.id = 'powerup-info';
        powerUpInfo.style.position = 'fixed';
        powerUpInfo.style.top = '140px';
        powerUpInfo.style.left = '20px';
        powerUpInfo.style.color = '#0f0';
        powerUpInfo.style.fontSize = '18px';
        powerUpInfo.style.textShadow = '0 0 5px #0f0';
        powerUpInfo.style.pointerEvents = 'none';
        powerUpInfo.style.zIndex = '100';
        document.getElementById('hud').appendChild(powerUpInfo);
    }
    
    let powerUpText = "POWER-UPS: ";
    if (shieldsActive) {
        const shieldSeconds = Math.ceil(shieldTimer / 1000);
        powerUpText += `SHIELD(${shieldSeconds}s) `;
    }
    if (rapidFireActive) {
        const rapidSeconds = Math.ceil(rapidFireTimer / 1000);
        powerUpText += `RAPID(${rapidSeconds}s) `;
    }
    if (tripleShotActive) {
        const tripleSeconds = Math.ceil(tripleShotTimer / 1000);
        powerUpText += `TRIPLE(${tripleSeconds}s) `;
    }
    if (!shieldsActive && !rapidFireActive && !tripleShotActive) {
        powerUpText += "NONE";
    }
    
    powerUpInfo.textContent = powerUpText;
}

function updatePlayer() {
    // Mouse look
    camera.rotation.y -= mouseX * mouseSensitivity;
    
    // Update pitch with limits
    pitch -= mouseY * mouseSensitivity;
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
    camera.rotation.x = pitch;
    
    // Handle movement
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion);
    
    const up = new THREE.Vector3(0, 1, 0);
    up.applyQuaternion(camera.quaternion);
    
    if (keys.forward) {
        playerVelocity.add(forward.clone().multiplyScalar(ACCELERATION));
    }
    if (keys.backward) {
        playerVelocity.add(forward.clone().multiplyScalar(-ACCELERATION * 0.5));
    }
    if (keys.left) {
        playerVelocity.add(right.clone().multiplyScalar(-ACCELERATION));
    }
    if (keys.right) {
        playerVelocity.add(right.clone().multiplyScalar(ACCELERATION));
    }
    if (keys.up) {
        playerVelocity.add(up.clone().multiplyScalar(ACCELERATION));
    }
    if (keys.down) {
        playerVelocity.add(up.clone().multiplyScalar(-ACCELERATION));
    }
    
    // Apply friction
    playerVelocity.multiplyScalar(FRICTION);
    
    // Limit speed
    const speed = playerVelocity.length();
    if (speed > MAX_SPEED) {
        playerVelocity.normalize().multiplyScalar(MAX_SPEED);
    }
    
    // Update position
    camera.position.add(playerVelocity);
    
    // Keep player within bounds
    camera.position.x = Math.max(-100, Math.min(100, camera.position.x));
    camera.position.y = Math.max(-50, Math.min(50, camera.position.y));
    camera.position.z = Math.max(-100, Math.min(100, camera.position.z));
    
    // Update player ship position and rotation
    if (playerShip) {
        playerShip.position.copy(camera.position);
        playerShip.quaternion.copy(camera.quaternion);
    }
}

function handleShooting() {
    const currentTime = Date.now();
    if (keys.shoot && currentTime - lastShootTime > weaponCooldown) {
        if (tripleShotActive) {
            // Triple shot pattern
            createBullet(-0.3, 0); // Left
            createBullet(0, 0);    // Center
            createBullet(0.3, 0);  // Right
        } else {
            // Single shot
            createBullet();
        }
        lastShootTime = currentTime;
    }
}

function updateBullets() {
    const currentTime = Date.now();
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Move bullet
        bullet.position.add(bullet.userData.velocity);
        
        // Apply special effects based on weapon type
        if (bullet.userData.pulseEffect) {
            bullet.userData.pulseTime += 0.1;
            const pulseScale = 1 + 0.2 * Math.sin(bullet.userData.pulseTime);
            bullet.scale.set(pulseScale, pulseScale, pulseScale);
        }
        
        if (bullet.userData.spiralEffect) {
            bullet.userData.spiralAngle += 0.2;
            bullet.rotateZ(0.05);
            bullet.position.x += Math.sin(bullet.userData.spiralAngle) * 0.01;
            bullet.position.y += Math.cos(bullet.userData.spiralAngle) * 0.01;
        }
        
        // Create trail particles for certain weapons
        if (bullet.userData.trailParticles && currentTime - bullet.userData.lastTrailTime > 50) {
            createTrailParticle(bullet.position.clone(), weaponType);
            bullet.userData.lastTrailTime = currentTime;
        }
        
        // Check if bullet is too old or too far
        if (currentTime - bullet.userData.birthTime > bullet.userData.lifetime || 
            bullet.position.distanceTo(camera.position) > 150) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
}

function createTrailParticle(position, weaponType) {
    let particleSize, particleColor, particleLifetime;
    
    // Different trail effects for each weapon type
    switch(weaponType) {
        case 'laser':
            particleSize = 0.03;
            particleColor = 0x00ffff;
            particleLifetime = 300;
            break;
        case 'plasma':
            particleSize = 0.05;
            particleColor = 0xff8800;
            particleLifetime = 500;
            break;
        case 'railgun':
            particleSize = 0.02;
            particleColor = 0xffffff;
            particleLifetime = 200;
            break;
        default:
            particleSize = 0.03;
            particleColor = 0xff00ff;
            particleLifetime = 300;
    }
    
    const particleGeometry = new THREE.SphereGeometry(particleSize, 6, 6);
    const particleMaterial = new THREE.MeshBasicMaterial({ 
        color: particleColor,
        emissive: particleColor,
        transparent: true,
        opacity: 0.7
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.copy(position);
    
    // Small random velocity for drifting effect
    particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
    );
    
    particle.userData.birthTime = Date.now();
    particle.userData.lifetime = particleLifetime;
    particle.userData.type = 'trail';
    
    scene.add(particle);
    particles.push(particle);
}

function spawnEnemies() {
    const currentTime = Date.now();
    if (currentTime - lastEnemySpawn > enemySpawnRate) {
        createEnemy();
        lastEnemySpawn = currentTime;
        
        // Occasionally spawn power-ups (10% chance)
        if (Math.random() < 0.1 && enemies.length > 0) {
            const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
            createPowerUp(randomEnemy.position.clone());
        }
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Move towards player
        const direction = new THREE.Vector3();
        direction.subVectors(camera.position, enemy.position).normalize();
        enemy.userData.velocity.copy(direction.multiplyScalar(enemy.userData.speed));
        enemy.position.add(enemy.userData.velocity);
        
        // Rotate to face player
        enemy.lookAt(camera.position);
        
        // Slight random movement for more dynamic behavior
        if (Math.random() < 0.1) {
            enemy.rotation.z += (Math.random() - 0.5) * 0.1;
        }
        
        // Pulsing glow for engines
        const engine = enemy.children.find(child => child.geometry && child.geometry.type === 'CylinderGeometry');
        if (engine) {
            const pulseTime = Date.now() * 0.003;
            const pulseIntensity = 0.7 + 0.3 * Math.sin(pulseTime);
            engine.material.emissiveIntensity = pulseIntensity;
        }
        
        // Remove if too close to player (collision handled separately)
        if (enemy.position.distanceTo(camera.position) < 2) {
            // This will be handled by collision detection
        }
        
        // Remove if too far behind
        const enemyToPlayer = new THREE.Vector3().subVectors(camera.position, enemy.position);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        if (enemyToPlayer.dot(forward) < -50) {
            scene.remove(enemy);
            enemies.splice(i, 1);
        }
    }
}

function updatePowerUps() {
    const currentTime = Date.now();
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        
        // Move power-up with floating motion
        powerUp.position.add(powerUp.userData.velocity);
        
        // Pulsing effect
        powerUp.userData.pulseTime += 0.1;
        const pulseScale = 1 + 0.2 * Math.sin(powerUp.userData.pulseTime);
        powerUp.scale.set(pulseScale, pulseScale, pulseScale);
        
        // Rotate for visual effect
        powerUp.rotation.y += 0.02;
        powerUp.rotation.x += 0.01;
        
        // Check if power-up is too old
        if (currentTime - powerUp.userData.birthTime > powerUp.userData.lifetime) {
            scene.remove(powerUp);
            powerUps.splice(i, 1);
            continue;
        }
        
        // Check collision with player
        const playerSphere = new THREE.Sphere();
        playerSphere.center.copy(camera.position);
        playerSphere.radius = 1.0;
        
        const powerUpSphere = new THREE.Sphere();
        powerUpSphere.center.copy(powerUp.position);
        powerUpSphere.radius = 0.5;
        
        if (playerSphere.intersectsSphere(powerUpSphere)) {
            // Collect power-up
            collectPowerUp(powerUp.userData.type);
            scene.remove(powerUp);
            powerUps.splice(i, 1);
        }
    }
}

function collectPowerUp(type) {
    switch(type) {
        case 'weapon':
            weaponLevel++;
            if (weaponLevel % 3 === 1) {
                weaponType = 'laser';
                weaponCooldown = 100;
                bulletDamage = 1;
            } else if (weaponLevel % 3 === 2) {
                weaponType = 'plasma';
                weaponCooldown = 200;
                bulletDamage = 3;
            } else {
                weaponType = 'railgun';
                weaponCooldown = 80;
                bulletDamage = 2;
            }
            alert("Weapon Upgraded!");
            break;
        case 'shield':
            shieldsActive = true;
            shieldTimer = 30000; // 30 seconds
            alert("Shield Activated!");
            break;
        case 'rapidfire':
            rapidFireActive = true;
            rapidFireTimer = 20000; // 20 seconds
            weaponCooldown = 50; // Very fast firing
            alert("Rapid Fire Activated!");
            break;
        case 'health':
            playerHealth = Math.min(100, playerHealth + 25);
            alert("Health Restored!");
            break;
    }
    updateHUD();
    updateMissionDisplay();
}

function updatePowerUpTimers() {
    const deltaTime = 16; // Approximate ms per frame
    
    if (shieldsActive) {
        shieldTimer -= deltaTime;
        if (shieldTimer <= 0) {
            shieldsActive = false;
            alert("Shield Deactivated!");
        }
    }
    
    if (rapidFireActive) {
        rapidFireTimer -= deltaTime;
        if (rapidFireTimer <= 0) {
            rapidFireActive = false;
            // Reset to normal weapon cooldown
            if (weaponType === 'laser') weaponCooldown = 100;
            else if (weaponType === 'plasma') weaponCooldown = 200;
            else if (weaponType === 'railgun') weaponCooldown = 80;
            else weaponCooldown = 150;
            alert("Rapid Fire Deactivated!");
        }
    }
    
    if (tripleShotActive) {
        tripleShotTimer -= deltaTime;
        if (tripleShotTimer <= 0) {
            tripleShotActive = false;
            alert("Triple Shot Deactivated!");
        }
    }
}

function updateParticles() {
    const currentTime = Date.now();
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Move particle
        if (particle.userData.velocity) {
            particle.position.add(particle.userData.velocity);
        }
        
        // Fade out as it ages
        const age = currentTime - particle.userData.birthTime;
        const lifeRatio = age / particle.userData.lifetime;
        if (lifeRatio > 1) {
            scene.remove(particle);
            particles.splice(i, 1);
        } else {
            // Special effects for different particle types
            if (particle.userData.type === 'trail') {
                particle.material.opacity = 0.7 * (1 - lifeRatio);
            } else if (particle.userData.type === 'muzzleFlash') {
                particle.material.opacity = 0.8 * (1 - lifeRatio);
                // Shrink over time
                const scale = 1 - lifeRatio;
                particle.scale.set(scale, scale, scale);
            } else {
                particle.material.opacity = 1 - lifeRatio;
            }
        }
    }
}

function checkCollisions() {
    // Create bounding sphere for camera (player)
    const playerSphere = new THREE.Sphere();
    playerSphere.center.copy(camera.position);
    playerSphere.radius = 0.5;
    
    // Check bullet-enemy collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const bulletSphere = new THREE.Sphere();
        bulletSphere.center.copy(bullet.position);
        bulletSphere.radius = 0.1;
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const enemySphere = new THREE.Sphere();
            enemySphere.center.copy(enemy.position);
            enemySphere.radius = 1.5;
            
            if (bulletSphere.intersectsSphere(enemySphere)) {
                // Collision detected!
                enemy.userData.health -= bullet.userData.damage;
                
                if (enemy.userData.health <= 0) {
                    createExplosion(enemy.position.clone(), bullet.userData.explosionSize);
                    scene.remove(enemy);
                    enemies.splice(j, 1);
                    score += enemy.userData.points;
                    kills++;
                    missionProgress++;
                    
                    // Check if mission is complete
                    if (missionProgress >= missionTarget) {
                        completeMission();
                    }
                    
                    // 20% chance to spawn a power-up when enemy is destroyed
                    if (Math.random() < 0.2) {
                        createPowerUp(enemy.position.clone());
                    }
                }
                
                scene.remove(bullet);
                bullets.splice(i, 1);
                updateHUD();
                updateMissionDisplay();
                break; // Bullet is destroyed, no need to check other enemies
            }
        }
    }
    
    // Check player-enemy collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const enemySphere = new THREE.Sphere();
        enemySphere.center.copy(enemy.position);
        enemySphere.radius = 1.5;
        
        if (playerSphere.intersectsSphere(enemySphere)) {
            // Collision detected!
            if (!shieldsActive) {
                createExplosion(enemy.position.clone(), 0.15);
                playerHealth -= 10;
                updateHUD();
                
                if (playerHealth <= 0) {
                    gameOver();
                }
            }
            
            // Always destroy the enemy on collision
            scene.remove(enemy);
            enemies.splice(i, 1);
            score += Math.floor(enemy.userData.points * 0.5); // Partial points for collision kill
            kills++;
            missionProgress++;
            
            // Check if mission is complete
            if (missionProgress >= missionTarget) {
                completeMission();
            }
            
            updateHUD();
            updateMissionDisplay();
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    if (gameState === 'playing') {
        updatePlayer();
        handleShooting();
        updateBullets();
        spawnEnemies();
        updateEnemies();
        updatePowerUps();
        updatePowerUpTimers();
        updateParticles();
        checkCollisions();
        updateHUD();
        updateMissionDisplay();
    }
    
    // Rotate starfield slightly for parallax effect
    if (stars) {
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(camera.quaternion);
        stars.position.add(forward.clone().multiplyScalar(-playerVelocity.z * 0.1));
    }
    
    renderer.render(scene, camera);
}

// Start the game initialization
init();