import AuthPage from "@/components/account/AuthPage";
export const metadata = { title: "Make yourself at home.", robots: { index: false, follow: false } };
export default function Page() { return <AuthPage mode="signup" title="Make yourself at home." description="Create an account to keep your details and future enquiries together."/>; }
