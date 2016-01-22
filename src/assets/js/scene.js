var container, stat, clock;

var camera, scene, controls, renderer;

var group, text, plane;

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
    camera.position.z = 5;
    camera.position.y = 3;

    scene = new THREE.Scene();
    clock = new THREE.Clock();

    controls = new THREE.FlyControls( camera );
		controls.movementSpeed = 10;
		controls.domElement = container;
		controls.rollSpeed = Math.PI / 24;
		controls.autoForward = false;
		controls.dragToLook = false;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    var geometry = new THREE.PlaneGeometry( 30, 30);
    var material = new THREE.MeshBasicMaterial( { color: 0xBCAF46 } );
    var plane = new THREE.Mesh( geometry, material );
    scene.add( plane );

    plane.rotation.x = -90;

    geometry = new THREE.IcosahedronGeometry( 3, 1 );
    material = new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true } );
    var ico = new THREE.Mesh( geometry, material );
    scene.add( ico );

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
        var delta = clock.getDelta();

        controls.update( delta );
        renderer.render( scene, camera );
}
