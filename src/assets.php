<?php

namespace ViatorCoreSpace;

if ( ! defined( 'WPINC' ) ) {
	die;
}

class assets {
	public function __construct() { }

	public function init() {
		add_action( 'wp_enqueue_scripts', array( $this, 'wp_enqueue_assets' ), 15 );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_assets' ), 15 );
		add_action( 'script_loader_tag', array( &$this, 'change_my_script' ), 10, 2 );
	}

	public function admin_enqueue_assets() {
		if ( ( isset( $_GET['taxonomy'] ) && $_GET['taxonomy'] === 'product_cat' ) || ( isset( $_GET['taxonomy'] ) && $_GET['taxonomy'] === 'product_tag' ) ) {
			wp_enqueue_script(
				'viator-fixedCat',
				VIATOR_URL . 'admin/js/fixed-cat.js',
				'',
				VIATORPLUGIN,
				true
			);

			wp_enqueue_script(
				'select2',
				VIATOR_URL . 'assets/js/libraries/select2.full.min.js',
				'jquery',
				VIATORPLUGIN,
				true );
		}
		if ( isset( $_GET['page'] ) && $_GET['page'] === 'crb_carbon_fields_container_viator_core.php' ) {
			wp_enqueue_script(
				'select2',
				VIATOR_URL . 'assets/js/select2.full.min.js',
				array( 'jquery' ),
				VIATORPLUGIN,
				true
			);

			wp_enqueue_style(
				'select2',
				VIATOR_URL . 'admin/css/select2.min.css',
				'',
				VIATORPLUGIN
			);

			wp_enqueue_style(
				'viator-carbon',
				VIATOR_URL . 'admin/css/style-carbon.css',
				'',
				VIATORPLUGIN
			);
		}

		wp_enqueue_script(
			'viator-product',
			VIATOR_URL . 'admin/js/product.js',
			'',
			VIATORPLUGIN,
			true
		);

		wp_enqueue_script(
			'viator-admin',
			VIATOR_URL . 'admin/js/admin.js',
			array( 'wp-i18n', 'wp-i18n' ),
			VIATORPLUGIN,
			true
		);

		$current_lan = pll_current_language() ?? '';

		if ( 'it' === $current_lan ) {
			$reason = get_option( '_viator_cancel_reasons_it' );

		} elseif ( 'es' === $current_lan ) {
			$reason = get_option( '_viator_cancel_reasons_es' );

		} else {
			$reason = get_option( '_viator_cancel_reasons_en' );
		}

		$nonce        = wp_create_nonce( "viator-fun!" );
		$order_id     = get_the_ID();
		$bookingRef   = get_post_meta( get_the_ID(), '_bookingRef', true );
		$order        = wc_get_order( $order_id );
		$order_status = $order ? $order->get_status() : '';
		$data         = <<<END
		window['reasonViator'] = {$reason};
		window['orderId'] = '{$order_id}';
		window['language'] = '{$current_lan}';
		window['bookingRef'] = '{$bookingRef}';
		window['orderStatus'] = '{$order_status}';
		END;
		wp_add_inline_script( 'viator-admin', $data, 'before' );


		//---STYLE
		wp_enqueue_style(
			'viator-order',
			VIATOR_URL . 'admin/css/style-order.css',
			'',
			VIATORPLUGIN
		);
		wp_enqueue_style(
			'viator-product',
			VIATOR_URL . 'admin/css/style-product.css',
			'',
			VIATORPLUGIN
		);
	}

	public function wp_enqueue_assets() {
		$viator_single_obj = array(
			'post_id'      => get_the_ID(),
			'lang'         => pll_current_language(),
			'default_lang' => pll_default_language(),
			'page'         => get_query_var( 'paged' ),
		);
		$viatorParameters  = array(
			'is_home'          => is_front_page(),
			'default_lang'     => function_exists( 'pll_default_language' ) ? pll_default_language() : '',
			'default_currency' => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'USD',
			'which_languages'  => function_exists( 'pll_languages_list' ) ? pll_languages_list() : '',
		);

		wp_deregister_script( 'select2' );

		wp_enqueue_script(
			'viator-axios',
			VIATOR_URL . 'assets/js/libraries/axios.min.js',
			'',
			VIATORPLUGIN,
			true
		);

		wp_enqueue_script(
			'viator-slick',
			VIATOR_URL . 'assets/js/libraries/slick.min.js',
			array( 'jquery' ),
			VIATORPLUGIN,
			true );

		wp_enqueue_script(
			'select2',
			VIATOR_URL . 'assets/js/libraries/select2.full.min.js',
			'jquery',
			VIATORPLUGIN,
			true
		);

		wp_enqueue_script(
			'bootstrap-slider',
			VIATOR_URL . 'assets/js/libraries/bootstrap-slider.js',
			'jquery',
			VIATORPLUGIN,
			true
		);

		wp_enqueue_script(
			'viator-coreJs',
			VIATOR_URL . 'assets/js/core.min.js',
			array( 'jquery', 'select2', 'bootstrap-slider' ),
			VIATORPLUGIN,
			true
		);

		wp_enqueue_script(
			'viator-scripts',
			VIATOR_URL . 'assets/js/scripts.js',
			array( 'viator-coreJs', 'wp-i18n' ),
			VIATORPLUGIN,
			true
		);

		if ( is_front_page() ) {
			$viatorParameters['featured_source'] = get_option( '_featured_product_source', 'des' );

			if ( $viatorParameters['featured_source'] === 'prod' ) {
				for ( $i = 0; $i <= 6; $i ++ ) {
					if ( ( $featured_product_id = get_option( '_featured_product_id_' . $i ) ) &&
					     ( $featured_product_price = get_option( '_featured_product_price_' . $i ) ) ) {
						$viatorParameters['featured_prices'][$featured_product_id] = (int)$featured_product_price;
					}
				}
			}

			wp_enqueue_script(
				'viator-home',
				VIATOR_URL . 'assets/js/home.js',
				array( 'jquery', 'viator-axios', 'wp-util', 'wp-i18n' ),
				VIATORPLUGIN,
				true
			);
			wp_set_script_translations( 'viator-home', 'viator', VIATOR_PATH . 'languages' );
		}

		if ( is_single() ) {
			$cart_product = WC()->cart->get_cart();
			$cart_product = array_shift( $cart_product );
			$product_id   = $cart_product['product_id'] ?? '';

			$viator_single_obj['dest_name'] = get_query_var( 'destination' );
			$viator_single_obj['gmap_key']  = get_option( '_viator_gmap_api' );
			$viator_single_obj['lang']      = get_query_var( 'lang' );

			if ( $product_id ) {
				$viator_single_obj['cart_thumb'] = get_post_meta( $product_id, '_thumbnail', true );
			}

			wp_enqueue_script(
				'viator-single',
				VIATOR_URL . 'assets/js/single.js',
				array( 'jquery', 'viator-axios', 'wp-util', 'wp-i18n' ),
				VIATORPLUGIN,
				true );

			wp_set_script_translations( 'viator-single', 'viator', VIATOR_PATH . 'languages' );
		}

		if ( is_archive() ) {
			$viator_single_obj['dest_name'] = get_query_var( 'product_cat' );
			$viator_single_obj['lang']      = get_query_var( 'lang' );

			wp_enqueue_script(
				'viator-category',
				VIATOR_URL . 'assets/js/category.js',
				array( 'jquery', 'viator-axios', 'wp-util', 'wp-i18n' ),
				VIATORPLUGIN,
				true
			);
			wp_set_script_translations( 'viator-category', 'viator', VIATOR_PATH . 'languages' );
		}

		if ( is_checkout() ) {
			wp_enqueue_script(
				'viator-checkout',
				VIATOR_URL . 'assets/js/checkout.js',
				array( 'wp-util', 'wc-checkout', 'wp-i18n' ),
				VIATORPLUGIN,
				true
			);
			wp_set_script_translations( 'viator-checkout', 'viator', VIATOR_PATH . 'languages' );
		}

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

		$viatorParameters['product_base']  = $product_base;
		$viatorParameters['category_base'] = $category_base;

		wp_localize_script( 'viator-scripts', 'viatorSingleObj', $viator_single_obj );
		wp_localize_script( 'viator-scripts', 'viatorParameters', $viatorParameters );
		wp_localize_script( 'jquery', 'viatorCoreNonce', wp_create_nonce( "viator-fun!" ) );


		//-------------- STYLE --------------
		wp_enqueue_style(
			'viator-library',
			VIATOR_URL . 'assets/css/library.min.css',
			'',
			VIATORPLUGIN
		);

		wp_enqueue_style(
			'viator-grid',
			VIATOR_URL . 'assets/css/grid.min.css',
			'',
			VIATORPLUGIN
		);

		wp_enqueue_style(
			'viator-bootstrap',
			VIATOR_URL . 'assets/css/bootstrap.min.css',
			'',
			VIATORPLUGIN
		);

		wp_enqueue_style(
			'viator-blocks',
			VIATOR_URL . 'assets/css/blocks.min.css',
			'',
			VIATORPLUGIN
		);

		wp_enqueue_style(
			'viator-plugin',
			VIATOR_URL . 'assets/css/custom-style.css',
			'',
			VIATORPLUGIN
		);

		if ( is_single() ) {
			wp_enqueue_style(
				'viator-slick',
				VIATOR_URL . 'assets/css/slick.min.css',
				'',
				VIATORPLUGIN
			);
		}

	}

	public function change_my_script( $tag, $handle ) {
		if ( 'viator-home' === $handle || 'viator-single' === $handle || 'viator-category' === $handle || 'viator-scripts' === $handle || 'viator-checkout' === $handle ) {
			return str_replace( '<script ', '<script type="module" ', $tag );
		}

		return $tag;
	}

}
