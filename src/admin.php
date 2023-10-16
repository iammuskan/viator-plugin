<?php

namespace ViatorCoreSpace;

if ( ! defined( 'WPINC' ) ) {
	die;
}

use Carbon_Fields\Container;
use Carbon_Fields\Field;

class admin {

	public function __construct() {
	}

	public function init() {
		add_action( 'carbon_fields_register_fields', array( $this, 'page_options' ) );
		add_action( 'carbon_fields_theme_options_container_saved', array( $this, 'clear_cache' ) );

		// Add Settings link to the plugin
		$plugin_basename = plugin_basename( VIATOR_PATH . 'viator.php' );
		add_action( 'plugin_action_links_' . $plugin_basename, array( $this, 'add_action_links' ) );
	}

	public function carbon_lang_prefix( $line = true ) {
		$prefix = '';
		if ( ! defined( 'ICL_LANGUAGE_CODE' ) ) {
			return $prefix;
		}

		return $line ? '_' . ICL_LANGUAGE_CODE : ICL_LANGUAGE_CODE;
	}

	/**
	 * Add new menu item to the admin navigation and some fields.
	 */
	public function page_options() {
		$options = Container::make( 'theme_options', 'Viator Core' );


		//Home
		$options->add_tab( __( 'Home', 'viatorCore' ), array(
			Field::make( 'separator', 'crb_separator1', __( 'Main Banner:', 'viatorCore' ) )
			     ->set_classes( 'viator-separator' ),
			Field::make( 'text', 'viator_home_banner_subtitle_' . $this->carbon_lang_prefix(),
				__( 'Subtitle', 'viatorCore' ) )
			     ->set_default_value( 'start exploring the world today' )
			     ->set_attribute( 'placeholder', 'Enter Subtitle' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 40 ),
			Field::make( 'text', 'viator_home_banner_title_' . $this->carbon_lang_prefix(),
				__( 'Title', 'viatorCore' ) )
			     ->set_default_value( 'Excursions in English <br>around the world' )
			     ->set_attribute( 'placeholder', 'Enter title' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 40 ),
			Field::make( 'image', 'viator_home_banner_image', __( 'Image', 'viatorCore' ) )
			     ->set_value_type( 'url' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 11 ),

			Field::make( 'separator', 'crb_separator2', __( 'Destinations:', 'viatorCore' ) )
			     ->set_classes( 'viator-separator' ),
			Field::make( 'text', 'viator_home_dest_title_' . $this->carbon_lang_prefix(), __( 'Title', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', 'Enter Title' )
			     ->set_default_value( 'Main destinations' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 33 ),
			Field::make( 'text', 'viator_home_dest_btn_name_' . $this->carbon_lang_prefix(),
				__( 'Button Name', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', 'Enter Name' )
			     ->set_default_value( 'Show more' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 33 ),
			Field::make( 'text', 'viator_home_dest_btn_link_' . $this->carbon_lang_prefix(),
				__( 'Button Link', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', 'Enter Link' )
			     ->set_default_value( 'shop' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 33 ),

			Field::make( 'complex', 'viator_home_dest_' . $this->carbon_lang_prefix(), __( 'Destinations Item', 'viatorCore' ) )
			     ->add_fields( array(
				     Field::make( 'text', 'title', __( 'Destination Name', 'viatorCore' ) )
				          ->set_attribute( 'placeholder', 'Enter Name' )
				          ->set_width( 40 ),

				     Field::make( 'select', 'dest', __( 'Destination Link', 'viatorCore' ) )
				          ->set_width( 40 )
				          ->set_default_value( 'USA' )
				          ->add_options( $this->get_dest_array() ),

				     Field::make( 'image', 'cover', __( 'Destination Photo', 'viatorCore' ) )
				          ->set_width( 11 ),
			     ) )
			     ->setup_labels( array( 'singular_name' => 'Destination' ) )
			     ->set_layout( 'tabbed-vertical' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_min( 1 )
			     ->set_max( 6 ),

			Field::make( 'separator', 'crb_separator3', __( 'Featured product:', 'viatorCore' ) )
			     ->set_classes( 'viator-separator' ),


			Field::make( 'radio', 'featured_product_source', __( 'Choose source', 'viatorCore' ) )
			     ->set_default_value( 'des' )
			     ->add_options( array(
				     'des'  => 'Destination id',
				     'prod' => 'Products id',
			     ) ),

			//START Products id
			Field::make( 'text', 'featured_product_id_1',
				__( 'ID 1 of product', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', __( 'Enter ID', 'viatorCore' ))
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 16.6666667 )
			     ->set_conditional_logic( array(
				     'relation' => 'AND',
				     array(
					     'field'   => 'featured_product_source',
					     'value'   => 'prod',
					     'compare' => '=',
				     ),
			     ) ),
			Field::make( 'text', 'featured_product_id_2',
				__( 'ID 2 of product', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', __( 'Enter ID', 'viatorCore' ))
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 16.6666667 )
			     ->set_conditional_logic( array(
				     'relation' => 'AND',
				     array(
					     'field'   => 'featured_product_source',
					     'value'   => 'prod',
					     'compare' => '=',
				     ),
			     ) ),
			Field::make( 'text', 'featured_product_id_3',
				__( 'ID 3 of product', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', __( 'Enter ID', 'viatorCore' ))
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 16.6666667 )
			     ->set_conditional_logic( array(
				     'relation' => 'AND',
				     array(
					     'field'   => 'featured_product_source',
					     'value'   => 'prod',
					     'compare' => '=',
				     ),
			     ) ),
			Field::make( 'text', 'featured_product_id_4',
				__( 'ID 4 of product', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', __( 'Enter ID', 'viatorCore' ))
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 16.6666667 )
			     ->set_conditional_logic( array(
				     'relation' => 'AND',
				     array(
					     'field'   => 'featured_product_source',
					     'value'   => 'prod',
					     'compare' => '=',
				     ),
			     ) ),
			Field::make( 'text', 'featured_product_id_5',
				__( 'ID 5 of product', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', __( 'Enter ID', 'viatorCore' ))
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 16.6666667 )
			     ->set_conditional_logic( array(
				     'relation' => 'AND',
				     array(
					     'field'   => 'featured_product_source',
					     'value'   => 'prod',
					     'compare' => '=',
				     ),
			     ) ),
			Field::make( 'text', 'featured_product_id_6',
				__( 'ID 6 of product', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', __( 'Enter ID', 'viatorCore' ))
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 16.6666667 )
			     ->set_conditional_logic( array(
				     'relation' => 'AND',
				     array(
					     'field'   => 'featured_product_source',
					     'value'   => 'prod',
					     'compare' => '=',
				     ),
			     ) ),
			     
			Field::make( 'text', 'featured_product_price_1',
				__( 'Price 1 of product', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', __( 'Enter Price', 'viatorCore' ))
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 16.6666667 )
			     ->set_conditional_logic( array(
				     'relation' => 'AND',
				     array(
					     'field'   => 'featured_product_source',
					     'value'   => 'prod',
					     'compare' => '=',
				     ),
			     ) ),
			Field::make( 'text', 'featured_product_price_2',
				__( 'Price 2 of product', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', __( 'Enter Price', 'viatorCore' ))
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 16.6666667 )
			     ->set_conditional_logic( array(
				     'relation' => 'AND',
				     array(
					     'field'   => 'featured_product_source',
					     'value'   => 'prod',
					     'compare' => '=',
				     ),
			     ) ),
			Field::make( 'text', 'featured_product_price_3',
				__( 'Price 3 of product', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', __( 'Enter Price', 'viatorCore' ))
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 16.6666667 )
			     ->set_conditional_logic( array(
				     'relation' => 'AND',
				     array(
					     'field'   => 'featured_product_source',
					     'value'   => 'prod',
					     'compare' => '=',
				     ),
			     ) ),
			Field::make( 'text', 'featured_product_price_4',
				__( 'Price 4 of product', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', __( 'Enter Price', 'viatorCore' ))
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 16.6666667 )
			     ->set_conditional_logic( array(
				     'relation' => 'AND',
				     array(
					     'field'   => 'featured_product_source',
					     'value'   => 'prod',
					     'compare' => '=',
				     ),
			     ) ),
			Field::make( 'text', 'featured_product_price_5',
				__( 'Price 5 of product', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', __( 'Enter Price', 'viatorCore' ))
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 16.6666667 )
			     ->set_conditional_logic( array(
				     'relation' => 'AND',
				     array(
					     'field'   => 'featured_product_source',
					     'value'   => 'prod',
					     'compare' => '=',
				     ),
			     ) ),
			Field::make( 'text', 'featured_product_price_6',
				__( 'Price 6 of product', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', __( 'Enter Price', 'viatorCore' ))
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 16.6666667 )
			     ->set_conditional_logic( array(
				     'relation' => 'AND',
				     array(
					     'field'   => 'featured_product_source',
					     'value'   => 'prod',
					     'compare' => '=',
				     ),
			     ) ),
			//END Products id

			//START Destination id
			Field::make( 'text', 'viator_home_featured_title_' . $this->carbon_lang_prefix(),
				__( 'Title', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', 'Enter Title' )
			     ->set_default_value( 'Popular activities' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 25 ),
			Field::make( 'select', 'viator_home_featured_id', __( 'Destination Id', 'viatorCore' ) )
			     ->set_default_value( 'USA' )
			     ->add_options( $this->get_dest_array() )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 25 )
			     ->set_conditional_logic( array(
				     'relation' => 'AND',
				     array(
					     'field'   => 'featured_product_source',
					     'value'   => 'des',
					     'compare' => '=',
				     ),
			     ) ),
			Field::make( 'text', 'viator_home_featured_name_' . $this->carbon_lang_prefix(),
				__( 'Button Name', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', 'Enter Button Name' )
			     ->set_default_value( 'Show more' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 25 ),
			Field::make( 'text', 'viator_home_featured_link_' . $this->carbon_lang_prefix(),
				__( 'Button Link', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', 'Enter Link' )
			     ->set_default_value( 'shop' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 25 ),
			//END Destination id


			Field::make( 'separator', 'crb_separator4', __( 'News:', 'viatorCore' ) )
			     ->set_classes( 'viator-separator' ),
			Field::make( 'text', 'viator_home_news_title_' . $this->carbon_lang_prefix(), __( 'Title', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', 'Enter Title' )
			     ->set_default_value( 'Latest news' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 25 ),
			Field::make( 'text', 'viator_home_news_name_' . $this->carbon_lang_prefix(),
				__( 'Button Name', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', 'Enter Button Name' )
			     ->set_default_value( 'Show more' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 25 ),
			Field::make( 'association', 'viator_home_news_id_' . $this->carbon_lang_prefix(), __( 'News Category', 'viatorCore' ) )
			     ->set_types( array(
				     array(
					     'type'     => 'term',
					     'subtype'  => 'category',
					     'taxonomy' => 'category',
				     ),
			     ) )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 50 )
			     ->set_min( 1 )
			     ->set_max( 1 ),

			Field::make( 'separator', 'crb_separator5', __( 'Video:', 'viatorCore' ) )
			     ->set_classes( 'viator-separator' ),
			Field::make( 'text', 'viator_home_video_link_' . $this->carbon_lang_prefix(), __( 'Link', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', 'Enter Link to iframe' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 40 ),
			Field::make( 'text', 'viator_home_video_title_' . $this->carbon_lang_prefix(), __( 'Title', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', 'Enter Title' )
			     ->set_default_value( 'These emotions can be yours' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 40 ),
			Field::make( 'image', 'viator_home_video_cover', __( 'Cover', 'viatorCore' ) )
			     ->set_value_type( 'url' )
			     ->set_width( 11 ),

			Field::make( 'separator', 'crb_separator6', __( 'FAQs:', 'viatorCore' ) )
			     ->set_classes( 'viator-separator' ),
			Field::make( 'text', 'viator_home_faqs_title_' . $this->carbon_lang_prefix(), __( 'Title', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', 'Enter Title' )
			     ->set_default_value( 'FAQs' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 25 ),
			Field::make( 'complex', 'viator_home_faqs_' . $this->carbon_lang_prefix(), __( 'Faq Item', 'viatorCore' ) )
			     ->add_fields( array(
				     Field::make( 'text', 'title', __( 'Title', 'viatorCore' ) )
				          ->set_attribute( 'placeholder', 'Enter Title' )
				          ->set_width( 45 ),

				     Field::make( 'textarea', 'text', __( 'Text', 'viatorCore' ) )
				          ->set_attribute( 'placeholder', 'Enter Text' )
				          ->set_width( 45 ),
			     ) )
			     ->setup_labels( array( 'singular_name' => 'faq' ) )
			     ->set_layout( 'tabbed-vertical' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_min( 1 )
			     ->set_max( 10 ),

			Field::make( 'separator', 'crb_separator7', __( 'Partners:', 'viatorCore' ) )
			     ->set_classes( 'viator-separator' ),
			Field::make( 'text', 'viator_home_partners_title_' . $this->carbon_lang_prefix(),
				__( 'Title', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', 'Enter Title' )
			     ->set_default_value( 'Our partners' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 25 ),
			Field::make( 'complex', 'viator_home_partners_' . $this->carbon_lang_prefix(), __( 'Partner Item', 'viatorCore' ) )
			     ->add_fields( array(
				     Field::make( 'text', 'link', __( 'Link', 'viatorCore' ) )
				          ->set_attribute( 'placeholder', 'Enter Partner Link' )
				          ->set_classes( 'viator-no-bdt' )
				          ->set_width( 50 ),
				     Field::make( 'image', 'picture', __( 'Picture', 'viator' ) )
				          ->set_value_type( 'url' )
				          ->set_width( 50 ),
			     ) )
			     ->setup_labels( array( 'singular_name' => 'Partner' ) )
			     ->set_layout( 'tabbed-vertical' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_min( 1 )
			     ->set_max( 4 ),

			Field::make( 'separator', 'crb_separator8', __( 'Subscribe:', 'viator' ) )
			     ->set_classes( 'viator-separator' ),
			Field::make( 'text', 'viator_home_subs_title_' . $this->carbon_lang_prefix(), __( 'Title', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', 'Enter Title' )
			     ->set_default_value( 'Do you want to receive <br> current promotional offers?' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 25 ),
			Field::make( 'text', 'viator_home_subs_subtitle_' . $this->carbon_lang_prefix(),
				__( 'Subtitle', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', 'Enter Subtitle' )
			     ->set_default_value( 'Subscribe to our newsletter!' )
			     ->set_classes( 'viator-no-bdt' )
			     ->set_width( 25 ),

			Field::make( 'multiselect', 'search_destinations_' . $this->carbon_lang_prefix( false ),
				__( 'Destinations For Search Block', 'viator' ) )
			     ->add_options( $this->get_dest_array( $this->carbon_lang_prefix( false ), true ) ),
		) );

		//Refund modal
		$options->add_tab( __( 'Refund', 'viatorCore' ), array(
			Field::make( 'text', 'email_for_refund', __( 'Email', 'viator' ) )
			     ->set_default_value( 'em@cocoandjay.com' )
			     ->set_attributes( array(
				     'type'        => 'email',
				     'placeholder' => 'email@gmail.com',
			     ) )
			     ->set_help_text( __( 'Enter the email address to which refund requests will be sent', 'viator' ) ),


			Field::make( 'text', 'modal_title' . $this->carbon_lang_prefix(), __( 'Title', 'viator' ) )
			     ->set_attributes( array(
				     'placeholder' => __( 'default: Are you sure?', 'viatorCore' ),
			     ) ),

			Field::make( 'textarea', 'modal_txt' . $this->carbon_lang_prefix(), __( 'Text', 'viator' ) )
			     ->set_rows( 2 ),

			Field::make( 'text', 'modal_btn_no' . $this->carbon_lang_prefix(), __( 'Text for button "No"', 'viator' ) )
			     ->set_attributes( array(
				     'placeholder' => __( 'default: No', 'viatorCore' ),
			     ) )
			     ->set_width( 45 ),

			Field::make( 'text', 'modal_btn_yes' . $this->carbon_lang_prefix(),
				__( 'Text for button "Yes"', 'viator' ) )
			     ->set_attributes( array(
				     'placeholder' => __( 'default: Yes', 'viatorCore' ),
			     ) )
			     ->set_width( 45 ),

			//Field::make( 'separator', 'crb_separator', '' ),

			Field::make( 'textarea', 'modal_txt_canceled' . $this->carbon_lang_prefix(),
				__( 'Text if the order can be canceled', 'viator' ) )
			     ->set_attributes( array(
				     'placeholder' => __( 'default: This booking is available to be cancelled', 'viatorCore' ),
			     ) )
			     ->set_rows( 2 )
			     ->set_width( 45 ),

			Field::make( 'textarea', 'modal_txt_been_canceled' . $this->carbon_lang_prefix(),
				__( 'Text if the order has already been cancelled', 'viator' ) )
			     ->set_attributes( array(
				     'placeholder' => __( 'default: This booking has already been cancelled', 'viatorCore' ),
			     ) )
			     ->set_rows( 2 )
			     ->set_width( 45 ),


			Field::make( 'textarea', 'modal_txt_not_canceled' . $this->carbon_lang_prefix(),
				__( 'Text if the order cannot be canceled', 'viator' ) )
			     ->set_attributes( array(
				     'placeholder' => __( 'default: This booking cannot be cancelled (because the product\'s start time was in the past)', 'viatorCore' ),
			     ) )
			     ->set_rows( 2 )
			     ->set_width( 45 ),

			Field::make( 'textarea', 'modal_txt_amount' . $this->carbon_lang_prefix(),
				__( 'Text before the refund amount', 'viator' ) )
			     ->set_attributes( array(
				     'placeholder' => __( 'default: The amount that will be returned to you', 'viatorCore' ),
			     ) )
			     ->set_rows( 2 )
			     ->set_width( 45 ),

			Field::make( 'textarea', 'modal_txt_reason' . $this->carbon_lang_prefix(),
				__( 'Text for the reason selection block', 'viator' ) )
			     ->set_attributes( array(
				     'placeholder' => __( 'default: You need to choose the reason for refusal', 'viatorCore' ),
			     ) )
			     ->set_rows( 2 ),

			Field::make( 'text', 'modal_btn_agree' . $this->carbon_lang_prefix(),
				__( 'Text for the agree button', 'viator' ) )
			     ->set_attributes( array(
				     'placeholder' => __( 'default: I agree', 'viatorCore' ),
			     ) ),

			Field::make( 'textarea', 'modal_txt_accepted' . $this->carbon_lang_prefix(),
				__( 'Booking Refund Accepted Text', 'viator' ) )
			     ->set_attributes( array(
				     'placeholder' => __( 'default: The cancellation was successful, you will receive a refund soon.', 'viatorCore' ),
			     ) )
			     ->set_rows( 2 )
			     ->set_width( 45 ),


			Field::make( 'textarea', 'modal_txt_declined' . $this->carbon_lang_prefix(),
				__( 'Booking Refund Declined Text', 'viator' ) )
			     ->set_attributes( array(
				     'placeholder' => __( 'default: The cancellation was failed', 'viatorCore' ),
			     ) )
			     ->set_rows( 2 )
			     ->set_width( 45 ),

			Field::make( 'textarea', 'modal_txt_declined_already' . $this->carbon_lang_prefix(),
				__( 'Booking Refund Declined Reason Already Cancelled', 'viator' ) )
			     ->set_attributes( array(
				     'placeholder' => __('default: The booking has already been cancelled' , 'viatorCore' ),
			     ) )
			     ->set_rows( 2 )
			     ->set_width( 45 ),

			Field::make( 'textarea', 'modal_txt_declined_not' . $this->carbon_lang_prefix(),
				__( 'Booking Refund Declined Reason Not Cancellable', 'viator' ) )
			     ->set_attributes( array(
				     'placeholder' => __( 'default: The booking cannot be canceled because the product start time was in the past', 'viatorCore' ),
			     ) )
			     ->set_rows( 2 )
			     ->set_width( 45 ),

			Field::make( 'textarea', 'modal_txt_error' . $this->carbon_lang_prefix(),
				__( 'Text if an error occurred', 'viator' ) )
			     ->set_attributes( array(
				     'placeholder' => __( 'default: Sorry happened error, try later', 'viatorCore' ),
			     ) )
			     ->set_rows( 2 ),


		) );
//Settings
		$options->add_tab( __( 'Settings', 'viatorCore' ), array(

			Field::make( 'checkbox', 'use_sandbox_api', __( 'Use Sandbox API', 'viatorCore' ) )
			     ->set_option_value( 'yes' ),


			Field::make( 'text', 'viator_apikey', __( 'API Key', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', __( 'Enter API Key', 'viatorCore' ) ),

			Field::make( 'text', 'viator_gmap_api', __( 'Google Map API Key', 'viatorCore' ) )
			     ->set_attribute( 'placeholder', __( 'Enter API Key', 'viatorCore' ) ),

			Field::make( 'text', 'show_dest_count', __( 'How many destinations to show?' ) )
			     ->set_attributes( array(
				     'type'        => 'number',
				     'placeholder' => __( 'default 12', 'viatorCore' ),
			     ) ),
		) );
		//Settings
$options->add_tab( __( 'Manual Tours', 'viatorCore' ), array(
 Field::make( 'complex', 'crb_slides', __( 'Slides' ) )
        ->set_layout( 'tabbed-horizontal' )
        ->add_fields( array(
  Field::make( 'select', 'voator_category_destination', __( 'Choose Destination', 'viatorCore' ) )
			     ->set_default_value( 'USA' )
			     ->add_options( $this->get_dest_array() )
			     ->set_classes( 'viator-no-bdt' )
			    
                  ,
Field::make( 'text', 'product_id_1', __( 'Product ID 1' ) )->set_width( 25 ),
Field::make( 'text', 'product_id_2', __( 'Product ID 2' ) )->set_width( 25 ),
Field::make( 'text', 'product_id_3', __( 'Product ID 3' ) )->set_width( 25 ),
Field::make( 'text', 'product_id_4', __( 'Product ID 4' ) )->set_width( 25 ),
Field::make( 'text', 'product_id_5', __( 'Product ID 5' ) )->set_width( 25 ),
Field::make( 'text', 'product_id_6', __( 'Product ID 6' ) )->set_width( 25 ),
Field::make( 'text', 'product_id_7', __( 'Product ID 7' ) )->set_width( 25 ),
Field::make( 'text', 'product_id_8', __( 'Product ID 8' ) )->set_width( 25 ),


        ) ),
        


         
        
) );




	}

	/**
	 * clear cache.
	 */
	public function clear_cache() {
		$languages_list = array();

		if (function_exists( 'pll_languages_list' )){
			$languages_list = pll_languages_list();
		}

		foreach ( $languages_list as $lang_id ) {
			delete_transient("home_featured_cache_{$lang_id}");
		}
	}

	/**
	 * Add settings action link to the plugins page.
	 */
	public function add_action_links( $links ) {
		$pattern       = '<a href="%s">%s</a>';
		$url           = admin_url( 'admin.php?page=crb_carbon_fields_container_viator_core.php' );
		$name_url      = __( 'Settings', 'viator' );
		$link          = sprintf( $pattern, $url, $name_url );
		$settings_link = array( $link );

		return array_merge( $settings_link, $links );
	}

	/**
	 * Get Destination in array
	 */
	public function get_dest_array( $lang = '', $ext_value = false ) {
		$array = array( '' => '' );

		if ( ! empty( $lang ) || $lang == 'en' ) {
			$lang = '_' . $lang;
		}

		if ( $destinations = json_decode( get_option( '_viator_dest' . $lang ), true ) ) {
			// sort destinations by destination name
			usort( $destinations, function ( $a, $b ) {
				return strcmp( $a['destinationName'], $b['destinationName'] );
			} );

			foreach ( $destinations as $item ) {
				if ( $ext_value ) {
					$array[ $item['destinationUrlName'] . '|' . $item['destinationName'] ] = $item['destinationName'];
				} else {
					$array[ $item['destinationUrlName'] ] = $item['destinationName'];
				}
			}
		}

		return $array;


	}

}