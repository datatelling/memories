var camera, scene, renderer;
var controls;

var objects = [], annotations = [];

var targets = {
	table: [], category: [], age: [],
	"table-annotations": [], "category-annotations": [], "age-annotations": []
};

var cameraPresets = {};
var sceneWidth = 900;

var layout = 'table';
var activeCard = false;

var memories, categories;

// load memories data
$.get('js/memories.json', function(data) {
	memories = data.memories;
	categories = data.categories;

	init();
	animate();
})

function init() {

	camera = new THREE.PerspectiveCamera( 40, sceneWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 15000;

	scene = new THREE.Scene();

	// process categories data for building annotation layer

	for ( var cat in categories ) {

		// set up html element
		var note = document.createElement( 'div' );
		note.className = 'annotation';
		note.setAttribute('id', cat);
		note.innerHTML = categories[cat].name;

		// set up css 3d properties
		var object = new THREE.CSS3DObject( note );
		object.position.x = Math.random() * 4000 - 2000;
		object.position.y = Math.random() * 4000 - 2000;
		object.position.z = Math.random() * 4000 - 2000;

		object.rotation.x = Math.random() * 2 * 3.14;
		object.rotation.y = Math.random() * 2 * 3.14;

		// add to the scene and keep track of the 3d object
		annotations.push( object );
		scene.add( object );

		// set up positioning for different views and keep track of 
		// each target object
		var object = new THREE.Object3D();
		object.position.x = categories[cat].table.x;
		object.position.y = categories[cat].table.y;
		object.position.z = 0;
		targets['table-annotations'].push( object );

		var object = new THREE.Object3D();
		object.position.x = categories[cat].table.x - 160;
		object.position.y = -100;
		object.position.z = categories[cat].category.z;
		targets['category-annotations'].push( object );

	}


	var categoryTotals = {};

	// process memories data

	for ( var i = 0; i < memories.length; i++ ) {
		var mem = memories[i];

		// check for missing first/last names
		if (!mem.hasOwnProperty('firstName')) mem.firstName = '';
		if (!mem.hasOwnProperty('lastName')) mem.lastName = '';

		// increase category count for building category layout
		if (!categoryTotals.hasOwnProperty(mem.category)) categoryTotals[mem.category] = 0;
		categoryTotals[mem.category] += 1;

		var card = document.createElement( 'div' );
		card.className = 'card';
		card.setAttribute('data-id', i);
		card.style.backgroundColor = 'rgba(' + categories[mem.category].color.join(',') + ',0.75)';

		var callout = document.createElement( 'div' );
		callout.className = 'callout';
		callout.textContent = mem.callout;
		card.appendChild( callout );

		var name = document.createElement( 'div' );
		name.className = 'name';
		// name.innerHTML = mem['firstName'] + ' ' + mem['lastName'];
		if (mem.hasOwnProperty('age')) {
			name.innerHTML = mem['firstName'] + ', ' + mem['age'];
		} else {
			name.innerHTML = mem['firstName'];
		}
		name.style.color = 'rgba(' + categories[mem.category].namecolor.join(',') + ',0.85)';
		card.appendChild( name );

		var object = new THREE.CSS3DObject( card );
		object.position.x = Math.random() * 4000 - 2000;
		object.position.y = Math.random() * 4000 - 2000;
		object.position.z = Math.random() * 4000 - 2000;

		object.rotation.x = Math.random() * 2 * 3.14;
		object.rotation.y = Math.random() * 2 * 3.14;

		scene.add( object );

		card.addEventListener( 'click', function ( event ) {

			if (activeCard) {
			}

			var id = $(this).attr('data-id');
			for (var i = 0; i < objects.length; i++) {
				if (objects[i].id == id) {
					activeCard = id;
					break;
				}
			}

			transformActiveCard( );

			$('#activeCard .callout').text(memories[i].callout);
			$('#activeCard .name').text(memories[i].firstName + ' ' + memories[i].lastName);
			$('#activeCard .text').text(memories[i].text);
			if (memories[i].hasOwnProperty('image')) $('#activeCard .pic').prepend('<img id="theImg" src="' + memories[i].image + '" width="300"/>');

			$('#activeCard').css('background-color', $(this).css('background-color'));
			$('#activeCard').css('top', window.innerHeight);
			$('#activeCard').delay(900).animate({ top:'100px' });

		}, false );

		objects.push( { id: i, object: object });

	}

	// table layout

	var yPos = 0;
	cameraPresets.table = { x: 0, y: 0, z: 4500}

	for ( var i = 0; i < objects.length; i++ ) {

		var object = new THREE.Object3D();
		var xPos = i % 9;
		if (xPos == 0) yPos++;

		object.position.x = (xPos * 400) - 1450;
		object.position.y = - ( yPos * 260 ) + 1550;

		targets.table.push( object );

	}

	// category layout

	cameraPresets.category = { x: -4142, y: 1074, z: 5941 };
	var categoryIndex = {};
	var categoryCount = -1;

	var zMap = {
		'0': 2800,
		'1': 1800,
		'2': 400,
		'3': -1500,
		'4': -3800,
	}

	for ( var i = 0; i < objects.length; i ++ ) {
		var mem = memories[i];
		// var mem = memories[ objects.length - i - 1 ];

		var object = new THREE.Object3D();

		if (!categoryIndex.hasOwnProperty(mem.category)) {
			var data = {
				count: -1,
				index: ++categoryCount
			}
			categoryIndex[mem.category] = data;
		}
		categoryIndex[mem.category].count += 1;

		object.position.x = categoryIndex[mem.category].count % 9  * 400  - 1600;
		object.position.y = Math.floor( categoryIndex[mem.category].count / 9 ) * 260;
		object.position.z = zMap[ categoryIndex[mem.category].index ];

		targets.category.push( object );

	}

	// age layout

	// cameraPresets.age = { x: -4189, y: 1810, z: 5600 };
	// cameraPresets.age = { x: 0, y: 0, z: 10000}
	// cameraPresets.age = { x: 0, y: 1768, z: 7134 }
	cameraPresets.age = { x: -220, y: 2187, z: 6155 }
	var ageIndex = [];
	var ageCount = -1;

	var zMap = {
		'0': -4000,
		'1': -2700,
		'2': -700,
		'3': 1300,
		'4': 2300,
		'5': 3000
	}

	for ( var i = 0; i < objects.length; i ++ ) {
		var mem = memories[i];
		if (!mem.hasOwnProperty('age') || mem.age.length > 1) mem.age = '0';

		// super hacky way of getting rid of the layout gap between years 4 & 6!
		// redo this a better way!
		if (mem.age == '6') mem.age = '5';

		var object = new THREE.Object3D();

		if (!ageIndex.hasOwnProperty(mem.age)) ageIndex[mem.age] = -1;
		ageIndex[mem.age] += 1;

		object.position.x = ( ( ageIndex[mem.age] % 9 ) * 400 ) - 1600;
		object.position.y = ( ( Math.floor( ageIndex[mem.age] / 9 ) ) * 260 ) - 500;
		object.position.z = zMap[ mem.age ];

		targets.age.push( object );

	}

	// console.log(ageIndex)

	//

	renderer = new THREE.CSS3DRenderer({antialias:true});
	renderer.setSize( sceneWidth, window.innerHeight );
	renderer.domElement.style.position = 'absolute';
	renderer.domElement.style.backgroundColor = '#FFF8F0';
	document.getElementById( 'container' ).appendChild( renderer.domElement );

	//

	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.rotateSpeed = 0.5;
	controls.minDistance = -10000;
	controls.maxDistance = 10000;
	controls.noRotate = true;
	controls.altControls = true;
	controls.addEventListener( 'change', render );

	var button = document.getElementById( 'table' );
	button.addEventListener( 'click', function ( event ) {

		layout = 'table';

		transform( targets[layout], 1000 );
		transformAnnotation( targets[layout+'-annotations'], 1000 );
		animateCamera( cameraPresets[layout], 2000 );

		controls.altControls = true;
		controls.noRotate = true;

	}, false );

	var button = document.getElementById( 'category' );
	button.addEventListener( 'click', function ( event ) {

		layout = 'category';

		transform( targets[layout], 1000 );
		transformAnnotation( targets[layout+'-annotations'], 1000 );
		animateCamera( cameraPresets[layout], 2000 );

		controls.altControls = false;
		controls.noRotate = false;

	}, false );

	var button = document.getElementById( 'age' );
	button.addEventListener( 'click', function ( event ) {

		layout = 'age';

		transform( targets[layout], 1000 );
		transformAnnotation( targets[layout+'-annotations'], 1000 );
		animateCamera( cameraPresets[layout], 2000 );

		controls.altControls = false;
		controls.noRotate = false;

	}, false );



	$('#activeCard, #overlay').click(function() {
		$('#activeCard').animate({ top: window.innerHeight }, 200, function() {
			$(card).css('display', 'block');
			transform( targets[layout], 1000 );

			$('#overlay').delay(500).fadeOut();
		});
	})


	transform( targets[layout], 1000 );
	transformAnnotation( targets[layout+'-annotations'], 1000 );
	animateCamera( cameraPresets[layout], 2000 );

	//

	window.addEventListener( 'resize', onWindowResize, false );

}

function transform( targets, duration ) {

	// TWEEN.removeAll();

	for ( var i = 0; i < targets.length; i ++ ) {

		var object = objects[ i ].object;
		var target = targets[ i ];

		new TWEEN.Tween( object.position )
			.to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
			.easing( TWEEN.Easing.Exponential.InOut )
			.start();

		new TWEEN.Tween( object.rotation )
			.to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
			.easing( TWEEN.Easing.Exponential.InOut )
			.start();

	}

	new TWEEN.Tween( this )
		.to( {}, duration * 2 )
		.onUpdate( render )
		.start();

}

function transformAnnotation( targets, duration ) {

	// TWEEN.removeAll();

	for ( var i = 0; i < targets.length; i ++ ) {

		var object = annotations[ i ];
		var target = targets[ i ];

		new TWEEN.Tween( object.position )
			.to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
			.easing( TWEEN.Easing.Exponential.InOut )
			.start();

		new TWEEN.Tween( object.rotation )
			.to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
			.easing( TWEEN.Easing.Exponential.InOut )
			.start();

	}

	new TWEEN.Tween( this )
		.to( {}, duration * 2 )
		.onUpdate( render )
		.start();

}

function transformActiveCard( ) {

	// TWEEN.removeAll();
	var duration = 1000;
	var object = objects[ activeCard ].object;

	new TWEEN.Tween( object.position )
	.to( { x: camera.position.x, y: camera.position.y - 300, z: camera.position.z }, 1000 )
	.easing( TWEEN.Easing.Cubic.InOut )
	.start();

	new TWEEN.Tween( object.rotation )
	// .to( { y: -3.14 }, 1000 )
	.to( { x: 3.14 / 1.5 }, 1000 )
	.easing( TWEEN.Easing.Cubic.InOut )
	.start();

	new TWEEN.Tween( this )
	.to( {}, 1000 * 2 )
	.onUpdate( render )
	.start();

	$('#overlay').delay(500).fadeIn();

}

function animateCamera( position, duration ) {

	new TWEEN.Tween( camera.position )
			.to( position, duration )
			.easing( TWEEN.Easing.Exponential.Out )
			.start();

}

function onWindowResize() {

	camera.aspect = sceneWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( sceneWidth, window.innerHeight );

	render();

}

function animate() {

	requestAnimationFrame( animate );

	TWEEN.update();

	controls.update();

}

function render() {

	renderer.render( scene, camera );

}