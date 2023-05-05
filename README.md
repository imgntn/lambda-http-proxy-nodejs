# AWS Lambda Proxy

This Lambda function is a configurable proxy that passes requests to a target website specified in the `RESTRICTED_TO_URL` constant. The proxy allows only requests to the specified domain and handles different content types such as HTML, XML, and JSON. Optionally, it can handle HTML content if the target website returns text-based content.

## Usage

To use the Lambda proxy, make a request to the API Gateway with the following format:

```
https://API_GATEWAY_URL/prod/proxy?url=TARGET_URL&OTHER_PARAMS
```

Replace `API_GATEWAY_URL` with your API Gateway's URL, `TARGET_URL` with the desired URL on the specified domain, and `OTHER_PARAMS` with any additional query string parameters.

For example:

```
https://7d4eeq7hb7.execute-api.us-west-1.amazonaws.com/prod/proxy?url=https://retro.umoiq.com/service/publicXMLFeed?command=routeList&a=sfmuni-sandbox
```

## Functionality

The Lambda function:

1. Extracts the HTTP method, URL, headers, and body from the incoming event.
2. Checks if the requested URL contains the domain specified in `RESTRICTED_TO_URL`. If not, returns a 403 error.
3. Combines the original URL's query parameters and any additional parameters from the API Gateway request.
4. Removes the 'Host' header to avoid issues with the target server.
5. Makes an HTTP request to the target URL with the combined query parameters, headers, and body.
6. Determines if the response is text-based (HTML, XML, or JSON) or binary.
7. Returns the response with the appropriate content type and encoding.

## Example Code

```javascript
import axios from "axios";
import { URL } from "url";

export const handler = async (event) => {
  // ... (code from your index.mjs Lambda function)
};
```

## Error Handling

If an error occurs during processing, the Lambda function returns an error response with the appropriate status code and message. If the error is related to the target server, the status code and message from the server will be returned. If the error occurs within the Lambda function, a 500 error with the message "An error occurred" will be returned.
