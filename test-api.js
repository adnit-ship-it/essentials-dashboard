// This script uses Node.js's built-in fetch.
// It acts as a client to test your running server.

const API_URL = "http://localhost:3001/api";

/**
 * Step 1: Fetches the current content from the server.
 *
 * *** UPDATED: This function now returns the *entire* data object (content + sha) ***
 */
async function getContent() {

  try {
    const response = await fetch(`${API_URL}/content`);

    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      const errorData = await response.json();
      console.error("Details:", errorData);
      return null;
    }

    const data = await response.json();

    console.dir(data.content, { depth: null });

    // Return the full data object
    return data;
  } catch (error) {
    console.error(
      "Failed to connect to the server. Is it running?",
      error.message
    );
    return null;
  }
}

/**
 * Step 2: Posts new content back to the server.
 *
 * *** UPDATED: This function now accepts the full data object, performs a merge,
 * and sends the *complete* modified object back. ***
 */
async function postContent(data) {
  if (!data || !data.content || !data.sha) {
    console.error(
      "Cannot run POST test without valid data (content and sha) from the GET request."
    );
    return;
  }

  const { sha, content } = data; // Destructure the content and sha

  // --- THIS IS THE MERGE LOGIC ---

  // 1. Create a deep copy of the existing content to modify safely
  const newContent = JSON.parse(JSON.stringify(content));

  // 2. Apply your specific, nested changes to the copy.
  //    This leaves all other fields (like footer, other pages, etc.) untouched!
  newContent.home.hero.heading = "UPDATED BY THE TEST SCRIPT (MERGED)!";
  newContent.home.hero.subheading = "This commit was made by Node.js";
  // (We'll leave bulletPoints as-is from the original content)

  // 3. Send the *entire* newContent object back
  try {
    const response = await fetch(`${API_URL}/content/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        newContent: newContent, // Send the full, merged object
        sha: sha, // Send the original sha
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      console.error("Details:", responseData);
      return;
    }

    console.dir(responseData, { depth: null });
  } catch (error) {
    console.error("Failed to connect to the server.", error.message);
  }
}

/**
 * Main execution function
 *
 * *** UPDATED: Passes the full data object to postContent ***
 */
async function runTest() {
  // First, get the content and the SHA
  const currentData = await getContent();

  // --- UNCOMMENT THE LINE BELOW TO RUN THE POST TEST ---
  if (currentData) {
    await postContent(currentData);
  }
}

runTest();
