# Test Report

<The goal of this document is to explain how the application was tested, detailing how the test cases were defined and what they cover>

# Contents

- [Dependency graph](#dependency-graph)

- [Integration approach](#integration-approach)

- [Tests](#tests)

- [Coverage](#Coverage)





# Dependency graph 

![Dependency Graph](/images/DependencyGraph.png)

# Integration approach
    We started working on the unit tests in parallel for the different components of the application as soon as the functions were ready.
    Since the creation of the integration tests was divided among the members of the team we may say that we adopted a mixed approach, where as soon as 
    the integration tests for a certain unit were ready they were integrated in the test. In general we tried to follow a bottom up approach but this was not always respected in case of changes in the code and requirements that were not compatible with the initial test design.


# Tests

| Test Number |Test case name | Object(s) tested | Test level | Technique used |
|:--:|:--:|:--:|:--:|:--:|
| Tests file : utils.unit.test.js |
 | 1 | should get an error because of wrong date date format | handleDateFilterParams | Unit | WB - Statement Coverage |
 | 2 | should get an error because of invalid from date format | handleDateFilterParams | Unit | WB - Statement Coverage |
 | 3 | should get an error because of invalid upTo date format | handleDateFilterParams | Unit | WB - Statement Coverage |
 | 4 | should get an error because of invalid from date format (passing also upTo) | handleDateFilterParams | Unit | WB - Statement Coverage |
 | 5 | should get an error because of invalid upTo date format (passing also from) | handleDateFilterParams | Unit | WB - Statement Coverage |
 | 6 | should get an error because wrong combination of paramenters | handleDateFilterParams | Unit | WB - Statement Coverage |
 | 7 | should get an empty request to match all | handleDateFilterParams | Unit | WB - Statement Coverage |
 | 8 | should get a query to match a single day | handleDateFilterParams | Unit | WB - Statement Coverage |
 | 9 | should get a query to match from a date onwards | handleDateFilterParams | Unit | WB - Statement Coverage |
 | 10 | should get a query to match up to a certain date | handleDateFilterParams | Unit | WB - Statement Coverage |
 | 11 | should get a query to match from a date up to another | handleDateFilterParams | Unit | WB - Statement Coverage |
 | 12 | Simple verification with correct tokens set | verifyAuth | Unit | WB - Statement Coverage |
 | 13 | Simple verification with missing accessToken, an error message is returned | verifyAuth | Unit | WB - Statement Coverage |
 | 14 | Simple verification with missing refreshToken, an error message is returned | verifyAuth | Unit | WB - Statement Coverage |
 | 15 | Simple verification with missing information in accessToken, an error message is returned | verifyAuth | Unit | WB - Statement Coverage |
 | 16 | Simple verification with missing information in refreshToken, an error message is returned | verifyAuth | Unit | WB - Statement Coverage |
 | 17 | Simple verification with missing information in refreshToken, an error message is returned | verifyAuth | Unit | WB - Statement Coverage |
 | 18 | AccessToken has to be refreshed (authType=Simple) | verifyAuth | Unit | WB - Statement Coverage |
 | 19 | AccessToken has to be refreshed (authType=User) but the user is wrong | verifyAuth | Unit | WB - Statement Coverage |
 | 20 | AccessToken has to be refreshed (authType=User) and the user is correct | verifyAuth | Unit | WB - Statement Coverage |
 | 21 | AccessToken has to be refreshed (authType=Admin) and the user is an admin | verifyAuth | Unit | WB - Statement Coverage |
 | 22 | AccessToken has to be refreshed (authType=Admin) but the user is not an admin | verifyAuth | Unit | WB - Statement Coverage |
 | 23 | AccessToken has to be refreshed (authType=Group) and the user is part of the group | verifyAuth | Unit | WB - Statement Coverage |
 | 24 | AccessToken has to be refreshed (authType=Group) but the user is not part of the group | verifyAuth | Unit | WB - Statement Coverage |
 | 25 | AccessToken and refreshToken are both expired | verifyAuth | Unit | WB - Statement Coverage |
 | 26 | User verification with same correct username stored both on verifyAuth call and tokens | verifyAuth | Unit | WB - Statement Coverage |
 | 27 | User verification with wrong username request, an error message is returned | verifyAuth | Unit | WB - Statement Coverage |
 | 28 | User verification with wrong username request, an error message is returned | verifyAuth | Unit | WB - Statement Coverage |
 | 29 | Admin verification with user owning admin privileges | verifyAuth | Unit | WB - Statement Coverage |
 | 30 | Admin verification with user not owning admin privileges, an error message is returned | verifyAuth | Unit | WB - Statement Coverage |
 | 31 | Group verification with correct group set | verifyAuth | Unit | WB - Statement Coverage |
 | 32 | Group verification with wrong group set | verifyAuth | Unit | WB - Statement Coverage |
 | 33 | should get an error because query not a number (passing min and max) | handleAmountFilterParams | Unit | WB - Statement Coverage |
 | 34 | should get an error because query not a number (passing only min) | handleAmountFilterParams | Unit | WB - Statement Coverage |
 | 35 | should get an error because query not a number (passing only min) | handleAmountFilterParams | Unit | WB - Statement Coverage |
 | 36 | should return an empty query to match all | handleAmountFilterParams | Unit | WB - Statement Coverage |
 | 37 | should return query to match from min amount upwards | handleAmountFilterParams | Unit | WB - Statement Coverage |
 | 38 | should return query to match up to max value | handleAmountFilterParams | Unit | WB - Statement Coverage |
 | 39 | should return query to match up to max value | handleAmountFilterParams | Unit | WB - Statement Coverage |
 | 40 | should return query to match from min to max value | handleAmountFilterParams | Unit | WB - Statement Coverage |
 | 41 | should return query that matches all since min > max | handleAmountFilterParams | Unit | WB - Statement Coverage |
 | 42 | If new user does not still exists it is successfully created | register | Unit | WB - Statement Coverage |
 | 43 | If body contains an empty parameter an error is returned | register | Unit | WB - Statement Coverage |
 | 44 | If body does not contain a required parameter, an error is returned | register | Unit | WB - Statement Coverage |
 | 45 | If a user with same username exists, an error is returned | register | Unit | WB - Statement Coverage |
 | 46 | If new admin does not still exists it is successfully created | registerAdmin | Unit | WB - Statement Coverage |
 | 47 | If body contains an empty parameter an error is returned | registerAdmin | Unit | WB - Statement Coverage |
 | 48 | If body does not contain a required parameter, an error is returned | registerAdmin | Unit | WB - Statement Coverage |
 | 49 | If an Admin with same username exists, an error is returned | registerAdmin | Unit | WB - Statement Coverage |
 | 50 | If body does not contain a required parameter, an error is returned | login | Unit | WB - Statement Coverage |
 | 51 | If body contains an empty parameter an error is returned | login | Unit | WB - Statement Coverage |
 | 52 | If user is registered, login is successful | login | Unit | WB - Statement Coverage |
 | 53 | if user was logged in, is successfully logged out | logout | Unit | WB - Statement Coverage |
 | 54 | if refreshToken is missing, an error message is returned | logout | Unit | WB - Statement Coverage |
 | 55 | if refreshToken in the cookies does not represent a user in the database, an error message is returned | logout | Unit | WB - Statement Coverage |
 | 56 | should create a new category | createCategory | Unit | WB - Statement Coverage |
 | 57 | should return a 401 error if user is not an admin | createCategory | Unit | WB - Statement Coverage |
 | 58 | should return a 400 error for missing attributes | createCategory | Unit | WB - Statement Coverage |
 | 59 | should return a 400 error if attribute values are empty strings | createCategory | Unit | WB - Statement Coverage |
 | 60 | should return a 400 error if category type already exists | createCategory | Unit | WB - Statement Coverage |
 | 61 | should return a 200 response with updated category and transaction count | updateCategory | Unit | WB - Statement Coverage |
 | 62 | should return a 400 error if request body does not contain all necessary attributes | updateCategory | Unit | WB - Statement Coverage |
 | 63 | should return a 400 error if request body contains empty string attributes | updateCategory | Unit | WB - Statement Coverage |
 | 64 | should return a 400 error if category does not exist | updateCategory | Unit | WB - Statement Coverage |
 | 65 | should return a 400 error if new category type already exists | updateCategory | Unit | WB - Statement Coverage |
 | 66 | should return a 401 error if user is not an admin | updateCategory | Unit | WB - Statement Coverage |
 | 67 | should return a 200 status code and delete categories | deleteCategory | Unit | WB - Statement Coverage |
 | 68 | should return a 400 error if the request body does not contain all the necessary attributes | deleteCategory | Unit | WB - Statement Coverage |
 | 69 | should return a 400 error if there is only one category in the database | deleteCategory | Unit | WB - Statement Coverage |
 | 70 | should return a 400 error if at least one type in the array is an empty string | deleteCategory | Unit | WB - Statement Coverage |
 | 71 | should return a 400 error if at least one type in the array does not represent a category in the database | deleteCategory | Unit | WB - Statement Coverage |
 | 72 | should return a 401 error if the user is not an admin | deleteCategory | Unit | WB - Statement Coverage |
 | 73 | should return a list of categories | getCategories | Unit | WB - Statement Coverage |
 | 74 | should return a message if there are no categories | getCategories | Unit | WB - Statement Coverage |
 | 75 | should return a 401 error if the user is not authenticated | getCategories | Unit | WB - Statement Coverage |
 | 76 | should create a new transaction for an authenticated user | createTransaction | Unit | WB - Statement Coverage |
 | 77 | should return a 401 error if the user is not authenticated | createTransaction | Unit | WB - Statement Coverage |
 | 78 | should return a 400 error if the category does not exist | createTransaction | Unit | WB - Statement Coverage |
 | 79 | should return a 400 error if the request body is missing attributes | createTransaction | Unit | WB - Statement Coverage |
 | 80 | should return a 400 error if the request body has empty string parameters | createTransaction | Unit | WB - Statement Coverage |
 | 81 | should return a 400 error if the username in the request body does not match the route parameter | createTransaction | Unit | WB - Statement Coverage |
 | 82 | should return a 400 error if the username in the request body does not exist | createTransaction | Unit | WB - Statement Coverage |
 | 83 | should return a 400 error if the amount is not a valid number | createTransaction | Unit | WB - Statement Coverage |
 | 84 | should return a 401 error if the authenticated user is not the same as the user in the route parameter | createTransaction | Unit | WB - Statement Coverage |
 | 85 | should return all transactions with category information | getAllTransactions | Unit | WB - Statement Coverage |
 | 86 | should return an empty response if no transactions found | getAllTransactions | Unit | WB - Statement Coverage |
 | 87 | should return a 401 error if the user is not an admin | getAllTransactions | Unit | WB - Statement Coverage |
 | 88 | should return transactions for admin user | getTransactionsByUser | Unit | WB - Statement Coverage |
 | 89 | should return transactions for regular user with filters | getTransactionsByUser | Unit | WB - Statement Coverage |
 | 90 | should return an empty response if no transactions found for regular user | getTransactionsByUser | Unit | WB - Statement Coverage |
 | 91 | should return 401 error for unauthorized admin user | getTransactionsByUser | Unit | WB - Statement Coverage |
 | 92 | should return 401 error for unauthorized regular user | getTransactionsByUser | Unit | WB - Statement Coverage |
 | 93 | should return 400 error if user not found | getTransactionsByUser | Unit | WB - Statement Coverage |
 | 94 | should return transactions for admin user by category | getTransactionsByUserByCategory | Unit | WB - Statement Coverage |
 | 95 | should return transactions for regular user by category | getTransactionsByUserByCategory | Unit | WB - Statement Coverage |
 | 96 | should return an empty response if no transactions found for admin user by category | getTransactionsByUserByCategory | Unit | WB - Statement Coverage |
 | 97 | should return an empty response if no transactions found for regular user by category | getTransactionsByUserByCategory | Unit | WB - Statement Coverage |
 | 98 | should return 400 error if user not found for admin user | getTransactionsByUserByCategory | Unit | WB - Statement Coverage |
 | 99 | should return 400 error if user not found for regular user | getTransactionsByUserByCategory | Unit | WB - Statement Coverage |
 | 100 | should return 400 error if category not found for admin user | getTransactionsByUserByCategory | Unit | WB - Statement Coverage |
 | 101 | should return 400 error if category not found for regular user | getTransactionsByUserByCategory | Unit | WB - Statement Coverage |
 | 102 | should return 401 error for unauthorized admin user | getTransactionsByUserByCategory | Unit | WB - Statement Coverage |
 | 103 | should return 401 error for unauthorized regular user | getTransactionsByUserByCategory | Unit | WB - Statement Coverage |
 | 104 | should return transactions for admin route | getTransactionsByGroup | Unit | WB - Statement Coverage |
 | 105 | should return transactions for user route | getTransactionsByGroup | Unit | WB - Statement Coverage |
 | 106 | should return an empty data array if no transactions found for admin route | getTransactionsByGroup | Unit | WB - Statement Coverage |
 | 107 | should return an empty data array if no transactions found for user route | getTransactionsByGroup | Unit | WB - Statement Coverage |
 | 108 | should return 400 error if group not found for admin route | getTransactionsByGroup | Unit | WB - Statement Coverage |
 | 109 | should return 400 error if group not found for user route | getTransactionsByGroup | Unit | WB - Statement Coverage |
 | 110 | should return 401 error for unauthorized admin user | getTransactionsByGroup | Unit | WB - Statement Coverage |
 | 111 | should return 401 error for unauthorized user route | getTransactionsByGroup | Unit | WB - Statement Coverage |
 | 112 | should return 400 if group is not found for admin route | getTransactionsByGroupByCategory | Unit | WB - Statement Coverage |
 | 113 | should return 400 if group is not found for user route | getTransactionsByGroupByCategory | Unit | WB - Statement Coverage |
 | 114 | should return 400 if category is not found (admin route) | getTransactionsByGroupByCategory | Unit | WB - Statement Coverage |
 | 115 | should return 400 if category is not found (user route) | getTransactionsByGroupByCategory | Unit | WB - Statement Coverage |
 | 116 | should return 401 if user is not an admin (admin route) | getTransactionsByGroupByCategory | Unit | WB - Statement Coverage |
 | 117 | should return 401 if user does not belong to the group (user route) | getTransactionsByGroupByCategory | Unit | WB - Statement Coverage |
 | 118 | should return an empty array if no transactions found (admin route) | getTransactionsByGroupByCategory | Unit | WB - Statement Coverage |
 | 119 | should return an empty array if no transactions found (user route) | getTransactionsByGroupByCategory | Unit | WB - Statement Coverage |
 | 120 | should return an array of transactions if transactions found (admin route) | getTransactionsByGroupByCategory | Unit | WB - Statement Coverage |
 | 121 | should return an array of transactions if transactions found (user route) | getTransactionsByGroupByCategory | Unit | WB - Statement Coverage |
 | 122 | should return 400 if Transaction _id is missing in the request body | deleteTransaction | Unit | WB - Statement Coverage |
 | 123 | should return 400 if Transaction _id is empty in the request body | deleteTransaction | Unit | WB - Statement Coverage |
 | 124 | should return 400 if user is not found | deleteTransaction | Unit | WB - Statement Coverage |
 | 125 | should return 400 if transaction is not found | deleteTransaction | Unit | WB - Statement Coverage |
 | 126 | should return 400 if transaction belongs to a different user | deleteTransaction | Unit | WB - Statement Coverage |
 | 127 | should delete the transaction and return success message if authorized | deleteTransaction | Unit | WB - Statement Coverage |
 | 128 | should return 401 if not authorized | deleteTransaction | Unit | WB - Statement Coverage |
 | 129 | should return 401 if user is not an admin | deleteTransactions | Unit | WB - Statement Coverage |
 | 130 | should return 400 if request body is missing attributes | deleteTransactions | Unit | WB - Statement Coverage |
 | 131 | should return 400 if at least one id in the array is empty | deleteTransactions | Unit | WB - Statement Coverage |
 | 132 | should return 400 if the array of _id is empty | deleteTransactions | Unit | WB - Statement Coverage |
 | 133 | should return 400 if at least one id does not represent a transaction | deleteTransactions | Unit | WB - Statement Coverage |
 | 134 | should delete the transactions and return success message if authorized | deleteTransactions | Unit | WB - Statement Coverage |
 | 135 | should return empty list if there are no users | getUsers | Unit | WB - Statement Coverage |
 | 136 | should retrieve list of all users | getUsers | Unit | WB - Statement Coverage |
 | 137 | should return error 401 if the user requesting the list is not an admin | getUsers | Unit | WB - Statement Coverage |
 | 138 | should return error 400 User not found if there is no such user | getUser | Unit | WB - Statement Coverage |
 | 139 | should retrieve the user with the requested username | getUser | Unit | WB - Statement Coverage |
 | 140 | should return error 401 unauthorized | getUser | Unit | WB - Statement Coverage |
 | 141 | Create a new group successfully with all users added to the group | createGroup | Unit | WB - Statement Coverage |
 | 142 | Create a new group successfully with some users not added to the group | createGroup | Unit | WB - Statement Coverage |
 | 143 | Return error 400 if req.body does not contain all the necessary attributes | createGroup | Unit | WB - Statement Coverage |
 | 144 | Return error 400 if the group name in req.body is an empty string | createGroup | Unit | WB - Statement Coverage |
 | 145 | Return error 400 if the array of emails in req.body is empty | createGroup | Unit | WB - Statement Coverage |
 | 146 | Return error 400 if the group name in req.body represents an already existing group | createGroup | Unit | WB - Statement Coverage |
 | 147 | Return error 400 if all the provided emails represent users that are already in a group or do not exist in the database | createGroup | Unit | WB - Statement Coverage |
 | 148 | Return error 400 if the user who calls the API is already in a group | createGroup | Unit | WB - Statement Coverage |
 | 149 | Return error 400 if the user who calls the API does not exist | createGroup | Unit | WB - Statement Coverage |
 | 150 | Return error 400 if at least one of the member emails is not in a valid email format | createGroup | Unit | WB - Statement Coverage |
 | 151 | Return error 400 if at least one of the member emails is an empty string | createGroup | Unit | WB - Statement Coverage |
 | 152 | Return error 401 if called by a user who is not authenticated (authType = Simple) | createGroup | Unit | WB - Statement Coverage |
 | 153 | Return empty array if there are no groups | getGroups | Unit | WB - Statement Coverage |
 | 154 | Retrieve array of all groups | getGroups | Unit | WB - Statement Coverage |
 | 155 | Return error 401 if the user requesting the list is not an admin | getGroups | Unit | WB - Statement Coverage |
 | 156 | Return error 400 if there is no such group | getGroup | Unit | WB - Statement Coverage |
 | 157 | Should retrieve the group with the requested name | getGroup | Unit | WB - Statement Coverage |
 | 158 | Return error 401 if called by an authenticated user who is neither part of the group (authType = Group) nor an admin (authType = Admin) | getGroup | Unit | WB - Statement Coverage |
 | 159 | Return error 400 if req.body does not contain all necessary attributes | addToGroup | Unit | WB - Statement Coverage |
 | 160 | Return error 400 if the array of emails is empty | addToGroup | Unit | WB - Statement Coverage |
 | 161 | Return error 400 if group name does not represent a group in the database | addToGroup | Unit | WB - Statement Coverage |
 | 162 | Return error 400 if all provided emails represent users that are already in a group or do not exist | addToGroup | Unit | WB - Statement Coverage |
 | 163 | Return error 400 if at least one of the member emails is not in a valid email format | addToGroup | Unit | WB - Statement Coverage |
 | 164 | Return error 400 if at least one of the member emails is an empty string | addToGroup | Unit | WB - Statement Coverage |
 | 165 | Return error 401 if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/add | addToGroup | Unit | WB - Statement Coverage |
 | 166 | Return error 401 if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/insert | addToGroup | Unit | WB - Statement Coverage |
 | 167 | Successfully add the members to the group | addToGroup | Unit | WB - Statement Coverage |
 | 168 | Return error 400 if req.body does not contain all necessary attributes | removeFromGroup | Unit | WB - Statement Coverage |
 | 169 | Return error 400 if the array of emails is empty | removeFromGroup | Unit | WB - Statement Coverage |
 | 170 | Return error 400 if group name does not represent a group in the database | removeFromGroup | Unit | WB - Statement Coverage |
 | 171 | Return error 400 if all provided emails represent users that do not belong to the group or do not exist | removeFromGroup | Unit | WB - Statement Coverage |
 | 172 | Return error 400 if the group contains only one member before deleting any user | removeFromGroup | Unit | WB - Statement Coverage |
 | 173 | Return error 400 if at least one of the member emails is not in a valid email format | removeFromGroup | Unit | WB - Statement Coverage |
 | 174 | Return error 400 if at least one of the member emails is an empty string | removeFromGroup | Unit | WB - Statement Coverage |
 | 175 | Return error 401 if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/remove | removeFromGroup | Unit | WB - Statement Coverage |
 | 176 | Return error 401 if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/pull | removeFromGroup | Unit | WB - Statement Coverage |
 | 177 | Successfully remove the members from the group | removeFromGroup | Unit | WB - Statement Coverage |
 | 178 | Successfully remove the members from the group (but keep one member in the group) | removeFromGroup | Unit | WB - Statement Coverage |
 | 179 | Delete the user successfully (user does not belong to any group) | deleteUser | Unit | WB - Statement Coverage |
 | 180 | Delete the user successfully (user does belongs to a group, but isnt the last member) | deleteUser | Unit | WB - Statement Coverage |
 | 181 | Delete the user successfully (user is the last member of a group) | deleteUser | Unit | WB - Statement Coverage |
 | 182 | Return error 400 if the request body does not contain all the necessary attributes | deleteUser | Unit | WB - Statement Coverage |
 | 183 | Return error 400 if the email passed in the request body is an empty string | deleteUser | Unit | WB - Statement Coverage |
 | 184 | Return error 400 if the email passed in the request body is not in correct email format | deleteUser | Unit | WB - Statement Coverage |
 | 185 | Return error 400 if the email passed in the request body does not represent a user in the database | deleteUser | Unit | WB - Statement Coverage |
 | 186 | Return error 400 if the email passed in the request body represents an admin | deleteUser | Unit | WB - Statement Coverage |
 | 187 | Return error 401 if called by an authenticated user who is not an admin (authType = Admin) | deleteUser | Unit | WB - Statement Coverage |
 | 188 | Delete the group successfully | deleteGroup | Unit | WB - Statement Coverage |
 | 189 | Return error 400 if the request body does not contain all the necessary attributes | deleteGroup | Unit | WB - Statement Coverage |
 | 190 | Return error 400 if the name passed in the request body is an empty string | deleteGroup | Unit | WB - Statement Coverage |
 | 191 | Return error 400 if the name passed in the request body does not represent a group in the database | deleteGroup | Unit | WB - Statement Coverage |
 | 192 | Return error 401 if called by an authenticated user who is not an admin (authType = Admin) | deleteGroup | Unit | WB - Statement Coverage |
 | 193 | should get an error because of wrong format | handleDateFilterParams | Integration | WB - Statement Coverage |
 | 194 | should get an error because wrong combination of paramenters | handleDateFilterParams | Integration | WB - Statement Coverage |
 | 195 | should get an empty request to match all | handleDateFilterParams | Integration | WB - Statement Coverage |
 | 196 | should get a query to match a single day | handleDateFilterParams | Integration | WB - Statement Coverage |
 | 197 | should get a query to match from a date onwards | handleDateFilterParams | Integration | WB - Statement Coverage |
 | 198 | should get a query to match up to a certain date | handleDateFilterParams | Integration | WB - Statement Coverage |
 | 199 | should get a query to match from a date up to another | handleDateFilterParams | Integration | WB - Statement Coverage |
 | 200 | Simple verification is correct if tokens are valid | verifyAuth | Integration | WB - Statement Coverage |
 | 201 | If accessToken expired but refreshToken is still valid, a new accessToken is generated and then user authentication is performed | verifyAuth | Integration | WB - Statement Coverage |
 | 202 | If accessToken expired but refreshToken is still valid, a new accessToken is generated and then Admin authentication is performed | verifyAuth | Integration | WB - Statement Coverage |
 | 203 | If accessToken expired but refreshToken is still valid, a new accessToken is generated and then Group authentication is performed | verifyAuth | Integration | WB - Statement Coverage |
 | 204 | If one among accessToken, refreshToken is missing, Simple verification fails | verifyAuth | Integration | WB - Statement Coverage |
 | 205 | If token is missing some parameter, Simple verification fails | verifyAuth | Integration | WB - Statement Coverage |
 | 206 | If tokens contain (at least) one different value, Simple verification fails | verifyAuth | Integration | WB - Statement Coverage |
 | 207 | If provided username matches with the one stored inside the two (valid) tokens, User verification is correct | verifyAuth | Integration | WB - Statement Coverage |
 | 208 | If provided username does not match with the one stored inside the two (valid) tokens, User verification fails | verifyAuth | Integration | WB - Statement Coverage |
 | 209 | If email value stored inside the two tokens is contained in the provided array, Group verification is successful | verifyAuth | Integration | WB - Statement Coverage |
 | 210 | If email value stored inside the two tokens is not contained in the provided array, Group verification fails | verifyAuth | Integration | WB - Statement Coverage |
 | 211 | should get an error because query not a number | handleAmountFilterParams | Integration | WB - Statement Coverage |
 | 212 | should return an empty query to match all | handleAmountFilterParams | Integration | WB - Statement Coverage |
 | 213 | should return query to match from min amount upwards | handleAmountFilterParams | Integration | WB - Statement Coverage |
 | 214 | should return query to match up to max value | handleAmountFilterParams | Integration | WB - Statement Coverage |
 | 215 | should return query to match up to max value | handleAmountFilterParams | Integration | WB - Statement Coverage |
 | 216 | should return query to match from min to max value | handleAmountFilterParams | Integration | WB - Statement Coverage |
 | 217 | should return query that matches all since min > max | handleAmountFilterParams | Integration | WB - Statement Coverage |
 | 218 | register a valid new user | register | Integration | WB - Statement Coverage |
 | 219 | attempt to register a user previously registered,an error message is returned | register | Integration | WB - Statement Coverage |
 | 220 | register request body is missing parameters, an error message is returned | register | Integration | WB - Statement Coverage |
 | 221 | register request body contains empty parameter, an error message is returned | register | Integration | WB - Statement Coverage |
 | 222 | register request body contains email with invalid format, an error message is returned | register | Integration | WB - Statement Coverage |
 | 223 | attempt to register a user with email already in use by a registered user, an error message is returned | register | Integration | WB - Statement Coverage |
 | 224 | A new Admin is created when correct parameters are passed and corresponding user does not exist yet | registerAdmin | Integration | WB - Statement Coverage |
 | 225 | New admin is created also when function is called by a normal user | registerAdmin | Integration | WB - Statement Coverage |
 | 226 | A new Admin is not created when new Admin information is missing | registerAdmin | Integration | WB - Statement Coverage |
 | 227 | A new Admin is not created when new Admin information contains empty values | registerAdmin | Integration | WB - Statement Coverage |
 | 228 | A new admin cannot be created if a user with same username alredy exists | registerAdmin | Integration | WB - Statement Coverage |
 | 229 | A new admin cannot be created if a user with same email alredy exists | registerAdmin | Integration | WB - Statement Coverage |
 | 230 | A new admin cannot be created if a email is not in a valid format | registerAdmin | Integration | WB - Statement Coverage |
 | 231 | if user is registered and request is valid, user is logged in | login | Integration | WB - Statement Coverage |
 | 232 | if user is registered but request is not valid, login fails | login | Integration | WB - Statement Coverage |
 | 233 | if user is not registered, login fails | login | Integration | WB - Statement Coverage |
 | 234 | if email is not in a valid format, login fails | login | Integration | WB - Statement Coverage |
 | 235 | if user is logged in, it is successfully logged out | logout | Integration | WB - Statement Coverage |
 | 236 | if user is not logged in (missing refreshToken), logout fails | logout | Integration | WB - Statement Coverage |
 | 237 | if user is not registered, logout fails | logout | Integration | WB - Statement Coverage |
 | 238 | If a category with same attributes already exists, new category is not created | createCategory | Integration | WB - Statement Coverage |
 | 239 | If one among body attributes contains an empty value, new category is not created | createCategory | Integration | WB - Statement Coverage |
 | 240 | If body does not contain at least one attribute, new category is not created | createCategory | Integration | WB - Statement Coverage |
 | 241 | Test that a user without admin privileges cannot create a new category | createCategory | Integration | WB - Statement Coverage |
 | 242 | Test that a user with admin privileges can successfully create a new category | createCategory | Integration | WB - Statement Coverage |
 | 243 | Update an existing category and verify the update | Update Category | Integration | WB - Statement Coverage |
 | 244 | Attempt to update a category without authentication and verify that it returns an appropriate error response | Update Category | Integration | WB - Statement Coverage |
 | 245 | Attempt to update a category with a non-admin user and verify that it returns an appropriate error response | Update Category | Integration | WB - Statement Coverage |
 | 246 | If update is called on a non-existing category, an error message is returned | Update Category | Integration | WB - Statement Coverage |
 | 247 | If one among body attributes contains an empty value, category is not updated | Update Category | Integration | WB - Statement Coverage |
 | 248 | If body does not contain at least one attribute, category is not updated | Update Category | Integration | WB - Statement Coverage |
 | 249 | If only one category exists, it cannot be deleted | deleteCategory | Integration | WB - Statement Coverage |
 | 250 | If deletion is requested for all existing categories, only the oldest one is kept and all transactions are moved into it | deleteCategory | Integration | WB - Statement Coverage |
 | 251 | Test if deleting a non-existent category returns an appropriate error | deleteCategory | Integration | WB - Statement Coverage |
 | 252 | Test if deleting a category removes it from all transactions | deleteCategory | Integration | WB - Statement Coverage |
 | 253 | Deleting a category is restricted to admin users | deleteCategory | Integration | WB - Statement Coverage |
 | 254 | If categories array contains at least one empty string, an error message is returned | deleteCategory | Integration | WB - Statement Coverage |
 | 255 | If categories array contains at least one non-existing category, an error message is returned | deleteCategory | Integration | WB - Statement Coverage |
 | 256 | A user with the correct authentication tokens can successfully retrieve the list of categories | getCategories | Integration | WB - Statement Coverage |
 | 257 | A user without authentication tokens receives an error when trying to retrieve the list of categories | getCategories | Integration | WB - Statement Coverage |
 | 258 | A user correctly requests to create a new transaction | createTransaction | Integration | WB - Statement Coverage |
 | 259 | If body does not contain some attributes, new transaction is not created | createTransaction | Integration | WB - Statement Coverage |
 | 260 | If body contain some attributes with empty value, new transaction is not created | createTransaction | Integration | WB - Statement Coverage |
 | 261 | amount | createTransaction | Integration | WB - Statement Coverage |
 | 262 | If usernames provided in the request body and route parameters do not match, new transaction is not created | createTransaction | Integration | WB - Statement Coverage |
 | 263 | If provided category does not exist, new transaction is not created | createTransaction | Integration | WB - Statement Coverage |
 | 264 | If username is requesting to create a transaction for another user, new transaction is not created | createTransaction | Integration | WB - Statement Coverage |
 | 265 | If username is requesting to create a transaction for another user, new transaction is not created | createTransaction | Integration | WB - Statement Coverage |
 | 266 | Returns all transactions from the transactions collection when called without any filters | getAllTransactions | Integration | WB - Statement Coverage |
 | 267 | Returns an empty array if there are no transactions in the transactions collection | getAllTransactions | Integration | WB - Statement Coverage |
 | 268 | Returns error 401 if the user is not an admin | getAllTransactions | Integration | WB - Statement Coverage |
 | 269 | A regular user correctly requests access to its personal transactions | getTransactionsByUser | Integration | WB - Statement Coverage |
 | 270 | A regular user requests access to another user personal transactions, an error message is returned | getTransactionsByUser | Integration | WB - Statement Coverage |
 | 271 | A regular user correctly requests access to its personal transactions, filtered by type (i.e. category name) | getTransactionsByUser | Integration | WB - Statement Coverage |
 | 272 | A regular user correctly requests access to its personal transactions, filtered by date | getTransactionsByUser | Integration | WB - Statement Coverage |
 | 273 | A regular user correctly requests access to its personal transactions, filtered by date range | getTransactionsByUser | Integration | WB - Statement Coverage |
 | 274 | minimum | getTransactionsByUser | Integration | WB - Statement Coverage |
 | 275 | A regular user correctly requests access to its personal transactions, filtered by minimum amount | getTransactionsByUser | Integration | WB - Statement Coverage |
 | 276 | A regular user correctly requests access to its personal transactions, filtered by amount range | getTransactionsByUser | Integration | WB - Statement Coverage |
 | 277 | An Admin correctly requests access to another user personal transactions | getTransactionsByUser | Integration | WB - Statement Coverage |
 | 278 | A regular user requests access to another user personal transactions by calling Admin-exclusive route, an error message is returned | getTransactionsByUser | Integration | WB - Statement Coverage |
 | 279 | An Admin correctly requests access to transactions of a non-existing user, an error message is returned | getTransactionsByUser | Integration | WB - Statement Coverage |
 | 280 | A regular user correctly requests access to its personal transactions under a given category | getTransactionsByUserByCategory | Integration | WB - Statement Coverage |
 | 281 | A regular user requests access to transactions under a non-existing category, an error message is returned | getTransactionsByUserByCategory | Integration | WB - Statement Coverage |
 | 282 | A regular user requests access to another user personal transactions under a given category, an error message is returned | getTransactionsByUserByCategory | Integration | WB - Statement Coverage |
 | 283 | A regular user requests access to another user personal transactions, under a given category, by calling Admin-exclusive route, an error message is returned | getTransactionsByUserByCategory | Integration | WB - Statement Coverage |
 | 284 | An Admin requests access to a non-existing user transactions under a given category, an error message is returned | getTransactionsByUserByCategory | Integration | WB - Statement Coverage |
 | 285 | An Admin requests access to an existing user transactions under a non-existing category, an error message is returned | getTransactionsByUserByCategory | Integration | WB - Statement Coverage |
 | 286 | An Admin correctly requests access to a user transactions under a given category | getTransactionsByUserByCategory | Integration | WB - Statement Coverage |
 | 287 | A regular user correctly requests access to its belonging group transactions | getTransactionsByGroup | Integration | WB - Statement Coverage |
 | 288 | A regular user requests access to transactions of a group it does not belong to, an error message is returned | getTransactionsByGroup | Integration | WB - Statement Coverage |
 | 289 | A regular user requests access to transactions of a non-existing group, an error message is returned | getTransactionsByGroup | Integration | WB - Statement Coverage |
 | 290 | An Admin correctly access not-belonging group transactions | getTransactionsByGroup | Integration | WB - Statement Coverage |
 | 291 | A regular user correctly requests access to its belonging group transactions, under a given category | getTransactionsByGroupByCategory | Integration | WB - Statement Coverage |
 | 292 | A regular user requests access to transactions, under a given category, of a group it does not belong to, an error message is returned | getTransactionsByGroupByCategory | Integration | WB - Statement Coverage |
 | 293 | A regular user requests access to transactions of a non-existing group, an error message is returned | getTransactionsByGroupByCategory | Integration | WB - Statement Coverage |
 | 294 | A regular user requests access to transactions of its group, under a non-existing category, an error message is returned | getTransactionsByGroupByCategory | Integration | WB - Statement Coverage |
 | 295 | An Admin correctly access not-belonging group transactions filtered by a given category | getTransactionsByGroupByCategory | Integration | WB - Statement Coverage |
 | 296 | A regular user request not-belonging group transactions filtered by a given category from admin-exclusive route, an error message is returned | getTransactionsByGroupByCategory | Integration | WB - Statement Coverage |
 | 297 | A regular user correctly requests to delete one of its transactions | deleteTransaction | Integration | WB - Statement Coverage |
 | 298 | A regular user requests to delete another user personal transaction, an error message is returned | deleteTransaction | Integration | WB - Statement Coverage |
 | 299 | Transaction _id cannot be omitted in the request body, an error message is returned | deleteTransaction | Integration | WB - Statement Coverage |
 | 300 | Transaction _id in the request body cannot be an empty string, an error message is returned | deleteTransaction | Integration | WB - Statement Coverage |
 | 301 | _id in the request body must identify a valid transaction, an error message is returned | deleteTransaction | Integration | WB - Statement Coverage |
 | 302 | An Admin correctly requests to delete a user personal transaction | deleteTransaction | Integration | WB - Statement Coverage |
 | 303 | An Admin correctly requests to delete a set of transactions | deleteTransactions | Integration | WB - Statement Coverage |
 | 304 | If the _ids array contains an empty _id value, an error message is returned | deleteTransactions | Integration | WB - Statement Coverage |
 | 305 | If the _ids parameter is not set in the request body, an error message is returned | deleteTransactions | Integration | WB - Statement Coverage |
 | 306 | If the _ids array contains a valid format _id value not representing an existing transaction, an error message is returned | deleteTransactions | Integration | WB - Statement Coverage |
 | 307 | If deleteTransactions is called by a regular user, an error message is returned | deleteTransactions | Integration | WB - Statement Coverage |
 | 308 | should return empty list if there are no users | getUsers | Integration | WB - Statement Coverage |
 | 309 | should retrieve list of all users | getUsers | Integration | WB - Statement Coverage |
 | 310 | should return error 401 if the user requesting the list is not an admin | getUsers | Integration | WB - Statement Coverage |
 | 311 | should return error 400 User not found if there is no such user | getUser | Integration | WB - Statement Coverage |
 | 312 | should retrieve the user with the requested username if an admin is calling the API | getUser | Integration | WB - Statement Coverage |
 | 313 | should retrieve the user with the requested username if the same user is calling the API | getUser | Integration | WB - Statement Coverage |
 | 314 | should return error 401 unauthorized if the user is not an admin and is requesting info about another user | getUser | Integration | WB - Statement Coverage |
 | 315 | Create a new group successfully with all users added to the group | createGroup | Integration | WB - Statement Coverage |
 | 316 | Create a new group successfully with some users not added to the group | createGroup | Integration | WB - Statement Coverage |
 | 317 | Return error 400 if req.body does not contain all the necessary attributes | createGroup | Integration | WB - Statement Coverage |
 | 318 | Return error 400 if the group name in req.body is an empty string | createGroup | Integration | WB - Statement Coverage |
 | 319 | Return error 400 if the array of emails is empty | createGroup | Integration | WB - Statement Coverage |
 | 320 | Return error 400 if the group name in req.body represents an already existing group | createGroup | Integration | WB - Statement Coverage |
 | 321 | Return error 400 if all the provided emails represent users that are already in a group or do not exist in the database | createGroup | Integration | WB - Statement Coverage |
 | 322 | Return error 400 if the user who calls the API is already in a group | createGroup | Integration | WB - Statement Coverage |
 | 323 | Return error 400 if the user who calls the API does not exist | createGroup | Integration | WB - Statement Coverage |
 | 324 | Return error 400 if at least one of the member emails is not in a valid email format | createGroup | Integration | WB - Statement Coverage |
 | 325 | Return error 400 if at least one of the member emails is an empty string | createGroup | Integration | WB - Statement Coverage |
 | 326 | Return error 401 if called by a user who is not authenticated (authType = Simple) | createGroup | Integration | WB - Statement Coverage |
 | 327 | Return empty array if there are no groups | getGroups | Integration | WB - Statement Coverage |
 | 328 | Retrieve array of all groups | getGroups | Integration | WB - Statement Coverage |
 | 329 | Return error 401 if the user requesting the list is not an admin | getGroups | Integration | WB - Statement Coverage |
 | 330 | Return error 400 if the group requested does not exist | getGroup | Integration | WB - Statement Coverage |
 | 331 | Should retrieve the group with the requested name if an admin is calling the API | getGroup | Integration | WB - Statement Coverage |
 | 332 | should retrieve the requested group if the user calling the API is a member of the group | getGroup | Integration | WB - Statement Coverage |
 | 333 | Return error 401 if called by an authenticated user who is neither part of the group (authType = Group) nor an admin (authType = Admin) | getGroup | Integration | WB - Statement Coverage |
 | 334 | Return error 400 if req.body does not contain all necessary attributes | addToGroup | Integration | WB - Statement Coverage |
 | 335 | Return error 400 if the array of emails is empty | addToGroup | Integration | WB - Statement Coverage |
 | 336 | Return error 400 if group name does not represent a group in the database | addToGroup | Integration | WB - Statement Coverage |
 | 337 | Return error 400 if all provided emails represent users that are already in a group or do not exist | addToGroup | Integration | WB - Statement Coverage |
 | 338 | Return error 400 if at least one of the member emails is not in a valid email format | addToGroup | Integration | WB - Statement Coverage |
 | 339 | Return error 400 if at least one of the member emails is an empty string | addToGroup | Integration | WB - Statement Coverage |
 | 340 | Return error 401 if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/add | addToGroup | Integration | WB - Statement Coverage |
 | 341 | Return error 401 if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/insert | addToGroup | Integration | WB - Statement Coverage |
 | 342 | Successfully add the members to the group | addToGroup | Integration | WB - Statement Coverage |
 | 343 | Return error 400 if req.body does not contain all necessary attributes | removeFromGroup | Integration | WB - Statement Coverage |
 | 344 | Return error 400 if the array of emails is empty | removeFromGroup | Integration | WB - Statement Coverage |
 | 345 | Return error 400 if group name does not represent a group in the database | removeFromGroup | Integration | WB - Statement Coverage |
 | 346 | Return error 400 if all provided emails represent users that do not belong to the group or do not exist | removeFromGroup | Integration | WB - Statement Coverage |
 | 347 | Return error 400 if at least one of the member emails is not in a valid email format | removeFromGroup | Integration | WB - Statement Coverage |
 | 348 | Return error 400 if the group contains only one member before deleting any user | removeFromGroup | Integration | WB - Statement Coverage |
 | 349 | Return error 400 if at least one of the member emails is an empty string | removeFromGroup | Integration | WB - Statement Coverage |
 | 350 | Return error 401 if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/remove | removeFromGroup | Integration | WB - Statement Coverage |
 | 351 | Return error 401 if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/pull | removeFromGroup | Integration | WB - Statement Coverage |
 | 352 | Successfully remove the members from the group | removeFromGroup | Integration | WB - Statement Coverage |
 | 353 | Delete the user successfully (user does not belong to any group) | deleteUser | Integration | WB - Statement Coverage |
 | 354 | Delete the user successfully (user does belongs to a group, but isnt the last member) | deleteUser | Integration | WB - Statement Coverage |
 | 355 | Delete the user successfully (user is the last member of a group) | deleteUser | Integration | WB - Statement Coverage |
 | 356 | Return error 400 if the request body does not contain all the necessary attributes | deleteUser | Integration | WB - Statement Coverage |
 | 357 | Return error 400 if the email passed in the request body is an empty string | deleteUser | Integration | WB - Statement Coverage |
 | 358 | Return error 400 if the email passed in the request body is not in correct email format | deleteUser | Integration | WB - Statement Coverage |
 | 359 | Return error 400 if the email passed in the request body does not represent a user in the database | deleteUser | Integration | WB - Statement Coverage |
 | 360 | Return error 400 if the email passed in the request body represents an admin | deleteUser | Integration | WB - Statement Coverage |
 | 361 | Return error 401 if called by an authenticated user who is not an admin (authType = Admin) | deleteUser | Integration | WB - Statement Coverage |
 | 362 | Delete the group successfully | deleteGroup | Integration | WB - Statement Coverage |
 | 363 | Return error 400 if the request body does not contain all the necessary attributes | deleteGroup | Integration | WB - Statement Coverage |
 | 364 | Return error 400 if the name passed in the request body is an empty string | deleteGroup | Integration | WB - Statement Coverage |
 | 365 | Return error 400 if the name passed in the request body does not represent a group in the database | deleteGroup | Integration | WB - Statement Coverage |
 | 366 | Return error 401 if called by an authenticated user who is not an admin (authType = Admin) | deleteGroup | Integration | WB - Statement Coverage |


# Coverage



## Coverage of FR

| Functional Requirements covered |   Test(s) Number| 
| ------------------------------- | ----------- | 
|  FR1 Manage users                         | |
| FR11 register                             | 42,43,44,45,218,219,220,221,222,223 |
| FR12 login                                | 50,51,52,231,232,233,234 |
| FR13 logout                               | 53,54,55,235,236,237 |
| FR14 registerAdmin                        | 46,47,48,49,224,225,226,227,228,229,230 |
| FR15 getUsers                             | 135,136,137,308,309,310 |
| FR16 getUser                              | 138,139,140,311,312,313,314 |
| FR17 deleteUser                           | 179,180,181,182,183,184,185,186,187,353,354,355,356,357,358,359,360,361 | 
| FR2  Manage groups                        ||
| FR21 createGroup                          | 141,142,143,144,145,146,147,148,149,150,151,152,315,316,317,318,319,320,321,322,323,324,325,326 |
| FR22 getGroups                            | 153,154,155,327,328,329 |
| FR23 getGroup                             | 156,157,158,330,331,332,333 | 
| FR24 addToGroup                           | 159,160,161,162,163,164,165,166,167,334,335,336,337,338,339,340,341,342 | 
| FR26 removeFromGroup                      | 168,169,170,171,172,173,174,175,176,177,178,343,344,345,346,347,348,349,350,351,352 |
| FR28 deleteGroup                          | 188,189,190,191,192,362,363,364,365,366 |
|  FR3 Manage  transactions                 |  |
| FR31 createTransaction                    | 76,77,78,79,80,81,82,83,84,258,259,260,261,262,263,264,265 |     
| FR32 getAllTransactions                   | 85,86,87,266,267,268 |
| FR33 getTransactionsByUser                | 88,89,90,91,92,93,269,270,271,272,273,274,275,276,277,278,279 |
| FR34 getTransactionsByUserByCategory      | 94,95,96,97,98,99,100,101,102,103,280,281,282,283,284,285,286 | 
| FR35 getTransactionsByGroup               | 104,105,106,107,108,109,110,111,287,288,289,290 |
| FR36 getTransactionsByGroupByCategory     | 112,113,114,115,116,117,118,119,120,121,291,292,293,294,295,296 |
| FR37 deleteTransaction                    | 122,123,124,125,126,127,128,297,298,299,300,301,302 |
| FR38 deleteTransactions                   | 129,130,131,132,133,134,303,304,305,306,307 |
|  FR4 Manage categories                    ||
| FR41 createCategory                       | 56,57,58,59,60,238,239,240,241,242 |
| FR42 updateCategory                       | 61,62,63,64,65,66,243,244,245,246,247,248 |
| FR43 deleteCategory                       | 67,68,69,70,71,72,249,250,251,252,253,254,255 |
| FR44 getCategories                        | 73,74,75,256,257 |  



## Coverage white box


![Coverage White Box](/images/coverage.png)




