/**
 * 页面ready方法
 */
$(document).ready(function() {
    categoryDisplay();
});

/**
 * 分类展示
 * 点击右侧的分类展示时
 * 左侧的相关裂变展开或者收起
 * @return {[type]} [description]
 */
function categoryDisplay() {
    $('section[post-cate!=All]').hide();
    $('.categories-item').click(function() {
        var cate = $(this).attr('cate'); //get category's name
        $('section[post-cate!=' + cate + ']').hide(200);
        $('section[post-cate=' + cate + ']').show(200);
    });
}