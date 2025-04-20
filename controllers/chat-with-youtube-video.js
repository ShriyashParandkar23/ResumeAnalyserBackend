const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.GOOGLE_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/"
});

const chat_with_youtube_video = async (req, res) => {
    const { userMsg, oldChats, videoUrl } = req.body;
    const system_prompt = `
You are an AI assistant helping users understand and analyze the content of a YouTube video.
You only know the information about the youtube video and based on it you have to chat with user.
Don't answer any question which is out of context of the particular youtube video. 

You may chat in Hinglish or English with user in formal and informal way. 
Make the chat interesting and precise which will keep the user interested. 

Context:
- The YouTube video URL is: ${videoUrl} 

Instructions:
- Answer the user's query using the transcript above.
- Maintain continuity of the conversation using the previous messages.
- Respond in JSON format like:
  {
    "content": "Your final answer here..."
  }
`;
console.log(system_prompt)
    try {
        // Convert previous chat messages to OpenAI message format
        const chatHistory = oldChats.map((msg) => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.text,
        }));

        const response = await openai.chat.completions.create({
            model: "gemini-1.5-flash",
            
            max_tokens: 2000,
            messages: [
                { role: "system", content: system_prompt },
                ...chatHistory,
                { role: "user", content: userMsg },
            ],
        });

        const content = response.choices[0].message.content;

        try {
            const parsed = JSON.parse(content);
            res.status(200).json(parsed);
        } catch (e) {
            console.error("Failed to parse response as JSON:", content);
            res.status(200).json({ content }); // fallback to string
        }
    } catch (error) {
        console.error("OpenAI API error:", error);
        res.status(500).json({ error: "Internal Server Error", details: error });
    }
};

module.exports = { chat_with_youtube_video };
