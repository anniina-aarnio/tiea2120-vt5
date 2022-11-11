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

}


// 