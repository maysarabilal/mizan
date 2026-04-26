import {
  Body,
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

interface WelcomeEmailProps {
  officeName: string
  ownerName: string
  trialDays: number
}

export const WelcomeEmail = ({
  officeName = 'مكتب المحاماة',
  ownerName = 'أستاذ',
  trialDays = 7,
}: WelcomeEmailProps) => {
  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Preview>مرحباً بك في منصة ميزان - تم تفعيل حسابك بنجاح</Preview>
      <Tailwind>
        <Body className="bg-slate-50 my-auto mx-auto font-sans text-right" dir="rtl">
          <Container className="border border-solid border-slate-200 rounded my-[40px] mx-auto p-[20px] bg-white">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                مرحباً بك في <strong>ميزان</strong>
              </Heading>
              
              <Text className="text-black text-[14px] leading-[24px]">
                أهلاً {ownerName}،
              </Text>
              
              <Text className="text-black text-[14px] leading-[24px]">
                يسعدنا انضمامك إلينا! تم إعداد وتفعيل مكتبك <strong>{officeName}</strong> بنجاح على منصة ميزان لإدارة المكاتب القانونية.
              </Text>
              
              <Text className="text-black text-[14px] leading-[24px]">
                لقد بدأ الآن اشتراكك التجريبي المجاني الصالح لمدة {trialDays} أيام. خلال هذه الفترة ستتمتع بكافة الصلاحيات لإدارة قضاياك، عملائك، وجلساتك بكل سهولة.
              </Text>

              <Section className="text-center mt-[32px] mb-[32px]">
                <Link
                  href="https://mizan-app.com/dashboard"
                  target="_blank"
                  className="bg-amber-600 rounded text-white text-[14px] font-semibold no-underline text-center px-5 py-3"
                >
                  الذهاب إلى لوحة التحكم
                </Link>
              </Section>
              
              <Text className="text-black text-[14px] leading-[24px]">
                إذا احتجت إلى أي مساعدة في إعداد المنصة، لا تتردد في التواصل مع فريق الدعم الفني الخاص بنا.
              </Text>
              
              <Text className="text-slate-500 text-[14px] leading-[24px] mt-8">
                مع خالص التحيات،<br />فريق ميزان
              </Text>

              <EmailFooter />
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default WelcomeEmail
