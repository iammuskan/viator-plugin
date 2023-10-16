'use strict';
import {
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
} from './functions.js';

const {__, _x, _n, _nx} = wp.i18n;
(async function () {
	let $totalCount,
		$filterObj = {},
		$page =1,
		$offset = 0,
		$mainData = {
			action: 'get_products_search',
			target: 'category',
		},
		$viatorLang = sessionStorage.getItem('viatorLang'),
		$viatorCurrency = localStorage.getItem('viatorCurrency') ?? viatorParameters?.default_currency,
		$catWrap = document.querySelector('.catalog .catalog__wrap'),
		$totalCountBox = $catWrap ? $catWrap.querySelector('.catalog__content-top p') : '',
		$pagination = $catWrap.querySelector('.catalog__content .pagination'),
		$catalogContent = $catWrap.querySelector('.catalog__content .row'),
		$filterBox = $catWrap.querySelector('.catalog__filter .filter__wrap'),
		$fieldDateToday = $filterBox.querySelector('#fieldDateToday'),
		$fieldDateTomor = $filterBox.querySelector('#fieldDateTomorrow'),
		$fieldDateCustom = $filterBox.querySelector('#fieldDateCustom'),
		$fieldDateRange = $filterBox.querySelector('.form-date-range'),
		$btnFilterReset = $filterBox.querySelector('#btnFilterReset'),
		$btnFilterSubmit = $filterBox.querySelector('#btnFilterSubmit');
		

	const handlerNav = (element, type = '', evt = '', allPage = 0) => {
		// HandlerNav code here...
		element.addEventListener('click', async function () {
				if (type === 'arrow') {
					let $activeItem = Number(
						document.querySelector('.pagination .pagination__item.active').dataset.page);

					if (evt === 'prev') {
						if ($activeItem > 1) {
							$page = $activeItem - 1;
						} else {
					
							return;
						}
					}

					if (evt === 'next') {
						if ($activeItem < allPage) {
							$page = $activeItem + 1;
						} else {
							return;
						}
					}
				} else {
					$page = Number(element.dataset.page);
				}

				$mainData['page'] = $page;
				$mainData['pagination'] = (($page - 1) * 12) + 1;
				$mainData['offset'] = $offset;

				console.log('pagination', $page);

				insertSkeleton(12, $catalogContent, 2);
				await sendData({...$mainData, ...$filterObj});
			});
	};

	const insertNav = ($inBlock, $current = 1, $allPage = 2) => {
		// InsertNav code here...
			$inBlock.innerHTML = '';

			if (!$inBlock || $allPage < 2) {
				return;
			}

			let $prevSvg = '<span class="pagination__item-icon"><svg width="13" height="22" viewBox="0 0 13 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.966174 11.0935C0.966174 10.8541 1.05649 10.6145 1.23688 10.4318L10.476 1.07262C10.8371 0.706912 11.4217 0.706912 11.7825 1.07262C12.1432 1.43833 12.1435 2.03053 11.7825 2.39601L3.19651 11.0935L11.7825 19.791C12.1435 20.1567 12.1435 20.7489 11.7825 21.1144C11.4214 21.4799 10.8368 21.4801 10.476 21.1144L1.23688 11.7552C1.05649 11.5725 0.966174 11.3329 0.966174 11.0935Z" fill="#C0C0C0" /></svg></span>',
				$nextSvg = '<span class="pagination__item-icon"><svg width="13" height="22" viewBox="0 0 13 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0338 11.0935C12.0338 10.8541 11.9435 10.6145 11.7631 10.4318L2.52396 1.07262C2.16294 0.706912 1.57833 0.706912 1.21754 1.07262C0.856753 1.43833 0.856522 2.03053 1.21754 2.39601L9.80349 11.0935L1.21754 19.791C0.856523 20.1567 0.856523 20.7489 1.21754 21.1144C1.57856 21.4799 2.16317 21.4801 2.52396 21.1144L11.7631 11.7552C11.9435 11.5725 12.0338 11.3329 12.0338 11.0935Z" fill="#C0C0C0" /></svg></span>',
				$prev = document.createElement('a'),
				$next = document.createElement('a'),
				$startItem = document.createElement('a'),
				$endItem = document.createElement('a'),
				maxIteration = $allPage > 4 ? 5 : $allPage;

			handlerNav($prev, 'arrow', 'prev', $allPage);
			handlerNav($next, 'arrow', 'next', $allPage);
			handlerNav($startItem);
			handlerNav($endItem);

			$inBlock.classList.add('pagination');
			$prev.classList.add('pagination__item');
			$prev.classList.add('pagination__item_prev');
			$next.classList.add('pagination__item');
			$next.classList.add('pagination__item_next');

			$prev.insertAdjacentHTML('afterbegin', $prevSvg);
			$next.insertAdjacentHTML('afterbegin', $nextSvg);
			$inBlock.insertAdjacentElement('afterbegin', $prev);


			if ($allPage > 5){
				$startItem.classList.add('pagination__item');
				$startItem.textContent = '1';
				$startItem.setAttribute('data-page', '1');
				$inBlock.insertAdjacentElement('beforeend', $startItem);

				if ($current === 1) {
					$startItem.classList.add('active');

					for (let i = 2; i < 5; i++) {
						let $navItem;
						if ($current === i) {
							$navItem = document.createElement('span');
							$navItem.classList.add('active');
						} else {
							$navItem = document.createElement('a');
						}

						$navItem.textContent = i;
						$navItem.classList.add('pagination__item');
						$navItem.setAttribute('data-page', i);
						$inBlock.insertAdjacentElement('beforeend', $navItem);
						handlerNav($navItem);
					}
				}

				if ($current === 2) {
					for (let i = 2; i < 5; i++) {
						let $navItem;

						if ($current === i) {
							$navItem = document.createElement('span');
							$navItem.classList.add('active');
						} else {
							$navItem = document.createElement('a');
						}

						$navItem.textContent = i;
						$navItem.classList.add('pagination__item');
						$navItem.setAttribute('data-page', i);
						$inBlock.insertAdjacentElement('beforeend', $navItem);
						handlerNav($navItem);
					}
				}

				if ($current > 2) {
					$inBlock.insertAdjacentHTML('beforeend',
						'<span class="pagination__item pagination__dot">...</span>',
					);
				}

				if ($current > 2 && $current <= ($allPage - 3)) {
					for (let i = $current; i < 3 + $current; i++) {
						let $navItem;

						if ($current === i) {
							$navItem = document.createElement('span');
							$navItem.classList.add('active');
						} else {
							$navItem = document.createElement('a');
						}

						$navItem.textContent = i;
						$navItem.classList.add('pagination__item');
						$navItem.setAttribute('data-page', i);
						$inBlock.insertAdjacentElement('beforeend', $navItem);
						handlerNav($navItem);
					}
				}

				if ($current > ($allPage - 3)) {
					for (let i = ($allPage - 3); i < $allPage; i++) {
						let $navItem;

						if ($current === i) {
							$navItem = document.createElement('span');
							$navItem.classList.add('active');
						} else {
							$navItem = document.createElement('a');
						}

						$navItem.textContent = i;
						$navItem.classList.add('pagination__item');
						$navItem.setAttribute('data-page', i);
						$inBlock.insertAdjacentElement('beforeend', $navItem);
						handlerNav($navItem);
					}
				}

				if ($current <= ($allPage - 3)) {
					$inBlock.insertAdjacentHTML('beforeend',
						'<span class="pagination__item pagination__dot">...</span>',
					);
				}

				if ($current === $allPage) {
					$endItem.classList.add('active');
				}

				$endItem.classList.add('pagination__item');
				$endItem.textContent = $allPage;
				$endItem.setAttribute('data-page', $allPage);
				$inBlock.insertAdjacentElement('beforeend', $endItem);

			}
			else{
				for (let i = 1; i <= $allPage; i++) {
					let $navItem;

					if (i === 1){
						$startItem.classList.add('pagination__item');
						$startItem.textContent = i;
						$startItem.setAttribute('data-page', i);
						$inBlock.insertAdjacentElement('beforeend', $startItem);
					}

					if ($current === i && i !== 1 && i !== $allPage ){
						$navItem = document.createElement('span');
						$navItem.textContent = i;
						$navItem.classList.add('pagination__item');
						$navItem.classList.add('active');
						$navItem.setAttribute('data-page', i);
						$inBlock.insertAdjacentElement('beforeend', $navItem);
						handlerNav($navItem);

					} else if ($current === i && i === 1 && i !== $allPage){
						$startItem.classList.add('active');
					} else if ($current === i && i !== 1 && i === $allPage){
						$endItem.classList.add('active');
					} else if ($current !== i && i !== 1 && i !== $allPage){
						$navItem = document.createElement('a');
						$navItem.textContent = i;
						$navItem.classList.add('pagination__item');
						$navItem.setAttribute('data-page', i);
						$inBlock.insertAdjacentElement('beforeend', $navItem);
						handlerNav($navItem);
					}

					if ($allPage === i){
						$endItem.classList.add('pagination__item');
						$endItem.textContent = i;
						$endItem.setAttribute('data-page', i);
						$inBlock.insertAdjacentElement('beforeend', $endItem);
					}
				}
			}

			$inBlock.insertAdjacentElement('beforeend', $next);

	};
function processMainCategor() {
  // Get the text of the second div's h1 element
  const secondDivH1Text = document.querySelector('.top-head__title').textContent;

  // Loop through all the main-categor divs
  const mainCategorDivs = document.querySelectorAll('.main-categor');
  mainCategorDivs.forEach(div => {
    // Get the text of the h1 element in each main-categor div
    const h1Text = div.querySelector('h1').textContent;

    // Check if the h1 texts match
    if (h1Text === secondDivH1Text) {
      // Add the "active" class
      div.classList.add('active');

      // Get all the li elements in the ul of the active main-categor
      const activeLiElements = div.querySelectorAll('ul li');

      // Loop through the li elements and print their values
      activeLiElements.forEach(li => {
        if (li.textContent.trim() !== "") {
          console.log(li.textContent);
        }
      });
    }
  });

  // Create a map of data-code to col-sm-6 elements
  const colSm6Map = new Map();
  const colSm6Elements = document.querySelectorAll('.col-sm-6');
  colSm6Elements.forEach(col => {
    const dataCodeValue = col.getAttribute('data-code');
    colSm6Map.set(dataCodeValue, col);
  });

  // Loop through the li elements and reorder the col-sm-6 elements
  const listItems = document.querySelectorAll('.listofclass li');
  const reversedListItems = Array.from(listItems).reverse(); // Reverse the order
  reversedListItems.forEach(li => {
    const dataCodeValue = li.textContent.trim();
    const col = colSm6Map.get(dataCodeValue);
    if (col) {
      col.parentNode.prepend(col);
    }
  });
}
const sendData = async (data) => {
			

			if ($viatorLang) {
				data['language'] = $viatorLang;
			}

			if ($viatorCurrency) {
				data['currency'] = $viatorCurrency;
			}

			try {
				let $result = await axios({
					method: 'POST',
					data: new URLSearchParams(data),
					url: '/wp-admin/admin-ajax.php',
				});

console.log($result)
				$result = $result['data'];
				console.dir($result);
                				console.log($result);
                	       
document.querySelector('#searchProducts').addEventListener('input', function(event) {
    const searchValue = event.target.value.toLowerCase(); // Convert to lowercase for case-insensitive matching

    // Filter products whose title matches the search value
    const matchingProducts = $result['data']['products'].filter(item => item.title.toLowerCase().includes(searchValue));
    
    // Get the suggestions div
    const suggestionsDiv = document.querySelector('.destination-modal-box');

    // Get the ul element inside the suggestions div
    const suggestionsList = suggestionsDiv.querySelector('#suggestions');

    // Make the suggestions div visible
    suggestionsDiv.style.display = matchingProducts.length > 0 ? 'block' : 'none';

    // Clear the previous suggestions
    suggestionsList.innerHTML = '';

    // Map the matchingProducts and populate the suggestions list
    matchingProducts.forEach(product => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'sugges');
        li.textContent = product.title;
        suggestionsList.appendChild(li);

        // Add click event listener to li elements
        li.addEventListener('click', function() {
            document.querySelector('#searchProducts').value = product.title;
            suggestionsDiv.style.display = 'none';
            // updateMatchingTitles(product.title);
            	$btnFilterSubmit.addEventListener('click');
        });
        document.querySelector('.top-head__image').addEventListener('click', function(){
    document.querySelector('#suggestions').style.display = 'none';
});
    });

});

document.querySelector('#seacrtours').addEventListener('click', function() {
    const searchValue = document.querySelector('#searchProducts').value.toLowerCase();
    updateMatchingTitles(searchValue);
    document.querySelector('.pagination').style.display= 'none';
     document.querySelector('.destination-modal-box').style.display= 'none';
  function countVisibleColSm6Elements() {
  var colSm6Elements = document.querySelectorAll('.catalog__content .col-sm-6');
  var visibleColSm6Elements = [];

  colSm6Elements.forEach(function(element) {
    var style = window.getComputedStyle(element);
    if (style.display === 'block') {
      visibleColSm6Elements.push(element);
    }
  });

  var length = visibleColSm6Elements.length;
  document.getElementById('newss').textContent = 'We found ' + length + ' results.';
}

// Call the function
countVisibleColSm6Elements();
});

function updateMatchingTitles(searchValue) {
    const matchingTitles = document.querySelectorAll('.activities-item__title');
    
    matchingTitles.forEach(title => {
        const colDiv = title.closest('.col-sm-6');
        if (title.textContent.toLowerCase().includes(searchValue)) {
            colDiv.style.display = 'block';
        } else {
            colDiv.style.display = 'none';
        }
    });
}

// Add event listener to input to hide suggestionsDiv if input is empty
document.querySelector('#searchProducts').addEventListener('input', function(event) {
    const input = event.target;
    const suggestionsDiv = document.querySelector('.destination-modal-box');
    suggestionsDiv.style.display = input.value.trim() !== '' ? 'block' : 'none';

});

                				

				if ($result?.data) {
					$totalCount = 0;
					if ($result?.data?.totalCount) {
						$totalCount = $result.data.totalCount;
					}
                   
					$totalCountBox.textContent = `${__('We found', 'viator')} ${$totalCount} ${__('results', 'viator')}`;
   

					if ($result?.dest) {
						updateStorage($result['dest'], 'Dest');
					}

					if ($result?.tags) {
						updateStorage($result['tags'], 'Tags');
					}
				// 	 if (data.searchQuery) {
    //         $result['searchQuery'] = data.searchQuery;
    //     }

					if ($result?.data?.offset) {
						$offset = $result['data']['offset'];
						console.log('request $offset ', $offset);
					}

					insertCardProducts(
						$catalogContent,
						$result['data']['products'],
						'category',
					);
console.log(	$result['data']['products']);

					insertNav(
						$pagination,
						$page,
						Math.floor($result['data']['totalCount'] / 12),
					);

					//console.log($pagination, $page, Math.floor($result[ 'data' ][ 'totalCount' ] / 8));
				} else {
					console.log('Error');
				}
processMainCategor();

			} catch (error) {
				console.info(error);
			}
	
};


	if (viatorSingleObj?.dest_name) {
		$mainData['destName'] = viatorSingleObj['dest_name'];
	}

	if (sessionStorage.getItem('dataFromHome')) {
		let $dataFromHome = sessionStorage.getItem('dataFromHome');
		if (new Date().toLocaleDateString() === new Date($dataFromHome).toLocaleDateString()) {
			$fieldDateToday.setAttribute('checked', 'checked');
			$filterObj['filterFieldDate'] = __('today', 'viator');

		} else if (new Date(Date.now() + 86400000).toLocaleDateString() === new Date(
			$dataFromHome).toLocaleDateString()) {
			$fieldDateTomor.setAttribute('checked', 'checked');
			$filterObj['filterFieldDate'] = __('tomorrow', 'viator');

		} else {
			$fieldDateCustom.setAttribute('checked', 'checked');
			$fieldDateRange.classList.toggle('d-none');
			$filterObj['fieldDateRange'] = $dataFromHome;

			if (window?.fieldDatepickerRange) {
				console.log($dataFromHome.replaceAll(' ', '').split('/'));
				window.fieldDatepickerRange.selectDate($dataFromHome.replaceAll(' ', '').split('/'));
			}
		}
		//sessionStorage.removeItem('dataFromHome');
	}

	if ($viatorLang) {
		$filterObj['language'] = $viatorLang;
	}
	if ($viatorCurrency) {
		$filterObj['currency'] = $viatorCurrency;
	}

	if (!localStorage.getItem('viatorTags') || Date.now() > localStorage.getItem('viatorTagsLastUp')) {
		$mainData['get_tags'] = true;
	}

	if (!localStorage.getItem('viatorDest') || Date.now() > localStorage.getItem('viatorDestLastUp')) {
		$mainData['get_destinations'] = true;
	}

	await sendData({...$mainData, ...$filterObj});
	delete $mainData['get_destinations'];

	// Filter Handlers
	$filterBox.addEventListener('click', function (evt) {
		if (evt.target.matches('.fieldDateToday')) {
			if (!$fieldDateRange.classList.contains('d-none')) {
				$fieldDateRange.classList.add('d-none');
				window.fieldDatepickerRange.clear();
			}
		}
		if (evt.target.matches('.fieldDateTomorrow')) {
			if (!$fieldDateRange.classList.contains('d-none')) {
				$fieldDateRange.classList.add('d-none');
				window.fieldDatepickerRange.clear();
			}
		}
		if (evt.target.matches('.fieldDateCustom')) {
			$fieldDateRange.classList.toggle('d-none');
			window.fieldDatepickerRange.clear();
		}
	});

	$btnFilterReset.addEventListener('click', async function () {
		insertSkeleton(4, $catalogContent, 2);

		if (!$fieldDateRange.classList.contains('d-none')) {
			$fieldDateRange.classList.add('d-none');
		}

		$fieldDateToday.removeAttribute('checked');
		$fieldDateTomor.removeAttribute('checked');
		$fieldDateCustom.removeAttribute('checked');

		$fieldDateRange.value = '';
		window.sliderFilterPrice.refresh();
		window.fieldDatepickerRange.clear();
		window['viatorFilterSort'].val(null).trigger("change");

		await sendData($mainData);
	});

	$btnFilterSubmit.addEventListener('click', async function (evt) {
		evt.preventDefault();
		$filterObj = {};

		insertSkeleton(4, $catalogContent, 2);

		for (let [name, value] of new FormData($filterBox)) {
			console.log(`name ${name}, value ${value}`,);
			if (!value ||
				(name === 'filterFieldDate' && value === 'on') ||
				(name === 'filterFieldPrice' && value === '0,500')) {
				continue;
			}

			$filterObj[name] = value;
		}

		if (window['viatorFilterSort'].val()) {
			$filterObj['sort'] = window['viatorFilterSort'].val();
		}

		console.log($filterObj);

		await sendData({...$mainData, ...$filterObj});
		
	});

	window['viatorFilterSort'].on('select2:select', async function (evt) {
		insertSkeleton(4, $catalogContent, 2);
		$filterObj['sort'] = evt.params.data.id;
		await sendData({...$mainData, ...$filterObj});
	});

	// START main-banner
	let $inputDest = document.querySelector('#searchDestination'),
		$searchTourBtn = document.querySelector('#searchTourBtn'),
		$modal_destinations = document.querySelector('#modal_destinations');

	if ($inputDest) {
		let $dropdownBox = document.querySelector('.custom-select .destination-modal-box');

		$inputDest.addEventListener('click', function (event) {
			event.stopPropagation();
			$dropdownBox.classList.toggle('active');
			$modal_destinations.classList.toggle('active');
		});

		document.addEventListener("click", function (event) {
			if (!$modal_destinations.contains(event.target)) {
				$modal_destinations.classList.remove("active");
			}
		});

		$dropdownBox.addEventListener('click', function (evt) {
			$inputDest.value = evt.target.textContent;
			$inputDest.setAttribute('data-destinationId', evt.target.getAttribute('data-destId'));
			$inputDest.setAttribute('data-destinationUrlName', evt.target.getAttribute('data-destinationUrlName'));
			$inputDest.setAttribute('data-parent', evt.target.getAttribute('data-parent'));
		});

		document.querySelector('body').addEventListener('click', function (evt) {
			if (evt.target !== $inputDest && $dropdownBox.classList.contains('active')) {
				$dropdownBox.classList.remove('active');
			}
		});

		const getDestinationNameByParentId = (data, parentId) => {
			for (let i = 0; i < data.length; i++) {
				if (data[i]?.destinationId === parentId) {
					return {
						name : data[i]?.destinationName,
						url : data[i]?.destinationUrlName
					};
				}
			}
			return '';
		};

		$inputDest.addEventListener('keyup', function (evt) {
			evt.preventDefault();
			let $listGroup = $dropdownBox.querySelector('.list-group');

			$inputDest.parentNode.classList.remove('error');
			$listGroup.innerHTML = '';

			if (evt.code === 'Backspace') {
				let $li = document.createElement('li');

				$li.classList.add('list-group-item');
				$li.textContent = __('Start entering text...', 'viator');
				$listGroup.insertAdjacentElement('beforeend', $li);
				return;
			}

			let $count = 0,
				$q = this.value.toLowerCase(),
				$destAll = getDestinations();

			for (let $dest of $destAll) {

				if ($dest['destinationName'].substring(0, $q.length).toLowerCase() === $q && $count <= 9) {
					console.log($dest);

					let parent = getDestinationNameByParentId(getDestinations(), $dest['parentId']);

					let $li = document.createElement('li');

					$li.classList.add('list-group-item');
					$li.textContent = parent ? $dest?.destinationName + ', ' + parent.name : $dest?.destinationName;
					$li.setAttribute('data-destId', $dest?.destinationId);
					$li.setAttribute('data-destinationUrlName', $dest?.destinationUrlName);
					$li.setAttribute('data-parent', parent.url);

					$listGroup.insertAdjacentElement('beforeend', $li);
					$count++;
				}

				if ($count === 9) {
					break;
				}
			}
		});
	}

	if ($searchTourBtn) {
		$searchTourBtn.addEventListener('click', function () {
			let $searchTime = document.querySelector('#searchTime').value,
				$searchPeople = document.querySelector('#searchPeople').value || '2';

			if ($inputDest.value) {
				let $lang = '',
					//$destName = $inputDest.value.replaceAll(' ', '-');
					$destName = $inputDest.getAttribute('data-destinationUrlName'),
					$parent = $inputDest.getAttribute('data-parent');

				if ($searchTime) {
					sessionStorage.setItem('dataFromHome', $searchTime);
				}

				if (viatorSingleObj?.lang !== viatorSingleObj?.default_lang) {
					$lang = viatorSingleObj['lang'] + '/';
				}

				sessionStorage.setItem('dataCountPeople', $searchPeople);

				if ($parent == 'undefined'){
					$parent = '';
				} else {
					$parent = $parent + '_';
				}

				window.location = `https://staging.ilmioviaggio.com/${$lang}product-category/${$parent}${$destName}/`;
			} else {
				$inputDest.parentNode.classList.add('error');
			}
		});
	}
})();




