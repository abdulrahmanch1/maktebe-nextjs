import { createClient } from '@/utils/supabase/server';

export const metadata = {
    title: 'عن المكتبة - دار القرَاء | مكتبة الكتب العربية الرائدة',
    description: 'تعرف على دار القرَاء، أكبر مكتبة عربية رقمية مجانية. تاريخنا، رؤيتنا، ميزاتنا المتقدمة، وكيف نخدم ملايين القراء العرب.',
};

// Revalidate every 24 hours
export const revalidate = 86400;

export default async function AboutPage() {
    const supabase = await createClient();

    // Get real stats
    const { count: booksCount } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

    const { count: authorsCount } = await supabase
        .from('authors')
        .select('*', { count: 'exact', head: true });

    const features = [
        {
            category: '🎯 الوصول والاستخدام',
            items: [
                { title: 'بدون تسجيل إجباري', description: 'اقرأ وحمّل أي كتاب فوراً بدون إنشاء حساب' },
                { title: '100% بدون إعلانات', description: 'تجربة قراءة نظيفة تماماً. لا pop-ups، لا banners' },
                { title: 'مجاني بالكامل', description: 'جميع الكتب مجانية. لا رسوم مخفية، لا اشتراكات' },
                { title: 'تحميل سريع', description: 'تحميل مباشر للكتب بصيغة PDF بدون انتظار' },
            ]
        },
        {
            category: '📖 القراءة والعرض',
            items: [
                { title: 'قارئ PDF احترافي', description: 'اقرأ مباشرة في المتصفح. تكبير، ملء شاشة، تنقل سريع، حفظ تلقائي' },
                { title: 'تصميم متجاوب', description: 'تجربة مثالية على جميع الأجهزة' },
                { title: 'وضع ليلي', description: 'ثيم داكن مريح للعين' },
                { title: 'خطوط عربية واضحة', description: 'محسّنة للقراءة الطويلة' },
            ]
        },
        {
            category: '🤖 الذكاء الاصطناعي',
            items: [
                { title: 'مساعد ذكي', description: 'AI chatbot للمساعدة في اكتشاف الكتب والإجابة على أسئلتك' },
                { title: 'توصيات مخصصة', description: 'اقتراحات بناءً على اهتماماتك وقراءاتك' },
                { title: 'بحث دلالي', description: 'ابحث بالمعنى لا بالكلمات فقط' },
            ]
        },
        {
            category: '✍️ الملاحظات والتنظيم',
            items: [
                { title: 'ملاحظات على الكتب', description: 'أضف ملاحظات خاصة على أي كتاب' },
                { title: 'ملاحظات على الصفحات', description: 'علّم على صفحات معينة بملاحظات موضعية' },
                { title: 'تمييز نصوص', description: 'ارسم وميّز على PDF بـ 4 ألوان مختلفة' },
                { title: 'قوائم قراءة', description: 'نظّم كتبك في قوائم مخصصة' },
                { title: 'المفضلة', description: 'احفظ كتبك المفضلة للوصول السريع' },
            ]
        },
        {
            category: '📱 Progressive Web App',
            items: [
                { title: 'تثبيت كتطبيق', description: 'ثبّت دار القرَاء كتطبيق على جوالك بنقرة واحدة' },
                { title: 'قراءة أوفلاين', description: 'حمّل الكتب للقراءة بدون إنترنت' },
                { title: 'تحديثات تلقائية', description: 'التطبيق يحدّث نفسه تلقائياً' },
                { title: 'أداء سريع', description: 'تحميل فوري بفضل Service Worker caching' },
            ]
        },
        {
            category: '🔍 البحث والاكتشاف',
            items: [
                { title: 'بحث متقدم', description: 'ابحث بالعنوان، المؤلف، الوصف، أو الكلمات المفتاحية' },
                { title: 'تصفية ذكية', description: 'رتّب حسب التصنيف، التاريخ، الشعبية، والتقييم' },
                { title: '40+ تصنيف', description: 'من الكتب الدينية للروايات للعلمية' },
                { title: 'صفحات مؤلفين', description: 'صفحات مخصصة لكل مؤلف مع سيرته وكتبه' },
            ]
        },
        {
            category: '📊 الإحصائيات',
            items: [
                { title: 'إحصائيات قراءة', description: 'تتبع عدد الكتب المقروءة والصفحات والوقت' },
                { title: 'سجل القراءة', description: 'احفظ تاريخ قراءاتك' },
                { title: 'نسبة الإنجاز', description: 'شاهد تقدمك في كل كتاب' },
            ]
        },
        {
            category: '🎨 التخصيص',
            items: [
                { title: 'ثيمات متعددة', description: '10+ ثيمات ألوان لتخصيص المظهر' },
                { title: 'واجهة RTL كاملة', description: 'تصميم مخصص للعربية' },
                { title: 'Accessibility', description: 'دعم قارئات الشاشة' },
            ]
        },
        {
            category: '🔒 الأمان',
            items: [
                { title: 'خصوصية تامة', description: 'لا تتبع، لا بيع للبيانات، لا مشاركة' },
                { title: 'بيانات مشفرة', description: 'HTTPS وتشفير متقدم' },
                { title: 'حذف الحساب', description: 'احذف حسابك وبياناتك بنقرة' },
            ]
        },
    ];

    return (
        <div className="about-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
            {/* Hero Section */}
            <section style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(135deg, #0a3f54 0%, #2d7a9a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    دار القرَاء
                </h1>
                <p style={{ fontSize: '1.5rem', color: '#666', marginBottom: '2rem' }}>
                    اكتشف عالمك التالي بين السطور
                </p>
            </section>

            {/* Stats */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                <div style={{ textAlign: 'center', padding: '2rem', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#0a3f54' }}>{booksCount || '1,000'}+</div>
                    <div style={{ fontSize: '1.2rem', color: '#666' }}>كتاب ورواية</div>
                </div>
                <div style={{ textAlign: 'center', padding: '2rem', background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#0a3f54' }}>{authorsCount || '500'}+</div>
                    <div style={{ fontSize: '1.2rem', color: '#666' }}>مؤلف ومؤلفة</div>
                </div>
                <div style={{ textAlign: 'center', padding: '2rem', background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#0a3f54' }}>40+</div>
                    <div style={{ fontSize: '1.2rem', color: '#666' }}>تصنيف مختلف</div>
                </div>
                <div style={{ textAlign: 'center', padding: '2rem', background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#0a3f54' }}>100%</div>
                    <div style={{ fontSize: '1.2rem', color: '#666' }}>مجاني بدون إعلانات</div>
                </div>
            </section>

            {/* Our Story */}
            <section style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#0a3f54' }}>قصتنا</h2>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#444' }}>
                    <p style={{ marginBottom: '1rem' }}>
                        في عالم تزداد فيه العوائق أمام الوصول للمعرفة، ولدت <strong>دار القرَاء</strong> من حلم بسيط:
                        <strong> جعل الكتب العربية متاحة للجميع، في أي مكان، في أي وقت، بدون قيود</strong>.
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        بدأنا في عام 2024 كمشروع صغير، لكن برؤية كبيرة: بناء أكبر وأشمل مكتبة رقمية عربية مجانية في العالم.
                        مكتبة بدون إعلانات مزعجة، بدون تسجيل إجباري، بدون حواجز تقف بين القارئ والكتاب.
                    </p>
                    <p>
                        اليوم، نخدم آلاف القراء يومياً، ونستمر في النمو بفضل مجتمعنا الرائع من القراء والمساهمين.
                    </p>
                </div>
            </section>

            {/* Vision & Mission */}
            <section style={{ marginBottom: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div style={{ padding: '2rem', background: '#f8f9fa', borderRadius: '12px', borderRight: '4px solid #0a3f54' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#0a3f54' }}>🎯 رؤيتنا</h3>
                    <p style={{ lineHeight: '1.7', color: '#555' }}>
                        أن نصبح <strong>المرجع الأول</strong> للقراء العرب في جميع أنحاء العالم، ومنصة رائدة تجمع بين
                        التكنولوجيا المتقدمة وثراء المحتوى العربي الأصيل.
                    </p>
                </div>
                <div style={{ padding: '2rem', background: '#f8f9fa', borderRadius: '12px', borderRight: '4px solid #2d7a9a' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#0a3f54' }}>💡 مهمتنا</h3>
                    <p style={{ lineHeight: '1.7', color: '#555' }}>
                        <strong>ديمقراطية المعرفة</strong> من خلال توفير وصول حر وسهل إلى آلاف الكتب والروايات العربية،
                        مع تجربة قراءة استثنائية مدعومة بالذكاء الاصطناعي.
                    </p>
                </div>
            </section>

            {/* Core Values */}
            <section style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#0a3f54' }}>قيمنا الأساسية</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {[
                        { icon: '🎁', title: 'الوصول المجاني', desc: 'نؤمن أن المعرفة حق للجميع، ليس امتياز المقتدرين' },
                        { icon: '🚫', title: 'لا للإعلانات', desc: 'تجربة قراءة نظيفة ومريحة بدون أي إزعاج' },
                        { icon: '🔓', title: 'لا للحواجز', desc: 'قراءة وتحميل فوري بدون تسجيل أو انتظار' },
                        { icon: '🤖', title: 'التقنية للإنسان', desc: 'نستخدم AI لتحسين القراءة، لا لاستبدال الإنسان' },
                        { icon: '📚', title: 'الجودة أولاً', desc: 'ننتقي المحتوى بعناية ونراجعه للتأكد من جودته' },
                        { icon: '🌍', title: 'مجتمع القراءة', desc: 'نبني مجتمع حي من القراء والمفكرين العرب' },
                    ].map((value, i) => (
                        <div key={i} style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{value.icon}</div>
                            <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#0a3f54' }}>{value.title}</h4>
                            <p style={{ color: '#666', lineHeight: '1.6' }}>{value.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features - Comprehensive */}
            <section style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#0a3f54' }}>ميزاتنا المتقدمة</h2>
                {features.map((category, i) => (
                    <div key={i} style={{ marginBottom: '3rem' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#2d7a9a' }}>{category.category}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                            {category.items.map((item, j) => (
                                <div key={j} style={{ padding: '1.2rem', background: '#f8f9fa', borderRadius: '8px', borderRight: '3px solid #0a3f54' }}>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#0a3f54', fontWeight: '600' }}>{item.title}</h4>
                                    <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.5' }}>{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            {/* Team */}
            <section style={{ marginBottom: '4rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#0a3f54' }}>فريقنا</h2>
                <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
                    نحن فريق شغوف بالكتب والتكنولوجيا، نعمل على مدار الساعة لتقديم أفضل تجربة قراءة ممكنة للقراء العرب في كل مكان.
                </p>
            </section>

            {/* Contact CTA */}
            <section style={{ textAlign: 'center', padding: '3rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', color: 'white' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>انضم لمجتمعنا</h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
                    كن جزءاً من ثورة القراءة العربية الرقمية
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a href="/" style={{ padding: '1rem 2rem', background: 'white', color: '#667eea', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
                        ابدأ القراءة الآن
                    </a>
                </div>
            </section>
        </div>
    );
}
