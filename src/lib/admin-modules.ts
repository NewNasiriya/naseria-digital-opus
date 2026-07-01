import {
  LayoutDashboard,
  Home,
  Info,
  GraduationCap,
  Newspaper,
  Trophy,
  Award,
  Sparkles,
  Images,
  FolderOpen,
  FileText,
  Phone,
  Users,
  Settings,
  Search,
  Activity,
  type LucideIcon,
} from "lucide-react";

export type AdminModuleId =
  | "dashboard"
  | "homepage"
  | "about"
  | "academic"
  | "news"
  | "achievements"
  | "honor"
  | "activities"
  | "gallery"
  | "media"
  | "documents"
  | "contact"
  | "users"
  | "settings"
  | "seo"
  | "status";

export type AdminModule = {
  id: AdminModuleId;
  slug: string; // path segment under /admin
  title: string;
  short: string; // sidebar label
  description: string;
  icon: LucideIcon;
  primaryAction: string;
  group: "content" | "media" | "system";
  publicHref?: string; // link to matching public page (opens new tab)
};

export const ADMIN_MODULES: AdminModule[] = [
  {
    id: "homepage",
    slug: "homepage",
    title: "إدارة الصفحة الرئيسية",
    short: "الصفحة الرئيسية",
    description: "الشريط الترحيبي، الإحصائيات، والأقسام المميزة.",
    icon: Home,
    primaryAction: "تحرير الصفحة الرئيسية",
    group: "content",
    publicHref: "/",
  },
  {
    id: "about",
    slug: "about",
    title: "إدارة صفحة عن المدرسة",
    short: "عن المدرسة",
    description: "الرسالة، الرؤية، القيم، وكلمة مدير المدرسة.",
    icon: Info,
    primaryAction: "تحرير المحتوى",
    group: "content",
    publicHref: "/about",
  },
  {
    id: "academic",
    slug: "academic",
    title: "إدارة الحياة الأكاديمية",
    short: "الحياة الأكاديمية",
    description: "الصفوف، الجداول، التقويم، والإرشادات.",
    icon: GraduationCap,
    primaryAction: "تحرير الأكاديمية",
    group: "content",
    publicHref: "/academic",
  },
  {
    id: "news",
    slug: "news",
    title: "إدارة الأخبار",
    short: "الأخبار",
    description: "نشر الأخبار والتعميمات الرسمية للمدرسة.",
    icon: Newspaper,
    primaryAction: "إضافة خبر جديد",
    group: "content",
    publicHref: "/news",
  },
  {
    id: "achievements",
    slug: "achievements",
    title: "إدارة الإنجازات",
    short: "الإنجازات",
    description: "توثيق المشاريع والإنجازات الرسمية بالصور.",
    icon: Trophy,
    primaryAction: "إضافة إنجاز",
    group: "content",
    publicHref: "/achievements",
  },
  {
    id: "honor",
    slug: "honor",
    title: "إدارة لوحة الشرف",
    short: "لوحة الشرف",
    description: "كشوف أوائل الطلاب لكل صف دراسي.",
    icon: Award,
    primaryAction: "استبدال كشف",
    group: "content",
    publicHref: "/honor",
  },
  {
    id: "activities",
    slug: "activities",
    title: "إدارة الأنشطة",
    short: "الأنشطة",
    description: "الفعاليات، الرحلات، والأنشطة اللاصفية.",
    icon: Sparkles,
    primaryAction: "إضافة نشاط",
    group: "content",
    publicHref: "/activities",
  },
  {
    id: "gallery",
    slug: "gallery",
    title: "إدارة معرض الصور",
    short: "المعرض",
    description: "الألبومات العامة الظاهرة على الموقع.",
    icon: Images,
    primaryAction: "إضافة ألبوم",
    group: "media",
  },
  {
    id: "media",
    slug: "media",
    title: "مكتبة الوسائط",
    short: "الوسائط",
    description: "الصور والملفات المتاحة لجميع الأقسام.",
    icon: FolderOpen,
    primaryAction: "رفع ملفات",
    group: "media",
  },
  {
    id: "documents",
    slug: "documents",
    title: "مركز المستندات",
    short: "المستندات",
    description: "ملفات PDF، التعميمات، السياسات، والنماذج القابلة للتنزيل.",
    icon: FileText,
    primaryAction: "رفع مستند",
    group: "media",
  },
  {
    id: "contact",
    slug: "contact",
    title: "إدارة معلومات التواصل",
    short: "التواصل",
    description: "العنوان، مواعيد العمل، ووسائل التواصل.",
    icon: Phone,
    primaryAction: "تحديث المعلومات",
    group: "content",
    publicHref: "/contact",
  },
  {
    id: "users",
    slug: "users",
    title: "إدارة المستخدمين",
    short: "المستخدمون",
    description: "أعضاء فريق الإدارة وصلاحياتهم.",
    icon: Users,
    primaryAction: "دعوة عضو",
    group: "system",
  },
  {
    id: "settings",
    slug: "settings",
    title: "إعدادات الموقع",
    short: "الإعدادات",
    description: "اسم المدرسة، الشعار، والإعدادات العامة.",
    icon: Settings,
    primaryAction: "تحديث الإعدادات",
    group: "system",
  },
  {
    id: "seo",
    slug: "seo",
    title: "تحسين محركات البحث",
    short: "SEO",
    description: "عناوين ووصف الصفحات لمحركات البحث.",
    icon: Search,
    primaryAction: "تحرير البيانات الوصفية",
    group: "system",
  },
  {
    id: "status",
    slug: "status",
    title: "حالة الموقع",
    short: "حالة الموقع",
    description: "الأداء، تحديثات النشر، والتحقق الفني.",
    icon: Activity,
    primaryAction: "فحص الحالة",
    group: "system",
  },
];

export const ADMIN_MODULE_BY_SLUG: Record<string, AdminModule> =
  Object.fromEntries(ADMIN_MODULES.map((m) => [m.slug, m]));

export const DASHBOARD_ICON = LayoutDashboard;

export const ADMIN_GROUP_LABEL: Record<AdminModule["group"], string> = {
  content: "المحتوى",
  media: "الوسائط",
  system: "النظام",
};
