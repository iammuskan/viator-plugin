'use strict';

import {
	global_unavailableDates,
	getDayOfWeek,
	fixedDate,
	fixedMonth,
	getPostId,
	filterResponse,
} from './functions.js';

import {showPrices} from './prices.js';

const {__, _x, _n, _nx} = wp.i18n;

const $ = jQuery;

let $maxTravelers;

const $asidePeople = $('.aside-date__select-people'),
	$asideBtns = $('.aside-date__body');

window.vi_order_members = {};

const textTimeSlotAge = __('Please Select Time Slot', 'viator');


const labels = {
	adult: __('adult', 'viator'),
	child: __('child', 'viator'),
	infant: __('infant', 'viator'),
	youth: __('youth', 'viator'),
	senior: __('senior', 'viator')
}

//START formation ageBands
const ageBands = (product) => {
	let $dataCountPeople = Number(sessionStorage.getItem('dataCountPeople')),
		$template = wp.template('ageBands'),
		$data = {
			maxTravelers: '??',
			defaultCount: 1,
			ageBands: [],
		};

	for (let $ageBand of product?.pricingInfo?.ageBands) {
		let $name = $ageBand['ageBand'].toLowerCase(),
			label = labels[$name],
			$dataObj = {
				name: $ageBand['ageBand'].toUpperCase(),
				txt: `${label} (${$ageBand['startAge']}-${$ageBand['endAge']})`,
				min: $ageBand['minTravelersPerBooking'],
				max: $ageBand['maxTravelersPerBooking'],
			};

		if ('adult' === $name || 'traveler' === $name) {
			$dataObj['type'] = $name;
			$data['maxTravelers'] = $maxTravelers = Number($ageBand['maxTravelersPerBooking']);

			if ($dataCountPeople > $maxTravelers) {
				$data['defaultCount'] = $maxTravelers;
			} else {
				$data['defaultCount'] = $dataCountPeople;
			}

			vi_order_members[$ageBand['ageBand']] = $data['defaultCount'];
			$data['ageBands'].unshift($dataObj);
		} else {
			$data['ageBands'].push($dataObj);
		}
	}
	//console.log($data);
	$asidePeople.html($template($data));
};
//END formation ageBands

//START HANDLERS ▼
$asideBtns.on('click', function (evt) {

	for (let target = evt.target; target && target !== this; target = target.parentNode) {
		if (target.matches('.btn-outline-primary')) {
			let $newCount,
				$main = target.closest('.aside-date__bands'),
				$parent = target.parentNode,
				$item = $parent.querySelector('span'),
				$allCount = Number($main.dataset.allcount),
				$count = Number($item.textContent.trim()),
				$thisMinCount = Number(target?.dataset?.min > 0 ? target?.dataset?.min : 0),
			
				name = target.closest('.aside-date__bands-item').querySelector('.aside-date__bands-info p').dataset.name;


			//increase this
			if (target.matches('.btn-increment')) {
				$newCount = ++$count;
				++$allCount;
			 
			}


			//reduce this
			if (target.matches('.btn-decrement')) {
$('.newclass').text(textTimeSlotAge);

				$newCount = --$count;
				--$allCount;


				if ($allCount < $maxTravelers ) {
					for (let increment of target.closest('.aside-date__bands').querySelectorAll('.btn-increment')) {
						if (increment?.dataset?.max) {
							if (Number(increment.parentNode.querySelector('span').textContent) < Number(
								increment['dataset']['max'])) {
								increment.removeAttribute('disabled');
							}
						}
					}
				}

			}

			//unblock decrement
			if ($newCount === 1) {
				$parent.querySelector('.btn-decrement').removeAttribute('disabled');
			}
			// block decrement

			if ($newCount === $thisMinCount) {
				target.setAttribute('disabled', 'disabled');
			} else {
				$parent.querySelector('.btn-decrement').removeAttribute('disabled');
			}

			if ($newCount === Number(target.dataset.max)) {
				target.setAttribute('disabled', 'disabled');
			} else {
				$parent.querySelector('.btn-increment').removeAttribute('disabled');
			}

			if ($allCount > $maxTravelers) {
				for (let increment of target.closest('.aside-date__bands').querySelectorAll('.btn-increment')) {
					increment.setAttribute('disabled', 'disabled');
				}
				break;
			} else {
				if ($newCount > 0) {
					vi_order_members[name] = $newCount;
					$item.textContent = String($newCount);
					$main.setAttribute('data-allCount', String($allCount));
				}
			}


			if ((target.matches('.btn-increment') || target.matches('.btn-decrement')) && window.vi_global_selected_date) {
				showPrices(vi_global_product, true);
				$('.newclass').text(textTimeSlotAge);

			}

			break;
		}

	}
});//handler ageBands

export {ageBands};
