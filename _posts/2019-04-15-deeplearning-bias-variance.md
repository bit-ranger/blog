---

title: Deep learning Bias and Variance

categories: deep-learning

---

## Bias

Bias is how far are the predicted values from the actual values. If the average predicted values are far off from the actual values then the bias is high.

High bias causes algorithm to miss relevant relationship between input and output variable. When a model has a high bias then it implies that the model is too simple and does not capture the complexity of data thus underfitting the data.



## Variance

Variance occurs when the model performs good on the trained dataset but does not do well on a dataset that it is not trained on, like a test dataset or validation dataset. Variance tells us how scattered are the predicted value from the actual value.

High variance causes overfitting that implies that the algorithm models random noise present in the training data.



### High bias, high variance and just fit

when a model has a high variance then the model becomes very flexible and tune itself to the data points of the training set. when a high variance model encounters a different data point that it has not learnt then it cannot make right prediction.

![High bias, high variance and just fit](/home/sunw/github/blog/_posts/resources/img/bias_variance_just_fit.png)

If we look at the diagram above, we see that a model with high bias looks very simple. A model with high variance tries to fit most of the data points making the model complex and difficult to model. This can be visible from the plot below between test and training prediction error as a function of model complexity.