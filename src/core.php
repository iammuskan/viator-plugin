<?php

namespace ViatorCoreSpace;

if ( ! defined( 'WPINC' ) ) {
	die;
}


class core {

	/**
	 * Instance.
	 * Holds the plugin instance.
	 * @since  1.0.0
	 * @access public
	 * @static
	 * @var $instance Core.
	 */
	public static $instance = null;

	/**
	 * Instance.
	 * @return core|null
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();

			/**
			 * LeadGenReport loaded.
			 * @since 1.0.0
			 */
			do_action( 'viator_core_load' );
		}

		return self::$instance;
	}

	/**
	 * Constructor loads API functions, defines paths and adds required wp actions
	 * @since  1.0
	 */
	private function __construct() {
		/**
		 * Register autoloader and add namespaces.
		 */
		$this->register_autoloader();

		/**
		 * Init components.
		 */
		$this->turn_on_off();
		$this->init_components();
	}

	/**
	 * Register autoloader.
	 * @since  1.0.0
	 * @access private
	 */
	private function register_autoloader() {

		/**
		 *  Get the autoloader.
		 * */
		$autoloader = new Autoloader();

		/**
		 *  Register the autoloader.
		 * */
		$autoloader->register();

		/**
		 * Register the base directories for the namespace prefix.
		 * */
		$autoloader->add_namespace( 'ViatorCoreSpace', dirname( __FILE__ ) );
	}

	private function turn_on_off() {
		register_activation_hook( VIATOR_FILE, array( $this, 'activator' ) );
		register_deactivation_hook( VIATOR_FILE, array( $this, 'deactivator' ) );
	}

	public function activator() {
		$cron = new cron();
		$cron->init_cron();

		$data_cancel_reasons_en = <<<EOT
{"reasons":[{"cancellationReasonText":"Significant global event/force Majeure","cancellationReasonCode":"Customer_Service.Significant_global_event"},{"cancellationReasonText":"Duplicate Booking","cancellationReasonCode":"Customer_Service.Duplicate_Booking"},{"cancellationReasonText":"The guide or driver didn't show up","cancellationReasonCode":"Customer_Service.Supplier_no_show"},{"cancellationReasonText":"Chose a different/cheaper tour","cancellationReasonCode":"Customer_Service.Chose_a_different_cheaper_tour"},{"cancellationReasonText":"Unexpected/medical circumstances","cancellationReasonCode":"Customer_Service.Unexpected_medical_circumstances"},{"cancellationReasonText":"Booked wrong tour/date","cancellationReasonCode":"Customer_Service.Booked_wrong_tour_date"},{"cancellationReasonText":"Weather","cancellationReasonCode":"Customer_Service.Weather"},{"cancellationReasonText":"I canceled my entire trip","cancellationReasonCode":"Customer_Service.I_canceled_my_entire_trip"}]}
EOT;
		$data_cancel_reasons_es = <<<EOT
{"reasons":[{"cancellationReasonText":"Circunstancias imprevistas o motivos médicos","cancellationReasonCode":"Customer_Service.Unexpected_medical_circumstances"},{"cancellationReasonText":"He elegido una excursión diferente o más barata","cancellationReasonCode":"Customer_Service.Chose_a_different_cheaper_tour"},{"cancellationReasonText":"Condiciones meteorológicas","cancellationReasonCode":"Customer_Service.Weather"},{"cancellationReasonText":"Excursión o fecha erróneas al reservar","cancellationReasonCode":"Customer_Service.Booked_wrong_tour_date"},{"cancellationReasonText":"Acontecimiento de fuerza mayor o de trascendencia internacional","cancellationReasonCode":"Customer_Service.Significant_global_event"},{"cancellationReasonText":"Reserva duplicada","cancellationReasonCode":"Customer_Service.Duplicate_Booking"},{"cancellationReasonText":"He cancelado todo el viaje","cancellationReasonCode":"Customer_Service.I_canceled_my_entire_trip"},{"cancellationReasonText":"El guía o el conductor no ha acudido.","cancellationReasonCode":"Customer_Service.Supplier_no_show"}]}
EOT;
		$data_cancel_reasons_fr = <<<EOT
 {"reasons":[{"cancellationReasonText":"J'ai réservé la mauvaise excursion ou date","cancellationReasonCode":"Customer_Service.Booked_wrong_tour_date"},{"cancellationReasonText":"Circonstances imprévues/médicales","cancellationReasonCode":"Customer_Service.Unexpected_medical_circumstances"},{"cancellationReasonText":"Événement mondial de grande ampleur / cas de force majeure","cancellationReasonCode":"Customer_Service.Significant_global_event"},{"cancellationReasonText":"J'ai choisi une autre excursion (différente ou moins chère)","cancellationReasonCode":"Customer_Service.Chose_a_different_cheaper_tour"},{"cancellationReasonText":"Le guide ou chauffeur n'est pas venu","cancellationReasonCode":"Customer_Service.Supplier_no_show"},{"cancellationReasonText":"Météo","cancellationReasonCode":"Customer_Service.Weather"},{"cancellationReasonText":"Réservation en double","cancellationReasonCode":"Customer_Service.Duplicate_Booking"},{"cancellationReasonText":"J'ai annulé tout mon voyage","cancellationReasonCode":"Customer_Service.I_canceled_my_entire_trip"}]}
EOT;
		$data_cancel_reasons_it = <<<EOT
{"reasons":[{"cancellationReasonText":"Ho cancellato l'intero viaggio","cancellationReasonCode":"Customer_Service.I_canceled_my_entire_trip"},{"cancellationReasonText":"Ho scelto un tour diverso/più economico","cancellationReasonCode":"Customer_Service.Chose_a_different_cheaper_tour"},{"cancellationReasonText":"Evento internazionale importante/forza maggiore","cancellationReasonCode":"Customer_Service.Significant_global_event"},{"cancellationReasonText":"Previsioni climatiche","cancellationReasonCode":"Customer_Service.Weather"},{"cancellationReasonText":"Problemi imprevisti/di salute","cancellationReasonCode":"Customer_Service.Unexpected_medical_circumstances"},{"cancellationReasonText":"La guida o l'autista non si sono presentati","cancellationReasonCode":"Customer_Service.Supplier_no_show"},{"cancellationReasonText":"Ho prenotato il tour o la data errati","cancellationReasonCode":"Customer_Service.Booked_wrong_tour_date"},{"cancellationReasonText":"Prenotazione duplicata","cancellationReasonCode":"Customer_Service.Duplicate_Booking"}]}
EOT;


		update_option('_viator_cancel_reasons_en', $data_cancel_reasons_en, false);
		update_option('_viator_cancel_reasons_es', $data_cancel_reasons_es, false);
		update_option('_viator_cancel_reasons_fr', $data_cancel_reasons_fr, false);
		update_option('_viator_cancel_reasons_it', $data_cancel_reasons_it, false);
		update_option('woocommerce_cart_redirect_after_add', 'yes');

		global $wp_rewrite;
		$wp_rewrite->flush_rules();
		flush_rewrite_rules();
	}

	public function deactivator() {
		$cron = new cron();
		$cron->terminate_cron();

		global $wp_rewrite;
		$wp_rewrite->flush_rules();
		flush_rewrite_rules();
	}


	public function init_components() {
		$assets = new assets();
		$assets->init();

		$func = new functions();
		$func->init();

		$ajax = new ajax();
		$ajax->init();

		$cron = new cron();
		$cron->init();

		$admin = new admin();
		$admin->init();

		/**
		 * viator_core init.
		 * @since 1.0.0
		 */
		do_action( 'viator_core_init' );
	}

}

core::instance();
