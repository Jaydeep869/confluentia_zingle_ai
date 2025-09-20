const { NextResponse } = require("next/server");

// Mock the request and test our handler
async function testAPI() {
  console.log("Testing API endpoint...");

  // Mock request object
  const mockRequest = {
    json: async () => ({
      question: "Show me all users",
      generateOnly: true,
    }),
  };

  try {
    // Import and test our handler
    const { POST } = require("../app/api/ask/route");
    const response = await POST(mockRequest);

    const data = await response.json();
    console.log("API Response:", data);

    if (data.error) {
      console.error("API Error:", data.error);
    } else {
      console.log("✅ API test successful!");
      console.log("Generated SQL:", data.sql);
      console.log("Explanation:", data.explanation);
    }
  } catch (error) {
    console.error("API test failed:", error);
  }
}

testAPI();
