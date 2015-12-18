(function () {

	// setup
	var width = 500;
	var height = 500;
	var bgColor = new THREE.Color(0.5, 0.5, 0.7);

	// renderer
	// NOTE: +x is right, +y is up, +z points out of the screen
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);
	renderer.setClearColor(bgColor);
	renderer.shadowMap.enabled = true;

	document.body.appendChild(renderer.domElement);

	// scene
	var scene = new THREE.Scene();
	window.scene = scene;

	// light - sky and ground
	var worldLight = new THREE.HemisphereLight(0x66ccff , 0xf0aa00, 1.0);
	scene.add(worldLight)

	var spotLight = new THREE.SpotLight(0xffffff, 0.6, 0, toRad(60), 20.0);
	scene.add(spotLight);
	spotLight.position.set(10, 20, 0);
	spotLight.castShadow = true;
	spotLight.shadowDarkness = 1.0;

	// camera
	var camera = new THREE.PerspectiveCamera(60, width/height, 0.1, 1000);
	camera.position.set(5, 10, 20);
	camera.lookAt(new THREE.Vector3(0,0,0));

	// floor plane
	var arenaSize = 20;
	var floorGeom = new THREE.PlaneGeometry(arenaSize, arenaSize, 1, 1);
	var floor = new THREE.Mesh(floorGeom, makeMaterial({color:0x009f2f, shininess:1}));
	scene.add(floor);
	floor.rotation.x = -toRad(90);
	var floor2 = new THREE.Mesh(floorGeom, makeMaterial({color:0xffffff, shininess:1}));
	floor2.position.z = -arenaSize/2;
	scene.add(floor2);

	// sphere
	var ballRad = 2;
	var ballGeom = new THREE.SphereGeometry(ballRad, 32, 32);
	var ball = new THREE.Mesh(ballGeom, makeMaterial({color:0xffffff, shininess:1}));
	scene.add(ball);
	ball.position.set(0, 2, 0);

	// ---------------------------------------------
	// main loop
	function update() {

		// draw
		renderer.render(scene, camera);

		// next frame
		requestAnimationFrame(update);

		var r = bgColor.r + 0.1
		if (r > 1.0) {
			r = 0;
		}
		bgColor = new THREE.Color(r, 0.5, 0.7);
		//renderer.setClearColor(bgColor);
	};

	// start updates
	update();
	
}());
