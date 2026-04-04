import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface TeamInvitationEmailProps {
  officeName?: string
  inviterName?: string
  inviteLink?: string
  role?: string
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mizan.vercel.app'

export const TeamInvitationEmail = ({
  officeName = 'مكتب العدالة للمحاماة',
  inviterName = 'أحمد محمد',
  inviteLink = `${baseUrl}/register?invite=RANDOM_CODE`,
  role = 'lawyer',
}: TeamInvitationEmailProps) => {
  const roleText = role === 'lawyer' ? 'محامي' : 'مساعد إداري'

  return (
    <Html dir="rtl" lang="ar">
      <Head />
      <Preview>دعوة للانضمام إلى {officeName} على منصة ميزان</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>دعوة للانضمام لفريق العمل</Heading>
          
          <Text style={text}>مرحباً بك،</Text>
          
          <Text style={text}>
            لقد قام <strong>{inviterName}</strong> بدعوتك للانضمام إلى <strong>{officeName}</strong> بصلاحية <strong>{roleText}</strong> عبر نظام ميزان السحابي لإدارة مكاتب المحاماة.
          </Text>

          <Section style={btnContainer}>
            <Button style={button} href={inviteLink}>
              قبول الدعوة وإنشاء حساب
            </Button>
          </Section>

          <Text style={text}>
            أو يمكنك نسخ ولصق الرابط التالي في متصفحك:
            <br />
            <Link href={inviteLink} style={anchor}>
              {inviteLink}
            </Link>
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة بأمان.
          </Text>
          <Text style={footerLogo}>
            ميزان - النظام الشامل لإدارة مكاتب المحاماة
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default TeamInvitationEmail

const main = {
  backgroundColor: '#f8fafc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
  maxWidth: '100%',
}

const h1 = {
  color: '#0f172a',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '40px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '26px',
}

const btnContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#0f172a', /* primary color */
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 24px',
}

const anchor = {
  color: '#2563eb',
  textDecoration: 'underline',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '20px 0',
}

const footer = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '24px',
}

const footerLogo = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  marginTop: '32px',
  fontWeight: 'bold',
}
