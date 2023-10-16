'use strict';
import {
	getNonce,
	getPostId,
	insertProduct,
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
} from './functions.js';

const {__, _x, _n, _nx} = wp.i18n;

(async function () {
	let $postData,
		$rate = 0,
		$destinations = 77,
		$dataForSend = {
			action: 'get_product',
			type: 'viator',
			destName: viatorSingleObj?.dest_name,
			targetCurrency: localStorage.getItem('viatorCurrency') ?? viatorParameters?.default_currency,
		},
		$viatorLang = sessionStorage.getItem('viatorLang'),
		$contentWrap = document.querySelector('.container .excursion__wrap '),
		$contentBox = $contentWrap.querySelector('.excursion__content');


	let global_unavailableDates = {};

	if (viatorSingleObj?.post_id) {
		$dataForSend['id'] = viatorSingleObj?.post_id;
		$dataForSend['type'] = 'woo';

	} else {
		$dataForSend['id'] = getPostId();
	}

	if (!$dataForSend?.id) {
		$contentWrap.innerHTML = __('Error', 'viator');
		return;
	}

	if (!localStorage.getItem('viatorTags') || Date.now() > localStorage.getItem('viatorTagsLastUp')) {
		$dataForSend['get_tags'] = true;
	}

	if (!localStorage.getItem('viatorDest') || Date.now() > localStorage.getItem('viatorDestLastUp')) {
		$dataForSend['get_destinations'] = true;
	}

	if ($viatorLang) {
		$dataForSend['language'] = $viatorLang;
	}



	try {
		let $request = await axios({
			method: 'POST',
			data: new URLSearchParams($dataForSend),
			url: '/wp-admin/admin-ajax.php',
		});

		$postData = $request['data'];
		console.log('!!!! $postData', $postData);

		if ($postData?.tags) {
			updateStorage($postData['tags'], 'Tags');
		}
		if ($postData?.dest) {
			updateStorage($postData['dest'], 'Dest');
		}

		if ($postData?.data) {
			if ($postData?.data?.destinations) {
				$destinations = $postData['data']['destinations'][0]['ref'];
			}

			let $addCart = document.querySelector('.aside-date__footer a');

			if ($addCart) {
				$addCart.setAttribute('rel', 'nofollow');
				$addCart.setAttribute('aria-label', $postData['data']['title']);
				$addCart.classList.add('ajax_add_to_cart');
				$addCart.classList.add('active');

			}

			insertProduct($contentWrap, $postData['data']);

		} else {
			console.log('postData is empty');
		}

	} catch (error) {
		console.error(error);
	}

	// Get Similar Events
	let $similarMain = document.querySelector('.block-popular .row');
	window.addEventListener('scroll', function () {
		if (scrollVisibleEl($similarMain) && !$similarMain.classList.contains('popular-similar')) {
			$similarMain.classList.add('popular-similar');
			let $insertSkeletonCount = 3,
				$insertSimilarCount = 3;

			if (window.outerWidth < 992) {
				$insertSkeletonCount = $insertSimilarCount = 2;
			}

			insertSkeleton($insertSkeletonCount, $similarMain);
			insertSimilar($similarMain, $destinations, $insertSimilarCount);
		}
	});
	// Get Similar Events

	//Aside date
	let $counter_options = 0;
	setTimeout(async () => {
		let $currency,
			$targetCurrency,
			$travelDate,
			$nodeOptions,
			$maxTravelers,
			$iconCurrency,
			$productOptObj = [],
			$unavailableDates = [],
			$pricesDates = [],
			$people = {},
			$faqPrice = document.querySelector('.excursion__content .faq__item-prices'),
			$dateLoad = document.querySelector('.aside-date-loaded'),
			$asideDate = document.querySelector('.aside-date'),
			$totalPrice = $asideDate.querySelector('.aside-date__total'),
			$priceTotal = $totalPrice.querySelector('.aside-date__total-price'),
			$priceTotal2 = $asideDate.querySelector('.aside-date__fix-price'),
			$asideBtns = $asideDate.querySelector('.aside-date__body'),
			//$asideBtnPicker = $asideDate.querySelector('.aside-date__form-datepicker button'),
			//$asideBtnPeople = $asideDate.querySelector('.aside-date__form-people button'),
			$asideCal = $asideDate.querySelector('.aside-date__calendar'),
			$asidePeople = $asideDate.querySelector('.aside-date__select-people'),
			$notAllowedDates;

		let fixedDate = (date = 1) => {
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
		};
		let fixedMonth = (month = 0) => {
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

		let showPriceBlock = (thisDate = '', clickDateStr = '') => {


			if (!thisDate) {
				let $airDate = document.querySelector('.air-datepicker .-selected-') ?? document.querySelector('.air-datepicker .-current-'),
					{date, month, year} = $airDate.dataset;

				clickDateStr = `${year}-${fixedMonth(month)}-${fixedDate(date)}`;
				thisDate = new Date(clickDateStr).getTime();//Date in Timestamp
			}

			$travelDate = clickDateStr;//Date in string

			//Show tab price ▼
			if (!$faqPrice.classList.contains('active')) {
				let $isActiveTab = document.querySelector('.excursion__content .faq__item.active');
				if (!$isActiveTab) {

					//$isActiveTab.classList.remove('active');

				}

				$faqPrice.classList.add('active');
				$faqPrice.classList.remove('d-none');


			}
			//Show tab price ▲

			if (!$nodeOptions) {
				$nodeOptions = $contentBox.querySelectorAll('.faq__item-prices .faq__item-price');
			}
			//reset options
			for (let $nodeOption of $nodeOptions) {
				if (!$nodeOption.classList.contains('d-none')) {
					$nodeOption.classList.add('d-none');
				}
				if ($nodeOption.classList.contains('active')) {
					$nodeOption.classList.remove('active');
				}
				if ($nodeOption.classList.contains('disable')) {
					$nodeOption.classList.remove('disable');
				}
			}

			let $firstActive = true,
				$insertPriceBlock = ($optObj) => {
					let $insertPriceBlockPart2 = ($season, $item) => {
						$nodeOptions[$item].classList.remove('d-none');

						let $allPrice = 0,
							$optName = $nodeOptions[$item].dataset.optionid,
							$totalNode = $nodeOptions[$item].querySelector('.faq__item-price-total'),
							$box = $nodeOptions[$item].querySelector('.faq__item-price-breakdown');

						$box.innerHTML = '';

						if ($season?.pricing) {

							console.log('!!$people',$people);

							for (let $person in $people) {
								if ($season['pricing'][$person].length) {
									let $countVariantPrice = $season['pricing'][$person].length;
									if ($countVariantPrice === 1) {
										let $priceItem = $season['pricing'][$person][0],
											$total = $rate ? ($priceItem?.price * 0.97) * $people[$person] : $priceItem?.price * $people[$person];

										$allPrice += $total;

										let $thisPrice = $rate ? ($priceItem?.price * $rate) * 0.97 : $priceItem?.price;

										$box.insertAdjacentHTML(
											'beforeend',
											`<div>${$people[$person]} ` + __($person.toLowerCase(), 'viator') + ` x ${$targetCurrency} ${$thisPrice.toFixed(2)}</div>`,
										);
									} else if ($countVariantPrice > 1) {
										$season['pricing'][$person].sort(function (a, b) {
											return a.maxTravelers - b.maxTravelers;
										});

										let $thisMaxTravelers = $season['pricing'][$person][$countVariantPrice - 1]['maxTravelers'],
											$endPrice = $season['pricing'][$person][$countVariantPrice - 1]['price'];

										for (let $priceItem of $season['pricing'][$person]) {
											if ($priceItem?.minTravelers &&
												$priceItem?.maxTravelers &&
												$priceItem?.minTravelers === $people[$person] &&
												$people[$person] <= $priceItem?.maxTravelers) {

												let $total = $priceItem['price'] * $people[$person];

												$allPrice += $total;

												let $thisPrice = $rate ? $priceItem?.price * $rate : $priceItem?.price;

												$box.insertAdjacentHTML(
													'beforeend',
													`<div>${$people[$person]} ${$person.toLowerCase()} x ${$targetCurrency} ${$thisPrice.toFixed(2)}</div>`,
												);
											} else if ($priceItem?.minTravelers &&
												$priceItem?.maxTravelers &&
												$people[$person] >= $priceItem?.minTravelers &&
												$people[$person] <= $priceItem?.maxTravelers) {

												let $total = $priceItem['price'] * $people[$person];

												$allPrice += $total;

												let $thisPrice = $rate ? $priceItem?.price * $rate : $priceItem?.price;

												$box.insertAdjacentHTML(
													'beforeend',
													`<div>${$people[$person]} ${$person.toLowerCase()} x ${$targetCurrency} ${$thisPrice.toFixed(2)}</div>`,
												);
											}

											if ($people[$person] > $thisMaxTravelers) {

												let $total = $endPrice * $people[$person];

												$allPrice += $total;

												let $thisPrice = $rate ? $priceItem?.price * $rate : $priceItem?.price;

												$box.insertAdjacentHTML(
													'beforeend',
													`<div>${$people[$person]} ${$person.toLowerCase()} x ${$targetCurrency} ${$thisPrice.toFixed(2)}</div>`,
												);
												break;
											}

										}
									}

								}
							}

							if (window.outerWidth < 992) {
								$iconCurrency = getIconCurrency($targetCurrency);
								let $mobPrice = `${$iconCurrency} ${Math.ceil($allPrice)}`;

								$priceTotal2.innerText = $mobPrice;
								$totalPrice.innerText = $mobPrice;
							}

							let $thisPrice = $rate ? $allPrice * $rate : $allPrice;


							if ('woo' === $postData?.data?.type) {
								//console.log('!!!Product woo', $thisPrice, 'optName', $optName);
								$totalNode.setAttribute('data-price', $allPrice);
							} else {
								//console.log('!!!Product viator', $thisPrice, 'optName', $optName, 'allPrice', $allPrice, 'rate', $rate);
								$totalNode.setAttribute('data-price', $thisPrice);
							}
							$totalNode.textContent = `${$targetCurrency} ${$thisPrice.toFixed(2)}`;
						}

						if ($postData['data']?.type !== 'woo') {
							let activeElements = document.querySelectorAll('.faq__item-price:not(.d-none)');

							activeElements.forEach(element => {
								let timeElements = element.querySelectorAll('.faq__item-price-time');

								if (timeElements.length) {
									let allDisabled = Array.from(timeElements).every(timeElement => timeElement.classList.contains('disable-time'));

									if (allDisabled) {

										console.log(allDisabled);
										element.classList.add('disable');
									}
								}
							});
						}

						if ($firstActive && !$nodeOptions[$item].classList.contains('disable')) {
							$firstActive = false;
							$nodeOptions[$item].classList.add('active');
						}
					};//end $insertPriceBlockPart2

					for (let i = 0; i < $nodeOptions.length; i++) {
						let $optName;

						if ($nodeOptions[i].dataset?.optionid) {
							$optName = $nodeOptions[i]['dataset']['optionid'];
						}

						// if ($optObj['name'] !== $optName) {
						// 	continue;
						// }

						console.log('Seasons',$optObj['seasons']);

						for (let $season of $optObj['seasons']) {
							if ($season['endDate']) {
								if (thisDate >= new Date($season['startDate']).getTime() && thisDate <= new Date($season['endDate']).getTime()) {
									//console.info('optObj HAVE endDate', $optObj['name'], new Date(thisDate).toLocaleString(), $season['startDate'], $season['endDate']);
									$insertPriceBlockPart2($season, i);
								}
							} else if (thisDate >= new Date($season['startDate']).getTime()) {
								//console.info('optObj-season if HAVENT endDate', $optObj['name'], $season);
								$insertPriceBlockPart2($season, i);
							}
						}
					}
				};

			for (let $optObj of $productOptObj) {
				let $startDate = '',
					$endDate = '';

				for (let $season of $optObj['seasons']) {
					if ('' === $season?.endDate) {
						delete $season.endDate;
					}

					if ($startDate === '') {
						$startDate = new Date($season['startDate']).getTime();
					} else {
						if ($startDate > new Date($season['startDate']).getTime()) {
							$startDate = new Date($season['startDate']).getTime();
						}
					}

					if ($endDate === '' && $season?.endDate) {
						//console.log('T1', $season?.endDate);
						$endDate = new Date($season['endDate']).getTime();
					} else {
						if ($season?.endDate && $endDate < new Date($season?.endDate).getTime()) {
							//console.log('T2', $season?.endDate);
							$endDate = new Date($season['endDate']).getTime();
							//console.log('op3', $season['endDate'], $endDate);
						}
					}
					//console.info('!!!!!!!!!!!!!!!!!!!!!!!op1', $season?.endDate, $endDate);
				}

				if ($startDate && $endDate && thisDate >= $startDate && thisDate <= $endDate) {
					//console.log('op1', $optObj?.name, '|||', new Date($startDate).toLocaleString(), '|||', new Date($endDate).toLocaleString());
					$insertPriceBlock($optObj);
				} else if ($startDate && thisDate >= $startDate) {
					//console.log('op2', $optObj?.name,'|||', new Date($startDate).toLocaleString(), '|||', new Date($endDate).toLocaleString());
					$insertPriceBlock($optObj);
				}
				//console.log('-----------------------------------------');
			}
		};
		let asideFun = ($dataObj) => {
			if (!$nodeOptions) {
				$nodeOptions = $contentBox.querySelectorAll('.faq__item-prices .faq__item-price');
			}

			let $unDatesRaw = [];

			$currency = $dataObj?.data?.currency;//currency from viator
			$targetCurrency = $dataObj?.data?.targetCurrency;

			$dateLoad.classList.add('d-none');
			$asideDate.classList.remove('d-none');


			for (let $bookableItems of $dataObj['data']['bookableItems']) {
				let $productItemDate = {
					name: $bookableItems.productOptionCode ?? 'Option1',
					seasons: [],
				};

				if ($bookableItems?.seasons) {
					for (let $season of $bookableItems['seasons']) {

						if (!$season?.pricingRecords) {
							continue;
						}

						let $seasonItem = {
							startDate: '',
							endDate: '',
							pricing: {
								ADULT: [],
								SENIOR: [],
								YOUTH: [],
								CHILD: [],
								INFANT: [],
								TRAVELER: [],
							},
						};

						if ($season?.startDate) {
							$seasonItem['startDate'] = $season.startDate;
						}
						if ($season?.endDate) {
							$seasonItem['endDate'] = $season.endDate;
						}


						if ($season?.pricingRecords) {

							$seasonItem['unavailableDatesInTime'] = {
								length: 0,
							};



							for (let $pricingRecords of $season['pricingRecords']) {
								let $letDayOfWeek = {};

								if ($pricingRecords?.daysOfWeek) {
									for (let i = 0; i < $pricingRecords['daysOfWeek'].length; i++) {
										$letDayOfWeek[$pricingRecords['daysOfWeek'][i]] = $pricingRecords['daysOfWeek'][i];
									}
								}

								if ($pricingRecords?.timedEntries && $pricingRecords?.timedEntries.length) {

									for (let $timedEntry of $pricingRecords.timedEntries) {


										if ($timedEntry?.startTime) {

											let $itemLabel = $timedEntry['startTime'],
												$clearLabel = $itemLabel.replace(':', ''),
												$timeI = 0,
												$timeHtml;

											//START inset option time ▼
											for (let $nodeOption of $nodeOptions) {

												let $optName = $nodeOption.dataset.optionid,
													$queryLabel = `#opt${$optName}-time${$clearLabel}`,
													$inputTime = $nodeOption.querySelector($queryLabel);

												if ($productItemDate['name'] === $optName && !$inputTime) {
													$timeHtml = `<div class="faq__item-price-time ">
														<input type="radio" name="price-time" id="opt${$optName}-time${$clearLabel}" value="${$itemLabel}">
														<label for="opt${$optName}-time${$clearLabel}">${$itemLabel}</label>
														</div>`;
													$nodeOption.querySelector('.faq__item-price-time-wrap').insertAdjacentHTML('beforeend', $timeHtml);

													$timeI++;
													break;
												}
											}
											//END inset option time ▲

											if ($seasonItem['unavailableDatesInTime'][$clearLabel] === undefined) {
												$seasonItem['unavailableDatesInTime'][$clearLabel] = {
													dates: [],
												};
												$seasonItem['unavailableDatesInTime']['length']++;
											}

											let startDate = new Date($season['startDate']);
											let endDate = $season?.endDate ? new Date($season['endDate']) : new Date(startDate.getTime() + 2592000000);

											for (let currentDate = startDate; currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
												let year = currentDate.getFullYear();
												let month = String(currentDate.getMonth() + 1).padStart(2, '0');
												let day = String(currentDate.getDate()).padStart(2, '0');

												let formattedDate = `${year}-${month}-${day}`;
												let $DayOfWeek = getDayOfWeek(formattedDate);

												if ($letDayOfWeek[$DayOfWeek] === undefined) {

													$seasonItem['unavailableDatesInTime'][$clearLabel]['dates'].push(formattedDate);

													// global_unavailableDates

												}
											}

											console.log('unavailableDates', $timedEntry?.unavailableDates);


											if ($timedEntry?.unavailableDates) {

												let year, month, day;
												let targetMonth, query, targetElement;

												let name_s = 'default';

												for (let $unDatesTime of $timedEntry.unavailableDates) {


													if ($unDatesTime?.date && Date.parse($unDatesTime?.date) >= Date.now()) {

														$seasonItem['unavailableDatesInTime'][$clearLabel]['dates'].push($unDatesTime.date);

														if ( $productItemDate['name'] != undefined ){
															name_s = $productItemDate['name'];
														}
														if (!global_unavailableDates[name_s]) {
															global_unavailableDates[name_s] = {};
														}

														if (!global_unavailableDates[name_s][$clearLabel]) {
															global_unavailableDates[name_s][$clearLabel] = []
														}

														let $DayOfWeek = getDayOfWeek($unDatesTime?.date);

//console.log($letDayOfWeek[$DayOfWeek])
														if ($letDayOfWeek[$DayOfWeek] === undefined) {


															global_unavailableDates[name_s][$clearLabel].push($unDatesTime.date);
														}
														//global_unavailableDates[$clearLabel].sort();

													}


												}


												$seasonItem['unavailableDatesInTime'][$clearLabel]['dates'].sort();
											}
										}

									}


								}

								if ($pricingRecords?.unavailableDates) {
									$seasonItem['unavailableDates'] = [];

									for (let $unDate of $pricingRecords['unavailableDates']) {
										$unDatesRaw.push($unDate['date']);
										$seasonItem['unavailableDates'].push($unDate['date']);
									}
								}


								// if (Array.isArray($pricingRecords?.unavailableDates) && $pricingRecords?.unavailableDates.length) {
								// 	for (let unDate of $pricingRecords?.unavailableDates) {
								// 		if (unDate.date === $thisItemDate) {
								// 			$calElement.classList.add('-disabled-');
								// 		}
								// 	}
								// }

								if ($pricingRecords?.pricingDetails) {
									for (let $pricingDetails of $pricingRecords['pricingDetails']) {
										let $ageBandName = $pricingDetails['ageBand'].toUpperCase();

										$seasonItem['pricing'][$ageBandName].push({
											minTravelers: $pricingDetails?.minTravelers || 0,
											maxTravelers: $pricingDetails?.maxTravelers || 0,
											price: $pricingDetails['price']['original']['recommendedRetailPrice'],
										});

										if ($ageBandName === 'ADULT' || $ageBandName === 'TRAVELER') {
											$people[$ageBandName] = 2;

											$pricesDates.push({
												start: $seasonItem['startDate'],
												end: $seasonItem['endDate'],
												price: $pricingDetails['price']['original']['recommendedRetailPrice'],
											});
										}
									}
								}
							}
						}

						$productItemDate['seasons'].push($seasonItem);
					}
				}

				$productOptObj.push($productItemDate);
			}


			let $tArr = {};
			for (let $optItem of $productOptObj) {
				$tArr[$optItem['name']] = [];

				for (let $season of $optItem['seasons']) {
					let unicDates = getUnicDates($season);

					//


					let commonDates = findCommonDates($season);

					if (commonDates.length) {
						$tArr[$optItem['name']].push(commonDates);
					}
				}
			}


			if ($tArr) {
				let allDuplicateDates = findDuplicateDates($tArr);
				$unDatesRaw = [...$unDatesRaw, ...allDuplicateDates];
			}

			if ($unDatesRaw.length) {
				$unDatesRaw.sort();
				$unavailableDates = [...new Set($unDatesRaw)];
			}

			// console.dir('$objOptAll', $objOptAll);
			//console.dir('$pricesDates', $pricesDates);
			// console.dir('$productOptObj', $productOptObj);
			// console.log('$unavailableDates', $unavailableDates);


			$iconCurrency = getIconCurrency($targetCurrency);
			insertDateCalendar($pricesDates, $iconCurrency);

			let $summaryPrice = $rate ? $dataObj?.data?.summary?.fromPrice * $rate : $dataObj?.data?.summary?.fromPrice;

			$priceTotal2.textContent = `~${$iconCurrency}${$summaryPrice.toFixed(2)}`;
			$priceTotal.textContent = `${$iconCurrency}${$summaryPrice.toFixed(2)}`;


		};

		// Calendar
		let insertDateCalendar = ( pricesDates, iconCurrency) => {
			let $calElements = document.querySelectorAll('.aside-date .air-datepicker-cell');

			//insert price to dates
			for (let $calElement of $calElements) {
				let {year, month, date} = $calElement.dataset,
					thisItemDate = `${year}-${fixedMonth(month)}-${fixedDate(date)}`,
					$thisTineStamp = Date.parse(thisItemDate);

				// for (let pricesDate of pricesDates) {
				// 	let $thisPrice = $rate ? pricesDate?.price * $rate : pricesDate?.price;
				//
				// 	if (pricesDate?.end) {
				//
				// 		if ($thisTineStamp >= Date.parse(pricesDate?.start) && $thisTineStamp <= Date.parse(pricesDate?.end)) {
				//
				// 			$calElement.innerHTML = `${date}<small class="aside-datepicker-price">${iconCurrency}${Math.ceil($thisPrice)}</small>`;
				// 		}
				// 	} else {
				// 		if ($thisTineStamp >= Date.parse(pricesDate['start'])) {
				//
				// 			$calElement.innerHTML = `${date}<small class="aside-datepicker-price">${iconCurrency}${Math.ceil($thisPrice)}</small>`;
				// 		}
				// 	}
				// }


				// disable/enable dates on the calendar

				if (Object.keys(global_unavailableDates).length) {

					let disable = true;
					let counter = 0;

					let counter_sections = 0;
					for (let unavailable in global_unavailableDates) {

						for (let section in global_unavailableDates[unavailable]) {
							counter_sections++;
							if (global_unavailableDates[unavailable][section].includes(thisItemDate)) {
								counter++;
							}
						}
					}

					if (counter_sections == counter) {
						$calElement.classList.add('-disabled-');
					}

				}


			}
		};

		let handlerBtnBooking = ($type = 'viator') => {
			let $btnBooking = document.querySelector('.ajax_add_to_cart');
			if (!$btnBooking) {
				return;
			}

			$btnBooking.addEventListener('click', function (evt) {
				evt.preventDefault();

				if (!$travelDate) {
					return;
				}

				let $meetSelect = document.querySelector('.faq__item-meet-point .faq__item-meet-select');

				if (!$btnBooking.classList.contains('active')) {
					return;
				}

				$btnBooking.classList.remove('active');

				let $thumb;
				if ($postData['data']?.images) {
					let $imgVariants = $postData['data']['images'][0]['variants'];
					$thumb = $postData['data']['images'][0]['variants'][$imgVariants.length - 1].url;
				}

				let $action = 'save_woo_order_fields',
					$itemBox = document.querySelector('.faq__item-price.active'),
					$isTimes = document.querySelector('.faq__item-price-time input[type="radio"]'),
					$startTime = '';

				if ($itemBox) {
					$startTime = $itemBox.querySelector('.faq__item-price-time input[type="radio"]:checked');
				}

				if ($isTimes && !$startTime) {
					$btnBooking.classList.add('active');
					alert('Need selected start time!');
					return;
				}

				let $dataObj = {
					processData: false,
					// contentType: false,
					cache: false,
					nonce: getNonce(),
					productCode: $dataForSend['id'],
					travelDate: $travelDate,
					startTime: $startTime?.value,
					paxMix: $people,
					language: $viatorLang,
					pickup: {
						id: $meetSelect?.value,
						name: $meetSelect?.options[$meetSelect.selectedIndex].textContent,
					},
					postData: {
						title: $postData['data']['title'],
						thumb: $thumb,
						link: window.location.pathname
					},
				};

				if ($itemBox.dataset.optionid !== 'Option1') {
					$dataObj['optionCode'] = $itemBox.dataset.optionid;
				}

				jQuery.blockUI({
					message: null,
					overlayCSS: {
						background: '#fff',
					},
				});

				let $price = document.querySelector('.faq__item-price.active .faq__item-price-total');

				if ($type === 'woo') {
					$dataObj['woo_price'] = $price?.dataset?.price;
					$dataObj['targetCurrency'] = $dataForSend['targetCurrency'];

				}


				if ($type === 'viator') {
					$action = 'viator_hold_booking';
					$dataObj['convert_price'] = $price?.dataset?.price;
					$dataObj['currency'] = $currency;//currency from viator
					$dataObj['targetCurrency'] = $targetCurrency;
					$dataObj['locations'] = JSON.stringify(viatorSingleObj['locations']);
					$dataObj['postData']['bookingQuestions'] = $postData?.data?.bookingQuestions;

					$dataObj['allowCustomTravelerPickup'] = $postData?.data?.logistics?.travelerPickup?.allowCustomTravelerPickup;

					$dataObj['postData']['languageGuides'] = $postData.data.productOptions.reduce((acc, item) => {
						acc[item.productOptionCode] = item.languageGuides;
						return acc;
					}, {});

				}

				wp.ajax.send($action, {
					data: $dataObj,
					success: function (data) {


						setTimeHold();

						if ('undefined' === typeof wc_add_to_cart_params) {
							window.location = '/checkout/';
						}

						window.location = wc_add_to_cart_params.cart_url;
					},
					error: function (data) {
						let $body = document.querySelector('body'),
							$modalBok = $body.querySelector('#modal-booking');

						$body.classList.add('modal-open');
						$modalBok.classList.add('active');
						$btnBooking.classList.add('active');
						jQuery.unblockUI();
					},
				});

			});
		};

		//START formation ageBands
		if ($postData?.data?.pricingInfo?.ageBands) {
			let $dataCountPeople = Number(sessionStorage.getItem('dataCountPeople')),
				$template = wp.template('ageBands'),
				$data = {
					maxTravelers: '??',
					defaultCount: 2,
					ageBands: [],
				};

			for (let $ageBand of $postData?.data?.pricingInfo?.ageBands) {
				let $name = $ageBand['ageBand'].toLowerCase(),
					$dataObj = {
						name: $ageBand['ageBand'].toUpperCase(),
						txt: `${$name} (${$ageBand['startAge']}-${$ageBand['endAge']})`,
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
					sessionStorage.setItem('dataCountPeople', '2');
					$data['ageBands'].unshift($dataObj);
				} else {
					$data['ageBands'].push($dataObj);
				}
			}
			// console.log($data);
			$asidePeople.insertAdjacentHTML('beforeend', $template($data));
		}
		//END formation ageBands

		//START HANDLERS ▼
		$asideBtns.addEventListener('click', function (evt) {
			for (let target = evt.target; target && target !== this; target = target.parentNode) {
				if (target.matches('.btn-outline-primary')) {
					let $newCount,
						$main = target.closest('.aside-date__bands'),
						$parent = target.parentNode,
						$item = $parent.querySelector('span'),
						$allCount = Number($main.dataset.allcount),
						$count = Number($item.textContent.trim()),
						$thisMinCount = Number(target?.dataset?.min ?? 0),
						$name = target.closest('.aside-date__bands-item').querySelector('.aside-date__bands-info p').dataset.name;

					//increase this (збільшення)
					if (target.matches('.btn-increment')) {
						$newCount = ++$count;
						++$allCount;

					}

					//reduce this (зменшення)
					if (target.matches('.btn-decrement')) {
						$newCount = --$count;
						--$allCount;

						if ($allCount < $maxTravelers) {
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

					//розблокування decrement
					if ($newCount === 1) {
						$parent.querySelector('.btn-decrement').removeAttribute('disabled');
					}
					//заблокування decrement

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
						$people[$name] = $newCount;
						$item.textContent = String($newCount);
						$main.setAttribute('data-allCount', String($allCount));
					}

					if ( target.matches('.btn-increment') || target.matches('.btn-decrement') ) {
						showPriceBlock();
					}

					break;
				}

				// if (target.matches('.btn-ageBands-apply')) {
				// 	console.log($people, 'active booking');
				// 	showPriceBlock();
				// 	break;
				// }
			}
		}, false);//handler ageBands

		window['asideDateSelectHandler'] = function (date, formattedDate, datepicker) {//Calendar Handler select

			if (date) {
				setTimeout(() => {
					if (window.outerWidth < 992) {
						$asideDate.classList.remove('active');
					}

					window.scrollTo(0, $faqPrice.offsetTop - 40);
				}, 300);

				showPriceBlock(new Date(formattedDate).getTime(), formattedDate);
			}
		};

		window['asideDateChangeHandler'] = function (month, year, decade) {//Calendar Handler change

			setTimeout(() => {
				insertDateCalendar($pricesDates, $iconCurrency);
			}, 5);
		};
		//END HANDLERs ▲


		if ($dataForSend['type'] === 'woo') {
			if ($postData?.data?.bookableItems) {
				$rate = $postData?.data?.rate
				asideFun($postData);
				handlerBtnBooking($dataForSend['type']);
			}
		} else {
			if ($postData['data']['bookingConfirmationSettings']['confirmationType'] === 'INSTANT') {

				try {
					let $availObj = {
							action: 'availability_product',
							id: $dataForSend['id'],
							targetCurrency: $dataForSend['targetCurrency'],
						},
						$request = await axios({
							method: 'POST',
							data: new URLSearchParams($availObj),
							url: '/wp-admin/admin-ajax.php',
						});

					$request = $request['data'];

					if (!$request?.data) {
						return;
					}

					console.dir('availability_product request:', $request?.data);

					$rate = $request?.data?.rate
					asideFun($request);

					//Handler Booking ▼
					handlerBtnBooking();
					//Handler Booking ▲
				} catch (error) {
					console.error(error);
				}
			} else {
				document.querySelector('.excursion__aside').innerHTML = `<p class="isnt-bookable">` + __('This experience isn\'t bookable for now.', 'viator') + `</p>`;
			}
		}
	}, 250);
	//Aside date

	//START handler price
	$contentBox.addEventListener('click', function (evt) {
		for (let target = evt.target; target && target !== this; target = target.parentNode) {

			if (target.matches('.faq__item-price') && !target.classList.contains('disable')) {

					for (let $pricesItem of $contentBox.querySelectorAll('.faq__item-prices .faq__item-price')) {
						$pricesItem.classList.remove('active');
					}

					if (!target.classList.contains('active')) {
						target.classList.add('active');
					}

				break;
			}
		}
	}, false);
	//END handler price

}());
