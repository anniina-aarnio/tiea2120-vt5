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
	luoKartta();	// TODO: tuleeko tämän alle omanaan vai sisälle rastien piirtäminen?
	luoJoukkueet(data);
	luoKartallaAlue(data);
	luoRastit(data);
}

/**
 * Luo kartan sivun yläosaan
 * Keskittää näkymän niin, että koko ajan näkyy kaikki rastit,
 * vaikka selaimen koko muuttuisi
 */
function luoKartta() {

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
		ul.appendChild(li);
	});
}

/**
 * 
 * @param {Object} data 
 */
function luoKartallaAlue(data) {

}

/**
 * Luo rastilistauksen datan perusteella aakkosjärjestykseen
 * @param {Object} data, josta rastien tiedot haetaan
 */
function luoRastit(data) {
	let ul = document.getElementById("rastilista");

	let lista = Array.from(data.rastit);
	lista.sort(jarjestaKoodinMukaan);

	lista.forEach(function(current, index, list) {
		let li = document.createElement("li");
		li.textContent = current.koodi;
		li.style.backgroundColor = rainbow(lista.length, index);
		ul.appendChild(li);
	});
}


// Joukkueen ja rastin luonnin yhteiset apufunktiot


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