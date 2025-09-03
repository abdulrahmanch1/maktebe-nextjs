import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = "gemini-1.5-flash";

export async function POST(request) {
  try {
    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: 'Book title is required' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not set in .env.local');
      return NextResponse.json({ error: 'AI service is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

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

    const result = await model.generateContent([
        systemPrompt,
        `Book Title: "${title}"`
    ]);

    const responseText = result.response.text();
    
    // Use regex to extract the JSON object from the response
    const jsonRegex = /{[\s\S]*}/;
    const match = responseText.match(jsonRegex);

    if (!match || !match[0]) {
      console.error("No valid JSON object found in Gemini response:", responseText);
      return NextResponse.json({ error: 'AI response did not contain a valid JSON object.' }, { status: 500 });
    }

    try {
      const bookInfo = JSON.parse(match[0]);
      return NextResponse.json(bookInfo);
    } catch (e) {
      console.error("Failed to parse extracted JSON:", e);
      console.error("Extracted string was:", match[0]);
      return NextResponse.json({ error: 'Failed to parse extracted AI response as JSON.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in AI book-info API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
