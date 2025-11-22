import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { themes } from '@/data/themes';

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// --- Define the tools the AI can use ---
const aiFunctions = [
  {
    name: "search_books",
    description: "Searches for books in the library database. Use this WHENEVER the user asks about a book, author, or category to check availability.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query (book title, author name, or category)."
        }
      },
      required: ["query"]
    }
  },
  {
    name: "request_book",
    description: "Logs a request for a missing book. Use this ONLY when a user asks for a book that is NOT found in the library after a search.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title of the requested book."
        },
        author: {
          type: "string",
          description: "The author of the requested book (if known)."
        }
      },
      required: ["title"]
    }
  },
  {
    name: "log_issue",
    description: "Logs a user experience issue or difficulty detected from the conversation. Use this PROACTIVELY when the user seems confused, annoyed, or mentions a problem (e.g., 'I can't find...', 'It's slow', 'Where is...').",
    parameters: {
      type: "object",
      properties: {
        issue_type: {
          type: "string",
          enum: ["ux_difficulty", "bug_report", "feature_request", "general_complaint"],
          description: "The type of issue detected."
        },
        description: {
          type: "string",
          description: "A brief description of the issue based on user's input."
        },
        severity: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Estimated severity of the issue."
        }
      },
      required: ["issue_type", "description", "severity"]
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
  },
  {
    name: "report_problem",
    description: "Saves a user-reported problem, suggestion, or issue to the admin for review. Use this when the user EXPLICITLY asks to report a problem.",
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
  }
];

// --- Implement the functions for the tools ---

const search_books = async ({ query }) => {
  const supabase = await createClient();
  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, author, category, description, publishYear, status')
    .eq('status', 'approved')
    .or(`title.ilike.%${query}%,author.ilike.%${query}%,category.ilike.%${query}%`)
    .limit(5);

  if (error) {
    console.error("Search books error:", error);
    return { error: "Failed to search books." };
  }

  if (!books || books.length === 0) {
    return { found: false, message: "No books found matching this query." };
  }

  return {
    found: true,
    books: books.map(b => ({
      title: b.title,
      author: b.author,
      category: b.category,
      year: b.publishYear,
      description: b.description ? b.description.substring(0, 100) + "..." : "No description",
      id: b.id
    }))
  };
};

const request_book = async ({ title, author }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('contact_messages').insert({
    subject: `[BOOK-REQUEST] ${title}`,
    message: `User requested book: "${title}" by "${author || 'Unknown'}".\n\nRequested by: ${user ? (user.user_metadata?.username || user.email) : 'Guest'}\nUser ID: ${user?.id || 'N/A'}`,
    email: user ? user.email : 'book-request@ai-system.com',
    username: user ? (user.user_metadata?.username || 'N/A') : 'AI Assistant',
    user_id: user ? user.id : null,
  });

  if (error) {
    console.error("Request book error:", error);
    return { success: false };
  }
  return { success: true, message: "Request logged. Promise 24h addition." };
};

const log_issue = async ({ issue_type, description, severity }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('contact_messages').insert({
    subject: `[AI-SPY] [${severity.toUpperCase()}] ${issue_type}`,
    message: `AI Detected Issue:\nType: ${issue_type}\nSeverity: ${severity}\nDescription: ${description}\n\nUser Context: ${user ? (user.user_metadata?.username || user.email) : 'Guest'}\nUser ID: ${user?.id || 'N/A'}`,
    email: user ? user.email : 'ai-spy@system.com',
    username: 'AI White Spy',
    user_id: user ? user.id : null,
  });

  if (error) {
    console.error("Log issue error:", error);
    return { success: false };
  }
  return { success: true, message: "Issue logged silently." };
};

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
    return { success: false, message: "Error reporting problem." };
  }
  return { success: true, message: "Problem reported successfully." };
};

const toolImplementations = {
  "search_books": search_books,
  "request_book": request_book,
  "log_issue": log_issue,
  "change_theme": async () => ({ success: true }), // Handled by client, but we need a dummy here for the loop
  "report_problem": report_problem
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
      return NextResponse.json({ error: 'AI service is not configured.' }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // --- Enhanced User Context ---
    let userContextString = "المستخدم: زائر (غير مسجل)";
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, favorites, readinglist')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Fetch titles for favorites and reading list for better context
        let favoriteTitles = [];
        let readingListTitles = [];

        if (profile.favorites && profile.favorites.length > 0) {
          const { data: favs } = await supabase.from('books').select('title').in('id', profile.favorites);
          if (favs) favoriteTitles = favs.map(b => b.title);
        }

        if (profile.readinglist && profile.readinglist.length > 0) {
          const { data: reads } = await supabase.from('books').select('title').in('id', profile.readinglist);
          if (reads) readingListTitles = reads.map(b => b.title);
        }

        userContextString = `
            المستخدم: ${profile.username || 'مستخدم مسجل'}
            الكتب المفضلة: ${favoriteTitles.join(', ') || 'لا يوجد'}
            قائمة القراءة: ${readingListTitles.join(', ') || 'لا يوجد'}
            `;
      }
    }

    // --- Prepare Theme Context ---
    const themeListForContext = Object.keys(themes).map(key => {
      const theme = themes[key];
      return `ID: ${key}, Name: ${theme.name}`;
    }).join('\n');

    const systemInstruction = `
    أنت "فريد"، أمين مكتبة "دار القرّاء" الرقمية. أنت "جاسوس أبيض" (White Spy) 🕵️‍♂️ - هدفك مساعدة المستخدمين وتحسين تجربتهم بذكاء ولطف.

    **شخصيتك:**
    1.  **اللغة:** عربية فقط.
    2.  **الأسلوب:** مباشر، مختصر (أقل من 60 كلمة)، وودود.
    3.  **الدور:** أمين مكتبة خبير وملاحظ دقيق.

    **قواعدك الذهبية (بروتوكول الجاسوس الأبيض):**
    1.  **البحث أولاً:** لا تعتمد على ذاكرتك. إذا سأل المستخدم عن كتاب، مؤلف، أو تصنيف، استخدم أداة **'search_books'** فوراً.
    2.  **الكتب الناقصة (بروتوكول 24 ساعة):** إذا بحثت عن كتاب ولم تجده (search_books returned found: false)، يجب عليك:
        - استخدام أداة **'request_book'** لتسجيل الطلب.
        - الرد على المستخدم بهذه الجملة حرفياً: *"سأخبر المسؤولين وسيتم إضافة هذا الكتاب خلال 24 ساعة 🕒."*
    3.  **رصد المشاكل (Proactive Issue Logging):** كن يقظاً. إذا لاحظت من كلام المستخدم أنه يواجه صعوبة، انزعاج، أو مشكلة تقنية (مثلاً: "الموقع بطيء"، "وين الزر؟"، "ما عم يفتح"):
        - استخدم أداة **'log_issue'** فوراً لتسجيل المشكلة للمسؤولين (دون إخبار المستخدم أنك تسجل تقريراً).
        - اعرض المساعدة بلطف أو اعتذر عن الإزعاج.
    4.  **تغيير الثيم:** إذا طلب تغيير اللون/الثيم، استخدم 'change_theme'.

    **معلومات الموقع:**
    - الثيمات المتاحة: ${themeListForContext}
    - الصفحات: الرئيسية، المفضلة، قائمة القراءة، تسجيل الدخول.

    **سياق المستخدم الحالي:**
    ${userContextString}
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
          max_tokens: 500,
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
      return NextResponse.json({ text: 'عذراً، حدث خطأ في الاتصال.' });
    }

    // Handle Function Calls
    if (choice.message.function_call) {
      const { name, arguments: argsString } = choice.message.function_call;
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(argsString);
      } catch (e) {
        console.error("JSON parse error", e);
      }

      // Special handling for client-side actions
      if (name === 'change_theme') {
        return NextResponse.json({ tool_call: { name, args: parsedArgs } });
      }

      const implementation = toolImplementations[name];
      if (implementation) {
        const result = await implementation(parsedArgs);

        // Feed the result back to the AI
        const followUpMessages = [
          ...baseMessages,
          choice.message,
          {
            role: 'function',
            name,
            content: JSON.stringify(result)
          }
        ];

        const followUp = await callOpenAI(followUpMessages, 'none'); // Don't allow recursive tool calls for now
        return NextResponse.json({ text: followUp.choices[0].message.content });
      }
    }

    return NextResponse.json({ text: choice.message.content });

  } catch (error) {
    console.error('Error in AI chat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
