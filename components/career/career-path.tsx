"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Target, BookOpen, Award, Users, DollarSign, ChevronRight, CheckCircle, Clock } from "lucide-react"

const careerPaths = {
  "Software Engineer": {
    current: "Mid-Level Developer",
    next: "Senior Software Engineer",
    final: "Principal Engineer / Engineering Manager",
    timeline: "2-3 years",
    skills: ["System Design", "Leadership", "Mentoring", "Architecture"],
    certifications: ["AWS Solutions Architect", "Google Cloud Professional"],
    salary: "$120,000 - $180,000",
  },
  "Data Scientist": {
    current: "Data Analyst",
    next: "Senior Data Scientist",
    final: "Principal Data Scientist / Data Science Manager",
    timeline: "3-4 years",
    skills: ["Machine Learning", "Deep Learning", "MLOps", "Leadership"],
    certifications: ["AWS Machine Learning", "Google Cloud ML Engineer"],
    salary: "$130,000 - $200,000",
  },
  "Product Manager": {
    current: "Associate Product Manager",
    next: "Senior Product Manager",
    final: "Director of Product / VP Product",
    timeline: "4-5 years",
    skills: ["Strategy", "Analytics", "Leadership", "Market Research"],
    certifications: ["Product Management Certificate", "Agile Certification"],
    salary: "$140,000 - $220,000",
  },
}

const milestones = [
  {
    title: "Technical Skills Mastery",
    description: "Master advanced technical skills in your domain",
    progress: 75,
    status: "in-progress",
    timeframe: "6 months",
  },
  {
    title: "Leadership Experience",
    description: "Lead projects and mentor junior team members",
    progress: 45,
    status: "in-progress",
    timeframe: "1 year",
  },
  {
    title: "Industry Recognition",
    description: "Speak at conferences, contribute to open source",
    progress: 20,
    status: "planned",
    timeframe: "18 months",
  },
  {
    title: "Management Transition",
    description: "Transition to people management or technical leadership",
    progress: 0,
    status: "planned",
    timeframe: "2-3 years",
  },
]

const learningResources = [
  {
    title: "System Design Interview Course",
    type: "Course",
    provider: "Educative",
    duration: "40 hours",
    priority: "high",
  },
  {
    title: "AWS Solutions Architect Certification",
    type: "Certification",
    provider: "Amazon",
    duration: "3 months",
    priority: "high",
  },
  {
    title: "Engineering Management Book",
    type: "Book",
    provider: "O'Reilly",
    duration: "2 weeks",
    priority: "medium",
  },
  {
    title: "Leadership in Tech Podcast",
    type: "Podcast",
    provider: "Various",
    duration: "Ongoing",
    priority: "low",
  },
]

export function CareerPath() {
  const [selectedPath, setSelectedPath] = useState("Software Engineer")
  const currentPath = careerPaths[selectedPath as keyof typeof careerPaths]

  return (
    <div className="space-y-6">
      {/* Career Path Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Career Path Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Object.keys(careerPaths).map((path) => (
              <Button
                key={path}
                variant={selectedPath === path ? "default" : "outline"}
                onClick={() => setSelectedPath(path)}
                className="h-auto p-4 text-left justify-start"
              >
                <div>
                  <div className="font-medium">{path}</div>
                  <div className="text-sm text-gray-500">
                    {careerPaths[path as keyof typeof careerPaths].timeline} to next level
                  </div>
                </div>
              </Button>
            ))}
          </div>

          {/* Career Progression */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Your Career Progression</h3>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="font-medium text-sm">{currentPath.current}</div>
                <div className="text-xs text-gray-500">Current</div>
              </div>

              <ChevronRight className="h-6 w-6 text-gray-400" />

              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="font-medium text-sm">{currentPath.next}</div>
                <div className="text-xs text-gray-500">Next ({currentPath.timeline})</div>
              </div>

              <ChevronRight className="h-6 w-6 text-gray-400" />

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-2">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="font-medium text-sm">{currentPath.final}</div>
                <div className="text-xs text-gray-500">Long-term</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills & Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Required Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Skills to Develop</h4>
                <div className="flex flex-wrap gap-2">
                  {currentPath.skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Recommended Certifications</h4>
                <div className="flex flex-wrap gap-2">
                  {currentPath.certifications.map((cert, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-lg font-semibold text-green-600">
                  <DollarSign className="h-5 w-5" />
                  {currentPath.salary}
                </div>
                <p className="text-sm text-gray-500">Expected salary range for next role</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Career Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{milestone.title}</h4>
                    <span className="text-xs text-gray-500">{milestone.timeframe}</span>
                  </div>
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                  <div className="flex items-center gap-2">
                    <Progress value={milestone.progress} className="flex-1 h-2" />
                    <span className="text-xs text-gray-500">{milestone.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            Recommended Learning Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learningResources.map((resource, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{resource.title}</h4>
                  <Badge
                    className={
                      resource.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : resource.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }
                  >
                    {resource.priority}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Type:</strong> {resource.type}
                  </p>
                  <p>
                    <strong>Provider:</strong> {resource.provider}
                  </p>
                  <p>
                    <strong>Duration:</strong> {resource.duration}
                  </p>
                </div>
                <Button size="sm" className="mt-3 w-full">
                  Start Learning
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            30-Day Action Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Week 1-2</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Complete skills assessment</li>
                <li>• Start AWS certification prep</li>
                <li>• Join tech communities</li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Week 3-4</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Begin system design course</li>
                <li>• Network with senior engineers</li>
                <li>• Update LinkedIn profile</li>
              </ul>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">Week 5+</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Schedule informational interviews</li>
                <li>• Start mentoring junior developers</li>
                <li>• Apply for senior positions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
