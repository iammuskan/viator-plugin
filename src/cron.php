<?php

namespace ViatorCoreSpace;

if ( ! defined( 'WPINC' ) ) {
	die;
}

class cron extends functions {

	public function __construct() {
		parent::__construct();
	}

	public function init() {
		add_filter( 'cron_schedules', array( $this, 'cron_add_schedules' ) );

		add_action( 'action_delete_temp_order', array( $this, 'delete_temp_order' ) );
		add_action( 'action_get_viator_tags', array( $this, 'get_viator_tags' ) );
		add_action( 'action_get_viator_dest', array( $this, 'get_viator_dest' ) );
		add_action( 'action_booking_question', array( $this, 'booking_question' ) );
		add_action( 'action_cancel_reasons', array( $this, 'cancel_reasons' ) );
		add_action( 'action_viator_exchange_rates', array( $this, 'viator_exchange_rates' ) );
		add_action( 'init', array( $this, 'viator_exchange_rates_manually' ) );
	}

	public function init_cron() {
		wp_clear_scheduled_hook( 'action_delete_temp_order' );
		wp_clear_scheduled_hook( 'action_get_viator_tags' );
		wp_clear_scheduled_hook( 'action_get_viator_dest' );
		wp_clear_scheduled_hook( 'action_booking_question' );
		wp_clear_scheduled_hook( 'action_viator_exchange_rates' );
		wp_clear_scheduled_hook( 'action_cancel_reasons' );

		wp_schedule_event( time(), 'daily', 'action_delete_temp_order' );
		wp_schedule_event( time(), 'weekly', 'action_get_viator_tags' );
		wp_schedule_event( time(), 'weekly', 'action_get_viator_dest' );
		wp_schedule_event( time(), 'monthly', 'action_booking_question' );
		wp_schedule_event( time(), 'fourtimesday', 'action_viator_exchange_rates' );
		wp_schedule_event( time(), 'monthly', 'action_cancel_reasons' );
	}

	public function terminate_cron() {
		wp_clear_scheduled_hook( 'action_get_viator_tags' );
		wp_clear_scheduled_hook( 'action_delete_temp_order' );
		wp_clear_scheduled_hook( 'action_get_viator_dest' );
		wp_clear_scheduled_hook( 'action_booking_question' );
		wp_clear_scheduled_hook( 'action_viator_exchange_rates' );
		wp_clear_scheduled_hook( 'action_cancel_reasons' );

		remove_action( 'action_delete_temp_order', 'delete_temp_order' );
		remove_action( 'action_get_viator_tags', 'get_viator_tags' );
		remove_action( 'action_get_viator_dest', 'get_viator_dest' );
		remove_action( 'action_booking_question', 'booking_question' );
		remove_action( 'action_viator_exchange_rates', 'viator_exchange_rates' );
		remove_action( 'action_cancel_reasons', 'cancel_reasons' );
	}

	public function cron_add_schedules( $schedules ) {
		$schedules['fourtimesday'] = array(
			'interval' => 4 * HOUR_IN_SECONDS,
			'display'  => __( 'Four times a day', 'viator' ),
		);

		$schedules['weekly'] = array(
			'interval' => 604800,
			'display'  => __( 'Once a week', 'viator' ),
		);

		$schedules['monthly'] = array(
			'interval' => 2629743,
			'display'  => __( 'Once a month', 'viator' ),
		);

		return $schedules;
	}

	public function delete_temp_order() {
		$woo_arg = array(
			'post_type'      => 'product',
			'posts_per_page' => - 1,
			'meta_query'     => array(
				array(
					'key'     => '_temp_product',
					'compare' => 'EXISTS',
				),
			),
		);

		$woo_loop = new \WP_Query( $woo_arg );

		if ( $woo_loop->have_posts() ) {
			foreach ( $woo_loop->posts as $post ) {
				if ( date( 'Y-m-d' ) > date( 'Y-m-d', get_post_timestamp( $post->ID ) ) ) {
					wp_delete_post( $post->ID, true );
				}
			}
		}
	}

	public function get_viator_tags() {
		if ( ! $api_key = $this->get_apiKey() ) {
			return;
		}

		$url  = $this->get_api_host() . '/products/tags';
		$args = array(
			'timeout'     => 30,
			'httpversion' => '1.1',
			'headers'     => array(
				'Accept'      => 'application/json;version=2.0',
				'exp-api-key' => $api_key,
			),
		);

		$response = wp_remote_get( $url, $args );

		if ( ! is_wp_error( $response ) ) {
			update_option( '_viator_tags', $response['body'], false );
			//update_option('_viator_tags_update', true);
		}
	}

	public function booking_question() {
		if ( ! $api_key = $this->get_apiKey() ) {
			return;
		}

		$lang = array( 'en', 'da', 'nl', 'no', 'es', 'sv', 'fr', 'it', 'de', 'pt', 'ja', 'zh-TW', 'zh-CN', 'ko' );
		$url  = $this->get_api_host() . '/products/booking-questions';
		$args = array(
			'timeout'     => 30,
			'httpversion' => '1.1',
			'headers'     => array(
				'Accept'      => 'application/json;version=2.0',
				'exp-api-key' => $api_key,
			),
		);

		for ( $i = 0, $c = count( $lang ); $i < $c; $i ++ ) {
			$args['headers']['Accept-Language'] = $lang[ $i ];

			$response = wp_remote_get( $url, $args );

			if ( ! is_wp_error( $response ) ) {
				update_option( '_viator_booking_questions_' . $lang[ $i ], $response['body'], false );
			}
		}
	}

	public function cancel_reasons() {
		if ( ! $api_key = $this->get_apiKey() ) {
			return;
		}

		$lang = array( 'en', 'da', 'nl', 'no', 'es', 'sv', 'fr', 'it', 'de', 'pt', 'ja', 'zh-TW', 'zh-CN', 'ko' );
		$url  = $this->get_api_host() . '/bookings/cancel-reasons/?type=CUSTOMER';
		$args = array(
			'timeout'     => 30,
			'httpversion' => '1.1',
			'headers'     => array(
				'Accept'      => 'application/json;version=2.0',
				'exp-api-key' => $api_key,
			),
		);

		for ( $i = 0, $c = count( $lang ); $i < $c; $i ++ ) {
			$args['headers']['Accept-Language'] = $lang[ $i ];

			$response = wp_remote_get( $url, $args );

			if ( ! is_wp_error( $response ) ) {
				update_option( '_viator_cancel_reasons_' . $lang[ $i ], $response['body'], false );
			}
		}

	}

	public function get_viator_dest() {
		if ( ! $api_key = $this->get_apiKey() ) {
			return;
		}

		$url  = $this->get_api_host() . '/v1/taxonomy/destinations';
		$args = array(
			'timeout'     => 30,
			'httpversion' => '1.1',
			'headers'     => array(
				'Accept'      => 'application/json;version=2.0',
				'exp-api-key' => $api_key,
			),
		);

		$response = wp_remote_get( $url, $args );
		if ( ! is_wp_error( $response ) ) {
			$body = json_decode( $response['body'], true );
			update_option( '_viator_dest', json_encode( $body['data'] ), false );
			unset( $body );
		}

		$languages = pll_languages_list( array( 'fields' => 'slug' ) );
		foreach ( $languages as $language ) {

			$args['headers']['Accept-Language'] = $language;

			$response = wp_remote_get( $url, $args );
			if ( ! is_wp_error( $response ) ) {
				$body = json_decode( $response['body'], true );

				update_option( '_viator_dest_' . $language, json_encode( $body['data'] ), false );

				unset( $body );
			}

		}


	}

	public function viator_exchange_rates() {
		if ( ! $api_key = $this->get_apiKey() ) {
			return;
		}

		$currencies = array(
			'AED',
			'AUD',
			'BRL',
			'CAD',
			'CHF',
			'DKK',
			'EUR',
			'GBP',
			'HKD',
			'INR',
			'JPY',
			'NOK',
			'NZD',
			'SEK',
			'SGD',
			'TWD',
			'USD',
			'ZAR',
		);

		$url  = $this->get_api_host() . '/exchange-rates';
		$args = array(
			'timeout'     => 30,
			'httpversion' => '1.1',
			'headers'     => array(
				'Accept'       => 'application/json;version=2.0',
				'Content-Type' => 'application/json',
				'exp-api-key'  => $api_key,
			),
			'body'        => wp_json_encode( array(
				'sourceCurrencies' => $currencies,
				'targetCurrencies' => $currencies,
			) ),
		);

		$response = wp_remote_post( $url, $args );

		if ( ! is_wp_error( $response ) ) {
			update_option( '_viator_exchange_rates', $response['body'], true );

			if ( ! empty( $response['body'] ) ) {
				$rates = json_decode( $response['body'], true );
				if ( ! empty( $rates['rates'] ) && is_array( $rates['rates'] ) ) {
					foreach ( $rates['rates'] as $rateData ) {
						if ( $rateData['sourceCurrency'] === 'USD' ) {
							$rate           = $rateData['rate'];
							$targetCurrency = sanitize_key( strtolower( $rateData['targetCurrency'] ) );
							update_option( 'wcpay_multi_currency_manual_rate_' . $targetCurrency, (float) $rate );
						}
					}
				}
			}
		}
	}

	public function viator_exchange_rates_manually(){
		if ( ! empty( $_GET['sync_currency'] ) ) {
			$this->viator_exchange_rates();
		}
	}

}
