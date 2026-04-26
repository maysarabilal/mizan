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

interface UpgradeRequestAdminEmailProps {
  officeName: string
  planName: string
  requesterName: string
}

export const UpgradeRequestAdminEmail = ({
  officeName = 'مكتب المحاماة',
  planName = 'الباقة الذهبية',
  requesterName = 'أحمد محمد',
}: UpgradeRequestAdminEmailProps) => {
  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Preview>طلب ترقية جديد من مكتب {officeName} - ميزان</Preview>
      <Tailwind>
        <Body className="bg-slate-50 my-auto mx-auto font-sans text-right" dir="rtl">
          <Container className="border border-solid border-slate-200 rounded my-[40px] mx-auto p-[20px] bg-white">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[22px] font-normal text-center p-0 my-[30px] mx-0">
                طلب ترقية اشتراك جديد
              </Heading>
              
              <Text className="text-black text-[14px] leading-[24px]">
                مرحباً مدير النظام،
              </Text>
              
              <Text className="text-black text-[14px] leading-[24px]">
                قام المستخدم <strong>{requesterName}</strong> من مكتب <strong>{officeName}</strong> بتقديم طلب ترقية للباقة التالية:
              </Text>

              <Section className="bg-amber-50 border border-amber-200 rounded p-4 my-6 text-center">
                <Text className="text-amber-900 text-[16px] font-bold m-0">
                  الباقة المطلوبة: {planName}
                </Text>
              </Section>
              
              <Text className="text-black text-[14px] leading-[24px]">
                يرجى مراجعة الطلب في لوحة التحكم واتخاذ الإجراء المناسب.
              </Text>

              <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                  href="https://mizan-app.com/admin/requests"
                  className="bg-amber-600 rounded text-white text-[14px] font-semibold no-underline text-center px-5 py-3"
                >
                  عرض طلبات الترقية
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

export default UpgradeRequestAdminEmail
