<?php

namespace ViatorCoreSpace;

if ( ! defined( 'WPINC' ) ) {
	die;
}

class functions {
	public function __construct() {
	}

	public function init() {
		add_filter( 'document_title', array( $this, 'modify_document_title' ) );
		add_action( 'template_redirect', array( $this, 'product_template_redirect' ) );
		add_action( 'init', array( $this, 'init_narrative_rewrite' ) );
		add_filter( 'wp_footer', array( $this, 'add_templates' ) );
		add_action( 'after_setup_theme', array( $this, 'init_carbon_fields' ) );
		add_filter( 'excerpt_more', array( $this, 'fixed_excerpt_more' ) );
		add_filter( 'excerpt_length', array( $this, 'fixed_excerpt_length' ) );
		add_filter( 'theme_page_templates', array( $this, 'add_theme_page_templates' ) );
		add_filter( 'template_include', array( $this, 'add_template_include' ) );
		add_filter( 'query_vars', array( $this, 'filter_query_vars' ) );
		add_action( 'wp_loaded', array( $this, 'custom_own_load_page' ) );

		add_filter( 'body_class', array( $this, 'change_body_class' ) );
		add_action( 'product_tag_add_form_fields', array( $this, 'add_viator_tag' ) );
		add_action( 'product_cat_add_form_fields', array( $this, 'add_viator_cat' ) );
		add_filter( 'wp_insert_term_duplicate_term_check', array( $this, 'insert_term_destination' ), 10, 5 );
		add_filter( 'wp_update_term_data', array( $this, 'update_term_destination' ), 10, 4 );
		add_action( 'wp_dashboard_setup', array( $this, 'viator_refund_notifications_widget' ) );
		add_action( 'woocommerce_order_fully_refunded', array( $this, 'woocommerce_order_fully_refunded_hook' ), 10,
			2 );

		add_action( 'woocommerce_admin_order_data_after_shipping_address', array( $this, 'add_custom_fields_order' ) );

		add_action( 'woocommerce_checkout_fields', array( $this, 'add_new_checkout_fields' ) );
		add_action( 'woocommerce_before_order_notes', array( $this, 'add_checkout_fields_before_notes' ) );
		add_action( 'woocommerce_after_order_notes', array( $this, 'add_checkout_fields_after_notes' ) );

		add_action( 'woocommerce_add_to_cart_redirect', array( $this, 'add_to_cart_redirect' ) );
		add_action( 'woocommerce_product_add_to_cart_text', array( $this, 'change_cart_text' ) );
		add_action( 'woocommerce_process_product_meta', array( $this, 'save_custom_field_woo' ) );
		add_action( 'woocommerce_review_order_after_cart_contents',
			array( $this, 'change_review_order_after_cart_contents' ) );
		add_action( 'woocommerce_product_write_panel_tabs', array( $this, 'add_product_tab' ) );
		add_action( 'woocommerce_product_data_panels', array( $this, 'add_product_options_groups' ) );
		add_action( 'woocommerce_add_cart_item_data', array( $this, 'woocommerce_clear_cart' ) );
		add_filter( 'woocommerce_email_order_meta_fields', array( $this, 'add_fields_email_customer' ), 10, 3 );
		add_filter( 'woocommerce_order_details_after_order_table', array( $this, 'add_voucher' ) );
		add_action( 'woocommerce_checkout_process', array( $this, 'woo_checkout_process_hook' ) );
		add_filter( 'woocommerce_payment_successful_result', array( $this, 'woo_payment_successful_result_hook' ), 10, 2 );
		add_action( 'woocommerce_order_status_on-hold', array( $this, 'woo_payment_successful_send_viator' ), 10 );
		add_action( 'woocommerce_before_thankyou', array( $this, 'woo_before_thankyou_hook' ) );
	}


	public function viator_refund_notifications_dashboard_widget_content() {
		$new_notifications_count = get_option( 'vi_refund_notifications', array() );
		$orders_page_url         = admin_url( 'edit.php?post_type=shop_order' );

		echo '<p>';
		printf( __( 'You have %d new notifications. ', 'viator' ), $new_notifications_count );
		echo '<a href="' . esc_url( $orders_page_url ) . '">' . __( 'View Orders', 'viator' ) . '</a>';
		echo '</p>';
	}

	public function viator_refund_notifications_widget() {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}

		wp_add_dashboard_widget(
			'viator_refund_notifications_dashboard_widget',
			__( 'Refund Notifications', 'viator' ),
			array( $this, 'viator_refund_notifications_dashboard_widget_content' )
		);
	}

	public function woocommerce_order_fully_refunded_hook( $order_id, $refund_id ) {
		$notifications = get_option( 'vi_refund_notifications', array() );

		if ( ( $key = array_search( $order_id, $notifications ) ) !== false ) {
			unset( $notifications[ $key ] );
			update_option( 'vi_refund_notifications', $notifications );
		}
	}
	
	

	/**
	 * @throws \Exception
	 */
	public function woo_checkout_process_hook() {
		if ( ! WC()->cart || ( ! $cart_product = WC()->cart->get_cart() ) ) {
			throw new \Exception( __( 'Error on file viator\src\functions.php line 60', 'woocommerce' ) );
		}

		$cart_product = array_shift( $cart_product );
		$product_id   = $cart_product['product_id'];
		$create_acc   = $_POST['createaccount'] ?? '';
		$type_product = get_post_meta( $product_id, '_temp_product', true ) ? 'viator' : 'woo';
		$email        = $_POST['billing_email'] ?? '';
		$first_name   = trim( $_POST['billing_first_name'] ?? '' );
		$last_name    = trim( $_POST['billing_last_name'] ?? '' );
		$phone        = $_POST['billing_phone'] ?? '';


		if ( ! $product_id ) {
			throw new \Exception( __( 'Empty product', 'woocommerce' ) );
		}

		if ( $create_acc ) {
			$username = strtolower( $first_name ) . '.' . strtolower( $last_name );

			if ( $user_id = wc_create_new_customer( $email, $username ) ) {
				$company   = $_POST['billing_company'] ?: '';
				$country   = $_POST['billing_country'] ?: '';
				$address_1 = $_POST['billing_address_1'] ?: '';
				$address_2 = $_POST['billing_address_2'] ?: '';
				$city      = $_POST['billing_city'] ?: '';
				$state     = $_POST['billing_state'] ?: '';
				$postcode  = $_POST['billing_postcode'] ?: '';

				update_user_meta( $user_id, 'first_name', $first_name );
				update_user_meta( $user_id, 'last_name', $last_name );
				update_user_meta( $user_id, 'billing_email', $email );
				update_user_meta( $user_id, 'billing_phone', $phone );

				if ( $company ) {
					update_user_meta( $user_id, 'billing_company', $company );
				}
				if ( $country ) {
					update_user_meta( $user_id, 'billing_country', $country );
				}
				if ( $address_1 ) {
					update_user_meta( $user_id, 'billing_address_1', $address_1 );
				}
				if ( $address_2 ) {
					update_user_meta( $user_id, 'billing_address_2', $address_2 );
				}
				if ( $city ) {
					update_user_meta( $user_id, 'billing_city', $city );
				}
				if ( $state ) {
					update_user_meta( $user_id, 'billing_state', $state );
				}
				if ( $postcode ) {
					update_user_meta( $user_id, 'billing_postcode', $postcode );
				}
			}

			if ( 'viator' === $type_product ) {
				update_post_meta( $product_id, '_create_acc_id', $user_id );
			} else {
				$cart_hash = $_COOKIE['user_custom_hash'];
				set_transient( "_create_acc_id{$cart_hash}", $user_id, DAY_IN_SECONDS );
			}
		}
	}

	/**
	 * @throws \WC_Data_Exception
	 * @throws \Exception
	 * viator book
	 */
	public function woo_payment_successful_result_hook( $result, $order_id ) {
		$order       = wc_get_order( $order_id );
		$order_items = $order->get_items();
		$product_id  = '';

		foreach ( $order_items as $item ) {
			$product = $item->get_product();
			if ( $product_id = $product->get_id() ) {
				break;
			}
		}

		if ( ! $product_id ) {
			throw new \Exception( __( 'Empty product', 'woocommerce' ) );
		}


		$type_product   = get_post_meta( $product_id, '_temp_product', true ) ? 'viator' : 'woo';
		$language_guide = $_POST['language_guide'] ?? '';
		update_post_meta( $order_id, '_language_guide', $language_guide );
		$lead           = $_POST['lead'] ?? '';
		update_post_meta( $order_id, '_lead', $lead );
		$travelers      = $_POST['travelers'] ?? '';
		update_post_meta( $order_id, '_travelers', $travelers );
		$extraQuestions = $_POST['extraBookingQuestions'] ?? '';
		update_post_meta( $order_id, '_extraQuestions', $extraQuestions );
		$emailOrder     = $_POST['billing_email'] ?? '';
		update_post_meta( $order_id, '_emailOrder', $emailOrder );
		$first_nameOrder = trim( $_POST['billing_first_name'] ?? '' );
		update_post_meta( $order_id, '_first_nameOrder', $first_nameOrder );
		$last_nameOrder      = trim( $_POST['billing_last_name'] ?? '' );
		update_post_meta( $order_id, '_last_nameOrder', $last_nameOrder );
		$phoneOrder          = $_POST['billing_phone'] ?? '';
		update_post_meta( $order_id, '_phoneOrder', $phoneOrder );


		update_post_meta( $order_id, '_type_product', $type_product );

		if ( 'viator' === $type_product ) {
			$productCode = get_post_meta( $product_id, '_productCode', true );
			$partnerRef  = get_post_meta( $product_id, '_bookingRef', true );
			$paxMix      = get_post_meta( $product_id, '_paxMix', true );
			$travelDate  = get_post_meta( $product_id, '_travel_date', true );
			$startTime   = get_post_meta( $product_id, '_startTime', true );
			$optionCode  = get_post_meta( $product_id, '_optionCode', true );
			$currency    = get_post_meta( $product_id, '_currency', true );
			
			if ( ! empty( $language_guide ) ) {
				$language_guide = explode( '|', $language_guide );
			}

			$bookingQuestions = array_flip( get_post_meta( $product_id, '_bookingQuestions', true ) );

			++ $bookingQuestions[ array_key_first( $bookingQuestions ) ];


			if ( ! $productCode && ! $currency && ! $partnerRef && ! $paxMix && ! $travelDate && ! $bookingQuestions ) {
				throw new \Exception( __( 'Empty productCode, currency, partnerRef, paxMix', 'woocommerce' ) );
			}

			$url      = $this->get_api_host() . '/bookings/book';
			$languageHeader = $_POST['language'] ?? 'en-US';
			update_post_meta( $order_id, '_languageHeader', $languageHeader );
			$args     = array(
				'timeout'     => 50,
				'httpversion' => '1.1',
				'headers'     => array(
					'Accept-Language' => $languageHeader,
					'Accept'          => 'application/json;version=2.0',
					'exp-api-key'     => $this->get_apiKey(),
				),
			);

			if ( $this->is_sandbox_api() ) {
				$args['headers']['exp-demo'] = true;
			}

			$body = array(
				'productCode'            => $productCode,
				'currency'               => 'USD',
				'bookingRef'             => $partnerRef,
				'partnerBookingRef'      => $partnerRef,
				'travelDate'             => $travelDate,
				'paxMix'                 => $paxMix,
				'communication'          => array(
					'email' => 'info@ilmioviaggio.com',
					'phone' => $phoneOrder,
				),
				'bookerInfo'             => array(
					'firstName' => $first_nameOrder,
					'lastName'  => $last_nameOrder,
				),
				'bookingQuestionAnswers' => array(),
			);

			if ( ! empty( $language_guide ) && is_array( $language_guide ) ) {
				$body['languageGuide'] = array(
					'language'    => $language_guide[0],
					'type'        => $language_guide[1],
					'legacyGuide' => $language_guide[2],
				);
			}

			if ( $optionCode ) {
				$body['productOptionCode'] = $optionCode;
			}

			if ( $startTime ) {
				$body['startTime'] = $startTime;
			}
			
			if ( isset( $bookingQuestions['AGEBAND'] ) ) {
				$body['bookingQuestionAnswers'][] = array(
					'question'    => 'AGEBAND',
					'answer'      => $paxMix[0]['ageBand'],
					'travelerNum' => 1,
				);
			}

			if ( isset( $bookingQuestions['FULL_NAMES_FIRST'] ) ) {
				$body['bookingQuestionAnswers'][] = array(
					'question'    => 'FULL_NAMES_FIRST',
					'answer'      => $first_nameOrder,
					'travelerNum' => 1,
				);
			}

			if ( isset( $bookingQuestions['FULL_NAMES_LAST'] ) ) {
				$body['bookingQuestionAnswers'][] = array(
					'question'    => 'FULL_NAMES_LAST',
					'answer'      => $last_nameOrder,
					'travelerNum' => 1,
				);
			}


			if ( $lead ) {
				foreach ( $lead as $key => $item ) {
					$lead_args = array(
						'question'    => $key,
						'answer'      => $item,
						'travelerNum' => 1,
					);

					if ( $key === 'HEIGHT' ) {
						$lead_args['unit'] = 'cm';
					}

					if ( $key === 'WEIGHT' ) {
						$lead_args['unit'] = 'kg';
					}

					$body['bookingQuestionAnswers'][] = $lead_args;
				}
			}
			
			if (isset($paxMix[0]) && $paxMix[0]['ageBand'] === 'ADULT') {
				$paxMix[0]['numberOfTravelers']--;
			}
			
			$paxIndex = 0; // Initialize a separate index for paxMix

			if ($travelers) {
				foreach ($travelers as $index => $traveler) {
					foreach ($traveler as $key => $item) {
						$traveler_args = array(
							'question'    => $key,
							'answer'      => $item,
							'travelerNum' => $index,
						);

						if ('AGEBAND' === $key) {
							if (isset($paxMix[$paxIndex])) {
								$traveler_args['answer'] = $paxMix[$paxIndex]['ageBand'];
								$paxMix[$paxIndex]['numberOfTravelers']--;

								// Move to the next age band if all travelers for the current age band have been accounted for
								if ($paxMix[$paxIndex]['numberOfTravelers'] == 0) {
									$paxIndex++;
								}
							}
						}

						if ($key === 'HEIGHT') {
							$traveler_args['unit'] = 'cm';
						}
						if ($key === 'WEIGHT') {
							$traveler_args['unit'] = 'kg';
						}

						$body['bookingQuestionAnswers'][] = $traveler_args;
					}
				}
			}


			if ( $extraQuestions ) {
				foreach ( $extraQuestions as $key => $extra_question ) {
					if ( 'location_item' !== $key && ( empty( $extra_question ) || ! isset( $bookingQuestions[ $key ] ) ) ) {
						continue;
					}

					if ( 'TRANSFER_ARRIVAL_DROP_OFF' === $key || 'TRANSFER_DEPARTURE_PICKUP' === $key ) {
						$body['bookingQuestionAnswers'][] = array(
							'question' => $key,
							'answer'   => $extra_question,
							'unit'     => 'FREETEXT',
						);
					} elseif ( 'TRANSFER_AIR_ARRIVAL_AIRLINE' === $key ) {
						$body['bookingQuestionAnswers'][] = array(
							'question' => $key,
							'answer'   => $extra_question,
						);
					} elseif ( 'location_item' === $key ) {
						$body['bookingQuestionAnswers'][] = array(
							'question' => 'PICKUP_POINT',
							'answer'   => $extra_question,
							'unit'     => 'LOCATION_REFERENCE',
						);
					} else {
						if ( $key === 'AGEBAND' || $key === 'FULL_NAMES_FIRST' || $key === 'FULL_NAMES_LAST' ) {
							continue;
						}
						$body['bookingQuestionAnswers'][] = array(
							'question' => $key,
							'answer'   => $extra_question,
						);
					}

				}
			}


			$args['body'] = wp_json_encode( $body, JSON_UNESCAPED_SLASHES );

			update_post_meta( $order_id, '_travel_date', $travelDate );
			update_post_meta( $order_id, '_startTime', $startTime );
			update_post_meta( $order_id, '_bookingRef', $partnerRef );
			update_post_meta( $order_id, '_language', $lang_guide );

			if ( $customer_id = get_post_meta( $product_id, '_create_acc_id', true ) ) {
				$order->set_customer_id( $customer_id );
			}
			if ( $pickup = get_post_meta( $product_id, '_pickup', true ) ) {
				update_post_meta( $order_id, '_pickup', $pickup );
			}

			if ( isset( $_POST['user_buying_checkbox'] ) && $_POST['user_buying_checkbox'] === 'on' ) {
				if ( $buying_first_name = get_post_meta( $product_id, '_buying_user_first_name', true ) ) {
					update_post_meta( $order_id, '_buying_user_first_name', $buying_first_name );
				}
				if ( $buying_last_name = get_post_meta( $product_id, '_buying_user_last_name', true ) ) {
					update_post_meta( $order_id, '_buying_user_last_name', $buying_last_name );
				}
			}

			

		} else {
			$cart_hash  = $_COOKIE['user_custom_hash'];
			$woo_price  = get_transient( "_create_acc_id{$cart_hash}" );
			$startTime  = get_transient( "_startTime_{$cart_hash}" );
			$product_id = get_transient( "_productCode_{$cart_hash}" );
			$lang_guide = get_transient( "_language_{$cart_hash}" );
			$pickup     = get_transient( "_pickup_{$cart_hash}" );
			$travelDate = get_transient( "_travel_date_{$cart_hash}" );

			if ( $customer_id = get_transient( "_woo_price_{$cart_hash}" ) ) {
				$order->set_customer_id( $customer_id );
			}

			update_post_meta( $order_id, '_type_post', true );
			update_post_meta( $order_id, '_travel_date', $travelDate );
			update_post_meta( $order_id, '_productCode', $product_id );
			update_post_meta( $order_id, '_woo_price', $woo_price );
			update_post_meta( $order_id, '_startTime', $startTime );
			update_post_meta( $order_id, '_language', $lang_guide );
			update_post_meta( $order_id, '_pickup', $pickup );

			if ( isset( $_COOKIE['user_custom_hash'] ) ) {
				setcookie( 'user_custom_hash', '', time() - 3600, '/', );
			}
		}


		return $result;//!!!!
	}



	
public function woo_payment_successful_send_viator($order_id) {
    $order = wc_get_order($order_id);
    $order_items = $order->get_items();
    $product_id = '';
    foreach ($order_items as $item) {
        $product = $item->get_product();
        if ($product_id = $product->get_id()) {
            break;
        }
    }

    if (!$product_id) {
        throw new \Exception(__('Empty product', 'woocommerce'));
    }
	
	
    $type_product = get_post_meta($product_id, '_temp_product', true) ? 'viator' : 'woo';
    $language_guide = get_post_meta($order_id, '_language_guide', true);
    $lead = get_post_meta($order_id, '_lead', true);
    $travelers = get_post_meta($order_id, '_travelers', true);
	
	$this->write_log( date( 'Y-m-d H:i:s Url' ), 'travelers.txt' );
	$this->write_log( print_r($travelers,true), 'travelers.txt' );
	$this->write_log( '-----------------', 'travelers.txt' );
	
    $extraQuestions = get_post_meta($order_id, '_extraQuestions', true);
	
	$this->write_log( date( 'Y-m-d H:i:s Url' ), 'extraQuestions.txt' );
	$this->write_log( print_r($extraQuestions,true), 'extraQuestions.txt' );
	$this->write_log( '-----------------', 'extraQuestions.txt' );
	
    $emailOrder = get_post_meta($order_id, '_emailOrder', true);
    $first_nameOrder = get_post_meta($order_id, '_first_nameOrder', true);
    $last_nameOrder = get_post_meta($order_id, '_last_nameOrder', true);
    $phoneOrder = get_post_meta($order_id, '_phoneOrder', true);

    update_post_meta($order_id, '_type_product', $type_product);

    if ('viator' === $type_product) {
        $productCode = get_post_meta($product_id, '_productCode', true);
        $partnerRef = get_post_meta($product_id, '_bookingRef', true);
        $paxMix = get_post_meta($product_id, '_paxMix', true);
		
		$this->write_log( date( 'Y-m-d H:i:s Url' ), 'paxMix.txt' );
		$this->write_log( print_r($paxMix,true), 'paxMix.txt' );
		$this->write_log( '-----------------', 'paxMix.txt' );
		
        $travelDate = get_post_meta($product_id, '_travel_date', true);
        $startTime = get_post_meta($product_id, '_startTime', true);
        $optionCode = get_post_meta($product_id, '_optionCode', true);
        $currency = get_post_meta($product_id, '_currency', true);

        if (!empty($language_guide)) {
            $language_guide = explode('|', $language_guide);
        }

        $bookingQuestions = array_flip(get_post_meta($product_id, '_bookingQuestions', true));

        ++$bookingQuestions[array_key_first($bookingQuestions)];
		
		

        if (!$productCode && !$currency && !$partnerRef && !$paxMix && !$travelDate && !$bookingQuestions) {
            throw new \Exception(__('Empty productCode, currency, partnerRef, paxMix', 'woocommerce'));
        }

        $url = $this->get_api_host() . '/bookings/book';
        $languageHeader = get_post_meta($order_id, '_languageHeader', true);
        $args = array(
            'timeout' => 50,
            'httpversion' => '1.1',
            'headers' => array(
                'Accept-Language' => $languageHeader,
                'Accept' => 'application/json;version=2.0',
                'Content-Type' => 'application/json',
                'exp-api-key' => $this->get_apiKey(),
            ),
        );

        if ($this->is_sandbox_api()) {
            $args['headers']['exp-demo'] = true;
        }

        $body = array(
            'productCode' => $productCode,
            'currency' => 'USD',
            'bookingRef' => $partnerRef,
            'partnerBookingRef' => $partnerRef,
            'travelDate' => $travelDate,
            'paxMix' => $paxMix,
            'communication' => array(
                'email' => 'info@ilmioviaggio.com',
                'phone' => $phoneOrder,
            ),
            'bookerInfo' => array(
                'firstName' => $first_nameOrder,
                'lastName' => $last_nameOrder,
            ),
            'bookingQuestionAnswers' => array(),
        );

        if (!empty($language_guide) && is_array($language_guide)) {
            $body['languageGuide'] = array(
                'language' => $language_guide[0],
                'type' => $language_guide[1],
                'legacyGuide' => $language_guide[2],
            );
        }

        if ($optionCode) {
            $body['productOptionCode'] = $optionCode;
        }

        if ($startTime) {
            $body['startTime'] = $startTime;
        }


        if ($lead) {
            foreach ($lead as $key => $item) {
                $lead_args = array(
                    'question' => $key,
                    'answer' => $item,
                    'travelerNum' => 1,
                );

                if ($key === 'HEIGHT') {
                    $lead_args['unit'] = 'cm';
                }

                if ($key === 'WEIGHT') {
                    $lead_args['unit'] = 'kg';
                }

                $body['bookingQuestionAnswers'][] = $lead_args;
            }
        }

        if (isset($paxMix[0]) && $paxMix[0]['ageBand'] === 'ADULT') {
            $paxMix[0]['numberOfTravelers']--;
        }

        $paxIndex = 0; // Initialize a separate index for paxMix

		// Handle traveler names
		if ($travelers) {
			foreach ($travelers as $index => $traveler) {
				if (isset($traveler['FULL_NAMES_FIRST']) && isset($bookingQuestions['FULL_NAMES_FIRST'])) {
					$body['bookingQuestionAnswers'][] = array(
						'question' => 'FULL_NAMES_FIRST',
						'answer' => $traveler['FULL_NAMES_FIRST'],
						'travelerNum' => $index,
					);
				}
				if (isset($traveler['AGEBAND']) && isset($bookingQuestions['AGEBAND'])) {
					$body['bookingQuestionAnswers'][] = array(
						'question' => 'AGEBAND',
						'answer' => $traveler['AGEBAND'],
						'travelerNum' => $index,
					);
				}
				if (isset($traveler['DATE_OF_BIRTH']) && isset($bookingQuestions['DATE_OF_BIRTH'])) {
					$body['bookingQuestionAnswers'][] = array(
						'question' => 'DATE_OF_BIRTH',
						'answer' => $traveler['DATE_OF_BIRTH'],
						'travelerNum' => $index,
					);
				}
				if (isset($traveler['FULL_NAMES_LAST']) && isset($bookingQuestions['FULL_NAMES_LAST'])) {
					$body['bookingQuestionAnswers'][] = array(
						'question' => 'FULL_NAMES_LAST',
						'answer' => $traveler['FULL_NAMES_LAST'],
						'travelerNum' => $index,
					);
				}
			}
		}
		
		if ($first_nameOrder && $last_nameOrder) {
			if (isset($bookingQuestions['FULL_NAMES_FIRST'])) {
				$body['bookingQuestionAnswers'][] = array(
					'question' => 'FULL_NAMES_FIRST',
					'answer' => $first_nameOrder,
					'travelerNum' => 1,
				);
			}
			
			if (isset($bookingQuestions['AGEBAND'])) {
				$ageBandExistsForTravelerNum1 = false;

				// Check if 'AGEBAND' value for travelerNum 1 already exists
				foreach ($body['bookingQuestionAnswers'] as $answer) {
					if ($answer['question'] === 'AGEBAND' && $answer['travelerNum'] === 1) {
						$ageBandExistsForTravelerNum1 = true;
						break;
					}
				}

				// Add 'AGEBAND' value for travelerNum 1 only if it does not exist
				if (!$ageBandExistsForTravelerNum1) {
					$body['bookingQuestionAnswers'][] = array(
						'question' => 'AGEBAND',
						'answer' => 'ADULT',
						'travelerNum' => 1,
					);
				}
			}
			
			if (isset($bookingQuestions['FULL_NAMES_LAST'])) {
				$body['bookingQuestionAnswers'][] = array(
					'question' => 'FULL_NAMES_LAST',
					'answer' => $last_nameOrder,
					'travelerNum' => 1,
				);
			}
		}

        if ($extraQuestions) {
            foreach ($extraQuestions as $key => $extra_question) {
                if ('location_item' !== $key && (empty($extra_question) || !isset($bookingQuestions[$key]))) {
                    continue;
                }

                if ('TRANSFER_ARRIVAL_DROP_OFF' === $key || 'TRANSFER_DEPARTURE_PICKUP' === $key) {
                    $body['bookingQuestionAnswers'][] = array(
                        'question' => $key,
                        'answer' => $extra_question,
                        'unit' => 'FREETEXT',
                    );
                } elseif ('TRANSFER_AIR_ARRIVAL_AIRLINE' === $key) {
                    $body['bookingQuestionAnswers'][] = array(
                        'question' => $key,
                        'answer' => $extra_question,
                    );
                } elseif ('location_item' === $key) {
                    $body['bookingQuestionAnswers'][] = array(
                        'question' => 'PICKUP_POINT',
                        'answer' => $extra_question,
                        'unit' => 'LOCATION_REFERENCE',
                    );
                } else {
                    if ($key === 'AGEBAND' || $key === 'FULL_NAMES_FIRST' || $key === 'FULL_NAMES_LAST') {
                        continue;
                    }
                    $body['bookingQuestionAnswers'][] = array(
                        'question' => $key,
                        'answer' => $extra_question,
                    );
                }
            }
        }

        $args['body'] = wp_json_encode($body, JSON_UNESCAPED_SLASHES);

        update_post_meta($order_id, '_travel_date', $travelDate);
        update_post_meta($order_id, '_startTime', $startTime);
        update_post_meta($order_id, '_bookingRef', $partnerRef);
        update_post_meta($order_id, '_language', $lang_guide);

        if ($customer_id = get_post_meta($product_id, '_create_acc_id', true)) {
            $order->set_customer_id($customer_id);
        }
        if ($pickup = get_post_meta($product_id, '_pickup', true)) {
            update_post_meta($order_id, '_pickup', $pickup);
        }

        if ($buying_first_name = get_post_meta($product_id, '_buying_user_first_name', true)) {
            update_post_meta($order_id, '_buying_user_first_name', $buying_first_name);
        }
        if ($buying_last_name = get_post_meta($product_id, '_buying_user_last_name', true)) {
            update_post_meta($order_id, '_buying_user_last_name', $buying_last_name);
        }

        if ($request = $this->send_and_get_data($url, $args, '', '', true)) {
            $this->write_log(date('Y-m-d H:i:s P') . ':__ ' . $request, 'booking.txt');
            $request = json_decode($request, true);

            if ($request['status'] === 'CONFIRMED' || $request['status'] === 'PENDING') {
                update_post_meta($order_id, '_voucher', $request['voucherInfo']['url']);
            } else {
                wc_add_notice($request->data->message, 'error');
                //$order->update_status('failed');
                throw new \Exception($request);
            }
        } else {
            $this->write_log(date('Y-m-d H:i:s P') . ':__ ' . $request, 'error_booking.txt');
            //$order->update_status('failed');
            throw new \Exception('Error booking');
        }
    }
}

	
	public function woo_before_thankyou_hook( $order_id ) {
		$order       = wc_get_order( $order_id );
		$order_items = $order->get_items();

		foreach ( $order_items as $item ) {
			$product = $item->get_product();

			if ( $product ) {
				$product_id   = $product->get_id();
				$type_product = get_post_meta( $product_id, '_temp_product', true ) ? 'viator' : 'woo';

				if ( 'viator' === $type_product && ! $product->delete( true ) ) {
					//wp_delete_post( $product_id, true );
				}
			}
		}
	}


	//Functions that are auxiliary
	public function send_and_get_data( $url, $args, $type = 'post', $parameters = array(), $return = false ) {
		$def_params = array(
			'get_tags' => false,
			'get_dest' => false,
		);
		$language   = 'en';

		$def_params = wp_parse_args( $parameters, $def_params );

		if ( $type === 'get' ) {
			$response = wp_remote_get( $url, $args );
		} else {
			
			$this->write_log( date( 'Y-m-d H:i:s Url' ), 'api.txt' );
			$this->write_log( print_r($url,true), 'api.txt' );
			$this->write_log( '-----------------', 'api.txt' );

			$this->write_log( date( 'Y-m-d H:i:s Args' ), 'api.txt' );
			$this->write_log( print_r($args,true), 'api.txt' );
			$this->write_log( '-----------------', 'api.txt' );
			
			$response = wp_remote_post( $url, $args );
		}

		if ( isset( $args['headers']['Accept-Language'] ) && ! empty( $args['headers']['Accept-Language'] ) ) {
			$language = $args['headers']['Accept-Language'];
		}

		if ( ! is_wp_error( $response ) ) {
			
			if ( $type === 'post' ) {
				$this->write_log( date( 'Y-m-d H:i:s Response' ), 'api.txt' );
				$this->write_log( print_r($response['body'],true), 'api.txt' );
				$this->write_log( '-----------------', 'api.txt' );
			}
			
			if ( strpos( $response['body'], '"BAD_REQUEST"' ) ||
				 strpos( $response['body'], '"UNAUTHORIZED"' ) ||
				 strpos( $response['body'], '"FORBIDDEN"' ) ||
				 strpos( $response['body'], '"NOT_FOUND"' ) ||
				 strpos( $response['body'], '"TOO_MANY_REQUESTS"' ) ||
				 strpos( $response['body'], '"INTERNAL_SERVER_ERROR"' ) ||
				 strpos( $response['body'], '"SERVICE_UNAVAILABLE"' ) ) {
				header( 'Content-Type: application/json' );

				//exit( '{"success":false, "data": ' . $response['body'] . '}' );
				
				// Set WooCommerce notice
				wc_add_notice(__('An error occurred while processing your request. Your account will be refunded. Please try again later. Error: ' . $response['body'], 'viatorCore'), 'error');

				// Redirect to the checkout page
				wp_safe_redirect( wc_get_checkout_url() ); // Redirect to the checkout page
				exit;

			}


			if ( $return ) {
				return $response['body'];
			}

			header( 'Content-Type: application/json' );

			if ( $def_params['get_tags'] && ! $def_params['get_dest'] ) {
				exit( '{"data": ' . $response['body'] . ', ' . substr( get_option( '_viator_tags' ), 1, - 1 ) . '}' );
			}

			if ( ! $def_params['get_tags'] && $def_params['get_dest'] ) {
				exit( '{"data": ' . $response['body'] . ', ' . substr( '{"dest":' . get_option( '_viator_dest_' . $language ) . '}',
						1, - 1 ) . '}' );
			}

			if ( $def_params['get_tags'] && $def_params['get_dest'] ) {
				exit( '{"data": ' . $response['body'] . ', ' . substr( get_option( '_viator_tags' ), 1,
						- 1 ) . substr( '{,"dest":' . get_option( '_viator_dest_' . $language ) . '}', 1, - 1 ) . '}' );
			}

			exit( '{"data": ' . $response['body'] . '}' );
		}

		wp_send_json(
			array(
				'message' => $response->get_error_message() ?: "error",
			),
			400
		);
	}

	public function get_apiKey() {
		$apikey = get_option( '_viator_apikey' );

		if ( empty( $apikey ) ) {
			exit( 'No set api key' );
		}

		return $apikey;
	}

	public function is_sandbox_api() {
		if ( get_option( '_use_sandbox_api' ) ) {
			return true;
		}

		return false;
	}

	public function get_api_host() {
		if ( $this->is_sandbox_api() ) {
			return 'https://api.sandbox.viator.com/partner';
		}

		return 'https://api.viator.com/partner';
	}

	public function get_name_language( $str = 'en', $lng = 'en' ) {
		$lang       = array();
		$lang['en'] = array(
			'cmn'   => 'Mandarin',
			'es'    => 'Spanish',
			'en'    => 'English',
			'hi'    => 'Hindi',
			'ar'    => 'Arabic',
			'pt'    => 'Portuguese',
			'bn'    => 'Bengali',
			'ru'    => 'Russian',
			'ja'    => 'Japanese',
			'pa'    => 'Panjabi',
			'de'    => 'German',
			'jv'    => 'Javanese',
			'wuu'   => 'Wu Chinese',
			'ms'    => 'Malay',
			'te'    => 'Telugu',
			'vi'    => 'Vietnamese',
			'ko'    => 'Korean',
			'fr'    => 'French',
			'mr'    => 'Marathi',
			'ta'    => 'Tamil',
			'ur'    => 'Urdu',
			'tr'    => 'Turkish',
			'it'    => 'Italian',
			'yue'   => 'Cantonese',
			'th'    => 'Thai',
			'gu'    => 'Gujarati',
			'mnp'   => 'Chinese Min Bei',
			'fa'    => 'Farsi',
			'pl'    => 'Polish',
			'ps'    => 'Pushto',
			'hsn'   => 'Hunanese',
			'ml'    => 'Malayalam',
			'my'    => 'Burmese',
			'hak'   => 'Hakka Chinese',
			'uk'    => 'Ukrainian',
			'fil'   => 'Filipino',
			'ro'    => 'Romanian',
			'nl'    => 'Dutch',
			'ku'    => 'Kurdish',
			'hr'    => 'Croatian',
			'hu'    => 'Hungarian',
			'el'    => 'Greek',
			'cs'    => 'Czech',
			'sv'    => 'Swedish',
			'fi'    => 'Finnish',
			'sk'    => 'Slovak',
			'sr'    => 'Serbian',
			'no'    => 'Norwegian',
			'he'    => 'Hebrew',
			'da'    => 'Danish',
			'zh_TW' => 'Chinese Traditional',
			'zh_CN' => 'Chinese Simplified',
			'id'    => 'Indonesian',
		);
		$lang['it'] = array(
			'cmn'   => 'Mandarino',
			'es'    => 'spagnolo',
			'en'    => 'Inglese',
			'hi'    => 'hindi',
			'ar'    => 'arabo',
			'pt'    => 'portoghese',
			'bn'    => 'bengalese',
			'ru'    => 'russo',
			'ja'    => 'Giapponese',
			'pa'    => 'Panjabi',
			'de'    => 'Tedesco',
			'jv'    => 'giavanese',
			'wuu'   => 'Wu cinese',
			'ms'    => 'malese',
			'te'    => 'Telugu',
			'vi'    => 'vietnamita',
			'ko'    => 'coreano',
			'fr'    => 'Francese',
			'mr'    => 'Marathi',
			'ta'    => 'Tamil',
			'ur'    => 'Urdu',
			'tr'    => 'turco',
			'it'    => 'Italiano',
			'yue'   => 'Cantonese',
			'th'    => 'tailandese',
			'gu'    => 'Gujarati',
			'mnp'   => 'Cinese Min Bei',
			'fa'    => 'Farsi',
			'pl'    => 'polacco',
			'ps'    => 'Pushto',
			'hsn'   => 'Hunanese',
			'ml'    => 'Malayalam',
			'my'    => 'birmano',
			'hak'   => 'Cinese Hakka',
			'uk'    => 'ucraino',
			'fil'   => 'filippino',
			'ro'    => 'rumeno',
			'nl'    => 'Olandese',
			'ku'    => 'curdo',
			'hr'    => 'Croato',
			'hu'    => 'ungherese',
			'el'    => 'Greco',
			'cs'    => 'ceco',
			'sv'    => 'svedese',
			'fi'    => 'finlandese',
			'sk'    => 'slovacco',
			'sr'    => 'serbo',
			'no'    => 'norvegese',
			'he'    => 'ebraico',
			'da'    => 'danese',
			'zh_TW' => 'Cinese tradizionale',
			'zh_CN' => 'Cinese semplificato',
			'id'    => 'indonesiano',
		);
		$lang['es'] = array(
			'cmn'   => 'Mandarín',
			'es'    => 'Español',
			'en'    => 'Inglés',
			'hi'    => 'Hindi',
			'ar'    => 'árabe',
			'pt'    => 'Portugués',
			'bn'    => 'bengalí',
			'ru'    => 'ruso',
			'ja'    => 'japonés',
			'pa'    => 'Panyabí',
			'de'    => 'alemán',
			'jv'    => 'javanés',
			'wuu'   => 'chino wu',
			'ms'    => 'malayo',
			'te'    => 'telugú',
			'vi'    => 'vietnamita',
			'ko'    => 'coreano',
			'fr'    => 'francés',
			'mr'    => 'marathi',
			'ta'    => 'Tamil',
			'ur'    => 'Urdu',
			'tr'    => 'turco',
			'it'    => 'italiano',
			'yue'   => 'cantonés',
			'th'    => 'tailandés',
			'gu'    => 'Gujarati',
			'mnp'   => 'Chino Min Bei',
			'fa'    => 'farsi',
			'pl'    => 'polaco',
			'ps'    => 'Pushto',
			'hsn'   => 'Hunanés',
			'ml'    => 'malayalam',
			'my'    => 'birmano',
			'hak'   => 'Hakka chino',
			'uk'    => 'ucraniano',
			'fil'   => 'filipino',
			'ro'    => 'rumano',
			'nl'    => 'holandés',
			'ku'    => 'kurdo',
			'hr'    => 'croata',
			'hu'    => 'Húngaro',
			'el'    => 'griego',
			'cs'    => 'checo',
			'sv'    => 'Sueco',
			'fi'    => 'finlandés',
			'sk'    => 'eslovaco',
			'sr'    => 'serbio',
			'no'    => 'noruego',
			'he'    => 'hebreo',
			'da'    => 'danés',
			'zh_TW' => 'Chino tradicional',
			'zh_CN' => 'Chino simplificado',
			'id'    => 'Indonesio',
		);

		return $lang[ $lng ][ $str ] ?? 'English';
	}



	public function get_template( $template_name, $load = false, $atts = array() ) {
		if ( empty( $template_name ) ) {
			return false;
		}

		$located = VIATOR_PATH . '/templates/' . $template_name;

		if ( $load && ! empty( $located ) && file_exists( $located ) ) {
			if ( $atts ) {
				extract( $atts, EXTR_SKIP );
			}

			require_once $located;
		}

		return $located;
	}

	public function write_log( $data, $file_name = 'temp.txt' ) {
		if ( ! is_dir( VIATOR_PATH . '/log/' ) ) {
			mkdir( VIATOR_PATH . '/log/', 0777, true );
		}

		$path = VIATOR_PATH . '/log/' . $file_name;

		if ( is_bool( $data ) ) {
			$new_data = (int) $data ? 'true' : 'false';

			file_put_contents( $path, $new_data . "\n\r", FILE_APPEND );

		} elseif ( is_string( $data ) ) {
			file_put_contents( $path, $data . "\n\r", FILE_APPEND );

		} else {
			file_put_contents( $path, json_encode( $data ) . "\n\r", FILE_APPEND );
		}
	}

	//Functions which init with site
	public function add_theme_page_templates( $templates ) {
		$templates['all-destination.php'] = 'Destinations Page';

		return $templates;
	}

	public function add_template_include( $template ) {
		$page_template = get_page_template_slug();

		if ( 'all-destination.php' === basename( $page_template ) ) {
			return wp_normalize_path( VIATOR_PATH . '/templates/all-destination.php' );
		}

		return $template;
	}

	public function change_review_order_after_cart_contents() {
		$cart_product = WC()->cart->get_cart();
		$cart_product = array_shift( $cart_product );
		$product_id   = $cart_product['product_id'];
		$paxMix       = get_post_meta( $product_id, '_paxMix', true );

		$labels = [
			"adult"  => __( 'adult', 'viator' ),
			"child"  => __( 'child', 'viator' ),
			"infant" => __( 'infant', 'viator' ),
			"youth"  => __( 'youth', 'viator' ),
			"senior" => __( 'senior', 'viator' ),
		];

		if ( $paxMix && ( $paxMixCount = count( $paxMix ) ) ) {
			-- $paxMixCount;
			?>
			<tr class="cart_item cart_item-extra">
				<td class="product-name">
					<small>
						<?php foreach ( $paxMix as $key => $item ) {
							echo $item['numberOfTravelers'] . ' ' . ucfirst( $labels[ strtolower( $item['ageBand'] ) ] );

							if ( $key !== $paxMixCount ) {
								echo ', ';
							}

						} ?>
					</small>
				</td>
			</tr>
			<?php
		}
	}

	public function add_voucher( $order ) {
		if ( $order->get_status() !== 'refunded' && $voucher = get_post_meta( $order->get_id(), '_voucher', true ) ) {
			$iframe_height = is_account_page() ? '2000px' : '2222px';
			$voucher_code  = parse_url( $voucher, PHP_URL_QUERY );
			$voucher_url   = home_url( '/voucher/' . $voucher_code );
			?>
			<h4 style="position:relative;font-weight:normal;text-align:center;margin-top: 50px;">
				<a target="_blank" href="<?php echo $voucher_url; ?>">Your voucher</a>
			</h4>

			<iframe src="<?php echo $voucher_url; ?>"
					style="width: 100%;margin-top: -15px;height: <?php echo $iframe_height; ?>; border-bottom: 1px solid #f4f4f4;"
					frameborder="0"></iframe>
			<?php
		}
	}

	public function add_custom_fields_order( $order ) {
		$order_id = $order->get_id();

		if ( $travel_date = get_post_meta( $order_id, '_travel_date', true ) ):
			if ( get_post_meta( $order_id, '_type_post', true ) ) {
				$travel_date = date( 'Y-m-d', $travel_date );
			}
			?>
			<p>
				<strong><?php echo __( 'Departure date', 'viatorCore' ); ?>:</strong>
				<span><?php echo $travel_date; ?></span>
			</p>
		<?php endif; ?>

		<?php if ( $startTime = get_post_meta( $order_id, '_startTime', true ) ): ?>
			<p>
				<strong><?php echo __( 'Departure time', 'viatorCore' ); ?>:</strong>
				<span><?php echo $startTime; ?></span>
			</p>
		<?php endif; ?>

		<?php if ( $pickup = get_post_meta( $order_id, '_pickup', true ) ): ?>
			<p>
				<strong><?php echo __( 'Pickup point', 'viatorCore' ); ?>:</strong>
				<span><?php echo $pickup['name']; ?></span>
			</p>
		<?php endif; ?>

		<?php if ( $language = get_post_meta( $order_id, '_language', true ) ): ?>
			<p>
				<strong><?php echo __( 'Language', 'viatorCore' ); ?>:</strong>
				<span><?php echo $this->get_name_language( $language[0],
							pll_current_language() ) . ' - ' . $language[2]; ?></span>
			</p>
		<?php endif; ?>

		<?php if ( $bookingRef = get_post_meta( $order_id, '_bookingRef', true ) ): ?>
			<p>
				<strong><?php echo __( 'Booking id', 'viatorCore' ); ?>:</strong>
				<span><?php echo $bookingRef ?></span>
			</p>
		<?php endif; ?>

		<?php if ( $voucher = get_post_meta( $order_id, '_voucher', true ) ):
			$voucher_code = parse_url( $voucher, PHP_URL_QUERY );
			?>
			<p>
				<strong><?php echo __( 'Voucher', 'viatorCore' ); ?>:</strong>
				<a target="_blank" href="<?php echo home_url( '/voucher/' . $voucher_code ); ?>"><?php echo __( 'Check',
						'viatorCore' ); ?></a>
			</p>
		<?php endif; ?>

		<?php if ( ( $buying_user_first_name = get_post_meta( $order_id, '_buying_user_first_name', true ) ) &&
				   ( $buying_user_last_name = get_post_meta( $order_id, '_buying_user_last_name', true ) ) ): ?>
			<h4><?php echo __( 'Details of the user who buys:', 'viatorCore' ); ?></h4>
			<p>
				<strong><?php echo __( 'First name', 'viatorCore' ); ?>:</strong>
				<span><?php echo $buying_user_first_name ?></span>
			</p>
			<p>
				<strong><?php echo __( 'Last name', 'viatorCore' ); ?>:</strong>
				<span><?php echo $buying_user_last_name ?></span>
			</p>
		<?php endif; ?>

		<?php
	}

	public function fixed_excerpt_more() {
		return '...';
	}

	public function fixed_excerpt_length() {
		return 25;
	}

	public function init_carbon_fields() {
		require_once( VIATOR_PATH . 'vendor/autoload.php' );
		\Carbon_Fields\Carbon_Fields::boot();
	}

	public function change_cart_text() {
		return __( 'Booking', 'viatorCore' );
	}

	public function add_to_cart_redirect() {
		return wc_get_checkout_url();
	}

	public function add_new_checkout_fields( $fields ) {

		unset(
			$fields['shipping']['shipping_postcode'],
			$fields['shipping']['shipping_country'],
			$fields['shipping']['shipping_state'],
			$fields['shipping']['shipping_email'],
			$fields['shipping']['shipping_company'],
			$fields['shipping']['shipping_address_2'],
			$fields['order']['order_comments']
		);

		$language     = 'en';
		$cart_product = WC()->cart->get_cart();
		$cart_product = array_shift( $cart_product );
		$product_id   = $cart_product['product_id'];


		if ( ( $all_questions = get_option( '_viator_booking_questions_' . $language ) ) &&
			 $book_questions = get_post_meta( $product_id, '_bookingQuestions', true ) ) {
			 $all_questions = json_decode( $all_questions, true );

			foreach ( $book_questions as $question ) {
				foreach ( $all_questions['bookingQuestions'] as $ques ) {
					if ( $ques['id'] === 'AGEBAND' || $ques['id'] === 'FULL_NAMES_LAST' || $ques['id'] === 'FULL_NAMES_FIRST' || $ques['id'] === 'DATE_OF_BIRTH' ) {
						continue;
					}


					if ( $question === $ques['id'] && $ques['group'] === 'PER_TRAVELER' ) {


						$fields['billing']["lead[{$ques['id']}]"] = array(
							'placeholder'  => $ques['hint'] ?? '',
							'label'        => $ques['label'] ?? str_replace( '_', ' ',
									ucfirst( strtolower( $ques['id'] ) ) ),
							'class'        => array( 'form-row-wide' ),
							'autocomplete' => '',
							'priority'     => 500,
						);

						if ( $ques['required'] === 'MANDATORY' ) {
							$fields['billing']["lead[{$ques['id']}]"]['required'] = 1;
						}
					}
				}
			}

		}

		return $fields;
	}

	public function add_checkout_fields_before_notes() {
		$language     = pll_current_language();
		$cart_product = WC()->cart->get_cart();
		$cart_product = array_shift( $cart_product );
		$product_id   = $cart_product['product_id'];

		if ( ( $book_questions = get_post_meta( $product_id, '_bookingQuestions', true ) ) &&
			 ( $all_questions = get_option( '_viator_booking_questions_' . $language ) ) ) {

			$full_last     = '';
			$full_first    = '';
			$traveler_item = 1;
			$per_traveler  = array(); //additional fields for each traveler
			$all_questions = json_decode( $all_questions, true );

			foreach ( $book_questions as $question ) {
				foreach ( $all_questions['bookingQuestions'] as $ques ) {
					
					if ( $question === $ques['id'] && $ques['id'] !== 'AGEBAND' && $ques['group'] === 'PER_TRAVELER' ) {
						if ( $ques['id'] === 'FULL_NAMES_LAST' ) {
							$full_last = $ques;
						} elseif ( $ques['id'] === 'FULL_NAMES_FIRST' ) {
							$full_first = $ques;
						} else {
							$per_traveler[] = $ques;
						}
					}
				}
			}

			if ( $full_last ) {
				array_unshift( $per_traveler, $full_last );
			}
			if ( $full_first ) {
				array_unshift( $per_traveler, $full_first );
			}

			if ( ( $paxMix = get_post_meta( $product_id, '_paxMix', true ) ) && $per_traveler ) {
				foreach ( $paxMix as $ageBand ) {
					$count_travelers = (int) $ageBand['numberOfTravelers'];

					if ( 'ADULT' === $ageBand['ageBand'] || 'TRAVELER' === $ageBand['ageBand'] ) {
						//$count_travelers = (int) $ageBand['numberOfTravelers'] - 1;
					}

					for ( $i = 0, $c = $count_travelers; $i < $c; $i ++ ) : ?>
						<div class="woocommerce-billing-fields__field-wrapper">
							<h6><?php esc_html_e( "Traveler", 'viator' ); ?> <?php echo $traveler_item; ?>
								(<?php echo ucfirst( strtolower( $ageBand['ageBand'] ) ); ?>)</h6>

							<?php foreach ( $per_traveler as $item ) :
								$class = 'form-row-wide';
								$holder = $ques['hint'] ?? '';
								$label = $item['label'] ?? str_replace( '_', ' ',
										ucfirst( strtolower( $item['id'] ) ) );

								if ( $item['id'] === 'FULL_NAMES_FIRST' ) {
									$class = 'form-row-first';
								}
								if ( $item['id'] === 'FULL_NAMES_LAST' ) {
									$class = 'form-row-last';
								}
								?>
								<p class="form-row <?php echo $class; ?> validate-required">
									<label for="travelers_<?php echo $traveler_item ?>_<?php echo $item['id']; ?>">
										<?php echo $label; ?>
										<abbr class="required" title="required">*</abbr>
									</label>

									<span class="woocommerce-input-wrapper">
									<?php if ($item['id'] == 'DATE_OF_BIRTH' || $item['id'] == 'PASSPORT_EXPIRY' || $item['id'] == 'TRANSFER_DEPARTURE_DATE' ) {
										$inType = "date";
									} else {
										$inType = "text";
									} ?>
									<input type="<?php echo $inType; ?>" class="input-text" required="required" placeholder="<?php echo $holder; ?>"
										   name="travelers[<?php echo $traveler_item ?>][<?php echo $item['id']; ?>]" id="travelers_<?php echo $traveler_item ?>_<?php echo $item['id']; ?>">

									<input type="text" hidden class="hidden" name="travelers[<?php echo $traveler_item ?>][AGEBAND]"
										   value="<?php echo $ageBand['ageBand']; ?>">
								</span>
								</p>

							<?php endforeach; ?>
						</div>
						<?php
						$traveler_item ++;
					endfor;
				}
			}
		}

	}

	public function add_checkout_fields_after_notes( $checkout ) {
		$language     = pll_current_language() ?? 'en';
		$cart_product = WC()->cart->get_cart();
		$cart_product = array_shift( $cart_product );
		$product_id   = $cart_product['product_id'];
		$optionCode   = get_post_meta( $product_id, '_optionCode', true );
		$type_product = get_post_meta( $product_id, '_temp_product', true ) ? 'viator' : 'woo';

		if ( $book_questions = get_post_meta( $product_id, '_bookingQuestions', true ) ) {
			//$pickup             = get_post_meta( $product_id, '_pickup', true );
			$allowCustomPickup  = get_post_meta( $product_id, '_allowCustomPickup', true );
			$key_book_questions = array_flip( $book_questions );
			$questions_id       = array();
			$arrival_loc_type   = array();
			$departure_loc_type = array();
			$arrival_ques       = array(
				'air'  => array(),
				'rail' => array(),
				'sea'  => array(),
			);
			$departure_ques     = array(
				'air'  => array(),
				'rail' => array(),
				'sea'  => array(),
			);
			$all_location       = array(
				'airport'  => array(),
				'hotel'    => array(),
				'port'     => array(),
				'location' => array(),
			);

			++ $key_book_questions[ array_key_first( $key_book_questions ) ];

			if ( $all_questions = get_option( '_viator_booking_questions_' . $language ) ) {
				$all_questions = json_decode( $all_questions, true )['bookingQuestions'];
				$questions_id  = array_column( $all_questions, 'id' );
			}

			if ( $locations = get_post_meta( $product_id, '_locations', true ) ) {
				foreach ( $locations as $key => $location ) {
					if ( 'AIRPORT' === $location['type'] ) {
						$all_location['airport'][ $key ] = $location;
					}
					if ( 'HOTEL' === $location['type'] ) {
						$all_location['hotel'][ $key ] = $location;
					}
					if ( 'PORT' === $location['type'] ) {
						$all_location['port'][ $key ] = $location;
					}
					if ( 'LOCATION' === $location['type'] ) {
						$all_location['location'][ $key ] = $location;
					}
				}
			}


			foreach ( $book_questions as $question ) {
				//TRANSFER_ARRIVAL
				if ( 'TRANSFER_AIR_ARRIVAL_AIRLINE' === $question || 'TRANSFER_AIR_ARRIVAL_FLIGHT_NO' === $question ) {
					$arrival_loc_type['AIR'] = 'Airport';

					$i = array_search( $question, $questions_id, true );

					$arrival_ques['air'][] = $all_questions[ $i ];
				}
				if ( 'TRANSFER_RAIL_ARRIVAL_LINE' === $question || 'TRANSFER_RAIL_ARRIVAL_STATION' === $question ) {
					$arrival_loc_type['RAIL'] = 'Train';

					$i = array_search( $question, $questions_id, true );

					$arrival_ques['rail'][] = $all_questions[ $i ];
				}
				if ( 'TRANSFER_PORT_ARRIVAL_TIME' === $question || 'TRANSFER_PORT_CRUISE_SHIP' === $question ) {
					$arrival_loc_type['SEA'] = 'Port';

					$i = array_search( $question, $questions_id, true );

					$arrival_ques['sea'][] = $all_questions[ $i ];
				}


				//TRANSFER_DEPARTURE
				if ( 'TRANSFER_AIR_DEPARTURE_AIRLINE' === $question || 'TRANSFER_AIR_DEPARTURE_FLIGHT_NO' === $question ) {
					$departure_loc_type['AIR'] = 'Airport';

					$i = array_search( $question, $questions_id, true );
					$i ? $departure_ques['air'][] = $all_questions[ $i ] : $departure_ques['air'][] = $question;
				}

				if ( 'TRANSFER_RAIL_DEPARTURE_LINE' === $question || 'TRANSFER_RAIL_DEPARTURE_STATION' === $question ) {
					$departure_loc_type['RAIL'] = 'Train';

					$i = array_search( $question, $questions_id, true );
					$i ? $departure_ques['rail'][] = $all_questions[ $i ] : $departure_ques['rail'][] = $question;
				}

				if ( isset( $arrival_loc_type['SEA'] ) ) {
					$departure_loc_type['SEA'] = 'Port';

					if ( 'TRANSFER_PORT_CRUISE_SHIP' === $question ) {
						$i = array_search( $question, $questions_id, true );
						$i ? $departure_ques['sea'][] = $all_questions[ $i ] : $departure_ques['sea'][] = 'TRANSFER_PORT_CRUISE_SHIP';

						if ( ! empty( $key_book_questions['TRANSFER_DEPARTURE_DATE'] ) ) {
							$i = array_search( 'TRANSFER_DEPARTURE_DATE', $questions_id, true );
							$i ? $departure_ques['sea'][] = $all_questions[ $i ] : $departure_ques['sea'][] = 'TRANSFER_DEPARTURE_DATE';
						}
						if ( ! empty( $key_book_questions['TRANSFER_PORT_DEPARTURE_TIME'] ) ) {
							if ( $i = array_search( 'TRANSFER_PORT_DEPARTURE_TIME', $questions_id, true ) ) {
								$departure_ques['sea'][] = $all_questions[ $i ];
							} else {
								$departure_ques['sea'][] = 'TRANSFER_PORT_DEPARTURE_TIME';
							}
						}
						if ( ! empty( $key_book_questions['TRANSFER_DEPARTURE_PICKUP'] ) ) {
							if ( $i = array_search( 'TRANSFER_DEPARTURE_PICKUP', $questions_id, true ) ) {
								$departure_ques['sea'][] = $all_questions[ $i ];
							} else {
								$departure_ques['sea'][] = 'TRANSFER_DEPARTURE_PICKUP';
							}
						}
					}
				}
				//}

			}//foreach

			//$arrival_ques
			if ( count( $arrival_ques['air'] ) > 0 ) {
				if ( $key_book_questions['TRANSFER_ARRIVAL_DROP_OFF'] && ( $allowCustomPickup === 'true' || $all_location['airport'] ) ) {
					$i = array_search( 'TRANSFER_ARRIVAL_DROP_OFF', $questions_id, true );
					$i ? $arrival_ques['air'][] = $all_questions[ $i ] : $arrival_ques['air'][] = 'TRANSFER_ARRIVAL_DROP_OFF';
				}
				if ( $key_book_questions['TRANSFER_ARRIVAL_TIME'] ) {
					$i = array_search( 'TRANSFER_ARRIVAL_TIME', $questions_id, true );
					$i ? $arrival_ques['air'][] = $all_questions[ $i ] : $arrival_ques['air'][] = 'TRANSFER_ARRIVAL_TIME';
				}

			}
			if ( count( $arrival_ques['rail'] ) > 0 ) {
				if ( $key_book_questions['TRANSFER_ARRIVAL_DROP_OFF'] ) {
					$i = array_search( 'TRANSFER_ARRIVAL_DROP_OFF', $questions_id, true );
					$i ? $arrival_ques['rail'][] = $all_questions[ $i ] : $arrival_ques['rail'][] = 'TRANSFER_ARRIVAL_DROP_OFF';
				}
				if ( $key_book_questions['TRANSFER_ARRIVAL_TIME'] ) {
					$i = array_search( 'TRANSFER_ARRIVAL_TIME', $questions_id, true );
					$i ? $arrival_ques['rail'][] = $all_questions[ $i ] : $arrival_ques['rail'][] = 'TRANSFER_ARRIVAL_TIME';
				}
			}
			if ( count( $arrival_ques['sea'] ) > 0 ) {
				if ( ! empty( $key_book_questions['TRANSFER_ARRIVAL_DROP_OFF'] ) ) {
					$i = array_search( 'TRANSFER_ARRIVAL_DROP_OFF', $questions_id, true );
					$i ? $arrival_ques['sea'][] = $all_questions[ $i ] : $arrival_ques['sea'][] = 'TRANSFER_ARRIVAL_DROP_OFF';
				}
				if ( ! empty( $key_book_questions['TRANSFER_ARRIVAL_TIME'] ) ) {
					$i = array_search( 'TRANSFER_ARRIVAL_TIME', $questions_id, true );
					$i ? $arrival_ques['sea'][] = $all_questions[ $i ] : $arrival_ques['sea'][] = 'TRANSFER_ARRIVAL_TIME';
				}

			}

			//$departure_ques
			if ( count( $departure_ques['air'] ) > 0 ) {
				if ( $key_book_questions['TRANSFER_DEPARTURE_DATE'] ) {
					$i = array_search( 'TRANSFER_DEPARTURE_DATE', $questions_id, true );
					$i ? $departure_ques['air'][] = $all_questions[ $i ] : $departure_ques['air'][] = 'TRANSFER_DEPARTURE_DATE';
				}
				if ( $key_book_questions['TRANSFER_DEPARTURE_TIME'] ) {
					$i = array_search( 'TRANSFER_DEPARTURE_TIME', $questions_id, true );
					$i ? $departure_ques['air'][] = $all_questions[ $i ] : $departure_ques['air'][] = 'TRANSFER_DEPARTURE_TIME';
				}
				if ( $key_book_questions['TRANSFER_DEPARTURE_PICKUP'] ) {
					$i = array_search( 'TRANSFER_DEPARTURE_PICKUP', $questions_id, true );
					$i ? $departure_ques['air'][] = $all_questions[ $i ] : $departure_ques['air'][] = 'TRANSFER_DEPARTURE_PICKUP';
				}
			}
			if ( count( $departure_ques['rail'] ) > 0 ) {
				if ( $key_book_questions['TRANSFER_DEPARTURE_DATE'] ) {
					$i = array_search( 'TRANSFER_DEPARTURE_DATE', $questions_id, true );
					$i ? $departure_ques['rail'][] = $all_questions[ $i ] : $departure_ques['rail'][] = 'TRANSFER_DEPARTURE_DATE';
				}
				if ( $key_book_questions['TRANSFER_DEPARTURE_TIME'] ) {
					$i = array_search( 'TRANSFER_DEPARTURE_TIME', $questions_id, true );
					$i ? $departure_ques['rail'][] = $all_questions[ $i ] : $departure_ques['rail'][] = 'TRANSFER_DEPARTURE_TIME';
				}
				if ( $key_book_questions['TRANSFER_DEPARTURE_PICKUP'] ) {
					$i = array_search( 'TRANSFER_DEPARTURE_PICKUP', $questions_id, true );
					$i ? $departure_ques['rail'][] = $all_questions[ $i ] : $departure_ques['rail'][] = 'TRANSFER_DEPARTURE_PICKUP';
				}
			}

			ksort( $arrival_loc_type );

			if ( $all_location['hotel'] ) {
				$arrival_loc_type['OTHER'] = 'Hotel';
			}

			if ( $arrival_loc_type ) {
//				echo '<h6>' . esc_html__('Pickup details', 'viator') . '</h6>';
//				echo '<p>' . esc_html__('The provider offers pickup from select locations.', 'viator') . '</p>';

				$options = [];
				foreach ( $arrival_loc_type as $key => $item ) {
					$options[ $key ] = $item;
				}

				woocommerce_form_field( 'extraBookingQuestions[TRANSFER_ARRIVAL_MODE]', array(
					'type'        => 'select',
					'id'          => 'field_transfer_arrival_mode',
					'class'       => array( 'my-field-class form-row-wide' ),
					'label'       => esc_html__( 'Pickup details', 'viator' ),
					'label_class' => array( 'h6' ),
					'required'    => true,
					'options'     => $options,
				), '' );

				echo '<div class="show_viator_location"></div>';
				echo '<div class="arrival-extra-questions"></div>';
			}

			if ( $departure_loc_type ) {
				echo '<span class="departure-separetor"></span>';
//				echo '<h6>' . esc_html__('Departure details', 'viator') . '</h6>';

				$options = [];
				foreach ( $departure_loc_type as $key => $item ) {
					$options[ $key ] = $item;
				}

				woocommerce_form_field( 'extraBookingQuestions[TRANSFER_DEPARTURE_MODE]', array(
					'type'        => 'select',
					'class'       => array( 'my-field-class form-row-wide' ),
					'id'          => 'field_transfer_departure_mode',
					'label_class' => array( 'h6' ),
					'label'       => esc_html__( 'Departure details', 'viator' ),
					'required'    => true,
					'options'     => $options,
				), '' );

				echo '<div class="departure-extra-questions"></div>';
			}


//			if ( $arrival_loc_type ):
//				echo '<h6>' . esc_html__( 'Pickup details', 'viator' ) . '</h6>';
//				echo '<p>' . esc_html__( 'The provider offers pickup from select locations.', 'viator' ) . '</p>';
//				$arrival_loc_first = 1;
//				?>
			<!--				<p class="form-row form-row-wide validate-required" id="transfer_arrival_mode">-->
			<!--					<span class="woocommerce-input-wrapper">-->
			<!--						<select name="extraBookingQuestions[TRANSFER_ARRIVAL_MODE]" id="field_transfer_arrival_mode" autocomplete="off">-->
			<!--							--><?php //foreach ( $arrival_loc_type as $key => $item ) : ?>
			<!--								<option --><?php //echo $arrival_loc_first === 1 ? 'selected' : ''; ?><!-- value="--><?php //echo $key; ?><!--">--><?php //echo $item; ?><!--</option>-->
			<!--								--><?php //$arrival_loc_first ++;
//							endforeach; ?>
			<!--						</select>-->
			<!--					</span>-->
			<!--				</p>-->
			<!---->
			<!--				<div class="show_viator_location"></div>-->
			<!--				<div class="arrival-extra-questions"></div>-->
			<!--			--><?php //endif; ?>

			<?php
//			if ( $departure_loc_type ):
//				echo '<span class="departure-separetor"></span>';
//				echo '<h6>' . esc_html__( 'Departure details', 'viator' ) . '</h6>';
//				$departure_type_first = 1;
//				?>
			<!--				<p class="form-row form-row-wide validate-required">-->
			<!--					<span class="woocommerce-input-wrapper">-->
			<!--						<select name="extraBookingQuestions[TRANSFER_DEPARTURE_MODE]" id="field_transfer_departure_mode" autocomplete="off">-->
			<!--							--><?php //foreach ( $departure_loc_type as $key => $item ) : ?>
			<!--								<option --><?php //echo $departure_type_first === 1 ? 'selected' : ''; ?><!-- value="--><?php //echo $key; ?><!--">--><?php //echo $item; ?><!--</option>-->
			<!--								--><?php //$departure_type_first ++;
//							endforeach; ?>
			<!--						</select>-->
			<!--					</span>-->
			<!--				</p>-->
			<!---->
			<!--				<div class="departure-extra-questions"></div>-->
			<!--			--><?php //endif; ?>


			<script>
				document.addEventListener("DOMContentLoaded", function() {

							function findClosestParentByTagName(elem, tagName) {
    while (elem) {
        if (elem.tagName.toLowerCase() === tagName.toLowerCase()) {
            return elem;
        }
        elem = elem.parentElement;
    }
    return null;
}

// Get the input elements by their IDs
const firstNameInput = document.getElementById('travelers_1_FULL_NAMES_FIRST');
const lastNameInput = document.getElementById('travelers_1_FULL_NAMES_LAST');
// Find the closest <p> ancestor
const firstNameParent = findClosestParentByTagName(firstNameInput, 'p');
const lastNameParent = findClosestParentByTagName(lastNameInput, 'p');
					
const divWrapper = findClosestParentByTagName(firstNameInput, 'div');

// Remove the entire <p> element
if (firstNameParent) firstNameParent.remove();
if (lastNameParent) lastNameParent.remove();
					
if (divWrapper && divWrapper.children.length === 1 && divWrapper.children[0].tagName.toLowerCase() === 'h6') {
    divWrapper.children[0].remove();
}


});

				
				var arrivalQuestions = <?php echo wp_json_encode( $arrival_ques );?>,
					departureQuestions = <?php echo wp_json_encode( $departure_ques );?>,
					checkoutLocation = {
						airport: <?php echo wp_json_encode( $all_location['airport'] );?>,
						hotel: <?php echo wp_json_encode( $all_location['hotel'] );?>,
						port: <?php echo wp_json_encode( $all_location['port'] );?>,
						location: <?php echo wp_json_encode( $all_location['location'] );?>,
					};
			let removedElements = [];

function getParentContainer() {
    return document.querySelector('.woocommerce-additional-fields');
}

function isInsideBillingFields(element) {
    return !!element.closest('.woocommerce-billing-fields__field-wrapper');
}

function removeElementsByKeyword(keywords) {
    const parentContainer = getParentContainer();
    const elements = parentContainer.querySelectorAll('.woocommerce-input-wrapper');
    elements.forEach(element => {
        if (isInsideBillingFields(element)) return; // Skip elements inside billing fields

        let shouldRemove = true;
        for (let keyword of keywords) {
            if (element.innerHTML.includes(keyword)) {
                shouldRemove = false;
                break;
            }
        }
        if (shouldRemove) {
            // Remove associated label
            const input = element.querySelector('input');
            if (input) {
                const label = parentContainer.querySelector(`label[for="${input.id}"]`);
                if (label) {
                    removedElements.push({element: label, parent: label.parentNode});
                    label.parentNode.removeChild(label);
                }
            }
            removedElements.push({element: element, parent: element.parentNode});
            element.parentNode.removeChild(element);
        }
    });
}

function removeElementByID(elementID) {
    const parentContainer = getParentContainer();
    const element = parentContainer.querySelector(`#${elementID}`);
    if (element && !isInsideBillingFields(element)) {
        // Remove associated label
        const label = parentContainer.querySelector(`label[for="${elementID}"]`);
        if (label) {
            removedElements.push({element: label, parent: label.parentNode});
            label.parentNode.removeChild(label);
        }
        removedElements.push({element: element, parent: element.parentNode});
        element.parentNode.removeChild(element);
    }
}

function restoreElements() {
    while (removedElements.length) {
        const {element, parent} = removedElements.pop();
        parent.appendChild(element);
    }
}

function removeElementByClass(elementClass) {
    const parentContainer = getParentContainer();
    const elements = parentContainer.querySelectorAll(`.${elementClass}`);
    elements.forEach(element => {
        if (isInsideBillingFields(element)) return; // Skip elements inside billing fields

        // Remove associated label if the element is an input
        if (element.tagName === 'INPUT') {
            const label = parentContainer.querySelector(`label[for="${element.id}"]`);
            if (label) {
                removedElements.push({element: label, parent: label.parentNode});
                label.parentNode.removeChild(label);
            }
        }
        removedElements.push({element: element, parent: element.parentNode});
        element.parentNode.removeChild(element);
    });
}

function handleChange(event) {
    restoreElements();
    const value = event.target.value;

    switch(value) {
        case 'OTHER':
            removeElementsByKeyword(['TRAIN', 'SHIP', 'RAIL', 'PORT', 'SEA', 'AIR', 'AIRPLANE']);
            removeElementByID('field_transfer_departure_mode_field');
            removeElementByClass('departure-extra-questions');
            break;
        case 'PORT':
            removeElementsByKeyword(['TRAIN', 'HOTEL', 'AIR', 'AIRPLANE']);
            break;
        case 'RAIL':
            removeElementsByKeyword(['SHIP', 'HOTEL', 'AIR', 'AIRPLANE', 'SEA', 'PORT']);
            break;
        case 'AIR':
            removeElementsByKeyword(['TRAIN', 'SHIP', 'HOTEL', 'RAIL', 'PORT', 'SEA']);
            break;
        default: 
            restoreElements();
            break;
    }
}

document.getElementById('field_transfer_arrival_mode').addEventListener('change', handleChange);


			</script>
			<?php
		}

		if ( $lan_guides = get_post_meta( $product_id, '_languageGuides', true ) ):

			?>
			<div class="form-row form-row-wide validate-required">


				<?php


				$optionCode = ! empty( $optionCode ) ? $optionCode : 'option1';
				if ( count( $lan_guides[ $optionCode ] ) > 1 )  :

					$options = [];
					foreach ( $lan_guides[ $optionCode ] as $lan ) {
						$name = $this->get_name_language( $lan['language'], pll_current_language() );

						$types = array(
							'guide'   => esc_html__( 'Guide in', 'viator' ),
							'written' => esc_html__( 'Written in', 'viator' ),
							'audio'   => esc_html__( 'Audio in', 'viator' )
						);

						$options[ $lan['language'] . '|' . $lan['type'] . '|' . $lan['legacyGuide'] ] = $types[ strtolower( $lan['type'] ) ] . ' ' . $name;
					}

					woocommerce_form_field( 'language_guide', array(
						'type'        => 'select',
						'class'       => array( '' ),
						'label_class' => array( 'h6' ),
						'label'       => esc_html__( 'Tour/Activity Language', 'viator' ),
						'required'    => true,
						'options'     => $options,
					), '' );
				else : ?>
					<b><?php esc_html_e( 'Tour/Activity Language', 'viator' ); ?>:</b>
					<span><?php echo $this->get_name_language( $lan_guides[ $optionCode ][0]['language'],
							pll_current_language() ); ?></span>
					<input type="hidden" name="language_guide" value="<?php echo $lan_guides[ $optionCode ][0]['language'] . '|' . $lan_guides[ $optionCode ][0]['type'] . '|' . $lan_guides[ $optionCode ][0]['legacyGuide']; ?>">
				<?php endif; ?>
			</div>
		<?php endif; ?>
		<p class="form-row checkout-date-tour">
			<b><?php esc_html_e( 'Date tour', 'viator' ); ?>: </b>
			<span>
				<?php
				$date = strtotime( get_post_meta( $product_id, '_travel_date', true ) );
				echo date( 'd/m/Y', $date );
				?>
			</span>
			<span> | <?php echo get_post_meta( $product_id, '_startTime', true ); ?></span>
		</p>
		<input type="hidden" name="type_product" value="<?php echo $type_product ?>">
		<input type="hidden" name="cart_hash" value="<?php echo $_COOKIE['user_custom_hash'] ?>">

		<?php
	}


	public function modify_document_title( $title ) {
		global $wp_query;

		if ( isset( $wp_query->query_vars['product'], $wp_query->query_vars['post_type'] ) && $wp_query->query_vars['post_type'] === 'product' ) {
			return str_replace( '-', ' ', $wp_query->query_vars['product'] );
		}

		if ( isset( $wp_query->query_vars['product_cat'], $wp_query->query_vars['taxonomy'] ) && $wp_query->query_vars['taxonomy'] === 'product_cat' ) {
			return ucfirst( $wp_query->query_vars['product_cat'] );
		}

		return $title;
	}

	public function custom_own_load_page() {
		wp();


		if ( get_query_var( 'voucher_id' ) ) {
			load_template( wp_normalize_path( dirname( __DIR__ ) . '/templates/voucher-embed.php' ) );
			exit;
		}
	}

	public function init_narrative_rewrite() {
		$product_base  = 'product';
		$category_base = 'product-category';

		if ( $woo_permalinks = get_option( 'woocommerce_permalinks' ) ) {
			if ( $woo_permalinks['product_base'][0] === '/' ) {
				$product_base = explode( '/', $woo_permalinks['product_base'] )[1];
			} else {
				$product_base = explode( '/', $woo_permalinks['product_base'] )[0];
			}

			if ( isset( $woo_permalinks['category_base'] ) && ! empty( $woo_permalinks['category_base'] ) ) {
				$category_base = $woo_permalinks['category_base'];
			}
		}

		add_rewrite_rule(
			'^(voucher)/([^/]*)/?$',
			'index.php?product_cat=$matches[1]&voucher_id=$matches[2]',
			'top' );

		add_rewrite_rule(
			'^' . $category_base . '/([^/]*)/([^/]*)/?$',
			'index.php?product_cat=$matches[1]&paged=$matches[2]',
			'top'
		);

		add_rewrite_rule(
			'^' . $product_base . '/([^/]*)/([^/]*)/([^/]*)/?$',
			'index.php?post_type=product&destination=$matches[1]&product=$matches[2]&product_code=$matches[3]',
			'top'
		);
	}

	public function filter_query_vars( $vars ) {
		$vars[] = 'voucher_id';
		$vars[] = 'product_cat';
		$vars[] = 'post_type';
		$vars[] = 'destination';
		$vars[] = 'product';
		$vars[] = 'product_code';

		return $vars;
	}

	public function product_template_redirect() {
		global $wp_query;

		if ( isset( $wp_query->query_vars['product_code'], $wp_query->query_vars['post_type'] ) && $wp_query->query_vars['post_type'] === 'product' ) {
			$wp_query->is_single = $wp_query->is_singular = true;
			$wp_query->request   = '';

			$post                     = (object) array(
				'ID'          => '',
				'post_author' => '1',
				'post_title'  => str_replace( '-', ' ', $wp_query->query_vars['product'] ),
				'post_status' => 'publish',
				'post_name'   => $wp_query->query_vars['product'],
				'post_type'   => 'product',
			);
			$wp_query->queried_object = new \WP_Post( $post );
			//include get_parent_theme_file_path() . '/woocommerce/single-product.php';
			//exit();
		}

		if ( isset( $wp_query->query_vars['product_cat'], $wp_query->query_vars['taxonomy'] ) && $wp_query->query_vars['taxonomy'] === 'product_cat' ) {
			$wp_query->is_archive = true;

			$wp_query->request = '';

			$term                     = (object) array(
				'term_id'          => '',
				'name'             => ucfirst( $wp_query->query_vars['product_cat'] ),
				'slug'             => $wp_query->query_vars['product_cat'],
				'term_group'       => '',
				'term_taxonomy_id' => '',
				'taxonomy'         => 'product_cat',
			);
			$wp_query->queried_object = new \WP_Term( $term );

			include get_parent_theme_file_path() . '/woocommerce/archive-product.php';
			exit();
		}
	}

	public function add_templates() { ?>
		<?php if ( is_single() ): ?>
			<!-- Template for single.php -->
			<script type="text/html" id="tmpl-singleCover">
				<div class="excursion__image">
					<img src="{{{data.src}}}" alt="{{{data.alt}}}">
				</div>
			</script>

			<script type="text/html" id="tmpl-productSlider">
				<div class="excursion__slider-main">
					<# _.mapObject( data.images, function(img) { #>
					<div class="excursion__slider-main-img">
						<img alt="{{img.alt}}" src="{{img.src}}">
					</div>
					<# }); #>
				</div>

				<div class="excursion__slider-second">
					<div class="excursion__slider-nav">
						<# _.mapObject( _.shuffle(data.images), function(img) { #>
						<div class="excursion__slider-nav-img">
							<img alt="{{img.alt}}" src="{{img.src}}">
						</div>
						<# }); #>
					</div>

					<div class="excursion__slider-arrows"></div>
				</div>
			</script>

			<script type="text/html" id="tmpl-singleTags">
				<div class="d-flex tags">
					<# _.mapObject( data.tags, function(tag) { #>
					<div class="tags__item" title="{{tag}}">{{tag}}</div>
					<# }); #>
				</div>
			</script>

			<script type="text/html" id="tmpl-singleTitle">
				<h2 class="excursion__title">{{data.title}}</h2>
			</script>

			<script type="text/html" id="tmpl-singlePriceBox">
				<div class="faq__item-price d-none border border-primary rounded mb-3 {{data.active}}" id="faq__item-{{data.optionid}}" data-optionid="{{data.optionid}}">
					<div class="col-12 col-md-8 col-lg-12 col-xl-8 faq__item-price-wrap">
						<span class="faq__item-price-label shadow-sm rounded"><?php esc_html_e( 'Option', 'viator' ); ?> {{data.num}}</span>
						<span class="faq__item-price-label shadow-sm rounded label-unavailable"><?php esc_html_e( 'Unavailable',
								'viator' ); ?></span>
						<span class="faq__item-price-title">{{data.title}}</span>

						<div class="faq__item-price-desc">
							<p>{{{data.text}}}</p>

							<div class="faq__item-price-time-wrap">{{{data.time}}}</div>
						</div>
					</div>

					<div class="col-12 col-md-4 col-lg-12 col-xl-4 faq__item-price-wrap faq__item-border-left border-primary d-flex flex-column justify-content-between align-items-end">
						<div class="text-right mb-3">
							<div class="faq__item-price-total" data-price-usd="{{data.total_usd}}" data-price="{{data.total}}">
								{{data.targetCurrency}}
								{{data.total}}
							</div>

							<div class="faq__item-price-breakdown">
								{{{data.price_list}}}
							</div>
						</div>

						<!--						<div class="faq__item-price-btn">-->
						<!--							<button type="button" class="viator-book-reserve btn btn-block btn-outline-info">Reserve Now-->
						<!--								& Pay Later-->
						<!--							</button>-->
						<!--						</div>-->
					</div>
				</div>
			</script>

			<script type="text/html" id="tmpl-ageBands">
				<p><?php esc_html_e( 'You can select up to', 'viator' ); ?>
					<span>{{data.maxTravelers}}</span> <?php esc_html_e( 'travelers in total', 'viator' ); ?>.</p>

				<div class="aside-date__bands" data-allCount="{{data.defaultCount}}">
					<# _.mapObject( data.ageBands, function(ageBand) { #>
					<div class="row aside-date__bands-item">
						<div class="col-7 aside-date__bands-info">
							<p data-name="{{ageBand.name}}">{{ageBand.txt}}</p>

							<# if ( ageBand.min ) { #>
							<span><?php esc_html_e( 'Minimum', 'viator' ); ?>: {{ageBand.min}}</span>
							<# } #>

							<# if ( ageBand.max ) { #>
							<span><?php esc_html_e( 'Maximum', 'viator' ); ?>: {{ageBand.max}}</span>
							<# } #>
						</div>

						<div class="col-5 d-flex align-items-center">
							<div class="aside-date__bands-btn-group">
								<button type="button" class="btn btn-outline-primary btn-decrement"
								<# if ( ageBand.min ) { #> data-min="{{ageBand.min}}" <# } #>
								<# if ( ! ageBand.type ) { #> disabled <# } #>
								>-</button>
								<span>
									<# if ( ageBand.type ) { #>
									{{data.defaultCount}}
									<# } else { #>
									0
									<# } #>
								</span>
								<button type="button" class="btn btn-outline-primary btn-increment"
								<# if ( ageBand.max ) { #> data-max="{{ageBand.max}}" <# } #>
								>+</button>
							</div>
						</div>
					</div>
					<# }); #>
				</div>
				<!--				<button class="btn btn-outline-info btn-block btn-ageBands-apply">--><?php //esc_html_e( 'Apply',
				//						'viator' ); ?><!--</button>-->
			</script>

		<?php endif; ?>

		<?php if ( is_checkout() ): ?>
			<script type="text/html" id="tmpl-checkoutSelectLocation">
				<p class="form-row form-row-wide validate-required" id="field_locations">
					<span class="woocommerce-input-wrapper">
						<select name="extraBookingQuestions[location_item]" autocomplete="off">
							<# _.mapObject( data, function(loc, key) { #>
								<# if ( loc.name ) { #>
								<option value="{{key}}">{{loc.name}}</option>
								<# } else { #>
								<option value="{{key}}">{{key}}</option>
								<# } #>

							<# }); #>
						</select>
					</span>
				</p>
			</script>

			<script type="text/html" id="tmpl-transferExtraFields">
				<# _.mapObject( data, function(dep, key) { #>
				<p class="form-row form-row-wide validate-required">
					<label for="{{dep.id}}">
						{{dep.label}} <abbr class="required" title="required">*</abbr>
					</label>

					<span class="woocommerce-input-wrapper">
						<input type="text" class="input-text" required="required" name="extraBookingQuestions[{{dep.id}}]"
							   id="{{dep.id}}" placeholder="{{dep.hint}}">
					</span>
				</p>
				<# }); #>
			</script>
		<?php endif; ?>

		<?php
	}

	public function add_viator_cat() { ?>
		<div class="form-field form-required term-name-wrap">
			<label for="tag-name"><?php _ex( 'Name', 'term name' ); ?></label>
			<select class="viator-destinations" name="tag-name" id="tag-name" aria-required="true" style="width:100%" autocomplete="off">
				<option></option>
				<?php foreach (
					json_decode( get_option( '_viator_dest' ), true ) as $index => $item
				) {
					echo '<option value="' . $item['destinationName'] . '">' . $item['destinationName'] . '</option>';
				} ?>
			</select>
			<p><?php echo __( 'The name is how it appears on your site.', 'viatorCore' ); ?></p>
		</div>
		<?php
	}

	public function add_viator_tag() { ?>
		<div class="form-field form-required term-name-wrap">
			<label for="tag-name"><?php _ex( 'Name', 'term name' ); ?></label>
			<select class="viator-tags" name="tag-name" id="tag-name" aria-required="true" style="width:100%" autocomplete="off">
				<option></option>
				<option value="Free cancellation"><?php esc_html_e( 'Free cancellation', 'viator' ); ?></option>
				<option value="Skip the line"><?php esc_html_e( 'Skip the line', 'viator' ); ?></option>
				<option value="Private tour"><?php esc_html_e( 'Private tour', 'viator' ); ?></option>
				<option value="Special offer"><?php esc_html_e( 'Special offer', 'viator' ); ?></option>
				<?php foreach (
					json_decode( get_option( '_viator_tags' ), true, 512, JSON_THROW_ON_ERROR )['tags'] as $item
				) {
					echo '<option value="' . $item['allNamesByLocale']['en'] . '">' . $item['allNamesByLocale']['en'] . '</option>';
				} ?>
			</select>
			<p><?php echo __( 'The name is how it appears on your site.', 'viator' ); ?></p>
		</div>
		<?php
	}

	public function change_body_class( $classes ) {
		if ( is_product() ) {
			foreach ( $classes as $index => $class ) {
				if ( 'error404' === $class ) {
					unset( $classes[ $index ] );
					break;
				}
			}
			$classes[] = get_the_ID();
		}

		return $classes;
	}

	public function insert_term_destination( $duplicate_term, $term, $taxonomy, $args, $tt_id ) {
		if ( $taxonomy === 'product_cat' ) {
			foreach ( json_decode( get_option( '_viator_dest' ), true ) as $item ) {
				if ( $item['destinationName'] === $args['tag-name'] ) {
					update_term_meta( $tt_id, 'destinationId', $item['destinationId'] );
					break;
				}
			}
		}

		return $duplicate_term;
	}

	public function update_term_destination( $data, $term_id, $taxonomy, $args ) {
		if ( $taxonomy === 'product_cat' ) {
			foreach ( json_decode( get_option( '_viator_dest' ), true ) as $item ) {
				if ( $item['destinationName'] === $args['name'] ) {
					update_term_meta( $term_id, 'destinationId', $item['destinationId'] );
					break;
				}
			}
		}

		return $data;
	}

	public function add_product_tab() { ?>
		<li class="viator_options viator_tab">
			<a href="#viatorFields"><span><?php esc_html_e( 'Custom Fields', 'viator' ); ?></span></a>
		</li>
		<?php
	}

	public function add_product_options_groups() {
		global $thepostid;
		?>
		<div id="viatorFields" class="panel woocommerce_options_panel options_group-viator" style="display: none;">

			<div class="options_group">
				<?php
				echo '<div class="product_custom_field ">';
				woocommerce_wp_checkbox(
					array(
						'id'    => '_custom_field_mob_ticket',
						'label' => __( 'Mobile ticket', 'viatorCore' ),
					)
				);
				echo '</div>';

				echo '<div class="product_custom_field ">';
				woocommerce_wp_text_input(
					array(
						'id'                => '_custom_field_duration',
						'placeholder'       => __( 'Enter minutes', 'viator' ),
						'label'             => __( 'Duration all', 'viator' ),
						'type'              => 'number',
						'custom_attributes' => array(
							'step'     => '1',
							'min'      => '0',
							'required' => 'required',
						),
					)
				);
				echo '</div>';

				echo '<div class="product_custom_field ">';
				woocommerce_wp_select(
					array(
						'id'          => '_custom_field_pickup',
						'value'       => get_post_meta( $thepostid, '_custom_field_pickup', true ) ?: '',
						'label'       => __( 'Pickup', 'viatorCore' ),
						'options'     => array(
							'MEET_EVERYONE_AT_START_POINT'   => _x( 'None', 'Tax status', 'viatorCore' ),
							'PICKUP_AND_MEET_AT_START_POINT' => __( 'Offered', 'viatorCore' ),
							'PICKUP_EVERYONE'                => __( 'Hotel offered', 'viatorCore' ),
						),
						'desc_tip'    => 'true',
						'description' => __( 'Determine how travelers will get to their destination.', 'viatorCore' ),
					)
				);
				echo '</div>';
				?>
			</div>

			<div class="options_group options_group_row">

				<div class="options_group_col">
					<p class="options_group_title"><?php esc_html_e( "What's Included", 'viator' ); ?></p>

					<div class="options_group_fields" data-name="included">
						<?php if ( $included = get_post_meta( $thepostid, '_custom_field_included', true ) ) {
							foreach ( $included as $i => $item ) {
								$num = $i + 1;
								echo '<div class="product_custom_field">';
								woocommerce_wp_text_input(
									array(
										'id'          => '_custom_field_included',
										'name'        => '_custom_field_included[]',
										'placeholder' => __( 'Enter text', 'viatorCore' ),
										'label'       => __( 'Field ' . $num, 'viatorCore' ),
										'type'        => 'text',
										'class'       => 'field_included',
										'value'       => $item,
									)
								);
								echo '<button class="button button-cancel" type="button">x</button></div>';
							}

						} else {
							echo '<div class="product_custom_field">';
							woocommerce_wp_text_input(
								array(
									'id'                => '_custom_field_included',
									'name'              => '_custom_field_included[]',
									'placeholder'       => 'Enter text',
									'label'             => __( 'Field 1', 'viatorCore' ),
									'type'              => 'text',
									'class'             => 'field_included',
									'custom_attributes' => array(
										'required' => 'required',
									),
								)
							);
							echo '<button class="button button-cancel" type="button">x</button></div>';
						} ?>
					</div>

					<button class="button button-primary button-add add-included" type="button"><?php esc_html_e( "Add filed",
							'viator' ); ?></button>
				</div>

				<div class="options_group_col">
					<p class="options_group_title"><?php esc_html_e( "What's Excluded", 'viator' ); ?></p>

					<div class="options_group_fields" data-name="excluded">
						<?php if ( $excluded = get_post_meta( $thepostid, '_custom_field_excluded', true ) ) {
							foreach ( $excluded as $i => $item ) {
								$num = $i + 1;
								echo '<div class="product_custom_field">';
								woocommerce_wp_text_input(
									array(
										'id'          => '_custom_field_excluded',
										'name'        => '_custom_field_excluded[]',
										'placeholder' => 'Enter text',
										'label'       => __( 'Field ' . $num, 'viatorCore' ),
										'type'        => 'text',
										'class'       => 'field_excluded',
										'value'       => $item,
									)
								);
								echo '<button class="button button-cancel" type="button">x</button></div>';
							}

						} else {
							echo '<div class="product_custom_field">';
							woocommerce_wp_text_input(
								array(
									'id'                => '_custom_field_excluded',
									'name'              => '_custom_field_excluded[]',
									'placeholder'       => 'Enter text',
									'label'             => __( 'Field 1', 'viatorCore' ),
									'type'              => 'text',
									'class'             => 'field_excluded',
									'custom_attributes' => array(
										'required' => 'required',
									),
								)
							);
							echo '<button class="button button-cancel" type="button">x</button></div>';
						} ?>
					</div>

					<button class="button button-primary button-add add-excluded" type="button">Add filed</button>
				</div>

			</div>

			<div class="options_group">
				<p class="options_group_title"><?php esc_html_e( "Additional Info", 'viatorCore' ); ?></p>

				<div class="options_group_fields" data-name="additionalInfo">
					<?php if ( $additionalInfo = get_post_meta( $thepostid, '_custom_field_additionalInfo', true ) ) {
						foreach ( $additionalInfo as $i => $item ) {
							$num = $i + 1;
							echo '<div class="product_custom_field">';
							woocommerce_wp_text_input(
								array(
									'id'          => '_custom_field_additionalInfo',
									'name'        => '_custom_field_additionalInfo[]',
									'placeholder' => __( 'Enter text ', 'viatorCore' ),
									'label'       => __( 'Field ' . $num, 'viatorCore' ),
									'type'        => 'text',
									'class'       => 'field_$additionalInfo',
									'value'       => $item,
								)
							);
							echo '<button class="button button-cancel" type="button">x</button></div>';
						}

					} else {
						echo '<div class="product_custom_field">';
						woocommerce_wp_text_input(
							array(
								'id'          => '_custom_field_additionalInfo',
								'name'        => '_custom_field_additionalInfo[]',
								'placeholder' => 'Enter text',
								'label'       => __( 'Field 1', 'viatorCore' ),
								'type'        => 'text',
								'class'       => 'field_$additionalInfo',
							)
						);
						echo '<button class="button button-cancel" type="button">x</button></div>';
					} ?>
				</div>

				<button class="button button-primary button-add" type="button">Add filed</button>
			</div>

			<div class="options_group">
				<p class="options_group_title">Cancellations</p>

				<div class="options_group_fields" data-name="cancellations">
					<?php if ( $cancellations = get_post_meta( $thepostid, '_custom_field_cancellations', true ) ) {
						foreach ( $cancellations as $i => $item ) {
							$num = $i + 1;
							echo '<div class="product_custom_field">';
							woocommerce_wp_text_input(
								array(
									'id'          => '_custom_field_cancellations',
									'name'        => '_custom_field_cancellations[]',
									'placeholder' => 'Enter text',
									'label'       => __( 'Field ' . $num, 'viatorCore' ),
									'type'        => 'text',
									'class'       => 'field_$cancellations',
									'value'       => $item,
								)
							);
							echo '<button class="button button-cancel" type="button">x</button></div>';
						}

					} else {
						echo '<div class="product_custom_field">';
						woocommerce_wp_text_input(
							array(
								'id'          => '_custom_field_cancellations',
								'name'        => '_custom_field_cancellations[]',
								'placeholder' => 'Enter text',
								'label'       => __( 'Field 1', 'viatorCore' ),
								'type'        => 'text',
								'class'       => 'field_$cancellations',
							)
						);
						echo '<button class="button button-cancel" type="button">x</button></div>';
					} ?>
				</div>

				<button class="button button-primary button-add" type="button">Add filed</button>
			</div>

			<div class="options_group">
				<p class="options_group_title">Meeting Point</p>
			</div>

			<div class="options_group">
				<p class="options_group_title">Schedules</p>

				<?php woocommerce_wp_textarea_input(
					array(
						'id'            => "_custom_field_noteTime",
						'value'         => get_post_meta( $thepostid, '_custom_field_noteTime', true ) ?: '',
						'label'         => __( 'Pickup Time', 'viatorCore' ),
						'class'         => 'product-field-textarea',
						'desc_tip'      => true,
						'description'   => __( 'Enter an optional description for this variation.', 'viatorCore' ),
						'wrapper_class' => 'form-row form-row-full',
					)
				);
				woocommerce_wp_textarea_input(
					array(
						'id'            => "_custom_field_note",
						'value'         => get_post_meta( $thepostid, '_custom_field_note', true ) ?: '',
						'label'         => __( 'Note', 'viatorCore' ),
						'class'         => 'product-field-textarea',
						'desc_tip'      => true,
						'description'   => __( 'Enter an optional description for this variation.', 'viatorCore' ),
						'wrapper_class' => 'form-row form-row-full',
					)
				); ?>

				<p class="options_group_subtitle">Itinerary</p>
				<div class="options_group-itinerary">
					<div class="options_group_fields" data-name="itinerary">
						<?php if ( $itinerary = get_post_meta( $thepostid, '_custom_field_itinerary', true ) ) {
							$num = 0;
							foreach ( $itinerary as $item ) {
								echo '<div class="product_custom_field product_custom_field-row" data-name="itinerary">';
								woocommerce_wp_text_input(
									array(
										'id'          => '_custom_field_itinerary_name' . $num,
										'name'        => '_custom_field_itinerary[item' . $num . '][name]',
										'value'       => $item['name'],
										'placeholder' => 'Enter name',
										'label'       => __( 'Name', 'viatorCore' ),
										'type'        => 'text',
										'class'       => 'field_itinerary',
									)
								);

								woocommerce_wp_text_input(
									array(
										'id'                => '_custom_field_itinerary_duration' . $num,
										'name'              => '_custom_field_itinerary[item' . $num . '][duration]',
										'value'             => $item['duration'],
										'placeholder'       => 'Enter duration',
										'label'             => __( 'Duration', 'viatorCore' ),
										'type'              => 'number',
										'class'             => 'field_itinerary',
										'custom_attributes' => array(
											'step' => '1',
											'min'  => '0',
										),
									)
								);
								echo '<button class="button button-cancel" type="button">x</button>';
								woocommerce_wp_textarea_input(
									array(
										'id'            => '_custom_field_itinerary_txt' . $num,
										'name'          => '_custom_field_itinerary[item' . $num . '][txt]',
										'value'         => $item['txt'],
										'label'         => __( 'Place Description', 'viatorCore' ),
										'class'         => 'product-field-textarea field_itinerary',
										'desc_tip'      => true,
										'description'   => __( 'Enter an optional description for this variation.',
											'viatorCore' ),
										'wrapper_class' => 'form-row form-row-full',
									)
								);
								echo '</div>';
								++ $num;
							}

						} else {
							echo '<div class="product_custom_field product_custom_field-row" data-name="itinerary">';
							woocommerce_wp_text_input(
								array(
									'id'                => '_custom_field_itinerary_name0',
									'name'              => '_custom_field_itinerary[item][name]',
									'placeholder'       => 'Enter name',
									'label'             => __( 'Name', 'viatorCore' ),
									'type'              => 'text',
									'class'             => 'field_itinerary',
									'custom_attributes' => array(
										'required' => 'required',
									),
								)
							);

							woocommerce_wp_text_input(
								array(
									'id'                => '_custom_field_itinerary_duration0',
									'name'              => '_custom_field_itinerary[item][duration]',
									'placeholder'       => 'Enter duration',
									'label'             => __( 'Duration', 'viatorCore' ),
									'type'              => 'number',
									'class'             => 'field_itinerary',
									'custom_attributes' => array(
										'step' => '1',
										'min'  => '0',
									),
								)
							);
							echo '<button class="button button-cancel" type="button">x</button>';
							woocommerce_wp_textarea_input(
								array(
									'id'                => "_custom_field_itinerary_txt0",
									'name'              => '_custom_field_itinerary[item][txt]',
									'label'             => __( 'Place Description', 'viatorCore' ),
									'class'             => 'product-field-textarea field_itinerary',
									'desc_tip'          => true,
									'description'       => __( 'Enter an optional description for this variation.',
										'viatorCore' ),
									'wrapper_class'     => 'form-row form-row-full',
									'custom_attributes' => array(
										'required' => 'required',
									),
								)
							);
							echo '</div>';
						} ?>
					</div>

					<button class="button button-primary button-add" type="button">Add filed</button>
				</div>
			</div>

			<div class="options_group">
				<p class="options_group_title">Available dates & Product options</p>

				<div class="options_group_fields" data-name="options">
					<?php if ( $product_options = get_post_meta( $thepostid, '_custom_field_options', true ) ) {
						$num = 0;
						foreach ( $product_options as $item ) {
							echo '<div class="product_custom_field product_custom_field-row product_custom_field-available">';
							woocommerce_wp_text_input(
								array(
									'id'                => '_custom_field_options_id' . $num,
									'name'              => '_custom_field_options[item' . $num . '][id]',
									'placeholder'       => __( 'Enter code', 'viatorCore' ),
									'label'             => __( 'Option code', 'viatorCore' ),
									'type'              => 'text',
									'class'             => 'field_options',
									'value'             => $item['id'],
									'custom_attributes' => array(
										'required' => 'required',
									),
								)
							);
							echo '<button class="button button-cancel" type="button">x</button>';
							woocommerce_wp_text_input(
								array(
									'id'                => '_custom_field_options_title' . $num,
									'name'              => '_custom_field_options[item' . $num . '][title]',
									'placeholder'       => __( 'Enter title', 'viatorCore' ),
									'label'             => __( 'Title', 'viatorCore' ),
									'type'              => 'text',
									'class'             => 'field_options',
									'value'             => $item['title'],
									'custom_attributes' => array(
										'required' => 'required',
									),
								)
							);
							woocommerce_wp_textarea_input(
								array(
									'id'                => '_custom_field_options_txt' . $num,
									'name'              => '_custom_field_options[item' . $num . '][txt]',
									'label'             => __( 'Option description', 'viatorCore' ),
									'class'             => 'product-field-textarea field_options',
									'placeholder'       => __( 'Enter an optional description.', 'viatorCore' ),
									'wrapper_class'     => 'form-row form-row-full',
									'value'             => $item['txt'],
									'custom_attributes' => array(
										'required' => 'required',
									),
								)
							);
							woocommerce_wp_text_input(
								array(
									'id'                => '_custom_field_options_start_date' . $num,
									'name'              => '_custom_field_options[item' . $num . '][start_date]',
									'label'             => __( 'Start date', 'viatorCore' ),
									'type'              => 'date',
									'class'             => 'field_options',
									'wrapper_class'     => 'field-half',
									'value'             => $item['start_date'],
									'custom_attributes' => array(
										'required' => 'required',
									),
								)
							);
							woocommerce_wp_text_input(
								array(
									'id'                => '_custom_field_options_end_date' . $num,
									'name'              => '_custom_field_options[item' . $num . '][end_date]',
									'label'             => __( 'End date', 'viatorCore' ),
									'type'              => 'date',
									'class'             => 'field_options',
									'wrapper_class'     => 'field-half',
									'value'             => $item['end_date'],
									'custom_attributes' => array(
										'required' => 'required',
									),
								)
							);
							woocommerce_wp_textarea_input(
								array(
									'id'            => '_custom_field_options_excluded_dates' . $num,
									'name'          => '_custom_field_options[item' . $num . '][excluded_dates]',
									'label'         => __( 'Excluded dates', 'viatorCore' ),
									'class'         => 'product-field-textarea field_options',
									'desc_tip'      => true,
									'description'   => __( 'Enter an Excluded dates', 'viatorCore' ),
									'wrapper_class' => 'form-row form-row-full',
									'value'         => $item['excluded_dates'],
								)
							);
							echo '<div class="field-available-prices">';
							echo '<p class="field-available-title">Price</p>';
							woocommerce_wp_text_input(
								array(
									'id'            => '_custom_field_options_price_infant' . $num,
									'name'          => '_custom_field_options[item' . $num . '][price_infant]',
									'label'         => __( 'Infant:', 'viatorCore' ),
									'placeholder'   => __( 'Enter a price for this category of people', 'viatorCore' ),
									'type'          => 'number',
									'class'         => 'field_options',
									'wrapper_class' => 'field-third',
									'value'         => $item['price_infant'],
								)
							);
							woocommerce_wp_text_input(
								array(
									'id'            => '_custom_field_options_price_child' . $num,
									'name'          => '_custom_field_options[item' . $num . '][price_child]',
									'label'         => __( 'Child:', 'viatorCore' ),
									'placeholder'   => __( 'Enter a price for this category of people', 'viatorCore' ),
									'type'          => 'number',
									'class'         => 'field_options',
									'wrapper_class' => 'field-third',
									'value'         => $item['price_child'],
								)
							);
							woocommerce_wp_text_input(
								array(
									'id'            => '_custom_field_options_price_youth' . $num,
									'name'          => '_custom_field_options[item' . $num . '][price_youth]',
									'label'         => __( 'Youth:', 'viatorCore' ),
									'placeholder'   => __( 'Enter a price for this category of people', 'viatorCore' ),
									'type'          => 'number',
									'class'         => 'field_options',
									'wrapper_class' => 'field-third',
									'value'         => $item['price_youth'],
								)
							);
							woocommerce_wp_text_input(
								array(
									'id'                => '_custom_field_options_price_adult' . $num,
									'name'              => '_custom_field_options[item' . $num . '][price_adult]',
									'label'             => __( 'Adult:', 'viatorCore' ),
									'placeholder'       => __( 'Enter a price for this category of people',
										'viatorCore' ),
									'type'              => 'number',
									'class'             => 'field_options',
									'wrapper_class'     => 'field-third',
									'value'             => $item['price_adult'],
									'custom_attributes' => array(
										'required' => 'required',
									),
								)
							);
							woocommerce_wp_text_input(
								array(
									'id'            => '_custom_field_options_price_senior' . $num,
									'name'          => '_custom_field_options[item' . $num . '][price_senior]',
									'label'         => __( 'Senior:', 'viatorCore' ),
									'placeholder'   => __( 'Enter a price for this category of people', 'viatorCore' ),
									'type'          => 'number',
									'class'         => 'field_options',
									'wrapper_class' => 'field-third',
									'value'         => $item['price_senior'],
								)
							);
							woocommerce_wp_text_input(
								array(
									'id'            => '_custom_field_options_price_traveler' . $num,
									'name'          => '_custom_field_options[item' . $num . '][price_traveler]',
									'label'         => __( 'Traveler:', 'viatorCore' ),
									'placeholder'   => __( 'Enter a price for this category of people', 'viatorCore' ),
									'type'          => 'number',
									'class'         => 'field_options',
									'wrapper_class' => 'field-third',
									'value'         => $item['price_traveler'],
								)
							);
							echo '</div>';

							++ $num;
							echo '</div>';
						}

					} else {
						echo '<div class="product_custom_field product_custom_field-row product_custom_field-available">';
						woocommerce_wp_text_input(
							array(
								'id'          => '_custom_field_options_id0',
								'name'        => '_custom_field_options[item][id]',
								'placeholder' => 'Enter code',
								'label'       => __( 'Option code', 'viatorCore' ),
								'type'        => 'text',
								'class'       => 'field_options',
							)
						);
						echo '<button class="button button-cancel" type="button">x</button>';
						woocommerce_wp_text_input(
							array(
								'id'          => '_custom_field_options_title0',
								'name'        => '_custom_field_options[item][title]',
								'placeholder' => 'Enter title',
								'label'       => __( 'Title', 'viatorCore' ),
								'type'        => 'text',
								'class'       => 'field_options',
							)
						);
						woocommerce_wp_textarea_input(
							array(
								'id'            => '_custom_field_options_txt0',
								'name'          => '_custom_field_options[item][txt]',
								'label'         => __( 'Option description', 'viatorCore' ),
								'class'         => 'product-field-textarea field_options',
								'placeholder'   => __( 'Enter an optional description.', 'viatorCore' ),
								'wrapper_class' => 'form-row form-row-full',
							)
						);
						woocommerce_wp_text_input(
							array(
								'id'            => '_custom_field_options_start_date0',
								'name'          => '_custom_field_options[item][start_date]',
								'label'         => __( 'Start date', 'viatorCore' ),
								'type'          => 'date',
								'class'         => 'field_options',
								'wrapper_class' => 'field-half',
							)
						);
						woocommerce_wp_text_input(
							array(
								'id'            => '_custom_field_options_end_date0',
								'name'          => '_custom_field_options[item][end_date]',
								'label'         => __( 'End date', 'viatorCore' ),
								'type'          => 'date',
								'class'         => 'field_options',
								'wrapper_class' => 'field-half',
							)
						);
						woocommerce_wp_textarea_input(
							array(
								'id'            => '_custom_field_options_excluded_dates0',
								'name'          => '_custom_field_options[item][excluded_dates]',
								'label'         => __( 'Excluded dates', 'viatorCore' ),
								'class'         => 'product-field-textarea field_options',
								'desc_tip'      => true,
								'description'   => __( 'Enter an Excluded dates', 'viatorCore' ),
								'wrapper_class' => 'form-row form-row-full',
							)
						);
						echo '<div class="field-available-prices">';
						echo '<p class="field-available-title">Price</p>';
						woocommerce_wp_text_input(
							array(
								'id'            => '_custom_field_options_price_infant0',
								'name'          => '_custom_field_options[item][price_infant]',
								'label'         => __( 'Infant:', 'viatorCore' ),
								'placeholder'   => __( 'Enter a price for this category of people', 'viatorCore' ),
								'type'          => 'number',
								'class'         => 'field_options',
								'wrapper_class' => 'field-third',
							)
						);
						woocommerce_wp_text_input(
							array(
								'id'            => '_custom_field_options_price_child0',
								'name'          => '_custom_field_options[item][price_child]',
								'label'         => __( 'Child:', 'viatorCore' ),
								'placeholder'   => __( 'Enter a price for this category of people', 'viatorCore' ),
								'type'          => 'number',
								'class'         => 'field_options',
								'wrapper_class' => 'field-third',
							)
						);
						woocommerce_wp_text_input(
							array(
								'id'            => '_custom_field_options_price_youth',
								'name'          => '_custom_field_options[item][price_youth]',
								'label'         => __( 'Youth:', 'viatorCore' ),
								'placeholder'   => __( 'Enter a price for this category of people', 'viatorCore' ),
								'type'          => 'number',
								'class'         => 'field_options',
								'wrapper_class' => 'field-third',
							)
						);
						woocommerce_wp_text_input(
							array(
								'id'            => '_custom_field_options_price_adult',
								'name'          => '_custom_field_options[item][price_adult]',
								'label'         => __( 'Adult:', 'viatorCore' ),
								'placeholder'   => __( 'Enter a price for this category of people', 'viatorCore' ),
								'type'          => 'number',
								'class'         => 'field_options',
								'wrapper_class' => 'field-third',
							)
						);
						woocommerce_wp_text_input(
							array(
								'id'            => '_custom_field_options_price_senior',
								'name'          => '_custom_field_options[item][price_senior]',
								'label'         => __( 'Senior:', 'viatorCore' ),
								'placeholder'   => __( 'Enter a price for this category of people', 'viatorCore' ),
								'type'          => 'number',
								'class'         => 'field_options',
								'wrapper_class' => 'field-third',
							)
						);
						woocommerce_wp_text_input(
							array(
								'id'            => '_custom_field_options_price_traveler',
								'name'          => '_custom_field_options[item][price_traveler]',
								'label'         => __( 'Traveler:', 'viatorCore' ),
								'placeholder'   => __( 'Enter a price for this category of people', 'viatorCore' ),
								'type'          => 'number',
								'class'         => 'field_options',
								'wrapper_class' => 'field-third',
							)
						);
						echo '</div>';
						echo '</div>';
					} ?>
				</div>

				<button class="button button-primary button-add" type="button">Add filed</button>
			</div>

			<div class="options_group">
				<p class="options_group_title">Age Bands</p>

				<p class="options_group_subtitle">What are the allowed people?</p>
				<div class="options_group_fields options_group_fields-bands">
					<?php
					if ( ! $ageBands = get_post_meta( $thepostid, '_custom_field_ageBands', true ) ) {
						$ageBands = array(
							'adult'    => array(
								'start_age'    => '',
								'end_age'      => '',
								'minTravelers' => '1',
								'maxTravelers' => '',
							),
							'senior'   => array(
								'start_age'    => '',
								'end_age'      => '',
								'minTravelers' => '',
								'maxTravelers' => '',
							),
							'youth'    => array(
								'start_age'    => '',
								'end_age'      => '',
								'minTravelers' => '',
								'maxTravelers' => '',
							),
							'child'    => array(
								'start_age'    => '',
								'end_age'      => '',
								'minTravelers' => '',
								'maxTravelers' => '',
							),
							'infant'   => array(
								'start_age'    => '',
								'end_age'      => '',
								'minTravelers' => '',
								'maxTravelers' => '',
							),
							'traveler' => array(
								'start_age'    => '',
								'end_age'      => '',
								'minTravelers' => '',
								'maxTravelers' => '',
							),
						);
					}

					foreach ( $ageBands as $key => $item ) {
						$label_name = 'Select ' . strtoupper( $key );

						echo '<div class="product_custom_field tset">';

						$adult_arg = array(
							'id'    => '_custom_field_ageBands[' . $key . '][on]',
							'label' => __( $label_name, 'viatorCore' ),
							'value' => $item['on'],
						);

						if ( $label_name === 'Select ADULT' ) {
							$adult_arg['custom_attributes']['required'] = 'required';
						}
						woocommerce_wp_checkbox( $adult_arg );

						woocommerce_wp_text_input(
							array(
								'id'                => '_custom_field_ageBands[' . $key . '][start_age]',
								'value'             => $item['start_age'],
								'placeholder'       => __( 'Enter age', 'viatorCore' ),
								'label'             => __( 'Start age', 'viatorCore' ),
								'type'              => 'number',
								'custom_attributes' => array(
									'min' => '1',
								),
							)
						);
						woocommerce_wp_text_input(
							array(
								'id'                => '_custom_field_ageBands[' . $key . '][end_age]',
								'value'             => $item['end_age'],
								'placeholder'       => __( 'Enter age', 'viatorCore' ),
								'label'             => __( 'End age', 'viatorCore' ),
								'type'              => 'number',
								'custom_attributes' => array(
									'min' => '1',
								),
							)
						);
						woocommerce_wp_text_input(
							array(
								'id'                => '_custom_field_ageBands[' . $key . '][minTravelers]',
								'value'             => $item['minTravelers'],
								'placeholder'       => __( 'Enter number', 'viatorCore' ),
								'label'             => __( 'Min travelers in total', 'viatorCore' ),
								'type'              => 'number',
								'custom_attributes' => array(
									'step' => '1',
									'min'  => '1',
								),
							)
						);
						woocommerce_wp_text_input(
							array(
								'id'          => '_custom_field_ageBands[' . $key . '][maxTravelers]',
								'value'       => $item['maxTravelers'],
								'placeholder' => __( 'Enter number', 'viatorCore' ),
								'label'       => __( 'Max travelers in total', 'viatorCore' ),
								'type'        => 'number',
							)
						);
						echo '</div>';
					}
					?>
				</div>
			</div>
		</div>
		<?php
	}

	public function save_custom_field_woo( $post_id ) {
		$duration        = $_POST['_custom_field_duration'] ?? '';
		$included        = $_POST['_custom_field_included'] ?? '';
		$excluded        = $_POST['_custom_field_excluded'] ?? '';
		$mob_ticket      = $_POST['_custom_field_mob_ticket'] ?? '';
		$additionalInfo  = $_POST['_custom_field_additionalInfo'] ?? '';
		$cancellations   = $_POST['_custom_field_cancellations'] ?? '';
		$pickup          = $_POST['_custom_field_pickup'] ?? '';
		$note            = $_POST['_custom_field_note'] ?? '';
		$noteTime        = $_POST['_custom_field_noteTime'] ?? '';
		$itinerary       = $_POST['_custom_field_itinerary'] ?? '';
		$product_options = $_POST['_custom_field_options'] ?? '';
		$ageBands        = $_POST['_custom_field_ageBands'] ?? '';

		if ( $product_options ) {
			$num = 0;
			foreach ( $product_options as $option ) {
				update_post_meta( $post_id, '_custom_field_start_date_' . $num,
					strtotime( $option['start_date'] ) ?: '' );
				update_post_meta( $post_id, '_custom_field_end_date_' . $num, strtotime( $option['end_date'] ) ?: '' );
				++ $num;
			}
		}

		update_post_meta( $post_id, '_custom_field_mob_ticket', $mob_ticket );
		update_post_meta( $post_id, '_custom_field_included', $included );
		update_post_meta( $post_id, '_custom_field_excluded', $excluded );
		update_post_meta( $post_id, '_custom_field_duration', $duration );
		update_post_meta( $post_id, '_custom_field_additionalInfo', $additionalInfo );
		update_post_meta( $post_id, '_custom_field_cancellations', $cancellations );
		update_post_meta( $post_id, '_custom_field_pickup', $pickup );
		update_post_meta( $post_id, '_custom_field_note', $note );
		update_post_meta( $post_id, '_custom_field_noteTime', $noteTime );
		update_post_meta( $post_id, '_custom_field_itinerary', $itinerary );
		update_post_meta( $post_id, '_custom_field_options', $product_options );
		update_post_meta( $post_id, '_custom_field_ageBands', $ageBands );

//		$product = wc_get_product($post_id);
//		$product->update_meta_data('custom_fields_test', array(3,4,5));
//		$product->update_meta_data('custom_fields_test2', array(
//			'pika'=>'waewae',
//			'pika1'=>'waewaeasdaw',
//		));
//		$product->save();

		//$this->write_log( $_POST['_custom_field_options'] );
	}

	public function woocommerce_clear_cart() {
		WC()->cart->empty_cart();
	}

	public function add_fields_email_customer( $fields, $sent_to_admin, $order ) {
		if($sent_to_admin){
			return $fields;
		}

		$order_id = $order->get_id();

		echo '<h2>' . __( 'Order details', 'viatorCore' ) . '</h2>';

		if ( $travel_date = get_post_meta( $order_id, '_travel_date', true ) ) {
			$fields['custom_field_1'] = array(
				'label' => __( 'Departure date', 'viatorCore' ),
				'value' => $travel_date,
			);
		}

		if ( $startTime = get_post_meta( $order_id, '_startTime', true ) ) {
			$fields['custom_field_2'] = array(
				'label' => __( 'Departure time', 'viatorCore' ),
				'value' => $startTime,
			);
		}

		if ( $pickup = get_post_meta( $order_id, '_pickup', true ) ) {
			$fields['custom_field_3'] = array(
				'label' => __( 'Pickup point', 'viatorCore' ),
				'value' => implode( ', ', $pickup ),
			);
		}

		if ( $language = get_post_meta( $order_id, '_language', true ) ) {
			$fields['custom_field_4'] = array(
				'label' => __( 'Language', 'viatorCore' ),
				'value' => $this->get_name_language( $language[0], pll_current_language() ) . ' - ' . $language[2],
			);
		}

		if ( $bookingRef = get_post_meta( $order_id, '_bookingRef', true ) ) {
			$fields['custom_field_5'] = array(
				'label' => __( 'Booking id', 'viatorCore' ),
				'value' => $bookingRef,
			);
		}

		if ( $voucher = get_post_meta( $order_id, '_voucher', true ) ) {
			$voucher_code             = parse_url( $voucher, PHP_URL_QUERY );
			$fields['custom_field_6'] = array(
				'label' => __( 'Voucher', 'viatorCore' ),
				'value' => '<a href="' . home_url( '/voucher/' . $voucher_code ) . '">' . __( 'download', 'viatorCore' ) . '</a>',
			);
		}

		$fields['custom_field_7'] = array(
			'label' => __( 'View your order on', 'viatorCore' ),
			'value' => '<b>
<a href="' . wc_get_page_permalink( 'myaccount' ) . '/view-order/' . $order_id . '/">' . __( 'the website', 'viatorCore' ) . '</a></b>',
		);

		return $fields;
	}

}
