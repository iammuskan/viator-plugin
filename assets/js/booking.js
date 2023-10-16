'use strict';

import {global_unavailableDates, getDayOfWeek, getNonce} from './functions.js';

const $ = jQuery;

const {__, _x, _n, _nx} = wp.i18n;


const booking = ($type = 'viator', currency = '') => {

	let targetCurrency = localStorage.getItem('viatorCurrency') ?? viatorParameters?.default_currency;
	let $btnBooking = $('.ajax_add_to_cart');
	if ($btnBooking.length === 0) {
		return;
	}

	$btnBooking.on('click', function (evt) {
		evt.preventDefault();

		if (!vi_global_selected_date) {
			return;
		}

		let $meetSelect = $('.faq__item-meet-point .faq__item-meet-select');

		if (!$btnBooking.hasClass('active')) {
			return;
		}

		$btnBooking.removeClass('active');

		let $thumb;
		if (vi_global_product?.images) {
			let $imgVariants = vi_global_product.images[0]['variants'];
			$thumb = vi_global_product.images[0]['variants'][$imgVariants.length - 1].url;
		}

		let $action = 'save_woo_order_fields',
			$itemBox = $('.faq__item-price.active'),
			$isTimes = $('.faq__item-price-time input[type="radio"]'),
			$startTime = '';

		if ($itemBox.length) {
			$startTime = $itemBox.find('.faq__item-price-time input[type="radio"]:checked');
		}

		if ($isTimes.length && !$startTime.length) {
			$btnBooking.addClass('active');
			$('.excursion__aside').removeClass('active');
			$('body').removeClass('aside-active');
			alert(__('You need select start time!', 'viator'));
			return;
		}

		let $dataObj = {
			processData: false,
			cache: false,
			nonce: getNonce(),
			productCode: vi_global_product.productCode,
			travelDate: vi_global_selected_date,
			startTime: $startTime?.val(),
			paxMix: vi_order_members,
			language: sessionStorage.getItem('viatorLang'),
			pickup: {
				id: $meetSelect?.val(),
				name: $meetSelect?.find('option:selected').text(),
			},
			postData: {
				title: vi_global_product?.title,
				thumb: $thumb,
				link: window.location.pathname
			},
		};

		if ($itemBox.data('optionid') !== 'Option1') {
			$dataObj['optionCode'] = $itemBox.data('optionid');
		}

		jQuery.blockUI({
			message: null,
			overlayCSS: {
				background: '#fff',
			},
		});

		let $price = $('.faq__item-price.active .faq__item-price-total');

		if ($type === 'woo') {
			$dataObj['woo_price'] = $price?.data()?.price;
			$dataObj['targetCurrency'] = targetCurrency;

		}


		if ($type === 'viator') {
			$action = 'viator_hold_booking';
			$dataObj['convert_price'] = $price.data('price');
			$dataObj['current_total_usd'] = $price.data('price-usd');
			$dataObj['originalCurrency'] = vi_global_product.originalCurrency;//currency from viator
			$dataObj['currency'] = targetCurrency;
			$dataObj['locations'] = JSON.stringify(viatorSingleObj['locations']);
			$dataObj['postData']['bookingQuestions'] = vi_global_product?.bookingQuestions;
			

			$dataObj['allowCustomTravelerPickup'] = vi_global_product?.logistics?.travelerPickup?.allowCustomTravelerPickup;

			$dataObj['postData']['languageGuides'] = vi_global_product?.productOptions.reduce((acc, item) => {
				let option_key = item.productOptionCode ? item.productOptionCode : 'option1';

				if (option_key === $dataObj['optionCode']) {
					acc[option_key] = item.languageGuides ? item.languageGuides : vi_global_product?.languageGuides;
				}

				return acc;
			}, {});


			if (!Object.keys($dataObj['postData']['languageGuides']).length) {
				$dataObj['postData']['languageGuides']['option1'] = vi_global_product?.languageGuides;
			}

		}

		$('.aside-date').removeClass('active');
		$('.excursion__aside').removeClass('active');
		$('body').removeClass('aside-active');

		wp.ajax.send($action, {
			data: $dataObj,
			success: function (data) {
				jQuery.unblockUI();

				if ('undefined' === typeof wc_add_to_cart_params) {
					window.location = '/checkout/';
				}

				window.location = wc_add_to_cart_params.cart_url;
			},
			error: function (data) {
				jQuery.unblockUI();

				let $body = $('body'),
					$modalBok = $('#modal-booking');

				console.log(data);


				if (data) {
					$modalBok.find('.il-modal__content p').html(data);
				}

				$body.addClass('modal-open');
				$modalBok.addClass('active');
				$btnBooking.addClass('active');

				jQuery.unblockUI();

			},
		});

	});
};

export {booking}
