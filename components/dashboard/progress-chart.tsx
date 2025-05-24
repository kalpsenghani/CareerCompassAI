import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ProgressChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Career Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Resume Optimization</span>
              <span>85%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: "85%" }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Skill Development</span>
              <span>72%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "72%" }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Interview Readiness</span>
              <span>68%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: "68%" }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Network Building</span>
              <span>45%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full" style={{ width: "45%" }}></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
