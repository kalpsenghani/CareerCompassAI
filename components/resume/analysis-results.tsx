"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  Target,
  MessageSquare,
  TrendingUp,
  Download,
  Share,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react"

// Mock data - replace with real data from your API
const mockAnalysis = {
  overall_score: 85,
  skills: {
    technical: ["JavaScript", "React", "Node.js", "Python", "SQL", "AWS"],
    soft: ["Leadership", "Communication", "Problem Solving", "Team Collaboration"],
    industry: ["Software Development", "Agile Methodologies", "DevOps", "API Design"],
  },
  experience_level: "senior",
  job_recommendations: [
    {
      title: "Senior Full Stack Developer",
      match_percentage: 92,
      required_skills: ["JavaScript", "React", "Node.js", "AWS"],
      salary_range: "$120,000 - $150,000",
      company_type: "Tech Startup",
    },
    {
      title: "Lead Software Engineer",
      match_percentage: 88,
      required_skills: ["Python", "Leadership", "System Design"],
      salary_range: "$140,000 - $170,000",
      company_type: "Enterprise",
    },
    {
      title: "Technical Architect",
      match_percentage: 82,
      required_skills: ["System Design", "AWS", "Leadership"],
      salary_range: "$160,000 - $200,000",
      company_type: "Consulting",
    },
  ],
  improvement_suggestions: [
    {
      category: "skills",
      suggestion: "Add cloud certifications (AWS Solutions Architect) to strengthen your profile",
      priority: "high",
    },
    {
      category: "experience",
      suggestion: "Include more quantifiable achievements with specific metrics and impact",
      priority: "high",
    },
    {
      category: "format",
      suggestion: "Optimize resume for ATS by using standard section headers",
      priority: "medium",
    },
    {
      category: "skills",
      suggestion: "Consider adding Docker and Kubernetes experience for DevOps roles",
      priority: "medium",
    },
    {
      category: "experience",
      suggestion: "Highlight leadership experience and team management skills",
      priority: "low",
    },
  ],
  interview_questions: [
    {
      question: "Describe your experience with React hooks and when you would use them.",
      category: "technical",
      difficulty: "medium",
    },
    {
      question: "How do you handle conflicts within your development team?",
      category: "behavioral",
      difficulty: "medium",
    },
    {
      question: "Design a scalable system for handling millions of user requests.",
      category: "technical",
      difficulty: "hard",
    },
    {
      question: "Tell me about a time when you had to learn a new technology quickly.",
      category: "behavioral",
      difficulty: "easy",
    },
    {
      question: "How would you approach debugging a performance issue in a React application?",
      category: "technical",
      difficulty: "medium",
    },
  ],
}

export function AnalysisResults() {
  const [activeTab, setActiveTab] = useState("overview")

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Score */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Resume Analysis Complete</h2>
              <p className="text-blue-100">Your comprehensive career assessment is ready</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{mockAnalysis.overall_score}%</div>
              <div className="text-blue-100">Overall Score</div>
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
              <Share className="mr-2 h-4 w-4" />
              Share Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Job Matches
          </TabsTrigger>
          <TabsTrigger value="improvements" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Improvements
          </TabsTrigger>
          <TabsTrigger value="interview" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Interview Prep
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Technical Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {mockAnalysis.skills.technical.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Soft Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {mockAnalysis.skills.soft.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Industry Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {mockAnalysis.skills.industry.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Experience Level & Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Experience Level</span>
                    <Badge className="bg-blue-600 text-white capitalize">{mockAnalysis.experience_level}</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Technical Skills</span>
                      <span>90%</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Experience Depth</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Resume Format</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>ATS Compatibility</span>
                      <span>80%</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Job Matches Tab */}
        <TabsContent value="jobs" className="space-y-6">
          <div className="grid gap-6">
            {mockAnalysis.job_recommendations.map((job, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <p className="text-gray-600">{job.company_type}</p>
                      <p className="text-lg font-medium text-green-600 mt-1">{job.salary_range}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{job.match_percentage}%</div>
                      <div className="text-sm text-gray-500">Match</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">View Details</Button>
                    <Button size="sm" variant="outline">
                      Save Job
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Improvements Tab */}
        <TabsContent value="improvements" className="space-y-6">
          <div className="space-y-4">
            {mockAnalysis.improvement_suggestions.map((suggestion, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {suggestion.priority === "high" ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : suggestion.priority === "medium" ? (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPriorityColor(suggestion.priority)}>{suggestion.priority} priority</Badge>
                        <Badge variant="outline" className="capitalize">
                          {suggestion.category}
                        </Badge>
                      </div>
                      <p className="text-gray-900">{suggestion.suggestion}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Interview Prep Tab */}
        <TabsContent value="interview" className="space-y-6">
          <div className="space-y-4">
            {mockAnalysis.interview_questions.map((question, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="capitalize">
                        {question.category}
                      </Badge>
                      <Badge className={getDifficultyColor(question.difficulty)}>{question.difficulty}</Badge>
                    </div>
                    <Button size="sm" variant="outline">
                      Practice
                    </Button>
                  </div>
                  <p className="text-gray-900 font-medium">{question.question}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
