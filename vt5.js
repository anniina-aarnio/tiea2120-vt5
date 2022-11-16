"use strict";
// seuraavat estävät jshintin narinat leafletin objekteista
/* globals L */

// Alustetaan data, joka on jokaisella sivun latauskerralla erilainen.
window.addEventListener("load", function(e) {
	fetch('https://appro.mit.jyu.fi/cgi-bin/tiea2120/randomize_json.cgi')
	    .then(response => response.json())
	    .then(function(data) {
            console.log(data);
            // tänne oma koodi
			luoSivu(data);
	    });
});



// Kokonaiskuvan rakentaminen sivulle

/**
 * Koontifunktio, jossa luodaan sivun osat yksi kerrallaan kuntoon
 * Osista muodostuu:
 * - kartta, jossa näkyy rastit ja mahdollisesti joidenkin joukkueiden reitit
 * - joukkuelistaus, jossa raahattavat joukkueennimet
 * - kartalla-alue, johon voi raahata joukkueita ja rasteja,
 *   minkä perusteella karttaan tulee joukkueiden reitit näkyviin
 * - rastit-listaus, jossa raahattavat rastiennimet
 */
function luoSivu(data) {
	luoKartta(data);
	luoJoukkueet(data);
	luoKartallaAlue(data);
	luoRastit(data);
}

/**
 * Luo kartan sivun yläosaan
 * Keskittää näkymän niin, että koko ajan näkyy kaikki rastit,
 * vaikka selaimen koko muuttuisi
 * @param {Object} data kaikki tiedot joukkueista, rasteista yms
 */
function luoKartta(data) {
	let mymap = new L.map('map', {
		crs: L.TileLayer.MML.get3067Proj()
	}).setView([62.2333, 25.7333], 11);

	L.tileLayer.mml_wmts({
		layer: "maastokartta",
		key: "0cb805a7-7585-45ee-aa20-6c1a22e636b1"
	}).addTo(mymap);

	let rastit = luoKartanRastit(mymap, data);

	// kartassa näkyy kaikki rastit ja vähän padding
	mymap.fitBounds(rastit, [[1,1], [1,1]]);

	// lisätään kartta documentin map-elementtiin
	document.getElementById("map").kartta = mymap;
}

/**
 * Luo joukkuelistauksen datan perusteella aakkosjärjestykseen
 * @param {Object} data, josta joukkueen tiedot haetaan
 */
function luoJoukkueet(data) {
	let ul = document.getElementById("joukkuelista");

	let lista = Array.from(data.joukkueet);
	lista.sort(jarjestaNimenMukaan);

	lista.forEach(function(current, index, list) {
		let li = document.createElement("li");
		li.textContent = current.nimi;
		li.style.backgroundColor = rainbow(lista.length, index);
		li.id = "joukkue" + (index + 1);
		
		// raahailu
		li.setAttribute("draggable", "true");
		li.addEventListener("dragstart", (e) => {
			e.dataTransfer.setData("text/plain", "joukkue" + (index + 1));
			e.dataTransfer.effectAllowed = 'move';
			e.target.className = "dragging";
		});
		li.addEventListener("dragend", (e) => {
			// poistaa dragging-classin targetilta
			e.target.classList.remove("dragging");
		});

		// lisätään listaan
		ul.appendChild(li);

		// lisätään joukkueen viittaus li-elementtiin
		li.joukkue = current;
	});

	// luodaan droppausalue
	ul.addEventListener("dragover", (e) => {
		e.preventDefault();

		dragOverJoukkueTaiRasti(e, "joukkue");
		/* let data = e.dataTransfer.getData("text");
		if (data.startsWith("joukkue")) {
			e.dataTransfer.dropEffect = "move";
		} else {
			e.dataTransfer.dropEffect = "none";
		} */

	});

	ul.parentNode.addEventListener("drop", (e) => {
		e.preventDefault();

		let data = e.dataTransfer.getData("text");
		if (data.startsWith("joukkue")) {
			let li = document.getElementById(data);
			poistaReittiKartalta(li);
			ul.appendChild(li);
		}
	}, true);
}

function dragOverJoukkueTaiRasti(e, joukkueTaiRasti) {
	let data = e.dataTransfer.getData("text");
	if (data.startsWith("joukkue")) {
		e.dataTransfer.dropEffect = "move";
	} else {
		e.dataTransfer.dropEffect = "none";
	}
}

/**
 * Luo kartalla-alueen, joka on droppable-area
 * @param {Object} data 
 */
function luoKartallaAlue(data) {
	let kartalla = document.getElementById("kartalla");

	kartalla.addEventListener("dragover", (e) => {
		e.preventDefault();
		if (e.dataTransfer.types.includes("text/plain")) {
			e.dataTransfer.dropEffect = "move";
		} else {
			e.dataTransfer.dropEffect = "none";
		}
	});

	kartalla.addEventListener("drop", (e) => {
		e.preventDefault();
		let data = e.dataTransfer.getData("text");

		if (data) {
			try {
				let lisattava = document.getElementById(data);
				e.target.firstElementChild.appendChild(lisattava);
				lisattava.style.left = String(e.offsetX) + "px";
				lisattava.style.top = String(e.offsetY) + "px";
			}
			catch (error) {

			}
		}

		// jos lisätään joukkue, lisätään reitti karttaan
		if (data.startsWith("joukkue")) {
			lisaaReittiKarttaan(document.getElementById(data));
		}
	});
}



/**
 * Luo rastilistauksen datan perusteella aakkosjärjestykseen
 * @param {Object} data, josta rastien tiedot haetaan
 */
function luoRastit(data) {
	let ul = document.getElementById("rastilista");

	let lista = Array.from(data.rastit);
	lista.sort(jarjestaKoodinMukaan);

	document.getElementById("rastit").rastit = lista;

	lista.forEach(function(current, index, list) {
		let li = document.createElement("li");
		li.textContent = current.koodi;
		li.style.backgroundColor = rainbow(lista.length, index);
		li.id = "rasti" + (index + 1);
		
		// raahailu
		li.setAttribute("draggable", "true");
		li.addEventListener("dragstart", (e) => {
			e.dataTransfer.setData("text/plain", "rasti" + (index + 1));
			e.dataTransfer.effectAllowed = 'move';
			e.target.className = "dragging";
		});
		li.addEventListener("dragend", (e) => {
			// poistaa dragging-classin targetilta
			e.target.classList.remove("dragging");
		});

		// lisätään listaan
		ul.appendChild(li);
/* 
		// lisätään rastin viite li-elementtiin
		li.rasti = current; */
	});
}


// Kartan luonnin apufunktioita

/**
 * 
 * @param {Object} mymap, johon rastien merkit liitetään
 * @param {Object} data, josta rastit
 */
function luoKartanRastit(mymap, data) {
	let rastit = Array.from(data.rastit);

	let kaikki = [];

	rastit.forEach(function(current, index, list) {
		let circle = L.circle(
			[current.lat, current.lon], {
				color: "red",
				fillColor: "red",
				fillOpacity: 0.5,
				radius: 150
			}
		).addTo(mymap);

		kaikki.push([current.lat, current.lon]);

	});

	return kaikki;
}

/**
 * Kun joukkue lisätään Kartalla-alueelle, tämä funktio piirtää karttaan
 * annetun joukkueen kiertämän reitin piirtona TODO jatka tätä
 * @param {Node} li joukkueen li-elementti
 */
function lisaaReittiKarttaan(li) {
	let joukkue = li.joukkue;
	let mymap = document.getElementById("map").kartta;

	// piirrä rastit
	let joukkueenrastit = Array.from(joukkue.rastileimaukset);
	let rastit = document.getElementById("rastit").rastit;

	let reittipisteet = [];
	
	for (let i = 0; i < joukkueenrastit.length; i++) {
		let lisattava = etsiRastiIdnPerusteella(joukkueenrastit[i].rasti, rastit);
		if (lisattava) {
			reittipisteet.push(lisattava);
		}
	}

	// nyt luo aina uudestaan reitin - pitäisikö luoda suoraan kaikille joukkueille reitit,
	// jotka näytettäisiin tai poistettaisiin näkyvistä ?
	let reitti = L.polyline(reittipisteet, {color: li.style.backgroundColor}).addTo(mymap);
/* 	joukkueenrastit.forEach((current, index, list) => {
		reitti.addLatLng(etsiRastiIdnPerusteella(current.rasti, rastit));
	}); */
}

/**
 * TODO selosta + tee funktio kuntoon
 * @param {Object} li 
 */
function poistaReittiKartalta(li) {
	console.log(li, "poistettu");
}


/**
 * 
 * @param {String} rastiID jossa etsittävän rastin id-numero merkkijonona
 * @param {Array} rastit kaikki rastit,  
 * @returns 
 */
function etsiRastiIdnPerusteella(rastiID, rastit) {
	for (let rasti of rastit) {
		if (rasti.id === rastiID) {
			return [rasti.lat, rasti.lon];
		}
	}
	return undefined;
}


// Joukkueen luonnin apufunktioita

/**
 * Apufunktio joukkueen jäsenten järjestämiseen (sort)
 * @param {Object} a joukkue 
 * @param {Object} b toinen joukkue
 */
function jarjestaNimenMukaan(a, b) {
	if (a.nimi.trim().toUpperCase() > b.nimi.trim().toUpperCase()) {
		return 1;
	}
	if (b.nimi.trim().toUpperCase() > a.nimi.trim().toUpperCase()) {
		return -1;
	}
	return 0;
}


// Rastien luonnin apufunktioita

function jarjestaKoodinMukaan(a, b) {
	if (a.koodi.trim().toUpperCase() > b.koodi.trim().toUpperCase()) {
		return -1;
	}
	if (b.koodi.trim().toUpperCase() > a.koodi.trim().toUpperCase()) {
		return 1;
	}
	return 0;
}


// Muita apufunktioita

function rainbow(numOfSteps, step) {
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    let r, g, b;
    let h = step / numOfSteps;
    let i = ~~(h * 6);
    let f = h * 6 - i;
    let q = 1 - f;
    switch(i % 6){
        case 0: r = 1; g = f; b = 0; break;
        case 1: r = q; g = 1; b = 0; break;
        case 2: r = 0; g = 1; b = f; break;
        case 3: r = 0; g = q; b = 1; break;
        case 4: r = f; g = 0; b = 1; break;
        case 5: r = 1; g = 0; b = q; break;
    }
    let c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
    return (c);
}