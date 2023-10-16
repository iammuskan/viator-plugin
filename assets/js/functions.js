'use strict';

const {__, _x, _n, _nx} = wp.i18n;

const getQueryString = (url) => {
	let queryString = url ? url.split('?')[1] : window.location.search.slice(1);

	if (queryString) {
		const obj = {};

		queryString = queryString.split('#')[0];

		const arr = queryString.split('&');

		for (let i = 0; i < arr.length; i++) {
			let a = arr[i].split('=');
			let paramNum = undefined;
			let paramName = a[0].replace(/\[\d*\]/, function (v) {
				paramNum = v.slice(1, -1);
				return '';
			});

			let paramValue = typeof (a[1]) === 'undefined' ? true : a[1];

			if (obj[paramName]) {
				if (typeof obj[paramName] === 'string') {
					obj[paramName] = [obj[paramName]];
				}

				if (typeof paramNum === 'undefined') {
					obj[paramName].push(paramValue);
				} else {
					obj[paramName][paramNum] = paramValue;
				}
			} else {
				obj[paramName] = paramValue;
			}
		}

		return obj;
	}

	return false;
};
const changeUrl = function (target, dataObj) {
	// let $pathName = `${ getHomeUrl }/${ target }/`;
	//
	// if (Object.keys(dataObj).length) {
	// 	let $urlQuery = {};
	//
	// 	Object.assign($urlQuery, dataObj);
	//
	//
	// 	let $urlParams = new URLSearchParams($urlObj).toString();
	//
	// 	$urlLocation += `?${ $urlParams }`;
	// }
	//
	// history.pushState(null, null, $urlLocation);
	//
	// localStorage.setItem('objLinkParams', JSON.stringify($objLinkParams));
};
//-----------------------------------

window.vi_global_product = {};

let global_unavailableDates = {};

window.vi_global_selected_date;


const getNonce = () => {
	return window.viatorCoreNonce;
};

const getHomeUrl = () => {
	return window.location.origin;
};

const getDestinations = () => {
	return JSON.parse(localStorage.getItem('viatorDest')) || [];
};

const getDest = (compare1, compare2, keyReturn = 'destinationId') => {
	for (let $data of getDestinations()) {
		if (String($data[compare1]).toLowerCase() === String(compare2).toLowerCase()) {
			return $data[keyReturn];
		}

	}
	return compare2;
};
console.log(getDest);
const useGeocode = ($place_id) => {
	if (viatorSingleObj?.gmap_key) {
		return jQuery.ajax({
			type: 'GET',
			url: `https://maps.googleapis.com/maps/api/geocode/json?place_id=${$place_id}&key=${viatorSingleObj['gmap_key']}`,
			dataType: 'json',
		});
	}

	return {status: false};
};

const getPostId = () => {
	let $pathname = window.location.pathname;

	if ($pathname[$pathname.length - 1] === '/') {
		$pathname = window.location.pathname.slice(1, -1).split('/');
	} else {
		$pathname = window.location.pathname.replace(/^./g, "").split('/');
	}

	return $pathname[$pathname.length - 1];
};

const getIconCurrency = ($str = 'USD') => {
	let $currency = {
		'AED': 'AED',
		'AUD': '$',
		'BRL': 'R$',
		'CAD': '$',
		'CHF': 'CHF',
		'DKK': 'kr.',
		'EUR': '€',
		'GBP': '£',
		'HKD': 'HK$',
		'INR': '₹',
		'JPY': '¥',
		'NOK': 'kr',
		'NZD': '$',
		'SEK': 'kr',
		'SGD': '$',
		'TWD': 'NT$',
		'USD': '$',
		'ZAR': 'R',
	};

	return $currency[$str] ?? '$';
};

const getNameLanguage = ($str = 'en') => {
	if ($str === 'zh') {
		$str = 'zh-CN';
	}
	if ($str === 'zhtw') {
		$str = 'zh-TW';
	}

	let $languages = {
		'en': 'English',
		'da': 'Danish',
		'nl': 'Dutch',
		'no': 'Norwegian',
		'es': 'Spanish',
		'sv': 'Swedish',
		'fr': 'French',
		'it': 'Italian',
		'de': 'German',
		'pt': 'Portuguese',
		'ja': 'Japanese',
		'zh-TW': 'Chinese (traditional)',
		'zh-CN': 'Chinese (simplified)',
		'ko': 'Korean',

		'en-US': 'English',
		'da-DK': 'Danish',
		'nl-NL': 'Dutch',
		'no-NO': 'Norwegian',
		'es-ES': 'Spanish',
		'sv-SE': 'Swedish',
		'fr-FR': 'French',
		'it-IT': 'Italian',
		'de-DE': 'German',
		'pt-PT': 'Portuguese',
		'ja-JP': 'Japanese',
		'ko-KR': 'Korean',
	};

	return $languages[$str] ?? 'English';
};

const setLanguage = () => {
	// let $viatorLang = sessionStorage.getItem('viatorLang');
	//
	// if ($viatorLang) {
	// 	window['viatorChooseLang'].val([getNameLanguage($viatorLang), $viatorLang]).trigger("change");
	// }
	// else {
	sessionStorage.setItem('viatorLang', window['viatorChooseLang'].val());
	//}


	window['viatorChooseLang'].on('select2:select', function (evt) {
		let val = evt.params.data.id;

		if (!val) return;

		sessionStorage.setItem('viatorLang', val);

		localStorage.setItem('viatorDest', '');

		if (viatorSingleObj?.post_id) {
			if (evt.params.data.element.dataset?.url) {
				window.location = evt.params.data.element.dataset?.url;
			}
		} else {
			let $lang = '',
				$pathnameCount = window.location.pathname.length,
				$pathnamePoint = window.location.pathname.slice(1, $pathnameCount).indexOf('/') + 1,
				$pathname = window.location.pathname;

			if (viatorSingleObj?.lang !== viatorSingleObj?.default_lang) {
				$pathname = window.location.pathname.slice($pathnamePoint, $pathnameCount);
			}

			if (viatorSingleObj?.lang !== val && val !== viatorSingleObj?.default_lang) {
				$lang = '/' + val;
			}

			window.location = `${window.location.origin}${$lang}${$pathname}`;
		}

	});
};

const setCurrency = () => {
	let queryString = getQueryString();
	let $viatorCurrency = localStorage.getItem('viatorCurrency');

	if (queryString?.currency){
		$viatorCurrency = queryString.currency;
	} else if (viatorParameters?.default_currency){
		$viatorCurrency = viatorParameters.default_currency;
	}

	if ($viatorCurrency) {
		let fakeCurrency = document.querySelector('.wc-currency-switcher-select select[name="currency"]');
		if (fakeCurrency) {
			fakeCurrency.value = $viatorCurrency
		}

		window['viatorChooseCurrency'].val([$viatorCurrency, $viatorCurrency]).trigger('change');
		localStorage.setItem('viatorCurrency', $viatorCurrency);
	} else {
		localStorage.setItem('viatorCurrency', window['viatorChooseCurrency'].val());
		//select2-currency
	}

	window['viatorChooseCurrency'].on('select2:select', function (evt) {
		let val = evt.params.data.id;

		if (val) {
			localStorage.setItem('viatorCurrency', val);
		}

		window.location = `${window.location.origin}${window.location.pathname}?currency=${val}`;
	});
};

const insertSkeleton = (int = 1, inBlock, col = 3) => {
	inBlock.innerHTML = '';

	let $class = col === 2 ? 'col-sm-6 mb-md-5 mb-4' : 'col-lg-4 col-sm-6 mb-d-5 mb-4';

	if (int > 1) {
		for (let i = 0; i < int; i++) {
			inBlock.insertAdjacentHTML('beforeend',
				'<div class="' + $class + ' skeleton-init"><div class="activities-item"><div class="activities-item__image skeleton-loader"></div><div class="activities-item__body"><div class="activities-item__title skeleton-loader"></div><div class="review skeleton-loader"></div><p class="activities-item__text skeleton-loader"><svg role="img" width="320" height="115" aria-labelledby="loading-aria" viewBox="0 50 476 124" preserveAspectRatio="none"><rect x="0" y="0" width="100%" height="100%" clip-path="url(#clip-path)" style=\'fill: url("#fill");\'></rect><defs><clipPath id="clip-path"><rect x="0" y="56" rx="0" ry="0" width="476" height="16"/><rect x="0" y="74" rx="0" ry="0" width="440" height="16"/><rect x="0" y="92" rx="0" ry="0" width="208" height="16"/><rect x="0" y="110" rx="0" ry="0" width="320" height="16"/></clipPath><linearGradient id="fill"><stop offset="0.599964" stop-color="#dddbdd" stop-opacity="1"><animate attributeName="offset" values="-2; -2; 1" keyTimes="0; 0.25; 1" dur="2s" repeatCount="indefinite"></animate></stop><stop offset="1.59996" stop-color="#ecebeb" stop-opacity="1"><animate attributeName="offset" values="-1; -1; 2" keyTimes="0; 0.25; 1" dur="2s" repeatCount="indefinite"></animate></stop><stop offset="2.59996" stop-color="#dddbdd" stop-opacity="1"><animate attributeName="offset" values="0; 0; 3" keyTimes="0; 0.25; 1" dur="2s" repeatCount="indefinite"></animate></stop></linearGradient></defs></svg></p></div></div></div>',
			);
		}
	} else {
		inBlock.insertAdjacentHTML('beforeend',
			'<div class="' + $class + ' skeleton-init"><div class="activities-item"><div class="activities-item__image skeleton-loader"></div><div class="activities-item__body"><div class="activities-item__title skeleton-loader"></div><div class="review skeleton-loader"></div><p class="activities-item__text skeleton-loader"><svg role="img" width="320" height="115" aria-labelledby="loading-aria" viewBox="0 50 476 124" preserveAspectRatio="none"><rect x="0" y="0" width="100%" height="100%" clip-path="url(#clip-path)" style=\'fill: url("#fill");\'></rect><defs><clipPath id="clip-path"><rect x="0" y="56" rx="0" ry="0" width="476" height="16"/><rect x="0" y="74" rx="0" ry="0" width="440" height="16"/><rect x="0" y="92" rx="0" ry="0" width="208" height="16"/><rect x="0" y="110" rx="0" ry="0" width="320" height="16"/></clipPath><linearGradient id="fill"><stop offset="0.599964" stop-color="#dddbdd" stop-opacity="1"><animate attributeName="offset" values="-2; -2; 1" keyTimes="0; 0.25; 1" dur="2s" repeatCount="indefinite"></animate></stop><stop offset="1.59996" stop-color="#ecebeb" stop-opacity="1"><animate attributeName="offset" values="-1; -1; 2" keyTimes="0; 0.25; 1" dur="2s" repeatCount="indefinite"></animate></stop><stop offset="2.59996" stop-color="#dddbdd" stop-opacity="1"><animate attributeName="offset" values="0; 0; 3" keyTimes="0; 0.25; 1" dur="2s" repeatCount="indefinite"></animate></stop></linearGradient></defs></svg></p></div></div></div>',
		);
	}
};

const scrollVisibleEl = (target) => {
	let targetPosition = {
			top: window.pageYOffset + target.getBoundingClientRect().top,
			bottom: window.pageYOffset + target.getBoundingClientRect().bottom,
		},
		windowPosition = {
			top: window.pageYOffset,
			bottom: window.pageYOffset + document.documentElement.clientHeight,
		};

	if (targetPosition.bottom > windowPosition.top && targetPosition.top < windowPosition.bottom) {
		return true;
	}
	return false;
};

const isFullStorage = () => {
	let result, _lsTotal = 0, _xLen, _x;

	for (_x in localStorage) {
		if (!localStorage.hasOwnProperty(_x)) {
			continue;
		}

		_xLen = ((localStorage[_x].length + _x.length) * 2);
		_lsTotal += _xLen;

	}

	result = (_lsTotal / 1024).toFixed(2);

	return `There is still left ${5000 - result} KB`;
};

const storageAvailable = ($type) => {
	try {
		const storage = window[$type],
			x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		return true;
	} catch (e) {
		return false;
	}
};

const updateStorage = (dataObj, name = '') => {
	if (storageAvailable('localStorage')) {
		localStorage.setItem(`viator${name}`, JSON.stringify(dataObj));
		localStorage.setItem(`viator${name}LastUp`, `${Date.now() + 86400000}`);

		console.log(`! Update Viator ${name}!`, isFullStorage());
	} else {
		console.log('localStorage not available');
	}
};

const setTimeHold = () => {
	if (storageAvailable('localStorage')) {
		localStorage.setItem('viatorTimeHold', String(Date.now()));
	} else {
		console.log('localStorage not available');
	}
}

const insertRating = (block, count) => {
	count = Number(count);
	let $fullSvg = '<svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.788 7.18132L13.8583 10.7781L14.7863 15.8582C14.8267 16.0804 14.7296 16.3049 14.5352 16.4376C14.4255 16.5128 14.2949 16.5507 14.1643 16.5507C14.064 16.5507 13.9631 16.5282 13.8709 16.4826L9.01199 14.0841L4.15366 16.482C3.94169 16.5874 3.68366 16.5703 3.48936 16.437C3.29505 16.3043 3.19789 16.0798 3.23827 15.8576L4.16628 10.7775L0.235963 7.18132C0.0643662 7.02375 0.00191014 6.78799 0.0763527 6.57414C0.150795 6.3603 0.348258 6.20333 0.586095 6.17075L6.01725 5.43029L8.4461 0.808686C8.6587 0.404103 9.36527 0.404103 9.57788 0.808686L12.0067 5.43029L17.4379 6.17075C17.6757 6.20333 17.8732 6.35971 17.9476 6.57414C18.0221 6.78858 17.9596 7.02315 17.788 7.18132Z" fill="#FEC125"></path></svg>',
		$greySvg = '<svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.788 7.18132L13.8583 10.7781L14.7863 15.8582C14.8267 16.0804 14.7296 16.3049 14.5352 16.4376C14.4255 16.5128 14.2949 16.5507 14.1643 16.5507C14.064 16.5507 13.9631 16.5282 13.8709 16.4826L9.01199 14.0841L4.15366 16.482C3.94169 16.5874 3.68366 16.5703 3.48936 16.437C3.29505 16.3043 3.19789 16.0798 3.23827 15.8576L4.16628 10.7775L0.235963 7.18132C0.0643662 7.02375 0.00191014 6.78799 0.0763527 6.57414C0.150795 6.3603 0.348258 6.20333 0.586095 6.17075L6.01725 5.43029L8.4461 0.808686C8.6587 0.404103 9.36527 0.404103 9.57788 0.808686L12.0067 5.43029L17.4379 6.17075C17.6757 6.20333 17.8732 6.35971 17.9476 6.57414C18.0221 6.78858 17.9596 7.02315 17.788 7.18132Z" fill="#ccc"></path></svg>';

	for (let i = 0; i < 5; i++) {
		let $item = document.createElement('span');

		$item.classList.add('review__item');

		if (count >= 1) {
			$item.insertAdjacentHTML('beforeend', $fullSvg);
			count--;
		} else {
			$item.insertAdjacentHTML('beforeend', $greySvg);
		}

		block.insertAdjacentElement('beforeend', $item);
	}
};


const insertSimilar = async (mainBlock, destinations, count = 3) => {


	let $viatorLang = sessionStorage.getItem('viatorLang') ?? 'en',
		$dataForSend = {
			action: 'get_products_search',
			target: 'similar',
			destId: destinations,
			language: $viatorLang,
			count: count,
		};

	$dataForSend['currency'] = localStorage.getItem('viatorCurrency') ?? viatorParameters?.default_currency;

	try {
		let $result = await axios({
			method: 'POST',
			data: new URLSearchParams($dataForSend),
			url: '/wp-admin/admin-ajax.php',
		});

		$result = $result['data'];

		if ($result?.data) {
			insertCardProducts(mainBlock, $result['data']['products'], 'similar');
		} else {
			mainBlock.innerHTML = 'Error';
			console.info(`Problem! Something happened  ${$result}`);
		}

	} catch (error) {
		console.error(error);
	}
};

const insertCardProducts = ($mainBlock, $products, $target = 'home') => {
	$mainBlock.innerHTML = '';

	let featured_prices = viatorParameters?.featured_prices || {};

	for (const $product of $products) {
		//if ($product[ 'status' ] !== 'ACTIVE') {continue;}
		let $currency = $product?.pricing?.currency || localStorage.getItem('viatorCurrency') || 'USD',
			$fromPrice = $product?.pricing?.summary?.fromPrice || 29,
			$imagesUrl = $product?.images[0]?.variants[3]?.url,
			$colBlock = document.createElement('div'),
			$activitiesBlock = document.createElement('a'),
			$imageBlock = document.createElement('div'),
			$imageSrc = document.createElement('img'),
			$bodyBlock = document.createElement('div'),
			$titleBlock = document.createElement('h3'),
			$reviewBlock = document.createElement('div'),
			$reviewTxt = document.createElement('span'),
			$textBlock = document.createElement('p'),
			$priceBlock = document.createElement('div'),
			$destUrlName = getDest('destinationId', $product['destinations'][0]['ref'], 'destinationUrlName');

		if ($target === 'home'){
			if ($product?.productCode in featured_prices){
				$fromPrice = featured_prices[$product.productCode] * $product?.rate;
			} else{
				$fromPrice = 29 * $product?.rate
			}
		}

		if ($target === 'home' || $target === 'similar'){
			$colBlock.classList.add('col-lg-4');
		}

		$colBlock.classList.add('col-sm-6');
		$colBlock.classList.add('mb-md-5');
		$colBlock.classList.add('mb-4');
		$activitiesBlock.classList.add('activities-item');
		$imageBlock.classList.add('activities-item__image');
		$bodyBlock.classList.add('activities-item__body');
		$titleBlock.classList.add('activities-item__title');
		$reviewBlock.classList.add('review');
		$reviewTxt.classList.add('review__text');
		$textBlock.classList.add('activities-item__text');
		$priceBlock.classList.add('activities-item__price');

		if ($product?.type === 'woo' && $product?.permalink) {
			$activitiesBlock.setAttribute('href', $product['permalink']);
		} else {
			let $lang = '',
				$slug = $product['title'].replace(/[^A-Za-z0-9 ]/gmi, '').replace(/\s+/gmi, ' ').replace(/^\s/,
					''
				).replace(/\s$/, '').replace(/ /g, '-');

			if (viatorSingleObj?.lang !== viatorSingleObj?.default_lang) {
				$lang = viatorSingleObj['lang'] + '/';
			}
             
			$activitiesBlock.setAttribute(
				'href',
				`/${$lang}${viatorParameters['product_base']}/${$destUrlName}/${$slug}/${$product['productCode']}`,
			);
			$colBlock.setAttribute(
				'data-code',
				`${$product['productCode']}`,
			);
		}

		$titleBlock.textContent = $product['title'];
		$textBlock.textContent = $product['description'];
		$imageSrc.setAttribute('src', $imagesUrl);
		$priceBlock.textContent = __('From', 'viator') + ` ${getIconCurrency($currency)}${Math.round($fromPrice)}`;
          
		$colBlock.insertAdjacentElement('afterbegin', $activitiesBlock);
		$imageBlock.insertAdjacentElement('afterbegin', $imageSrc);
		$activitiesBlock.insertAdjacentElement('afterbegin', $imageBlock);
		$activitiesBlock.insertAdjacentElement('beforeend', $bodyBlock);

		if ($product?.reviews) {
			$reviewTxt.textContent = $product['reviews']['totalReviews']
				+ ' ' +  __('reviews', 'viator');
			insertRating($reviewBlock, Math.round(
				$product['reviews']['combinedAverageRating']),
			);
			$reviewBlock.insertAdjacentElement('beforeend', $reviewTxt);
		}

		$bodyBlock.insertAdjacentElement('beforeend', $titleBlock);
		$bodyBlock.insertAdjacentElement('beforeend', $reviewBlock);
		$bodyBlock.insertAdjacentElement('beforeend', $textBlock);
		$bodyBlock.insertAdjacentElement('beforeend', $priceBlock);

		$mainBlock.insertAdjacentElement('beforeend', $colBlock);
	}
};

const getDayOfWeek = (dateString) => {
	let date = new Date(dateString);
	let daysOfWeek = [
		'SUNDAY',
		'MONDAY',
		'TUESDAY',
		'WEDNESDAY',
		'THURSDAY',
		'FRIDAY',
		'SATURDAY'
	];
	return daysOfWeek[date.getDay()];
}

const getUnicDates = (season) => {
	let unavailableDates = season.unavailableDatesInTime;
	let keys = Object.keys(unavailableDates).filter(key => key !== 'length');
	let commonDates = [];

	for (let i = 0; i < keys.length - 1; i++) {
		let datesA = unavailableDates[keys[i]].dates;

		for (let j = i + 1; j < keys.length; j++) {
			let datesB = unavailableDates[keys[j]].dates;

			for (let dateA of datesA) {
				for (let dateB of datesB) {
					if (dateA === dateB && !commonDates.includes(dateA)) {
						commonDates.push(dateA);
					}
				}
			}
		}
	}


	return commonDates;
}

const findCommonDates = (season) => {
	let unavailableDates = season.unavailableDatesInTime;

	let keys = Object.keys(unavailableDates).filter(key => key !== 'length');
	let commonDates = [];

	if (keys.length === 0) {
		return commonDates;
	}
	//console.log('---');
	//console.log($unDatesRaw);
	//console.log(unavailableDates);

	let firstDates = unavailableDates[keys[0]].dates;

	for (let date of firstDates) {
		let isCommon = true;

		for (let i = 1; i < keys.length; i++) {
			let dates = unavailableDates[keys[i]].dates;

			if (!dates.includes(date)) {
				isCommon = false;
				break;
			}
		}

		if (isCommon) {
			commonDates.push(date);
		}
	}

	return commonDates;
}

const findDuplicateDates = (options) => {
	let dateCounts = {};
	let duplicateDates = [];

	for (let key in options) {
		let datesArray = options[key];
		for (let dateGroup of datesArray) {
			for (let date of dateGroup) {
				if (dateCounts[date]) {
					dateCounts[date]++;
				} else {
					dateCounts[date] = 1;
				}
			}
		}
	}

	for (let date in dateCounts) {
		if (dateCounts[date] > 1) {
			duplicateDates.push(date);
		}
	}

	return duplicateDates;
}

const filterResponse = (response) => {
	return response.data.data;
}

const fixedDate = (date = 1) => {

	if (date > 9) {
		return date;
	}

	let $arr = {
		1: '01',
		2: '02',
		3: '03',
		4: '04',
		5: '05',
		6: '06',
		7: '07',
		8: '08',
		9: '09',
	};

	return $arr[date];
}

const fixedMonth = (month = 0) => {
	let $arr = [
		'01',
		'02',
		'03',
		'04',
		'05',
		'06',
		'07',
		'08',
		'09',
		'10',
		'11',
		'12',
	];
	return $arr[month];
};

const isDateUnavailable = (timedEntry, selectedDate) => {

	return timedEntry.unavailableDates &&
		timedEntry.unavailableDates.some(unavailableDate => unavailableDate.date === selectedDate);
}

// Function to check if a selected date is within a particular season
const isDateWithinSeason = (season, selectedDate) => {

	// Initialize start and end flags as false
	let start = false,
		end = false;

	// If the selected date is on or after the season start date, set start flag to true
	if (new Date(selectedDate).getTime() >= new Date(season.startDate).getTime()) {
		start = true;
	}

	// If the selected date is on or before the season end date, or if no end date is specified, set end flag to true
	if (!season.endDate || new Date(selectedDate).getTime() <= new Date(season.endDate).getTime()) {
		end = true;
	}

	// Return true if both start and end flags are true, else return false
	return (start && end) ? true : false;

}


export {
	setLanguage,
	setCurrency,
	getNonce,
	getDestinations,
	getNameLanguage,
	getDest,
	getHomeUrl,
	isFullStorage,
	getPostId,
	getIconCurrency,
	insertSkeleton,
	scrollVisibleEl,
	updateStorage,
	setTimeHold,
	insertRating,
	insertSimilar,
	insertCardProducts,
	getDayOfWeek,
	getUnicDates,
	findCommonDates,
	findDuplicateDates,
	global_unavailableDates,
	filterResponse,
	fixedDate,
	fixedMonth,
	isDateUnavailable,
	isDateWithinSeason,
	useGeocode
};

