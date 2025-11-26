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

    // Call n8n Webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/book-info';

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        author: body.author || '',
      }),
    });

    if (!response.ok) {
      console.error('n8n Webhook error:', response.statusText);
      return NextResponse.json({ error: 'Failed to fetch data from AI service.' }, { status: 500 });
    }

    // n8n returns the JSON directly
    const bookInfo = await response.json();
    return NextResponse.json(bookInfo);



  } catch (error) {
    console.error('Error in AI book-info API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}));
