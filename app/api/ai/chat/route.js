import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { themes } from '@/data/themes';

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// --- Define the tools the AI can use ---
const aiFunctions = [
  {
    name: "report_problem",
    description: "Saves a user-reported problem, suggestion, or issue to the admin for review. Use this when the user expresses a problem with the site, has a suggestion, or is facing an issue that requires admin attention.",
    parameters: {
      type: "object",
      properties: {
        problemDescription: {
          type: "string",
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
      type: "object",
      properties: {
        themeName: {
          type: "string",
          description: "The name of the theme to switch to, for example: 'theme1', 'theme2', etc."
        }
      },
      required: ["themeName"]
    }
  }
];

// --- Implement the functions for the tools ---
const report_problem = async ({ problemDescription }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('contact_messages').insert({
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

    const formattedHistory = history
      .map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.text || ''
      }))
      .filter(msg => msg.content && ['system', 'user', 'assistant'].includes(msg.role));

    if (!userMessage) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!openAiApiKey) {
      console.error('OPENAI_API_KEY is not set in environment variables');
      return NextResponse.json({ error: 'AI service is not configured.' }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id,title,author,category,description,publishYear')
      .eq('status', 'approved');

    if (booksError) {
      console.error("Supabase error fetching books:", booksError);
      return NextResponse.json({ error: 'Could not fetch book data.' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    const authenticatedUserId = user?.id || null;
    let userFavorites = [];
    let userReadingList = [];
    let userUsername = 'غير مسجل';
    if (authenticatedUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('favorites, readinglist, username')
        .eq('id', authenticatedUserId)
        .single();

      if (profile) {
        userFavorites = profile.favorites || [];
        userReadingList = profile.readinglist || [];
        userUsername = profile.username || userUsername;
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
    const bookEntriesForContext = (books || []).map((book) => {
      const desc = book.description || 'لا يوجد وصف متاح.';
      const trimmedDesc = desc.length > 220 ? `${desc.slice(0, 220)}...` : desc;
      return `• ${book.title || 'بدون عنوان'} | المؤلف: ${book.author || 'غير معروف'} | التصنيف: ${book.category || 'غير محدد'} | السنة: ${book.publishYear || 'غير معروفة'} | الوصف: ${trimmedDesc}`;
    }).join('\n');

    const systemInstruction = `
    أنت "فريد"، أمين مكتبة "دار القرّاء" الرقمية. أنت مساعد ذكي، واسع المعرفة، وبليغ. مهمتك هي مساعدة المستخدمين في رحلتهم داخل المكتبة.

    **شخصيتك وأسلوبك:**
    1.  **اللغة:** تحدث باللغة العربية فقط.
    2.  **الأسلوب:** كن مباشراً جداً ومختصراً؛ اجعل إجاباتك في سطرين إلى ثلاثة أسطر كحد أقصى (أقل من 60 كلمة).
    3.  **النبرة:** نبرة مهنية محايدة مع لمسة ودودة بسيطة.

    **معلومات أساسية عن المكتبة:**
    - اسم المكتبة: مكتبة دار القرّاء.
    - إجمالي عدد الكتب المتاحة: ${books.length} كتابًا.

    **معلومات تقنية عن الموقع:**
    - الثيمات المتاحة:\n${themeListForContext}
    - هيكل صفحات الموقع:\n${siteStructureForContext}

    **معلومات عن المستخدم الحالي (إن وجدت):**
    - كتبه المفضلة (معرفات): ${userFavorites.length > 0 ? userFavorites.join(', ') : 'لا يوجد'}
    - قائمته للقراءة (معرفات): ${userReadingList.length > 0 ? userReadingList.join(', ') : 'لا يوجد'}

    **بيانات الكتب المتاحة (العنوان | النوع | السنة | وصف مختصر):**
    ${bookEntriesForContext || 'لا توجد كتب متاحة حالياً.'}

    **مهمتك الأساسية:**
    - مساعدة المستخدمين والإجابة على أسئلتهم المتعلقة بالكتب، الثيمات، وصفحات الموقع.
    - عند اقتراح الكتب أو تقييمها، اعتمد فقط على القائمة المرفقة واذكر العنوان والتصنيف وسنة النشر وجملة وصفية قصيرة مأخوذة من البيانات.
    - إذا طلب المستخدم تغيير الثيم، استخدم أداة 'change_theme' مع تحديد معرّف الثيم المطلوب (ID).
    - **مهم جداً:** إذا واجه المستخدم مشكلة أو كان لديه اقتراح، **يجب عليك** استخدام أداة 'report_problem' لتسجيل ملاحظته. لا تجب أبداً على أنك ستقوم بذلك بدون استخدام الأداة.

    
    `;
    const baseMessages = [
      { role: 'system', content: systemInstruction },
      ...formattedHistory,
      { role: 'user', content: userMessage }
    ];

    const callOpenAI = async (messages, functionCall = 'auto') => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiApiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0.7,
          max_tokens: 700,
          messages,
          functions: aiFunctions,
          function_call: functionCall,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('OpenAI API error:', data.error || response.statusText);
        throw new Error('OpenAI API request failed');
      }
      return data;
    };

    const aiResponse = await callOpenAI(baseMessages);
    const choice = aiResponse.choices?.[0];
    if (!choice || !choice.message) {
      console.error('OpenAI response missing choices:', aiResponse);
      return NextResponse.json({ text: 'عذراً، حدث خطأ في استجابة الذكاء الاصطناعي.' });
    }

    const handleFunctionCall = async (message) => {
      const { name, arguments: argsString } = message.function_call || {};
      if (!name) {
        return NextResponse.json({ text: 'لم أتمكن من تنفيذ الأداة المطلوبة.' });
      }

      let parsedArgs = {};
      try {
        parsedArgs = argsString ? JSON.parse(argsString) : {};
      } catch (parseError) {
        console.error('Failed to parse function arguments:', parseError, argsString);
        return NextResponse.json({ text: 'حدث خطأ أثناء قراءة مدخلات الأداة.' });
      }

      if (name === 'change_theme') {
        return NextResponse.json({ tool_call: { name, args: parsedArgs } });
      }

      const implementation = toolImplementations[name];
      if (!implementation) {
        return NextResponse.json({ text: 'لم أجد الأداة المناسبة لتنفيذ طلبك.' });
      }

      const functionResult = await implementation(parsedArgs);
      const followUpMessages = [
        ...baseMessages,
        message,
        {
          role: 'function',
          name,
          content: JSON.stringify(functionResult),
        },
      ];

      const followUp = await callOpenAI(followUpMessages, 'none');
      const followUpChoice = followUp.choices?.[0];
      const followUpText = followUpChoice?.message?.content;

      if (!followUpText) {
        return NextResponse.json({ text: 'تم تنفيذ الأداة ولكن لم أحصل على رد من الذكاء الاصطناعي.' });
      }

      return NextResponse.json({ text: followUpText.trim() });
    };

    if (choice.message.function_call) {
      return await handleFunctionCall(choice.message);
    }

    const assistantText = choice.message.content;
    if (!assistantText) {
      console.error('OpenAI response missing text:', aiResponse);
      return NextResponse.json({ text: 'عذراً، حدث خطأ غير متوقع في الذكاء الاصطناعي.' });
    }

    return NextResponse.json({ text: assistantText.trim() });

  } catch (error) {
    console.error('Error in AI chat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
