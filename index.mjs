import axios from "axios";
import { URL } from "url";

export const handler = async (event) => {
  const method = event.httpMethod;
  const url = event.queryStringParameters.url;
  const headers = event.headers || {};
  const body = event.body || null;

  // Remove the 'Host' header from the incoming headers
  const { Host, ...proxyHeaders } = headers;

  const makeRequest = async (url, options) => {
    try {
      const response = await axios({
        url: url,
        method: options.method,
        headers: options.headers,
        data: options.body,
        responseType: "arraybuffer", // Handle binary content
      });

      return {
        status: response.status,
        headers: response.headers,
        data: response.data,
      };
    } catch (error) {
      if (error.response) {
        throw {
          status: error.response.status,
          headers: error.response.headers,
          message: error.response.data,
        };
      } else {
        throw error;
      }
    }
  };

  const rewriteUrls = (content, baseUrl, proxyUrl) => {
    return content.replace(
      /(href|src)=("|')([^"']*)(("|'))/gi,
      (match, attribute, openQuote, originalUrl, closeQuote) => {
        try {
          const parsedUrl = new URL(originalUrl, baseUrl);
          const proxyPath = `${proxyUrl}?url=${encodeURIComponent(
            parsedUrl.href
          )}`;
          return `${attribute}=${openQuote}${proxyPath}${closeQuote}`;
        } catch (error) {
          return match;
        }
      }
    );
  };

  try {
    const options = {
      method: method,
      headers: proxyHeaders,
      body: body,
    };

    const response = await makeRequest(url, options);

    // Check if the content is text-based before rewriting URLs
    const contentType = response.headers["content-type"];
    const isTextBased =
      contentType && /^text\/|application\/(xml|json)/.test(contentType);

    if (isTextBased) {
      const proxyUrl =
        "https://7d4eeq7hb7.execute-api.us-west-1.amazonaws.com/prod/proxy";
      response.data = rewriteUrls(
        response.data.toString("utf-8"),
        url,
        proxyUrl
      );
    }

    const apiGatewayResponse = {
      statusCode: response.status,
      headers: response.headers,
      body: isTextBased
        ? response.data
        : Buffer.from(response.data, "binary").toString("base64"), // Encode binary content as base64
      isBase64Encoded: !isTextBased,
    };

    return apiGatewayResponse;
  } catch (error) {
    const apiGatewayErrorResponse = {
      statusCode: error.status || 500,
      headers: error.headers || {},
      body: error.message || "An error occurred",
    };

    return apiGatewayErrorResponse;
  }
};
