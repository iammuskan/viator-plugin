'use strict';

import {
	global_unavailableDates,
	getDayOfWeek,
	getPostId,
	insertRating,
	getNonce,
	getNameLanguage,
	filterResponse,
	updateStorage,
	fixedDate,
	fixedMonth,
	useGeocode
} from './functions.js';

const {__, _x, _n, _nx} = wp.i18n;

const $ = jQuery;

const daysOfWeek = {};
let selectDate = '';

const $dateLoad = $('.aside-date-loaded');
const $asideDate = $('.aside-date');

const viatorLang = sessionStorage.getItem('viatorLang');
const viatorCurrency = localStorage.getItem('viatorCurrency') ?? viatorParameters?.default_currency;

const getAilability = async (id) => {

	// get availability
	let availability = filterResponse(
		await axios({
			method: 'POST',
			data: new URLSearchParams({
				action: 'availability_product',
				id: id,
				targetCurrency: viatorCurrency,
			}),
			url: '/wp-admin/admin-ajax.php',
		})
	);

	let currency = availability.currency,//currency from viator
		$unDatesRaw = [];

	$dateLoad.addClass('d-none');
	$asideDate.removeClass('d-none');

	return {
		"items": availability.bookableItems,
		"originalCurrency": availability.currency,
		"rates": availability.rates
	};

}

const insertProduct = ($wrapper, product) => {
	
	console.log(product);

	let $cntBlock = $wrapper.querySelector('.excursion__content'),
		$infoBox = document.createElement('div');

	$cntBlock.innerHTML = '';
	$wrapper.classList.remove('skeleton-init');
	$infoBox.classList.add('row');
	$infoBox.classList.add('align-items-center');
	$infoBox.classList.add('excursion__info');

	let productSlider = () => {
		let $data = {images: []},
			$template = wp.template('productSlider'),
			$sliderBox = document.querySelector('.excursion__slider');

		$sliderBox.innerHTML = '';

		for (let $cntImage of product['images']) {
			if ($data['images'].length === 8) {
				break;
			}

			if ($cntImage?.variants) {
				$data['images'].push({
					alt: $cntImage?.caption || 'cover',
					src: $cntImage['variants'][0]['url']
				});
			}
		}

		$sliderBox.insertAdjacentHTML('beforeend', $template($data));

		//init slider
		jQuery('.excursion__slider-main').slick({
			slidesToShow: 1,
			slidesToScroll: 1,
			arrows: false,
			fade: true,
			autoplay: true,
			autoplaySpeed: 10000,
			asNavFor: '.excursion__slider-nav',
		});
		jQuery('.excursion__slider-nav').slick({
			slidesToShow: 2,
			slidesToScroll: 1,
			asNavFor: '.excursion__slider-main',
			dots: true,
			dotsClass: 'pagination pagination_min pagination_slick',
			centerMode: true,
			vertical: true,
			centerPadding: '0',
			appendArrows: '.excursion__slider-arrows',
			appendDots: '.excursion__slider-arrows',
			prevArrow: '<button type="button" class="slick-prev"></button>',
			nextArrow: '<button type="button" class="slick-next"></button>',
			responsive: [
				{
					breakpoint: 991,
					settings: {
						vertical: false,
						slidesToShow: 5,
						centerPadding: '50px',
					}
				},
				{
					breakpoint: 767,
					settings: {
						vertical: false,
						slidesToShow: 4,
						centerPadding: '35px',
					}
				},

			]
		});
	};
	let tags = () => {
		if (!product?.tags) {
			return;
		}

		let $template = wp.template('singleTags'),
			$data = {
				tags: [],
			};

		if (!viatorSingleObj['post_id']) {
			let $viatorLang = sessionStorage.getItem('viatorLang') ?? 'en',
				$viatorTags = JSON.parse(localStorage.getItem('viatorTags'));

			if ($viatorTags) {

				for (let $tag of product['tags']) {
					for (const $vTag of $viatorTags) {
						if (Number($tag) === Number($vTag['tagId'])) {
							$data['tags'].push($vTag['allNamesByLocale'][$viatorLang]);
						}
					}
				}
			}
		} else {
			$data['tags'] = product['tags'];
		}


		$cntBlock.insertAdjacentHTML('beforeend', $template($data));
	};
	let title = () => {
		let $template = wp.template('singleTitle'),
			$siteTitle = document.querySelector('title');

		$siteTitle.textContent = product['title'];
		$cntBlock.insertAdjacentHTML('beforeend', $template({title: product['title']}));
	};
	let info1 = ($infoBox) => {
		let $colLeft = document.createElement('div'),
			$colRight, // Declare $colRight here without creating it yet
			$reviewBlock = document.createElement('div'),
			$reviewTxt = document.createElement('span'),
			$lanBlock = document.createElement('div'),
			$lanSpan = document.createElement('span'),
			$lanFlag = document.createElement('img');

		$colLeft.classList.add('col-xl-5');
		$colLeft.classList.add('col-sm-6');
		$colLeft.classList.add('excursion__info-wrap');

		$reviewBlock.classList.add('review');
		$reviewTxt.classList.add('review__text');

		$lanBlock.classList.add('d-flex');
		$lanBlock.classList.add('align-items-center');
		$lanBlock.classList.add('excursion__language');

		$lanSpan.classList.add('excursion__language-icon');

		if (product?.reviews) {
			$infoBox.insertAdjacentElement('beforeend', $colLeft);
			$colLeft.insertAdjacentElement('beforeend', $reviewBlock);

			$reviewTxt.textContent = product['reviews']['totalReviews'] + ' ' + __('reviews', 'viator');

			insertRating($reviewBlock,
				Math.round(product['reviews']['combinedAverageRating']),
			);
			$reviewBlock.insertAdjacentElement('beforeend', $reviewTxt);
		}

		if (shouldCreateLanguageColumn(product)) { // Replace shouldCreateLanguageColumn with your condition
			$colRight = document.createElement('div'); // Create $colRight if the condition is met
			$colRight.classList.add('col-xl-5');
			$colRight.classList.add('col-sm-6');
			$colRight.classList.add('excursion__info-wrap');

			$infoBox.insertAdjacentElement('beforeend', $colRight);
			$colRight.insertAdjacentElement('beforeend', $lanBlock);
			$lanBlock.textContent = __(getNameLanguage(product['language']), 'viator');

			$lanBlock.insertAdjacentElement('afterbegin', $lanSpan);
			$lanSpan.insertAdjacentElement('beforeend', $lanFlag);
		}

		// Define your condition function
		function shouldCreateLanguageColumn(product) {
			return 0; // hide language
		}

		if (product?.language) {
			$lanFlag.setAttribute('src',
				`${window.location.origin}/wp-content/plugins/viator/assets/img/flags/${product['language']}.png`,
			);
			$lanFlag.setAttribute('alt', `flag ${product['language']}`);
		}
	};
	let info2 = ($infoBox) => {
		let $colLeft = document.createElement('div'),
			$colRight = document.createElement('div'),
			$cancelBlock = document.createElement('div'),
			$cancelSpan = document.createElement('span'),
			$cancelImg = document.createElement('img');

		if (product?.itinerary?.duration?.fixedDurationInMinutes) {
			$colLeft.classList.add('col-xl-5');
			$colLeft.classList.add('col-sm-6');
			$colLeft.classList.add('excursion__info-wrap');
			$colLeft.classList.add('tsetOne');

			let $durationBlock = document.createElement('div'),
				$durationSpan = document.createElement('span'),
				$durationImg = document.createElement('img'),
				$duration = Number(product['itinerary']['duration']['fixedDurationInMinutes']) / 60;

			if (!Number.isInteger($duration)) {
				$duration = $duration.toFixed(2);
			}

			$durationBlock.classList.add('d-flex');
			$durationBlock.classList.add('align-items-center');
			$durationBlock.classList.add('excursion__info-item');
			$durationBlock.classList.add('excursion-grey');
			$durationSpan.classList.add('excursion__duration-icon');

			$durationBlock.textContent = ` ${$duration} ${__('hours', 'viator')}`;
			$durationImg.setAttribute('src',
				`${window.location.origin}/wp-content/plugins/viator/assets/img/icons/icon-clock.svg`,
			);
			$durationImg.setAttribute('alt', 'clock');

			$durationSpan.insertAdjacentElement('beforeend', $durationImg);
			$durationBlock.insertAdjacentElement('afterbegin', $durationSpan);
			$colLeft.insertAdjacentElement('beforeend', $durationBlock);
			$infoBox.insertAdjacentElement('beforeend', $colLeft);
		}

		if (product?.cancellationPolicy?.type !== 'ALL_SALES_FINAL') {
			$colRight.classList.add('col-xl-5');
			$colRight.classList.add('col-sm-6');
			$colRight.classList.add('excursion__info-wrap');
			$colRight.classList.add('tsetTwo');
			$cancelBlock.classList.add('d-flex');
			$cancelBlock.classList.add('align-items-center');
			$cancelBlock.classList.add('excursion__info-item');
			$cancelBlock.classList.add('excursion-green');
			$cancelBlock.setAttribute('title', __('Up to 24 hours in advance.', 'viator'));
			$cancelSpan.classList.add('excursion__cancellation-icon');
			$cancelBlock.textContent = __('Free cancellation', 'viator');
			$cancelImg.setAttribute('src',
				`${window.location.origin}/wp-content/plugins/viator/assets/img/icons/icon-check.svg`,
			);
			$cancelImg.setAttribute('alt', 'check');

			$cancelSpan.insertAdjacentElement('beforeend', $cancelImg);
			$cancelBlock.insertAdjacentElement('afterbegin', $cancelSpan);

			$colRight.insertAdjacentElement('beforeend', $cancelBlock);
			$infoBox.insertAdjacentElement('beforeend', $colRight);
		}
	};
	let infoPickup = ($infoBox) => {
		let $item = document.createElement('div'),
			$itemWrap = document.createElement('div'),
			$itemSpan = document.createElement('span'),
			$itemImg = document.createElement('img');

		$item.classList.add('col-xl-5');
		$item.classList.add('col-sm-6');
		$item.classList.add('excursion__info-wrap');

		$itemWrap.classList.add('d-flex');
		$itemWrap.classList.add('align-items-center');
		$itemWrap.classList.add('excursion__info-item');
		$itemWrap.classList.add('excursion-green');
		$itemSpan.classList.add('excursion__cancellation-icon');

		$itemWrap.textContent = __('Pickup offered', 'viator');

		$itemImg.setAttribute('src',
			`${window.location.origin}/wp-content/plugins/viator/assets/img/icons/icon-check.svg`,
		);
		$itemImg.setAttribute('alt', 'check');

		$itemSpan.insertAdjacentElement('beforeend', $itemImg);
		$itemWrap.insertAdjacentElement('afterbegin', $itemSpan);
		$item.insertAdjacentElement('beforeend', $itemWrap);
		$infoBox.insertAdjacentElement('beforeend', $item);
	};
	let infoTicket = ($infoBox) => {
		let $ticket = product['ticketInfo']['ticketTypes'],
			$ticketTxt = __('Mobile ticket', 'viator');

		if ($ticket.length > 1) {
			$ticketTxt = 'Mobile and paper ticket';
		} else {
			if ($ticket[0] === 'PAPER') {
				$ticketTxt = 'Paper ticket';
			}
		}

		let $item = document.createElement('div'),
			$itemWrap = document.createElement('div'),
			$itemSpan = document.createElement('span'),
			$itemImg = document.createElement('img');

		$item.classList.add('col-xl-5');
		$item.classList.add('col-sm-6');
		$item.classList.add('excursion__info-wrap');

		$itemWrap.classList.add('d-flex');
		$itemWrap.classList.add('align-items-center');
		$itemWrap.classList.add('excursion__info-item');
		$itemWrap.classList.add('excursion-green');
		$itemSpan.classList.add('excursion__cancellation-icon');

		$itemWrap.textContent = $ticketTxt;

		$itemImg.setAttribute('src',
			`${window.location.origin}/wp-content/plugins/viator/assets/img/icons/icon-check.svg`,
		);
		$itemImg.setAttribute('alt', 'check');

		$itemSpan.insertAdjacentElement('beforeend', $itemImg);
		$itemWrap.insertAdjacentElement('afterbegin', $itemSpan);
		$item.insertAdjacentElement('beforeend', $itemWrap);
		$infoBox.insertAdjacentElement('beforeend', $item);
	};
	let content = () => {
		let $descBlock = document.createElement('div'),
			$cntArrowUp = '<span class="d-block d-lg-none faq__item-icon-arrow"><svg width="16" height="8" viewBox="0 0 16 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.00003 8C7.81403 8 7.62785 7.93483 7.48585 7.80467L0.213136 1.13804C-0.0710453 0.877537 -0.0710453 0.455706 0.213136 0.195374C0.497317 -0.064958 0.957498 -0.0651247 1.2415 0.195374L8.00003 6.39068L14.7586 0.195374C15.0428 -0.0651247 15.5029 -0.0651247 15.7869 0.195374C16.0709 0.455873 16.0711 0.877703 15.7869 1.13804L8.51422 7.80467C8.37222 7.93483 8.18603 8 8.00003 8Z" fill="#0C498A" /></svg></span>',
			$cntArrowDown = '<span class="faq__item-icon-arrow"><svg width="16" height="8" viewBox="0 0 16 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.00003 8C7.81403 8 7.62785 7.93483 7.48585 7.80467L0.213136 1.13804C-0.0710453 0.877537 -0.0710453 0.455706 0.213136 0.195374C0.497317 -0.064958 0.957498 -0.0651247 1.2415 0.195374L8.00003 6.39068L14.7586 0.195374C15.0428 -0.0651247 15.5029 -0.0651247 15.7869 0.195374C16.0709 0.455873 16.0711 0.877703 15.7869 1.13804L8.51422 7.80467C8.37222 7.93483 8.18603 8 8.00003 8Z" fill="#0C498A" /></svg></span>';

		let reviewsHandler = function () {
			if (!!this.parentNode.classList.contains('review-ajax-init')) {
				return;
			}

			let $reviewsItemBody = document.createElement('div'),
				$reviewsParag = '<p><svg role="img" width="680" height="220" aria-labelledby="loading-aria" viewBox="0 50 476 218" preserveAspectRatio="none" ><rect x="0" y="0" width="100%" height="100%" clip-path="url(#clip-path)" style=\'fill: url("#fill");\' ></rect><defs><clipPath id="clip-path"><rect x="0" y="50" rx="0" ry="0" width="476" height="20"/><rect x="0" y="74" rx="0" ry="0" width="440" height="20"/><rect x="0" y="98" rx="0" ry="0" width="308" height="20"/><rect x="0" y="122" rx="0" ry="0" width="320" height="20"/><rect x="0" y="146" rx="0" ry="0" width="420" height="20"/><rect x="0" y="170" rx="0" ry="0" width="280" height="20"/><rect x="0" y="194" rx="0" ry="0" width="220" height="20"/><rect x="0" y="218" rx="0" ry="0" width="290" height="20"/></clipPath><linearGradient id="fill"><stop offset="0.599964" stop-color="#dddbdd" stop-opacity="1" ><animate attributeName="offset" values="-2; -2; 1" keyTimes="0; 0.25; 1" dur="2s" repeatCount="indefinite" ></animate></stop><stop offset="1.59996" stop-color="#ecebeb" stop-opacity="1" ><animate attributeName="offset" values="-1; -1; 2" keyTimes="0; 0.25; 1" dur="2s"repeatCount="indefinite" ></animate></stop><stop offset="2.59996" stop-color="#dddbdd" stop-opacity="1"><animate attributeName="offset" values="0; 0; 3" keyTimes="0; 0.25; 1" dur="2s" repeatCount="indefinite"></animate></stop></linearGradient></defs></svg></p>';

			this.parentNode.classList.add('review-ajax-init');
			$reviewsItemBody.classList.add('faq__item-body');

			$reviewsItemBody.insertAdjacentHTML('beforeend', $reviewsParag);
			this.parentNode.insertAdjacentElement('beforeend', $reviewsItemBody,);

			insertReview($reviewsItemBody);
		};
		let insertReview = async ($itemBody) => {
			let $dataForSend = {
				action: 'get_reviews',
				id: getPostId(),
				language: sessionStorage.getItem('viatorLang'),
			};

			try {
				let $result = await axios({
					method: 'POST',
					data: new URLSearchParams($dataForSend),
					url: '/wp-admin/admin-ajax.php',
				});

				$result = $result['data'];

				if ($result?.data?.reviews && $result?.data?.totalReviewsSummary?.totalReviews) {
					$itemBody.innerHTML = '';

					for (const $review of $result['data']['reviews']) {
						let $item = document.createElement('div'),
							$title = document.createElement('h5'),
							$p = document.createElement('p');

						$item.classList.add('review-in-cnt');
						$title.textContent = $review['title'];
						$p.textContent = $review['text'];

						$item.insertAdjacentElement('beforeend', $title);
						$item.insertAdjacentElement('beforeend', $p);
						$itemBody.insertAdjacentElement('beforeend', $item);
					}
				} else {
					$itemBody.innerHTML = '<p>There are no reviews yet</p>';
					console.log('Problem! Something happened');
				}

			} catch (error) {
				console.info(error);
			}
		};

		let desc = () => {
			let $descItem = document.createElement('div'),
				$descHeader = document.createElement('div'),
				$descItemBody = document.createElement('div'),
				$descParag = document.createElement('p');

			$descItem.classList.add('faq__item');
			$descItem.classList.add('active');
			$descItem.classList.add('description');
			$descHeader.classList.add('faq__item-header');
			$descItemBody.classList.add('faq__item-body');
			$descItemBody.classList.add('test');

			$descHeader.textContent = __('Description', 'viator');
			$descHeader.insertAdjacentHTML('afterbegin', $cntArrowUp);
			$descHeader.insertAdjacentHTML('beforeend', $cntArrowDown);

			$descParag.innerHTML = product['description'].replace(/\n\n/gi,
				'<br><br>',
			);
			$descParag.innerHTML = product['description'].replace(/\n/gi,
				'<br>',
			);

			$descItem.insertAdjacentElement('beforeend', $descHeader);
			$descItem.insertAdjacentElement('beforeend', $descItemBody);
			$descItemBody.insertAdjacentElement('beforeend', $descParag);
			$descBlock.insertAdjacentElement('afterbegin', $descItem);
		};


		let detail = () => {
			let $detailItem = document.createElement('div'),
				$detailHeader = document.createElement('div'),
				$detailBody = document.createElement('div');

			$detailItem.classList.add('faq__item');
			$detailHeader.classList.add('faq__item-header');
			$detailBody.classList.add('faq__item-body');

			$detailHeader.textContent = __('Details', 'viator');
			$detailHeader.insertAdjacentHTML('afterbegin', $cntArrowUp);
			$detailHeader.insertAdjacentHTML('beforeend', $cntArrowDown);

			$detailItem.insertAdjacentElement('beforeend', $detailHeader);
			$detailItem.insertAdjacentElement('beforeend', $detailBody);
			$descBlock.insertAdjacentElement('beforeend', $detailItem);

			return $detailBody;
		};
		let detailIncluded = (detailWrap) => {
			let $detailTitle = document.createElement('h5'),
				$detailUl = document.createElement('ul');

			$detailUl.classList.add('faq__item-list');
			$detailUl.classList.add('faq__details');

			$detailTitle.textContent = __('What\'s Included', 'viator');

			if (product?.inclusions) {
				for (let $include of product['inclusions']) {
					if ($include?.description || $include?.otherDescription) {
						let $item = document.createElement('li'),
							$description = $include['description'] ?? $include['otherDescription'];

						$item.classList.add('faq__detail');
						$item.classList.add('faq__detail-pass');
						$item.textContent = $description;
						$detailUl.insertAdjacentElement('beforeend', $item);
					}
				}
			}

			if (product?.exclusions) {
				for (let $excl of product['exclusions']) {
					if ($excl?.description || $excl?.otherDescription) {
						let $item = document.createElement('li'),
							$description = $excl['description'] ?? $excl['otherDescription'];

						$item.classList.add('faq__detail');
						$item.classList.add('faq__detail-off');
						$item.textContent = $description;
						$detailUl.insertAdjacentElement('beforeend', $item);
					}
				}
			}

			detailWrap.insertAdjacentElement('beforeend', $detailTitle);
			detailWrap.insertAdjacentElement('beforeend', $detailUl);
		};
		let detailAdditionalInfo = (detailWrap) => {
			if (product['additionalInfo'] === undefined) {
				return;
			}

			let $boxTitle = document.createElement('h5'),
				$boxUl = document.createElement('ul'),
				$p = document.createElement('p');

			$boxUl.classList.add('faq__item-list');

			$boxTitle.textContent = __('Additional Info', 'viator');
			$p.innerHTML = __('Operated by', 'viator') + ` <span class="faq__item-supplier">${product['supplier']['name']}</span>`;

			for (let $item of product['additionalInfo']) {
				let $list = document.createElement('li');

				$list.textContent = $item['description'];

				$boxUl.insertAdjacentElement('beforeend', $list);
			}

			detailWrap.insertAdjacentElement('beforeend', $boxTitle);
			detailWrap.insertAdjacentElement('beforeend', $boxUl);
			detailWrap.insertAdjacentElement('beforeend', $p);
		};
		let cancel = () => {
			let $cancelItem = document.createElement('div'),
				$cancelHeader = document.createElement('div'),
				$cancelBody = document.createElement('div'),
				$cancelList = document.createElement('ul');

			$cancelItem.classList.add('faq__item');
			$cancelHeader.classList.add('faq__item-header');
			$cancelBody.classList.add('faq__item-body');
			$cancelList.classList.add('faq__item-list');
			$cancelList.classList.add('faq__cancel-list');

			$cancelHeader.textContent = __('Cancellations', 'viator');
			$cancelHeader.insertAdjacentHTML('afterbegin', $cntArrowUp);
			$cancelHeader.insertAdjacentHTML('beforeend', $cntArrowDown);

			if (product?.cancellationPolicy?.description) {
				let _cancelDesc = product['cancellationPolicy']['description'];

				if (_cancelDesc.indexOf('<br>') !== -1) {
					for (let cancelDescElement of _cancelDesc.split('<br>')) {
						let $cancelDescPart = document.createElement('li');
						$cancelDescPart.textContent = cancelDescElement;
						$cancelList.insertAdjacentElement('beforeend', $cancelDescPart,
						);
					}
				} else {
					let $cancelDesc = document.createElement('li');
					$cancelDesc.textContent = product['cancellationPolicy']['description'];
					$cancelList.insertAdjacentElement('beforeend', $cancelDesc);
				}
			}

			if (product?.cancellationPolicy?.refundEligibility) {
				let $dayRangeMin = product['cancellationPolicy']['refundEligibility'][0]['dayRangeMin'],
					$refund1 = document.createElement('li'),
					$refund2 = document.createElement('li');

				$refund1.textContent = sprintf(
					__('If you cancel less than %d full days before the experience\'s start time, the amount you paid will not be refunded.', 'viator'),
					$dayRangeMin
				);
				$refund2.textContent = sprintf(
					__('Any changes made less than %d full days before the experience\'s start time will not be accepted.', 'viator'),
					$dayRangeMin
				);

				$cancelList.insertAdjacentElement('beforeend', $refund1);
				$cancelList.insertAdjacentElement('beforeend', $refund2);
			}

			if (product?.cancellationPolicy?.cancelIfBadWeather) {
				let $cancelWeather = document.createElement('li');

				$cancelWeather.textContent = __(
					'This experience requires good weather. If it’s canceled due to poor weather, you’ll be offered a different date or a full refund.',
					'viator'
				);
				$cancelList.insertAdjacentElement('beforeend', $cancelWeather);
			}
			if (product?.cancellationPolicy?.cancelIfInsufficientTravelers) {
				let $cancelInsuf = document.createElement('li');
				$cancelInsuf.textContent = __(
					'This experience requires a minimum number of travelers. If it’s canceled because the minimum isn’t met, you’ll be offered a different date/experience or a full refund.',
					'viator'
				);
				$cancelList.insertAdjacentElement('beforeend', $cancelInsuf);
			}

			$cancelList.insertAdjacentHTML('beforeend',
				'<li>' + __('Cut-off times are based on the experience’s local time.', 'viator') + '</li>',
			);

			$cancelBody.insertAdjacentElement('beforeend', $cancelList);
			$cancelItem.insertAdjacentElement('beforeend', $cancelHeader);
			$cancelItem.insertAdjacentElement('beforeend', $cancelBody);
			$descBlock.insertAdjacentElement('beforeend', $cancelItem);
		};
		let meet = () => {
			let $meetItem = document.createElement('div'),
				$meetHeader = document.createElement('div'),
				$meetItemBody = document.createElement('div');

			$meetItem.classList.add('faq__item');
			$meetItem.classList.add('faq__item-meet-point');
			$meetItem.classList.add('d-none');
			$meetHeader.classList.add('faq__item-header');
			$meetItemBody.classList.add('faq__item-body');

			$meetHeader.textContent = __('Meeting point', 'viator');
			$meetHeader.insertAdjacentHTML('afterbegin', $cntArrowUp);
			$meetHeader.insertAdjacentHTML('beforeend', $cntArrowDown);

			if (product?.itinerary?.activityInfo?.description !== undefined) {
				let $activityInfoDEsc = document.createElement('p');
				$activityInfoDEsc.textContent = product['itinerary']['activityInfo']['description'];
				$meetItemBody.insertAdjacentElement('beforeend', $activityInfoDEsc);
			}

			$meetItem.insertAdjacentElement('beforeend', $meetHeader);
			$meetItem.insertAdjacentElement('beforeend', $meetItemBody);
			$descBlock.insertAdjacentElement('beforeend', $meetItem);


			if (product?.type !== 'woo') {
				viatorSingleObj['locations'] = {};
				viatorSingleObj['allowed_loc_types'] = [];

				let $returnDetails = false,
					$locIds = {'locations': []},
					$locStart = {};

				if (product?.logistics?.start) {
					for (let $logisticStart of product['logistics']['start']) {
						$locStart[$logisticStart['location']['ref']] = '';
						$locIds['locations'].push($logisticStart['location']['ref']);
					}
				}
				if (product?.logistics?.end) {
					for (let $logisticEnd of product['logistics']['end']) {
						if ($locStart.hasOwnProperty($logisticEnd['location']['ref'])) {
							$returnDetails = true;
						}

						$locIds['locations'].push($logisticEnd['location']['ref']);
					}
				}
				if (product?.logistics?.travelerPickup?.locations) {
					for (let $logisticsLoc of product['logistics']['travelerPickup']['locations']) {

						if ($logisticsLoc['location']['ref'] !== 'CONTACT_SUPPLIER_LATER') {
							viatorSingleObj['allowed_loc_types'].push($logisticsLoc['pickupType']);

							viatorSingleObj['locations'][$logisticsLoc['location']['ref']] = {
								type: $logisticsLoc['pickupType']
							};
						}

						$locIds['locations'].push($logisticsLoc['location']['ref']);
					}
				}

				if ($returnDetails) {
					let $returnDetailsTxt = '<h5>' + __('Return Details', 'viator') + '</h5>' + '<p>' + __('This activity will end right where it started', 'viator') + '</p>';
					$meetItemBody.insertAdjacentHTML('beforeend', $returnDetailsTxt);
				}

				if ($locIds['locations'].length) {

					wp.ajax.send('get_locations', {
						data: {
							nonce: getNonce(),
							productCode: product['productCode'],
							locations: $locIds['locations'],
							language: sessionStorage.getItem('viatorLang'),
						},
						success: async function (data) {
							//console.log('locations', data);

							if (data?.locations) {
								let $optionHTML = '',
									// $departurePoints = [],
									$select = document.createElement('select');


								for (let $location of data['locations']) {
									if (viatorSingleObj['gmap_key'] && $location['provider'] === 'GOOGLE') {
										try {
											let $googlePlace = await useGeocode($location['providerReference']);

											if ($googlePlace.status === 'OK') {
												if (viatorSingleObj['locations'][$location['reference']]) {
													viatorSingleObj['locations'][$location['reference']]['name'] = $googlePlace['results'][0]['formatted_address'];
												}

												$optionHTML += `<option value="${$location['reference']}">${$googlePlace['results'][0]['formatted_address']}</option>`;
											}
										} catch (e) {
											console.error('ERROR in: ', e.message);
										}
									}

									if ($location['reference'] !== 'CONTACT_SUPPLIER_LATER' && $location['provider'] !== 'GOOGLE') {
										if (viatorSingleObj['locations'][$location['reference']]) {
											viatorSingleObj['locations'][$location['reference']]['name'] = $location['name'];
										}
										$optionHTML += `<option value="${$location['reference']}">${$location['name']}</option>`;
									}
								}

								if ($optionHTML) {
									//console.log('optionHTML', data?.locations, $optionHTML);
									let $pDetails = `<h5>${__('Pickup Details', 'viatorCore')}</h5><p title="Is required">${__('Possible departure locations*', 'viatorCore')}</p>`;

									$meetItemBody.insertAdjacentHTML('beforeend', $pDetails);

									if (data?.locations?.length > 1){
										$select.insertAdjacentHTML('beforeend',
											`<option value="">${__('View departure locations', 'viatorCore')} 1</option>`
										);
									}

									$select.setAttribute('required', 'required');
									$select.setAttribute('title', 'Is required');
									$select.setAttribute('autocomplete', 'off');
									$select.classList.add('faq__item-meet-select');

									$select.insertAdjacentHTML('beforeend', $optionHTML);
									$meetItemBody.insertAdjacentElement('beforeend', $select);
								}

								//Checked Meeting point
								if ($meetItemBody.innerHTML !== '') {
									$meetItem.classList.remove('d-none');
								}
							}

						},
						error: function (data) {
							console.error('error', data);
						},
					});
				}
			}


		};
		let reviews = () => {
			if (product?.type === 'woo') {
				return;
			}
			let $reviewsItem = document.createElement('div'),
				$reviewsHeader = document.createElement('div');

			$reviewsItem.classList.add('faq__item');
			$reviewsItem.classList.add('reviews-in-cnt');
			$reviewsHeader.classList.add('faq__item-header');

			$reviewsHeader.textContent = __('Reviews', 'viator');
			$reviewsHeader.insertAdjacentHTML('afterbegin', $cntArrowUp);
			$reviewsHeader.insertAdjacentHTML('beforeend', $cntArrowDown);

			$reviewsItem.insertAdjacentElement('beforeend', $reviewsHeader);
			$descBlock.insertAdjacentElement('beforeend', $reviewsItem);

			$reviewsHeader.addEventListener('click', reviewsHandler);
		};
		let scheduls = () => {
			let $schedulsItem = document.createElement('div'),
				$schedulsHeader = document.createElement('div'),
				$schedulsItemBody = document.createElement('div');

			$schedulsItem.classList.add('faq__item');
			$schedulsItem.classList.add('faq__item-schedul');
			$schedulsHeader.classList.add('faq__item-header');
			$schedulsItemBody.classList.add('faq__item-body');

			$schedulsHeader.textContent = __('Schedules', 'viator');
			$schedulsHeader.insertAdjacentHTML('afterbegin', $cntArrowUp);
			$schedulsHeader.insertAdjacentHTML('beforeend', $cntArrowDown);

			$schedulsItem.insertAdjacentElement('beforeend', $schedulsHeader);
			$schedulsItem.insertAdjacentElement('beforeend', $schedulsItemBody);
			$descBlock.insertAdjacentElement('beforeend', $schedulsItem);


			//START Itinerary
			if (product?.itinerary?.itineraryItems &&
				(product['itinerary']['itineraryItems'][0]['name'] ||
					product['itinerary']['itineraryItems'][0]['description'] ||
					product['itinerary']['itineraryItems'][0]['duration'])) {
				let $itineraryItems = product['itinerary']['itineraryItems'],
					$itineraryTitle = document.createElement('h5'),
					$itineraryBox = document.createElement('div');

				$itineraryBox.classList.add('list-group');
				$itineraryBox.classList.add('mb-4');
				$itineraryTitle.textContent = __('Itinerary', 'viator');

				$schedulsItemBody.insertAdjacentElement('beforeend', $itineraryTitle);
				$schedulsItemBody.insertAdjacentElement('beforeend', $itineraryBox);


				for (let $itineraryItem of $itineraryItems) {
					let $itineraryItemBox = document.createElement('div'),
						$itineraryItemWrap = document.createElement('div'),
						$itineraryItemName = document.createElement('h5'),
						$itineraryItemTxt = document.createElement('p'),
						$itineraryItemTicket = document.createElement('small');

					if (product?.type !== 'woo') {
						$itineraryItemBox.setAttribute('data-id',
							$itineraryItem?.pointOfInterestLocation['location']['ref']
						);
						$itineraryItemBox.classList.add('list-group-item');
						$itineraryItemBox.classList.add('list-group-item-action');

						$itineraryItemName.classList.add('skeleton-loader');
					} else {
						$itineraryItemName.textContent = $itineraryItem['name'];
					}

					$itineraryItemWrap.classList.add('d-flex');
					$itineraryItemWrap.classList.add('w-100');
					$itineraryItemWrap.classList.add('justify-content-between');
					$itineraryItemTxt.classList.add('mb-1');
					$itineraryItemName.classList.add('mb-1');

					$itineraryItemTxt.innerHTML = $itineraryItem['description'].replace(/\n/gi, '<br>');

					if ($itineraryItem['admissionIncluded'] === 'YES') {
						$itineraryItemTicket.textContent = __('Admission Ticket Included', 'viator');
					}
					if ($itineraryItem['admissionIncluded'] === 'NO') {
						$itineraryItemTicket.textContent = __('Admission Ticket Not Included', 'viator');
					}

					$itineraryBox.insertAdjacentElement('beforeend', $itineraryItemBox);
					$itineraryItemBox.insertAdjacentElement('beforeend', $itineraryItemWrap);
					$itineraryItemWrap.insertAdjacentElement('beforeend', $itineraryItemName);


					if ($itineraryItem?.duration?.fixedDurationInMinutes) {
						let $duration = Number($itineraryItem['duration']['fixedDurationInMinutes']) / 60,
							$itineraryItemDur = document.createElement('small');

						$duration = $duration.toFixed(2);

						$itineraryItemDur.textContent = __('Duration', 'viator') + ': ' + sprintf(
							__('%s hours', 'viator'),
							$duration
						);
						$itineraryItemWrap.insertAdjacentElement('beforeend', $itineraryItemDur);
					}

					$itineraryItemBox.insertAdjacentElement('beforeend', $itineraryItemTxt);

					if ($itineraryItemTicket.textContent) {
						$itineraryItemBox.insertAdjacentElement('beforeend', $itineraryItemTicket);
					}
				}
			}
			//END Itinerary

			//START Pickup Time
			if (product?.logistics?.travelerPickup?.minutesBeforeDepartureTimeForPickup) {
				let $timeForPickupTitle = document.createElement('h5'),
					$timeForPickupTxt = document.createElement('p');

				$timeForPickupTitle.textContent = __('Pickup Time', 'viator');
				$timeForPickupTxt.textContent = `Please arrive ${product['logistics']['travelerPickup']['minutesBeforeDepartureTimeForPickup']} minutes before your selected start time for pickup. Your operator can coordinate exact time and location.`;

				$schedulsItemBody.insertAdjacentElement('beforeend', $timeForPickupTitle);
				$schedulsItemBody.insertAdjacentElement('beforeend', $timeForPickupTxt);

			} else if (product?.logistics?.travelerPickup?.pickupOptionType === 'PICKUP_EVERYONE' ||
				product?.logistics?.travelerPickup?.pickupOptionType === 'PICKUP_AND_MEET_AT_START_POINT') {
				let $timeForPickupTitle = document.createElement('h5'),
					$timeForPickupTxt = document.createElement('p');

				$timeForPickupTitle.textContent = __('Pickup Time', 'viator');
				$timeForPickupTxt.textContent = __('After booking, the operator will contact you about pickup time.',
					'viator'
				);

				$schedulsItemBody.insertAdjacentElement('beforeend', $timeForPickupTitle);
				$schedulsItemBody.insertAdjacentElement('beforeend', $timeForPickupTxt);
			}
			//END Pickup Time

			//START Pickup Note
			if (product?.logistics?.travelerPickup?.additionalInfo) {
				let $additionalInfoTitle = document.createElement('h5'),
					$additionalInfoTxt = document.createElement('p');

				$additionalInfoTitle.textContent = __('Please Note', 'viator');
				$additionalInfoTxt.innerHTML = product['logistics']['travelerPickup']['additionalInfo'].replace(
					/\n/gi, '<br>');

				$schedulsItemBody.insertAdjacentElement('beforeend', $additionalInfoTitle);
				$schedulsItemBody.insertAdjacentElement('beforeend', $additionalInfoTxt);
			}
			//END Pickup Note

			$schedulsItem.addEventListener('click', function () {
				if (product?.type !== 'woo') {
					let $locIds = {'locations': []};

					if (product?.itinerary?.activityInfo?.location) {
						$locIds['locations'].push(product['itinerary']['activityInfo']['location']['ref']);
					}
					if (product?.itinerary?.pointsOfInterest) {
						for (let $pointsOfInterest of product['itinerary']['pointsOfInterest']) {
							$locIds['locations'].push($pointsOfInterest['ref']);
						}
					}
					if (product?.itinerary?.itineraryItems) {
						for (let $itineraryItem of product['itinerary']['itineraryItems']) {
							$locIds['locations'].push($itineraryItem['pointOfInterestLocation']['location']['ref']);
						}
					}

					if ($locIds['locations']) {
						wp.ajax.send('get_locations', {
							success: function (data) {
								if (data?.locations) {
									let $locsName = document.querySelectorAll('.faq__item-schedul .list-group-item');

									//console.log($locsName);

									for (let $location of data['locations']) {
										for (let $locNameItem of $locsName) {
											if ($location['reference'] === $locNameItem['dataset']['id']) {
												let $locsNameBox = $locNameItem.querySelector('h5');

												$locsNameBox.classList.remove('skeleton-loader');
												$locsNameBox.textContent = $location['name'];
											}
										}
									}
								}

							},
							error: function (data) {
								console.log('error', data);
							},
							data: {
								nonce: getNonce(),
								locations: $locIds['locations'],
								language: sessionStorage.getItem('viatorLang'),
								productCode: product['productCode'],
							},
						});
					}
				}
			});
		};

		if (product?.description) {
			desc();
		}
		if (product?.additionalInfo || product?.inclusions || product?.exclusions) {
			let detailWrap = detail();
			detailIncluded(detailWrap);
			detailAdditionalInfo(detailWrap);
		}

		if (product?.cancellationPolicy?.description || product?.cancellationPolicy?.refundEligibility ||
			product?.cancellationPolicy?.cancelIfBadWeather || product?.cancellationPolicy?.cancelIfInsufficientTravelers) {
			cancel();
		}

		if (product?.logistics?.start || product?.logistics?.end || product?.logistics?.travelerPickup?.locations) {
			meet();
		}

		reviews();

		if (product?.logistics?.travelerPickup?.additionalInfo ||
			product?.logistics?.travelerPickup?.minutesBeforeDepartureTimeForPickup ||
			(product?.itinerary?.itineraryItems && (product['itinerary']['itineraryItems'][0]['name'] ||
				product['itinerary']['itineraryItems'][0]['description'] ||
				product['itinerary']['itineraryItems'][0]['duration']))) {
			scheduls();
		}

		$descBlock.classList.add('excursion__description');
		$cntBlock.insertAdjacentElement('beforeend', $descBlock);
	};


	if (product?.images) {
		if (!viatorSingleObj['post_id']) {
			for (let $cntImages of product['images']) {
				$cntImages['variants'].sort(function (a, b) {
					return b.width - a.width;
				});
			}
		}

		productSlider();
	}

	tags();
	title();
	$cntBlock.insertAdjacentElement('beforeend', $infoBox);
	info1($infoBox);
	info2($infoBox);

	if (product?.logistics?.travelerPickup?.pickupOptionType === 'PICKUP_EVERYONE' ||
		product?.logistics?.travelerPickup?.pickupOptionType === 'PICKUP_AND_MEET_AT_START_POINT') {
		infoPickup($infoBox);
	}
	if (product?.ticketInfo?.ticketTypes) {
		infoTicket($infoBox);
	}

	content();
};

const getProduct = async () => {
const currentPageURL = window.location.href;
// const storedData = JSON.parse(localStorage.getItem(currentPageURL));

// // ... (previous code)

// if (storedData) {
//   const containerContent = storedData.content;

//   // Create a new div
//   const newDiv = document.createElement('div');

//   // Set the innerHTML of the new div to the container content
//   newDiv.innerHTML = containerContent;
// newDiv.classList.add('excursion__content');
//   // Find the element with the class .excursion__wrap
//   const excursionWrap = document.querySelector('.excursion__wrap');

//   // Append the new div inside the .excursion__wrap element
//   excursionWrap.prepend(newDiv);
// }
	let $contentWrap = $('.container .excursion__wrap ');

// ... (rest of your code)

	let requestOptions = {
		action: 'get_product',
		type: 'viator',
		destName: viatorSingleObj.dest_name,
		targetCurrency: viatorCurrency,
	};

	if (viatorSingleObj.post_id) {
		requestOptions.id = viatorSingleObj.post_id;
		requestOptions.type = 'woo';
	} else {
		requestOptions.id = getPostId();
	}

	if (!requestOptions.id) {
		$contentWrap.html(__('Error', 'viator'));
		return;
	}

	if (!localStorage.getItem('viatorTags') || Date.now() > localStorage.getItem('viatorTagsLastUp')) {
		requestOptions['get_tags'] = true;
	}

	if (!localStorage.getItem('viatorDest') || Date.now() > localStorage.getItem('viatorDestLastUp')) {
		requestOptions['get_destinations'] = true;
	}

	if (viatorLang) {
		requestOptions['language'] = viatorLang;
	}


	let response = await axios({
		method: 'POST',
		data: new URLSearchParams(requestOptions),
		url: '/wp-admin/admin-ajax.php',
	});


	if (response?.data?.tags) {
		updateStorage(response.data['tags'], 'Tags');
	}
	if (response?.data?.dest) {
		updateStorage(response.data['dest'], 'Dest');
	}

	let availability = await getAilability(requestOptions.id);
	  let finalResult = {...filterResponse(response), ...availability};
// Get the current page URL

    return finalResult;


}
export {getProduct, insertProduct}
