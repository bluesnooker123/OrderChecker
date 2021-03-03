# OrderChecker
Check orders from BigCommerce API

Get Products data from Bigcommerce by orderID using API for multiple users. 
Now store limit is 250.
If you want to increase limit you can do like this(increase page number): "https://api.bigcommerce.com/stores/shxhfy2z6/v2/orders/201433438/products?page=1&limit=250".
In this version you don't need to use CORS extension and Heroku CORS Proxy.
This means that you don't need to insert "anywhere.herokuapp.com/" at front of your URL. 
You can use BigCommerce API directly.
