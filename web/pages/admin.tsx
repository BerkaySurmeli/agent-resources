import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/login');
  }, [router]);
  
  return null;
}
