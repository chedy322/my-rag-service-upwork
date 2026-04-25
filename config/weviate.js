// this module initialises the Weaviate vector-database client.
import "dotenv/config";
import weaviate from "weaviate-client";

let _client = null;

/**
 * Returns a singleton Weaviate client.
 * Lazy-connects on first call so we don't block startup.
 */
export async function getWeaviateClient() {
  if (_client) return _client;

  const { WEAVIATE_URL, WEAVIATE_API_KEY } = process.env;

  if (!WEAVIATE_URL || !WEAVIATE_API_KEY) {
    throw new Error(
      "Missing WEAVIATE_URL or WEAVIATE_API_KEY in environment variables."
    );
  }

  _client = await weaviate.connectToWeaviateCloud(WEAVIATE_URL, {
    authCredentials: new weaviate.ApiKey(WEAVIATE_API_KEY),
  });

  
  console.log("✅ Connected to Weaviate");
  return _client;
}

export default getWeaviateClient;
