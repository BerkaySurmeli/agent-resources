import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Account() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings?tab=account');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
