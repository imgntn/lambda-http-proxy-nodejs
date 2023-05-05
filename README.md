# Lambda HTTP Proxy Node.js

Minimalist Node.js HTTP proxy as AWS Lambda Function for easy cross-origin resource sharing 🌐

## About

This Lambda function acts as a proxy for HTTP requests. It forwards incoming requests to the target URL and returns the response. The function includes rate limiting to prevent abuse and has the option to restrict traffic to specific origins.

## Features

- Rate limiting based on the client's IP address
- Optional origin check to restrict traffic to specific domains
- Supports both text-based and binary content

## Cloud Setup

Please see [How To Setup AWS](other_file.md)

## Configuration

### Rate Limiting

- `RATE_LIMIT_WINDOW`: The time window for rate limiting in milliseconds. Defaults to 60,000 ms (1 minute).
- `MAX_REQUESTS_PER_WINDOW`: The maximum number of requests allowed per client IP within the rate limit window. Defaults to 120.

### Traffic Restriction

- `RESTRICTED_TO_URL`: The domain to which the proxy is restricted. All requests must include this domain in the URL.
- `CHECK_ORIGIN`: A boolean flag to enable or disable origin checking. Set to `false` by default.
- `ALLOWED_ORIGINS`: An array of allowed origin strings, e.g., `["www.something.com", "www.website.com"]`. This array is only used if `CHECK_ORIGIN` is set to `true`.

## Usage

The Lambda function expects an `event` object with the following properties:

- `httpMethod`: The HTTP method of the original request (e.g., GET, POST, PUT, DELETE).
- `queryStringParameters`: An object containing query string parameters, including a `url` parameter with the target URL.
- `headers`: An object containing the request headers.
- `body`: The request body, if applicable (e.g., for POST or PUT requests).

The function will return an object containing the following properties:

- `statusCode`: The HTTP status code of the response.
- `headers`: An object containing the response headers.
- `body`: The response body, either as a UTF-8 string or a base64-encoded string for binary content.
- `isBase64Encoded`: A boolean flag indicating if the response body is base64-encoded (true for binary content, false for text-based content).

## Example

To use this Lambda function, deploy it to your AWS account and set up an API Gateway trigger. When making requests, include the target URL as a query string parameter named `url`.

Example request:

```
GET https://your-api-gateway-url.com/production/proxy?url=https://www.example.com/api/endpoint
```
