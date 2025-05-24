import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface ResumeUpload {
  id: string
  user_id: string
  file_name: string
  file_url: string
  file_size: number
  upload_date: string
  analysis_status: "pending" | "processing" | "completed" | "failed"
}

export interface AnalysisResult {
  id: string
  upload_id: string
  extracted_text: string
  skills_analysis: any
  job_recommendations: any
  improvement_suggestions: any
  interview_questions: any
  created_at: string
}

// Auth helpers
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// File upload helpers
export const uploadResume = async (file: File, userId: string) => {
  const fileExt = file.name.split(".").pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage.from("resumes").upload(fileName, file)

  if (error) throw error

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("resumes").getPublicUrl(fileName)

  // Save to database
  const { data: uploadRecord, error: dbError } = await supabase
    .from("resume_uploads")
    .insert({
      user_id: userId,
      file_name: file.name,
      file_url: publicUrl,
      file_size: file.size,
      analysis_status: "pending",
    })
    .select()
    .single()

  if (dbError) throw dbError

  return uploadRecord
}

// Analysis helpers
export const saveAnalysisResult = async (uploadId: string, analysis: any) => {
  const { data, error } = await supabase
    .from("analysis_results")
    .insert({
      upload_id: uploadId,
      extracted_text: analysis.extracted_text,
      skills_analysis: analysis.skills,
      job_recommendations: analysis.job_recommendations,
      improvement_suggestions: analysis.improvement_suggestions,
      interview_questions: analysis.interview_questions,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const getUserUploads = async (userId: string) => {
  const { data, error } = await supabase
    .from("resume_uploads")
    .select(`
      *,
      analysis_results (*)
    `)
    .eq("user_id", userId)
    .order("upload_date", { ascending: false })

  if (error) throw error
  return data
}
