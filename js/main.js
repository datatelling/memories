var camera, scene, renderer;
var controls;

var objects = [], annotations = [];
var spiralPositions = [];

var targets = {
	"table": [],
	"category": [],
	"age": [],
	"table-annotations": [],
	"category-annotations": [],
	"age-annotations": []
};

var cameraPresets = {};
var sceneWidth = 900;

var layout = "table";
var activeCard = false;

var memories, categories, ages;

// load memories data
$.get('js/memories.json', function(data) {
	memories = data.memories;
	categories = data.categories;
	ages = data.ages;

	memories.reverse();

	init();
	animate();
})

function dist(x, y, x0, y0){
    return Math.sqrt((x -= x0) * x + (y -= y0) * y);
};

function init() {

	camera = new THREE.PerspectiveCamera( 40, sceneWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 15000;

	scene = new THREE.Scene();

	// process categories data for building annotation layer for table & categories

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
		callout.textContent = mem.callout.substring(0, 1).toUpperCase() + mem.callout.substring(1);
		card.appendChild( callout );

		if (mem.hasOwnProperty('image')) {
			var icon = document.createElement( 'div' );
			icon.className = 'camera';
			icon.style.color = 'rgba(' + categories[mem.category].namecolor.join(',') + ',0.75)';
			icon.innerHTML = '<i class="icon-camera icon-large"></i>';
			card.appendChild( icon );
		}

		var name = document.createElement( 'div' );
		name.className = 'name';
		if (mem.hasOwnProperty('age'))
			name.innerHTML = mem['firstName'] + ', ' + mem['age'];
		else
			name.innerHTML = mem['firstName'];
		name.style.color = 'rgba(' + categories[mem.category].namecolor.join(',') + ',0.75)';
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

			$('#activeCard .callout').text(memories[i].callout.substring(0, 1).toUpperCase() + memories[i].callout.substring(1));
			$('#activeCard .name').text(memories[i].firstName + ' ' + memories[i].lastName);
			$('#activeCard .text').text(memories[i].text);
			if (memories[i].hasOwnProperty('age'))
				if (memories[i].hasOwnProperty('displayage'))
					if (memories[i].displayage == '1')
						$('#activeCard .age').text(memories[i].displayage + ' year');
					else
						$('#activeCard .age').text(memories[i].displayage + ' years');
				else 
					if (memories[i].age == '1')
						$('#activeCard .age').text(memories[i].age + ' year');
					else
						$('#activeCard .age').text(memories[i].age + ' years');
			else
				$('#activeCard .age').text('');

			$('#activeCard').css('background-color', $(this).css('background-color'));
			$('#activeCard').css('top', window.innerHeight);
			$('#activeCard').delay(900).animate({ top:'100px' });

			if (memories[i].hasOwnProperty('image'))
				$('#activeCard .pic').html( '<img src="' + memories[i].image + '">');
			else
				$('#activeCard .pic').html('');

		}, false );

		objects.push( { id: i, object: object });
	}

		//	Precompute the spiral positions of ages view
 	//
	var PHI = (1.0+Math.sqrt(5.0))/2.0;

	var samples = objects.length+6;
	var minDistBtwSamples= 360+20;	// TODO: make it alogirthmic
 
	var prevX = 0;
	var prevY = 0;

	var angle = 0;
	var radius = 10;
	var depth = 0.;
	while (samples > 0){
  		var X = Math.cos(angle) * radius;
  		var Y = Math.sin(angle) * radius;
  		
  		if(dist(X,Y,prevX,prevY) > minDistBtwSamples){

  			var billboardAngle = angle;

  			if(angle%(Math.PI*2.) >=Math.PI){
  				billboardAngle += Math.PI/2.;	
  			} else {
  				billboardAngle -= Math.PI/2.;
  			}

    		spiralPositions.push({ 	x: X,
    								y: Y,
    								z: depth,
    								a: billboardAngle
    							});
    		prevX = X;
    		prevY = Y;
    		samples--;
    		depth+=10.;
  		}

  		angle += Math.PI/180.;
  		radius += 2.;
	}

	// process age data for building annotation layer for ages

	for ( var i = 0; i < ages.length; i++) {

		if(i>0){
			// set up html element
			var note = document.createElement( 'div' );
			note.className = 'annotation-age';
			note.setAttribute('id', 'age-' + i);
			var indexPos = 16;

			if (i >= 2)
				indexPos += 24+1;

			if (i >= 3)
				indexPos += 35+1;

			if (i >= 4)
				indexPos += 33+1;

			if (i >= 5)
				indexPos += 7+1;

			if (i >= 6)
				indexPos += 2+1;

			if (i <= 4){
				note.innerHTML = i + ' Years';
			} else if (i == 5){
				note.innerHTML = '6 Years';
			} else if (i == 6){
				note.innerHTML = 'Unknown';
			}
				
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
			// object.position.x = 2250;
			// object.position.y = -100;
			// object.position.z = ages[i];

			object.position.x = spiralPositions[indexPos].x;
			object.position.y = spiralPositions[indexPos].y;
			object.position.z = spiralPositions[indexPos].z;
			object.rotation.z = spiralPositions[indexPos].a;

			targets['age-annotations'].push( object );
		}
	}

	// table layout

	var yPos = 15;
	cameraPresets.table = { x: 0, y: 0, z: 4500}

	for ( var i = 0; i < objects.length; i++ ) {

		var object = new THREE.Object3D();
		var xPos = 8 - (i % 9);
		
		object.position.x = (xPos * 400) - 1450;
		object.position.y = - ( yPos * 260 ) + 1550;

		targets.table.push( object );

		if (xPos == 0) yPos--;

	}

	// category layout

	cameraPresets.category = { x: -4142, y: 1074, z: 5941 };
	var categoryIndex = {};
	var categoryCount = -1;

	for ( var i = 0; i < objects.length; i ++ ) {
		var mem = memories[i];

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
		object.position.z = categories[mem.category].category.z;

		targets.category.push( object );

	}

	cameraPresets.age = {x: 579, y: -5403, z: 4258 };

	//	Add the objects according to the positions
	//	
	var offSet = 0;
	for ( var i = 0; i < objects.length; i ++ ) {
		var mem = memories[i];

		// if the memory age is unkown, set it to unknown so it appears in the back
		if (!mem.hasOwnProperty('age')) mem.age = 'unknown';

		// if the age is a range, like 2-3, just use the first number
		if (mem.age.length > 1) mem.age = mem.age.substring(0, 1);

		// super hacky way of getting rid of the layout gap between years 4 & 6!
		// redo this a better way! this just changes the index of the lookup table
		// for find the z position
		if (mem.age == '6') mem.age = '5';
		if (mem.age == 'u') mem.age = '6'; // 'unknown' gets shortened to 'u' above

		var object = new THREE.Object3D();

		var index = parseInt(mem.agesort) + parseInt(mem.age);
		object.position.x = spiralPositions[index].x;
		object.position.y = spiralPositions[index].y;
		object.position.z = spiralPositions[index].z;
		object.rotation.z = spiralPositions[index].a;

		targets.age.push( object );
	}


	//

	renderer = new THREE.CSS3DRenderer({antialias:true});
	renderer.setSize( sceneWidth, window.innerHeight );
	renderer.domElement.style.position = 'absolute';
	renderer.domElement.style.backgroundColor = '#FFF8F0';
	// renderer.domElement.style.backgroundColor = 'black';
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
		transformAnnotations( targets[layout+'-annotations'], 1000 );
		animateCamera( cameraPresets[layout], 2000 );

		controls.altControls = true;
		controls.noRotate = true;

	}, false );

	var button = document.getElementById( 'category' );
	button.addEventListener( 'click', function ( event ) {

		layout = 'category';

		transform( targets[layout], 1000 );
		transformAnnotations( targets[layout+'-annotations'], 1000 );
		animateCamera( cameraPresets[layout], 2000 );

		controls.altControls = false;
		controls.noRotate = false;

	}, false );

	var button = document.getElementById( 'age' );
	button.addEventListener( 'click', function ( event ) {

		layout = 'age';

		transform( targets[layout], 1000 );
		transformAnnotations( targets[layout+'-annotations'], 1000 );
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
	transformAnnotations( targets[layout+'-annotations'], 1000 );
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

function transformAnnotations( targets, duration ) {

	// TWEEN.removeAll();

	if (layout != "age") {
		$('.annotation').fadeIn();
		$('.annotation-age').fadeOut();
	} else {
		$('.annotation').fadeOut();
		$('.annotation-age').fadeIn();
	}

	for ( var i = 0; i < targets.length; i++ ) {

		if (layout != "age")
			var object = annotations[ i ];
		else
			var object = annotations[ i + 5 ];

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
	.to( { x: camera.position.x, y: camera.position.y - 300, z: camera.position.z + 100 }, 1000 )
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

function sortByAge(toSort) {
  for (var i = 0; i < toSort.length; i++) {
    toSort[i].tempi = i;
  }
  toSort.sort(function (a, b) {
    if (a.sortage > b.sortage)
      return 1;
    if (a.sortage < b.sortage)
      return -1;
    // a must be equal to b
    return 0;
  });
  console.log(toSort);
  toSort.sortIndices = [];
  for (var j = 0; j < toSort.length; j++) {
    toSort.sortIndices.push(toSort[j].tempi);
  }
  return toSort.sortIndices;
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