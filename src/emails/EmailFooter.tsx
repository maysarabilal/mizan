import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mizan-app.com'

export const EmailFooter = () => {
  return (
    <Section className="mt-[32px]">
      <Hr className="border-slate-200 my-[20px]" />
      
      <Row>
        <Column align="right">
          <Text className="text-[#666666] text-[12px] leading-[24px]">
            © {new Date().getFullYear()} ميزان - النظام الشامل لإدارة مكاتب المحاماة. جميع الحقوق محفوظة.
          </Text>
        </Column>
      </Row>

      <Row className="mt-[8px]">
        <Column align="right">
          <Text className="text-[#999999] text-[12px] leading-[20px]">
            أنت تتلقى هذا البريد لأنك مسجل في منصة ميزان. 
            <br />
            لدعم الفني: <Link href="mailto:support@mizan-app.com" className="text-blue-600 underline">support@mizan-app.com</Link>
          </Text>
        </Column>
      </Row>

      {/* Social Media Placeholders */}
      <Row className="mt-[16px]">
        <Column align="center">
          <Section className="w-fit">
            <Row>
              <Column className="px-[8px]">
                <Link href="#" className="text-slate-400 text-[12px] underline">فيسبوك</Link>
              </Column>
              <Column className="px-[8px]">
                <Link href="#" className="text-slate-400 text-[12px] underline">تويتر (X)</Link>
              </Column>
              <Column className="px-[8px]">
                <Link href="#" className="text-slate-400 text-[12px] underline">لينكد إن</Link>
              </Column>
            </Row>
          </Section>
        </Column>
      </Row>
    </Section>
  )
}

export default EmailFooter
