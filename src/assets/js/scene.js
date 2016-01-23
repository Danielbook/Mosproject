var container, stat;

var camera, scene, controls, renderer;

var group, text, plane;

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
    camera.position.z = 5;
    camera.position.y = 3;

    scene = new THREE.Scene();

    controls = new THREE.TrackballControls( camera );
		controls.rotateSpeed = 1.0;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 0.8;
		controls.noZoom = false;
		controls.noPan = false;
		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // var geometry = new THREE.PlaneGeometry( 30, 30);
    // var material = new THREE.MeshBasicMaterial( { color: 0xBCAF46 } );
    // var plane = new THREE.Mesh( geometry, material );
    // scene.add( plane );
    //
    // plane.rotation.x = -90;

    var geometry = new THREE.IcosahedronGeometry( 3, 1 );
    material = new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true } );
    var ico = new THREE.Mesh( geometry, material );
    scene.add( ico );
//---------------------------PARTICLE SYSTEM-------------------------------
    var radius = 2.5;
    var particleCount = 1800000;

    geometry = new THREE.BufferGeometry();
    var positions = new Float32Array( particleCount * 3 );
    var colors = new Float32Array( particleCount * 3 );
    var sizes = new Float32Array( particleCount );
    var color = new THREE.Color();

    for ( var i = 0; i < particleCount; i ++ ) {

      positions[ i*2 + 0 ] = ( Math.random() * 2 - 1 ) * radius; //i*3 gives higher fps BUT unwanted patterns
      positions[ i*2 + 1 ] = ( Math.random() * 2 - 1 ) * radius;
      positions[ i*2 + 2 ] = ( Math.random() * 2 - 1 ) * radius;
      // color.setHSL( i / particleCount, 1.0, 0.5 );
      // colors[ i3 + 0 ] = color.r;
      // colors[ i3 + 1 ] = color.g;
      // colors[ i3 + 2 ] = color.b;
      sizes[ i ] = 20;
    }

    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
    geometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );

    var particleSystem = new THREE.Points( geometry, material );
    scene.add( particleSystem );
    //----------------------------------------------------------------------
    ico.position.y = 3;
    ico.position.z = -10;

    camera.position.z = 5;
    window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {

        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
}

/**
* ANIMATION
*/
function animate() {
        requestAnimationFrame( animate );

        render();
}

/**
* RENDERER
*/
function render() {
        controls.update();
        renderer.render( scene, camera );
}
