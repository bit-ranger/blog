# 博客地址

<https://bit-ranger.github.io/blog/>

# 必改内容

## 1.swiftype

此服务提供站内搜索功能

服务地址：<https://swiftype.com/>

设置方法可参考 <http://opiece.me/2015/04/16/site-search-by-swiftype/>

设置完毕后，您需要修改 `_config.yml` 中 `swiftype.searchId`。

在自己的引擎中，进入 `Setup and integration` -> `Install Search`, 你将找到 `swiftype.searchId`。

```html
<script type="text/javascript">
...
...
  _st('install','swiftype.searchId','2.0.0');
</script>
```

## 2.gitment

此服务提供评论功能

服务地址：<https://github.com/imsun/gitment>

设置完毕后, 需要修改 `_config.yml` 中的 `gitment`。
