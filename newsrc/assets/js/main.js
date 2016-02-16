var gui, blocks;
var camera, scene, controls, renderer, dirLight, hemiLight;
var clock = new THREE.Clock();

init();
animate();
function init() {
	//Setup GUI
	gui = new DAT.GUI({ height: 3*32-1});
	blocks = {blocks: 50};
	gui.add(blocks, 'blocks');

	//Setup camera
	container = document.getElementById( 'container' );
	camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 5000 );
	camera.position.set( 0, 1.8, 10 );

	//Setup the scene
	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer( { antialias: false } );
	renderer.setClearColor( scene.fog.color );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.cullFace = THREE.CullFaceBack;
	window.addEventListener( 'resize', onWindowResize, false );
	renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
	renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
	renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate(){
	requestAnimationFrame( animate );
	render();
}

function render(){
	var delta = clock.getDelta();
	scene.simulate(); // run physics
	controls.update( delta );
	renderer.render( scene, camera );
}

/*
** FUNCTIONS
*/
function calculateForces(particles, parameters){
	for(idx = 0; idx < particles.length; idx++){
		particles(idx).force = 0;
    	var density = 0;
    	for(jdx = 0; jdx < particles.length; jdx++){
    		var relativePosition = particles(idx).position - particles(jdx).position;
    		density = density + parameters.mass * Wpoly6(relativePosition, parameters.kernelSize);
    	}
    	particles(idx).density = density;
	}
}


/*
** KERNELS
**/
//SMOOTHING KERNEL
function Wpoly6(r, h){
	var radius = r.normalize();
	if (radius < h && radius >= 0){
		var w = (315/(64*pi*h^9)) * (h^2 - radius^2)^3;
	}
	else{
		var w = 0;
	}
	return w;
}

function gradWpoly6(r, h){
	var radius = r.normalize();

	if (radius < h && radius >= 0) {
		var gradient = - ((315/(64*pi*h^9)) * 6 * (h^2 - radius^2)^2) * r;
	}
	else{
		gradient = zeros(1, length(r));
	}
}
