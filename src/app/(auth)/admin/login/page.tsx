import LoginForm from '@/components/admin/LoginForm';
import '../../../admin/admin.css';

// The fail-closed stub check lives in middleware.ts, which reads DATA_SOURCE
// at runtime. A check here would be inlined at build time and so would report
// whatever the build environment had, not the deployment's.

export const metadata = {
  title: 'Sign in — MVB Admin',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginForm next={next} />;
}
