( function() {
	setTimeout( () => {
		let $post = document.querySelector( '#post' );
		if ( !$post ){return;}

		let	$shippingTab  = $post.querySelector( '.product_data_tabs .shipping_options.shipping_tab' ),
			$shippingData = $post.querySelector( '#shipping_product_data' ),
			$setVirtual   = $post.querySelector( '.ui-sortable-handle #_virtual' ),
			$productType  = $post.querySelector( '#product-type' );

		if ( $shippingData && $shippingTab ) {
			$shippingTab.style.display = $shippingData.style.display = 'none';
		}

		if ( $setVirtual ) {
			$setVirtual.checked = true;
		}

		if ( $productType ) {
			let $optionType = $productType.querySelectorAll( 'option' );

			for ( const $item of $optionType ) {
				if ( $item.value !== 'simple' ) {
					$item.remove();
				} else{
					$item.setAttribute('selected', 'selected');
				}
			}
		}
	}, 1000 );

	//Custom fields
	let $optionsGroupViator = document.querySelector( '.options_group-viator' );

	if ( $optionsGroupViator ){
		$optionsGroupViator.addEventListener( 'click', function( evt ) {
			for ( let target = evt.target; target && target
			!== this; target = target.parentNode ) {
				if ( target.matches( '.button-cancel' ) ) {
					target.closest( '.product_custom_field' ).remove();
					break;
				}

				if ( target.matches( '.button-add' ) ) {
					let $mainName = '.options_group';

					if ( target.classList.contains( 'add-excluded' )
						|| target.classList.contains( 'add-included' ) ) {
						$mainName = '.options_group_col';
					}

					let $itemHTML,
						$mainBlock  = target.closest( $mainName ),
						$fieldsWrap = $mainBlock.querySelector(
							'.options_group_fields' ),
						$name       = $fieldsWrap.dataset.name,
						$nowItem    = $fieldsWrap.querySelectorAll(
							'.product_custom_field' ).length + 1;

					if ( $name === 'itinerary' ) {
						$itemHTML = `<div class="product_custom_field product_custom_field-row">
        <p class="form-field _custom_field_${ $name }_name${ $nowItem }_field ">
            <label for="_custom_field_${ $name }_name${ $nowItem }">Name ${ $nowItem }</label><input type="text" class="field_${ $name }" style="" name="_custom_field_${ $name }[item${ $nowItem }][name]" id="_custom_field_${ $name }_name${ $nowItem }" value="" placeholder="Enter name">
        </p>
        <p class="form-field _custom_field_${ $name }_duration${ $nowItem }_field ">
            <label for="_custom_field_${ $name }_duration${ $nowItem }">Duration ${ $nowItem }</label><input type="number" class="field_${ $name }" style="" name="_custom_field_${ $name }[item${ $nowItem }][duration]" id="_custom_field_${ $name }_duration${ $nowItem }" value="" placeholder="Enter duration" step="1" min="0">
        </p>
        <button class="button button-cancel" type="button">x</button>
        <p class="form-field _custom_field_${ $name }_txt${ $nowItem }_field form-row form-row-full">
            <label for="_custom_field_${ $name }_txt${ $nowItem }">Place
                Description ${ $nowItem }</label><span class="woocommerce-help-tip"></span><textarea class="product-field-textarea field_${ $name }" style="" name="_custom_field_${ $name }[item${ $nowItem }][txt]" id="_custom_field_${ $name }_txt${ $nowItem }" placeholder="" rows="2" cols="20"></textarea>
        </p></div>`;
					}
					else if ( $name === 'options' ) {
						$itemHTML = `<div class="product_custom_field product_custom_field-row product_custom_field-available">
            <p class="form-field _custom_field_${ $name }_id${ $nowItem }_field ">
                <label for="_custom_field_${ $name }_id${ $nowItem }">Option ${ $nowItem } code</label>
                <input type="text" class="field_${ $name }" name="_custom_field_${ $name }[item${ $nowItem }][id]" id="_custom_field_${ $name }_id${ $nowItem }" placeholder="Enter code">
            </p>
            <button class="button button-cancel" type="button">x</button>
            <p class="form-field _custom_field_${ $name }_title${ $nowItem }_field ">
                <label for="_custom_field_${ $name }_title${ $nowItem }">Title</label>
                <input type="text" class="field_${ $name }" name="_custom_field_${ $name }[item${ $nowItem }][title]" id="_custom_field_${ $name }_title${ $nowItem }"
                placeholder="Enter title">
            </p>
            <p class="form-field _custom_field_${ $name }_txt${ $nowItem }_field form-row form-row-full">
                <label for="_custom_field_${ $name }_txt${ $nowItem }">Option description</label>
                <textarea class="product-field-textarea field_${ $name }" name="_custom_field_${ $name }[item${ $nowItem }][txt]"
                id="_custom_field_${ $name }_txt${ $nowItem }" placeholder="Enter an optional description." rows="2" cols="20"></textarea>
            </p>
            <p class="form-field _custom_field_${ $name }_start_date${ $nowItem }_field field-half">
                <label for="_custom_field_${ $name }_start_date${ $nowItem }">Start date</label>
                <input type="date" class="field_${ $name }" name="_custom_field_${ $name }[item${ $nowItem }][start_date]"
                id="_custom_field_${ $name }_start_date${ $nowItem }" placeholder="Enter duration">
            </p>
            <p class="form-field _custom_field_${ $name }_end_date${ $nowItem }_field field-half">
                <label for="_custom_field_${ $name }_end_date${ $nowItem }">End date</label>
                <input type="date" class="field_${ $name }" name="_custom_field_${ $name }[item${ $nowItem }][end_date]"
                 id="_custom_field_${ $name }_end_date${ $nowItem }" placeholder="Enter duration">
            </p>
            <p class="form-field _custom_field_${ $name }_excluded_dates${ $nowItem }_field form-row form-row-full">
                <label for="_custom_field_${ $name }_excluded_dates${ $nowItem }">Excluded dates</label>
                <span class="woocommerce-help-tip"></span>
                <textarea class="product-field-textarea field_${ $name }" name="_custom_field_${ $name }[item${ $nowItem }][excluded_dates]"
                id="_custom_field_${ $name }_excluded_dates${ $nowItem }" placeholder="" rows="2" cols="20"></textarea>
            </p>
            <div class="field-available-prices"><p class="field-available-title">Price</p>
			<p class="form-field _custom_field_${ $name }_price_infant${ $nowItem }_field field-third">
				<label for="_custom_field_${ $name }_price_infant${ $nowItem }">Infant:</label>
				<input type="number" class="field_${ $name }" style="" name="_custom_field_${ $name }[item${ $nowItem }][price_infant]" id="_custom_field_${ $name }_price_infant${ $nowItem }" placeholder="Enter a price for this category of people">
			</p>
			<p class="form-field _custom_field_${ $name }_price_child${ $nowItem }_field field-third">
				<label for="_custom_field_${ $name }_price_child${ $nowItem }">Child:</label>
				<input type="number" class="field_${ $name }" style="" name="_custom_field_${ $name }[item${ $nowItem }][price_child]" id="_custom_field_${ $name }_price_child${ $nowItem }" placeholder="Enter a price for this category of people">
			</p>
			<p class="form-field _custom_field_${ $name }_price_youth${ $nowItem }_field field-third">
				<label for="_custom_field_${ $name }_price_youth${ $nowItem }">Youth:</label>
				<input type="number" class="field_${ $name }" style="" name="_custom_field_${ $name }[item${ $nowItem }][price_youth]" id="_custom_field_${ $name }_price_youth${ $nowItem }" placeholder="Enter a price for this category of people">
			</p>
			<p class="form-field _custom_field_${ $name }_price_adult${ $nowItem }_field field-third">
				<label for="_custom_field_${ $name }_price_adult${ $nowItem }">Adult:</label><input type="number" class="field_${ $name }" style="" name="_custom_field_${ $name }[item${ $nowItem }][price_adult]" id="_custom_field_${ $name }_price_adult${ $nowItem }" placeholder="Enter a price for this category of people">
			</p>
			<p class="form-field _custom_field_${ $name }_price_senior${ $nowItem }_field field-third">
				<label for="_custom_field_${ $name }_price_senior${ $nowItem }">Senior:</label>
				<input type="number" class="field_${ $name }" style="" name="_custom_field_${ $name }[item${ $nowItem }][price_senior]" id="_custom_field_${ $name }_price_senior${ $nowItem }" placeholder="Enter a price for this category of people">
			</p>
			<p class="form-field _custom_field_${ $name }_price_traveler${ $nowItem }_field field-third">
				<label for="_custom_field_${ $name }_price_traveler${ $nowItem }">Traveler:</label>
				<input type="number" class="field_${ $name }" style="" name="_custom_field_${ $name }[item${ $nowItem }][price_traveler]" id="_custom_field_${ $name }_price_traveler${ $nowItem }" placeholder="Enter a price for this category of people">
			</p></div>
            </div>`;
					}
					else {
						$itemHTML = `<div class=" product_custom_field "><p class="form-field _custom_field_${ $name }${ $nowItem }_field">
<label for="_custom_field_${ $name }${ $nowItem }">Field ${ $nowItem }</label>
<input type="text" class="field_${ $name }" name="_custom_field_${ $name }[]" id="_custom_field_${ $name }${ $nowItem }" value="" placeholder="Enter text"></p>
<button class="button button-cancel" type="button">x</button></div>`;
					}

					$fieldsWrap.insertAdjacentHTML( 'beforeend', $itemHTML );
					break;
				}

			}
		}, false );
	}

}() );
