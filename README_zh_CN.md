# 博客地址

<http://blog.rainyalley.com/>

# 必改内容

## 1.swiftype

此服务提供站内搜索功能

服务地址：<https://swiftype.com/>

设置方法可参考 <http://opiece.me/2015/04/16/site-search-by-swiftype/>

设置完毕后，您需要修改 `_config.yml` 中 `swiftype_searchId`。


## 2.disqus

此服务提供评论功能

服务地址：<https://disqus.com/>

设置方法可参考 <http://blog.ihurray.com/blog/Disqus-learning.php>

设置完毕后, 你需要修改 `_config.yml` 中的 `disqus_shortname` ,否则对您博客的评论将归到本人名下。

# 其他

`_config.yml` 中的 `imgrepo`  是一个图片库。

这样设置可以使图片能够方便地迁移到第三方图片存储服务。

你需要在文章里这样引用图片 '{{"/rmi.jpg" | prepend: site.imgrepo }}'。
