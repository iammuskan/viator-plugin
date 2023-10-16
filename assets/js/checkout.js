'use strict';
import {
	setTimeHold,
} from './functions.js';

const {__, _x, _n, _nx} = wp.i18n;

(function () {
	if (typeof wc_checkout_params === 'undefined') {
		return false;
	}

	let $form = document.querySelector('form.woocommerce-checkout');

	if (!$form) return;

	let $btnOrder,
		$countIteration = 0,
		$buying = document.querySelector('.user-buying-checkbox'),
		$buyingFields = document.querySelector('.buying-fields-wrap');

	//START add _booking questions fields
	let $templateExtra = wp.template('transferExtraFields'),
		$td_mode = document.querySelector('#field_transfer_departure_mode'), //TRANSFER_DEPARTURE_MODE
		$ta_mode = document.querySelector('#field_transfer_arrival_mode'); //TRANSFER_ARRIVAL_MODE

	if ($ta_mode && checkoutLocation) {
		let $templateLocation = wp.template('checkoutSelectLocation'),
			$insertToBlockA = document.querySelector('.show_viator_location'),
			$extraArrival = document.querySelector('.arrival-extra-questions'),
			$selectedTextName = $ta_mode?.options[$ta_mode.selectedIndex].textContent.toLowerCase(),
			$selectedValName = $ta_mode?.options[$ta_mode.selectedIndex].value.toLowerCase();

		if (checkoutLocation[$selectedTextName] && Array.isArray(checkoutLocation[$selectedTextName]) === false) {
			$insertToBlockA.insertAdjacentHTML('beforeend', $templateLocation(checkoutLocation[$selectedTextName]));
		}

		if (arrivalQuestions[$selectedValName]) {
			$extraArrival.insertAdjacentHTML('beforeend', $templateExtra(arrivalQuestions[$selectedValName]));
		}

		$ta_mode.addEventListener('change', function (evt) {
			$selectedTextName = this?.options[$ta_mode.selectedIndex].textContent.toLowerCase();
			$selectedValName = this?.options[$ta_mode.selectedIndex].value.toLowerCase();

			$insertToBlockA.innerHTML = '';
			$extraArrival.innerHTML = '';

			if (checkoutLocation[$selectedTextName] && Array.isArray(checkoutLocation[$selectedTextName]) === false) {
				$insertToBlockA.insertAdjacentHTML('beforeend', $templateLocation(checkoutLocation[$selectedTextName]));
			}

			if (arrivalQuestions[$selectedValName]) {
				$extraArrival.insertAdjacentHTML('beforeend', $templateExtra(arrivalQuestions[$selectedValName]));
			}
		});
	}

	if ($td_mode && departureQuestions) {
		let $extraDeparture = document.querySelector('.departure-extra-questions'),
			$tdSelectedName = $td_mode?.options[$td_mode.selectedIndex].value.toLowerCase();

		if (departureQuestions[$tdSelectedName]) {
			$extraDeparture.insertAdjacentHTML('beforeend', $templateExtra(departureQuestions[$tdSelectedName]));
		}

		$td_mode.addEventListener('change', function (evt) {
			$tdSelectedName = this?.options[$td_mode.selectedIndex].value.toLowerCase();
			$extraDeparture.innerHTML = '';

			if (departureQuestions[$tdSelectedName]) {
				$extraDeparture.insertAdjacentHTML('beforeend', $templateExtra(departureQuestions[$tdSelectedName]));
			}
		});
	}
	//END add _booking questions fields

	$buying.addEventListener('change', function () {
		$buyingFields.classList.toggle('active');

		$buyingFields.innerHTML = '';

		if ($buyingFields.classList.contains('active')) {
			$buyingFields.innerHTML = `<p class="form-row form-row-first" id="buying_user_first_name">
            <label for="buying_user_first_name">
                ` + __('First name', 'viator') + `&nbsp;
            </label>
            <span class="woocommerce-input-wrapper">
                <input type="text" class="input-text" name="buying_user_first_name" id="buying_user_first_name">
            </span>
        </p>

        <p class="form-row form-row-last" id="buying_user_last_name">
            <label for="buying_user_last_name">
                ` + __('Last name', 'viator') + `&nbsp;
            </label>
            <span class="woocommerce-input-wrapper">
                <input type="text" class="input-text " name="buying_user_last_name" id="buying_user_last_name">
            </span>
        </p>`;
		}

	});

	// place_order


}());

(function ($, undefined) {
	$(function () {

		$('form.woocommerce-checkout').on('click', '#place_order', function () {

			//console.log('click');

			// Get all elements with the class .validate-required
			let requiredFields = $('.validate-required');

			// Iterate over each required field
			for (let i = 0; i < requiredFields.length; i++) {
				// Get the input inside the required field
				let input = requiredFields[i].querySelector('input, select, textarea');

				// If the input exists and the value is empty
				if (input && input.value.trim() === '') {

					console.log(input);

					// Alert the user
					alert(__('Please fill all required fields.', 'viator'));

					// Stop further execution
					return false;
				}
			}


			$('form.woocommerce-checkout').submit();


		});

		if ($().selectWoo) {
			let billingCountry = $('#billing_country');
			let billingState = $('select#billing_state');

			if (billingCountry.data('select2')) {
				billingCountry.selectWoo('destroy');
			}

			if (billingState && billingState.data('select2')) {
				billingState.selectWoo('destroy');
			}

			billingCountry.on('click', function () {
				if (billingCountry.data('select2')) {
					billingCountry.selectWoo('destroy');
				}

				billingState = $('select#billing_state');

				if (billingState) {
					if (billingState.data('select2')) {
						billingState.selectWoo('destroy');
					}

					billingState.on('click', function () {
						if (billingState.data('select2')) {
							billingState.selectWoo('destroy');
						}
					});
				}
			});
		}

	});
})(jQuery);
