/**
 * 页面ready方法
 */
$(document).ready(function() {

    console.log("你不乖哦，彼此之间留点神秘感不好吗？");

    generateContent();
    hljs.initHighlightingOnLoad();
    backToTop();
    categoryDisplay();
    duoshuoQueryFunction();
    share();
});

/**
 * 侧边目录
 */
function generateContent() {
    var toc = $("#markdown-toc").html();
    if (typeof toc != "undefined") {
        $(".content-navigation").addClass("col-sm-3").show();
        $(".myArticle").addClass("col-sm-9");
        $(".content-navigation .content-navigation-text").html("<ul>" + toc + "</ul>");
    }
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
 * 分类展示
 * 点击右侧的分类展示时
 * 左侧的相关裂变展开或者收起
 * @return {[type]} [description]
 */
function categoryDisplay() {
    $('.post-list-body>div[post-cate!=All]').hide();
    $('.categories-list-item').click(function() {
        var cate = $(this).attr('cate'); //get category's name
        $('.post-list-body>div[post-cate!=' + cate + ']').hide();
        $('.post-list-body>div[post-cate=' + cate + ']').show(200);
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



function share(){
    window._bd_share_config={"common":{"bdSnsKey":{},"bdText":"","bdMini":"2","bdMiniList":false,"bdPic":"","bdStyle":"1","bdSize":"24"},"share":{}};
    with(document)0[body.appendChild(createElement('script')).src='http://bdimg.share.baidu.com/static/api/js/share.js?v=89860593.js?cdnversion='+~(-new Date()/36e5)];
}