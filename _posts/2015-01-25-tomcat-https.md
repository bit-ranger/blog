---
layout:default
title:Tomcat Https 配置
---

####`1`.生成服务端证书库

```bash
keytool 
    –genkey
    –keyalg 算法(通常用RSA)
    –dname "cn=服务器名,
            ou=组织单位名,
            o=组织名,
            l=城市名,
            st=省/市/自治区,
            c=国家双字母代码"
    -alias 别名(非必选项)
    -keypass 密码
    -keystore 生成的证书库名.jks
    -storepass 密码
    -validity 有效天数
```
 
####`2`.生成浏览器证书文件

```bash
keytool
    -export 
    -keystore 服务端证书库文件名
    -alias 服务端证书库别名(非必选项)
    -storepass 服务端证书库密码
    -file 生成的证书文件名.crt
```

####`3`.生成证书私钥文件

```bash
keytool 
    -importkeystore 
    -srckeystore 服务端证书库文件名
    -destkeystore p12文件名.p12
    -deststoretype PKCS12

openssl 
	pkcs12 
	-in p12文件名
	-out 生成的pem文件名.pem 
	-nodes
```

####`4`.Tomcat配置

打开 %CATALINA_HOME%/conf/server.xml 
解开注释或添加代码

```xml
<Connector port="8443" protocol="HTTP/1.1" SSLEnabled="true"
    maxThreads="150" scheme="https" secure="true"
    clientAuth="false" sslProtocol="TLS" 
    SSLCertificateFile="浏览器证书文件.crt"   
    SSLCertificateKeyFile="证书私钥文件.pem"/>
```

####`5`.强制https访问

打开 %CATALINA_HOME%/conf/web.xml 
添加代码

```xml
<!-- SSL -->
<login-config>  
    <!-- Authorization setting for SSL -->  
    <auth-method>CLIENT-CERT</auth-method>  
    <realm-name>Client Cert Users-only Area</realm-name>  
</login-config>  
<security-constraint>  
    <!-- Authorization setting for SSL -->  
    <web-resource-collection >  
        <web-resource-name >SSL</web-resource-name>  
        <url-pattern>/*</url-pattern>  
    </web-resource-collection>  
    <user-data-constraint>  
        <transport-guarantee>CONFIDENTIAL</transport-guarantee>  
    </user-data-constraint>  
</security-constraint> 
```
