const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.GOOGLE_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/"
});


const chat_with_youtube_video= async(req,res)=>{
    const transcript = req.body.transcript; //string
    const userquery = req.body.userMsg; //String
    const previousConversation = req.body.oldChats; // []

    // console.log(transcript,userquery,previousConversation)



    system_prompt = `You are an AI Assistant who analyze the ${transcript} of youtube video.
     
    Carefully analyse the user input ${userquery} and based on the ${transcript} 
    prepare an answer for the user input. 
    You also have the access to the ${previousConversation} where user has interacted with you 
    Make sure you don't loose any context. 

    Make sure to validate before you return the final output. 
    Output should be in the JSON Object. 

    Rules:
    You only talk in English or Hinglish.
    Example:  
    Input: What is this video about?  
    Output:  
    {
    "content": "This video is related to GenAI Cohort. In which Shriyash is teaching about Vector Embedding Techniques. Feel free to ask anything :)"
    }  
  `

    try {
        const response = await openai.chat.completions.create({
            model: "gemini-1.5-flash",
            messages: [
                { role: "system", content: system_prompt },
                {
                    role: "user",
                    content: userquery,
                },
            ],
        });
        
        const content = response.choices[0].message.content;
        // console.log('Content == ', content)
        
        try {
            const parsed = JSON.parse(content);
            res.status(200).json(parsed);  // 🔥 This ensures frontend gets a true JSON object
        } catch (e) {
            console.error("Failed to parse response content as JSON:", content);
            res.status(200).send({ response: content }); // fallback
        }
        
    } catch (error) {
        res.status(400).send(error)
    }


}

module.exports = {chat_with_youtube_video}