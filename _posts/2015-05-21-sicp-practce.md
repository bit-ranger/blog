---
layout: post
title: SICP 练习(1)
tags: SICP Lisp Scheme 函数式
categories: Lisp
---

<div class="toc"></div>

## 1.1

略

##1.2

略

##1.3

~~~scheme
;;;1.3

;平方
(define (square x)
  (* x x))

;平方和
(define (sum-of-square x y)
  (+ (square x) (square y)))

;较大两数的平方和
(define (max-sum-of-square a b c)
  (cond [(not (or (> c a) (> c b)))
           (sum-of-square a b)]
        [else
           (max-sum-of-square c a b)]))
~~~

##1.4

~~~scheme
;;;1.4
;如果b大于0，则返回+，否则返回-，此处的+与-既是值又是函数，实际上，在lisp中函数即值。
(define (a-plus-abs-b a b)
  ((if (> b 0) + -) a b))
~~~

##1.5

~~~scheme
;;;1.5
(define (p) (p))

(define (test x y)
  (if (= x 0) 0 y))

;测试方法：test(0 (p))
;在应用序中，所有被传入的实际参数都会立即被求值，因此，在使用应用序的解释器里执行 (test 0 (p)) 时，实际参数 0 和 (p) 都会被求值，而对 (p) 的求值将使解释器进入无限循环，因此，如果一个解释器在运行 Ben 的测试时陷入停滞，那么这个解释器使用的是应用序求值模式。

;另一方面，在正则序中，传入的实际参数只有在有需要时才会被求值，因此，在使用正则序的解释器里运行 (test 0 (p)) 时， 0 和 (p) 都不会立即被求值，当解释进行到 if 语句时，形式参数 x 的实际参数(也即是 0)会被求值(求值结果也是为 0 )，然后和另一个 0 进行对比((= x 0))，因为对比的值为真(#t),所以 if 返回 0 作为值表达式的值，而这个值又作为 test 函数的值被返回。

;因为在正则序求值中，调用 (p) 从始到终都没有被执行，所以也就不会产生无限循环，因此，如果一个解释器在运行 Ben 的测试时顺利返回 0 ，那么这个解释器使用的是正则序求值模式。
~~~

##1.6

~~~scheme
;;;1.6


;平方
(define (square x)
  (* x x))

;平均数
(define (avg x y)
  (/ (+ x y) 2))

;优化预测平方根
(define (improve guess x)
  (avg guess (/ x guess)))

;判断是否预测平方根足够精确
(define (goodEnough? guess x)
  (< (abs (- (square guess) x)) 0.001))

;求平方根需要提供预测平方根
(define (squrt-iter guess x)
  (if (goodEnough? guess x)
      guess
      (squrt-iter (improve guess x) x)))

;求平方根
(define (squrt x)
    (squrt-iter 1.0 x))

;;;;;;;;;;;;;;;;;;;

;常规化的if判断
(define (new-if predicate then-case else-case)
  (cond [predicate then-case]
        [else else-case]))

;改写开平方根
;求平方根需要提供预测平方根
(define (squrt-iter-new guess x)
  (new-if (goodEnough? guess x)
      guess
      (squrt-iter-new (improve guess x) x)))

;求平方根
(define (squrt-new x)
    (squrt-iter-new 1.0 x))

;改写后进入死循环，问题根源在于应用序。squrt-iter-new执行时，解释器试图算出参数的值然后应用到运算符上，但是，squrt-iter-new是个递归函数，值是算不出来的。
;如果使用cond if的话解释器会对其进行特殊处理，先计算判断表达式的值，一直算到#t，#f为止，然后再选择分支运算。
~~~

##1.7

~~~scheme
;;;1.7


;平方
(define (square x)
  (* x x))

;平均数
(define (avg x y)
  (/ (+ x y) 2))

;优化预测平方根
(define (improve guess x)
  (avg guess (/ x guess)))

;判断是否预测平方根足够精确
;可以发现，对于特别小的数，比如 0.00009 ，书本给出的 sqrt 并不能计算出正确的答案； 而对于特别大的数，因为 mit-scheme 实现的小数精度不足以表示两个大数之间的差，所以 sqrt 会陷入死循环而无法得出正确结果。
;要避免这一错误，我们按照练习所说，对 good-enough? 进行修改：不再检测猜测值 guess 的平方与 x 之间的差，而是检测新旧两次猜测值之间的比率，当比率变化非常小时，程序就停止 improve 。
;(define (goodEnough? guess x)
;  (< (abs (- (square guess) x)) 0.001))

(define (goodEnough? guess new-guess)
  (> 0.01
     (/ (abs (- new-guess guess))
        guess)))

;求平方根需要提供预测平方根
(define (squrt-iter guess x)
  (if (goodEnough? guess (improve guess x))
      (improve guess x)
      (squrt-iter (improve guess x) x)))

;求平方根
(define (squrt x)
    (squrt-iter 1.0 x))
~~~

##1.8

~~~scheme
;;;1.8

;平方
(define (square x)
  (* x x))

;立方
(define (cube x)
  (* x x x))

;立方根优化
(define (improve guess x)
  (/ (+ (/ x (square guess))
        (* 2 guess))
     3))

;足够精确判定
(define (goodEngough? old-guess new-guess)
  (> 0.01
     (/ (abs (- new-guess old-guess))
        old-guess)))

;逼近立方根
(define (cube-iter guess x)
  (if (goodEngough? guess (improve guess x))
      (improve guess x)
      (cube-iter (improve guess x) x)))

;求立方根
(define (cube-root x)
  (cube-iter 1.0 x))
~~~