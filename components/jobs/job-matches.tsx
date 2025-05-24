"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, MapPin, Building, DollarSign, Clock, Search, Filter } from "lucide-react"

const jobMatches = [
  {
    id: 1,
    title: "Senior Full Stack Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$120,000 - $150,000",
    match: 95,
    posted: "2 days ago",
    description: "Join our innovative team building next-generation web applications...",
    skills: ["React", "Node.js", "TypeScript", "AWS"],
    benefits: ["Health Insurance", "401k", "Remote Work", "Stock Options"],
    saved: false,
  },
  {
    id: 2,
    title: "Lead Software Engineer",
    company: "StartupXYZ",
    location: "New York, NY",
    type: "Full-time",
    salary: "$140,000 - $170,000",
    match: 88,
    posted: "1 week ago",
    description: "Lead a team of talented engineers in building scalable solutions...",
    skills: ["Python", "Django", "PostgreSQL", "Docker"],
    benefits: ["Health Insurance", "Unlimited PTO", "Learning Budget"],
    saved: true,
  },
  {
    id: 3,
    title: "Technical Architect",
    company: "Enterprise Solutions",
    location: "Austin, TX",
    type: "Full-time",
    salary: "$160,000 - $200,000",
    match: 82,
    posted: "3 days ago",
    description: "Design and implement enterprise-scale architecture solutions...",
    skills: ["System Design", "Microservices", "Kubernetes", "Java"],
    benefits: ["Health Insurance", "Bonus", "Flexible Hours"],
    saved: false,
  },
]

export function JobMatches() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("match")
  const [savedJobs, setSavedJobs] = useState<number[]>([2])

  const toggleSaveJob = (jobId: number) => {
    setSavedJobs((prev) => (prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]))
  }

  const getMatchColor = (match: number) => {
    if (match >= 90) return "bg-green-100 text-green-800"
    if (match >= 80) return "bg-blue-100 text-blue-800"
    if (match >= 70) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Best Match</SelectItem>
                <SelectItem value="salary">Highest Salary</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="company">Company Name</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Listings */}
      <div className="space-y-4">
        {jobMatches.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                    <Badge className={getMatchColor(job.match)}>{job.match}% match</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {job.company}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {job.salary}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {job.posted}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">{job.description}</p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, index) => (
                          <Badge key={index} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Benefits</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.benefits.map((benefit, index) => (
                          <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSaveJob(job.id)}
                    className={savedJobs.includes(job.id) ? "text-red-600" : "text-gray-400"}
                  >
                    <Heart className={`h-5 w-5 ${savedJobs.includes(job.id) ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button className="flex-1">Apply Now</Button>
                <Button variant="outline" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline">Company Profile</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" size="lg">
          Load More Jobs
        </Button>
      </div>
    </div>
  )
}
