<?php
/**
 * all-destination.php
 * create in 29.06.2022
 *
 */

$viator_all_dest = json_decode( get_option( '_viator_dest' ), true );
//var_dump($_GET['nav'], $show_count);

if ( ! isset( $show_count ) && empty( $show_count ) ) {
	$show_count = 12;
}

$slice = 0;
$page  = (int) ( $_GET['nav'] ?? 1 );

if ( $page > 1 ) {
	$slice = ( $page - 1 ) * $show_count;
}

$data       = array_slice( $viator_all_dest, $slice, $show_count );
$all_page   = ceil( count( $viator_all_dest ) / $show_count );
$upload_dir = wp_get_upload_dir();
$baseurl    = $upload_dir['baseurl'] . '/destinations-pics/';

$current_lan = pll_current_language();
$lang_url    = '';

if ( $current_lan !== pll_default_language() ) {
	$lang_url .= "/{$current_lan}";
}

get_header();
?>

	<main class="main-wrapper">
		<div class="excursion">
			<div class="container">

				<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
					<header class="entry-header">
						<?php
						if ( is_singular() ) :
							the_title( '<h1 class="entry-title">', '</h1>' );
						else :
							the_title( '<h2 class="entry-title"><a href="' . esc_url( get_permalink() ) . '" rel="bookmark">', '</a></h2>' );
						endif;

						if ( 'post' === get_post_type() ) :
							?>
							<div class="entry-meta">
								<?php
								viator_posted_on();
								viator_posted_by();
								?>
							</div><!-- .entry-meta -->
						<?php endif; ?>
					</header><!-- .entry-header -->

					<?php viator_post_thumbnail(); ?>

					<div class="entry-content">
						<div class="mt-5 destination__list">
							<div class="row mx-n2 mx-sm-n3">
								<?php foreach ( $data as $index => $item ) :
									$thumbnail = $item['destinationUrlName'] . '/thumbnail.jpg';
									?>
									<div class="col-lg-3 col-6 px-2 px-sm-3">
										<a href="<?php echo viator_product_url( $item['destinationUrlName'] ); ?>/" class="destination__item">
											<div class="destination__item-image">
												<img src="<?php echo $baseurl . $thumbnail ?>">
											</div>
											<h4 class="destination__item-title"><?php echo $item['destinationName'] ?></h4>
										</a>
									</div>
								<?php endforeach; ?>

							</div>
						</div>


						<div class="row">
							<div class="col-12">
								<div class="pagination">
									<?php
									$args = array(
										'format'    => '?nav=%#%',
										'total'     => $all_page,
										'current'   => $page ?: 1,
										'show_all'  => false,
										'end_size'  => 1,
										'mid_size'  => 3,
										'prev_next' => true,
										'prev_text' => '<span class="pagination__item-icon"><svg width="13" height="22" viewBox="0 0 13 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.966174 11.0935C0.966174 10.8541 1.05649 10.6145 1.23688 10.4318L10.476 1.07262C10.8371 0.706912 11.4217 0.706912 11.7825 1.07262C12.1432 1.43833 12.1435 2.03053 11.7825 2.39601L3.19651 11.0935L11.7825 19.791C12.1435 20.1567 12.1435 20.7489 11.7825 21.1144C11.4214 21.4799 10.8368 21.4801 10.476 21.1144L1.23688 11.7552C1.05649 11.5725 0.966174 11.3329 0.966174 11.0935Z" fill="#C0C0C0"></path></svg></span>',
										'next_text' => '<span class="pagination__item-icon"><svg width="13" height="22" viewBox="0 0 13 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0338 11.0935C12.0338 10.8541 11.9435 10.6145 11.7631 10.4318L2.52396 1.07262C2.16294 0.706912 1.57833 0.706912 1.21754 1.07262C0.856753 1.43833 0.856522 2.03053 1.21754 2.39601L9.80349 11.0935L1.21754 19.791C0.856523 20.1567 0.856523 20.7489 1.21754 21.1144C1.57856 21.4799 2.16317 21.4801 2.52396 21.1144L11.7631 11.7552C11.9435 11.5725 12.0338 11.3329 12.0338 11.0935Z" fill="#C0C0C0"></path></svg></span>',
										'type'      => 'plain',//list
									);
									echo paginate_links( $args );
									?>

								</div>
							</div>

						</div>
					</div><!-- .entry-content -->

					<footer class="entry-footer">
						<?php viator_entry_footer(); ?>
					</footer><!-- .entry-footer -->
				</article><!-- #post-<?php the_ID(); ?> -->

			</div>
		</div>
	</main><!-- #main -->

<?php
get_sidebar();
get_footer();
