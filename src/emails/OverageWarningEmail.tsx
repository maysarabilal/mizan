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

interface OverageWarningEmailProps {
  officeName: string
  ownerName: string
  maxUsers: number
  currentUsers: number
  deadlineText: string
}

export const OverageWarningEmail = ({
  officeName = 'مكتب المحاماة',
  ownerName = 'أستاذ',
  maxUsers = 5,
  currentUsers = 6,
  deadlineText = 'خلال 7 أيام',
}: OverageWarningEmailProps) => {
  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Preview>عاجل: تنبيه تجاوز الحد الأقصى لأعضاء مكتبك - ميزان</Preview>
      <Tailwind>
        <Body className="bg-slate-50 my-auto mx-auto font-sans text-right" dir="rtl">
          <Container className="border border-solid border-red-200 rounded my-[40px] mx-auto p-[20px] bg-white">
            <Section className="mt-[32px]">
              <Heading className="text-red-600 text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                ⚠️ تنبيه: تجاوز سعة الأعضاء
              </Heading>
              
              <Text className="text-black text-[14px] leading-[24px]">
                أهلاً {ownerName}،
              </Text>
              
              <Text className="text-black text-[14px] leading-[24px]">
                نود إبلاغك بأن مكتبك <strong>{officeName}</strong> قد تجاوز الحد الأقصى لعدد الأعضاء المسموح به في اشتراككم الحالي.
              </Text>

              <Section className="bg-slate-100 rounded p-4 my-6 text-center">
                <Text className="text-black text-[14px] m-0 mb-2">
                  عدد الأعضاء الحالي: <span className="font-bold text-red-600">{currentUsers}</span>
                </Text>
                <Text className="text-black text-[14px] m-0">
                  الحد الأقصى לבاقتك: <span className="font-bold">{maxUsers}</span>
                </Text>
              </Section>
              
              <Text className="text-black text-[14px] leading-[24px]">
                وفقاً لسياسة المنصة، نمنحك فترة سماح {deadlineText} لتصحيح الوضع، إما بإيقاف تفعيل بعض الأعضاء الزائدين أو ترقية باقتك إلى باقة تستوعب عدداً أكبر.
              </Text>

              <Text className="text-black font-semibold text-[14px] leading-[24px]">
                ملاحظة هامة: في حال عدم تصحيح الاكتظاظ قبل انتهاء فترة السماح، سيتم تغيير حالة حساب المكتب إلى "معلق" تلقائياً لحفظ بياناتكم.
              </Text>

              <Section className="text-center mt-[32px] mb-[32px]">
                <Link
                  href="https://mizan-app.com/dashboard/team"
                  target="_blank"
                  className="bg-black rounded text-white text-[14px] font-semibold no-underline text-center px-5 py-3"
                >
                  إدارة أعضاء المكتب
                </Link>
              </Section>
              
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

export default OverageWarningEmail
