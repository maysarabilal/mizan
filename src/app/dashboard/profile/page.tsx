import { getProfileAction } from '@/lib/actions/profile'
import { ProfileForm } from './ProfileForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCircle } from 'lucide-react'

export default async function ProfilePage() {
  const { data: profile } = await getProfileAction()

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl justify-start">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">الملف الشخصي</h1>
        <p className="text-muted-foreground text-sm">
          تعديل معلومات حسابك، اسم العرض، وبيانات التواصل.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCircle className="h-10 w-10 text-muted-foreground" />
            <div>
              <CardTitle>البيانات الأساسية</CardTitle>
              <CardDescription>
                هذه البيانات ستظهر لباقي أفراد الفريق والنظام. البريد الإلكتروني غير قابل للتعديل لمعايير أمنية.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm initialData={profile || {}} />
        </CardContent>
      </Card>
    </div>
  )
}
