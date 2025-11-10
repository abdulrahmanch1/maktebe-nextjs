import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export const POST = protect(admin(async (request) => {
  try {
    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: 'Book title is required' }, { status: 400 });
    }

    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!openAiApiKey) {
      console.error('OPENAI_API_KEY is not set in environment variables');
      return NextResponse.json({ error: 'AI service is not configured.' }, { status: 500 });
    }

    const systemPrompt = `
      أنت مساعد مكتبة مفيد. مهمتك هي العثور على معلومات حول كتاب معين بناءً على عنوانه وإرجاع المعلومات ككائن JSON منظم.
      سيزودك المستخدم بعنوان كتاب. يجب عليك البحث عن معلومات حول هذا الكتاب واستخراج الحقول التالية: "author", "category", "description", "publishYear", "language", "keywords".

      - author: الاسم الكامل للمؤلف.
      - category: التصنيف الأكثر ملاءمة للكتاب، باللغة العربية (مثال: "تاريخ", "خيال علمي", "تنمية ذاتية").
      - description: ملخص مفصل لمحتوى الكتاب، حوالي 300 كلمة، مع دمج الكلمات المفتاحية بشكل طبيعي فيه.
      - publishYear: سنة النشر الأولى للكتاب، كرقم (مثال: 1997).
      - language: اللغة الأصلية للكتاب (مثال: "الإنجليزية", "العربية").
      - keywords: مصفوفة من الكلمات المفتاحية أو المواضيع ذات الصلة، باللغة العربية، بحيث يكون مجموع الكلمات حوالي 30 كلمة. يجب أن تكون هذه الكلمات مدمجة في الوصف.

      هام: يجب أن تكون استجابتك كائن JSON واحدًا وصالحًا فقط. لا تضمن أي نص آخر أو تفسيرات أو تنسيق Markdown مثل "json". يجب أن تكون استجابتك بالكامل هي كائن JSON نفسه.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Book Title: "${title}"` },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI API error (book-info):', data.error || response.statusText);
      return NextResponse.json({ error: 'Failed to fetch data from AI service.' }, { status: 500 });
    }

    const messageContent = data.choices?.[0]?.message?.content;
    if (!messageContent) {
      console.error('OpenAI book-info response missing content:', data);
      return NextResponse.json({ error: 'AI response did not contain a valid JSON object.' }, { status: 500 });
    }

    try {
      const bookInfo = JSON.parse(messageContent);
      return NextResponse.json(bookInfo);
    } catch (e) {
      console.error("Failed to parse extracted JSON:", e);
      console.error("Raw OpenAI response content:", messageContent);
      return NextResponse.json({ error: 'Failed to parse extracted AI response as JSON.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in AI book-info API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}));
