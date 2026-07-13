import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, FileText, Info, ListOrdered, ShieldCheck } from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { buildSeo, SITE_URL, SITE_NAME_AR } from "@/lib/seo";
import { schemaScript } from "@/lib/schemas";

const PAGE_TITLE = "دليل تقديم الصف الأول الابتدائي — الناصرية الجديدة";
const PAGE_DESCRIPTION =
  "دليل رسمي مبسّط لأولياء الأمور حول خطوات التقديم الإلكتروني للصف الأول الابتدائي بمدرسة الناصرية الابتدائية الجديدة، والمستندات المطلوبة، والمواعيد المعتمدة.";

const STEPS = [
  {
    title: "التسجيل على منصة وزارة التربية والتعليم",
    body:
      "يبدأ التقديم إلكترونيًا عبر البوابة الرسمية لوزارة التربية والتعليم في المواعيد المعلنة سنويًا. يقوم ولي الأمر بإنشاء حساب باستخدام الرقم القومي وبيانات الطفل.",
  },
  {
    title: "إدخال بيانات الطفل الأساسية",
    body:
      "تُدخل بيانات شهادة الميلاد المميكنة كما هي: الاسم رباعيًا، تاريخ الميلاد، الرقم القومي للطفل، ورقم قومي لولي الأمر، ثم يتم اختيار الإدارة التعليمية والمنطقة السكنية.",
  },
  {
    title: "اختيار مدرسة الناصرية الابتدائية الجديدة",
    body:
      "من قائمة المدارس التابعة للإدارة التعليمية يتم اختيار «مدرسة الناصرية الابتدائية الجديدة» كرغبة أولى، مع ترتيب باقي الرغبات وفق أولوية ولي الأمر.",
  },
  {
    title: "رفع المستندات المطلوبة",
    body:
      "تُرفع صور واضحة من شهادة ميلاد الطفل المميكنة، بطاقة ولي الأمر، إثبات محل الإقامة، وشهادة تطعيمات الطفل. تأكد من وضوح الصور قبل الإرسال.",
  },
  {
    title: "تأكيد التقديم ومتابعة النتيجة",
    body:
      "بعد إرسال الطلب يحصل ولي الأمر على رقم مرجعي لمتابعة الحالة. تعلن نتائج التنسيق على المنصة نفسها في المواعيد الرسمية، ويتوجه ولي الأمر إلى المدرسة لاستكمال الملف الورقي.",
  },
];

const DOCUMENTS = [
  "شهادة ميلاد الطفل المميكنة (أصل + صورة).",
  "بطاقة الرقم القومي لولي الأمر (أصل + صورة).",
  "إثبات محل الإقامة (فاتورة مرافق حديثة أو عقد إيجار موثق).",
  "شهادة تطعيمات الطفل موقّعة ومختومة من مكتب الصحة.",
  "أربع صور شخصية حديثة للطفل بخلفية بيضاء.",
  "استمارة التقديم المطبوعة من المنصة موقّعة من ولي الأمر.",
];

const REQUIREMENTS = [
  "أن يكون الطفل قد أتم السن القانونية للقبول بالصف الأول الابتدائي وفق قرار الوزارة للعام الدراسي المستهدف.",
  "أن يكون محل إقامة الأسرة داخل النطاق الجغرافي للإدارة التعليمية التابعة لها المدرسة.",
  "استكمال جميع التطعيمات الأساسية المطلوبة من وزارة الصحة.",
  "عدم وجود تقديم مزدوج للطفل في أكثر من مدرسة حكومية.",
];

const FAQ_ITEMS = [
  {
    question: "متى يفتح باب التقديم للصف الأول الابتدائي؟",
    answer:
      "تحدد وزارة التربية والتعليم موعدًا سنويًا لبدء التقديم الإلكتروني — عادةً بين شهري مايو ويوليو. تُعلن المواعيد الرسمية على موقع الوزارة وعلى صفحة أخبار المدرسة.",
  },
  {
    question: "هل التقديم ورقي أم إلكتروني؟",
    answer:
      "التقديم الأساسي يتم إلكترونيًا عبر منصة الوزارة. بعد ظهور النتيجة يتوجه ولي الأمر إلى المدرسة لاستكمال الملف الورقي وتسليم المستندات الأصلية.",
  },
  {
    question: "ماذا لو لم يظهر اسم المدرسة في القائمة؟",
    answer:
      "يعني ذلك أن عنوان الإقامة المسجل يقع خارج النطاق الجغرافي للإدارة التعليمية للمدرسة. راجع بيانات محل الإقامة أو تواصل مع الإدارة التعليمية للتأكد.",
  },
  {
    question: "هل يمكن تعديل الرغبات بعد إرسال الطلب؟",
    answer:
      "يمكن تعديل الرغبات قبل إغلاق باب التقديم فقط. بعد إغلاق الباب لا تُقبل أي تعديلات إلا في الحالات الاستثنائية التي تحددها الإدارة التعليمية.",
  },
];

export const Route = createFileRoute("/academic/admission-guide")({
  head: () => {
    const seo = buildSeo({
      path: "/academic/admission-guide",
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      type: "article",
    });
    const faqSchema = schemaScript({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
    const howToSchema = schemaScript({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "خطوات تقديم الصف الأول الابتدائي",
      description: PAGE_DESCRIPTION,
      inLanguage: "ar",
      totalTime: "P30D",
      step: STEPS.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.title,
        text: s.body,
        url: `${SITE_URL}/academic/admission-guide#step-${i + 1}`,
      })),
      supply: DOCUMENTS.map((d) => ({ "@type": "HowToSupply", name: d })),
      publisher: { "@type": "EducationalOrganization", name: SITE_NAME_AR },
    });
    return { ...seo, scripts: [howToSchema, faqSchema] };
  },
  component: AdmissionGuidePage,
});

function AdmissionGuidePage() {
  return (
    <>
      <PageHero
        eyebrow="القبول والتسجيل"
        title="دليل تقديم الصف الأول الابتدائي"
        description="خطوات مبسّطة لأولياء الأمور: كيفية التقديم إلكترونيًا، المستندات المطلوبة، الشروط الأساسية، والأسئلة الشائعة."
        crumbs={[
          { label: "الحياة الأكاديمية", to: "/academic" },
          { label: "دليل التقديم" },
        ]}
      />

      <Section spacing="default">
        <Container size="wide">
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <article>
              <header className="flex items-center gap-2 text-primary">
                <ListOrdered className="h-5 w-5" aria-hidden="true" />
                <p className="text-sm font-semibold uppercase tracking-[0.15em]">
                  خطوات التقديم الإلكتروني
                </p>
              </header>
              <h2 className="mt-3 rule-accent inline-block text-2xl font-bold text-foreground sm:text-3xl">
                خمس خطوات لإتمام التقديم
              </h2>
              <ol className="mt-8 space-y-6">
                {STEPS.map((step, i) => (
                  <li
                    key={step.title}
                    id={`step-${i + 1}`}
                    className="rounded-2xl border border-border bg-card p-6 elevation-sm"
                  >
                    <div className="flex items-start gap-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm leading-loose text-muted-foreground">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </article>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-border bg-surface-muted p-6 elevation-sm">
                <header className="flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">
                    المستندات المطلوبة
                  </h2>
                </header>
                <ul className="mt-4 space-y-3 text-sm leading-loose text-foreground/90">
                  {DOCUMENTS.map((d) => (
                    <li key={d} className="flex gap-2">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6 elevation-sm">
                <header className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">
                    شروط القبول
                  </h2>
                </header>
                <ul className="mt-4 space-y-3 text-sm leading-loose text-foreground/90">
                  {REQUIREMENTS.map((r) => (
                    <li key={r} className="flex gap-2">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-border bg-primary-soft p-6 text-foreground elevation-sm">
                <header className="flex items-center gap-2 text-primary">
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">
                    مواعيد التقديم
                  </h2>
                </header>
                <p className="mt-3 text-sm leading-loose">
                  تُعلن مواعيد التقديم الرسمية سنويًا من وزارة التربية والتعليم. تابع
                  أحدث الإعلانات من قسم الأخبار.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link to="/news">آخر أخبار المدرسة</Link>
                </Button>
              </section>
            </aside>
          </div>
        </Container>
      </Section>

      <Section tone="muted" spacing="default">
        <Container size="wide">
          <header className="flex items-center gap-2 text-primary">
            <Info className="h-5 w-5" aria-hidden="true" />
            <p className="text-sm font-semibold uppercase tracking-[0.15em]">
              أسئلة شائعة
            </p>
          </header>
          <h2 className="mt-3 rule-accent inline-block text-2xl font-bold text-foreground sm:text-3xl">
            الأسئلة الأكثر تكرارًا حول التقديم
          </h2>
          <dl className="mt-8 grid gap-4 md:grid-cols-2">
            {FAQ_ITEMS.map((f) => (
              <div
                key={f.question}
                className="rounded-2xl border border-border bg-card p-6 elevation-sm"
              >
                <dt className="text-base font-semibold text-foreground">{f.question}</dt>
                <dd className="mt-2 text-sm leading-loose text-muted-foreground">
                  {f.answer}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>
    </>
  );
}
