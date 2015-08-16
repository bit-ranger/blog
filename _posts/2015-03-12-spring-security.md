---
layout: post
title: spring security 探秘
tags: spring security Java
categories: web
---

<div class="toc"></div>

#概述

[Spring Security][site]这是一种基于Spring AOP和Servlet过滤器的安全框架。它提供全面的安全性解决方案，同时在Web请求级和方法调用级处理身份确认和授权。在Spring Framework基础上，Spring Security充分利用了依赖注入（DI，Dependency Injection）和面向切面技术。

本文的宗旨并非描述如何从零开始搭建一个 "hello world" 级的demo，或者列举有哪些可配置项（这种类似于词典的文档，没有比[参考书][doc]更合适的了），而是简单描述spring-security项目的整体结构，设计思想，以及某些重要配置做了什么。

本文所有内容基于spring-security-4.0.1.RELEASE ,你可以在[Github][github]中找到它，或者使用Maven获取，引入spring-security-config是为了通过命名空间简化配置。


~~~xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-web</artifactId>
    <version>4.0.1.RELEASE</version>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-config</artifactId>
    <version>4.0.1.RELEASE</version>
</dependency>
~~~


#Filter

spring-security的业务流程是独立于项目的，我们需要在web.xml中指定其入口，注意该过滤器必须在项目的过滤器之前。

~~~xml
<filter>
    <filter-name>springSecurityFilterChain</filter-name>
    <filter-class>org.springframework.web.filter.DelegatingFilterProxy</filter-class>
</filter>
<filter-mapping>
    <filter-name>springSecurityFilterChain</filter-name>
    <servlet-name>/*</servlet-name>
</filter-mapping>
~~~

值得一提的是，该过滤器的名字具有特殊意义，没有特别需求不建议修改，我们可以在该过滤的源码中看到，其过滤行为委托给了一个`delegate`对象，该delegate对象是一个从spring容器中获取的bean，依据的beanid就是filter-name。

~~~java
@Override
protected void initFilterBean() throws ServletException {
	synchronized (this.delegateMonitor) {
		if (this.delegate == null) {
			// If no target bean name specified, use filter name.
			if (this.targetBeanName == null) {
				this.targetBeanName = getFilterName();
			}
			// Fetch Spring root application context and initialize the delegate early,
			// if possible. If the root application context will be started after this
			// filter proxy, we'll have to resort to lazy initialization.
			WebApplicationContext wac = findWebApplicationContext();
			if (wac != null) {
				this.delegate = initDelegate(wac);
			}
		}
	}
}
~~~


#HTTP

我们可以在security中声明多个`http`元素，每个http元素将产生一个`FilterChain`，这些FilterChain将按照声明顺序加入到`FilterChainProxy`中，而这个FilterChainProxy就是web.xml中定义的springSecurityFilterChain内部的`delegate`。

~~~xml
<security:http security="none" pattern="/favicon.ico" />
<security:http security="none" pattern="/resources/**" />
<security:http security="none" pattern="/user/login" />
~~~

在http元素也就是FilterChain中，以责任链的形式存在多个`Filter`，这些Filter真正执行过滤操作，http标签中的许多配置项，如` <security:http-basic/>`、`<security:logout/>`等，其实就是创建指定的Filter，以下表格列举了这些Filter。

![filter][filter]

利用别名，我们可以将自定义的过滤器加入指定的位置，或者替换其中的某个过滤器。

~~~xml
<security:custom-filter ref="filterSecurityInterceptor" before="FILTER_SECURITY_INTERCEPTOR" />
~~~

整体来看，一个FilterChainProxy中可以包含有多个FilterChain，一个FilterChain中又可以包含有多个Filter，然而对于一个既定请求，只会使用其中一个FilterChain。

#业务结构

如果一个http请求能够匹配security定义的规则，那么该请求将进入security业务流程，大体上，security分为三个部分：

* AuthenticationManager 处理认证请求
* AccessDecisionManager 提供访问决策
* SecurityMetadataSource 元数据

以下代码摘自`AbstractSecurityInterceptor`， 这是`FilterSecurityInterceptor`的父类， 也正是在此处区分了web请求拦截器与方法调用拦截器。(代码有所精简)

~~~java
protected InterceptorStatusToken beforeInvocation(Object object) {

	if (!getSecureObjectClass().isAssignableFrom(object.getClass())) {
		throw new IllegalArgumentException();
	}

	Collection<ConfigAttribute> attributes =
	        this.obtainSecurityMetadataSource().getAttributes(object);

	if (attributes == null || attributes.isEmpty()) {
		if (rejectPublicInvocations) {
			throw new IllegalArgumentException();
		}
		publishEvent(new PublicInvocationEvent(object));
		return null; // no further work post-invocation
	}

	if (SecurityContextHolder.getContext().getAuthentication() == null) {
	    //...
	}

	Authentication authenticated = authenticateIfRequired();

	// Attempt authorization
	try {
		this.accessDecisionManager.decide(authenticated, object, attributes);
	}
	catch (AccessDeniedException accessDeniedException) {
		publishEvent(new AuthorizationFailureEvent(object, attributes,
		            authenticated,accessDeniedException));
		throw accessDeniedException;
	}
}
~~~

在Filter的处理流程中，首先会处理认证请求，获取用户信息，然后决策处理器根据用户信息与权限元数据进行决策，同样，这三个部分都是可以自定义的。

~~~xml
<!-- 自定义过滤器 -->
<bean id="filterSecurityInterceptor"
            class="org.springframework.security.web.access.intercept.FilterSecurityInterceptor">
    <property name="securityMetadataSource" ref="securityMetadataSource"/>
    <property name="authenticationManager" ref="authenticationManager"/>
    <property name="accessDecisionManager" ref="accessDecisionManager"/>
</bean>
~~~


#AuthenticationManager

AuthenticationManager处理认证请求，然而它并不直接处理，而是将工作委托给了一个`ProviderManager`，ProviderManager又将工作委托给了一个`AuthenticationProvider`列表，只要任何一个AuthenticationProvider认证通过，则AuthenticationManager认证通过，我们可以配置一个或者多个AuthenticationProvider，还可以对密码进行加密。

~~~xml
<security:authentication-manager id="authenticationManager">
    <security:authentication-provider user-service-ref="userDetailsService" >
        <security:password-encoder base64="true" hash="md5">
            <security:salt-source user-property="username"/>
        </security:password-encoder>
    </security:authentication-provider>
</security:authentication-manager>
~~~

考虑到一种常见情形，用户输入用户名密码，然后与数据比对，验证用户信息，security提供了类来处理。

~~~xml
<bean id="userDetailsService"
            class="org.springframework.security.core.userdetails.jdbc.JdbcDaoImpl" >
     <property name="dataSource" ref="dataSource"/>
</bean>
~~~
JdbcDaoImpl使用内置的SQL查询数据，这些SQL以常量的形式出现在JdbcDaoImpl开头，同样可以注入修改。

每次登陆都执行一次SQL可能会存在性能问题，如果用户表数据量不太大，可以考虑缓存，Security可以方便地使用ehcache

~~~ xml
<bean id="ehcache" class="org.springframework.cache.ehcache.EhCacheFactoryBean"/>

<!-- 可以缓存UserDetails的UserDetailsService -->
<bean id="cachingUserDetailsService"
            class="org.springframework.security.config.authentication.CachingUserDetailsService">
    <!-- 真正加载UserDetails的UserDetailsService -->
    <constructor-arg ref="userDetailsService"/>
    <!-- 缓存UserDetails的UserCache -->
    <property name="userCache" ref="userCache"/>
</bean>
<bean id="userCache"
            class="org.springframework.security.core.userdetails.cache.EhCacheBasedUserCache">
    <!-- 用于真正缓存的Ehcache对象 -->
    <property name="cache" ref="ehcache"/>
</bean>
~~~
然后用`cachingUserDetailsService`代替`authentication-provider`处的`userDetailsService`。



#AccessDecisionManager

AccessDecisionManager提供访问决策，它同样不会直接处理，而是仅仅抽象为一种投票规则，然后决策行为委托给所有投票人。

~~~xml
<!-- 决策管理器 -->
<bean id="accessDecisionManager"
            class="org.springframework.security.access.vote.AffirmativeBased" >
    <property name="allowIfAllAbstainDecisions" value="false"/>
    <constructor-arg index="0">
        <list>
           <!-- <bean class="org.springframework.security.web.access.expression.WebExpressionVoter"/>-->
            <bean class="org.springframework.security.access.vote.RoleVoter">
                <!-- 支持所有角色名称，无需前缀 -->
                <property name="rolePrefix" value=""/>
            </bean>
            <bean class="org.springframework.security.access.vote.AuthenticatedVoter"/>
        </list>
    </constructor-arg>
</bean>
~~~

security提供了三种投票规则：

* AffirmativeBased 只要有一个voter同意就通过
* ConsensusBased 只要投同意票的大于投反对票的就通过
* UnanimousBased 需要一致同意才通过

以下为`AffirmativeBased`决策过程

~~~java
public void decide(Authentication authentication, Object object,
		Collection<ConfigAttribute> configAttributes) throws AccessDeniedException {
	int deny = 0;

	for (AccessDecisionVoter voter : getDecisionVoters()) {
		int result = voter.vote(authentication, object, configAttributes);

		if (logger.isDebugEnabled()) {
			logger.debug("Voter: " + voter + ", returned: " + result);
		}

		switch (result) {
		case AccessDecisionVoter.ACCESS_GRANTED:
			return;

		case AccessDecisionVoter.ACCESS_DENIED:
			deny++;

			break;

		default:
			break;
		}
	}

	if (deny > 0) {
		throw new AccessDeniedException(messages.getMessage(
				"AbstractAccessDecisionManager.accessDenied", "Access is denied"));
	}

	// To get this far, every AccessDecisionVoter abstained
	checkAllowIfAllAbstainDecisions();
}
~~~


#SecurityMetadataSource

SecurityMetadataSource定义权限元数据，即资源与角色的关系，并提供了一个核心方法`Collection<ConfigAttribute> getAttributes(Object object)`来获取资源对应的角色列，这种结构非常类似于Map。

security提供了`DefaultFilterInvocationSecurityMetadataSource`来进行角色读取操作，并将数据存储委托给一个`LinkedHashMap`对象。

~~~xml
<!-- 资源与角色关系元数据 -->
<bean id="securityMetadataSource"
            class="org.springframework.security.web.access.intercept.DefaultFilterInvocationSecurityMetadataSource">
    <constructor-arg index="0">
        <bean class="top.rainynight.site.core.RequestMapFactoryBean">
            <property name="dataSource" ref="dataSource"/>
        </bean>
    </constructor-arg>
</bean>
~~~

DefaultFilterInvocationSecurityMetadataSource获取角色方法

~~~java
public Collection<ConfigAttribute> getAttributes(Object object) {
	final HttpServletRequest request = ((FilterInvocation) object).getRequest();
	for (Map.Entry<RequestMatcher, Collection<ConfigAttribute>> entry : requestMap
			.entrySet()) {
		if (entry.getKey().matches(request)) {
			return entry.getValue();
		}
	}
	return null;
}
~~~

除此之外，还需要定义如何匹配资源，比元数据中定义的资源格式为`/user/**`，那么形如`/user/1`的资源应该匹配，针对这类情形，security提供了大量的类供客户使用，此处使用`AntPathRequestMatcher`。



#源码

上节配置中的`RequestMapFactoryBean`为自定义工厂类，使用工厂注入的方法提供`LinkedHashMap`对象，以下为该类的源代码：

~~~java
import org.springframework.beans.factory.FactoryBean;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.support.JdbcDaoSupport;
import org.springframework.security.access.ConfigAttribute;
import org.springframework.security.access.SecurityConfig;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

public class RequestMapFactoryBean extends JdbcDaoSupport implements FactoryBean<LinkedHashMap<RequestMatcher, Collection<ConfigAttribute>>> {

    private final static String METADATA_QUERY = "SELECT w.sequence,w.pattern,r.name FROM webresource w LEFT JOIN securitymetadata s on w.id = s.webResource_id LEFT JOIN role r ON r.id = s.role_id";

    private String metadataQuery;

    private LinkedHashMap<RequestMatcher, Collection<ConfigAttribute>> requestMap;

    public RequestMapFactoryBean(){
        metadataQuery = METADATA_QUERY;
    }

    @Override
    public LinkedHashMap<RequestMatcher, Collection<ConfigAttribute>> getObject() throws Exception {
        if (this.requestMap == null) {
            fill();
        }
        return this.requestMap;
    }

    @Override
    public Class<?> getObjectType() {
        if (requestMap != null) {
            return requestMap.getClass();
        }
        return LinkedHashMap.class;
    }

    @Override
    public boolean isSingleton() {
        return true;
    }

    private void fill() {
        Set<Metadata> metadataList = new TreeSet<Metadata>(loadMetadata()) ;
        requestMap = new LinkedHashMap<RequestMatcher, Collection<ConfigAttribute>>();
      /*  RequestMatcher matcher = new AntPathRequestMatcher("/user*//**");
        Collection<ConfigAttribute> attributes = SecurityConfig.createListFromCommaDelimitedString("ROLE_userAdmin");
        requestMap.put(matcher, attributes);*/

        for (Metadata metadata : metadataList) {
            RequestMatcher matcher = new AntPathRequestMatcher(metadata.pattern);
            Collection<ConfigAttribute> attributes = requestMap.get(matcher);
            if(attributes == null){
                attributes = new ArrayList<ConfigAttribute>();
                requestMap.put(matcher, attributes);
            }
            attributes.add(new SecurityConfig(metadata.role));
        }
    }


    protected List<Metadata> loadMetadata() {
        return getJdbcTemplate().query(metadataQuery, new String[]{},
                new RowMapper<Metadata>() {
                    public Metadata mapRow(ResultSet rs, int rowNum) throws SQLException {
                        int sequence = rs.getInt(1);
                        String pattern = rs.getString(2);
                        String role = rs.getString(3);
                        return new Metadata(sequence, pattern, role);
                    }
                });
    }

    public void setMetadataQuery(String metadataQuery) {
        this.metadataQuery = metadataQuery;
    }

    protected static class Metadata implements Comparable<Metadata>{

        private Metadata(int sequence, String pattern, String role){
            this.sequence = sequence;
            this.pattern = pattern;
            this.role = role;
        }

        private int sequence;
        private String pattern;
        private String role;

        @Override
        public int compareTo(Metadata o) {
            return this.sequence - o.sequence;
        }
    }
}

~~~

以下为完整的Security配置文件

~~~xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:security="http://www.springframework.org/schema/security"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
       http://www.springframework.org/schema/security http://www.springframework.org/schema/security/spring-security.xsd">


    <!-- 当指定一个http元素的security属性为none时，表示其对应pattern的filter链为空 -->
    <security:http security="none" pattern="/favicon.ico" />
    <security:http security="none" pattern="/resources/**" />
    <security:http security="none" pattern="/user/login"/>


    <security:http pattern="/user/**"
                   authentication-manager-ref="authenticationManager"
                   access-decision-manager-ref="accessDecisionManager"
                   use-expressions="true">

        <!--<security:form-login />-->
        <security:http-basic/>

        <security:logout delete-cookies="JSESSIONID" logout-success-url="/" logout-url="/user/logout"/>

        <security:custom-filter ref="filterSecurityInterceptor" before="FILTER_SECURITY_INTERCEPTOR"/>

    </security:http>

    <!-- 自定义过滤器 -->
    <bean id="filterSecurityInterceptor" class="org.springframework.security.web.access.intercept.FilterSecurityInterceptor">
        <property name="securityMetadataSource" ref="securityMetadataSource"/>
        <property name="authenticationManager" ref="authenticationManager"/>
        <property name="accessDecisionManager" ref="accessDecisionManager"/>
        <property name="messageSource" ref="securityMessageSource"/>
    </bean>

    <!-- 资源与角色关系元数据 -->
    <bean id="securityMetadataSource" class="org.springframework.security.web.access.intercept.DefaultFilterInvocationSecurityMetadataSource">
        <constructor-arg index="0">
            <bean class="top.rainynight.site.core.RequestMapFactoryBean">
                <property name="dataSource" ref="dataSource"/>
            </bean>
        </constructor-arg>
    </bean>

    <!-- 认证管理器。用户名密码都集成在配置文件中 -->
    <security:authentication-manager id="authenticationManager">
 <!--       <security:authentication-provider>
            &lt;!&ndash; InMemoryDaoImpl &ndash;&gt;
            <security:user-service>
                <security:user name="sharp" password="sharp" authorities="ROLE_TEST"/>
            </security:user-service>
        </security:authentication-provider>-->
        <security:authentication-provider user-service-ref="cachingUserDetailsService" >
           <!-- <security:password-encoder base64="true" hash="md5">
                <security:salt-source user-property="username"/>
            </security:password-encoder>-->
        </security:authentication-provider>
    </security:authentication-manager>

    <!-- 可以缓存UserDetails的UserDetailsService -->
    <bean id="cachingUserDetailsService" class="org.springframework.security.config.authentication.CachingUserDetailsService">
        <!-- 真正加载UserDetails的UserDetailsService -->
        <constructor-arg ref="userDetailsService"/>
        <!-- 缓存UserDetails的UserCache -->
        <property name="userCache" ref="userCache"/>
    </bean>
    <bean id="userCache" class="org.springframework.security.core.userdetails.cache.EhCacheBasedUserCache">
        <!-- 用于真正缓存的Ehcache对象 -->
        <property name="cache" ref="ehcache"/>
    </bean>

    <bean id="userDetailsService" class="org.springframework.security.core.userdetails.jdbc.JdbcDaoImpl">
            <property name="dataSource" ref="dataSource"/>
            <!-- 查询出的角色名称不添加前缀 -->
            <property name="rolePrefix" value=""/>
            <property name="usersByUsernameQuery" value="SELECT name,password,enabled FROM user WHERE name = ?"/>
            <property name="authoritiesByUsernameQuery"
                      value="SELECT u.name as username,role.name as rolename FROM (select id,name FROM user WHERE name = ?) AS u
                                INNER JOIN user_role ON u.id = user_role.user_id
                                INNER JOIN role ON user_role.role_id = role.id"/>
            <property name="enableGroups" value="true"/>
            <property name="groupAuthoritiesByUsernameQuery"
                      value="SELECT colony.name as colonyname,colony.description as colonydesc,role.name as rolename FROM
                                (SELECT colony_id FROM (SELECT id FROM user WHERE name = ?) as u
                                INNER JOIN user_colony ON u.id = user_colony.user_id) AS g
                                INNER JOIN colony ON g.colony_id = colony.id
                                INNER JOIN colony_role ON colony.id = colony_role.colony_id
                                INNER JOIN role ON colony_role.role_id = role.id"/>
    </bean>

    <!-- 决策管理器 -->
    <bean id="accessDecisionManager" class="org.springframework.security.access.vote.AffirmativeBased" >
        <property name="allowIfAllAbstainDecisions" value="false"/>
        <constructor-arg index="0">
            <list>
               <!-- <bean class="org.springframework.security.web.access.expression.WebExpressionVoter"/>-->
                <bean class="org.springframework.security.access.vote.RoleVoter">
                    <!-- 支持所有角色名称，无需前缀 -->
                    <property name="rolePrefix" value=""/>
                </bean>
                <bean class="org.springframework.security.access.vote.AuthenticatedVoter"/>
            </list>
        </constructor-arg>
    </bean>


    <bean id="securityMessageSource" class="org.springframework.context.support.ReloadableResourceBundleMessageSource">
        <property name="basenames">
            <list>
                <value>classpath:messages/securityMessages</value>
                <value>classpath:org/springframework/security/messages</value>
            </list>
        </property>
        <property name="useCodeAsDefaultMessage" value="false"/>
        <property name="defaultEncoding" value="UTF-8"/>
        <property name="cacheSeconds" value="60"/>
    </bean>

</beans>
~~~

建表语句

~~~mysql

drop table if exists SecurityMetadata;

drop table if exists colony_role;

drop table if exists user_colony;

drop table if exists user_role;

drop table if exists colony;

drop table if exists role;

drop table if exists user;

drop table if exists webResource;




/*==============================================================*/
/* Table: SecurityMetadata                                      */
/*==============================================================*/
create table SecurityMetadata
(
   id                   int not null auto_increment comment 'ID',
   webResource_id       int not null comment '资源ID',
   role_id              int not null comment '角色ID',
   primary key (id),
   unique key UK_SecurityMetadata (webResource_id, role_id)
);

/*==============================================================*/
/* Table: colony                                                */
/*==============================================================*/
create table colony
(
   id                   int not null auto_increment comment 'ID',
   name                 varchar(50) not null comment '名称',
   description          varchar(100) not null comment '描述',
   primary key (id),
   unique key UK_colony (name)
);

alter table colony comment '群体';

/*==============================================================*/
/* Table: colony_role                                           */
/*==============================================================*/
create table colony_role
(
   id                   int not null auto_increment comment 'ID',
   role_id              int not null comment '角色ID',
   colony_id            int not null comment '群体ID',
   primary key (id),
   unique key UK_colony_role (role_id, colony_id)
);

alter table colony_role comment '群体角色';

/*==============================================================*/
/* Table: role                                                  */
/*==============================================================*/
create table role
(
   id                   int not null auto_increment comment 'ID',
   name                 varchar(50) not null comment '名称',
   description          varchar(100) not null comment '描述',
   primary key (id),
   unique key UK_role (name)
);

alter table role comment '角色';

/*==============================================================*/
/* Table: user                                                  */
/*==============================================================*/
create table user
(
   id                   int not null auto_increment comment 'ID',
   name                 varchar(50) not null comment '用户名',
   password             varchar(50) not null comment '密码',
   enabled              boolean not null comment 'true : 可用,  false : 不可用',
   primary key (id),
   unique key UK_name (name)
);

alter table user comment '用户';

/*==============================================================*/
/* Table: user_colony                                           */
/*==============================================================*/
create table user_colony
(
   id                   int not null auto_increment comment 'ID',
   user_id              int not null comment '用户ID',
   colony_id            int not null comment '群体ID',
   primary key (id),
   unique key UK_user_colony (user_id, colony_id)
);

alter table user_colony comment '用户群体';

/*==============================================================*/
/* Table: user_role                                             */
/*==============================================================*/
create table user_role
(
   id                   int not null auto_increment comment 'ID',
   user_id              int not null comment '用户ID',
   role_id              int not null comment '角色ID',
   primary key (id),
   unique key UK_user_role (user_id, role_id)
);

alter table user_role comment '用户角色';

/*==============================================================*/
/* Table: webResource                                           */
/*==============================================================*/
create table webResource
(
   id                   int not null auto_increment comment 'ID',
   pattern              varchar(100) not null comment 'URI模式',
   sequence             int not null comment '排序号',
   primary key (id),
   unique key UK_pattern (pattern),
   unique key UK_sequence (sequence)
);

alter table webResource comment '系统资源';

alter table SecurityMetadata add constraint FK_SecurityMetadata_Reference_role foreign key (role_id)
      references role (id) on delete restrict on update restrict;

alter table SecurityMetadata add constraint FK_SecurityMetadata_Reference_webResource foreign key (webResource_id)
      references webResource (id) on delete restrict on update restrict;

alter table colony_role add constraint FK_colony_role_Reference_colony foreign key (colony_id)
      references colony (id) on delete restrict on update restrict;

alter table colony_role add constraint FK_colony_role_Reference_role foreign key (role_id)
      references role (id) on delete restrict on update restrict;

alter table user_colony add constraint FK_user_colony_Reference_colony foreign key (colony_id)
      references colony (id) on delete restrict on update restrict;

alter table user_colony add constraint FK_user_colony_Reference_user foreign key (user_id)
      references user (id) on delete restrict on update restrict;

alter table user_role add constraint FK_user_role_Reference_role foreign key (role_id)
      references role (id) on delete restrict on update restrict;

alter table user_role add constraint FK_user_role_Reference_user foreign key (user_id)
      references user (id) on delete restrict on update restrict;

~~~

[site]: http://projects.spring.io/spring-security
[github]: https://github.com/spring-projects/spring-security
[filter]: {{"/spring-security-filter.png" | prepend: site.imgrepo }}
[doc]: http://docs.spring.io/spring-security/site/docs/4.0.1.RELEASE/reference/htmlsingle/
