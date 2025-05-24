"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Brain, Clock, CheckCircle, Play, Pause, RotateCcw, Mic, MicOff, Star } from "lucide-react"

const questionCategories = [
  { id: "technical", name: "Technical", icon: Brain, color: "bg-blue-500" },
  { id: "behavioral", name: "Behavioral", icon: MessageSquare, color: "bg-green-500" },
  { id: "situational", name: "Situational", icon: Clock, color: "bg-purple-500" },
]

const sampleQuestions = {
  technical: [
    {
      question: "Explain the difference between REST and GraphQL APIs.",
      difficulty: "medium",
      tips: "Focus on data fetching, flexibility, and use cases",
      timeLimit: 300,
    },
    {
      question: "How would you optimize a slow database query?",
      difficulty: "hard",
      tips: "Discuss indexing, query optimization, and monitoring",
      timeLimit: 420,
    },
    {
      question: "What is the difference between var, let, and const in JavaScript?",
      difficulty: "easy",
      tips: "Cover scope, hoisting, and mutability",
      timeLimit: 180,
    },
  ],
  behavioral: [
    {
      question: "Tell me about a time when you had to work with a difficult team member.",
      difficulty: "medium",
      tips: "Use the STAR method (Situation, Task, Action, Result)",
      timeLimit: 300,
    },
    {
      question: "Describe a project where you had to learn a new technology quickly.",
      difficulty: "easy",
      tips: "Highlight your learning process and adaptability",
      timeLimit: 240,
    },
    {
      question: "How do you handle competing priorities and tight deadlines?",
      difficulty: "medium",
      tips: "Discuss time management and communication strategies",
      timeLimit: 300,
    },
  ],
  situational: [
    {
      question: "How would you handle a production outage affecting thousands of users?",
      difficulty: "hard",
      tips: "Focus on incident response, communication, and post-mortem",
      timeLimit: 360,
    },
    {
      question: "What would you do if you disagreed with your manager's technical decision?",
      difficulty: "medium",
      tips: "Emphasize respectful communication and data-driven arguments",
      timeLimit: 300,
    },
    {
      question: "How would you onboard a new team member to your project?",
      difficulty: "easy",
      tips: "Discuss documentation, mentoring, and gradual responsibility increase",
      timeLimit: 240,
    },
  ],
}

export function InterviewPrep() {
  const [selectedCategory, setSelectedCategory] = useState("technical")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [userAnswer, setUserAnswer] = useState("")
  const [completedQuestions, setCompletedQuestions] = useState<number[]>([])

  const questions = sampleQuestions[selectedCategory as keyof typeof sampleQuestions]
  const question = questions[currentQuestion]

  const startTimer = () => {
    setTimeLeft(question.timeLimit)
    setIsTimerActive(true)

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsTimerActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopTimer = () => {
    setIsTimerActive(false)
  }

  const resetTimer = () => {
    setTimeLeft(question.timeLimit)
    setIsTimerActive(false)
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setUserAnswer("")
      resetTimer()
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setUserAnswer("")
      resetTimer()
    }
  }

  const markCompleted = () => {
    if (!completedQuestions.includes(currentQuestion)) {
      setCompletedQuestions([...completedQuestions, currentQuestion])
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
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
      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {questionCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => {
                  setSelectedCategory(category.id)
                  setCurrentQuestion(0)
                  setUserAnswer("")
                  resetTimer()
                }}
                className="h-20 flex flex-col items-center gap-2"
              >
                <category.icon className="h-6 w-6" />
                <span>{category.name}</span>
                <span className="text-xs">
                  {sampleQuestions[category.id as keyof typeof sampleQuestions].length} questions
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Question Practice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Question {currentQuestion + 1} of {questions.length}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(question.difficulty)}>{question.difficulty}</Badge>
                  {completedQuestions.includes(currentQuestion) && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-medium text-lg mb-2">{question.question}</h3>
                <p className="text-sm text-blue-700">
                  <strong>Tip:</strong> {question.tips}
                </p>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-mono font-bold">{formatTime(timeLeft || question.timeLimit)}</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={isTimerActive ? stopTimer : startTimer}
                    className="flex items-center gap-2"
                  >
                    {isTimerActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isTimerActive ? "Pause" : "Start"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={resetTimer}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Answer Input */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Your Answer</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsRecording(!isRecording)}
                    className="flex items-center gap-2"
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isRecording ? "Stop Recording" : "Voice Answer"}
                  </Button>
                </div>
                <Textarea
                  placeholder="Type your answer here or use voice recording..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" onClick={prevQuestion} disabled={currentQuestion === 0}>
                  Previous
                </Button>
                <div className="flex gap-2">
                  <Button onClick={markCompleted} variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                  <Button onClick={nextQuestion} disabled={currentQuestion === questions.length - 1}>
                    Next Question
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {completedQuestions.length}/{questions.length}
                  </div>
                  <div className="text-sm text-gray-500">Questions Completed</div>
                </div>

                <div className="space-y-2">
                  {questions.map((q, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        index === currentQuestion
                          ? "bg-blue-100 border border-blue-300"
                          : completedQuestions.includes(index)
                            ? "bg-green-50"
                            : "bg-gray-50 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setCurrentQuestion(index)
                        setUserAnswer("")
                        resetTimer()
                      }}
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium">
                        {completedQuestions.includes(index) ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">Question {index + 1}</div>
                        <Badge size="sm" className={getDifficultyColor(q.difficulty)}>
                          {q.difficulty}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interview Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Technical Questions</h4>
                  <p className="text-blue-700">Think out loud, explain your reasoning, and consider edge cases.</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">Behavioral Questions</h4>
                  <p className="text-green-700">Use the STAR method: Situation, Task, Action, Result.</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900">Situational Questions</h4>
                  <p className="text-purple-700">Focus on problem-solving process and communication.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
