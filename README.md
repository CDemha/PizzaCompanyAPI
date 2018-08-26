# PizzaCompanyAPI
A simple API built on raw NodeJS that lets you create orders for a pizza company. The API only uses JSON when posting data.

### POST: /users
To start making orders, you need to first make an account. That can be done using this endpoint.
```
{
	"firstName" : "Ahmed",
	"lastName" : "Cader",
	"emailAddress" : "name@domain.com",
	"password" : "mypassword",
	"streetAddress" : "123 Fake Street, Fake Place, Fake City, New Zealand"
}
```
### POST: /tokens
Creating an account lets you create a token to use to do various things such as make orders. Your token lets you identify who you are.
```
{
	"emailAddress" : "name@domain.com",
	"password" : "mypassword"
}
```
Upon creating a token, this should return a **200 OK**. Save this token and don't share it with anyone. You can use this token to make requests to the server.
```
{
    "emailAddress": "name@domain.com",
    "id": "cq93ta280yeedhr20894"
}
```
### POST: /login
You can login using this endpoint.
```
{
	"emailAddress" : "AhmedCader@Live.com",
	"password" : "mypassword"
}
```
### POST: /logout?tokenId=xxx
You can logout using this endpoint. You need to provide the token that you generated as url parameter.
A successfull logout will return a **200 OK**.
```
{
    "Logout": "jsmith@domain.com",
    "Outcome": "Success"
}
```

### GET: /menu
You need to be logged in to get the menu. You need to add your token. Provide it as a header with:
required parameter: 'token'.
A successfull request will return a **200 OK**.
```
{
    "1": {
        "id": 1,
        "name": "GARLIC SHRIMP SUPREME",
        "price": 12.99
    },
    "2": {
        "id": 2,
        "name": "CHIPOTLE BEEF",
        "price": 10.99
    }
    ...
```
### POST: /cart
In order to create a cart and add items, you need to use your token. You need to be logged in. The token will be given as a header with the parameter: 'token'. The body needs to be:
```
{
	"items" : [1, 1, 2]
}
```
Where the integers inside the array are menu item ID's. The above means: GARLIC SHRIMP SUPREME x 2 qty, CHIPOTLE BEEF x 1 qty. Successful request should return the below response. 
```
{
    "orderId": "19vc3",
    "emailAddress": "name@domain.com",
    "fullfilled": false,
    "cartItems": [
        {
            "id": 1,
            "name": "GARLIC SHRIMP SUPREME",
            "price": 12.99
        },
        {
            "id": 1,
            "name": "GARLIC SHRIMP SUPREME",
            "price": 12.99
        },
        {
            "id": 6,
            "name": "CHIPOTLE CHICKEN",
            "price": 10.99
        }
    ]
}
```
### POST: /order
To place an order you need to use your token. You need to be logged in. The token will be given as a header with the parameter: 'token'. The body needs to be:
```
{
	"orderId" : "j7wmy"
}
```
I
A successfull request will return a response:
```
{
    "Success": "Payment recieved. Processing order now. Sending recipt to name@domain.com"
}
```
