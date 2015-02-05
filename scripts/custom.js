$("body").click(
    function(){
        var $pager_btn = $(".pager-btn");
        if($pager_btn.css("display")=="none"){
            $pager_btn.css("display","block");
        } else {
            $pager_btn.css("display","none");
        }
    }
);
var $root = $("html, body");
$("a[href*='#']").click(function() {
    var tar = $.attr(this, 'href');
    if(tar == "#" || !tar){
        tar = $root;
    }
    $root.animate({
        scrollTop: $(tar).offset().top
    }, 800);
    return false;
});