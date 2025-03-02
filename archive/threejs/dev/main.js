import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011); // Very dark blue for space

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 10); // Set initial camera position

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffc0cb, 0.6);
scene.add(ambientLight);

const candleLight = new THREE.PointLight(0xffa500, 2, 10);
candleLight.position.set(0, 3, 0);
scene.add(candleLight);

const wallHeight = 10;
const roomSize = 15;

// Load models
const loader = new GLTFLoader();
let table; // Store reference to the table

// Sky with stars and planets
function createSky() {
    // Create a large sphere for the sky
    const skyGeometry = new THREE.SphereGeometry(400, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x000011,
        side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    
    // Add stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = [];
    
    for (let i = 0; i < starCount; i++) {
        const x = THREE.MathUtils.randFloatSpread(600);
        const y = THREE.MathUtils.randFloatSpread(600);
        const z = THREE.MathUtils.randFloatSpread(600);
        
        // Keep stars outside the room
        if (Math.abs(x) < 25 && Math.abs(y) < 25 && Math.abs(z) < 25) continue;
        
        starPositions.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        sizeAttenuation: true
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    
    // Add some planets
    const planets = [
        { size: 8, distance: 150, color: 0xc1440e, speed: 0.005 },  // Mars-like
        { size: 15, distance: 250, color: 0xe3a010, speed: 0.002 }, // Saturn-like
        { size: 6, distance: 180, color: 0x2d6ca4, speed: 0.003 }   // Neptune-like
    ];
    
    planets.forEach((planet, i) => {
        const planetGeometry = new THREE.SphereGeometry(planet.size, 32, 32);
        const planetMaterial = new THREE.MeshStandardMaterial({ color: planet.color });
        const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
        
        // Position planet
        const angle = i * (Math.PI * 2 / planets.length);
        planetMesh.position.set(
            Math.sin(angle) * planet.distance,
            (i - 1) * 50,  // Different heights
            Math.cos(angle) * planet.distance
        );
        
        // Store initial position and rotation speed
        planetMesh.userData = {
            initialX: planetMesh.position.x,
            initialZ: planetMesh.position.z,
            speed: planet.speed,
            distance: planet.distance,
            rotationY: Math.random() * Math.PI * 2
        };
        
        scene.add(planetMesh);
    });
}

// Create the glass dome ceiling
function createGlassDome() {
    const domeRadius = roomSize;
    const domeGeometry = new THREE.SphereGeometry(domeRadius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x8B4513,  // Brown color for the dome
        metalness: 0.2,
        roughness: 0.25,
        transmission: 0.85,  // Slightly less transparent
        thickness: 0.8,      // Thicker glass
        envMapIntensity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
    });
    
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.set(0, wallHeight, 0);
    dome.rotation.x = Math.PI; // Flip the dome to create a ceiling
    scene.add(dome);
    
    // Add a stronger edge light around the dome
    const domeEdgeLight = new THREE.PointLight(0xFF8C00, 4, 30); // Increased intensity and range
    domeEdgeLight.position.set(0, wallHeight - 1, 0);
    scene.add(domeEdgeLight);
    
    // Add structural bars
    const barMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A3728,  // Dark brown for bars
        metalness: 0.7,
        roughness: 0.3
    });
    
    // Create bars in a radial pattern
    const barCount = 8;
    const barWidth = 0.4;
    const barDepth = 0.4;
    
    for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2;
        
        // Create a radial bar
        const radialBar = new THREE.Mesh(
            new THREE.BoxGeometry(barWidth, barDepth, domeRadius),
            barMaterial
        );
        
        // Position the bar
        radialBar.position.set(0, wallHeight - 0.2, 0);
        radialBar.rotation.y = angle;
        scene.add(radialBar);
        
        // Add vertical support from wall to dome
        const supportHeight = 2;
        const supportGeometry = new THREE.BoxGeometry(barWidth, supportHeight, barDepth);
        const support = new THREE.Mesh(supportGeometry, barMaterial);
        
        // Position at the wall edge, right where it meets the dome
        support.position.set(
            Math.sin(angle) * roomSize,
            wallHeight - supportHeight/2,
            Math.cos(angle) * roomSize
        );
        support.rotation.y = angle + Math.PI/2;
        scene.add(support);
        
        // Create circular support ring
        const ringRadius = domeRadius * 0.7;
        const ringGeometry = new THREE.TorusGeometry(ringRadius, barWidth/2, 16, 50);
        const ring = new THREE.Mesh(ringGeometry, barMaterial);
        ring.position.set(0, wallHeight - 3, 0);
        ring.rotation.x = Math.PI / 2;
        scene.add(ring);
    }
    
    // Add chandelier to the center of the dome
    createChandelier();
}

// Create a decorative chandelier with significantly increased brightness
function createChandelier() {
    // Main chandelier structure
    const chandelierGroup = new THREE.Group();
    
    // Central piece
    const centralGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 8);
    const goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xD4AF37,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0xA67C00,
        emissiveIntensity: 0.3
    });
    const centralPiece = new THREE.Mesh(centralGeometry, goldMaterial);
    chandelierGroup.add(centralPiece);
    
    // Hanging chain
    const chainLength = wallHeight - 6;
    const chainGeometry = new THREE.CylinderGeometry(0.1, 0.1, chainLength, 8);
    const chainMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A3728,
        metalness: 0.8,
        roughness: 0.3
    });
    const chain = new THREE.Mesh(chainGeometry, chainMaterial);
    chain.position.y = chainLength / 2 + 0.6;
    chandelierGroup.add(chain);
    
    // Arms extending from central piece
    const armCount = 6;
    const armLength = 2.5;
    const armRadius = 0.15;
    
    for (let i = 0; i < armCount; i++) {
        const angle = (i / armCount) * Math.PI * 2;
        
        // Create curved arm
        const armCurve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(armLength * 0.6 * Math.cos(angle), -0.5, armLength * 0.6 * Math.sin(angle)),
            new THREE.Vector3(armLength * Math.cos(angle), -1.2, armLength * Math.sin(angle))
        );
        
        const armPoints = armCurve.getPoints(10);
        const armGeometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(armPoints),
            12,
            armRadius,
            8,
            false
        );
        
        const arm = new THREE.Mesh(armGeometry, goldMaterial);
        chandelierGroup.add(arm);
        
        // Add lamp at the end of each arm
        const lampGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const lampMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xFFFFCC,
            emissive: 0xFFCC77,
            emissiveIntensity: 1.0, // Doubled emissive intensity
            transmission: 0.9,
            thickness: 0.2,
            clearcoat: 1
        });
        
        const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
        lamp.position.set(
            armLength * Math.cos(angle),
            -1.2,
            armLength * Math.sin(angle)
        );
        chandelierGroup.add(lamp);
        
        // Add point light for each lamp with MUCH higher intensity
        const lampLight = new THREE.PointLight(0xFFD700, 4.0, 30); // Significantly increased brightness and range
        lampLight.position.copy(lamp.position);
        chandelierGroup.add(lampLight);
    }
    
    // Add central light with dramatically increased brightness
    const centralLight = new THREE.PointLight(0xFFD700, 6.0, 50); // Much brighter central light with extended range
    centralLight.position.set(0, 0, 0);
    chandelierGroup.add(centralLight);
    
    // Add an additional ambient light source in the chandelier
    const chandelierAmbient = new THREE.PointLight(0xFFFFEE, 3.0, 40);
    chandelierAmbient.position.set(0, -1, 0);
    chandelierGroup.add(chandelierAmbient);
    
    // Add decorative elements
    const crystalGeometry = new THREE.ConeGeometry(0.15, 0.6, 6);
    const crystalMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xFFFFFF,
        transmission: 0.9,
        thickness: 0.2,
        roughness: 0.05,
        clearcoat: 1,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.3
    });
    
    // Add hanging crystals
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 0.9;
        
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.set(
            radius * Math.cos(angle),
            -0.9,
            radius * Math.sin(angle)
        );
        crystal.rotation.x = Math.PI;
        chandelierGroup.add(crystal);
    }
    
    // Position chandelier at the center of the dome
    chandelierGroup.position.set(0, wallHeight - 1, 0);
    scene.add(chandelierGroup);
}

// Floor with tiles
const floorGeometry = new THREE.CircleGeometry(roomSize, 32); // Circular floor to match cylindrical walls
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2817 }); // Darker brown color base
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.1; // Move floor slightly below origin
scene.add(floor);

// Add tile pattern to floor
function createTiledFloor() {
    const tileSize = 1.5; // Larger tile size
    const tilesPerRow = Math.ceil(roomSize * 2 / tileSize);
    const tileGroup = new THREE.Group();
    
    // Load the tile model
    loader.load('/models/tile.glb', (gltf) => {
        const tileMesh = gltf.scene;
        
        // Create a grid of tiles with tighter spacing
        for (let x = -tilesPerRow/2; x < tilesPerRow/2; x++) {
            for (let z = -tilesPerRow/2; z < tilesPerRow/2; z++) {
                // Calculate position
                const xPos = x * tileSize;
                const zPos = z * tileSize;
                const distanceFromCenter = Math.sqrt(xPos * xPos + zPos * zPos);
                
                // Only place tiles within the circular room, expanded coverage
                if (distanceFromCenter <= roomSize * 1.05) { // Slightly exceed room size to ensure full coverage
                    const tile = tileMesh.clone();
                    
                    // Adjust scale for larger tiles
                    tile.scale.set(0.9, 0.6, 0.9); // Increased scale significantly
                    
                    // Position tile
                    tile.position.set(xPos, 0, zPos);
                    
                    // Add some rotation variety (reduced frequency)
                    if ((x + z) % 3 === 0) {
                        tile.rotation.y = Math.PI / 2;
                    }
                    
                    // Add tile to the group
                    tileGroup.add(tile);
                }
            }
        }
        
        // Position the entire tile group
        tileGroup.position.y = -0.09; // Position closer to the floor base
        scene.add(tileGroup);
        
        // Make the base floor less visible
        floorMaterial.color.set(0x271a10); // Darker color for base floor
        floorMaterial.roughness = 0.9; // More rough
    });
}

// Create tiled floor pattern
createTiledFloor();

// Fixed: Wall creation function with proper vertical alignment
function createWalls() {
    const wallCount = 16; // Number of wall segments to create a circle
    const wallGroup = new THREE.Group();
    
    // Load the wall model
    loader.load('/models/wall.glb', (gltf) => {
        const wallMesh = gltf.scene;
        
        // Create walls in a circular pattern
        for (let i = 0; i < wallCount; i++) {
            const angle = (i / wallCount) * Math.PI * 2;
            const wall = wallMesh.clone();
            
            // Scale the wall appropriately
            wall.scale.set(4.25, 18, 2.5);
            
            // Position wall segment - FIXED: offset to match floor properly
            const wallRadius = roomSize - 0.5; // Slightly inset from room boundary
            wall.position.set(
                Math.sin(angle) * wallRadius,
                wallHeight / 2 - 4.5, // Fixed value to align bottom of wall with floor
                Math.cos(angle) * wallRadius
            );
            
            // Rotate to face inward
            wall.rotation.y = angle + Math.PI; // Add PI (180 degrees) to flip orientation
            
            // Add to wall group
            wallGroup.add(wall);
        }
        
        // Add the entire wall group to the scene
        scene.add(wallGroup);
    });
}

// Create walls with the model
createWalls();

// Add decorative trim where walls meet dome
const trimGeometry = new THREE.TorusGeometry(roomSize - 0.1, 0.4, 16, 32);
const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x291e10, // Slightly darker for contrast
    metalness: 0.3,
    roughness: 0.6
});
const trim = new THREE.Mesh(trimGeometry, trimMaterial);
trim.rotation.x = Math.PI / 2;
trim.position.y = wallHeight - 0.2;
scene.add(trim);

// Add baseboard where walls meet floor
const baseboardGeometry = new THREE.TorusGeometry(roomSize - 0.1, 0.3, 16, 32);
const baseboard = new THREE.Mesh(baseboardGeometry, trimMaterial);
baseboard.rotation.x = Math.PI / 2;
baseboard.position.y = 0.15;
scene.add(baseboard);

// Create sky and glass dome
createSky();
createGlassDome();

// Add decorative side tables with flower pots
function createSideTablesWithFlowers() {
    // Position the tables in a symmetrical pattern around the main table
    const tablePositions = [
        { x: 10, z: 0 },   // Right
        { x: -10, z: 0 },  // Left
        { x: 0, z: 10 },   // Front
        { x: 0, z: -10 }   // Back
    ];
    
    // Load the table model once and clone it for each position
    loader.load('/models/table.glb', (gltf) => {
        const tableMesh = gltf.scene;
        
        // Create tables at each position with flower pots
        tablePositions.forEach((pos, index) => {
            // Create table
            const sideTable = tableMesh.clone();
            sideTable.scale.set(0.8, 0.8, 0.8);  // Smaller than main table
            sideTable.position.set(pos.x, 0.3, pos.z);
            scene.add(sideTable);
            
            // Load appropriate flower pot for this table
            const potNumber = index + 1;
            loader.load(`/models/pot${potNumber}.glb`, (gltf) => {
                const pot = gltf.scene;
                if (potNumber === 2) {
                pot.scale.set(0.005, 0.005, 0.005);  // Scale appropriately
                pot.position.set(pos.x, 0.8, pos.z);  // Position on top of the table
                }
                else if (potNumber === 1) {
                pot.scale.set(1, 1, 1);  // Scale appropriately
                pot.position.set(pos.x, 1, pos.z);  // Position on top of the table
                }
                else if (potNumber === 4) {
                pot.scale.set(0.15, 0.15, 0.15);  // Scale appropriately
                pot.position.set(pos.x, 0.8, pos.z+0.5);  // Position on top of the table
                }
                else {
                pot.scale.set(0.15, 0.15, 0.15);  // Scale appropriately
                pot.position.set(pos.x, 0.8, pos.z);  // Position on top of the table
                }
                scene.add(pot);
                
            });
        });
    });
}
createSideTablesWithFlowers();

// Add decorative picture frames to walls
function createPictureFrames() {
    const frameCount = 10;
    const frameHeight = 5; // Height position on the wall
    const frameGroupRadius = roomSize - 1.2; // Slightly inset from walls
    const frameWidth = 1.5;
    const frameHeight2 = 1.2;
    const frameDepth = 0.1;
    
    // Load texture for the picture frames
    const textureLoader = new THREE.TextureLoader();
    const pictureTextures = [];
    for (let i = 1; i <= 10; i++) {
        pictureTextures.push(textureLoader.load(`/images/${i}.png`));
    }
    
    for (let i = 0; i < frameCount; i++) {
        // Calculate even spacing around the circle
        const angle = (i / frameCount) * Math.PI * 2;
        
        // Create frame group
        const frameGroup = new THREE.Group();
        
        // Create wooden frame
        const frameGeometry = new THREE.BoxGeometry(frameWidth + 0.2, frameHeight2 + 0.2, frameDepth);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Wood brown color
            metalness: 0.3,
            roughness: 0.8
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        
        // Create picture canvas
        const pictureGeometry = new THREE.PlaneGeometry(frameWidth, frameHeight2);
        const pictureMaterial = new THREE.MeshBasicMaterial({
            map: pictureTextures[i]
        });
        const picture = new THREE.Mesh(pictureGeometry, pictureMaterial);
        picture.position.z = frameDepth / 2 + 0.01; // Slightly in front of the frame
        
        // Add frame and picture to group
        frameGroup.add(frame);
        frameGroup.add(picture);
        
        // Position frame on wall
        frameGroup.position.set(
            Math.sin(angle) * frameGroupRadius,
            frameHeight,
            Math.cos(angle) * frameGroupRadius
        );
        
        // Rotate to face center
        frameGroup.rotation.y = angle + Math.PI; // Face inward
        
        // Add to scene
        scene.add(frameGroup);
        
        // Add a small spotlight for each frame
        const spotlight = new THREE.SpotLight(0xFFFFCC, 1.5, 10, Math.PI/8, 0.8);
        spotlight.position.set(
            Math.sin(angle) * (frameGroupRadius - 1),
            frameHeight + 1,
            Math.cos(angle) * (frameGroupRadius - 1)
        );
        spotlight.target = frameGroup;
        scene.add(spotlight);
    }
}

// Create picture frames
createPictureFrames();

// Load main furniture
loader.load('/models/table.glb', (gltf) => {
    table = gltf.scene;
    table.scale.set(1.5, 1.5, 1.5);
    table.position.set(0, 0.5, 0);
    scene.add(table);
    
    // Load central candle
    loader.load('/models/candle.glb', (gltf) => {
        const candle = gltf.scene;
        candle.scale.set(0.03, 0.03, 0.03);
        candle.position.set(0, 1.25, 0);
        scene.add(candle);
        
        // Update candle light position to match the candle
        candleLight.position.set(0, 2, 0);
        candleLight.intensity = 5;
        candleLight.distance = 15;
    });
    
    // Load and position chairs
    loader.load('/models/chair.glb', (gltf) => {
        // First chair - on one side of the table
        const chair1 = gltf.scene.clone();
        chair1.scale.set(0.2, 0.2, 0.2);
        chair1.position.set(0, 0, 2);
        chair1.rotation.y = Math.PI; 
        scene.add(chair1);
        
        // Second chair - on opposite side of the table
        const chair2 = gltf.scene.clone();
        chair2.scale.set(0.2, 0.2, 0.2);
        chair2.position.set(0, 0, -2);
        scene.add(chair2);
    });
});

// Add rose petals scattered on the floor
function createRosePetals() {
    const petalCount = 150;
    const petalGeometry = new THREE.PlaneGeometry(0.2, 0.2);
    const petalMaterial = new THREE.MeshStandardMaterial({
        color: 0xcc0033,
        side: THREE.DoubleSide,
        emissive: 0x330000,
        emissiveIntensity: 0.2,
        roughness: 0.7
    });
    
    const petalGroup = new THREE.Group();
    
    for (let i = 0; i < petalCount; i++) {
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        
        // Random position within the room
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (roomSize - 2.5);
        
        petal.position.set(
            Math.cos(angle) * distance,
            0.01, // Just above floor level
            Math.sin(angle) * distance
        );
        
        // Random rotation for natural look
        petal.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
        petal.rotation.y = Math.random() * Math.PI * 2;
        petal.rotation.z = (Math.random() - 0.5) * 0.3;
        
        // Random slight variation in size
        const scale = 0.7 + Math.random() * 0.6;
        petal.scale.set(scale, scale, 1);
        
        // Create clusters in some areas
        if (i % 20 === 0) {
            const clusterCenter = {
                x: Math.cos(angle) * distance,
                z: Math.sin(angle) * distance
            };
            
            // Add 5-8 petals in a cluster
            const clusterSize = 5 + Math.floor(Math.random() * 4);
            for (let j = 0; j < clusterSize; j++) {
                const clusterPetal = new THREE.Mesh(petalGeometry, petalMaterial);
                const spreadDistance = 0.3;
                
                clusterPetal.position.set(
                    clusterCenter.x + (Math.random() - 0.5) * spreadDistance,
                    0.01 + Math.random() * 0.02, // Slight height variation
                    clusterCenter.z + (Math.random() - 0.5) * spreadDistance
                );
                
                clusterPetal.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
                clusterPetal.rotation.y = Math.random() * Math.PI * 2;
                clusterPetal.rotation.z = (Math.random() - 0.5) * 0.4;
                
                const clusterScale = 0.6 + Math.random() * 0.5;
                clusterPetal.scale.set(clusterScale, clusterScale, 1);
                
                petalGroup.add(clusterPetal);
                i++; // Increment main counter to account for added petal
            }
        }
        
        petalGroup.add(petal);
    }
    
    scene.add(petalGroup);
}

// Create rose petals
createRosePetals();

// Pointer lock controls for mouse-based camera rotation
const controls = new PointerLockControls(camera, document.body);

// Click to start controls
document.addEventListener('click', () => {
    controls.lock();
});

// Show instructions
const instructions = document.createElement('div');
instructions.style.position = 'absolute';
instructions.style.top = '10px';
instructions.style.width = '100%';
instructions.style.textAlign = 'center';
instructions.style.color = '#ffffff';
instructions.style.fontSize = '18px';
instructions.innerHTML = 'Hello Kelly <br> WASD to move around, click to look around';
document.body.appendChild(instructions);

controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
});

controls.addEventListener('unlock', () => {
    instructions.style.display = 'block';
});

// WASD movement
const moveSpeed = 0.2;
const keysPressed = {};
const playerHeight = 2;
const playerRadius = 0.5;

document.addEventListener('keydown', (event) => {
    keysPressed[event.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.key.toLowerCase()] = false;
});

function handleMovement() {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    
    forward.y = 0;
    right.y = 0;
    forward.normalize();
    right.normalize();
    
    const moveDirection = new THREE.Vector3(0, 0, 0);
    
    if (keysPressed['w']) moveDirection.add(forward);
    if (keysPressed['s']) moveDirection.sub(forward);
    if (keysPressed['a']) moveDirection.sub(right);
    if (keysPressed['d']) moveDirection.add(right);
    
    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        moveDirection.multiplyScalar(moveSpeed);
        
        camera.position.add(moveDirection);
        
        const roomBoundaryX = roomSize - playerRadius;
        const roomBoundaryZ = roomSize - playerRadius;
        
        if (Math.abs(camera.position.x) > roomBoundaryX) {
            camera.position.x = Math.sign(camera.position.x) * roomBoundaryX;
        }
        
        if (Math.abs(camera.position.z) > roomBoundaryZ) {
            camera.position.z = Math.sign(camera.position.z) * roomBoundaryZ;
        }
        
        camera.position.y = playerHeight;
    }
}

// Animate planets
function animatePlanets() {
    scene.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'SphereGeometry' && 
            child.userData && child.userData.speed) {
            
            child.userData.rotationY += child.userData.speed;
            
            // Update position with higher y-coordinate
            child.position.x = Math.sin(child.userData.rotationY) * child.userData.distance;
            child.position.z = Math.cos(child.userData.rotationY) * child.userData.distance;
            
            // Position planets much higher in the sky
            const index = scene.children.indexOf(child);
            // Dramatically increased vertical offset (300-500 units higher)
            const verticalOffset = (index % 3 * 100) + 300; 
            child.position.y = verticalOffset;
            
            child.rotation.y += child.userData.speed / 2;
        }
    });
}

// Add this after your existing code but before the animate() function call

// Messages to display
const messages = [
    "10 Things I Love About You",
    "1. Your silly approach to life",
    "2. Your kind and truly authentic personality",
    "3. Your sleepiness",
    "4. How cute you are",
    "5. Your enderaing, childlike spirit",
    "6. Your vlogging abilities",
    "7. Your quirky behaviour",
    "8. Your expressive personality",
    "9. Your beautiful face",
    "10. Your happy and positive attitude",
    "Thank you for being you, the very best person I know :)",
    "Will you be my Valentine?",
    "YAYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY"
  ];
  
  // Create text display system
// Create text display system
function createTextDisplaySystem() {
    const textContainer = document.createElement('div');
    textContainer.style.position = 'absolute';
    textContainer.style.top = '50%';
    textContainer.style.left = '50%';
    textContainer.style.transform = 'translate(-50%, -50%)';
    textContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    textContainer.style.color = '#fff';
    textContainer.style.padding = '20px 40px';
    textContainer.style.borderRadius = '10px';
    textContainer.style.fontSize = '24px';
    textContainer.style.fontFamily = 'Arial, sans-serif';
    textContainer.style.textAlign = 'center';
    textContainer.style.maxWidth = '80%';
    textContainer.style.display = 'none';
    textContainer.style.zIndex = '1000';
    textContainer.style.opacity = '0';
    textContainer.style.transition = 'opacity 0.5s';
    document.body.appendChild(textContainer);
    
    let currentMessageIndex = 0;
    let messageDisplayed = false;
    
    // Function to show next message
    function showNextMessage() {
      if (currentMessageIndex >= messages.length) {
        textContainer.style.display = 'none';
        return;
      }
      
      // Special styling for first and last message
      if (currentMessageIndex === 0) {
        textContainer.style.fontSize = '32px';
        textContainer.style.color = '#ffb6c1'; // Light pink
      } else if (currentMessageIndex === messages.length - 2) {
        textContainer.style.fontSize = '32px';
        textContainer.style.color = '#ff69b4'; // Hot pink
      } else {
        textContainer.style.fontSize = '24px';
        textContainer.style.color = '#fff';
      }
      
      textContainer.innerHTML = messages[currentMessageIndex];
      textContainer.style.display = 'block';
      setTimeout(() => {
        textContainer.style.opacity = '1';
      }, 10);
      
      currentMessageIndex++;
      messageDisplayed = true;
    }
    
    // Display first message after 5 seconds
    setTimeout(() => {
      showNextMessage();
      
      // Hide hint when pointer lock is active
      controls.addEventListener('lock', () => {
        hint.style.display = 'none';
      });
      
      controls.addEventListener('unlock', () => {
        hint.style.display = 'block';
      });
    }, 5000);
    
    // Advance to next message on spacebar press
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' && messageDisplayed) {
        textContainer.style.opacity = '0';
        setTimeout(() => {
          showNextMessage();
        }, 500);
      }
    });
  }
  
  // Start the text display system
  createTextDisplaySystem();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    handleMovement();
    animatePlanets();
    renderer.render(scene, camera);
}
animate();

// Resize event
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});