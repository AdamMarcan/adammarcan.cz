<!DOCTYPE html>
<head>
	
	<!-- Global site tag (gtag.js) - Google Analytics -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=UA-162601628-1"></script>
	<script>
	  window.dataLayer = window.dataLayer || [];
	  function gtag(){dataLayer.push(arguments);}
	  gtag('js', new Date());

	  gtag('config', 'UA-162601628-1');
	</script>

	<meta property="og:title" content="On-line vzdělávání pro firmy: Na-dále spolu">
	<meta property="og:description" content="Pro ty, kteří vzdělávají, předávají informace, vedou lidi. A chtějí, aby se v síti neztratila blízkost a efektivita.">
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://nadalespolu.cz/assets/img/nahled.jpg">
	<meta property="og:url" content="https://nadalespolu.cz">
	
	<meta charset="utf-8">

	<link rel="stylesheet" href="assets/css/main.css">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Signika:400,600" media="all">
	<script src="https://code.jquery.com/jquery-1.12.4.js"></script>
	  <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
	  <script src="https://kit.fontawesome.com/aa27f90d4d.js" crossorigin="anonymous"></script>
	  <script>
	    $( function() {
	      $( "#accordion" ).accordion({
	        heightStyle: "content"
	      });
	    } );
	    </script>
		
		<script type="text/javascript">
			$(document).ready(function() {
			    $(window).scroll( function(){
			        $('.sticky').each( function(i){
			            var bottom_of_object = $(this).position().top + $(this).outerHeight();
			            var bottom_of_window = $(window).scrollTop() + $(window).height();
			            if( bottom_of_window > bottom_of_object ){
			                $(this).animate({'opacity':'1'},500);
			            }
			        }); 
			    });
			    $('#page-nav ul.navbar-collapse li a').on('click', function () {
			   			    	$('#hamburger').prop('checked', false);
			   			    });
			});
			
		</script>
			
		<script type="text/javascript">
			jQuery(function($) {
				$('a.smooth[href*="#"]:not([href="#"])').click(function() {
					if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
						var target = $(this.hash);
						target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
						if (target.length) {
							$('html,body').animate({
								scrollTop: target.offset().top
							}, 500);
							return false;
						}
					}
				});
			});
		</script>
			
		<script src="assets/js/js-tabs.js"></script>
		
		