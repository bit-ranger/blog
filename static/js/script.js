/**
 * 页面ready方法
 */
$(document).ready(function() {

    console.log("你不乖哦，彼此之间留点神秘感不好吗？");

    categoryDisplay();
    generateContent();
    backToTop();
	enlargement();
	duoshuoQueryFunction();
});

/**
 * 分类展示
 * 点击右侧的分类展示时
 * 左侧的相关裂变展开或者收起
 * @return {[type]} [description]
 */
function categoryDisplay() {
    /*only show All*/
    $('.post-list-body>div[post-cate!=All]').hide();
    /*show category when click categories list*/
    $('.categories-list-item').click(function() {
        var cate = $(this).attr('cate'); //get category's name

        $('.post-list-body>div[post-cate!=' + cate + ']').hide(250);
        $('.post-list-body>div[post-cate=' + cate + ']').show(400);
    });
}

/**
 * 回到顶部
 */
function backToTop() {
    //滚页面才显示返回顶部
    $(window).scroll(function() {
        if ($(window).scrollTop() > 100) {
            $(".page-scrollTop").fadeIn(500);
        } else {
            $(".page-scrollTop").fadeOut(500);
        }
    });
    //点击回到顶部
    $(".page-scrollTop").click(function() {
        $("body").animate({
            scrollTop: "0"
        }, 500);
    });

    //初始化tip
    $(function() {
        $("[data-toggle='tooltip']").tooltip();
    });
}


/**
 * 侧边目录
 */
function generateContent() {

    if (typeof $("#markdown-toc").html() === "undefined") {
        $(".content-navigation").hide();
        $(".myArticle").removeClass("col-sm-9").addClass("col-sm-12");
    } else {
        $(".content-navigation .content-navigation-text").html("<ul>" + $("#markdown-toc").html() + "</ul>");
    }
}

/**
 * 图片放大
 */
function enlargement(){
	$(".post article img").each(function(i,e){
		e = $(e);
		var wrap = document.createElement("a"); 
		wrap.class = "img-box-item-wrap";
		wrap.href = e.attr("src");
		e.wrap(wrap);
	});
	$("img-box-item-wrap").imgbox({
	  alignment: 'auto',
	  overlayShow: false,
	  hideOnContentClick: true,
	  slideshow: false,
	  theme: 'dark'
	});
}

/**
 * 多说
 */
function duoshuoQueryFunction(){
	duoshuoQuery = {short_name:"rainynight"};
	var ds = document.createElement('script');
	ds.type = 'text/javascript';
	ds.async = true;
	ds.src = (document.location.protocol == 'https:' ? 'https:' : 'http:') + '//static.duoshuo.com/embed.js';
	ds.charset = 'UTF-8';
	(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(ds);
}