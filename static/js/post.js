---
    layout: null
---

/**
 * 页面ready方法
 */
$(document).ready(function() {
    generateContent();
    share();
    gitment();
    // disqus();
});

/**
 * 侧边目录
 */
function generateContent() {
    var $mt = $('.toc');
    var toc = $(".post ul#markdown-toc").clone().get(0);
    $mt.each(function(i,o){
        $(o).html(toc);
    });
}

function share(){
    window._bd_share_config={"common":{"bdSnsKey":{},"bdText":"","bdMini":"2","bdMiniList":false,"bdPic":"","bdStyle":"1","bdSize":"24"},"share":{}};
    with(document)0[getElementsByTagName("script")[0].parentNode.appendChild(createElement('script')).src='http://bdimg.share.baidu.com/static/api/js/share.js?v=89860593.js?cdnversion='+~(-new Date()/36e5)];
}


function gitment() {
    var gitment = new Gitment({
        id: 'window.location.pathname', // 可选。默认为 location.href
        owner: 'WakelessDragon',
        repo: 'blog',
        oauth: {
            client_id: 'a6fb73b3e790e234bab8',
            client_secret: 'cc10aaff53a03d05ab2ee002dbf401dd7627c7a3',
        },
    });
    gitment.render('#post-comment')
}


function disqus(){
    /* * * CONFIGURATION VARIABLES * * */
    var disqus_shortname = '{{site.disqus_shortname}}';

    var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
    dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
    dsq.onload = function(){
        $("#post-comment").removeClass('hidden');
    }
    document.getElementsByTagName("script")[0].parentNode.appendChild(dsq);
}


