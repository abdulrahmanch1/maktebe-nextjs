import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';
import { themes } from '@/data/themes';

const MODEL_NAME = "gemini-1.5-flash";

// --- Define the tools the AI can use ---
const tools = {
  functionDeclarations: [
    {
      name: "report_problem",
      description: "Saves a user-reported problem, suggestion, or issue to the admin for review. Use this when the user expresses a problem with the site, has a suggestion, or is facing an issue that requires admin attention.",
      parameters: {
        type: "OBJECT",
        properties: {
          problemDescription: {
            type: "STRING",
            description: "A detailed description of the problem or suggestion reported by the user."
          }
        },
        required: ["problemDescription"]
      }
    }
  ]
};

// --- Implement the functions for the tools ---
const report_problem = async ({ problemDescription }) => {
  console.log("AI is reporting a problem:", problemDescription);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('contact_messages').insert({
    subject: 'User issue reported by AI Assistant "Farid"',
    message: problemDescription,
    email: user ? user.email : 'ai-reported@example.com',
    username: user ? (user.user_metadata?.username || 'N/A') : 'Anonymous User',
    user_id: user ? user.id : null,
  });

  if (error) {
    console.error("Failed to report problem to Supabase:", error);
    return { success: false, message: "I tried to record your feedback, but an error occurred." };
  }

  return { success: true, message: "The problem has been reported successfully to the admin." };
};

const toolImplementations = {
  "report_problem": report_problem,
};


export async function POST(request) {
  try {
    const body = await request.json();
    const history = body.history ? body.history.slice(-10) : [];
    const userMessage = body.message;
    const userId = body.userId;

    const formattedHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text || '' }]
    }));

    if (!userMessage) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not set in .env.local');
      return NextResponse.json({ error: 'AI service is not configured.' }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id')
      .eq('status', 'approved');

    if (booksError) {
      console.error("Supabase error fetching books:", booksError);
      return NextResponse.json({ error: 'Could not fetch book data.' }, { status: 500 });
    }

    let userFavorites = [];
    let userReadingList = [];
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('favorites, readinglist')
        .eq('id', userId)
        .single();
      if (profile) {
        userFavorites = profile.favorites || [];
        userReadingList = profile.readinglist || [];
      }
    }

    // --- Prepare Theme and Site Structure Context ---
    const themeListForContext = Object.keys(themes).map(key => {
      const theme = themes[key];
      return `ID: ${key}, Name: ${theme.name}, isDark: ${theme.isDark}`;
    }).join('\n');

    const siteStructureForContext = `
- /: Homepage
- /book/[id]: Book details page
- /favorites: User's favorite books
- /reading-list: User's reading list
- /login: Login page
- /register: Register page
- /settings: User settings page
- /suggest-book: Page to suggest a new book
`;

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME, tools });

    const systemInstruction = `
    أنت "فريد"، أمين مكتبة "دار القرّاء" الرقمية. أنت مساعد ذكي، واسع المعرفة، وبليغ. مهمتك هي مساعدة المستخدمين في رحلتهم داخل المكتبة.

    **شخصيتك وأسلوبك:**
    1.  **اللغة:** تحدث دائمًا باللغة العربية الفصحى الراقية.
    2.  **الأسلوب:** يجب أن تكون كتابتك جميلة وواضحة. لا تستخدم أي علامات غريبة أو تنسيقات برمجية.
    3.  **النبرة:** نبرتك يجب أن تكون ترحيبية وصبورة.
    4.  **الاسم:** عرّف عن نفسك دائمًا باسم "فريد" في بداية أول محادثة.

    **معلومات أساسية عن المكتبة:**
    - اسم المكتبة: مكتبة دار القرّاء.
    - إجمالي عدد الكتب المتاحة: ${books.length} كتابًا.

    **معلومات تقنية عن الموقع:**
    - الثيمات المتاحة:\n${themeListForContext}
    - هيكل صفحات الموقع:\n${siteStructureForContext}

    **معلومات عن المستخدم الحالي (إن وجدت):**
    - كتبه المفضلة (معرفات): ${userFavorites.length > 0 ? userFavorites.join(', ') : 'لا يوجد'}
    - قائمته للقراءة (معرفات): ${userReadingList.length > 0 ? userReadingList.join(', ') : 'لا يوجد'}

    **مهمتك الأساسية:**
    - مساعدة المستخدمين والإجابة على أسئلتهم المتعلقة بالكتب، الثيمات، وصفحات الموقع.
    - إذا واجه المستخدم مشكلة أو كان لديه اقتراح، استخدم أداة report_problem لتسجيل ملاحظته لإدارة المكتبة.

    ابدأ المحادثة بالترحيب بالمستخدم وتقديم نفسك.
    `;

    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 2048,
    };
    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: formattedHistory,
      systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;

    if (response.candidates && response.candidates[0].content.parts[0].functionCall) {
      const functionCall = response.candidates[0].content.parts[0].functionCall;
      const implementation = toolImplementations[functionCall.name];
      
      if (implementation) {
        const functionResult = await implementation(functionCall.args);

        // Send the result back to the model
        const followUpResult = await chat.sendMessage([
          {
            functionResponse: {
              name: functionCall.name,
              response: functionResult,
            },
          },
        ]);
        
        const followUpResponse = followUpResult.response;
        const text = followUpResponse.candidates[0].content.parts[0].text;
        return NextResponse.json({ text });

      } else {
        // Function name not found
        return NextResponse.json({ text: "Sorry, I tried to use a tool but I couldn't find the right one." });
      }
    } else {
      // It's a regular text response
      const text = response.text();
      return NextResponse.json({ text });
    }

  } catch (error) {
    console.error('Error in AI chat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}