import AuthPage from "@/components/account/AuthPage";
export const metadata = { title: "A fresh start.", robots: { index: false, follow: false } };
export default function Page() { return <AuthPage mode="forgot-password" title="A fresh start." description="Request a secure link to reset your password."/>; }
