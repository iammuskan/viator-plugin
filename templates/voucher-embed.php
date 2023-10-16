<?php
/**
 * voucher-embed.php
 * create in 16.06.2023
 * SAYri
 *
 */

http_response_code( 200 );

$site_link = home_url();
$error_txt = __( 'Sorry, this is an old link. Your booking has been updated, so this ticket is no longer valid.', 'viatorCore' );
$content   = '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"><meta http-equiv="X-UA-Compatible" content="ie=edge"><title>Sorry</title></head><body>
<div style="text-align:center;"><h2>'. $error_txt .'</h2></div></body></html>';

if ( $voucher_code = get_query_var( 'voucher_id' ) ) {
	$response = wp_remote_get( "https://www.viator.com/ticket?{$voucher_code}" );

	if ( ! is_wp_error( $response ) ) {
		if (strpos($response['body'], 'ticket-error-block') === false){
			$content = $response['body'];
			$content = str_replace( array( 'Supplied by Viator', 'viator', 'Viator' ), '', $content );
			$content = str_replace( array( '/ticket/' ), 'https://www.viator.com/ticket/', $content );
			/*$content = str_replace( 'https://cache.vtrcdn.com//orion/images/favicon.ico',
				'/wp-content/themes/viator/assets/img/favicon.ico', $content );
			$content   = str_replace( '</body>', "<script src='{$site_link}/wp-content/plugins/viator/assets/js/libraries/jspdf.umd.min.js?ver=1.9.1' id='jspdf-js'></script><script src='{$site_link}/wp-content/plugins/viator/assets/js/libraries/html2canvas.min.js?ver=1.9.1' id='html2canvas-js'></script><script>
var downloadTicket = document.querySelector('#downloadTicket');

if (downloadTicket){
  downloadTicket.removeAttribute('href');

	downloadTicket.addEventListener('click', function() {
		var content = document.querySelector('#ticket-holder');
		var pdf = new jspdf.jsPDF('p', 'mm', 'a4');

		html2canvas(content).then(canvas => {
		    canvas.style.display = 'none';
		    document.body.appendChild(canvas);
			var imgData = canvas.toDataURL('image/png');

			pdf.addImage(imgData, 'PNG', 1, 1, 210, 280);

			setTimeout(function () {
				pdf.save('voucher.pdf');
				document.body.removeChild(canvas);
			}, 1000);
		});
	});
	}
</script></body>", $content ); */

			if ( $gmap_api = get_option( '_viator_gmap_api' ) ){
				$content = str_replace( 'js?key=AIzaSyCnptV-C1VZpERe39vv6lcNjVJfXDKAEds&v=weekly&channel=2',
					'js?key=' . $gmap_api . '&v=weekly&channel=2', $content );
			}
		}
	}
}

echo $content;
