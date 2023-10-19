'use strict';

import {
	global_unavailableDates,
	getDayOfWeek,
	fixedDate,
	fixedMonth,
	getPostId,
	filterResponse,
	isDateUnavailable
} from './functions.js';

const {__, _x, _n, _nx} = wp.i18n;

const $ = jQuery;

let id = '';
if (viatorSingleObj.post_id) {
	id = viatorSingleObj.post_id;
} else {
	id = getPostId();
}

let templateSinglePrice = wp.template('singlePriceBox');


const targetCurrency = localStorage.getItem('viatorCurrency') ?? viatorParameters?.default_currency;

// const insertPrice = (season, $item) => {
//
// 	let $totalNode = $nodeOptions[$item].querySelector('.faq__item-price-total');
//
//
// 	if ($firstActive && !$nodeOptions[$item].classList.contains('disable')) {
// 		$firstActive = false;
// 		$nodeOptions[$item].classList.add('active');
// 	}
// };//end $insertPriceBlockPart2


let $descBlock = document.createElement('div'),
	$cntArrowUp = '<span class="d-block d-lg-none faq__item-icon-arrow"><svg width="16" height="8" viewBox="0 0 16 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.00003 8C7.81403 8 7.62785 7.93483 7.48585 7.80467L0.213136 1.13804C-0.0710453 0.877537 -0.0710453 0.455706 0.213136 0.195374C0.497317 -0.064958 0.957498 -0.0651247 1.2415 0.195374L8.00003 6.39068L14.7586 0.195374C15.0428 -0.0651247 15.5029 -0.0651247 15.7869 0.195374C16.0709 0.455873 16.0711 0.877703 15.7869 1.13804L8.51422 7.80467C8.37222 7.93483 8.18603 8 8.00003 8Z" fill="#0C498A" /></svg></span>',
	$cntArrowDown = '<span class="faq__item-icon-arrow"><svg width="16" height="8" viewBox="0 0 16 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.00003 8C7.81403 8 7.62785 7.93483 7.48585 7.80467L0.213136 1.13804C-0.0710453 0.877537 -0.0710453 0.455706 0.213136 0.195374C0.497317 -0.064958 0.957498 -0.0651247 1.2415 0.195374L8.00003 6.39068L14.7586 0.195374C15.0428 -0.0651247 15.5029 -0.0651247 15.7869 0.195374C16.0709 0.455873 16.0711 0.877703 15.7869 1.13804L8.51422 7.80467C8.37222 7.93483 8.18603 8 8.00003 8Z" fill="#0C498A" /></svg></span>';


const showPrices = (vi_global_product = '', setActive = false) => {
    if($('.tests').length > 0 ){$('.tests').remove();}


    
	// Function to check if a selected date is within a particular season
	function isDateWithinSeason(season, selectedDate) {

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

	// Function to check if the day of the week is available
	function isDayOfWeekAvailable(pricingRecord, selectedDate) {
		if (!pricingRecord.daysOfWeek) {
			return false;
		}
		return pricingRecord.daysOfWeek.includes(getDayOfWeek(selectedDate));
	}

	if (!vi_global_selected_date) {

		let $airDate = $('.air-datepicker .-selected-').length ? $('.air-datepicker .-selected-') : $('.air-datepicker .-current-');

		let {year, month, date} = $airDate.data(),
			vi_global_selected_date = `${year}-${fixedMonth(month)}-${fixedDate(date)}`;
	}

	let firstBlock = 1,
		$priceElement = $('<div>'),
		$priceHeader = $('<div>'),
		$priceElementBody = $('<div>');

	$priceElement.addClass('faq__item faq__item-prices active');
	$priceHeader.addClass('faq__item-header');
	$priceElementBody.addClass('faq__item-body');

	$priceHeader.text(__('Prices', 'viator'));
	$priceHeader.prepend($cntArrowUp);
	$priceHeader.append($cntArrowDown);

	$priceElement.append($priceHeader);
	$priceElement.append($priceElementBody);

	let defaultData = {
		optionid: __('Option 1', 'viator'),
		num: 1,
		title: vi_global_product.title,
		text: ''
	};
	let activeElement = document.querySelector('.excursion__content .faq__item-price.active') || {};


	if (!vi_global_product?.productOptions) {
		vi_global_product.productOptions = Object.assign([], vi_global_product.items, vi_global_product.productOption);
	}

	if (vi_global_product.type == 'woo') {
		vi_global_product.productOptions = vi_global_product.bookableItems;
		vi_global_product.items = vi_global_product.bookableItems;

		vi_order_members.adult = 1;
	}

	// get all variants of the product
	if (vi_global_product?.productOptions) {

		let check_tour_any_time = 0;
		let counter = 1;
		for (let productOption of vi_global_product.productOptions) {
const ds = productOption.title;
			let data = {};

			data.time = {};
			data.prices = {};

			if (productOption?.description) {
				data.text = productOption['description'].replace(/\n/gi, '<br>');
			} else {
				if (vi_global_product?.description) {
					data.text = vi_global_product.description.replace(/\n/gi, '<br>');
				}
			}


			if (vi_global_product.items) {
				for (let key in vi_global_product.items) {

					let item = vi_global_product.items[key];

					if (item.productOptionCode != productOption.productOptionCode) {
						continue;
					}

					data.total = 0;
					data.total_usd = 0;

					if (item.seasons) {
						/* need to insert prices etc */
						for (let season in item.seasons) {

							// Iterate over each season
							season = item.seasons[season];

							if (isDateWithinSeason(season, vi_global_selected_date)) {

								// process pricingRecords
								for (let pricingRecord of season.pricingRecords) {

									// timedEntries
									if (pricingRecord.timedEntries) {
		

										// Check if day of week is available or time is disabled
										if (vi_global_product.type !== 'woo') {
											if (!isDayOfWeekAvailable(pricingRecord, vi_global_selected_date)) {
												continue;
											}
										}


										for (let timedEntry of pricingRecord.timedEntries) {

											if (isDateUnavailable(timedEntry, vi_global_selected_date)) {
												continue;
											}

											let startTime = timedEntry.startTime,
												clearItemTime = startTime.replace(':', '');


											let unique = key + 'opt' + data.optionid + '-time' + clearItemTime;

											if (data.time.hasOwnProperty(unique)) {
												continue;
											}
const recommendedRetailPrice = pricingRecord.pricingDetails[0].price.original.recommendedRetailPrice;
 // Fetch ageBands and prices within the loop for timedEntries
    let pricingDetailsArrays = []; // Create an array to store pricing details

    for (let pricingDetail of pricingRecord.pricingDetails) {

        if (!pricingDetail.ageBand) continue;

        let ageBands = pricingDetail.ageBand.toUpperCase();

        if (!vi_order_members['ADULT']) {
            vi_order_members['ADULT'] = 1;
        }

        if (!vi_order_members[ageBands]) continue;

        if (vi_order_members[ageBands] < pricingDetail.minTravelers || vi_order_members[ageBands] > pricingDetail.maxTravelers) {
            continue;
        }

        if (!data['prices'][ageBands]) {
            data['prices'][ageBands] = [];
        }

        let Ageprices = pricingDetail.price.original.recommendedRetailPrice;


let dataArray = [Ageprices, ageBands, startTime, ds];

// Creating a single JSON object
let jsonData = {
  "Ageprices": Ageprices,
  "ageBands": ageBands,
  "startTime": startTime,
  "optiontitle": ds
};

// Logging the JSON object
// console.log(JSON.stringify(jsonData));

// Create a new unordered list element with a class 'ulelement'
let ulElement = $('<ul class="ulelement"></ul>');

// Loop through the JSON data
for (let key in jsonData) {
  if (jsonData.hasOwnProperty(key)) {
    // Create a <li> element with a unique class based on the key
    let liElement = $(`<li class="${key}"></li>`);

    // Create a <span> element for each data point
    let spanElement = $('<span></span>').text(jsonData[key]);

    // Append the span to the li
    liElement.append(spanElement);

    // Append the li to the ul
    ulElement.append(liElement);
  }
}

// Wrap the ul with a div with class 'texthide' and append it to the body
ulElement.appendTo('.child');


// Logging the number of times JSON data has been printed

        // Add pricing detail to the array
        pricingDetailsArrays.push({
            ageBands: pricingDetail.ageBand,
            // recommendedRetailPrice: pricingDetail.price.original.recommendedRetailPrice
        });


    // Check if there's already a div with class 'price'
    let existingPriceDiv = document.querySelector('.price');

    // If it exists, remove it
    if (existingPriceDiv) {
        existingPriceDiv.remove();
    }


											//START inset option time ▼
											data.time[startTime] = `<div class="faq__item-price-time">
												<input type="radio"  data-age"${Ageprices}" data-price="${recommendedRetailPrice}" name="price-time" id="${key}opt${data.optionid}-time${clearItemTime}" ${data.price_checkbox} value="${startTime}">
												<label for="${key}opt${data.optionid}-time${clearItemTime}">${startTime}</label>

												</div>`;
											//END inset option time ▲

											check_tour_any_time++;

										}

									}
    }
									// get ageBand (ADULT, CHILD ...)
									if (pricingRecord.pricingDetails) {

    let pricingDetailsArray = []; // Create an array to store pricing details

    for (let pricingDetail of pricingRecord.pricingDetails) {

        if (!pricingDetail.ageBand) continue;

        let ageBand = pricingDetail.ageBand.toUpperCase();
       
        if (!vi_order_members['ADULT']) {
            vi_order_members['ADULT'] = 1;
        }

        if (!vi_order_members[ageBand]) continue;

        // Check if day of the week is available or time is disabled
        if (vi_global_product.type !== 'woo') {
            if (!isDayOfWeekAvailable(pricingRecord, vi_global_selected_date)) {
                continue;
            }
        }

        if (vi_order_members[ageBand] < pricingDetail.minTravelers || vi_order_members[ageBand] > pricingDetail.maxTravelers) {
            continue;
        }

        if (!data['prices'][ageBand]) {
            data['prices'][ageBand] = [];
        }

        let price = pricingDetail.price.original.recommendedRetailPrice;

        data.total_usd += vi_order_members[ageBand] ? (vi_order_members[ageBand] * price) : 0;

        if (targetCurrency != 'USD') {
            vi_global_product.rates.forEach(function (ex_rate) {
                if ('USD' == ex_rate.sourceCurrency && ex_rate.targetCurrency === targetCurrency) {
                    price = (price * ex_rate['rate']);
                    return;
                }
            });

            data.total += vi_order_members[ageBand] ? Math.ceil(vi_order_members[ageBand] * price) : 0;
        } else {
            data.total_usd = Math.round(data.total_usd);
            data.total = +data.total_usd;
        }

        data['prices'][ageBand].push(`<div></div>`);

        // Add pricing detail to the array
        pricingDetailsArray.push({
            ageBand: pricingDetail.ageBand,
            recommendedRetailPrice: pricingDetail.price.original.recommendedRetailPrice
        });
    }

   // Check if there's already a div with class 'price'
let existingPriceDiv = document.querySelector('.price');

// If it exists, remove it
if (existingPriceDiv) {
    existingPriceDiv.remove();
}


}
								}

							}
						}
					}

					data.total = data.total.toFixed(2);
				}
			}
			
			setTimeout(function () {
				if (check_tour_any_time) {
					let parentElems = document.querySelectorAll('.faq__item-price');
					let elemsWithoutTime = Array.from(parentElems).filter(parentElem => {https://staging.ilmioviaggio.com/wp-admin/admin.php?page=wpide#
						return parentElem.querySelectorAll('.faq__item-price-time').length === 0;
					});

					if (elemsWithoutTime.length > 0) {
						// Check if there is at least one element with time, then hide the ones without time
						elemsWithoutTime.forEach(elem => {
							elem.style.display = "none";
						});
					}
				}
			}, 0);
			

			data.targetCurrency = targetCurrency;


			data.price_list = '';
			for (let type in vi_order_members) {

				if (!data.prices[type]?.length) continue;

				data.price_list += data.prices[type].join();
			}


			if (!data.price_list) {
				continue;
			}

			if (setActive) {
				if (productOption?.productOptionCode === activeElement?.dataset?.optionid) {
					data.active = 'active';
					data.price_checkbox = 'checked';
				}
			} else {
				if (firstBlock === 1) {
					data.active = 'active';
					data.price_checkbox = 'checked';
				}
			}

			data.optionid = productOption?.productOptionCode;
			data.num = firstBlock;
			data.title = productOption?.title ? productOption?.title : vi_global_product.title;
			if (data.time) {

				let sortedKeys = Object.keys(data.time).sort((a, b) => {
					const aDate = new Date(`1970/01/01 ${a}`);
					const bDate = new Date(`1970/01/01 ${b}`);
					return aDate - bDate;
				});

				let sortedData = {};
				for (let key of sortedKeys) {
					sortedData[key] = data.time[key];
				}

				data.time = Object.values(sortedData).join('');

			}

			$priceElementBody.append(templateSinglePrice(data));
			firstBlock++;


		}


		


	} else {


		if (vi_global_product?.description) {
			defaultData['text'] = vi_global_product.description.replace(/\n/gi, '<br>');
		}

		$priceElementBody.append(templateSinglePrice(defaultData));

	}

	if ($('.faq__item-prices').length) {
		$('.faq__item-prices').replaceWith($priceElement);

	} else {
		$('.excursion__description .faq__item.description').after($priceElement);
	}

	$('.faq__item-price').removeClass('d-none');

	//START handler price
	$('.excursion__content').on('click', '.faq__item-price', function (event) {
		if (!$(event.target).is('input[type="radio"]')) {
		       
			$('.faq__item-prices .faq__item-price').removeClass('active');
			$(this).addClass('active').find('.faq__item-price-time input[type="radio"]').first().prop('checked', true);
		}
	});




const lowestPrices = [];

const lowestPriceOverall = Math.min(...lowestPrices);

const sets = document.querySelectorAll('.faq__item-price-time-wrap');

sets.forEach(set => {
    const radios = set.querySelectorAll('input[type="radio"]');

    const prices = [];

    radios.forEach(radio => {
        const price = parseInt(radio.getAttribute('data-price'));

        prices.push(price);
    });

    if (targetCurrency !== 'USD') {
        vi_global_product.rates.forEach(function (ex_rate) {
            if ('USD' === ex_rate.sourceCurrency && ex_rate.targetCurrency === targetCurrency) {
                prices.forEach((price, index) => {
                    prices[index] = (price * ex_rate['rate']).toFixed(2);
                });
                return;
            }
        });
    }

    const arePricesDifferent = prices.some((price, index) => price !== prices[0]);
	const textTimeSlot = __('Please Select Time Slot', 'viator');
    if (arePricesDifferent) {
    const lowestPrice = Math.min(...prices);
      lowestPrices.push(lowestPrice);
      jQuery('.faq__item-price-total').addClass('newclass').text(textTimeSlot);

	$('.excursion__content').on('click', '.faq__item-price', function (event) {
		if (!$(event.target).is('input[type="radio"]')) {
		       jQuery('.faq__item-price').each(function() {
    if (!jQuery(this).hasClass('active')) {
              jQuery('.faq__item-price-total').text(textTimeSlot);

    }
});
			$('.faq__item-prices .faq__item-price').removeClass('active');
			$(this).addClass('active').find('.faq__item-price-time input[type="radio"]').first().prop('checked', false);
		}
	});

            let originalLowestPrice = lowestPrice; 

       let usdLowestPrice = lowestPrice; 
if (targetCurrency !== 'USD') {
    vi_global_product.rates.forEach(function (ex_rate) {
        if (ex_rate.sourceCurrency === 'USD' && ex_rate.targetCurrency === targetCurrency) {
            usdLowestPrice = (lowestPrice * ex_rate.rate).toFixed(2);
            return;
        }
    });
}


            const indexToPrint = lowestPrices.length;

            const totalElement = $('.faq__item-price-total').eq(indexToPrint - 1);
            totalElement.text(targetCurrency + ' ' + lowestPrice);
            totalElement.attr('data-price', originalLowestPrice);
            totalElement.attr('data-price-usd', usdLowestPrice);
    jQuery('.aside-date__bands-btn-group span').addClass('new');

//              if ($('.ttl').length > 0 ) {
//              var msd = $('.ttl').text();
//              if(!isNaN(msd)){
//              jQuery('.faq__item-price.active .faq__item-price-total').attr('data-price-usd',msd);
//              }
                 
//              }
//           if ($('.ttls').length > 0 ) {
//     var msds = $('.ttls').text();
//     if(!isNaN(msds)){
//         var msdsInteger = parseInt(msds);

//         if (!isNaN(msdsInteger)) {
//             var convertedValue;

//             if (targetCurrency !== 'USD') {
//                 vi_global_product.rates.forEach(function (ex_rate) {
//                     if (ex_rate.sourceCurrency === 'USD' && ex_rate.targetCurrency === targetCurrency) {
//                         convertedValue = (msdsInteger * ex_rate.rate).toFixed(2);
//                         return;
//                     }
//                 });
//             } else {
//                 convertedValue = msdsInteger.toString(); 
//             }

//             jQuery('.faq__item-price.active .faq__item-price-total').attr('data-converted-price', convertedValue);

//             jQuery('.faq__item-price.active .faq__item-price-total').text(targetCurrency + ' ' + convertedValue);
//         } else {
//             console.error('Failed to convert string to integer');
//         }
//     }
// }

$('.faq__item-price-time').click(function(){
    $('.faq__item-price-time').removeClass('active-item');
    $(this).addClass('active-item');
});
jQuery('.faq__item-price-time input').click(function() {
    var clickedText = jQuery(this).val();
    var activeTitle = jQuery('.faq__item-price.active .faq__item-price-title').text();
jQuery('.ulelement').removeClass('active');
    jQuery('.ulelement').each(function() {
        var optionTitle = jQuery(this).find('li.optiontitle span').text();
        var startTime = jQuery(this).find('li.startTime span').text();

        if (optionTitle === activeTitle && startTime === clickedText) {

$(this).addClass('active');
       
        }
         
          
             
 
    });

var activeAgeBands = [];
var mainprice = [];
jQuery('.ulelement.active').each(function() {
    var activeAgeBand = jQuery(this).find('.ageBands span').text();
    var main = jQuery(this).find('.Ageprices span').text();
    activeAgeBands.push(activeAgeBand);
    mainprice.push(main);
});

var dataNames = [];
var darprice = [];
jQuery('.aside-date__bands-info p').each(function() {
    var dataName = jQuery(this).data('name');
        var price = parseInt(jQuery(this).parent().siblings().children().find('.new').text());

    dataNames.push(dataName);
    darprice.push(price);
});
var totalSum = 0; // Initialize totalSum variable

for(var i = 0; i < activeAgeBands.length; i++) {
    var matchFound = false;

    for(var j = 0; j < dataNames.length; j++) {
        if(activeAgeBands[i] === dataNames[j]) {
            matchFound = true;
            var activeAgeBand = activeAgeBands[i];
           var matchedPrice = mainprice[i]; 
            var dataPrice = darprice[j];
            var totalPrice = matchedPrice * dataPrice;
           totalSum += totalPrice; // Add totalPrice to totalSum

            console.log("For Active Age Band:", activeAgeBand);
            console.log("Matched Price:", matchedPrice);
            console.log("Data Price:", dataPrice);
            console.log("Total Price:", totalPrice);

            break;
        }
    }

    if(!matchFound) {
        console.log("Index:", i, "Value:", activeAgeBands[i], "does not have a match");
    }
}
 // Round totalSum

console.log("Total Sum:", totalSum);
console.log("round:",Math.ceil(totalSum));
// Output the total sum
             jQuery('.faq__item-price.active .faq__item-price-total').attr('data-price-usd', totalSum.toFixed(2));
                          if (targetCurrency !== 'USD') {
                vi_global_product.rates.forEach(function (ex_rate) {
                    if ('USD' === ex_rate.sourceCurrency && ex_rate.targetCurrency === targetCurrency) {
                        totalSum = (totalSum * ex_rate['rate']);
                        console.log(ex_rate['rate']);
                        return;
                    }
                });
            }
            totalSum = Math.ceil(totalSum); // Round totalSum

            jQuery('.faq__item-price.active .faq__item-price-total').text(targetCurrency + ' ' + totalSum.toFixed(2));
            jQuery('.faq__item-price.active .faq__item-price-total').attr('data-price', totalSum.toFixed(2));

});



                 $('.ulElement').wrapAll('<div class="tests" />');
                    $('.ulelement').removeClass('matching');
         $('.ulElement').hide();
                   jQuery('.faq__item-price-total').text(textTimeSlot);


    } else {
        console.log('In this set, data-price values are the same.');
    }
});


}

export {showPrices}
