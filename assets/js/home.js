'use strict';
import {
	getHomeUrl,
	updateStorage,
	getDestinations,
	insertCardProducts,
} from './functions.js';

const {__, _x, _n, _nx} = wp.i18n;


(async function () {
    let $dataForSend = {
        action: 'get_products_search',
        target: 'home',
    };
    let $viatorLang = sessionStorage.getItem('viatorLang');
    let $viatorCurrency = localStorage.getItem('viatorCurrency') ?? viatorParameters?.default_currency;

    if (!localStorage.getItem('viatorDest') || Date.now() > localStorage.getItem('viatorDestLastUp')) {
        $dataForSend['get_destinations'] = true;
    }

    if (!localStorage.getItem('viatorTags') || Date.now() > localStorage.getItem('viatorTagsLastUp')) {
        $dataForSend['get_tags'] = true;
    }

    if ($viatorLang) {
        $dataForSend['language'] = $viatorLang;
    }
    if ($viatorCurrency) {
        $dataForSend['currency'] = $viatorCurrency;
    }

    try {
        let $result = await axios({
            method: 'POST',
            data: new URLSearchParams($dataForSend),
            url: '/wp-admin/admin-ajax.php',
        });

        $result = $result['data'];
        console.log($result);


        if ($result?.data) {
            if ($result?.dest) {
                updateStorage($result['dest'], 'Dest');
            }
            if ($result?.tags) {
                updateStorage($result['tags'], 'Tags');
            }

            insertCardProducts(
                document.querySelector('.block-popular .newrowclass'),
                viatorParameters?.featured_source === 'prod' ? $result?.data : $result?.data?.products,
            );
            const gridElements = document.querySelector('.block-popular .row').innerHTML; // Select all grid elements
             const pageUrl = window.location.href; // Get current page URL
            const currentDate=  new Date().toISOString().slice(0, 10);
             console.log(gridElements);

          try { let storeDataResponse = await axios({
                    method: 'POST',
                    data: new URLSearchParams({
                        action: 'store_api_response_data',
                        htmlData: gridElements,
                        pageUrl: pageUrl,
                        date: currentDate,
                    }),
                    url: '/wp-admin/admin-ajax.php',
                });

                console.log('HTML data sent to the backend:', storeDataResponse);
            } catch (error) {
                console.error('Error sending HTML data:', error);
            }
            if (document.querySelectorAll('.rowed').length === 0) {
  document.querySelector('.newrowclass').style.display='flex';
} else {
     document.querySelector('.newrowclass').style.display='none';

}
const prices = document.querySelectorAll('.newrowclass .activities-item__price');

// Create an array to store the innerHTML
const pricesArray = [];

// Loop through each element and extract the innerHTML
prices.forEach(price => {
  pricesArray.push(price.innerHTML);
});

// Log the array to the console
console.log(pricesArray);
const targetElements = document.querySelectorAll('.rowed .activities-item__price');

// Loop through target elements and append the innerHTML from pricesArray
targetElements.forEach((targetElement, index) => {
  targetElement.innerHTML = pricesArray[index];
});
        }

    } catch (e) {
        console.log(e);
    }

}());


//START main-banner
(function () {
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

		let getDestinationNameByParentId = (data, parentId) => {
			for (let i = 0; i < data.length; i++) {
				if (data[i]?.destinationId === parentId) {
					return {
						name : data[i]?.destinationName,
						url : data[i]?.destinationUrlName
					};
				}
			}
			return '';
		}

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

				window.location = `${getHomeUrl()}/${$lang}product-category/${$parent}${$destName}/`;
			} else {
				$inputDest.parentNode.classList.add('error');
			}
		});
	}

}());
//END main-banner
