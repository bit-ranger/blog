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