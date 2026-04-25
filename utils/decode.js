import "dotenv/config";

// here simply i encoded the firebase configs to base64 
export function decodedFIREBASE_SERVICE_ACCOUNT() {
    
    const base64String = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!base64String) {
        throw new Error("❌ FIREBASE_SERVICE_ACCOUNT is missing in .env!");
    }

    // Decode: Convert Base64 -> UTF-8 String
    try {
        return Buffer.from(base64String, 'base64').toString('utf-8');
    } catch (err) {
        throw new Error("❌ Failed to decode Base64 string. Ensure it is a valid Base64 format.");
    }
}