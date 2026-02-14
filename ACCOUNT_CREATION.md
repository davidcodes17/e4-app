# Account Creation — Passenger & Driver

This document describes the complete account creation flows for passengers (users) and drivers, including request payloads and example responses.

---

## Overview

- Flow: Request OTP -> Validate OTP -> Create Account
- The `validate-otp` endpoint returns a short-lived JWT that must be used in the `Authorization` header when calling `create-account`.

---

## Passenger (User) Account Creation

- Endpoint: `POST /api/v1/auth/create-account`
- Auth: `Authorization: Bearer <JWT>` (JWT from `/api/v1/auth/validate-otp`)

Request payload (`CreateAccountPayload`):

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "Smith",
  "phoneNumber": "+1234567890",
  "password": "password123",
  "gender": "MALE"
}
```

Success response (201 Created):

```json
{
  "success": true,
  "message": "Account Created Successfully",
  "data": {
    "accessToken": "<long-lived-jwt>"
  },
  "timestamp": "2026-02-14T16:00:00"
}
```

Common error responses:

- 401 Unauthorized — missing/invalid/expired JWT from `validate-otp`
- 409 Conflict — `Email address is already in use. Please use a different one or login.`
- 409 Conflict — `Phone number is already in use. Please use a different one.`

Notes:

- The server uses the authenticated principal (JWT) to set the account email — do not include `email` in this payload.
- Passwords are hashed before storage.

---

## Driver Account Creation

- Endpoint: `POST /api/v1/driver/create-account`
- Auth: `Authorization: Bearer <JWT>` (JWT from `/api/v1/driver/validate-otp`)

Request payload (`CreateDriverPayload`):

```json
{
  "firstName": "Driver",
  "lastName": "One",
  "middleName": "D",
  "phoneNumber": "+1987654321",
  "password": "password123",
  "gender": "MALE",
  "carName": "Toyota Corolla",
  "plateNumber": "ABC-1234",
  "model": "Corolla",
  "brand": "Toyota",
  "year": 2022,
  "color": "White"
}
```

Success response (201 Created):

```json
{
  "success": true,
  "message": "Driver Account Created Successfully",
  "data": {
    "accessToken": "<long-lived-jwt>"
  },
  "timestamp": "2026-02-14T16:00:00"
}
```

Common error responses:

- 401 Unauthorized — missing/invalid/expired JWT from `validate-otp`
- 409 Conflict — `A driver account with this email address already exists.`
- 409 Conflict — `Phone number is already in use. Please use a different one.`
- 409 Conflict — `Plate number is already in use. Please use a different one.`

Notes:

- `plateNumber` must be unique across drivers.
- The email validated in the driver OTP flow is used as the driver's email.

---

## Example cURL (passenger create)

```bash
# Ensure you have a JWT from validate-otp
curl -X POST "http://localhost:8080/api/v1/auth/create-account" \
  -H "Authorization: Bearer <short-lived-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","middleName":"","phoneNumber":"+1234567890","password":"password123","gender":"MALE"}'
```

## Troubleshooting

- If you receive a 409 during `create-account`, try logging in or use a different email/phone/plate as indicated by the message.
- If JWT is rejected, repeat OTP validation to obtain a fresh token.
