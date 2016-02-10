var container;
var camera, scene, controls, renderer, dirLight, hemiLight;
var group;
var objects = [];
var sandMesh;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(), offset = new THREE.Vector3(), INTERSECTED, SELECTED;
var clock = new THREE.Clock();
Physijs.scripts.worker = 'assets/js/physics/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';
init();
animate();
function init() {
	//Setup GUI
	var gui = new DAT.GUI({ height: 3*32-1});
	var blocks = {blocks: 50};
	gui.add(blocks, 'blocks');

	//Setup camera
	container = document.getElementById( 'container' );
	camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 5000 );
	camera.position.set( 0, 1.8, 10 );
	//Setup the scene
	scene = new Physijs.Scene();
	scene.fog = new THREE.Fog( 0xffffff, 1, 5000 );
	scene.fog.color.setHSL( 0.6, 0, 1 );
	//Setup controls
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
	var groundGeo = new THREE.BoxGeometry( 10000, 10000, 0.2 );
	var groundMat = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x050505 } );
	groundMat.color.setHSL( 0.095, 1, 0.75 );
	var ground = new Physijs.BoxMesh( groundGeo, groundMat, 0); // Last argument is mass
	ground.rotation.x = -Math.PI/2;
	ground.position.y = -0.2;
	scene.add( ground );
	ground.receiveShadow = true;
	//Box to contain the sand
	var boxFric = 0.5; // friction
	var boxRes = 0.8; // restitution ( bounciness )
	var geometry = new THREE.BoxGeometry( 5, 0.5, 0.2 );
	var material = Physijs.createMaterial(
		new THREE.MeshBasicMaterial( {color: 0x00ff00} ),
		boxFric,
		boxRes
		);
	var cube1 = new Physijs.BoxMesh( geometry, material, 0);
	var cube2 = new Physijs.BoxMesh( geometry, material, 0);
	var cube3 = new Physijs.BoxMesh( geometry, material, 0);
	var cube4 = new Physijs.BoxMesh( geometry, material, 0);
	cube1.position.set(0,0,-2.5);
	scene.add( cube1 );
	cube2.position.set(0,0,2.5);
	scene.add( cube2 );
	cube3.position.set(2.5,0,0);
	cube3.rotation.y = 1.57079633;
	scene.add( cube3 );
	cube4.position.set(-2.5,0,0);
	cube4.rotation.y = 1.57079633;
	scene.add( cube4 );
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
	//Sand
	geometry = new THREE.BoxGeometry( 1, 1, 1 );
	var sandFri = 0.4;
	var sandRes = 0.9;
	var material = Physijs.createMaterial(
	//new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, shininess: 20, morphTargets: true, vertexColors: THREE.FaceColors, shading: THREE.FlatShading }),
	new THREE.MeshBasicMaterial( { color:0xBC211F } ),
	sandFri,
	sandRes
	);
	//particles = new THREE.Points( geometry, materials[i] );
	for(var i = 1; i < 100; i += 0.1){
		sandMesh = new THREE.Points( geometry, material );
		sandMesh.position.set(Math.random()*4-2,Math.random(),Math.random()*4-2);
		sandMesh.rotation.x = Math.random();
		sandMesh.rotation.y = Math.random();
		sandMesh.rotation.z = Math.random();
		//sandMesh.castShadow = true;
		//sandMesh.receiveShadow = true;
		scene.add( sandMesh );
		objects.push( sandMesh );
	}
	// RENDERER
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
		scene.simulate(); // run physics
		controls.update( delta );
		renderer.render( scene, camera );
	}
function onDocumentMouseMove( event ) {
	event.preventDefault();
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	//
	raycaster.setFromCamera( mouse, camera );
	if ( SELECTED ) {
		var intersects = raycaster.intersectObject( plane );
		if ( intersects.length > 0 ) {
			SELECTED.position.copy( intersects[ 0 ].point.sub( offset ) );
		}
		return;
	}
	var intersects = raycaster.intersectObjects( objects );
	if ( intersects.length > 0 ) {
		if ( INTERSECTED != intersects[ 0 ].object ) {
			if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
			INTERSECTED = intersects[ 0 ].object;
			INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
			plane.position.copy( INTERSECTED.position );
			plane.lookAt( camera.position );
		}
		container.style.cursor = 'pointer';
	} else {
		if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
		INTERSECTED = null;
		container.style.cursor = 'auto';
	}
}
function onDocumentMouseDown( event ) {
	event.preventDefault();
	raycaster.setFromCamera( mouse, camera );
	var intersects = raycaster.intersectObjects( objects );
	if ( intersects.length > 0 ) {
		controls.enabled = false;
		SELECTED = intersects[ 0 ].object;
		var intersects = raycaster.intersectObject( plane );
		if ( intersects.length > 0 ) {
			offset.copy( intersects[ 0 ].point ).sub( plane.position );
		}
		container.style.cursor = 'move';
	}
}
function onDocumentMouseUp( event ) {
	event.preventDefault();
	controls.enabled = true;
	if ( INTERSECTED ) {
		plane.position.copy( INTERSECTED.position );
		SELECTED = null;
	}
	container.style.cursor = 'auto';
}
