'use strict';
import {
	setLanguage,
	setCurrency,
} from './functions.js';

const { __, _x, _n, _nx } = wp.i18n;

setLanguage();
setCurrency();

let $linkCurrency = document.querySelector('.link_currency'),
	$linkCountry  = document.querySelector('.link_country');

$linkCurrency.addEventListener('click', function () {
	$linkCurrency.classList.toggle('active');

	if ($linkCurrency.classList.contains('active')) {
		window['viatorChooseCurrency'].select2('open');
	}
	else {
		window['viatorChooseCurrency'].select2('close');
	}
});

$linkCountry.addEventListener('click', function () {
	$linkCountry.classList.toggle('active');

	if ($linkCountry.classList.contains('active')) {
		window['viatorChooseLang'].select2('open');
	}
	else {
		window['viatorChooseLang'].select2('close');
	}
});

let $dataCountPeople = Number(sessionStorage.getItem('dataCountPeople'));

if (!$dataCountPeople){
	sessionStorage.setItem('dataCountPeople', '1');
}

(function () {
	if (document.body.classList.contains('woocommerce-cart') ||
		document.body.classList.contains('woocommerce-checkout')) {
		return;
	}

	window.addEventListener('load', function () {
		let cart = document.querySelector('.site-header a.link_basket');

		setTimeout(() => {
			let $cartImg = document.querySelector('.product_list_widget a .wp-post-image');

			if (typeof viatorSingleObj !== 'undefined' && viatorSingleObj?.cart_thumb && $cartImg) {
				$cartImg.setAttribute('src', viatorSingleObj['cart_thumb']);
				$cartImg.setAttribute('srcset', viatorSingleObj['cart_thumb']);
			}
		}, 1000);

		cart.addEventListener('mouseover', function () {
			let windowHeight  = window.outerHeight,
				cartBottomPos = this.querySelector('.widget_shopping_cart_content').getBoundingClientRect().bottom + this.offsetHeight,
				cartList      = this.querySelector('.cart_list');

			if (cartBottomPos > windowHeight) {
				cartList.style.maxHeight = '15em';
				cartList.style.overflowY = 'auto';
			}
		});
	});
}());
