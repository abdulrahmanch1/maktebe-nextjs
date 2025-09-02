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
    },
    {
      name: "change_theme",
      description: "Changes the website's visual theme. Use this when the user explicitly asks to change the theme or color scheme.",
      parameters: {
        type: "OBJECT",
        properties: {
          themeName: {
            type: "STRING",
            description: "The name of the theme to switch to, for example: 'theme1', 'theme2', etc."
          }
        },
        required: ["themeName"]
      }
    }
  ]
};

// --- Implement the functions for the tools ---
const report_problem = async ({ problemDescription }) => {
  console.log("AI is reporting a problem:", problemDescription);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase.from('contact_messages').insert({
    subject: user
      ? `User issue reported by AI Assistant (User ID: ${user.id})`
      : 'User issue reported by AI Assistant',
    message: user
      ? `${problemDescription}\n\nReported by User: ${user.user_metadata?.username || 'N/A'} (ID: ${user.id}, Email: ${user.email})\nAdmin Link: /admin/users/${user.id}`
      : problemDescription,
    email: user ? user.email : 'ai-reported@example.com',
    username: user ? (user.user_metadata?.username || 'N/A') : 'Anonymous User',
    user_id: user ? user.id : null,
  });

  console.log('Supabase insert result:', { data, error });

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
    let profile = null; // Declare profile here
    if (userId) {
      const { data: fetchedProfile } = await supabase // Use a temporary name for data
        .from('profiles')
        .select('favorites, readinglist, username')
        .eq('id', userId)
        .single();
      if (fetchedProfile) {
        profile = fetchedProfile;
        userFavorites = profile.favorites || [];
        userReadingList = profile.readinglist || [];
      }
    }

    let userUsername = 'غير مسجل';
    if (userId && profile) {
        userUsername = profile.username || 'N/A';
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
    1.  **اللغة:** تحدث باللغة العربية.
    2.  **الأسلوب:** كن مباشراً ومختصراً في إجاباتك. تجنب الإطالة غير الضرورية.
    3.  **النبرة:** نبرتك محايدة ومباشرة.

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
    - إذا طلب المستخدم تغيير الثيم، استخدم أداة 'change_theme' مع تحديد معرّف الثيم المطلوب (ID).
    - **مهم جداً:** إذا واجه المستخدم مشكلة أو كان لديه اقتراح، **يجب عليك** استخدام أداة 'report_problem' لتسجيل ملاحظته. لا تجب أبداً على أنك ستقوم بذلك بدون استخدام الأداة.

    
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

    // Check for safety feedback first
    if (response.promptFeedback && response.promptFeedback.blockReason) {
      console.error('Gemini response blocked due to safety:', response.promptFeedback.blockReason);
      return NextResponse.json({ text: 'عذراً، لا أستطيع الإجابة على هذا السؤال لأسباب تتعلق بالسلامة.' });
    }

    // If not blocked, proceed with normal processing
    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content.parts && response.candidates[0].content.parts.length > 0) {
      const firstPart = response.candidates[0].content.parts[0];

      if (firstPart.functionCall) {
        const functionCall = firstPart.functionCall;

        // If the tool is `change_theme`, pass it to the frontend
        if (functionCall.name === 'change_theme') {
          return NextResponse.json({ tool_call: functionCall });
        }

        // For other tools, execute them on the backend
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
      } else if (firstPart.text) {
        // It's a regular text response
        const text = firstPart.text;
        return NextResponse.json({ text });
      }
    } else {
      // Fallback for unexpected response structure or empty candidates
      console.error('Gemini response had unexpected structure or empty candidates:', response);
      return NextResponse.json({ text: 'عذراً، حدث خطأ غير متوقع في استجابة الذكاء الاصطناعي.' });
    }

  } catch (error) {
    console.error('Error in AI chat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}