var container, stat;

var camera, scene, controls, renderer, dirLight, hemiLight;

var group;

var icoMesh;

var clock = new THREE.Clock();

init();
animate();

function init() {
    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 5000 );
    camera.position.set( 0, 0, 250 );

    scene = new THREE.Scene();

    scene.fog = new THREE.Fog( 0xffffff, 1, 5000 );
    scene.fog.color.setHSL( 0.6, 0, 1 );

    controls = new THREE.TrackballControls( camera );
		controls.rotateSpeed = 1.0;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 0.8;
		controls.noZoom = false;
		controls.noPan = false;
		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;

    // LIGHTS
    hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 500, 0 );
    scene.add( hemiLight );

    //

    dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( -1, 1.75, 1 );
    dirLight.position.multiplyScalar( 50 );
    scene.add( dirLight );

    dirLight.castShadow = true;

    dirLight.shadowMapWidth = 2048;
    dirLight.shadowMapHeight = 2048;

    var d = 50;

    dirLight.shadowCameraLeft = -d;
    dirLight.shadowCameraRight = d;
    dirLight.shadowCameraTop = d;
    dirLight.shadowCameraBottom = -d;

    dirLight.shadowCameraFar = 3500;
    dirLight.shadowBias = -0.0001;
    //dirLight.shadowCameraVisible = true;

    // GROUND
    var groundGeo = new THREE.PlaneBufferGeometry( 10000, 10000 );
    var groundMat = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x050505 } );
    groundMat.color.setHSL( 0.095, 1, 0.75 );

    var ground = new THREE.Mesh( groundGeo, groundMat );
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -33;
    scene.add( ground );

    ground.receiveShadow = true;

    // SKYDOME
    var vertexShader = document.getElementById( 'vertexShader' ).textContent;
    var fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
    var uniforms = {
        topColor:    { type: "c", value: new THREE.Color( 0x0077ff ) },
        bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
        offset:      { type: "f", value: 33 },
        exponent:    { type: "f", value: 0.6 }
    };
    uniforms.topColor.value.copy( hemiLight.color );

    scene.fog.color.copy( uniforms.bottomColor.value );

    var skyGeo = new THREE.SphereGeometry( 4000, 32, 15 );
    var skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide } );

    var sky = new THREE.Mesh( skyGeo, skyMat );
    scene.add( sky );


    geometry = new THREE.IcosahedronGeometry( 15, 1 );
    var material = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, shininess: 20, morphTargets: true, vertexColors: THREE.FaceColors, shading: THREE.FlatShading } );
    icoMesh = new THREE.Mesh( geometry, material );

    icoMesh.position.set(0,0,-10);

    icoMesh.castShadow = true;
    icoMesh.receiveShadow = true;
    scene.add( icoMesh );

    // RENDERER
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( scene.fog.color );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.cullFace = THREE.CullFaceBack;

    window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

/**
* ANIMATION
*/
function animate() {
        requestAnimationFrame( animate );

        icoMesh.rotation.y += 0.01;
        icoMesh.rotation.x += 0.01;

        render();
}

/**
* RENDERER
*/
function render() {
        var delta = clock.getDelta();

        controls.update( delta );
        
        renderer.render( scene, camera );
}
