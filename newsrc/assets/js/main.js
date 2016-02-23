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
	this.geo = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
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
	this.sigma = 0.0072;
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

	var nmbrOfParticles = 10;

	parameters = new structParameters();

	for(var idx = 0; idx < nmbrOfParticles; idx++){
		particles[idx] = new structParticle();
		particles[idx].position = new THREE.Vector3(-0.5+Math.random(), 2*Math.random(), 0);
		particles[idx].velocity = new THREE.Vector3(0.01*Math.random(), -Math.random(), 0);
    particles[idx].density = 1602;  //DENSITY OF SAND
    particles[idx].displayedParticle.position.set( particles[idx].position.x, particles[idx].position.y, 0 );
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
	render();
	for(var idx = 0; idx < particles.length; idx++){
		console.log( particles[idx].displayedParticle.position );
	}
	requestAnimationFrame( animate );
	var newParticles = calculateForces();
	var newParticles = performTimestep(newParticles, parameters.dt);

	for(var idx = 0; idx < particles.length; idx++){
		particles[idx].displayedParticle.position.setX(newParticles[idx].position.x);
		particles[idx].displayedParticle.position.setY(newParticles[idx].position.y);
		particles[idx].displayedParticle.position.setZ(newParticles[idx].position.z);
	}
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

   //Fram till hit fungerar koden som den ska.

 }
 for(idx = 0; idx < particles.length; idx++){
		//console.log(particles[idx].position);
		var iPressure = (particles[idx].density - parameters.restDensity) * parameters.gasConstantK;
		var cs = 0;
		var n = new THREE.Vector3(0, 0, 0);
		var laplacianCs = 0;
		var tempVec = new THREE.Vector3(0, 0, 0);
		var tempVec2 = new THREE.Vector3(0, 0, 0);
		var tempVec3 = new THREE.Vector3(0, 0, 0);
		var pressureForce = new THREE.Vector3(0, 0, 0);
		var tensionForce = new THREE.Vector3(0, 0, 0);
		var viscosityForce = new THREE.Vector3(0, 0, 0);
		for(jdx = 0; jdx < particles.length; jdx++){
    	//console.log("idx = ", idx, "= ", particles[idx].position);	 //skriv ut idx
    	//console.log("jdx = ", jdx, "= ", particles[jdx].position);     //skriv ut jdx
    	relativePosition.subVectors(particles[idx].position, particles[jdx].position);
	 		//console.log(relativePosition);

	 		//Calculate particle j's pressure force on i
	 		var jPressure = (particles[jdx].density - parameters.restDensity) * parameters.gasConstantK;
	 		//pressureForce = pressureForce - parameters.mass * ((iPressure + jPressure)/(2*particles[jdx].density)) * gradWspiky(relativePosition, parameters.kernelSize) );
	 		pressureForce.addScalar(-parameters.mass * ((iPressure + jPressure)/(2*particles[jdx].density)) * gradWspiky(relativePosition, parameters.kernelSize) );
	 		
	 		//Calculate particle j's viscosity force on i
    	//viscosityForce = viscosityForce + parameters.viscosityConstant * parameters.mass * ((particles[jdx].velocity - particles[idx].velocity)/particles[jdx].density) * laplacianWviscosity(relativePosition, parameters.kernelSize);
    	tempVec.subVectors( particles[jdx].velocity, particles[idx].velocity );
    	tempVec.divideScalar( particles[jdx].density );
    	tempVec.multiplyScalar( parameters.viscosityConstant * parameters.mass * laplacianWviscosity(relativePosition, parameters.kernelSize) );

    	viscosityForce.add(tempVec);
    	//console.log(viscosityForce);

    	//Calculate "color" for particle j
    	cs += parameters.mass * (1 / particles[jdx].density) * Wpoly6(relativePosition, parameters.kernelSize);
   		//Calculate gradient of "color" for particle j
   		//n += parameters.mass * (1 / particles[jdx].density) * gradWpoly6(relativePosition, parameters.kernelSize);
   		n.addScalar(parameters.mass * (1 / particles[jdx].density) * gradWpoly6(relativePosition, parameters.kernelSize) );
      	//Calculate laplacian of "color" for particle j
      	laplacianCs = laplacianCs + parameters.mass * (1 / particles[jdx].density) * laplacianWpoly6(relativePosition, parameters.kernelSize);
      }

      if (n.normalize() < parameters.nThreshold){
      	tensionForce = new THREE.Vector3(0, 0, 0);
      }
      else{
      	var k = n.normalize().divideScalar(-laplacianCs);
      	tempVec.multiplyVectors(k,n);
      	tensionForce = tempVec.multiplyScalar( parameters.sigma );
  }
	    //Add any external forces on particle i
	    var externalForce = parameters.gravity;
	    //particles[idx].force = pressureForce + viscosityForce + tensionForce + externalForce;
	    tempVec.addVectors(pressureForce, viscosityForce);
	    
	    //console.log("viscosity: ", viscosityForce);	//inte NaN första varvet 
	    //console.log("pressure: ", pressureForce);		//inte NaN första varvet
	    //console.log("tempVec: ", tempVec);			//inte NaN första varvet
	    
	    tempVec2.addVectors(tensionForce, externalForce);
	    //console.log("tempVec2: ", tempVec2);		//inte NaN
	    tempVec3.addVectors(tempVec, tempVec2);
	    //console.log("tempVec3: ", tempVec3);		//inte NaN
	    particles[idx].force = tempVec3;
	    
	  }
	  var newParticles = particles;
	  return newParticles;
	}

//Euler time step
function performTimestep(particles, dt){
	for(idx = 0; idx < particles.length; idx++){
		//Perform acceleration integration to receive velocity
		var velocity = particles[idx].velocity;
	    var tempVec = new THREE.Vector3();		//!! declare new vector
	    var TempVec1 = new THREE.Vector3();
	    
	    //vektorer: particles[idx].velocuty, particles[idx].force
	    //skalärer: velocity, particles[idx].density, dt
	    //particles[idx].velocity = velocity + (particles[idx].force / particles[idx].density) * dt;
	    
	    //console.log("tempVec = ", tempVec);					//aldrig NaN 
	    //console.log("density = ", particles[idx].density);	//aldrig NaN 
	    //console.log("force = ", particles[idx].force); 		    //inte NaN första varvet

	    tempVec = particles[idx].force.divideScalar(particles[idx].density);
	    //console.log("tempVec: ", tempVec);		
	    tempVec.multiplyScalar(dt);
	    //console.log("velocity: ", velocity);
	    tempVec.add(velocity);					 //VI HITTADE FELET!! addScalar --> add
	    particles[idx].velocity = tempVec; 

	    //Perform velocity integration to receive position
	    var position = particles[idx].position;
	    
	    //vektor = particles[].velocity
	    //skalär = position, dt
	    //position = position + particles[idx].velocity * dt;
	    //particles[idx].position = position;
	    tempVec1 = particles[idx].velocity.multiplyScalar(dt);
	    tempVec1.addVectors(tempVec1, position);
	    particles[idx].position = tempVec1;
	    
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
	if (radius.x < h && radius.y < h && radius.z < h && radius.x >= 0 && radius.y >= 0 && radius.z >= 0){
		w = (15/(Math.pi*h^6)) * ((h - radius.x)^3 + (h - radius.y)^3 + (h - radiusz)^3);
	}
	//console.log("w: ", w);
	return w;	//? ska den returna?

}

//Used for Viscosity force
function laplacianWviscosity(r, h){
	var radius = r.normalize;
	var laplacian = 0;
	if (radius.x < h && radius.y < h && radius.z < h && radius.x >= 0 && radius.y >= 0 && radius.z >= 0){
		laplacian = (45 / (Math.pi * h^6)) * ((h - radius.x) + (h - radius.y) + (h - radius.z));
	}
	return laplacian;
}

//Used for surface normal (n)
function gradWpoly6(r, h){
	var radius = r.normalize;
	var gradient = 0
	if (radius.x < h && radius.y < h && radius.z < h && radius.x >= 0 && radius.y >= 0 && radius.z >= 0){
		gradient = - ((315/(64*Math.pi*h^9)) * 6 * ((h^2 - radius.x^2)^2 + (h^2 - radius.y^2)^2 +(h^2 - radius.z^2)^2)) * r;
	}
	return gradient;
}

//Used for curvatore of surface (k(cs))
function laplacianWpoly6(r, h){
	var radius = r.normalize;
	var laplacian = 0;
	if (radius.x < h && radius.y < h && radius.z < h && radius.x >= 0 && radius.y >= 0 && radius.z >= 0){
		laplacian = (315/(64*Math.pi*h^9)) * (24 * (radius.x^2 + radius.y^2 + radius.z^2) * 
			((h^2 - radius.x^2) + (h^2 - radius.y^2) + (h^2 - radius.z^2))
			- 6 * ((h^2 - radius.x^2) + (h^2 - radius.y^2) + (h^2 - radius.z^2))^2);
	}
	return laplacian;
}