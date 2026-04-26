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
  Tailwind,
  Hr
} from '@react-email/components'
import * as React from 'react'
import { EmailFooter } from './EmailFooter'

interface SubscriptionStatusEmailProps {
  officeName: string
  planName: string
  status: 'approved' | 'rejected'
  adminNote?: string
}

export const SubscriptionStatusEmail = ({
  officeName = 'مكتب المحاماة',
  planName = 'الباقة الذهبية',
  status = 'approved',
  adminNote,
}: SubscriptionStatusEmailProps) => {
  const isApproved = status === 'approved'

  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Preview>تحديث بخصوص طلب ترقية مكتب {officeName} - ميزان</Preview>
      <Tailwind>
        <Body className="bg-slate-50 my-auto mx-auto font-sans text-right" dir="rtl">
          <Container className="border border-solid border-slate-200 rounded my-[40px] mx-auto p-[20px] bg-white">
            <Section className="mt-[32px]">
              <Heading className={`text-[22px] font-normal text-center p-0 my-[30px] mx-0 ${isApproved ? 'text-green-600' : 'text-red-600'}`}>
                {isApproved ? 'تمت الموافقة على طلب الترقية' : 'تم رفض طلب الترقية'}
              </Heading>
              
              <Text className="text-black text-[14px] leading-[24px]">
                أهلاً بك،
              </Text>
              
              <Text className="text-black text-[14px] leading-[24px]">
                نود إخطارك بأنه تم تحديث حالة طلب الترقية الخاص بمكتب <strong>{officeName}</strong> للباقة <strong>{planName}</strong>.
              </Text>

              {isApproved ? (
                <Section className="bg-green-50 border border-green-200 rounded p-4 my-6">
                  <Text className="text-green-900 text-[15px] font-bold m-0 mb-4 text-center">
                    يرجى إتمام عملية الدفع لتفعيل الباقة:
                  </Text>
                  <Text className="text-green-800 text-[13px] leading-[22px] m-0">
                    يمكنك التحويل عبر إحدى الوسائل التالية:
                    <br />• <strong>IBAN:</strong> PS12 3456 7890 1234 5678 9012 (البنك الوطني)
                    <br />• <strong>Reflect:</strong> 059XXXXXXX
                    <br />• <strong>PalPay:</strong> رقم الحساب: 123456
                  </Text>
                  <Hr className="border-green-200 my-4" />
                  <Text className="text-green-800 text-[13px] leading-[22px] m-0 italic text-center">
                    بعد إتمام التحويل، يرجى إرفاق وصل الدفع عبر لوحة التحكم.
                  </Text>
                </Section>
              ) : (
                <Section className="bg-red-50 border border-red-200 rounded p-4 my-6">
                  <Text className="text-red-900 text-[15px] font-bold m-0 text-center">
                    للأسف، لم تتم الموافقة على الطلب في الوقت الحالي.
                  </Text>
                  {adminNote && (
                    <Text className="text-red-800 text-[13px] leading-[22px] mt-2 mb-0">
                      ملاحظة الإدارة: {adminNote}
                    </Text>
                  )}
                </Section>
              )}

              <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                  href="https://mizan-app.com/dashboard/subscription"
                  className="bg-amber-600 rounded text-white text-[14px] font-semibold no-underline text-center px-5 py-3"
                >
                  عرض تفاصيل الاشتراك
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

export default SubscriptionStatusEmail
