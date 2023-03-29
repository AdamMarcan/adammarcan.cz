$(function() {
//	$('.slidingDiv').hide();
//	$('.show_hide').show();

	$('.show_hide').on('click', function(event) {
		$('.slidingDiv').slideToggle();
		//event.preventDefault();
		//return false;
	});
});
