import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind
} from '@react-email/components'
import * as React from 'react'
import { EmailFooter } from './EmailFooter'

interface TeamInvitationEmailProps {
  officeName?: string
  inviterName?: string
  inviteLink?: string
  role?: string
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mizan-app.com'

const ROLE_LABELS: Record<string, string> = {
  owner: 'مالك مكتب',
  admin: 'مدير',
  lawyer: 'محامي',
  secretary: 'سكرتارية',
  trainee: 'متدرب',
}

export const TeamInvitationEmail = ({
  officeName = 'مكتب المحاماة',
  inviterName = 'أستاذ',
  inviteLink = `${baseUrl}/register?invite=CODE`,
  role = 'lawyer',
}: TeamInvitationEmailProps) => {
  const roleText = ROLE_LABELS[role] || 'عضو فريق'

  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Preview>دعوة للانضمام إلى {officeName} على منصة ميزان</Preview>
      <Tailwind>
        <Body className="bg-slate-50 my-auto mx-auto font-sans text-right" dir="rtl">
          <Container className="border border-solid border-slate-200 rounded my-[40px] mx-auto p-[20px] bg-white">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                دعوة للانضمام لـ <strong>ميزان</strong>
              </Heading>
              
              <Text className="text-black text-[14px] leading-[24px]">
                مرحباً بك،
              </Text>
              
              <Text className="text-black text-[14px] leading-[24px]">
                لقد قام <strong>{inviterName}</strong> بدعوتك للانضمام إلى فريق عمل <strong>{officeName}</strong> بصلاحية <strong>{roleText}</strong> عبر منصة ميزان لإدارة المكاتب القانونية.
              </Text>

              <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                  href={inviteLink}
                  className="bg-amber-600 rounded text-white text-[14px] font-semibold no-underline text-center px-5 py-3"
                >
                  قبول الدعوة وإنشاء حساب
                </Button>
              </Section>
              
              <Text className="text-black text-[14px] leading-[24px]">
                أو يمكنك نسخ ولصق الرابط التالي في متصفحك:
                <br />
                <Link href={inviteLink} className="text-blue-600 underline text-[12px]">
                  {inviteLink}
                </Link>
              </Text>
              
              <Text className="text-slate-500 text-[14px] leading-[24px] mt-8">
                إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة بأمان.
              </Text>

              <EmailFooter />
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default TeamInvitationEmail
