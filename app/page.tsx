import { DashboardLayout } from "@/components/layout"
import { AuthWrapper } from "@/components/features/auth"
// import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  // Skip fetching templates for now - testing API calls
  // const supabase = await createClient()
  // 
  // try {
  //   const { data: templates, error } = await supabase
  //     .from('templates')
  //     .select('*')
  //   
  //   if (error) {
  //     console.error('Error fetching templates:', error)
  //   } 
  // } catch (err) {
  //   console.error('Failed to fetch templates:', err)
  // }

  return (
    <AuthWrapper>
      <DashboardLayout />
    </AuthWrapper>
  )
}
