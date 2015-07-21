---
layout: post
title: 表单乱码分析
tags: form encode
categories: web
---

我们知道，web浏览器会将form中的内容打包成HTTP请求体，然后发送到服务端，服务端对请求体解析后可以得到传递的数据。这当中包含两个过程：`decode`与`encode`。

#decode

`decode`的任务是将form中的数据通过某种字符编码转换成二进制，那么究竟是什么字符编码呢？答案是：看文件编码。

如果用于form页面是一个本地html，那么文件编码不言而喻；如果form页面是从服务器上下载的，那么文件编码取决于下载时response中的contentType，我们通常可以在jsp中看到这样的设置：

~~~java
<%@page contentType="text/html;charset=UTF-8" %>
~~~

#encode

`encode`的任务是将请求中的二进制转换成字符，显而易见的是，使用与`decode`时相同的字符编码才能成功转换。然而`decode`时采用的字符编码从服务端无法获知，更不能预先假定。

针对这种情况，我们通常人为限定地客户端(html)与服务端的编码，以保证两者能够一致。客户端做法就是增加在jsp头部指定字符编码，而服务端的做法是增加一个设置字符编码的过滤器：

~~~java
requet.setCharacterEncoding("UTF-8");
~~~

实际上，该过滤器并没有进行任何编码转换的工作，它仅仅只是一个配置，该配置项将被后续程序使用，这些后续程序包括web服务器内置的解析程序，以及由开发者配置的文件上传组件等。

需要注意的是，`requet.setCharacterEncoding("UTF-8");`，只对请求体有效，也就是说，请求头不归它管，而是由web服务器采用自己配置的字符编码进行解析，此时如果url中包含中文（如get请求的参数），那么将不可避免地出现字符丢失。解决办法一是在客户端对url进行`URLencodeing`,二是设置web服务器字符编码使三者一致。