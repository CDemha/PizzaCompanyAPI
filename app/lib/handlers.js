// Dependencies
var _data = require("./data");
var helpers = require("./helpers");
var config = require("./config");

// Define the handlers
var handlers = {};

handlers._login = {};

handlers.login = function (data, callback) {
    var acceptableMethods = ["post"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._login[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._login.post = function (data, callback) {
    // Check that all required fields are present
    var password = typeof (data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var emailAddress = typeof (data.payload.emailAddress) == "string" && data.payload.emailAddress.trim().length > 0 ? data.payload.emailAddress.trim() : false;
    if (emailAddress && password) {
        // Make sure the user doesn't already exist
        _data.read("users", emailAddress, function (err, data) {
            if (!err && data) {
                var hashedPassword = helpers.hash(password);
                var tokenId = data.tokenId;
                if (hashedPassword == data.hashedPassword) {
                    _data.read("tokens", tokenId, function (err, data) {
                        // Has logged out, needs to re-log in
                        if (err) {
                            var tokenObject = {
                                "emailAddress": emailAddress,
                                "id": tokenId
                            }
                            _data.create("tokens", tokenId, tokenObject, function (err) {
                                if (!err) {
                                    callback(200, { "Logged In": tokenObject.emailAddress, "TokenID": tokenId, "Outcome": "Success" });
                                } else {
                                    callback(404, { "Error": "Could not log in" });
                                }
                            });
                        } else {
                            callback(404, { "Error": "You have already logged in", "tokenId": tokenId });
                        }
                    });
                } else {
                    callback(400, { "Error": "Password did not match the specified user's stored password" });
                }

            } else {
                callback(400, { "Error": "Invalid password/email or user does not exist" });
            }
        });
    } else {
        callback(400, { "Error": "Missing required fields" });
    }
};

// Log out
handlers._logout = {};

handlers.logout = function (data, callback) {
    var acceptableMethods = ["post"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._logout[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._logout.post = function (data, callback) {
    // Get the right token to perform the logout action
    var tokenId = typeof (data.queryStringObject.tokenId) == "string" && data.queryStringObject.tokenId.trim().length == 20 ? data.queryStringObject.tokenId.trim() : false;
    if (tokenId) {
        _data.read("tokens", tokenId, function (err, tokenData) {
            if (!err && tokenData) {
                _data.delete("tokens", tokenId, function (err) {
                    if (!err) {
                        callback(200, { "Logout": tokenData.emailAddress, "Outcome": "Success" });
                    } else {
                        callback(400, { "Error": "You have already logged out" })
                    }
                });
            } else {
                callback(400, { "Error": "Could not log out. You may have already logged out previously" });
            }
        });
    } else {
        callback(403, { "Error": "Missing required in fields" });
    }
};

// Container for the users sub methods
handlers._users = {};

// Users
handlers.users = function (data, callback) {
    var acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._users.post = function (data, callback) {
    // Check that all required fields are present
    var firstName = typeof (data.payload.firstName) == "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof (data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var emailAddress = typeof (data.payload.emailAddress) == "string" && data.payload.emailAddress.trim().length > 0 ? data.payload.emailAddress.trim() : false;
    var streetAddress = typeof (data.payload.streetAddress) == "string" && data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress.trim() : false;

    if (firstName && lastName && password && emailAddress && streetAddress) {
        // Make sure the user doesn't already exist
        _data.read("users", emailAddress, function (err, data) {
            if (err) {
                // Hash the password
                var hashedPassword = helpers.hash(password);
                var tokenId = helpers.createRandomString(20);
                // Create the user object
                if (hashedPassword) {
                    var userObject = {
                        "firstName": firstName,
                        "lastNamne": lastName,
                        "emailAddress": emailAddress,
                        "hashedPassword": hashedPassword,
                        "streetAddress": streetAddress,
                        "tokenId": tokenId
                    };

                    // Store the user
                    _data.create("users", emailAddress, userObject, function (err) {
                        if (!err) {
                            var tokenObject = {
                                "emailAddress": emailAddress,
                                "id": tokenId
                            }
                            _data.create("tokens", tokenId, tokenObject, function (err) {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(404);
                                }
                            });
                        } else {
                            console.log(err);
                            callback(500, { "Error": "Could not create the new user" });
                        }
                    });
                } else {
                    callback(500, { "Error": "Could not hash the users password" });
                }
            } else {
                callback(400, { "Error": "User with that email already exists" });
            }
        });
    } else {
        callback(400, { "Error": "Missing required fields" });
    }
};

// Users - GET
// Required data : phone
// Optional data : none
handlers._users.get = function (data, callback) {
    // check that the phone is valid
    var tokenId = typeof (data.queryStringObject.tokenId) == "string" && data.queryStringObject.tokenId.trim().length == 20 ? data.queryStringObject.tokenId.trim() : false;
    if (tokenId) {
        // Lookup the user
        _data.read("tokens", tokenId, function (err, data) {
            if (!err && data) {
                var emailAddress = data.emailAddress;
                _data.read("users", emailAddress, function (err, data) {
                    if (!err && data) {
                        // Remove the hashed password from the user object before returning it to the requester
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, { "Error": "Missing required field" });
    }
};

// Users - PUT
// Required data : emailAddress
// Optional data : firstName, lastName, password (at least one must be specified)
handlers._users.put = function (data, callback) {
    // Check for the required field
    var emailAddress = typeof (data.payload.emailAddress) == "string" && data.payload.emailAddress.trim().length > 0 ? data.payload.emailAddress.trim() : false;

    // Check for the optional fields
    var firstName = typeof (data.payload.firstName) == "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof (data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var streetAddress = typeof (data.payload.streetAddress) == "string" && data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress.trim() : false;

    // Error if the emailAddress is invalid
    if (emailAddress) {
        if (firstName || lastName || password || emailAddress || streetAddress) {
            // Lookup the user

            _data.read("users", emailAddress, function (err, userData) {
                if (!err && userData) {
                    var token = typeof (data.headers.token) == "string" ? data.headers.token : false;
                    handlers._tokens.verifyToken(token, emailAddress, function (tokenIsValid) {
                        if (tokenIsValid) {
                            // Update the fields necessary
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                            if (streetAddress) {
                                userData.streetAddress = streetAddress;
                            }
                            // Store the new updates
                            _data.update("users", emailAddress, userData, function (err) {
                                if (!err) {
                                    callback(200)
                                } else {
                                    console.log(err);
                                    callback(500, { "Error": "Could not update the user" });
                                }
                            });
                        } else {
                            callback(403, { "Error": "Missing required token in header or token is invalid" });
                        }
                    });
                } else {
                    callback(400, { "Error": "The specified user does not exist" });
                }
            });
        } else {
            callback(400, { "Error": "Missing required fields to update" });
        }
    } else {
        callback(400, { "Error": "Missing required field" })
    }
};

// Users - DELETE
// Required field : phone
handlers._users.delete = function (data, callback) {
    // Check that the phone number is valid
    var emailAddress = typeof (data.queryStringObject.emailAddress) == "string" && data.queryStringObject.emailAddress.trim().length > 0 ? data.queryStringObject.emailAddress.trim() : false;
    if (emailAddress) {
        // Get the token from the headers
        var token = typeof (data.headers.token) == "string" ? data.headers.token : false;
        handlers._tokens.verifyToken(token, emailAddress, function (tokenIsValid) {
            if (tokenIsValid) {
                // Lookup the user
                _data.read("users", emailAddress, function (err, userData) {
                    if (!err && userData) {
                        _data.delete("users", emailAddress, function (err) {
                            if (!err) {
                                // Delete each of the orders associated with the user
                                var userOrders = typeof (userData.userOrders) == "object" && userData.userOrders instanceof Array ? userData.userOrders : [];
                                var ordersToDelete = userOrders.length;
                                if (ordersToDelete > 0) {
                                    var ordersDeleted = 0;
                                    var deletionErrors = false;
                                    // Loop through the checls
                                    userOrders.forEach(function (checkId) {
                                        _data.delete("orders", checkId, function (err) {
                                            if (err) {
                                                deletionErrors = true;
                                            }
                                            ordersDeleted++;
                                            if (ordersDeleted == ordersToDelete) {
                                                if (!deletionErrors) {
                                                    callback(200);
                                                } else {
                                                    callback(500, { "Error": "Errors encountered while attempting to delete all of the user's orders. All orders may not have been deleted successfully" });
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    callback(200);
                                }
                            } else {
                                callback(500, { "Error": "Could not delete the specified user" });
                            }
                        });
                    } else {
                        callback(400, { "Error": "Could not find the specified user" });
                    }
                });
            } else {
                callback(403, { "Error": "Missing required token in header or token is invalid" });
            }
        });
    } else {
        callback(400, { "Error": "Missing required field" });
    }
};

// Tokens
handlers.tokens = function (data, callback) {
    var acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._tokens = {};

handlers._tokens.post = function (data, callback) {
    var emailAddress = typeof (data.payload.emailAddress) == "string" && data.payload.emailAddress.trim().length > 0 ? data.payload.emailAddress.trim() : false;
    var password = typeof (data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if (emailAddress && password) {
        // Lookup the user who matches the phone number
        _data.read("users", emailAddress, function (err, userData) {
            if (!err && userData) {
                // Hash the sent password, and compare it to the password stored in the users
                var hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    // If valid, create a new token with a random name. Set expiration date 1 hour in the future
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60; // expires in an hour
                    var tokenObject = {
                        "emailAddress": emailAddress,
                        "id": tokenId
                    }
                    _data.create("tokens", tokenId, tokenObject, function (err) {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, { "Error": "Could not create the new token" });
                        }
                    });
                } else {
                    callback(400, { "Error": "Password did not match the specified user's stored password" });
                }
            } else {
                callback(400, { "Error": "Could not find the specified user" });
            }
        });
    } else {
        callback(400, { "Error": "Missing required field(s)" });
    }
};

// Tokens - Get
// Required data : Id
// Optional data : none
handlers._tokens.get = function (data, callback) {
    // Check id that was sent is valid
    var id = typeof (data.queryStringObject.id) == "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

    if (id) {
        // Lookup the token

        _data.read("tokens", id, function (err, tokenData) {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, { "Error": "Missing required field" });
    }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function (id, emailAddress, callback) {
    // Lookup the token
    _data.read("tokens", id, function (err, tokenData) {
        if (!err && tokenData) {
            // Check that the token is for the given user and has not expired
            if (tokenData.emailAddress == emailAddress) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    })
};

handlers._menu = {};

// Menu
handlers.menu = function (data, callback) {
    var acceptableMethods = ["get"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._menu[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._menu.get = function (data, callback) {
    // check that the token is valid
    var token = typeof (data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;
    if (token) {
        // Lookup the user
        _data.read("tokens", token, function (err, data) {
            if (!err && data) {
                _data.read("menu", "menu", function (err, data) {
                    if (!err && data) {
                        callback(200, data)
                    } else {
                        callback(405, { "Error": "Something went wrong trying to retrieve the menu items" });
                    }
                });
            } else {
                callback(401, { "Error": "You must be logged in to get the menu list" });
            }
        });
    } else {
        callback(400, { "Error": "Missing required field" });
    }
}

handlers._cart = {};

// Menu
handlers.cart = function (data, callback) {
    var acceptableMethods = ["get", "post"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._cart[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._cart.get = function (data, callback) {
    // check that the token is valid
    var token = typeof (data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;
    if (token) {
        // Lookup the user
        _data.read("tokens", token, function (err, data) {
            if (!err && data) {
                callback(200)
            } else {
                callback(401, { "Error": "You must be logged in to get items from the cart" });
            }
        });
    } else {
        callback(400, { "Error": "Missing required field" });
    }
}

handlers._cart.post = function (data, callback) {
    // check that the token is valid
    var cartItems = typeof (data.payload.items) == "object" && data.payload.items instanceof Array && data.payload.items.length > 0 ? data.payload.items : [];
    var token = typeof (data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;
    if (token) {
        // Lookup the user
        _data.read("tokens", token, function (err, userData) {
            if (!err && userData) {
                if (cartItems) {
                    _data.read("menu", "menu", function (err, menuData) {
                        // Create the shopping cart object.
                        var shoppingCart = {
                            "orderId": helpers.createRandomString(5),
                            "emailAddress": userData.emailAddress,
                            "fullfilled": false,
                            "cartItems": []
                        };
                        // Add each item into the shopping cart list
                        cartItems.forEach(menuId => {
                            shoppingCart.cartItems.push(menuData[menuId]);
                        });
                        if (!err && menuData) {
                            _data.create("orders", shoppingCart.orderId, shoppingCart, function (err, orderData) {
                                if (!err) {
                                    callback(200, shoppingCart);
                                } else {
                                    callback(405, { "Error": "Something went wrong trying to create your order" });
                                }
                            });
                        } else {
                            callback(405, { "Error": "Could not get list of menu items" });
                        }
                    });
                } else {
                    callback(400, { "Error": "Missing required field" });
                }
            } else {
                callback(401, { "Error": "You must be logged in to add items to the cart" });
            }
        });
    } else {
        callback(400, { "Error": "Missing required field" });
    }
}

handlers._order = {};

// Menu
handlers.order = function (data, callback) {
    var acceptableMethods = ["post"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._order[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._order.post = function (data, callback) {
    // check that the token is valid
    var token = typeof (data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;
    var orderId = typeof (data.payload.orderId) == "string" && data.payload.orderId.length == 5 ? data.payload.orderId : false;

    if (token) {
        // Lookup the user
        _data.read("tokens", token, function (err, userData) {
            if (!err && userData) {
                // Get the right order based on the given orderId
                _data.read("orders", orderId, function (err, orderData) {
                    if (!err && orderData) {
                        // Check if the email address from the order matches the logged in users email address
                        if (orderData.emailAddress === userData.emailAddress) {
                            if (!orderData.fullfilled) {
                                var totalPrice = 0;
                                orderData.cartItems.forEach(item => {
                                    totalPrice += item.price;
                                });
                                helpers.createPayment(orderData.emailAddress, totalPrice, "Order for " + orderData.emailAddress, function (err) {
                                    if (!err) {
                                        orderData.fullfilled = true;
                                        _data.update("orders", orderData.orderId, orderData, function (err) {
                                            if (!err) {
                                                var subject = "Order ID: " + orderData.orderId + " - Pizza Company";
                                                var message = "Thank you for ordering. Here is yor order recipt ID: " + orderData.orderId + ". Total is: " + totalPrice;
                                                helpers.sendRecipt("name@domain.com", subject, message, function (err) {
                                                    if (!err) {
                                                        callback(200, { "Success": "Payment recieved. Processing order now. Sending recipt to " + orderData.emailAddress });
                                                    } else {
                                                        callback(200, { "Success": "Payment recieved. Processing order now. Unable to send email recipt" });
                                                    }
                                                });
                                            } else {
                                                callback(200, { "Error": "Could not update order. Please contact support" });
                                            }
                                        });
                                    } else {
                                        callback(400, { "Error": "Payment was not recieved. Could not place order" });
                                    }
                                });
                            } else {
                                callback(400, { "Error": "Couldn't place order" });
                            }
                        } else {
                            callback(400, { "Error": "Order has already been placed" });
                        }
                    } else {
                        callback(401, { "Error": "You must be logged in to make the order or order does not exist" });
                    }
                });
            } else {
                callback(401, { "Error": "You must be logged in to make the order" });
            }
        });
    } else {
        callback(400, { "Error": "Missing required field" });
    }
};
// Export Handlers
module.exports = handlers;
