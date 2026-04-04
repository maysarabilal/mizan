import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Check, Shield, Zap, Users, Briefcase, Calendar } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50 dark:bg-zinc-950">
      
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-black text-2xl text-primary tracking-tighter">ميزان</div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">المميزات</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">الباقات</Link>
            <Link href="#security" className="hover:text-primary transition-colors">الأمان</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">تسجيل الدخول</Button>
            </Link>
            <Link href="/register">
              <Button>جرب مجاناً لمدة 14 يوم</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-background -z-10" />
          <div className="container mx-auto px-6 flex flex-col items-center text-center gap-8 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <span className="flex h-2 w-2 rounded-full bg-primary"></span>
              الإصدار الجديد متاح الآن
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-balance leading-tight">
              أدر مكتب المحاماة الخاص بك <br/> <span className="text-primary">بذكاء وسهولة</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl text-balance leading-relaxed">
              نظام سحابي متكامل يجمع بين إدارة القضايا، تنظيم الجلسات، وتنسيق المهام بين أعضاء المكتب 
              ضمن بيئة آمنة ومتوافقة مع أعلى معايير الخصوصية.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
                  ابدأ فترتك التجريبية الآن
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full bg-white dark:bg-zinc-900 border-2 w-full sm:w-auto">
                  استكشف المميزات
                </Button>
              </Link>
            </div>
            
            {/* Minimal App Mockup Abstract */}
            <div className="mt-16 w-full max-w-5xl rounded-2xl border border-border/50 bg-background/50 shadow-2xl backdrop-blur-sm overflow-hidden flex flex-col h-[400px]">
              <div className="h-12 border-b flex items-center px-4 gap-2 bg-muted/50">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 flex p-6 gap-6 opacity-80 pointer-events-none">
                <div className="w-48 bg-muted rounded-xl hidden md:block" />
                <div className="flex-1 flex flex-col gap-4">
                  <div className="h-24 bg-primary/10 rounded-xl" />
                  <div className="flex-1 bg-muted rounded-xl" />
                </div>
              </div>
            </div>
            
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white dark:bg-zinc-950">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center text-center mb-16 gap-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">كل ما تحتاجه في مكان واحد</h2>
              <p className="text-lg text-muted-foreground w-full max-w-2xl">تم تصميم النظام لتبسيط وتلبية احتياجات المؤسسات القانونية بفعالية مطلقة.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              <Card className="border-none shadow-md bg-slate-50 dark:bg-zinc-900/50">
                <CardHeader>
                  <Briefcase className="h-10 w-10 text-primary mb-4" />
                  <CardTitle className="text-2xl">إدارة القضايا</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  أرشفة كاملة للملفات والمستندات، متابعة حالة القضايا، وإدارة بيانات العملاء بضغطة زر.
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-slate-50 dark:bg-zinc-900/50">
                <CardHeader>
                  <Calendar className="h-10 w-10 text-primary mb-4" />
                  <CardTitle className="text-2xl">جدولة الجلسات</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  مزامنة تلقائية للجلسات، تنبيهات قبل المواعيد، وربط الجلسات بالمحامين المعينين بسلاسة.
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-slate-50 dark:bg-zinc-900/50">
                <CardHeader>
                  <Check className="h-10 w-10 text-primary mb-4" />
                  <CardTitle className="text-2xl">نظام المهام (Kanban)</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  وزع المهام على فريقك عبر السحب والإفلات وتتبع الإنجازات لمعرفة سير العمل اليومي بوضوح.
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-slate-50 dark:bg-zinc-900/50 lg:col-span-2">
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-4" />
                  <CardTitle className="text-2xl">إدارة فريق العمل (تعدد المستخدمين)</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  توليد روابط دعوة آمنة، نظام الصلاحيات المتقدم بين المالكين والمحامين والمساعدين لحماية بيانات المكتب وخصوصيته.
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-slate-50 dark:bg-zinc-900/50">
                <CardHeader>
                  <Zap className="h-10 w-10 text-primary mb-4" />
                  <CardTitle className="text-2xl">إشعارات فورية</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  ابقَ على اطلاع دائم. إشعارات داخلية فورية لأي تحديث جديد في قضيتك أو جلستك.
                </CardContent>
              </Card>

            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-slate-50 dark:bg-zinc-900">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center text-center mb-16 gap-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">باقات تناسب أعمالك</h2>
              <p className="text-lg text-muted-foreground w-full max-w-2xl">أسعار شفافة وباقات مرنة بدون التزامات خفية.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-2xl">الباقة الفردية</CardTitle>
                  <CardDescription>للمحامين المستقلين</CardDescription>
                  <div className="mt-4 text-4xl font-extrabold flex items-baseline gap-1">
                    59 ₪ <span className="text-lg text-muted-foreground font-medium">/ شهرياً</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> مستخدم واحد</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> إدارة كاملة للقضايا والجلسات</li>
                    <li className="flex items-center gap-2 text-muted-foreground"><Shield className="h-4 w-4" /> بدون إدارة فريق</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/register" className="w-full">
                    <Button variant="outline" className="w-full h-12">اختر الفردية</Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card className="flex flex-col border-primary ring-1 ring-primary shadow-xl relative scale-105 z-10">
                <div className="absolute top-0 right-0 left-0 bg-primary text-primary-foreground text-xs font-bold text-center py-1 rounded-t-lg">شائع للمكاتب</div>
                <CardHeader className="pt-8">
                  <CardTitle className="text-2xl">باقة المكاتب</CardTitle>
                  <CardDescription>المكاتب الصغيرة والمتوسطة</CardDescription>
                  <div className="mt-4 text-4xl font-extrabold flex items-baseline gap-1">
                    249 ₪ <span className="text-lg text-muted-foreground font-medium">/ شهرياً</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm font-medium">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> حتى 5 مستخدمين</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> نظام الفريق وتوزيع الصلاحيات</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> دعوات انضمام آمنة</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> لوحة تحكم المكتب المتقدمة</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/register" className="w-full">
                    <Button className="w-full h-12">اشترك الآن</Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-2xl">الباقة المؤسسية</CardTitle>
                  <CardDescription>الشركات القانونية الكبرى</CardDescription>
                  <div className="mt-4 text-4xl font-extrabold flex items-baseline gap-1">
                    799 ₪ <span className="text-lg text-muted-foreground font-medium">/ شهرياً</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> مستخدمين غير محدود</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> كافة ميزات النظام</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> أولوية عالية في الدعم الفني</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/register" className="w-full">
                    <Button variant="outline" className="w-full h-12">تواصل معنا</Button>
                  </Link>
                </CardFooter>
              </Card>

            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-black text-2xl text-primary tracking-tighter">
            ميزان
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-right">
            © {new Date().getFullYear()} منصة ميزان لإدارة مكاتب المحاماة. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
            <Link href="#" className="hover:text-primary">الشروط والأحكام</Link>
            <Link href="#" className="hover:text-primary">سياسة الخصوصية</Link>
            <Link href="/login" className="hover:text-primary">دخول الأعضاء</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
