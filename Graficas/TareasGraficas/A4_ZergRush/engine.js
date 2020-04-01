let renderer = null, 
scene = null, 
camera = null,
raycaster = null,
root = null,
floorGroup = null,
orbitControls = null,
score = 0,
gameOver = false;
wraithList = [],
sphereList = [],
lingList = [];
objectList = [];

let blocker,  instructions;

let mouse = new THREE.Vector2(), INTERSECTED, CLICKED;
let radius = 100, theta = 0;

let objLoader = null, jsonLoader = null;

let duration = 20000; // ms
let today = new Date();

let ambientLight = null;

let mapUrl = "Models/textures/Floor/creep.jpg";
let SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

let objModelUrl = {obj: 'Models/source/haloWraith.obj', map:'Models/textures/HaloWraith/DefaultMaterial_Base_Color.png', normalMap: 'Models/textures/HaloWraith/DefaultMaterial_Normal_DirectX.png'}
let bunkerUrl = {obj: 'Models/source/bunker.obj', map:'Models/textures/SC2_Bunker/Material _91_Base_Color.png', normalMap: 'Models/textures/SC2_Bunker/Material _91_Normal_DirectX.png'}
let zerglingUrl = {obj: 'Models/source/cZergling.obj'}

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

async function loadObj(name, objModelUrl, objectList, scale)
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

        object.scale.set(scale.x, scale.y, scale.z);
        object.rotation.x = Math.PI/2;

        object.name = name;
        
        objectList.push(object);
    }
    catch (err) {
        return onError(err);
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    let rand = Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    if (rand < 30 && rand > -30){ 
        return getRandomInt(min, max);
    }
    return rand
}

function resetPosition(object){
    object.position.x = getRandomInt(-100, 100);
    object.position.y = getRandomInt(-100, 100);
}

function moveToCenter(list){
    list.forEach(elem => {
        let speed = Math.floor(getRandomInt(100, 200)) / 1000; 
        if(elem.position != THREE.Vector3(0,0,0)){
            let initPosX = elem.position.x;
            let initPosY = elem.position.y;
            let initPosZ = elem.position.z;

            let finPosX = 0;
            let finPosY = 0;
            let finPosZ = 0;
            
            let targetNormalizedVector = new THREE.Vector3(0,0,0);
            targetNormalizedVector.x = finPosX - initPosX;
            targetNormalizedVector.y = finPosY - initPosY;
            targetNormalizedVector.z = initPosZ;
            targetNormalizedVector.normalize();
            elem.translateOnAxis(targetNormalizedVector, speed);

            // Look to the same direction
            
        }
        
    });
}

function countdown(){
    let currentTime = Date.now();
    let desiredTime = today - currentTime;
    
    let timeLeft;
    console.log(desiredTime);
    document.getElementById('countdown').innerHTML = timeLeft;
}

function run() {
    checkGameOver();
    if(!gameOver){
        requestAnimationFrame( run );
        render();
        moveToCenter(sphereList);
        checkIfNearBunker(sphereList);
        moveToCenter(lingList);
    }
    else{
        scene.stop();
        document.getElementById('retry').hidden = false;
    }
}

function render() 
{
    renderer.render( scene, camera );
}

async function createScene(canvas){
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    camera.position.set(0,0,75); // Move here to change Camera position
    camera.lookAt(0,0,0);
    
    // orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    // orbitControls.update();                     

    let light = new THREE.AmbientLight( 0xffffff, 1 );
    light.position.set( 0, 0, 0 );
    scene.add( light );

    // Create a rootGroup to hold all the objects
    root = new THREE.Object3D;

    // Create the objects
    let scale = new THREE.Vector3(0.07, 0.07, 0.07);
    await loadObj("bunker", bunkerUrl, objectList, scale);
    objectList[0].position.set(0,0,0);
    root.add(objectList[0]);

    // scale = new THREE.Vector3(0.7, 0.7, 0.7)
    // await loadObj("wraith", objModelUrl, objectList, scale);

    scale = new THREE.Vector3(1, 1, 1)
    await loadObj("zergling", zerglingUrl, objectList, scale);

    let geometry = new THREE.SphereGeometry( 1, 32, 32 );

    for ( let i = 0; i < 20; i ++ ){
        let material = new THREE.MeshLambertMaterial( {color: Math.random() * 0xffffff} );
        let sphere = new THREE.Mesh( geometry, material );
        sphere.position.x = getRandomInt(-100, 100);
        sphere.position.y = getRandomInt(-100, 100);
        sphereList.push(sphere);

        scene.add( sphere );

        lingList.push(objectList[1].clone());
         // wraithList.push(objectList[2].clone());
    }
    
    // wraithList.forEach(wraith => {
        // wraith.position.x = getRandomInt(-30, 30);
        // wraith.position.y = getRandomInt(-30, 30);
        // wraith.position.z = 0.7;
        // scene.add(wraith);
    // });
    
    lingList.forEach(ling => {
        // color: Object { r: 0.43529411764705883, g: 0.3058823529411765, b: 0.3333333333333333 }
        // colorWrite: true
        ling.position.x = getRandomInt(-100, 100);
        ling.position.y = getRandomInt(-100, 100);
        scene.add(ling);
    });
   
    // Create a floorGroup to hold the objects
    floorGroup = new THREE.Object3D;
    root.add(floorGroup);

    // Create a texture map
    let map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    let color = 0xffffff;

    // Put in a ground plane
    geometry = new THREE.PlaneGeometry(200, 200, 0, 0);
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

function onDocumentMouseDown(event){
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // find intersections
    raycaster.setFromCamera( mouse, camera );

    let intersects = raycaster.intersectObjects( scene.children );

    console.log("intersects", intersects);
    if ( intersects.length > 0 ) {
        CLICKED = intersects[ intersects.length - 1 ].object;
        CLICKED.material.emissive.setHex( 0xff00ff );
        console.log(CLICKED.name);
        score ++;

        document.getElementById("score").innerHTML = "Score: " + score;
        resetPosition(CLICKED);
    } 
    else{
        if ( CLICKED ) 
            CLICKED.material.emissive.setHex( CLICKED.currentHex );

        CLICKED = null;
    }
}

function checkIfNearBunker(sphereList){

    //Provisional collider :P

    sphereList.forEach(sphere => {
        if(sphere.position.x < 4 && sphere.position.x > -4 && sphere.position.y < 4 && sphere.position.y > -4){
            resetPosition(sphere);
            if(score != -1)
                score--;
        }
    });

    document.getElementById("score").innerHTML = "Score: " + score;
}

function checkGameOver(){
    if(score <= -1){
        gameOver = true;
    }
}