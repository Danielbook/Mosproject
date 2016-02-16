var gui, blocks;
var camera, scene, controls, renderer, dirLight, hemiLight;
var clock = new THREE.Clock();
var particles = Array();
var parameters;

init();
animate();
function init() {
	//Setup GUI
	gui = new DAT.GUI({ height: 3*32-1});
	blocks = {blocks: 50};
	gui.add(blocks, 'blocks');

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

	//Setup camera
	container = document.getElementById( 'container' );
	camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 5000 );
	camera.position.set( 0, 1.8, 10 );

	//Setup the scene
	scene = new THREE.Scene();

	var nmbrOfParticles = 5;

	parameters = new structParameters;
	
	for(var idx = 0; idx < nmbrOfParticles; idx++){
		tempParticle = new structParticle();
		tempParticle.position.set(-0.5+Math.random(), 2*Math.random(), 0);
		tempParticle.velocity.set(0.01*Math.random(), -Math.random(), 0);
		tempParticle.density = 1602;  //DENSITY OF SAND
		tempParticle.displayedParticle.position.set(tempParticle.position.x, tempParticle.position.y, 0);
		scene.add( tempParticle.displayedParticle );
		particles.push(tempParticle);

		// particles[idx] = new structParticle();
	 //    particles[idx].position.set(-0.5+Math.random(), 2*Math.random());
	 //    particles[idx].velocity.set(0.01*Math.random(), -Math.random());
	 //    particles[idx].density = 1602;  //DENSITY OF SAND
	 //    particles[idx].displayedParticle.position.set(particles[idx].position.x, particles[idx].position.y, 0);
		// scene.add( particles[idx].displayedParticle );
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
	var newParticles = calculateForces(particles, parameters);
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
function calculateForces(particles, parameters){
//	console.log(particles);
	for(idx = 0; idx < particles.length; idx++){
		particles[idx].force = 0;
    	var density = 0;
    	for(jdx = 0; jdx < particles.length; jdx++){
    		var relativePosition = particles[idx].position - particles[jdx].position;
    		density = density + parameters.mass * Wpoly6(relativePosition, parameters.kernelSize);
    	}
    	particles[idx].density = density;

	}
	for(idx = 0; idx < particles.length; idx++){
		//console.log(particles[idx].position);
		var iPressure = (particles[idx].density - parameters.restDensity) * parameters.gasConstantK;
		var cs = 0;
	    var n = new THREE.Vector3(0, 0, 0);
	    var laplacianCs = 0;
	    var pressureForce = new THREE.Vector3(0, 0, 0);
	    var viscosityForce = new THREE.Vector3(0, 0, 0);
	    for(jdx = 0; jdx < particles.length; jdx++){
	 		var relativePosition = particles[idx].position - particles[jdx].position;
	 		//Calculate particle j's pressure force on i
	 		var jPressure = (particles[jdx].density - parameters.restDensity) * parameters.gasConstantK;
	 		var pressureForce = pressureForce - parameters.mass * ((iPressure + jPressure)/(2*particles[jdx].density)) * gradWspiky(relativePosition, parameters.kernelSize);
	 		//Calculate particle j's viscosity force on i
        	var viscosityForce = viscosityForce + parameters.viscosityConstant * parameters.mass * ((particles[jdx].velocity - particles[idx].velocity)/particles[jdx].density) * laplacianWviscosity(relativePosition, parameters.kernelSize);
        	//Calculate "color" for particle j
     		var cs = cs + parameters.mass * (1 / particles[jdx].density) * Wpoly6(relativePosition, parameters.kernelSize);
     		//Calculate gradient of "color" for particle j
        	var n = n + parameters.mass * (1 / particles[jdx].density) * gradWpoly6(relativePosition, parameters.kernelSize);
        	//Calculate laplacian of "color" for particle j
        	var laplacianCs = laplacianCs + parameters.mass * (1 / particles[jdx].density) * laplacianWpoly6(relativePosition, parameters.kernelSize);
	    }

	    if (n.normalize() < parameters.nThreshold){
	        var tensionForce = new THREE.Vector3(0, 0, 0 );
	    }
	    else{
	    	var k = - laplacianCs / n.normalize;
	        var tensionForce = parameters.sigma * k * n;
	    }
	    //Add any external forces on i
	    var externalForce = parameters.gravity;
	    particles[idx].force = pressureForce + viscosityForce + tensionForce + externalForce;
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
	var radius = r.normalize;
	var w = 0;
	if (radius < h && radius >= 0){
		w = (315/(64*pi*h^9)) * (h^2 - radius^2)^3; 
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