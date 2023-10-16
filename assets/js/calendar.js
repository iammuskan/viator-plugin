// Importing necessary dependencies and functions
import {
	global_unavailableDates,
	fixedDate,
	fixedMonth,
	getDayOfWeek,
	isDateUnavailable,
	isDateWithinSeason
} from './functions.js';

// Creating a reference to jQuery
const $ = jQuery;

// Defining the main Calendar function
const insertIntoCalendar = () => {



	// Function to check if the day of the week is available
	function isDayOfWeekAvailable(pricingRecord, selectedDate) {
		return pricingRecord.daysOfWeek.includes(getDayOfWeek(selectedDate));
	}

	// Function to handle the selection of days
	function handler_days(selectedDate, $el) {

		// If there are items in vi_global_product
		if (vi_global_product.items) {

			// Initialize an array to store disabled items
			let disable_items = [];
			for (let item in vi_global_product.items) {

				// Iterate over each item
				item = vi_global_product.items[item];
				if (item.seasons) {

					// Initialize an array to store disabled seasons
					let disableSeason = [];
					for (let season in item.seasons) {
						// Iterate over each season
						season = item.seasons[season];

						if (isDateWithinSeason(season, selectedDate)) {

							// Initialize an array to store disabled pricing
							let disablePricing = [];

							// process pricingRecords
							for (let pricingRecord of season.pricingRecords) {

								// Initialize an array to store disabled times
								let disableTime = [];
								// Check each timed entry
								if (pricingRecord.timedEntries) {

									for (let timedEntry of pricingRecord.timedEntries) {
										if (isDateUnavailable(timedEntry, selectedDate)) {
											disableTime.push('1');
										}
									}

									if (pricingRecord.timedEntries.length === disableTime.length) {
										disableTime = 'disabled';
									}
								}

								// Check if day of week is available or time is disabled
								if (!isDayOfWeekAvailable(pricingRecord, selectedDate) || disableTime == 'disabled') {
									disablePricing.push('1');
								}

							}

							// If all pricing records are disabled, disable the season
							if (disablePricing.length === season.pricingRecords.length) {
								disable_items.push('1');
							}
						} else {
							disableSeason.push('1');
						}

					}

					// If all seasons are disabled, disable the item
					if (disableSeason.length == item.seasons.length) {
						disable_items.push('1');
					}

				}
			}

			// If all items are disabled, add the -disabled- class to the element
			if (disable_items.length === vi_global_product.items.length) {
				$el.addClass('-disabled-');
			}

		}
	}


	// For each date cell in the calendar, run the handler_days function
	$('.aside-date .air-datepicker-cell').each(function () {

		let $el = $(this);

		let {year, month, date} = $el.data(),
			selectedDate = `${year}-${fixedMonth(month)}-${fixedDate(date)}`;

		handler_days(selectedDate, $el);

	})

};

// Exporting the insertIntoCalendar function
export {insertIntoCalendar}
