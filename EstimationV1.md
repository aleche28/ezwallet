# Project Estimation - CURRENT
Date: 28/04/2023

Version:1.0


# Estimation approach
Consider the EZWallet  project in CURRENT version (as received by the teachers), assume that you are going to develop the project INDEPENDENT of the deadlines of the course


# Estimate by size
### 
|             | Estimate                        |             
| ----------- | ------------------------------- |  
| NC =  Estimated number of classes to be developed   |7                           |             
|  A = Estimated average size per class, in LOC       |50                            | 
| S = Estimated size of project, in LOC (= NC * A) |350 |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  |35                                      |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) |1050 | 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) |        1       |               

# Estimate by product decomposition
### 
|         component name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
|requirement document    |16|
| GUI prototype |16|
|design document |8|
|code |30|
| unit tests |18|
| api tests |6|
| management documents  |8|



# Estimate by activity decomposition
### 
|         Activity name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
|requirement document    |24|
| GUI prototype |18|
|design document |8|
|code |30|
| unit tests |18|
| api tests |6|
| management documents  |8|


###

![Gantt diagram V1](/images/gantt_v1.png)

# Summary


|             | Estimated effort (in person hours)                       |   Estimated duration (in weeks)|          
| ----------- | ------------------------------- | ---------------|
| estimate by size |35| < 1 week|
| estimate by product decomposition |102| < 1 week|
| estimate by activity decomposition |112| 1 week|

The estimation by size takes in account only the actual coding missing all the documents and planning so it results to be an underestimation of the time effort. The latter two are closer together since they consider the design and documents too, additionally the activity decomposition takes in account the team members not working perfectly in parallel so that adds more overhead to the estimated working hours.


