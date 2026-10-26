import AuthPage from "@/components/account/AuthPage";
export const metadata = { title: "Welcome back.", robots: { index: false, follow: false } };
export default function Page() { return <AuthPage mode="login" title="Welcome back." description="Sign in with the User ID provided by your Dcorhome administrator."/>; }
