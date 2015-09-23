---
layout: post
title: scheme 解释器
tags: lisp scheme eval
categories: lisp
---

前段时间针对 [scheme][scheme] 语言写了一个解释器，现在就 `fork` 一下当时想法，整理一下其中的脉络，做一个思维快照，以期下次用 `C` 来实现时可以顺利地进行。
成品在此：[scheme-bootstrap][scheme-bootstrap]。

# 词法作用域

一条语句，在不同的函数当中可能具备不同的含义，其中变量的值取决于具体的作用域，所以对一条语句进行解释时需要考虑当时的上下文。
然而lisp是一种函数式的编程语言，函数可以被当成数据来进行传递，这会产生一个问题，如果函数体中存在自由变量，那么这个函数的行为将产生不可控的变化，
问题重点不是变化，而是不可控，在语言的使用者不需要函数行为变化的时候，自由变量会从外部作用域取值，自动产生行为的变化。
这种作用域叫做动态作用域 （Dynamic scope ）

像java，javascript之类的语言，都是在对象内部维护一个成员变量，函数中自由的局部变量根据这个成员变量的值来确定行为，虽然函数的行为都可变，但它是可控的。
为了实现可控，我们需要让语言满足人的直觉，即作用域和手写的代码结构相同，即使一个函数会被传递，其内部变量的值也应当追溯到函数定义时的作用域中。
这种作用域就叫做词法作用域 （Lexical scope）

显然，实现词法作用域比动态作用域复杂些。实现动态作用域时，函数传递只要传递函数文本，然后插入到调用语句中进行解释就行了；
而词法作用域需要为每个被传递的函数绑定一个定义时的作用域，通常将被传递函数体与定义时的作用域打包成一个数据结构，这个结构叫做`闭包`。
javascript就是使用闭包传递函数的。

# 抽象语法树

语言被写下来之后只是一个文本，其内容是对某种数据结构的形式化描述，在对语言进行解释前，必须先对这个文本进行解析，让其描述的结构出现在内存中，这种结构叫做抽象语法树 （AST）。
这个过程比较乏味，无非是对字符串进行扫描，发现嵌套括号就将其作为树中的一个节点。为了跳过这个过程，我选择用scheme来写解释器，lisp 天生就适合进行这样的表处理。
类似这样用自己来解释自己的行为叫做自举。

# 语法

解释器逐行解释语句，那么碰到不同的语法关键字时应当触发不同的解释行为。

- **自求值表达式**

当碰到数字和字符串时，表示这是一个自求值表达式，即写下的文本就是值。

- **quote**

```scheme
(quote foo)
```
引号表达式的值是去掉引号后的内容，其中 `'foo` 等价于 `(quote foo)`。

- **begin**

```scheme
(begin s1 s2)
```

begin 表达式表示其内容是顺序的多条语句，某些表达式只能支持单一的语句，用begin包裹这些语句后，就能当做一条语句使用。

- **if**

```scheme
(if <predicate> <consequent> <alternative> )
```

对if的处理是非常容易的，解释器先对 `predicate` 求值，如果值为真则对 `consequent` 求值，否则对 `alternative` 求值。

- **lambda**

```scheme
(lambda (x y)
    (+ x y))
```

lambda 表达式表示一个函数，对其求值就是将函数体，形参列表，作用域打包。

- **define**

```scheme
(define var Foo)
```

define 表达式表示定义，处理方式是求出 `Foo` 的值然后与 `var` 绑定，放入到当前作用域中。这个过程中隐含了对函数的定义，因为 `Foo` 可能就是一个lambda。

- **set!**

```scheme
(set! var Foo)
```

set! 语句提供了修改变量值的能力，如果没有这个关键字，scheme 就是纯粹的函数式语言，其函数将不会产生任何副作用，函数的行为将不可变。
其处理方式类似于define，区别是一个新增，一个修改。需要注意 define 并不能代替 set!, define 定义的变量只能在某个作用域内屏蔽外部的同名变量；
而set!将会沿着作用域链一直向上寻找匹配的变量名，然后进行修改。

- **变量**

```scheme
foo
```

对变量求值的过程与 set! 类似，解释器将沿着作用域链一直向上寻找匹配的变量名，然后取出变量的值。

- **函数调用**

```scheme
(plus a b)
((lambda (x y)
    (+ x y)) a b)
```

函数调用看似有两种形式，其实本质是一种，对变量 `plus` 的求值和对 `lambda` 的求值都将得到一个闭包，所以函数求值的真实过程是，求参数的值，
将参数传递给闭包，然后求闭包的值。对闭包求值的过程为，扩展作用域，将参数值与对应的形参名绑定并放入作用域，这个过程类似于define，
然后返回闭包中的函数过程体，该过程体为一条或多条语句，每条语句都需要被进行解释，这便产生一个递归的解释过程。





# 基本操作和值

函数并不能从无到有定义出来，其过程总会使用一些其他的函数，例如加法，那么加法从何而来？事实上，这些非常基本的操作都是无法直接定义出来的，
它们需要从解释器中直接映射的。为了实现方便，以下操作都直接从解释器中映射：
- `+` `-` `*` `/` (其实减乘除可以用加法来实现，但是没这个必要)，
- `eq?`
- `car`
- `cdr`
- `cons`

scheme中函数与数据的界限非常模糊，car cdr cons等看似基本的操作其实可以用函数来实现。

```scheme
(define (cons x y)
  (define (dispatch tag)
    (cond [(= tag 0) x]
          [(= tag 1) y]))
  dispatch)

(define (car z)
  (z 0))

(define (cdr z)
  (z 1))
```

基本值

- `true`
- `false`

# 语法糖

语法糖并非增加什么新功能，而是让某些以有的功能写起来更舒服。

- **define**

```scheme
(define (foo bar)
  do-something)
```

该表示法等价于如下形式，解释器碰到这个表示法时，只需要对其结构做一点调整，就可以重用已有的解释过程。

```scheme
(define foo (lambda (bar)
                do-something))
```

- **cond**

```scheme
(cond [<p1> <e1>]
      [<p2> <e2>]
      [else e   ])
```

cond 表达式类似于常见的switch结构，但是每个case自带break，所以无法进入多个case。cond 可以转换成嵌套的if，然后将转换后的表达式转发给解释函数重新解释。

```scheme
(if p1
    e1
    (if p2
        e2
        e))
```

- **and**

```scheme
(and c1 c2)
```

短路的逻辑与可以用嵌套的if来实现

```scheme
(if c1
    (if c2
        true)
    false)
```

- **or**

```scheme
(or c1 c2)
```

短路的逻辑与可以用嵌套的if来实现

```scheme
(if c1
    true
    (if c2
        true))
```


## let,let*,letrec

这三个语法糖提供了三种不同的方式来定义作用域，这三种表示法的作用各不相同，它们都建立在lambda的基础上。

- **let**

```
(let ([<var1> <exp1>]
      [<var2> <exp2>])
      <body>)
```

let 表达式提供了定义一个作用域并绑定**互斥**变量的功能，var1 与 var2 在语义上没有先后之分，也不能相互访问。
let 表达式等价于

```scheme
((lambda (<var1> <var2>)
    <body>)
<exp1>
<exp2>)
```

- **let\***

```
(let* ([<var1> <exp1>]
       [<var2> <exp2>])
      <body>)
```

let\* 表达式提供了定义一个作用域并**先后**绑定变量的功能，var1 与 var2 在语义上存在先后之分，var2 可以访问 var1，而 var1 不能访问 var2。
let\* 表达式等价于

```scheme
(let ([<var1> <exp1>])
     (let ([<var2> <exp2>])
                <body>))
```

- **letrec**

```
(letrec ([<var1> <exp1>]
         [<var2> <exp2>])
        <body>)
```

letrec 表达式提供了定义一个作用域并**同时**绑定变量的功能，var1 与 var2 在语义上为同时定义，var2 可以访问 var1，且 var1 可以访问 var2，
letrec 的存在意义在于屏蔽外部同名变量，假定当前作用域外部存在一个变量 `var2`,那么let和let\* 中的var1求值时如果需要访问`var2`，那么将会访问这个外部的`var2`,
而letrec不同，如果letrec的var1求值是需要访问var2,那么这个var2的值**同一作用域内**的那个`var2`的值。
letrec 表达式等价于

```scheme
(let ([<var1> **undefined**]
      [<var2> **undefined**])
      (set! var1 <exp1>)
      (set! var2 <exp2>
      <body>)
```

解释器在对变量求值时会检查变量的值，如果其值为一个未定义标记，则会提示未定义错误。


# 内部定义

函数的内部可以嵌套地使用define语句，但是define在写成文本时是存在先后的，但是函数内部定义的语义应当是同时定义，所以在对lambda进行解释时需要一些调整，
调整内容如下，
- 扫描出lambda体内的所有define语句，只扫描内部定义的第一层无需嵌套，然后将define的变量名和值表达式(无需求值)装配成`letrec`的kv绑定形式，
- 扫描出lambda内部的所有非定义语句将这个序列作为`letrec`的`body`
- 用上面得到的两个部分组成一个`letrec`
- 用新得到的letrec作为body构造一个新的 lambda 来替换原来的lambda

如上描述的含义为：

```scheme
(define (foo bar)
    (define a <expa>)
    (define b <expb>)
    <body>)
```
等价于

```scheme
(define (foo bar)
    (letrec ([a <expa>]
             [b <expb>])
        <body>))
```

# 惰性求值

待续

# 尾调用优化

待续

# 编译

待续

[scheme]:http://baike.baidu.com/link?url=wgd84RHmek_qWtVHP9uhUL97pPelbW1iiUjF39rRuIrSHeG5ekDywMoiyWXDFgkaz3sdkYS2TRXs29CzMa7paa
[scheme-bootstrap]:https://github.com/dubuyuye/scheme-bootstrap