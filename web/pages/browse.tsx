import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function BrowseRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/listings');
  }, [router]);
  
  return null;
}
