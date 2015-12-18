(function () {

	// setup
	var width = 500;
	var height = 500;

	// renderer
	// NOTE: +x is right, +y is up, +z points out of the screen
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);
	renderer.setClearColor(new THREE.Color(0.1, 0.05, 0.07))
	renderer.shadowMap.enabled = true;

	document.body.appendChild(renderer.domElement);

	// scene
	var scene = new THREE.Scene();

	// light - sky and ground
	var worldLight = new THREE.HemisphereLight(0x66ccff , 0xf0aa00, 0.5);
	scene.add(worldLight)

	// light - spot
	var spotLight = new THREE.SpotLight(0xffffff, 0.6, 0, toRad(60), 10.0);
	scene.add(spotLight);
	spotLight.castShadow = true;
	spotLight.shadowDarkness = 1.0;
	spotLight.shadowCameraNear = 30;
	spotLight.shadowCameraFar = 100;
	spotLight.shadowCameraFov = toDeg(spotLight.angle);
	spotLight.position.set(10, 35, 0);

	// camera
	var camera = new THREE.PerspectiveCamera(60, width/height, 0.1, 1000);
	camera.position.set(0, 60, 20);
	camera.lookAt(new THREE.Vector3(0,0,2));

    var maxBlobs = 20;
    var maxBullets = 20;
	// floor plane
	var arenaStepsDepth = 12;
	var arenaStepsCirc = 18;

	var arenaSize = 20;
	var arenaDepth = arenaStepsDepth * 5;
	var floorGeom = new THREE.CircleGeometry(arenaSize, 64);
	var floor = new THREE.Mesh(floorGeom, makeMaterial({color:0x009f2f, shininess:1}));
	//scene.add(floor);
	floor.receiveShadow = true;
	floor.rotation.x = -toRad(90);

	// controller utility object
	var controller = new Controller(standardControls);

	/*controller.onPressed = function(control) {
		if(control.pressed && 0 == controller.buttons[control.button]) {
		    if(control.which == "left") {
			    thing.moveLeft();
			}
			if(control.which == "right") {
				thing.moveRight();
			}
		}
	};*/

	// game objects
	var rotFriction = 0.95;
	var moveFriction = 0.98;

    function Round(pos, max, steps) {
    	return Math.floor(pos * steps) * max / steps;
    }

	// ---------------------------------------------
	// playable "character"
	function Thing() {

		// thing geometry parts
		var thingSpec = {
			parts: [
				{ 
					shape: { type:"sphere", r:0.6 },
				},
				{ 
					shape: { type:"sphere", r:0.3 },
					position: { x:-0.2, y:0.3, z:0.3 },
				},
				{ 
					shape: { type:"sphere", r:0.25 },
					position: { x:0.2, y:0.3, z:0.3 },
				},
				{ 
					shape: { type: "cylinder", r1:0.1, r2:0.4, h:1.0 },
					position: { x:0, y:0.0, z:0.6 },
					rotation: { x:90, y:0, z:0 }
				},
				{ 
					shape: { type: "box", w:1.0, h:0.1, d:0.5 },
					position: { x:0.9, y:0, z:-0.2 },
					rotation: { x:0, y:20, z:-10 }
				},
				{ 
					shape: { type: "box", w:1.0, h:0.1, d:0.5 },
					position: { x:-0.9, y:0, z:-0.2 },
					rotation: { x:0, y:-20, z:10 }
				},
				{ 
					shape: { type: "box", w:0.1, h:1.0, d:1.2 },
					position: { x:0, y:0.2, z:-0.3 },
					rotation: { x:30, y:0, z:0 }
				}
			]
		};
		// create mesh
		var thingGeom = makeGeometry(thingSpec);
		thingGeom.scale(5, 5, 5);
		this.mesh = new THREE.Mesh(thingGeom, makeMaterial({color:0xffffff}));
		this.mesh.castShadow = true;

		// constants
		var thingRotMass = 5;
		var thingMass = 50;

		// motion variables
		this.angle = 180;
		this.angularVel = 0;
		this.vel = new THREE.Vector3(0,0,0);

		// position var
		this.posAngle = 0;

		// initialise function
		this.init = function() {
			scene.add(this.mesh);
			this.mesh.position.set(0, 1, arenaSize);
		}

		this.moveLeft = function() {
			this.posAngle -= 360 / arenaStepsCirc;
		}

		this.moveRight = function() {
			this.posAngle += 360 / arenaStepsCirc;
		}

		this.setPos = function() {
			var loc = new THREE.Vector3(0,1,arenaSize + 10);
			this.discretePosAngle = Round(this.posAngle / 360, 360, arenaStepsCirc);
			loc.applyEuler(new THREE.Euler( 0, toRad(this.discretePosAngle), 0, 'XYZ' ));
			this.mesh.position.copy(loc);
		}

		// updates movements
		this.update = function(state, t, dt) {

			// update angl
			var rotForce = controller.rightLeft();

			//var rotAccel = rotForce / thingRotMass;

			//this.angularVel += rotAccel;

			//this.angle -= this.angularVel;	
			//this.mesh.rotation.y = toRad(-this.angle);

			//this.angularVel *= rotFriction; // simulated friction


			// update position
			//var force = getForwardVector(this.mesh);
			//force.multiplyScalar(controller.forwardBack());

			// Keep it inside the circle
			/*var outBy = this.mesh.position.length() > arenaSize;
			if (outBy > 0)
			{
				var pushBack = this.mesh.position.clone();
				pushBack.y = 0;
				pushBack.negate();
				//pushBack.normalize();
				force.add(pushBack);
			}*/

			//var acceleration = force.clone();
			//acceleration.divideScalar(thingMass);

			//this.vel.add(acceleration);
			//this.mesh.position.add(this.vel);

			if (rotForce < 0) {
				this.angularVel = -2;
			} else if (rotForce > 0) {
				this.angularVel = 2;
			} else {
				this.angularVel = 0;
			}

			this.posAngle += this.angularVel;
			if (this.posAngle > 180) {
				this.posAngle -= 360;
			}
			if (this.posAngle < -180) {
				this.posAngle += 360;
			}

			this.setPos();

			this.mesh.lookAt(new THREE.Vector3(0, -arenaDepth/10, 0));

			this.vel.multiplyScalar(moveFriction);
		}
	};

    function Bullet() {

    	function makeBulletGeom(r1, r2, h) {
			var bulletSpec = { parts:[] };
			
				bulletSpec.parts.push(
				{
					shape: {
						type: "cylinder", 
					    r1:r1,
					    r2:r2,
					    h: h
					 },
					position: { x:0, y:0, z:0 }
				});
			
			return makeGeometry(bulletSpec);
    	}

    	var bulletGeom = makeBulletGeom(0.5, 0.8, 10);
    	bulletGeom.rotateX(toRad(-35));
    	bulletGeom.translate(0, 15, -2);
		bulletGeom.computeBoundingSphere();
		this.mesh = new THREE.Mesh(bulletGeom, makeMaterial({color:0xffff00}));

 

    	this.init = function(position, rotation, discretePosAngle) {
			this.mesh.position.copy(position);
			this.mesh.rotation.copy(rotation);
			this.discretePosAngle = discretePosAngle;
			this.setVel();
			bullets.push(this);
			scene.add(this.mesh);
		};

		this.setVel = function() {
			var discreteRadialPos = Round(thing.posAngle, arenaSize, arenaStepsDepth) / arenaSize;

			var discreteAngularPos = Round(thing.posAngle / 360, 360, arenaStepsCirc);

			var edge = new THREE.Vector3(0, 0, arenaSize);
			edge.applyEuler(new THREE.Euler(0, toRad(discreteAngularPos), 0, 'XYZ'));

			var deepEdge = new THREE.Vector3(0, 0, 10);
            deepEdge.applyEuler(new THREE.Euler(0, toRad(discreteAngularPos), 0, 'XYZ'));
        
			var deepOrigin = new THREE.Vector3(0, -arenaDepth, 0);
			deepOrigin.add(deepEdge);
			//var deepOrigin = new THREE.Vector3(0, -arenaDepth, 0);

			var direction = edge.sub(deepOrigin);

			direction.negate();

			direction.multiplyScalar(0.1);

			this.vel = direction;
		}

		this.destroy = function() {
			var indexToRemove;
			bullets.forEach(function (bullet, index) {
				if (bullet == this) {
					indexToRemove = index;
				}
			}.bind(this));
			bullets.splice(indexToRemove, 1);
			scene.remove(this.mesh);
		}

    	this.update = function() {
			this.mesh.position.add(this.vel);

			if(this.mesh.position.y < -arenaDepth - 20) {
				this.destroy();
			}
    	}

    	this.active = function() {
			return this.mesh.visible;
		}

		this.hide = function() {
			this.mesh.visible = false;
		}

		this.collidesWith = function(other) {
			var d = this.mesh.position.distanceTo(other.mesh.position);
			return (d < this.mesh.geometry.boundingSphere.radius);
		}
    };

	// ---------------------------------------------
	// blobs
	function Blob() {

		function makeBlobGeom(num, mns, mxs, spr) {
			var blobSpec = { parts:[] };
			for (var i = 0; i<num; i++) {
				blobSpec.parts.push(
				{
					shape: { type: "sphere", r:rand(mns,mxs) },
					position: { x:rand(-spr,spr), y:rand(-spr,spr), z:rand(-spr,spr) }
				});
			}
			return makeGeometry(blobSpec);
		}

		// create mesh
		var blobGeom = makeBlobGeom(10, 1, 4, 3);
		blobGeom.computeBoundingSphere();
		this.mesh = new THREE.Mesh(blobGeom, makeMaterial({color:0xffff00}));
		this.mesh.castShadow = true;

		var mass = 100;

		this.angle = 0;
		this.angularVel = 0;
		this.vel = new THREE.Vector3(0,0,0);
		var maxForce = 1.0;

		this.angularPos = 0;
		this.radialPos = 0;
        this.radialVel = 0.002;

		// initialise function
		this.init = function() {
			scene.add(this.mesh);
			this.mesh.visible = false;
		}

		this.placeRandomly = function(spread) {
			this.angularPos = Round(rand(-180, 180) / 360, 360, arenaStepsCirc);
			this.angularVel = 0;
			this.radialPos = 0;
			this.radialVel = 0.002;

			this.setPos();
			this.mesh.visible = true;
		}

		// updates movements
		this.update = function() {

			// update angle
			//this.angle -= this.angularVel;
			this.mesh.rotation.y = toRad(this.angle);

			// update position
			/*var force = new THREE.Vector3(rand(-maxForce,maxForce), 
										  0, 
										  rand(-maxForce,maxForce));*/

			// Keep it inside the circle
			if (this.radialPos >= 1) {
				this.radialVel = 0;
			

				var angleDiff = thing.posAngle - this.angularPos;
				if (angleDiff > 180) {
					angleDiff -= 360;
				}
				if(angleDiff < -180) {
					angleDiff += 360;
				}
				if (angleDiff > 0) {
					this.angularVel = 0.1
				} else {
					this.angularVel = -0.1;
				}

			}

			this.angularPos += this.angularVel;
			if(this.angularPos > 180) {
				this.angularPos -= 360;
			}
			if(this.angularPos < -180) {
				this.angularPos += 360;
			}

			//var acceleration = force.clone();
			//acceleration.divideScalar(mass);

			//this.vel.add(acceleration);
			this.radialPos += this.radialVel;

			this.setPos();

			//this.vel.multiplyScalar(moveFriction);
		}

		this.setPos = function() {
			var discreteRadialPos = Round(this.radialPos, arenaSize, arenaStepsDepth) / arenaSize;

			this.discretePosAngle = Round(this.angularPos / 360, 360, arenaStepsCirc);

			var edge = new THREE.Vector3(0, 0, arenaSize);
			edge.applyEuler(new THREE.Euler(0, toRad(this.discretePosAngle), 0, 'XYZ'));

            var deepEdge = new THREE.Vector3(0, 0, 10);
            deepEdge.applyEuler(new THREE.Euler(0, toRad(this.discretePosAngle), 0, 'XYZ'));
        
			var deepOrigin = new THREE.Vector3(0, -arenaDepth, 0);
			deepOrigin.add(deepEdge);

			var direction = edge.sub(deepOrigin);
			deepOrigin.addScaledVector(direction, discreteRadialPos);

			this.mesh.position.copy(deepOrigin);
			
			//this.mesh.position.add(pos);
		}

		this.active = function() {
			return this.mesh.visible;
		}

		this.hide = function() {
			this.mesh.visible = false;
		}

		this.collidesWith = function(other) {
			var d = this.mesh.position.distanceTo(other.mesh.position);
			return (d < this.mesh.geometry.boundingSphere.radius);
		}

	}

	// ---------------------------------------------
	// gun
	function Gun() {
		var OVERHEAT = 10;
		var gunGeom = new THREE.SphereGeometry(0.1, 32, 32);

		this.mesh = new THREE.Mesh(gunGeom, makeMaterial({color: 0xAAffff}));

		this.attachTo = function(owner) {
			owner.mesh.add(this.mesh);
		};

		this.fire = function() {
			var bullet;

			if (this.overheat > 0) {
				return;
			}

			bullet = new Bullet();
			bullet.init(this.mesh.parent.position, this.mesh.parent.rotation, thing.discretePosAngle);
			bullet.visible = true;
			bullets.push(bullet);

			this.overheat = OVERHEAT;

		};

		this.removeFrom = function(owner) {
			owner.mesh.remove(this.mesh);
		};

		this.init = function () {
			//scene.add(this.mesh);
		};

		this.update = function () {
			this.overheat -= 1;
			if (controller.isButtonPressed(4)) {
				this.fire();
			}
		};
	}

	// ---------------------------------------------

	// create and initialise our thing
	var thing = new Thing();
	thing.init();

	// Create and attach gun
	var gun = new Gun();
	gun.attachTo(thing);
	gun.init();

	// create and initialise blobs
	function createBlobs(num) {
		var blobs = [];
		for (var i = 0; i< num; i++) {
			var blob = new Blob();
			blob.init();
			blobs.push(blob);
		}
		return blobs;
	}

	function placeBlobs() {
		blobs.forEach( function(blob) { 
			blob.placeRandomly(arenaSize / 2); 
		});
	}

	function addBlob() {
		for (var i = 0; i < blobs.length; i++) {
			if(!blobs[i].active()) {
				blobs[i].placeRandomly();
				return;
			}
		}
		if(blobs.length < maxBlobs) {
		    var b = new Blob();
		    b.init();
		    blobs.push(b);
		}
	}

	function addBullet(pos, dir) {
        for (var i = 0; i < bullets.length; i++) {
			if(!bullets[i].active()) {
				bullets[i].place(pos, dir);
				return;
			}
		}
		if(bullets.length < maxBullets) {
		    var b = new Bullet();
		    b.init();
		    b.place(pos, dir);
		    bullets.push(b);
		}
	}

	var blobs = createBlobs(1);
	placeBlobs();

	var bullets = [];


	// ---------------------------------------------
	// main loop
	window.integrate = function update() {

		thing.update();
		gun.update();

		var haveActiveBullets = false;
		bullets.forEach( function(bullet) {
			if (bullet.active()) {
				bullet.update();
				haveActiveBullets = true;
				/*if (bullet.collidesWith(thing)) {
					blob.hide();
				}*/
			}
		});

		var haveActiveBlobs = false;
		blobs.forEach( function(blob) {
			if (blob.active()) {
				blob.update();
				haveActiveBlobs = true;
				if (blob.collidesWith(thing)) {
					blob.hide();
				}

				bullets.forEach(function(bullet) {
					if(bullet.active()) {
						if (bullet.discretePosAngle == blob.discretePosAngle) {
							if((bullet.mesh.position.y+10) <= blob.mesh.position.y) {
						        blob.hide();
						        bullet.destroy();
							}
				    	}
					}
				});
			}
		});
		if (!haveActiveBlobs) {
			placeBlobs();
		}

		if (Math.random() < 0.015) {
			addBlob();
		}
	};

	window.render = function() {
		// update camera
		//camera.lookAt(thing.mesh.position);

		// draw
		renderer.render(scene, camera);
	};
	
}());
