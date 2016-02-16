var gui, blocks;
var camera, scene, controls, renderer, dirLight, hemiLight;
var clock = new THREE.Clock();
var particles = [];
var parameters;
var FPS = 30;

/*
** CONSTRUCTORS
*/
var structParticle = function(){
	this.density = 0;
	this.position = new THREE.Vector3(0, 0, 0);
	this.velocity = new THREE.Vector3(0, 0, 0);
	this.pressure = 0;
	this.force = new THREE.Vector3(0, 0, 0);
	this.cs = 0;
	this.geo = new THREE.BoxGeometry( 0.3, 0.3, 0.3 );
	this.mat = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
	this.displayedParticle = new THREE.Mesh( this.geo, this.mat );
}

var structParameters = function(){
	this.dt = 1 / FPS;
    this.mass = 0.8;
    this.kernelSize = 0.5;
    this.gasConstantK = 1;
    this.viscosityConstant = 30;
    this.restDensity = 30;
    this.sigma = 72e-3;
    this.nThreshold = 0.02;
    this.gravity = new THREE.Vector3(0, -9.82, 0);
    this.leftBound = -2;
    this.rightBound = 2;
    this.bottomBound = 0;
    this.topBound = 5;
    this.wallDamper = 0.005;
}

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

	var nmbrOfParticles = 5;

	parameters = new structParameters();
	
	for(var idx = 0; idx < nmbrOfParticles; idx++){
		particles[idx] = new structParticle();
	    particles[idx].position = new THREE.Vector3(-0.5+Math.random(), 2*Math.random(), 0);
	    particles[idx].velocity = new THREE.Vector3(0.01*Math.random(), -Math.random(), 0);
	    particles[idx].density = 1602;  //DENSITY OF SAND
	    particles[idx].displayedParticle.position.set(particles[idx].position.x, particles[idx].position.y, 0);
		scene.add( particles[idx].displayedParticle );
	}

	renderer = new THREE.WebGLRenderer( { antialias: false } );
	renderer.setClearColor( 0xBC9C63 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.cullFace = THREE.CullFaceBack;
	window.addEventListener( 'resize', onWindowResize, false );
	//renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
	//renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
	//renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate(){
	requestAnimationFrame( animate );
	var newParticles = calculateForces();
	var newParticles = performTimestep(newParticles, parameters.dt);

	for(var idx = 0; idx < particles.length; idx++){
		particles[idx].displayedParticle.position.set(newParticles[idx].position);
	}

	render();
}

function render(){
	var delta = clock.getDelta();
	renderer.render( scene, camera );
}

/*
** FUNCTIONS
*/
function calculateForces(){
//	console.log(particles);
	var relativePosition = new THREE.Vector3();
	for(idx = 0; idx < particles.length; idx++){
		particles[idx].force = 0;
    	var density = 0;
    	for(jdx = 0; jdx < particles.length; jdx++){
    		relativePosition.subVectors( particles[idx].position, particles[jdx].position );
    		var gradient = Wpoly6( relativePosition, parameters.kernelSize )
    		density += parameters.mass * gradient;
    	}
    	particles[idx].density = density;

	}
	for(idx = 0; idx < particles.length; idx++){
		//console.log(particles[idx].position);
		var iPressure = (particles[idx].density - parameters.restDensity) * parameters.gasConstantK;
		var cs = 0;
	    var n = new THREE.Vector3();
	    var laplacianCs = 0;
	    var tempVec = new THREE.Vector3();
	    var tempVec2 = new THREE.Vector3();
	    var pressureForce = new THREE.Vector3(0, 0, 0);
	    var tensionForce = new THREE.Vector3(0, 0, 0);
	    var viscosityForce = new THREE.Vector3(0, 0, 0);
	    for(jdx = 0; jdx < particles.length; jdx++){
	 		relativePosition.subVectors(particles[idx].position, particles[jdx].position);
	 		//Calculate particle j's pressure force on i
	 		var jPressure = (particles[jdx].density - parameters.restDensity) * parameters.gasConstantK;
	 		//pressureForce = pressureForce - parameters.mass * ((iPressure + jPressure)/(2*particles[jdx].density)) * gradWspiky(relativePosition, parameters.kernelSize) );
			pressureForce.sub(parameters.mass * ((iPressure + jPressure)/(2*particles[jdx].density)) * gradWspiky(relativePosition, parameters.kernelSize) );
	 		//Calculate particle j's viscosity force on i
        	//viscosityForce = viscosityForce + parameters.viscosityConstant * parameters.mass * ((particles[jdx].velocity - particles[idx].velocity)/particles[jdx].density) * laplacianWviscosity(relativePosition, parameters.kernelSize);
        	tempVec.subVectors( particles[jdx].velocity, particles[idx].velocity );
        	tempVec.divideScalar( particles[jdx].density );
        	tempVec.multiplyScalar( parameters.viscosityConstant * parameters.mass * laplacianWviscosity(relativePosition, parameters.kernelSize) );

        	viscosityForce.add(tempVec);

        	//Calculate "color" for particle j
     		cs += parameters.mass * (1 / particles[jdx].density) * Wpoly6(relativePosition, parameters.kernelSize);
     		//Calculate gradient of "color" for particle j
        	n += parameters.mass * (1 / particles[jdx].density) * gradWpoly6(relativePosition, parameters.kernelSize);
        	//Calculate laplacian of "color" for particle j
        	laplacianCs = laplacianCs + parameters.mass * (1 / particles[jdx].density) * laplacianWpoly6(relativePosition, parameters.kernelSize);
	    }

	    if (n.normalize() < parameters.nThreshold){
	        tensionForce = new THREE.Vector3(0, 0, 0);
	    }
	    else{
	    	var k = - laplacianCs / n.normalize;
	    	tempVec.multiplyVectors(k,n);
	        tensionForce = tempVec.multiplyScalar( parameters.sigma );
	    }
	    //Add any external forces on i
	    var externalForce = parameters.gravity;
	    //particles[idx].force = pressureForce + viscosityForce + tensionForce + externalForce;
	    tempVec.addVectors(pressureForce, viscosityForce);
	    tempVec2.addVectors(tensionForce,externalForce);
	    particles[idx].force.addVectors(tempVec,tempVec2);
	}
	var newParticles = particles;
	return newParticles;
}

//Euler time step
function performTimestep(particles, dt){
	for(idx = 0; idx < particles.length; idx++){
		//Perform acceleration integration to receive velocity
	    var velocity = particles[idx].velocity;
	    
	    particles[idx].velocity = velocity + (particles[idx].force / particles[idx].density) * dt;
	    
	    //Perform velocity integration to receive position
	    var position = particles[idx].position;
	    
	    position = position + particles[idx].velocity * dt;
	    particles[idx].position = position;
	}
	//Update to new positions
	var newParticles = particles;
	return newParticles;
}

/*
** KERNELS
**/
//SMOOTHING KERNEL
function Wpoly6(r, h){
	var radius = r;
	radius.normalize();
	var w = 0;
	if (radius.x < h && radius.y < h && radius.z < h){
		w = (315/(64*Math.pi*h^9)) * ((h^2 - radius.x^2)^3 + (h^2 - radius.y^2)^3 +(h^2 - radius.z^2)^3); 
	}
	return w;
}

//SMOOTHING KERNEL
function gradWspiky(r, h){
	var radius = r.normalize;
	var w = 0;
	if (radius < h && radius >= 0){
		w = (15/(pi*h^6)) * (h - radius)^3;
	}
}

//Used for Viscosity force
function laplacianWviscosity(r, h){
	var radius = r.normalize;
	var laplacian = 0;
	if (radius < h && radius >= 0){
		laplacian = (45 / (pi * h^6)) * (h - radius);
	}
	return laplacian;
}

//Used for surface normal (n)
function gradWpoly6(r, h){
	var radius = r.normalize;
	var gradient = 0
	if (radius < h && radius >= 0) {
		gradient = - ((315/(64*pi*h^9)) * 6 * (h^2 - radius^2)^2) * r;
	}
	return gradient;
}

//Used for curvatore of surface (k(cs))
function laplacianWpoly6(r, h){
	var radius = r.normalize;
	var laplacian = 0;
	if (radius < h && radius >= 0){
		laplacian = (315/(64*pi*h^9)) * (24 * radius^2 * (h^2 - radius^2) - 6 * (h^2 - radius^2)^2);
	}
	return laplacian;
}