import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
envContent.split("\n").forEach(line => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join("=").trim();
  }
});

const url = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const anonKey = envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

console.log("URL:", url);
console.log("Key length:", anonKey?.length);

const supabase = createClient(url, anonKey);

async function test() {
  const { data, error } = await supabase.auth.signUp({
    email: "testuser@rates.local",
    password: "Password123",
    options: {
      data: { username: "testuser", display_name: "Test" }
    }
  });
  console.log("Data:", data);
  console.log("Error:", error);
  if (error) {
    console.log("Error Message:", error.message);
    console.log("Error Status:", error.status);
    console.log("Error Name:", error.name);
    console.log("Error stringified:", JSON.stringify(error));
  }
}

test();
