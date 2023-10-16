'use strict';

const { __, _x, _n, _nx } = wp.i18n;

const getCookie = (name) => {
	const cookieName    = name + '=';
	const decodedCookie = decodeURIComponent(document.cookie);
	const cookieArray   = decodedCookie.split(';');

	for (let i = 0; i < cookieArray.length; i++) {
		let c = cookieArray[i];
		while (c.charAt(0) === ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(cookieName) === 0) {
			return c.substring(cookieName.length, c.length);
		}
	}
	return '';
};

(function () {

	//FOR Category and Tags ▼
	let $viatorDest = jQuery('.viator-destinations'),
		$viatorTags = jQuery('.viator-tags');

	if ($viatorDest.length) {
		$viatorDest.select2({
			placeholder: 'Select a name destination',
			width: 'element',
		});
	}

	if ($viatorTags.length) {
		$viatorTags.select2({
			placeholder: 'Select a tag name',
			width: 'element',
		});
	}
	//FOR Category and Tags ▲

	//FOR Settings page ▼
	setTimeout(() => {
		let $cfSelect = jQuery('.cf-select__input');

		if ($cfSelect.length) {
			$cfSelect.select2({
				width: '100%',
			});
		}
	}, 1000);
	//FOR Settings page ▲

	//FOR Order page ▼
	let $orderBox = document.querySelector('.panel.woocommerce-order-data .order_data_column:last-child');
	if ($orderBox) {
		let $boxTitle = $orderBox.querySelector('h3');

		$orderBox.style.display = 'block';
		$boxTitle.textContent   = 'Additional Fields';
	}
	//FOR Order page ▲
}());

(function () {
	//START Refund in admin
	let showRefund = document.querySelector('.wp-admin.post-type-shop_order .refund-items');

	if (!showRefund || !window?.bookingRef) {
		console.log('Not found showRefund or bookingRef', window.bookingRef, showRefund);
		return;
	}
	let reasonCode = '',
		initRefund,
		initPayPlugRef,
		wooRefundReasonInput,
		viatorRefunded = false;

	let bootBlock                   = document.createElement('div');
	bootBlock.style.position        = 'absolute';
	bootBlock.style.top             = '0';
	bootBlock.style.bottom          = '0';
	bootBlock.style.left            = '0';
	bootBlock.style.right           = '0';
	bootBlock.style.backgroundColor = 'rgba(0,0,0, 0.3)';
	bootBlock.style.zIndex          = '9999';

	let selectBlock = document.createElement('select');
	selectBlock.setAttribute('id', 'refund_viator_reason');
	selectBlock.setAttribute('name', 'refund_viator_reason');
	selectBlock.style.width = '96%';

	if (window?.reasonViator?.reasons) {
		let options = '<option value="">Select reason</option>';

		window.reasonViator.reasons.forEach(function (item, i) {
			options += `<option value="${item.cancellationReasonCode}">${item.cancellationReasonText}</option>`;
		});

		selectBlock.insertAdjacentHTML('beforeend', options);
	}

	let refundBtnWrap = document.querySelector('.wc-order-refund-items .refund-actions'),
		sendBtn       = document.createElement('button');

	sendBtn.style.display = 'none';
	sendBtn.classList.add('button');
	sendBtn.classList.add('button-primary');
	sendBtn.classList.add('btn-send-viator');
	sendBtn.setAttribute('type', 'button');
	sendBtn.textContent = __('Send to viator', 'viator');
	refundBtnWrap.insertAdjacentElement('afterbegin', sendBtn);

	selectBlock.addEventListener('change', function (evt) {
		if (selectBlock.value) {
			reasonCode = wooRefundReasonInput.value = selectBlock.value;

			if (viatorRefunded){
				bootBlock.style.position = 'static';
				sendBtn.style.display    = 'none';

				if (initPayPlugRef) {
					initPayPlugRef.style.display = 'inline-block';
				}
			} else{
				sendBtn.style.display = 'inline-block';
			}

		}
		else {
			sendBtn.style.display = 'none';
		}
	});

	showRefund.addEventListener('click', function (evt) {
		let wrap = this.closest('.inside').querySelector('.wc-order-refund-items');
		if (!wrap) {
			return;
		}

		initRefund = wrap.querySelector('.do-manual-refund');
		if (initRefund) {
			initRefund.style.display = 'none';
			initRefund.textContent   = __('Finish', 'viator');
		}

		initPayPlugRef = document.querySelector('.do-api-refund');
		if (initPayPlugRef) {
			initPayPlugRef.style.display = 'none';
		}

		let orderLineItems = document.querySelector('#order_line_items'),
			amountNode     = orderLineItems.querySelector('.item_cost .woocommerce-Price-amount'),
			amount         = amountNode?.textContent.replace(/[^0-9.]/g, ''),
			qtyNode        = orderLineItems.querySelector('.item > .quantity'),
			quantity       = qtyNode?.textContent.replace(/[^0-9.]/g, ''),
			inputTotal     = orderLineItems.querySelector('.line_cost .refund_line_total'),
			inputQty       = orderLineItems.querySelector('.quantity .refund_order_item_qty');

		if (inputTotal) {
			inputTotal.value = amount;
		}

		if (inputQty && quantity) {
			inputQty.setAttribute('disabled', true);
			inputQty.value = quantity;
		}

		wrap.style.position = 'relative';
		wrap.style.cursor   = 'wait';
		wrap.insertAdjacentElement('beforeend', bootBlock);

		let tableRefund = wrap.querySelector('.wc-order-totals'),
			tableRows   = tableRefund.querySelectorAll('tr');
		if (tableRows) {
			tableRows.forEach(function (item, i) {
				if (0 === i || 1 === i) {
					console.log('item', item);
					item.style.display = 'none';
				}

				// if (2 === i) {
				// 	let wooAmount = item.querySelector('.woocommerce-Price-amount');
				// 	amount        = wooAmount?.textContent.replace(/[^0-9.]/g, '');
				// }

				if (3 === i) {
					let refundAmount = item.querySelector('#refund_amount');
					console.log('!!!!!refundAmount', refundAmount, amount);
					if (refundAmount) {
						const refundAmountEvent = new Event('change', {
							bubbles: true,
							cancelable: true,
						});

						//refundAmount.setAttribute('disabled', true);
						refundAmount.value = amount.replace(/\.([\s\S]*)$/, '');
						refundAmount.dispatchEvent(refundAmountEvent);
					}
				}

				if (4 === i) {
					wooRefundReasonInput = item.querySelector('#refund_reason');
					let refundLabel = item.querySelector('.label'),
						selectWrap  = wooRefundReasonInput.closest('.total');

					if (wooRefundReasonInput) {
						wooRefundReasonInput.style.display = 'none';
					}

					if (refundLabel) {
						refundLabel.textContent = 'Reason for refund (required):';
					}

					if (selectWrap) {
						selectWrap.insertAdjacentElement('beforeend', selectBlock);
					}
				}

				console.log('!!!!!!!!!', i, item);
			});
		}

		wp.ajax.send(
			'cancel_quote',
			{
				data: {
					'admin_req': '7f104c2fa6_admin',
					'bookingref': window?.bookingRef,
					'order_id': window?.orderId,
				},
				success: function (data) {
					console.log('success');
					console.log(data);

					if (data.status === 'CANCELLABLE') {
						bootBlock.style.position = 'static';
						wrap.style.cursor        = 'auto';

						if (data?.viator_refunded){
							viatorRefunded = true;
						}
					}
					else if( window?.orderStatus !== 'refunded' && data.status !== 'CANCELLABLE' ){
						viatorRefunded = true;

						bootBlock.style.position = 'static';
						wrap.style.cursor        = 'auto';
						sendBtn.style.display    = 'none';

						if (initPayPlugRef) {
							initPayPlugRef.style.display = 'inline-block';
						} else{
							initRefund.style.display = 'inline-block';
						}

					}
					else {
						alert('The order cannot be canceled');
					}
				},
				error: function (data) {
					console.log(data);
					wrap.style.cursor = 'auto';
					alert('The order cannot be canceled');
				},
			});

		sendBtn.addEventListener('click', function (evt) {
			if (!viatorRefunded){
				bootBlock.style.position = 'absolute';

				wp.ajax.send(
					'booking_cancel', {
						data: {
							'admin_req': '7f104c2fa6_admin',
							'reasonCode': reasonCode,
							'order_id': window?.orderId,
							'bookingref': window?.bookingRef,
							'language': sessionStorage.getItem('viatorLang') ?? 'en',
						},
						success: function (data) {
							console.log('success');
							console.log(data);

							if (data['status'] === 'ACCEPTED') {
								bootBlock.style.position = 'static';
								sendBtn.style.display    = 'none';

								if (initPayPlugRef) {
									initPayPlugRef.style.display = 'inline-block';
								}
							}

							if (data['status'] === 'DECLINED') {
								alert('The cancellation was failed');

								if (data['reason'] === 'ALREADY_CANCELLED') {
									alert('The booking has already been cancelled');
								}
								if (data['reason'] === 'NOT_CANCELLABLE') {
									alert('The booking cannot be canceled because the product start time was in the past');
								}
							}

						},
						error: function (data) {
							console.log(data);

							alert('An error occurred, the order was not canceled');
						},
					});
			}
		});

	});
}());

jQuery(document).on('carbonFields.apiLoaded', function(e, api) {
    var fieldValue = api.getFieldValue('crb_content_align');
    console.log('Selected Value:', fieldValue);
});
