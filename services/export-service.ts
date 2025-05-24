export const exportToPDF = async (analysis: any, fileName: string) => {
  try {
    // Create a comprehensive PDF report
    const reportContent = generateReportHTML(analysis, fileName)

    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      throw new Error("Popup blocked. Please allow popups for this site.")
    }

    printWindow.document.write(reportContent)
    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  } catch (error) {
    console.error("Export error:", error)
    throw error
  }
}

export const shareResults = async (analysis: any, fileName: string) => {
  try {
    const shareData = {
      title: `Resume Analysis Report - ${fileName}`,
      text: `Check out my resume analysis results! Overall Score: ${analysis.overall_score}%`,
      url: window.location.href,
    }

    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      // Fallback: copy to clipboard
      const shareText = `Resume Analysis Report - ${fileName}\n\nOverall Score: ${analysis.overall_score}%\nSkills Found: ${analysis.skills.technical.length + analysis.skills.soft.length}\nExperience Level: ${analysis.experience_level}\n\nView full report at: ${window.location.href}`

      await navigator.clipboard.writeText(shareText)
      alert("Results copied to clipboard!")
    }
  } catch (error) {
    console.error("Share error:", error)
    throw error
  }
}

const generateReportHTML = (analysis: any, fileName: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Resume Analysis Report - ${fileName}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 40px; 
          line-height: 1.6; 
          color: #333;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
        }
        .score { 
          font-size: 48px; 
          font-weight: bold; 
          color: #3b82f6; 
          margin: 20px 0;
        }
        .section { 
          margin: 30px 0; 
          page-break-inside: avoid;
        }
        .section h2 { 
          color: #1f2937; 
          border-bottom: 1px solid #e5e7eb; 
          padding-bottom: 10px;
        }
        .skills { 
          display: flex; 
          flex-wrap: wrap; 
          gap: 8px; 
          margin: 15px 0;
        }
        .skill { 
          background: #eff6ff; 
          color: #1d4ed8; 
          padding: 4px 12px; 
          border-radius: 16px; 
          font-size: 14px;
        }
        .job { 
          border: 1px solid #e5e7eb; 
          padding: 20px; 
          margin: 15px 0; 
          border-radius: 8px;
        }
        .job-title { 
          font-size: 18px; 
          font-weight: bold; 
          color: #1f2937;
        }
        .match { 
          color: #059669; 
          font-weight: bold;
        }
        .suggestion { 
          background: #f9fafb; 
          padding: 15px; 
          margin: 10px 0; 
          border-left: 4px solid #3b82f6; 
          border-radius: 4px;
        }
        .priority-high { border-left-color: #dc2626; }
        .priority-medium { border-left-color: #d97706; }
        .priority-low { border-left-color: #059669; }
        .question { 
          background: #f3f4f6; 
          padding: 15px; 
          margin: 10px 0; 
          border-radius: 8px;
        }
        .footer { 
          margin-top: 40px; 
          text-align: center; 
          color: #6b7280; 
          font-size: 14px;
        }
        @media print {
          body { margin: 20px; }
          .header { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Resume Analysis Report</h1>
        <p><strong>File:</strong> ${fileName}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        <div class="score">${analysis.overall_score}%</div>
        <p>Overall Resume Score</p>
      </div>

      <div class="section">
        <h2>Skills Analysis</h2>
        <h3>Technical Skills</h3>
        <div class="skills">
          ${analysis.skills.technical.map((skill: string) => `<span class="skill">${skill}</span>`).join("")}
        </div>
        <h3>Soft Skills</h3>
        <div class="skills">
          ${analysis.skills.soft.map((skill: string) => `<span class="skill">${skill}</span>`).join("")}
        </div>
        <h3>Industry Skills</h3>
        <div class="skills">
          ${analysis.skills.industry.map((skill: string) => `<span class="skill">${skill}</span>`).join("")}
        </div>
      </div>

      <div class="section">
        <h2>Experience Level</h2>
        <p><strong>${analysis.experience_level.charAt(0).toUpperCase() + analysis.experience_level.slice(1)}</strong> level professional</p>
      </div>

      <div class="section">
        <h2>Job Recommendations</h2>
        ${analysis.job_recommendations
          .map(
            (job: any) => `
          <div class="job">
            <div class="job-title">${job.title}</div>
            <p><span class="match">${job.match_percentage}% match</span> • ${job.salary_range}</p>
            <p><strong>Required Skills:</strong> ${job.required_skills.join(", ")}</p>
          </div>
        `,
          )
          .join("")}
      </div>

      <div class="section">
        <h2>Improvement Suggestions</h2>
        ${analysis.improvement_suggestions
          .map(
            (suggestion: any) => `
          <div class="suggestion priority-${suggestion.priority}">
            <p><strong>${suggestion.category.charAt(0).toUpperCase() + suggestion.category.slice(1)} - ${suggestion.priority.toUpperCase()} Priority</strong></p>
            <p>${suggestion.suggestion}</p>
          </div>
        `,
          )
          .join("")}
      </div>

      <div class="section">
        <h2>Interview Questions</h2>
        ${analysis.interview_questions
          .map(
            (question: any) => `
          <div class="question">
            <p><strong>${question.category.charAt(0).toUpperCase() + question.category.slice(1)} • ${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}</strong></p>
            <p>${question.question}</p>
          </div>
        `,
          )
          .join("")}
      </div>

      <div class="footer">
        <p>Generated by AI Job Advisor • ${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>
  `
}
