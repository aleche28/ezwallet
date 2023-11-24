# Requirements Document - current EZWallet

Date: 28/04/2023

Version: V1 - description of EZWallet in CURRENT form (as received by teachers)

| Version number | Change |
| ----------------- |:-----------|
|1.0 | Basic requirements for the first version of the app.|

# Contents

- [Informal description](#informal-description)
- [Business Model](#business-model)
- [Stakeholders](#stakeholders)
- [Context Diagram and interfaces](#context-diagram-and-interfaces)
  - [Context Diagram](#context-diagram)
  - [Interfaces](#interfaces)

- [Stories and personas](#stories-and-personas)
- [Functional and non functional requirements](#functional-and-non-functional-requirements)
  - [Functional Requirements](#functional-requirements)
  - [Non functional requirements](#non-functional-requirements)
- [Use case diagram and use cases](#use-case-diagram-and-use-cases)
  - [Use case diagram](#use-case-diagram)
  - [Use cases](#use-cases)
    - [Relevant scenarios](#relevant-scenarios)
- [Glossary](#glossary)
- [System design](#system-design)
- [Deployment diagram](#deployment-diagram)
- [Table of defects](#table-of-defects)

# Informal description

EZWallet (read EaSy Wallet) is a software application designed to help individuals and families keep track of their expenses. Users can enter and categorize their expenses, allowing them to quickly see where their money is going. EZWallet is a powerful tool for those looking to take control of their finances and make informed decisions about their spending.

# Business model
The software is an open source project available on git and free to use.

# Stakeholders

| Stakeholder name  | Description |
| ----------------- |:-----------:|
|   User     | Uses the app functionalities|
|   Admin     | Can see see the user list, manage accounts|


# Context Diagram and interfaces

## Context Diagram

![Context Diagram V1](/images/ezwallet_context_v1.png)

## Actors

Admin not included here since there is still no admin figure in the actual code.

| Actor name  | Description |
| ----------------- |:-----------:|
|   User     | Intereacts with app to use its functionalities |


## Interfaces

At the current code state the interfaces are just http requests but the actual ones (the ones we are proposing GUI protoypes for) are the following.
We excluded the Admin since there is still no specific code for it in the app but in the next version it will have a GUI web interface.

| Actor | Logical Interface | Physical Interface  |
| ------------- |:-------------:| -----:|
| User     | App GUI & Web GUI | Smartphone & PC|

# Stories and personas

Persona 1 : User : College student wants to track his expenses during the month since he has very limited budget, still has no account created
Persona 2 : User : Family members that wants to add its expenses to the monthly expenses of the family to keep track of the indiviual contributions

**Persona 1 :** Full-time College student, male, 21 years old

**Story:** He wants to track his monthly expenses in order to pay for tuition, books, and living expenses. He is always busy because    of   the classes he attends as well as his work. That's why he wants to track his expenses because he has a limited budget which he cannot exceed. 

**Persona 2 :** Parent, female, 35 years old

**Story:** She is a full-time working mother who doesn't have a lot of free time because of her work and her household responsibilities. She values convenience and efficiency. She prioritizes some of her free time to manage her expenses and finances. 
  

**Persona 3 :** Traveler, male, 42 years old

**Story:** He is a traveller that is always on-the-go and needs to manage his expenses directly on the spot. He needs a tool that will help him do that in a secure and convenient way and can work directly by using the mobile phone. In addition to categorizing his expenses based on their type. 

**Persona 4 :** Small business owner, female, 52 years old

**Story:** She owns an online clothing store that ships clothes all over the world. She wants to be able manage and keep track of her finances which includes her employees's salaries, inventory purchases as well as received payments from customers.

# Functional and non functional requirements

## Functional Requirements


| ID        | Description  |
| ------------- |:-------------:|
|  **FR1**     | **Manage Authentication** |
|  FR1.1     |  Register |
|  FR1.2     |  Login |
|  FR1.3     |  Logout |
|  **FR2**  | **Manage Categories**|
|  FR2.1  | Create Category|
|  FR2.2  | Get Categories|
|  **FR3**  | **Manage Transactions**|
|  FR3.1  | Create Transaction|
|  FR3.2  | Delete Transaction|
|  FR3.3  | Get Transactions|
|  FR3.4  | Get all transactions with its related category info|
|  **FR4**  | **Manage Users**|
|  FR4.1  | Get all users -for now just implemented in code, still no admin control-|
|  FR4.2  | Get users by username|

## Non Functional Requirements

| ID        | Type (efficiency, reliability, ..)           | Description  | Refers to |
| ------------- |:-------------:| :-----:| -----:|
|  NFR1     |Security   |   | FR1 Manage Authentication|
|  NFR1.1   |Security   |Password should be hashed and then stored (i.e. not stored in cleartext) | FR1 Manage Authentication|
|  NFR1.2   |Security   |Reset access cookies after 7 days| FR1 Manage Authentication|
|  NFR2     |Maintanability| Well organized tests in docker container|All functionalities |
|  NFR3     |Ease of use |  | All functionalities  |
|  NFR3.1 |Ease of use |User doesn't need to re-enter its credential each time (Access tokens)| FR1 Manage Authentication |
|  NFR3.2 |Ease of use |In the GUI all functions should be reachable in less than 6 clicks | All functionalities  |

# Use case diagram and use cases

## Use case diagram

![Use Case V1](/UseCases/UseCasesV1/UseCasesV1.png)

### Use case 1, UC1 - Register

| Actors Involved        | User |
| ------------- |:-------------:|
|  Precondition     | User is not already registered: it doesn't already exist a User inside the application with the provided email |
|  Post condition     | User becomes a EZWallet subscriber  |
|  Nominal Scenario     | 1) User is asked to register<br>2) User chooses and sends its username, email and password<br>3) Application checks if provided email is not already in use (if true: User Already Registered error)<br>4) Application stores new User's information; password is previously hashed<br>5) User is registered|
|  Variants     |  - |
|  Exceptions     | User Already Registered<br>Bad Request (400)<br>Internal Server error (500) |

##### Scenario 1.1

| Scenario 1.1 | Nominal |
| ------------- |:-------------:|
|  Precondition     | User is not already registered |
|  Post condition     | User becomes a EZWallet subscriber |
| Step#        | Description  |
|  1     | User is asked to register |  
|  2     |  User chooses and sends its username, email and password |
|  3    | Application checks if provided email is not already in use (if true: User Already Registered error)  |
| 4  | Application stores new User's information; password is previously hashed |
| 5  | User is registered |

##### Scenario 1.2

| Scenario 1.2 | Exception |
| ------------- |:-------------:|
|  Precondition     | User wants to register using an email already in use (i.e. already binded to a registered existing account)|
|  Post condition     | Execution ends with exception: User Already Registered |
| Step#        | Description  |
|  1     | User is asked to register |  
|  2     |  User chooses and sends its username, email and password |
|  3    | Application checks if provided email is not already in use (if true: User Already Registered error)  |
| 4  | Application detects that provided email is already in use and rejects the request with an error message for the User |
| 5  | User is not registered |

### Use case 2, UC2 - Login

| Actors Involved        | User |
| ------------- |:-------------:|
|  Precondition     | User is not authenticated in the application:<br>application was not previously opened <br>or<br> refresh token has expired |
|  Post condition     |   A new pair: access token, refresh token is generated, User is authenticated and has access to all application functionalities   |
|  Nominal Scenario     | 1) User (Claimant at this stage) is asked to perform Login<br>2) User inserts its credentials (email, password)<br>3) Application searches inside the database for an already registered user with email parameter matching the one  provided by the User/Claimant (if not found: Not existing User error)<br>4) Application checks if it exists a valid access token from the session cookies (if true: User Already Registered error)<br>5) Application checks if found user's password matches with User/Claimant provided one (if false: Wrong Credentials error)<br>6) Application generates a new pair: access token, refresh token; the latter is saved inside application's database together with the other user's info<br>7) User is logged in  |
|  Variants     |  - |
|  Exceptions     | Wrong Credentials<br>Not Existing User<br>User already Logged In<br>Bad Request (400)<br>Internal Server error (500) |

##### Scenario 2.1

| Scenario 2.1 | Nominal |
| ------------- |:-------------:|
|  Precondition     | User is not authenticated in the application:<br>application was not previously opened |
|  Post condition     | User is authenticated and has access to all application functionalities |
| Step#        | Description  |
|  1     | User is asked to perform Login  |  
|  2     |  User inserts its (valid) credentials |
|  3    | Application searches inside the database for an already registered user with email parameter matching the one  provided by the User  |
| 4  | Application checks if found user's password matches with User provided one |
| 5  | Application generates the needed tokens |
| 6  | User is logged in |

##### Scenario 2.2

| Scenario 2.2 | Exception |
| ------------- |:-------------:|
|  Precondition     | User is already authenticated in the application (Application already opened) |
|  Post condition     | Execution ends with exception: User Already Logged In |
| Step#        | Description  |  
|  1     | User accesses Login functionality  |  
|  2     | User inserts its (valid) credentials |
|  3    | Application searches inside the database for an already registered user with email parameter matching the one provided by the User
|  4     | Application checks if it exists a valid access token from the session cookies |
| 5 | Application detects that there is a valid access token for the current session and rejects the request with an error message for the User |

### Use case 3, UC3 - Logout

| Actors Involved        | User |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the application: User has previously performed Login and refresh token has not expired yet |
|  Post condition     |   User is no more authenticated and all application's functionalities are no more usable
| Nominal Scenario  | 1) User asks Application to perform Logout functionality<br>2) Application checks if one among access token and/or refresh token is no more valid (if true: User Already Logged Out error)<br>3) Application erase all User's cookies and delete previously saved refresh token<br>4) User is logged out |
|  Variants     |  - |
|  Exceptions     | User Already Logged Out<br>User Not Found (401) (refresh token has already expired)<br>Internal Server error (500) |
 
##### Scenario 3.1

| Scenario 3.1 | Nominal |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the application |
|  Post condition     | User is no more authenticated and all application's functionalities are no more usable |
| Step#        | Description  |
|  1    | User selects the "Logout" option |  
|  2    |  Application checks if one among access token and/or refresh token is no more valid |
|  3 | Application erase all User's cookies and delete previously saved refresh token  |
| 4 | User is logged out |

##### Scenario 3.2

| Scenario 3.2 | Exception |
| ------------- |:-------------:|
|  Precondition     | User is not authenticated in the application |
|  Post condition     | Execution ends with exception: User Already Logged Out |
| Step#        | Description  |
|  1    | User selects the "Logout" option |  
|  2    |  Application checks if one among access token and/or refresh token is no more valid |
|  3 | Application detects that both refresh token and access token are invalid and rejects the request with an error message for the User |

### Use case 4, UC4 - Create Category

| Actors Involved        | User |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the application |
|  Post condition     | A new Category record is created, characterized by User's provided attributes (type, color) |
| Nominal Scenario  | 1) User chooses and sends to the Application the new Category attributes' value of color and type <br>2) Application checks if user is authenticated through the validity of the session's access token (if false: Unauthorized error)<br>3) Application creates a new Category with User's given attributes |
|  Variants     |  - |
|  Exceptions     | Unauthorized<br>Bad Request (400) |

##### Scenario 4.1

| Scenario 4.1 | Nominal |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the Application |
|  Post condition     | A new Category record is created |
| Step#        | Description  |
|  1    | User selects the "Create Categories" option |  
|  2    |  Application checks if user is authenticated |
|  3 | Application creates the required Category record |

### Use case 5, UC5 - Get Categories

| Actors Involved        | User |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the Application |
|  Post condition     | All existing application Categories records are retrieved and displayed to the User (i.e. without any check on the User who created them) 
| Nominal Scenario  | 1) User asks the Application for all existing Categories records  <br>2) Application checks if user is authenticated through the validity of the session's access token (if false: Unauthorized error) <br>3) Application returns to the User all stored Category records |
|  Variants     |  - |
|  Exceptions     | Unauthorized (401) |

##### Scenario 5.1

| Scenario 5.1 | Nominal |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the Application |
|  Post condition     | All Category records are returned to the User |
| Step#        | Description  |
|  1    | User selects the "Get Categories" option |  
|  2    |  Application checks if user is authenticated |
|  3 | Application display all Category records |

### Use case 6, UC6 - Create Transaction

| Actors Involved        | User |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the Application |
|  Post condition    | A new Transaction record is created, characterized by User's provided attributes (name, type, amount, date) |
| Nominal Scenario  | 1) User chooses and sends to the Application the new Transaction attributes' values<br>2) Application checks if user is authenticated through the validity of the session's access token (if false: Unauthorized error)<br>3) Application creates a new Transaction with User's given attributes |
|  Variants     |  - |
|  Exceptions     | Unauthorized (401)<br>Bad Request (400) |

##### Scenario 6.1

| Scenario 6.1 | Nominal |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the Application |
|  Post condition     | A new Transaction record is created |
| Step#        | Description  |
|  1    | User selects the "Create Transaction" option |  
|  2    |  Application checks if user is authenticated |
|  3 | Application creates the required Transaction record |


### Use case 7, UC7 - Get Transactions

| Actors Involved        | User |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the Application |
|  Post condition    | All available Transactions inside the application are retrieved and displayed to User (i.e. without any check on the User who created them) |
| Nominal Scenario  |  1) User asks the Application for all existing Transaction records  <br>2) Application checks if user is authenticated through the validity of the session's access token (if false: Unauthorized error) <br>3) Application returns to the User all stored Transaction records  |
|  Variants     |  - |
|  Exceptions     | Unauthorized (401) |

##### Scenario 7.1

| Scenario 7.1 | Nominal |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the Application |
|  Post condition     | All available Transactions are retrieved and displayed to User |
| Step#        | Description  |
|  1    | User selects the "Get Transactions" option |  
|  2    |  Application checks if user is authenticated |
|  3 | Application retrieves and display all available Transaction records to User |


### Use case 8, UC8 - Delete Transaction (By ID)

| Actors Involved        | User |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the Application |
|  Post condition    | Retrieved Transaction is deleted from the Application database |
| Nominal Scenario  | 1) User asks the Application for a specific Transaction to be retrieved, through its ID<br>2) Application checks if user is authenticated through the validity of the session's access token (if false: Unauthorized error)<br>3) Application deletes from the database the retrieved Transaction |
|  Variants     | - |
|  Exceptions     | Unauthorized (401) |

##### Scenario 8.1

| Scenario 8.1 | Nominal |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the Application |
|  Post condition     | A specific Transaction record is deleted (if retrieved) |
| Step#        | Description  |
|  1    | User selects the "Delete Transactions" option and choose the corresponding Transaction ID |  
|  2    |  Application checks if user is authenticated |
|  3 | Application deletes the Transaction (if it exists) |


### Use case 9, UC9 - Get Transactions with Category info

| Actors Involved        | User |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the Application |
|  Post condition    | All available Transactions are retrieved and displayed to User together with their Category info (type, color) |
| Nominal Scenario  | 1) User asks the Application for all existing Transaction records, binded to their Category  <br>2) Application checks if user is authenticated through the validity of the session's access token (if false: Unauthorized error) <br>3) Application returns to the User all stored Transaction records with Category info   |
|  Variants     | - |
|  Exceptions     | Unauthorized (401) |


##### Scenario 9.1

| Scenario 9.1 | Nominal |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the Application |
|  Post condition     | All Transactions together with their Category's info are retrieved and displayed to User |
| Step#        | Description  |
|  1    | User selects the "Get Labels" option |  
|  2    |  Application checks if user is authenticated |
|  3 | Application retrieves and display the requested data |

### Use case 10, UC10 - Get All Users

| Actors Involved        | User |
| ------------- |:-------------:|
|  Precondition     | User should be authenticated in the Application and have Admin privileges, but at the moment these authorization controls are not yet implemented |
|  Post condition    | All registered users' info are retrieved and displayed to User |
| Nominal Scenario  | 1) User asks the Application for the list of all registered users<br>2) Application retrieves all available user records and display them to User  |
|  Variants     |  - |
|  Exceptions     | Internal Server error (500) |

##### Scenario 10.1

| Scenario 10.1 | Nominal |
| ------------- |:-------------:|
|  Precondition     | Application is running |
|  Post condition     | All registered users are retrieved and displayed |
| Step#        | Description  |
|  1    | User selects the "Get Users" option |  
|  2    |  Application retrieves all registered users and display them to User |

### Use case 11, UC11 - Get Users by Username

| Actors Involved        | User |
| ------------- |:-------------:|
|  Precondition     | User is authenticated in the Application |
|  Post condition    | Application retrieves and display info about the requested User if and only if requested data belongs to User  |
| Nominal Scenario  | 1) User asks the Application for a specific user (by username)<br>2) Application checks if User is authenticated and requested username is the same of User (i.e. User is actually asking for its personal account data)<br>3) Application displays to User its personal data  |
|  Variants     |  - |
|  Exceptions     | Unauthorized (401)<br>User Not Found (401)<br>Internal Server Error (500) |

##### Scenario 11.1

| Scenario 11.1 | Exception |
| ------------- |:-------------:|
|  Precondition     | User is authenticated and requests data of a valid and different user |
|  Post condition     | Process ends with an error: Unauthorized  |
| Step#        | Description  |
|  1    | User selects the "Get User" functionality |  
|  2    |  Application checks if User is authenticated (refresh token is valid) |
| 3     | Application detects that User has a different username from the one for which account data was asked |
| 4 | Application displays an Unauthorized error message |

# Glossary


![Glossary](/images/GlossaryV1.PNG)

# System Design

![System Design](/images/System_design_v1.png)


# Deployment Diagram

![Deployement Diagram](/images/deploy_v1.png)


# Table of defects

|Defect Numer | Description |
| ----------------- |:-----------|
|1 |The admin figure is not implemented in the code, so there is no check on who can use the "get all users" function. |
|2 |get_labels() doesn't return the proper object with the color of its category. (fixed) |
|3| All Transactions and Categories records stored in the application are globally visible to all Users, without any personal account space separation and distinction |
|4| There is no password policy (i.e. all password provided during registration phase are accepted even if "too weak") |
