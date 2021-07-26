/* ////////////////// RUTA API ////////////////// */

//Ruta servidor y carpeta
var nombreHost = document.location.hostname; //Nombre del host (Ejemplo: localhost)
var localizacionIndexHTML = window.location.pathname; //Ruta del index.html (Ejemplo: /m10.2-leafletFiltres/index.html)
var carpetaProyecto = localizacionIndexHTML.substring(0, localizacionIndexHTML.lastIndexOf('/')); //Con esto cogemos lo que vaya antes de la segunda / (por ejemplo: /m10.2-leafletFiltres)

var pathAPI = `http://${nombreHost}${carpetaProyecto}/api/apiRestaurants.php`; //Ruta de la API

//console.log(pathAPI);



/* ////////////////// GEOLOCALIZACIÓN USUARIO PÁGINA////////////////// */

//FORMA ALTERNATIVA A MAP.LOCATE

/*var userLocation;

navigator.geolocation.getCurrentPosition( //Puede ser que obtengamos las coordenadas del punto de acceso del proveedor del servicio
	(pos) => {
		var { coords } = pos;
		userLocation = [coords.latitude, coords.longitude];	
	},
	(err) => {
		console.log(err);
	},
	{
		enableHighAccuracy: true,
		timeout: 5000,
		maximumAge: 0
	}
);  */



/* ////////////////// CREACIÓN MAPA ////////////////// */

var map = L.map('mapid').on('load', onMapLoad).setView([41.400, 2.206], 9);

map.locate({ setView: true, maxZoom: 16 }); // GEOLOCALIZACIÓN USUARIO: fijamos centro del mapa y zoom  

var tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);

//en el clusters almaceno todos los markers
var markers = L.markerClusterGroup();
var data_markers = []; //Array que almacena los restaurantes




/* ////////////////// FASE 3.1 ////////////////// */

function onMapLoad() {

	console.log("Mapa cargado");

	let restaurantTypesNoRepeated = []; //Array donde guardaremos las opciones a añadir al select, sin repetidos

	//Guardamos elemento select del HTML en variable
	let select = document.querySelector("#kind_food_selector");

	//Creamos la primera opción de los tipos de reestaurantes, que es "Todos"
	let option = document.createElement("option");
	option.value = "all"; //Su valor será all
	option.textContent = "Todos"; //El texto que se verá será Todos

	//Añadimos la opción al select
	select.appendChild(option);


	// 1) Relleno el data_markers con una petición a la api
	fetch(pathAPI)
		.then((response) => response.json())
		.then((restaurants) => {
			console.log(restaurants)
			restaurants.forEach((element) => {
				//Relleno data_markers
				data_markers.push(element);
			});


			// 2) Añado de forma dinámica en el select los posibles tipos de restaurantes

			//Generamos array con las opciones que hay que añadir al select
			restaurantTypesNoRepeated = generarTiposRestaurantes(data_markers);

			//Añadimos las opciones al select
			restaurantTypesNoRepeated.forEach(element => {
				let option = document.createElement("option");
				option.value = element;
				option.textContent = element;
				select.appendChild(option);
			});

			// 3) Llamo a la función para --> render_to_map(data_markers, 'all'); <-- para mostrar restaurantes en el mapa

			render_to_map(data_markers, 'all');
		});
}



/* ////////////////// EVENTO ON CHANGE PARA FILTAR MARCADORES ////////////////// */
let select = document.querySelector("#kind_food_selector");
select.addEventListener("change", function () {
	console.log(this.value);
	render_to_map(data_markers, this.value);
});


/* ////////////////// FASE 3.2 ////////////////// */

function render_to_map(data_markers, filter) {

	// 1) Limpio todos los marcadores
	markers.clearLayers();

	// 2) Realizo un bucle para decidir que marcadores cumplen el filtro, y los agregamos al mapa

	//Si el filter es all, hay que sacar todos los restaurantes
	if (filter == "all") {
		data_markers.forEach(element => {
			createMarker(element);
		});
	}
	else {
		data_markers.forEach(element => {
			//Si la propiedad kind_foot (que es una string) del restaurante que estamos recorriendo contiene los caracteres del filtro que hemos seleccionado, crearemos un marcador para el restaurante y lo añadiremos
			if (element.kind_foot.includes(filter)) {
				createMarker(element);
			}
		});
	}

	//Añadimos cluster al mapa
	map.addLayer(markers);
}





function generarTiposRestaurantes(data_markers) {

	let restaurantTypes = []; //Array donde almacenaremos todos los tipos, incluido repetidos
	let restaurantTypesNoRepeated = []; //Array donde guardaremos los tipos de comida sin repeticiones
	let kindOfFoodHasComa = false; //Control para saber si en la columna kind_foot hay más de un tipo de restaurante
	let arrStringSplited = []; //Variable para guardar el array que nos genera el método split


	// Recorremos el array data_markers y guardamos todos los tipos de restaurantes en un nuevo array
	data_markers.forEach(element => {

		//Miramos si en el string kind_foot hay una coma, eso significará que hay más de un tipo de comida para ese restaurante
		for (let i = 0; i <= element.kind_foot.length; i++) {
			if (element.kind_foot[i] == ",") {
				kindOfFoodHasComa = true;
				break;
			}
		}

		//En el caso de que se haya encontrado coma, hay más de un tipo para el restaurante
		if (kindOfFoodHasComa == true) {

			//Usamos el método split para partir y obtener los tipos de comida que hace ese restaurante
			arrStringSplited = element.kind_foot.split(",");

			//Para cada uno de estos tipos de comida, vamos a añadirlo al array de tipos de comida
			arrStringSplited.forEach(element => {
				restaurantTypes.push(element);
			});

			//Reseteamos el valor de kindOfFoodHasComa a false para la siguiente iteración
			kindOfFoodHasComa = false;
		}
		//En el caso de que no haya coma, significa que ese restaurante solo tiene un tipo de comida y podemos añadir ese tipo directamente al array
		else {
			restaurantTypes.push(element.kind_foot);
		}


	});


	// Filtramos elementos repetidos de data_markers
	restaurantTypesNoRepeated = restaurantTypes.filter((value, index) => {
		return restaurantTypes.indexOf(value) === index;
		//El método indexOf retorna el índice de la PRIMERA ocurrencia de un elemento en un array
		//Si el índice del elemento que estamos iterando con filter es igual al índice de la primera ocurrencia de ese elemento (arrValidaciones.indexOf(value)), se cumplirá la condición de filter para que nos retorne el valor en el nuevo array que se está generando. Si el índice del elemento que estamos iterando con filter es diferente al índice de la primera ocurrencia de ese elemento(arrValidaciones.indexOf(value)), significa que es una repetición.
	});

	//Devolvemos el array que contendrá las opciones que deben ir en el select
	return restaurantTypesNoRepeated;
}




function createMarker(element) {

	let marker;
	let photoImg;

	//Creamos marcador
	marker = L.marker([element.lat, element.lng]);

	//Añadimos imagen
	photoImg = `<img src="${element.photo}" style="display: block; margin-left: auto; margin-right: auto; width: 100%; object-fit: contain; margin-top: 25px; margin-bottom: 10px;">`;

	//AñadimospopUp al marcador
	marker.bindPopup(`${photoImg}<b>${element.name}</b><br>${element.address}<br>`);

	//Añadimos evento click al marcador para centrar mapa
	marker.addEventListener("click", e => {
		map.setView([element.lat, element.lng]);
	});

	//Añadimos marcador al cluster
	markers.addLayer(marker);
}