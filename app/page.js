import { createClient } from '@/utils/supabase/server';
import HomePageClient from './HomePageClient';
import './HomePage.css';
import { BOOKS_PAGE_SIZE } from '@/constants';

export async function generateMetadata() {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';

    return {
        title: 'مكتبة دار القرَاء - آلاف الكتب العربية المجانية | قراءة وتحميل بدون تسجيل',
        description: 'أكبر مكتبة كتب عربية مجانية بدون إعلانات أو تسجيل. آلاف الكتب والروايات بصيغة PDF. قارئ مدمج، مساعد AI، ملاحظات ذكية. تصفح كتب دينية، روايات، تنمية بشرية، تاريخ، علوم وأكثر.',
        keywords: [
            'مكتبة كتب عربية مجانية',
            'تحميل كتب PDF بدون تسجيل',
            'قراءة كتب بدون إعلانات',
            'مكتبة إلكترونية عربية',
            'كتب دينية إسلامية',
            'روايات عربية مجانية',
            'كتب تنمية بشرية',
            'قارئ PDF عربي',
            'مساعد ذكي للكتب',
            'تحميل روايات مجاناً',
            'كتب بدون حساب',
            'مكتبة وراق',
            'دار القراء',
            'كتب أونلاين',
            'قراءة بدون نت'
        ],
        alternates: {
            canonical: siteUrl,
        },
        openGraph: {
            title: 'مكتبة دار القرَاء - آلاف الكتب العربية المجانية',
            description: 'أكبر مكتبة كتب عربية مجانية. تحميل وقراءة بدون تسجيل أو إعلانات. قارئ PDF مدمج ومساعد AI ذكي.',
            url: siteUrl,
            siteName: 'دار القرَاء',
            locale: 'ar_AR',
            type: 'website',
            images: [{
                url: `${siteUrl}/icons/icon-512.png`,
                width: 512,
                height: 512,
                alt: 'مكتبة دار القرَاء'
            }]
        },
        twitter: {
            card: 'summary_large_image',
            title: 'مكتبة دار القرَاء - كتب عربية مجانية',
            description: 'آلاف الكتب العربية بدون تسجيل أو إعلانات. قارئ PDF + مساعد AI',
            images: [`${siteUrl}/icons/icon-512.png`]
        }
    };
}

// Revalidate every hour
export const revalidate = 3600;

const HomePage = async () => {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';

    // Fetch approved books directly from the database on the server
    const { data: books, error, count } = await supabase
        .from('books')
        .select('id, title, author, cover, category, favoritecount', { count: 'exact' })
        .eq('status', 'approved')
        .range(0, Math.max(BOOKS_PAGE_SIZE - 1, 0));

    // Fetch random authors for the homepage sections (SSR to avoid layout shifts)
    const { data: authors } = await supabase
        .from('authors')
        .select('*')
        .limit(60);

    // Simple server-side shuffle
    const shuffledAuthors = authors ? authors.sort(() => 0.5 - Math.random()) : [];

    // Generate comprehensive JSON-LD for homepage
    const jsonLdScripts = [
        // Organization Schema
        {
            '@context': 'https://schema.org',
            '@type': 'Library',
            '@id': `${siteUrl}/#library`,
            name: 'مكتبة دار القرَاء',
            alternateName: ['Dar Al-Qurra', 'دار القراء', 'مكتبة وراق'],
            url: siteUrl,
            logo: `${siteUrl}/icons/icon-512.png`,
            description: 'أكبر مكتبة كتب عربية إلكترونية مجانية بدون تسجيل أو إعلانات',
            foundingDate: '2024',
            slogan: 'اكتشف عالمك التالي بين السطور',
            sameAs: [
                'https://twitter.com/dar_alqurra',
                'https://facebook.com/dar_alqurra',
                'https://instagram.com/dar_alqurra'
            ]
        },
        // WebSite with SearchAction
        {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': `${siteUrl}/#website`,
            url: siteUrl,
            name: 'مكتبة دار القرَاء',
            description: 'مكتبة كتب عربية مجانية - تحميل وقراءة بدون تسجيل',
            potentialAction: {
                '@type': 'SearchAction',
                target: {
                    '@type': 'EntryPoint',
                    urlTemplate: `${siteUrl}/?search={search_term_string}`
                },
                'query-input': 'required name=search_term_string'
            },
            inLanguage: 'ar'
        },
        // ItemList Schema for books
        books && books.length > 0 ? {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            '@id': `${siteUrl}/#booklist`,
            name: 'أحدث الكتب في مكتبة دار القرَاء',
            description: 'قائمة بأحدث الكتب العربية المتاحة للتحميل والقراءة مجاناً',
            numberOfItems: count || books.length,
            itemListElement: books.slice(0, 10).map((book, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                    '@type': 'Book',
                    '@id': `${siteUrl}/book/${book.id}`,
                    name: book.title,
                    author: {
                        '@type': 'Person',
                        name: book.author
                    },
                    genre: book.category,
                    image: book.cover,
                    url: `${siteUrl}/book/${book.id}`
                }
            }))
        } : null,
        // FAQ Schema
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            '@id': `${siteUrl}/#faq`,
            mainEntity: [
                {
                    '@type': 'Question',
                    name: 'هل تحميل الكتب مجاني في دار القراء؟',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'نعم، جميع الكتب والروايات في مكتبة دار القراء متاحة للتحميل والقراءة مجاناً بصيغة PDF بدون أي رسوم أو اشتراكات.'
                    }
                },
                {
                    '@type': 'Question',
                    name: 'هل أحتاج لتسجيل الدخول لقراءة الكتب؟',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'لا، يمكنك قراءة وتحميل جميع الكتب مباشرة دون الحاجة لإنشاء حساب أو تسجيل الدخول. التسجيل اختياري للحصول على ميزات إضافية مثل المفضلة والملاحظات.'
                    }
                },
                {
                    '@type': 'Question',
                    name: 'هل يوجد إعلانات في الموقع؟',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'لا، مكتبة دار القراء خالية 100% من الإعلانات المزعجة. نحن نركز على توفير تجربة قراءة نظيفة ومريحة.'
                    }
                },
                {
                    '@type': 'Question',
                    name: 'كيف يمكنني تحميل كتاب؟',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'ببساطة ابحث عن الكتاب الذي تريده، واضغط على صفحة الكتاب، ثم اضغط زر "تنزيل الملف (PDF)". لا حاجة لتسجيل الدخول.'
                    }
                },
                {
                    '@type': 'Question',
                    name: 'هل يمكنني قراءة الكتب بدون تحميل؟',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'نعم، يوجد قارئ PDF مدمج في الموقع يتيح لك قراءة أي كتاب مباشرة في المتصفح بدون الحاجة للتحميل.'
                    }
                },
                {
                    '@type': 'Question',
                    name: 'ما هي التصنيفات المتوفرة؟',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'لدينا أكثر من 40 تصنيف بما في ذلك: كتب دينية، روايات عربية، تنمية بشرية، تاريخ، علوم، تكنولوجيا، فلسفة، أدب، شعر، قصص أطفال، وأكثر.'
                    }
                },
                {
                    '@type': 'Question',
                    name: 'هل يعمل الموقع بدون إنترنت؟',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'نعم، يمكنك تثبيت الموقع كتطبيق (PWA) على جهازك وتحميل الكتب للقراءة بدون إنترنت.'
                    }
                }
            ]
        }
    ].filter(Boolean);

    if (error) {
        console.error('Error fetching books for homepage:', error);
        // Render an error state or fallback
        return (
            <div className="homepage-container">
                <h1 className="homepage-title">البحث عن الكتب</h1>
                <div style={{ textAlign: "center" }}>حدث خطأ أثناء تحميل الكتب. يرجى المحاولة مرة أخرى لاحقاً.</div>
            </div>
        );
    }

    return (
        <>
            {/* JSON-LD Structured Data */}
            {jsonLdScripts.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}

            <HomePageClient
                initialBooks={books || []}
                initialAuthors={shuffledAuthors}
                initialTotalCount={typeof count === 'number' ? count : (books?.length || 0)}
            />
        </>
    );
};

export default HomePage;
