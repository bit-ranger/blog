/**
 * 页面ready方法
 */
$(document).ready(function() {
    generateContent();
    share();
    duoshuoQueryFunction();
});

/**
 * 侧边目录
 */
function generateContent() {
    var $mt = $('.toc');
    var $toc;
    $mt.each(function(i,o){
        $toc = $(o);
        $toc.toc({ listType: 'ul' });
    });

    var toc = $toc.html();
    if (typeof toc != "undefined") {
        $(".content-navigation").addClass("col-lg-3").show();
        $(".content").addClass("col-lg-9");
        $(".content-navigation .content-navigation-text").html(toc);
    }
}

function share(){
    window._bd_share_config={"common":{"bdSnsKey":{},"bdText":"","bdMini":"2","bdMiniList":false,"bdPic":"","bdStyle":"1","bdSize":"24"},"share":{}};
    with(document)0[getElementsByTagName("script")[0].parentNode.appendChild(createElement('script')).src='http://bdimg.share.baidu.com/static/api/js/share.js?v=89860593.js?cdnversion='+~(-new Date()/36e5)];
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
    document.getElementsByTagName("script")[0].parentNode.appendChild(ds);
}