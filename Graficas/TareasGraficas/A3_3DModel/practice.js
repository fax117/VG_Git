// 1. Enable shadow mapping in the renderer. 
// 2. Enable shadows and set shadow parameters for the lights that cast shadows. 
// Both the THREE.DirectionalLight type and the THREE.SpotLight type support shadows. 
// 3. Indicate which geometry objects cast and receive shadows.

let renderer = null, 
scene = null, 
camera = null,
root = null,
floorGroup = null,
objectList = [],
orbitControls = null,
transformControls = null;

let objLoader = null, jsonLoader = null;

let duration = 20000; // ms
let currentTime = Date.now();

let directionalLight = null;
let spotLight = null;
let ambientLight = null;
let pointLight = null;
let mapUrl = "textures/wood.png";

let SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;
// let objModelUrl = {obj:'../models/obj/Penguin_obj/penguin.obj', map:'../models/obj/Penguin_obj/peng_texture.jpg'};
// let objModelUrl = {obj:'../models/obj/cerberus/Cerberus.obj', map:'../models/obj/cerberus/Cerberus_A.jpg', normalMap:'../models/obj/cerberus/Cerberus_N.jpg', specularMap: '../models/obj/cerberus/Cerberus_M.jpg'};
// let jsonModelUrl = { url:'../models/json/teapot-claraio.json' };

let objModelUrl = {obj: 'source/Femal_Base_Mesh.obj'}

function promisifyLoader ( loader, onProgress ) 
{
    function promiseLoader ( url ) {
  
      return new Promise( ( resolve, reject ) => {
  
        loader.load( url, resolve, onProgress, reject );
  
      } );
    }
  
    return {
      originalLoader: loader,
      load: promiseLoader,
    };
}

const onError = ( ( err ) => { console.error( err ); } );

async function loadObj(objModelUrl, objectList)
{
    const objPromiseLoader = promisifyLoader(new THREE.OBJLoader());

    try {
        const object = await objPromiseLoader.load(objModelUrl.obj);
        
        let texture = objModelUrl.hasOwnProperty('map') ? new THREE.TextureLoader().load(objModelUrl.map) : null;
        let normalMap = objModelUrl.hasOwnProperty('normalMap') ? new THREE.TextureLoader().load(objModelUrl.normalMap) : null;
        let specularMap = objModelUrl.hasOwnProperty('specularMap') ? new THREE.TextureLoader().load(objModelUrl.specularMap) : null;

        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.map = texture;
                child.material.normalMap = normalMap;
                child.material.specularMap = specularMap;
            }
        });

        object.scale.set(1, 1, 1);
        object.position.z = 0;
        object.position.x = 0;
        object.rotation.y = 0;
        object.name = "objObject";
        objectList.push(object);
        
        transformControls.attach(object.mesh)
        scene.add(object);

    }
    catch (err) {
        return onError(err);
    }
}

function run() 
{
    requestAnimationFrame(function() { run(); });
    
    // Render the scene
    renderer.render( scene, camera );

    // Update the camera controller
    // orbitControls.update();
    // orbitControls.addEventListener('change', render);
}

function setLightColor(light, r, g, b)
{
    r /= 255;
    g /= 255;
    b /= 255;
    
    light.color.setRGB(r, g, b);
}

function createScene(canvas) 
{
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.BasicShadowMap;
    
    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    camera.position.set(0, 1, 5);

    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControls.update();
    orbitControls.addEventListener('change', renderer);

    transformControls = new THREE.TransformControls(camera, renderer.domElement)
    transformControls.addEventListener( 'change', renderer );
    transformControls.addEventListener( 'dragging-changed', function ( event ) {
        orbitControls.enabled = ! event.value;
    } );


    window.addEventListener( 'keydown', function ( event ) {
        switch ( event.keyCode ) {
            case 81: // Q
                transformControls.setSpace( transformControls.space === "local" ? "world" : "local" );
                break;
            case 16: // Shift
                transformControls.setTranslationSnap( 100 );
                transformControls.setRotationSnap( THREE.MathUtils.degToRad( 15 ) );
                transformControls.setScaleSnap( 0.25 );
                break;
            case 87: // W
                transformControls.setMode( "translate" );
                break;
            case 69: // E
                transformControls.setMode( "rotate" );
                break;
            case 82: // R
                transformControls.setMode( "scale" );
                break;
            case 32: // Spacebar
            break;
        }
    } );
    //transformControls.enabled = ! orbitControls.enabled;

    window.addEventListener( 'keyup', function ( event ) {
        switch ( event.keyCode ) {
            case 17: // Ctrl
                transformControls.setTranslationSnap( null );
                transformControls.setRotationSnap( null );
                transformControls.setScaleSnap( null );
                break;
        }
    } );

    // Create a rootGroup to hold all the objects
    root = new THREE.Object3D;
    // root.position.set(0,0,0);
    
    // Add a directional light to show off the object
    directionalLight = new THREE.DirectionalLight( 0x000000, 1);

    // Create and add all the lights
    directionalLight.position.set(.5, 1, -3);
    directionalLight.target.position.set(0,0,0);
    directionalLight.castShadow = true;
    root.add(directionalLight);

    spotLight = new THREE.SpotLight (0x000000);
    spotLight.position.set(2, 10, 15);
    spotLight.target.position.set(-2, 0, -2);
    root.add(spotLight);

    spotLight.castShadow = true;

    spotLight.shadow.camera.near = 1;
    spotLight.shadow. camera.far = 200;
    spotLight.shadow.camera.fov = 45;
    
    spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    ambientLight = new THREE.AmbientLight ( 0xffffff, 0.8);
    root.add(ambientLight);
    
    // Create the objects
    loadObj(objModelUrl, objectList);

    // Create a floorGroup to hold the objects
    floorGroup = new THREE.Object3D;
    root.add(floorGroup);

    // Create a texture map
    let map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    let color = 0xffffff;

    // Put in a ground plane to show off the lighting
    let geometry = new THREE.PlaneGeometry(100, 100, 0, 0);
    let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    floorGroup.add( mesh );

    // transformControls.attach(root.mesh);
    scene.add(transformControls);

    scene.add( root );
}