/**
 * 页面ready方法
 */
$(document).ready(function() {
    categoryDisplay();
    $('.tagCloud').tagCloud();
});

/**
 * 分类展示
 * 点击右侧的分类展示时
 * 左侧的相关裂变展开或者收起
 * @return {[type]} [description]
 */
function categoryDisplay() {
    selectCategory();
    $('.categories-item').click(function() {
        window.location.hash = "#" + $(this).attr("cate");
        selectCategory();
    });
}

function selectCategory(){
    var thisId = window.location.hash.substring(1);
    if(thisId != "" && thisId != undefined){
        var cate = thisId;
        $('section[post-cate!=' + cate + ']').hide(200);
        $('section[post-cate=' + cate + ']').show(200);
    } else {
        $("section[post-cate='All']").show();
    }
}