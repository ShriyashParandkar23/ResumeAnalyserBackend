const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
  });
const resumeAnalyser = async (req,res) => {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
  
    console.log('📄 File received:', {
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
    });
  
    // Extract text from the PDF file
    try {
      const pdfText = await pdfParse(file.buffer);
  
      console.log('📄 Extracted Text:', pdfText.text.slice(0, 200)); // Logs first 200 characters for preview
      let system_prompt = `You are an ai assistant who is great at breaking down resume 
  // and analyse the user resume Make sure if it's not the resume just stop thinking and ask for resume in sarcastic way!
  // for the given user resume analyze the resume & break down the problem and good things step by step at least 
  // think 5 to 6 steps on how to evaluate the resume before going for any conclusion. 
  
  // steps are you get a user resume, you analyse, you think , you again think several times 
  // and return an output with explaination in points. It should be short, little sarcastic but make sure you don't hurt 
  // feelings be optimistic and then finally you validate you output as well before giving the final result. 
  
  // follow the steps in sequence that is "analyse","think","output","validate" and finally "result".
  
  // Rules:
  // 1. Always reply in friendly funny sarcastic way and language should be Hinglish only.
  // 2. Always perform one step at a time and wait for next input. 
  // 3. Carefully analyse the user resume 
  // 4. Make sure during given output use emojies.
  // 5. Don't give steps in output. 
  // 6. Always make sure if given input is not resume or it's different file then don't analyse it and reply in short
  
  // Example:
  // Input: User Resume
  // Output: Wow, Shriyash-ji, aapne toh LinkedIn, Github aur e-mail address detail mein likh diya. Ab bus Aadhar card aur PAN card number bhi daal dete 🤣
  
  // Education section mein likha hai "B.E. in Computer Engineering, CGPA 9.11" 🚀. Matlab 10 mein se 9.11. Waah, ekdum topper type ka lag raha hai. Sahi ja rahe ho, Einstein Saab.
  
  // Programming skills mein Python listed hai, fir JavaScript, C aur C++ bhi. Bus yahi baki tha, kya Shivaji Park ke samose banane ka code bhi aata hai, Python mein? 😂
  
  // Tools section mein, Bhagwaan ke naam pe, thoda space de dete. Git, Google Cloud Platform, Android Studio, ye sab ek hi line mein daal diya...bhai sahib, yeh resume hai, Goa Express nahi! 🚂
  
  // Interest wala section toh ekdum mast, Travelling, Trekking aur phir Piano 🎹. Waah, Mozartji, Shaan se trekking par chale jao aur vaha jakar piano bajao.
  
  // Experience section is quite nice but feels like "Kya Microsoft Azure bhi gulab jamun ban sakta hai?" 🤣 Overall, bahut scope hai improvement ka. 
  
  // ATS Score: 78%. (also give tips to improve it if needed)
  // Analysis: Overall, the resume has strong points such as good skills and experience section, but it lacks the personal touch like summary or objective. The resume is a little crowded and needs to be structured well. Formatting needs some work as information looks cluttered. Also, the candidate should consider expanding upon his internships and projects, adding more concise and clear job descriptions.  They have a good ATS Score, but the creativity score would suffer a bit. But don't worry, "Rome was not built in a day" 😉 Good luck! 🍀👍
 
 
  // Input: other pdf (other than resume)
  // Output: Ye kya bhej diya aapne humne to resume manga tha 🤣 (Always answer in short)
 
 `
      // Send extracted text to ChatGPT
      const completion = await client.chat.completions.create({
        model: 'gpt-4', // Or any other model you prefer
        messages: [
          { role: 'system', content: system_prompt },
          { role: 'user', content: `Here is the resume: ${pdfText.text}` },
        ],
      });
  
      // console.log('📝 ChatGPT Response:', completion.choices[0].message.content);
  
      // Respond with the result from ChatGPT
      res.json({ message: completion.choices[0].message.content });
  
    } catch (error) {
      console.error('Error extracting or processing PDF:', error);
      res.status(500).json({ error: 'Error processing the PDF file' });
    }
}

const jobMatchChecker = async (req, res) => {
  const file = req.file;
  const jobDescription = req.body.jobDescription;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log('📄 File received:', {
    name: file.originalname,
    type: file.mimetype,
    size: file.size,
  });

  try {
    const pdfText = await pdfParse(file.buffer);
    console.log('📄 Extracted Text:', pdfText.text.slice(0, 200));

    const system_prompt = `You are an AI Assistant who can find a match score based on input resume and input description. make sure you return a number
//      and along with that return a message in Hinglish to improve the skills for the given job description ${jobDescription} 
//      Make sure to analyse the output generating the final result. 
//      Mention match score in the first line and message should be short and on point. 
//      You talk formally. and make sure you return the message in 150 words. and important thing is give the honest opinion.also add few emojies in response
        Send response in HTML Tags make text bold as you like. 
//      Input: Resume & Job Description
//      Output: " Match Score : 30\n

        Should you apply : Yes / No 

        Eligible: Yes / No 

        Chances of getting this job: 23% (based on how well resume is fit for that job)

        1. Is job ke liye aapki skills thodi alag hai, agar aapko is job ko apply karna hai to aapko ye ye chize padhni padegi. 
        2. Location job ka aur apka alag hai to aapko uske liye relocate bhi karna pad sakta hai 
        and add according to you. 
     `;
    // let system_prompt = `return the score after matching resume file ${pdfText.text} with job description that is ${jobDescription}`
    const completion = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: system_prompt },
        { role: 'user', content: `Resume:\n\n${pdfText.text}\n\nJob Description:\n\n${jobDescription}` },
      ],
    });

    const fullResponse = completion.choices[0].message.content;

    // ✅ Extract match score using RegEx
    const scoreMatch = fullResponse.match(/match score[:\s]*([0-9]{1,3})/i);
    const matchScore = scoreMatch ? parseInt(scoreMatch[1]) : null;

    res.json({
      message: fullResponse,
      matchScore: matchScore,
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Error processing the PDF file' });
  }
};

module.exports = {resumeAnalyser,jobMatchChecker};
