$(document).ready(() => {
    setTimeout(() => {
        $("#try-typing").fadeIn();
    }, 1000);
});

$("#type-contents").click(()=>{
    $('#demo').load(function(){
        $('#demo').contents().find('input#query').focus();
        console.log();
    });
});

function simulateKeyPress(character) {
    jQuery.event.trigger({ type : 'keypress', which : character.charCodeAt(0) });
}