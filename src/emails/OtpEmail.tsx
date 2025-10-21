import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OtpEmailProps {
  validationCode?: string;
}

export const OtpEmail = ({ validationCode }: OtpEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>Your SafeCast verification code</Preview>
      <Container style={container}>
        <Heading style={logo}>SafeCast</Heading>
        <Heading style={heading}>Your verification code</Heading>
        <Text style={paragraph}>
          Use this code to verify your email address and join the SafeCast
          community. This code will only be valid for the next 30 minutes.
        </Text>
        <code style={code}>{validationCode}</code>
        <Text style={paragraph}>
          If you didn&apos;t request this code, please ignore this email.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>SafeCast - Community Safety Platform</Text>
      </Container>
    </Body>
  </Html>
);

OtpEmail.PreviewProps = {
  validationCode: "123456",
} as OtpEmailProps;

export default OtpEmail;

const logo = {
  fontSize: "24px",
  fontWeight: "400",
  color: "#484848",
  margin: "0 0 17px 0",
  letterSpacing: "-0.5px",
};

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "400",
  color: "#484848",
  padding: "17px 0 0",
};

const paragraph = {
  margin: "0 0 15px",
  fontSize: "15px",
  lineHeight: "1.4",
  color: "#3c4149",
};

const code = {
  fontFamily: "monospace",
  fontWeight: "700",
  padding: "1px 4px",
  backgroundColor: "#dfe1e4",
  letterSpacing: "-0.3px",
  fontSize: "21px",
  borderRadius: "4px",
  color: "#3c4149",
};

const hr = {
  borderColor: "#dfe1e4",
  margin: "42px 0 26px",
};

const footer = {
  fontSize: "14px",
  color: "#b4becc",
  margin: "0",
};
