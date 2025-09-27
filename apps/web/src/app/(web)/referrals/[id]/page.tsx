import { ReferralDetailClient } from "@/components/career/referral-detail-client"

export default async function ReferralDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return <ReferralDetailClient referralId={id} />
}