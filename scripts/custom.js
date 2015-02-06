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
    var $obj = $(this);
    $obj.parents(".dropdown").removeClass("open");
    var tar = $obj.attr('href');
    if(tar == "#" || !tar){
        tar = $root;
    }
    $root.animate({
        scrollTop: $(tar).offset().top - 100
    }, 800);
    return false;
});
