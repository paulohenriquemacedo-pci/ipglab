const run = async () => {
const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer AIzaSyA6nfRiaorum_K0auj0Bb1BLXKHCJXU_8s",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "gemini-2.5-pro",
    messages: [{role: "user", content: "Hi"}]
  })
});
console.log(response.status, await response.text());
};
run();
