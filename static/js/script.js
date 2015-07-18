/**
 * 页面ready方法
 */
$(document).ready(function() {

    console.log("你不乖哦，彼此之间留点神秘感不好吗？");

    backToTop();
    search();
    duoshuoQueryFunction();

});

function search(){
    (function(w,d,t,u,n,s,e){w['SwiftypeObject']=n;w[n]=w[n]||function(){
        (w[n].q=w[n].q||[]).push(arguments);};s=d.createElement(t);
        e=d.getElementsByTagName(t)[0];s.async=1;s.src=u;e.parentNode.insertBefore(s,e);
    })(window,document,'script','//s.swiftypecdn.com/install/v2/st.js','_st');

    _st('install','WyVgxJw2ypny5Feaxyrs','2.0.0');
}

/**
 * 回到顶部
 */
function backToTop() {
    $("[data-toggle='tooltip']").tooltip();
    var st = $(".page-scrollTop");
    var $window = $(window);
    //滚页面才显示返回顶部
    $window.scroll(function() {
        if ($window.scrollTop() > 0) {
            st.fadeIn(500);
        } else {
            st.fadeOut(500);
        }
    });

    //点击回到顶部
    st.click(function() {
        $("body").animate({
            scrollTop: "0"
        }, 500);
    });


}



/**
 * 多说
 */
function duoshuoQueryFunction(){
    window.duoshuoQuery = {short_name:"rainynight"};
	var ds = document.createElement('script');
	ds.type = 'text/javascript';
	ds.async = true;
	ds.src = (document.location.protocol == 'https:' ? 'https:' : 'http:') + '//static.duoshuo.com/embed.js';
	ds.charset = 'UTF-8';
	document.body.appendChild(ds);
}



