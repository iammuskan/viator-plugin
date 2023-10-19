'use strict';
import {
	getNonce,
	insertSimilar,
	updateStorage,
	insertSkeleton,
	scrollVisibleEl,
	getIconCurrency,
	setTimeHold,
	getDayOfWeek,
	getUnicDates,
	findCommonDates,
	findDuplicateDates,
	filterResponse
} from './functions.js';

import {insertIntoCalendar} from './calendar.js';
import {showPrices} from './prices.js';
import {booking} from './booking.js';
import {insertProduct, getProduct} from './product.js';
import {ageBands} from './ageBands.js';

const viatorCurrency = localStorage.getItem('viatorCurrency') ?? viatorParameters?.default_currency;

const {__, _x, _n, _nx} = wp.i18n;

const $ = jQuery;

const $dateLoad = $('.aside-date-loaded');
const $asideDate = $('.aside-date');


async function wrapProduct(type) {
	let $contentWrap = $('.container .excursion__wrap ');

	let $addCart = $('.aside-date__footer a');

	if ($addCart.length) {
		$addCart.attr('rel', 'nofollow');
		$addCart.attr('aria-label', vi_global_product.title);
		$addCart.addClass('ajax_add_to_cart active');
	}

	// display the product content
	await insertProduct($contentWrap.get(0), vi_global_product);

	$dateLoad.addClass('d-none');
	$asideDate.removeClass('d-none');

	await ageBands(vi_global_product);

	//Handler Booking ▼
	booking(type);
	//Handler Booking ▲
}

(async function () {

	let type = 'viator';


	if (viatorSingleObj.post_id) {
		type = 'woo';
	}

	let product = await getProduct();
	window.vi_global_product = product;

	if (type === 'woo') {
		console.log(product);
		if (product.bookableItems) {

			// insert the data of the product
			wrapProduct(type);

		}
	} else {

		insertIntoCalendar();

		if (product['bookingConfirmationSettings']['confirmationType'] === 'INSTANT') {

			try {
			
				// insert the data of the product
				wrapProduct(type);
const currentDate = new Date().toISOString().slice(0, 10);
const pageURL = window.location.href;

const cached_title = $('.excursion__title').html();
const cached_products = $('.excursion__info').html();
const cached_slider = $('.excursion__slider-main .slick-track').html(); // Added this line
const cached_slider_nav = $('.excursion__slider-second .slick-track').html(); // Added this line

const description_faqs = $('.excursion__description').html();
try {
  let singleproductdata = await axios({
    method: 'POST',
    data: new URLSearchParams({
      action: 'singleproduct_db',
      date: currentDate,
      pageUrl: pageURL,
      title: cached_title,
      info: cached_products,
      slider: cached_slider,
      desc: description_faqs,// Added this line
    }),
    url: '/wp-admin/admin-ajax.php',
  });

  console.log('HTML data sent to the backend:', singleproductdata);
} catch (error) {
  console.error('Error sending HTML data:', error);
}



			} catch (error) {
				console.error(error);
			}
		} else {
			$('.excursion__aside').html(
				`<p class="isnt-bookable">` + __('This experience isn\'t bookable for now.', 'viator') + `</p>`
			);
		}

		// Get Similar Events
	let $similarMain = document.querySelector('.block-popular .row');
window.addEventListener('scroll', async function () {
    if (scrollVisibleEl($similarMain) && !$similarMain.classList.contains('popular-similar')) {
        $similarMain.classList.add('popular-similar');
        let $insertSkeletonCount = 3,
            $insertSimilarCount = 3;

        if (window.outerWidth < 992) {
            $insertSkeletonCount = $insertSimilarCount = 2;
        }

        await insertSkeleton($insertSkeletonCount, $similarMain);
        let destinations = product.destinations[0]['ref'];
        await insertSimilar($similarMain, destinations, $insertSimilarCount);

        await yourNewAsyncFunction();
    }
});

async function yourNewAsyncFunction() {
    // This function will only execute after insertSimilar is done
const dataSimilar = $('.popular-similar').html();

             const pageUrl = window.location.href;
             console.log(pageUrl);// Get current page URL
            const currentDate=  new Date().toISOString().slice(0, 10);

          try { let storeDataResponse = await axios({
                    method: 'POST',
                    data: new URLSearchParams({
                        action: 'data_for_send',
                        dataSimilar: dataSimilar,
                        pageUrl: pageUrl,
                        date: currentDate,
                    }),
                    url: '/wp-admin/admin-ajax.php',
                });

            } catch (error) {
                console.error('Error sending HTML data:', error);
            }
    
}

		// Get Similar Events
		 
	}


	window['asideDateSelectHandler'] = async function (date, formattedDate, datepicker) {//Calendar Handler select

		if (date) {
			//window.vi_global_selected_date = new Date(formattedDate).getTime();

			window.vi_global_selected_date = formattedDate;

			await showPrices(vi_global_product);

			setTimeout(() => {
				if (window.outerWidth < 992) {
					$asideDate.removeClass('active');
					$('.excursion__aside').removeClass('active');
					$('body').removeClass('aside-active');
				}
				const $prices = $('.excursion__content .faq__item-prices');
				window.scrollTo(0, $prices.offset().top);
			}, 300);

		}
	};


	window['asideDateChangeHandler'] = function (month, year, decade) {//Calendar Handler change

		//console.log(month + '-' + year  + '--' + decade);

		setTimeout(() => {
			insertIntoCalendar();
		}, 5);
	};
 

}());
