import axios from "axios";
import { URL } from "url";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120;
const requestTimestamps = {};

// Traffic restriction configuration
const RESTRICTED_TO_URL = "retro.umoiq.com";
const CHECK_ORIGIN = false;
const ALLOWED_ORIGINS = ["www.something.com", "www.website.com"];

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event));

  const method = event.httpMethod;
  const originalUrl = event.queryStringParameters.url;
  const parsedUrl = new URL(originalUrl);
  const headers = event.headers || {};
  const body = event.body || null;

  // Check if the requested URL contains the desired domain
  if (!originalUrl.includes(RESTRICTED_TO_URL)) {
    return {
      statusCode: 403,
      body: "Invalid domain. Proxy is only allowed for retro.umoiq.com",
    };
  }

  // Rate limiting
  const clientIP = event.requestContext.identity.sourceIp;
  if (!requestTimestamps[clientIP]) {
    requestTimestamps[clientIP] = [];
  }
  const currentTime = Date.now();
  requestTimestamps[clientIP] = requestTimestamps[clientIP].filter(
    (timestamp) => currentTime - timestamp <= RATE_LIMIT_WINDOW
  );

  if (requestTimestamps[clientIP].length >= MAX_REQUESTS_PER_WINDOW) {
    return {
      statusCode: 429,
      body: "Too many requests, please try again later.",
    };
  }
  requestTimestamps[clientIP].push(currentTime);

  // Remove the 'url' key from the queryStringParameters
  const { url, ...otherParams } = event.queryStringParameters;

  // Check if the requested URL contains the desired domain
  if (CHECK_ORIGIN && !ALLOWED_ORIGINS.includes(parsedUrl.hostname)) {
    return {
      statusCode: 403,
      body: `Invalid domain. Proxy is only allowed for ${ALLOWED_ORIGINS.join(
        ", "
      )}`,
    };
  }

  // Combine the original URL's query parameters and the additional parameters
  const allParams = {
    ...otherParams,
    ...Object.fromEntries(parsedUrl.searchParams),
  };
  parsedUrl.search = new URLSearchParams(allParams).toString();

  const { Host, ...proxyHeaders } = headers;
  const axiosOptions = {
    url: parsedUrl.toString(),
    method: method,
    headers: proxyHeaders,
    data: body,
    responseType: "arraybuffer", // Handle binary content
  };

  try {
    const response = await axios(axiosOptions);

    const isTextBased = /^text\/|application\/(xml|json)/.test(
      response.headers["content-type"]
    );

    const result = {
      statusCode: response.status,
      headers: response.headers,
      body: isTextBased
        ? response.data.toString("utf-8")
        : Buffer.from(response.data, "binary").toString("base64"),
      isBase64Encoded: !isTextBased,
    };
    console.log("Returning result:", JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("Error processing request:", error);
    if (error.response) {
      return {
        statusCode: error.response.status,
        headers: error.response.headers,
        body: error.response.data.toString("utf-8"),
      };
    } else {
      return {
        statusCode: 500,
        body: "An error occurred",
      };
    }
  }
};
