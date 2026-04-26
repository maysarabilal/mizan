import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind
} from '@react-email/components'
import * as React from 'react'
import { EmailFooter } from './EmailFooter'

interface SubscriptionActivatedEmailProps {
  officeName: string
  planName: string
  expiryDate: string
}

export const SubscriptionActivatedEmail = ({
  officeName = 'مكتب المحاماة',
  planName = 'الباقة الذهبية',
  expiryDate = '2026-05-23',
}: SubscriptionActivatedEmailProps) => {
  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Preview>تهانينا! تم تفعيل اشتراكك في ميزان بنجاح</Preview>
      <Tailwind>
        <Body className="bg-slate-50 my-auto mx-auto font-sans text-right" dir="rtl">
          <Container className="border border-solid border-slate-200 rounded my-[40px] mx-auto p-[20px] bg-white">
            <Section className="mt-[32px]">
              <Heading className="text-green-600 text-[22px] font-normal text-center p-0 my-[30px] mx-0">
                تم تفعيل الاشتراك بنجاح 🎉
              </Heading>
              
              <Text className="text-black text-[14px] leading-[24px]">
                أهلاً بك،
              </Text>
              
              <Text className="text-black text-[14px] leading-[24px]">
                يسعدنا إبلاغك بأنه تم تأكيد الدفع وتفعيل الباقة الجديدة لمكتب <strong>{officeName}</strong> بنجاح.
              </Text>

              <Section className="bg-slate-100 rounded p-4 my-6 text-center">
                <Text className="text-black text-[14px] m-0 mb-2">
                  الباقة الحالية: <strong>{planName}</strong>
                </Text>
                <Text className="text-black text-[14px] m-0">
                  تاريخ انتهاء الاشتراك: <strong>{expiryDate}</strong>
                </Text>
              </Section>
              
              <Text className="text-black text-[14px] leading-[24px]">
                يمكنك الآن الاستمتاع بكامل المزايا والحدود الجديدة التي توفرها لك هذه الباقة. شكراً لاختيارك منصة ميزان!
              </Text>

              <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                  href="https://mizan-app.com/dashboard"
                  className="bg-amber-600 rounded text-white text-[14px] font-semibold no-underline text-center px-5 py-3"
                >
                  الذهاب إلى لوحة التحكم
                </Button>
              </Section>
              
              <EmailFooter />
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default SubscriptionActivatedEmail
