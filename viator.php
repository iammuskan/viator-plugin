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

function create_custom_table_for_grid() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'similars';

    if( $wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name ) {
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            html_content longtext NOT NULL,
            url VARCHAR(255) NOT NULL,
            date_added DATE NOT NULL,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
        dbDelta( $sql );
    }
}

create_custom_table_for_grid();

function create_custom_table_for_grid_home() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'grids';

    if( $wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name ) {
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            html_content longtext NOT NULL,
            url VARCHAR(255) NOT NULL,
            date_added DATE NOT NULL,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
        dbDelta( $sql );
    }
}

create_custom_table_for_grid_home();

function create_for_singles() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'singletable';

    if( $wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name ) {
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            info longtext NOT NULL,
            `desc` longtext NOT NULL,  
            media longtext NOT NULL,
            url VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            date_added DATE NOT NULL,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
        dbDelta( $sql );
    }
}
create_for_singles();


