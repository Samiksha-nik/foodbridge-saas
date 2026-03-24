// Re-export base44 so pages that import from @/api/base44Client load correctly.
// Install @base44/sdk and use createClient here when you have appId/token configured.
export { base44 } from '@/lib/app-params';
