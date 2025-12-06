I will use us-east-1 region for everything here.

1.  created a dynamodb table Users with pk "userId" to store items like
```json
{
  "userId": "user_xxx",
  "email": "alice@example.com",
  "name": "Alice",
  "createdAt": "2025-12-06T15:00:00Z"
}
```

2. created a dynamodb table called Analytics with pk "metricName"
to store items like
```json
{
  "metricName": "signups",
  "count": 42,
  "lastSignupAt": "2025-12-06T15:00:00Z"
}
```

3. Created an Event Bus with name UserEventsBus 
it will receive events like
```json
{
  "detail-type": "UserRegistered",
  "source": "myapp.userservice",
  "detail": {
    "userId": "12345",
    "email": "alice@example.com",
    "timestamp": "2025-12-06T15:00:00Z",
    "name": "Alice"
  }
}
```

4. I created 3 lambdas (register, welcome email, and analytics) and attached api gateway to the register lambda.

5. I created a rule UserRegisteredRule in aws event bridge, with a custom trigger with this event filter patter and 

```json
{
  "source": ["myapp.userservice"],
  "detail-type": ["UserRegistered"]
}
```

and attached welcome email and analytics lambda

