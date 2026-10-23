import AuthPage from "@/components/account/AuthPage";
export const metadata = { title: "Your new password.", robots: { index: false, follow: false } };
export default function Page() { return <AuthPage mode="reset-password" title="Your new password." description="Choose a new password for your Dcorhome account."/>; }
