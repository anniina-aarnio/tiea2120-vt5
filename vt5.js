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

			// lisätään viite rasteihin dokumenttiin
			let rastimap = new Map();
			data.rastit.forEach((current, index, list) => {
				rastimap.set(current.id, current);
			});
			document.getElementById("rastit").rastit = rastimap;
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
	luoJoukkueetTaiRastit(data, "joukkue");
	luoKartallaAlue(data);
	luoJoukkueetTaiRastit(data, "rasti");
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
 * Luo sivulle sateenkaaren väreissä joukkue- tai rastilistauksen
 * Luo järjestämättömän listan (ul), johon lisää aakkosjärjestyksessä 
 * @param {Object} data josta tieto listan sisältöihin otetaan
 * @param {String} joukkueTaiRasti tieto, onko kyseessä joukkue vai rasti
 */
function luoJoukkueetTaiRastit(data, joukkueTaiRasti) {
	let ul;
	let lista;

	// joukkueen ul ja lista omansa
	if (joukkueTaiRasti == "joukkue") {
		ul = document.getElementById("joukkuelista");
		lista = Array.from(data.joukkueet);
		// aakkosjärjestys
		lista.sort(jarjestaNimenMukaan);
	
	// rastin ul ja lista omansa
	} else if (joukkueTaiRasti == "rasti") {
		ul = document.getElementById("rastilista");
		lista = Array.from(data.rastit);
		// käänteinen aakkosjärjestys 
		lista.sort(jarjestaKoodinMukaan);
	} else {
		return;
	}

	// luodaan listan jokaisesta alkiosta li-elementti ja lisätään listaan
	lista.forEach(function(current, index, list) {
		let li = document.createElement("li");
		let nimiKoodi;
		// joukkueen nimi ja viite joukkueeseen
		if (joukkueTaiRasti == "joukkue") {
			current.matka = laskeJoukkueenMatka(current).toFixed(1);
			li.textContent = current.nimi + " (" + current.matka + " km)";
			li.joukkue = current;
			nimiKoodi = current.nimi;
		// rastin nimi
		} else {
			li.textContent = current.koodi;
			nimiKoodi = current.koodi;
		}

		// li-elementin taustaväri ja id
		li.style.backgroundColor = rainbow(lista.length, index);
		li.id = joukkueTaiRasti + (index + 1);
		
		// raahailu
		li.setAttribute("draggable", "true");
		li.addEventListener("dragstart", (e) => {
			e.dataTransfer.setData("text/plain", nimiKoodi);
			e.dataTransfer.setData(joukkueTaiRasti, joukkueTaiRasti + (index + 1));
			e.dataTransfer.effectAllowed = 'move';
			e.target.className = "dragging";
		});
		li.addEventListener("dragend", (e) => {
			// poistaa dragging-classin targetilta
			e.target.classList.remove("dragging");
		});

		// lisätään listaan
		ul.appendChild(li);

	});

	// diville droppausalue joukkueille tai rasteille
	ul.parentNode.addEventListener("dragover", (e) => {
		e.preventDefault();
		dragOverJoukkueTaiRasti(e, joukkueTaiRasti);
	});

	ul.parentNode.addEventListener("drop", (e) => {
		e.preventDefault();

		let kohde = e.target;
		// jos bubblen kautta päätyy li-elementtiin:
		if (kohde.nodeName == "LI") {
			ul.insertBefore(dropJoukkueTaiRasti(e, joukkueTaiRasti), kohde);
		} else {
			ul.appendChild(dropJoukkueTaiRasti(e, joukkueTaiRasti));
		}
	});
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

		let dataJ = e.dataTransfer.getData("joukkue");
		let dataR = e.dataTransfer.getData("rasti");


		if (dataJ) {
			try {
				let lisattava = document.getElementById(dataJ);
				e.target.firstElementChild.appendChild(lisattava);
				lisattava.style.left = String(e.offsetX) + "px";
				lisattava.style.top = String(e.offsetY) + "px";
				// jos lisätään joukkue, lisätään reitti karttaan
				lisaaReittiKarttaan(document.getElementById(dataJ));
			}
			catch (error) {

			}
		} else if (dataR) {
			try {
				let lisattava = document.getElementById(dataR);
				e.target.firstElementChild.appendChild(lisattava);
				lisattava.style.left = String(e.offsetX) + "px";
				lisattava.style.top = String(e.offsetY) + "px";
			}
			catch (error) {

			}
		}



	});
}



// Droppaukseen liittyviä apufunktioita

/**
 * Etsii e.dataTransferista datan tiedolla "joukkue" tai "rasti"
 * ja muokkaa dragoverissa dropEffectin "move" tai "none" riippuen
 * siitä, löytyykö sillä olevaa dataa sisältä.
 * @param {Event} e 
 * @param {String} joukkueTaiRasti "joukkue" tai "rasti" 
 */
function dragOverJoukkueTaiRasti(e, joukkueTaiRasti) {
	let data = e.dataTransfer.getData(joukkueTaiRasti);
	if (data) {
		e.dataTransfer.dropEffect = "move";
	} else {
		e.dataTransfer.dropEffect = "none";
	}
}

/**
 * Etsii e.dataTransferista datan tiedolla "joukkue" tai "rasti"
 * ja palauttaa sen joukkueen/rastin, jonka id on kulkenut mukana
 * @param {Event} e 
 * @param {String} joukkueTaiRasti "joukkue" tai "rasti" 
 * @returns li-elementti, jossa datasta löytyvä id-tieto
 */
function dropJoukkueTaiRasti(e, joukkueTaiRasti) {
	let data = e.dataTransfer.getData(joukkueTaiRasti);

	if (data.startsWith("joukkue")) {
		let li = document.getElementById(data);
		poistaReittiKartalta(li);
		return li;
	} else if (data.startsWith("rasti")) {
		let li = document.getElementById(data);
		return li;
	}
}


// Kartan luonnin ja käytön apufunktioita

/**
 * Luo karttaan kaikki datan rastit-listauksen rastit punaisina ympyröinä
 * @param {Object} mymap, johon rastien merkit liitetään
 * @param {Object} data, josta rastit
 */
function luoKartanRastit(mymap, data) {
	let rastit = Array.from(data.rastit);

	let kaikki = [];
	let markkeri = L.marker([rastit[0].lat, rastit[0].lon],
		{draggable: true});

	rastit.forEach(function(current, index, list) {
		// luodaan ympyrä
		let circle = L.circle(
			[current.lat, current.lon], {
				color: "red",
				fillColor: "red",
				fillOpacity: 0.1,
				radius: 150
			}
		).addTo(mymap);

		// lisätään viite rastiin
		circle.rasti = current;

		// lisätään teksti tooltipillä
		let text = L.tooltip({
			permanent: true,
			direction: "center",
			className: "koodi-kartalla",
			offset: [-5, -5]
		})
		.setContent(current.koodi);
		circle.bindTooltip(text);

		// lisätään eventti klikkaukseen
		circle.on("click", (e) => {
			klikatessaRastiYmpyraa(e, markkeri);
		});

		kaikki.push([current.lat, current.lon]);
	});

	return kaikki;
}

/**
 * Kun joukkue lisätään Kartalla-alueelle, tämä funktio piirtää karttaan
 * annetun joukkueen kiertämän reitin piirtona
 * Funktiossa tarkistetaan soveltuvat reittipisteet
 * @param {Node} li joukkueen li-elementti
 */
function lisaaReittiKarttaan(li) {
	let joukkue = li.joukkue;
	let mymap = document.getElementById("map").kartta;

	// katsotaan validit rastit reittipistelistaksi
	let reittipisteet = lisaaValiditRastileimaukset(Array.from(joukkue.rastileimaukset));
	
	// jos reittipisteet on tyhjä lista, palataan piirtämättä mitään
	if (reittipisteet.length == 0) {
		return;
	}

	let reitti = L.polyline(reittipisteet, {color: li.style.backgroundColor}).addTo(mymap);
	li.reitti = reitti;
}

/**
 * Poistaa annetun joukkue-li-elementin reitin kartalta
 * @param {Object} li 
 */
function poistaReittiKartalta(li) {
	if (li.reitti) {
		li.reitti.remove();
	}
}


// Joukkueen luonnin apufunktioita

/**
 * Apufunktio joukkueen jäsenten järjestämiseen (sort)
 * Tavallinen aakkosjärjestys
 * @param {Object} a joukkue 
 * @param {Object} b toinen joukkue
 * @return -1 jos b ennen a, 1 jos a ennen b, 0 jos samat
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


// Kartan rastien apufunktioita

/**
 * Järjestysfunktio, jolla rastit järjestetään koodin mukaan
 * käänteisessä aakkosjärjestyksessä
 * @param {Object} a rasti 
 * @param {Object} b toinen rasti
 * @returns -1 jos a tulee ennen b, 1 jos b tulee ennen a, 0 jos samat 
 */
function jarjestaKoodinMukaan(a, b) {
	if (a.koodi.trim().toUpperCase() > b.koodi.trim().toUpperCase()) {
		return -1;
	}
	if (b.koodi.trim().toUpperCase() > a.koodi.trim().toUpperCase()) {
		return 1;
	}
	return 0;
}

/**
 * Kun rastiympyrää klikkaa, luo markerin kyseisen rastin pisteeseen
 * Markerille luodaan drag ?? TODO
 * @param {Event} e
 * @param {Marker} markkeri
 */
function klikatessaRastiYmpyraa(e, markkeri) {
	// klikattu ympyrä
	let circle = e.target;

	// vaihtaa markkerin paikan klikattuun ympyrään

	markkeri.setLatLng(circle.getLatLng());
	markkeri.addTo(circle._map);
	
	// laittaa ensin vanhan circlen tiedot "normaaliksi"
	if (markkeri.circle) {
		markkeri.circle.setStyle({fillOpacity: 0.1});
	}
	// ottaa uuden ympyrän käyttöön
	markkeri.circle = circle;

	circle.setStyle({
		fillOpacity: 1.0
	});

	markkeri.on("dragend", siirraYmpyraa);
}


/**
 * Kun markeria siirtää kartalla, tiputtaessa ympyrä piirtyy samaan pisteeseen
 * Samalla päivitetään rastin lat ja lon sekä lasketaan kaikkien joukkueiden
 * reitit päivitetyn rastin tietojen kanssa
 * @param {Event} e 
 */
function siirraYmpyraa(e) {
	// markerin yhteydessä oleva ympyrä
	let circle = e.target.circle;
	let piste = e.target.getLatLng();
	circle.setLatLng(piste);

	// muutetaan rastin lat ja lng asianmukaisesti
	circle.rasti.lat = piste.lat;
	circle.rasti.lon = piste.lng;

	// haetaan joukkueiden li-elementit
	let joukkueet = Array.from(document.getElementById("joukkuelista").childNodes);
	let kartallaLit = Array.from(document.getElementById("kartallalista").childNodes);

	// lisätään joukkuelistaan kartalla olevista li-elementeistä joukkueet
	// (voisi muuttaa että joukkue-li-elementillä olisi class "joukkue" niin olisi nätimpi)
	kartallaLit.forEach((current, index, list) => {
		if (current.id.startsWith("joukkue")) {
			joukkueet.push(current);
		}
	});

	// lasketaan kaikkien joukkueiden matka uudestaan ja muutetaan tieto li-elementtiin näkyville
	joukkueet.forEach((current, index, list) => {
		current.joukkue.matka = laskeJoukkueenMatka(current.joukkue).toFixed(1);
		current.textContent = current.joukkue.nimi + " (" + current.joukkue.matka + ")";
	});

	// poistetaan vanha joukkuepiirros ja piirretään mahdollisesti uudistunut reitti karttaan
	kartallaLit.forEach((current, index, list) => {
		poistaReittiKartalta(current);
		lisaaReittiKarttaan(current);
	});

	// poistetaan markkeri ja muutetaan ympyrä tavalliseksi
	circle.setStyle({
		fillOpacity: 0.1
	});
	
	e.target.remove();
}


/**
 * Tekee listan, jossa joukkueen mukaanlaskettavat rastit
 * - viimeinen LÄHTÖ-leimaus on 1. rasti
 * - kaikki välirastit uniikkeja
 * - ensimmäinen MAALI-leimaus on viimeinen rasti
 * @param {Array} joukkueenrastit 
 * @return lista koordinaateista esim. [[lat1, lon1], [lat2, lon2]]
 */
function lisaaValiditRastileimaukset(joukkueenrastit) {
	let palautettava = [];
	let rastit = document.getElementById("rastit").rastit;

	let osaMatkaa = false;

	// järjestetään ajan mukaan
	joukkueenrastit.sort((a, b) => jarjestaAjanMukaan(a, b));

	// lisätään palautettavaan listaan
	for (let i = 0; i < joukkueenrastit.length; i++) {
		let rastiID = joukkueenrastit[i].rasti;
		let rasti = rastit.get(rastiID);

		// jos rastiID tai rasti on undefined mennään seuraavaan rastiin
		if (!rastiID || !rasti) {
			continue;
		}

		// LÄHTÖ-rasti tai sen jälkeinen rasti
		if (osaMatkaa || rasti.koodi === "LAHTO") {

			// jos on LÄHTÖ-rasti (eka tai mikä vaan)
			if (rasti.koodi === "LAHTO") {
				palautettava = [];
				osaMatkaa = true;
			}

			// onko validi rastiID (ei undefined)

			let lat = rasti.lat;
			let lon = rasti.lon;
			palautettava.push([lat, lon]);

			// jos ollaan maalissa, sekin rasti on lisätty ja sitten palautetaan
			if (rasti.koodi === "MAALI") {
				return palautettava;
			}
		}
	}

	// palautetaan tyhjä lista, jos maalia ei tule tai muuten epäkelpo lista
	return [];
}


// Muita apufunktioita

/**
 * Järjestää objekti.aika -perusteella listan järjestykseen, jossa
 * aikaisempi aika tulee ensin, jälkimmäinen sitten
 * Tässä oletetaan että aika on merkkijonona "vvvv.kk.pp hh:mm:ss"-muodossa
 * @param {Object} a objekti, jolla aika-tieto (esim. joukkueen rastileimaus)
 * @param {Object} b objekti, jolla aika-tieto (esim. joukkueen rastileimaus)
 * @returns -1 jos a ennen b, 1 jos b ennen a, 0 jos samat
 */
function jarjestaAjanMukaan(a, b) {
	if (a.aika < b.aika) {
		return -1;
	}
	if (b.aika < a.aika) {
		return 1;
	}
	return 0;
}

/**
 * Luo sateenkaaren värit listalle punainen -> keltainen -> sininen -> punainen
 * väliväreineen sen perusteella, montako väriä tarvitaan (listassa osia) ja
 * monesko väri niistä pitää palauttaa.
 * @param {Number} numOfSteps 
 * @param {Number} step 
 * @returns väri #rrggbb -muodossa 
 */
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

/**
 * Laskee joukkueen kulkeman matkan kilometreissä
 * Laskee kunkin rastin välisen matkan ja palauttaa niiden summan
 * @param {Object} joukkue
 * @return kokonaismatka kilometreissä, ei pyöristettynä
 */
function laskeJoukkueenMatka(joukkue) {
	let matkanRastit = lisaaValiditRastileimaukset(joukkue.rastileimaukset);
	if (matkanRastit <= 1) {
		return 0.0;
	}

	let kokonaismatka = 0.0;
	let edellinen = matkanRastit[0];

	for (let i = 1; i < matkanRastit.length; i++) {
		let nyt = matkanRastit[i];
		kokonaismatka += getDistanceFromLatLonInKm(edellinen[0], edellinen[1], nyt[0], nyt[1]);
		edellinen = nyt;
	}

	return kokonaismatka;
}

/**
 * Funktio otettu käyttöön viikkotehtävä 1 valmiista funktiosta
 * Laskee kahden pisteen välisen etäisyyden
 */
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
	let R = 6371; // Radius of the earth in km
	let dLat = deg2rad(lat2-lat1);  // deg2rad below
	let dLon = deg2rad(lon2-lon1);
	let a =
		Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
		Math.sin(dLon/2) * Math.sin(dLon/2)
		;
	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	let d = R * c; // Distance in km
	return d;
}

/**
 * Funktio otettu käyttöön viikkotehtävä 1 valmiista funktiosta
 * Muuntaa asteet radiaaneiksi
 */
function deg2rad(deg) {
	return deg * (Math.PI/180);
}