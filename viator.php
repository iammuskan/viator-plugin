<?php
/**
 * Plugin Name:     Viator Core
 * Description:     To work with Viator
 * Author:          Coco and Jay
 * Author URI:      https://cocoandjay.com
 * Text Domain:     viatorCore
 * Domain Path:     /languages
 * Version:         2.4.3
 * @package         Viator
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


define( 'VIATORPLUGIN', '2.4.3' );

define( 'VIATOR_FILE', __FILE__ );
define( 'VIATOR_PATH', wp_normalize_path( plugin_dir_path( VIATOR_FILE ) ) );
define( 'VIATOR_URL', wp_normalize_path( plugin_dir_url( VIATOR_FILE ) ) );// with slash in end


include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
include_once( VIATOR_PATH . 'src/autoloader.php' );
include_once( VIATOR_PATH . 'src/core.php' );


if ( ! function_exists( 'woocommerce_order_again_button' ) ) {
	function woocommerce_order_again_button() {
		return false;
	}
}

if ( ! headers_sent() ) {
	$hash = bin2hex( random_bytes( 15 ) );

	if ( ! isset( $_COOKIE['user_custom_hash'] ) ) {
		setcookie( 'user_custom_hash', $hash, 0, '/', );
	}
}
