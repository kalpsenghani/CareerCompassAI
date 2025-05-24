"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { aiAnalysisService } from "@/services/ai-analysis"

export function AITest() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>("")

  const testAI = async () => {
    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const sampleResume = `
        Sarah Johnson
        Senior Full Stack Developer
        
        EXPERIENCE:
        Senior Full Stack Developer | InnovateTech Solutions | 2019 - Present
        • Led development of 3 major web applications serving 100K+ users
        • Architected and implemented microservices using React, Node.js, and AWS
        • Managed a team of 4 junior developers and conducted technical interviews
        • Improved application performance by 60% through optimization and caching
        • Implemented CI/CD pipelines reducing deployment time by 80%
        
        Full Stack Developer | WebCorp | 2017 - 2019
        • Developed responsive web applications using React, Redux, and Express.js
        • Built RESTful APIs and integrated with third-party payment systems
        • Collaborated with UX/UI designers to implement pixel-perfect designs
        • Participated in Agile development process and sprint planning
        
        Junior Developer | StartupHub | 2015 - 2017
        • Developed frontend components using HTML, CSS, JavaScript, and jQuery
        • Assisted in backend development using Python and Django
        • Participated in code reviews and learned best practices
        
        SKILLS:
        Programming: JavaScript, TypeScript, Python, Java, HTML5, CSS3
        Frontend: React, Redux, Vue.js, Angular, Sass, Bootstrap, Tailwind CSS
        Backend: Node.js, Express.js, Django, Flask, Spring Boot
        Databases: PostgreSQL, MongoDB, MySQL, Redis
        Cloud: AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes
        Tools: Git, GitHub, Jenkins, JIRA, Figma, VS Code
        
        EDUCATION:
        Bachelor of Science in Computer Science
        Tech University | 2011 - 2015
        
        CERTIFICATIONS:
        • AWS Certified Solutions Architect - Associate
        • Certified Scrum Master (CSM)
        • Google Cloud Professional Developer
      `

      const analysis = await aiAnalysisService.analyzeResume(sampleResume)
      setResult(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>AI Service Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testAI} disabled={isLoading} className="w-full">
            {isLoading ? "Analyzing Resume..." : "Test AI Analysis"}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Analysis Results
                <Badge className="bg-green-600 text-white">Score: {result.overall_score}%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Skills Section */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Skills Analysis</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Technical Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.skills.technical.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Soft Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.skills.soft.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Industry Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.skills.industry.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Experience Level</h3>
                <Badge className="bg-blue-600 text-white capitalize text-lg px-4 py-2">{result.experience_level}</Badge>
              </div>

              {/* Job Recommendations */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Job Recommendations</h3>
                <div className="space-y-3">
                  {result.job_recommendations.map((job: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{job.title}</h4>
                        <Badge className="bg-green-100 text-green-800">{job.match_percentage}% match</Badge>
                      </div>
                      <p className="text-green-600 font-medium mb-2">{job.salary_range}</p>
                      <div className="flex flex-wrap gap-1">
                        {job.required_skills.map((skill: string, skillIndex: number) => (
                          <Badge key={skillIndex} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvement Suggestions */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Improvement Suggestions</h3>
                <div className="space-y-3">
                  {result.improvement_suggestions.map((suggestion: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex gap-2 mb-2">
                        <Badge
                          className={
                            suggestion.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : suggestion.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          }
                        >
                          {suggestion.priority}
                        </Badge>
                        <Badge variant="outline">{suggestion.category}</Badge>
                      </div>
                      <p className="text-gray-700">{suggestion.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interview Questions */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Interview Questions</h3>
                <div className="space-y-3">
                  {result.interview_questions.map((question: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex gap-2 mb-2">
                        <Badge variant="outline">{question.category}</Badge>
                        <Badge
                          className={
                            question.difficulty === "hard"
                              ? "bg-red-100 text-red-800"
                              : question.difficulty === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          }
                        >
                          {question.difficulty}
                        </Badge>
                      </div>
                      <p className="text-gray-700 font-medium">{question.question}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
