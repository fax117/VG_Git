let renderer = null, 
scene = null, 
camera = null,
raycaster = null,
root = null,
floorGroup = null,
orbitControls = null,
sphereList = [];
objectList = [];

let mouse = new THREE.Vector2(), INTERSECTED, CLICKED;
let radius = 100, theta = 0;

let objLoader = null, jsonLoader = null;

let duration = 20000; // ms
let currentTime = Date.now();

let ambientLight = null;

let mapUrl = "Models/textures/Floor/checkers.png";
let SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

let objModelUrl = {obj: 'Models/source/haloWraith.obj', map:'Models/textures/HaloWraith/DefaultMaterial_Base_Color.png', normalMap: 'Models/textures/HaloWraith/DefaultMaterial_Normal_DirectX.png'}

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

async function loadObj(objModelUrl, objectList, posX, posY)
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

        object.scale.set(0.5, 0.5, 0.5);
        object.position.y = posY;
        object.position.x = posX;
        object.position.z = 0;

        object.rotation.y = 0;

        object.name = "objObject";
        
        objectList.push(object);
        
        scene.add(object);

        

    }
    catch (err) {
        return onError(err);
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function moveToCenter(){
    let speed = 0.05;
    sphereList.forEach(sphere => {
        if(sphere.position != THREE.Vector3(0,0,0)){
            let initPosX = sphere.position.x;
            let initPosY = sphere.position.y;
    
            let finPosX = 0;
            let finPosY = 0;
            
            let targetNormalizedVector = new THREE.Vector3(0,0,0);
            targetNormalizedVector.x = finPosX - initPosX;
            targetNormalizedVector.y = finPosY - initPosY;
            targetNormalizedVector.normalize()
    
            sphere.translateOnAxis(targetNormalizedVector,speed);
        }
        
    });
}

function run() 
{
    requestAnimationFrame( run );
    render();
    //moveToCenter(sphereList);
}

function render() 
{
    renderer.render( scene, camera );
}

function createScene(canvas){
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    camera.position.set(0,0,50); // Move here to change Camera position
    camera.lookAt(0,0,0);
    
    /*orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControls.update();*/

    let light = new THREE.AmbientLight( 0xffffff, 1 );
    light.position.set( 0, 0, 0 );
    scene.add( light );

    // Create a rootGroup to hold all the objects
    root = new THREE.Object3D;

    // Create the objects
    // let posX = getRandomInt(-10, 10);
    // let posY = getRandomInt(-10, 10); 
    //loadObj(objModelUrl, objectList, posX, posY);
       

    let geometry = new THREE.SphereGeometry( 1, 32, 32 );

    for ( let i = 0; i < 20; i ++ ){
        var material = new THREE.MeshLambertMaterial( {color: Math.random() * 0xffffff} );
        var sphere = new THREE.Mesh( geometry, material );
        sphere.position.x = getRandomInt(-30, 30);
        sphere.position.y = getRandomInt(-30, 30);
        sphereList.push(sphere);
        scene.add( sphere );
    }

    
    // Create a floorGroup to hold the objects
    floorGroup = new THREE.Object3D;
    root.add(floorGroup);

    // Create a texture map
    let map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    let color = 0xffffff;

    // Put in a ground plane
    geometry = new THREE.PlaneGeometry(100, 100, 0, 0);
    let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.castShadow = false;
    mesh.receiveShadow = true;
    floorGroup.add( mesh );

    raycaster = new THREE.Raycaster();
        
    document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('mousedown', onDocumentMouseDown);

    scene.add( root );
}

function onDocumentMouseMove( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // find intersections
    raycaster.setFromCamera( mouse, camera );

    let intersects = raycaster.intersectObjects( scene.children );
    
    if ( intersects.length > 0 ) 
    {
        let closer = intersects.length - 1;

        if ( INTERSECTED != intersects[ closer ].object ) 
        {
            if ( INTERSECTED)
            {
                INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
            }

            INTERSECTED = intersects[ closer ].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex( 0xff0000 );
        }
    } 
    else 
    {
        if ( INTERSECTED ) 
            INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

        INTERSECTED = null;
    }
}

function onDocumentMouseDown(event)
{
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    console.log("Mouse x: " + mouse.x);
    console.log("Mouse y: " + mouse.y);

    // find intersections
    raycaster.setFromCamera( mouse, camera );

    let intersects = raycaster.intersectObjects( scene.children );

    console.log("intersects", intersects);
    if ( intersects.length > 0 ) 
    {
        CLICKED = intersects[ intersects.length - 1 ].object;
        CLICKED.material.emissive.setHex( 0xffffff );
        console.log(CLICKED.name);
    } 
    else 
    {
        if ( CLICKED ) 
            CLICKED.material.emissive.setHex( CLICKED.currentHex );

        CLICKED = null;
    }
}